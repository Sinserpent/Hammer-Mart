// --- SINGLETON AGENDA SETUP ---

import Agenda from "agenda";
import { Auction, Bid } from "../models/auction.model.js";
import userModel from "../models/user.model.js";
import NotificationService from "../controllers/Email.controller.js";

let ioInstance;
let agendaInstance; // single shared Agenda instance


export function initAuctionScheduler(io, mongoUrl) {
  if (!mongoUrl) throw new Error("Mongo URL is required for Agenda");
  ioInstance = io;

  if (!agendaInstance) {
    agendaInstance = new Agenda({
      db: { address: mongoUrl, collection: "agendaJobs" },
    });

    // --- AUCTION END JOB ---
    agendaInstance.define("end auction", async (job) => {
      const { auctionId } = job.attrs.data;
      const auction = await Auction.findById(auctionId);
      if (!auction || auction.status === "ended") return;

      auction.status = "ended";
      await auction.save();

      let winner = null;
      console.log(auction.highestBidId);
      
      if (auction.highestBidId) {
        const winningBid = await Bid.findById(auction.highestBidId).populate({
          path: "userId",
          model: userModel,
          select: "email fullName role businessEmail businessName",
        });
        console.log("WinningBid", winningBid);
        console.log("UserId inside bid", winningBid?.userId);
        console.log("Role", winningBid?.userId?.role);

        if (
          winningBid &&
          winningBid.userId &&
          ["buyer", "seller"].includes(winningBid.userId.role)
        ) {
          winner = {
            _id: winningBid.userId._id,
            email:
              winningBid.userId.email || 
              winningBid.userId.businessEmail,
            fullName:
              winningBid.userId.fullName || 
              winningBid.userId.businessName,
            bidAmount: winningBid.amount,
          };
          console.log("Winner Details",winner);
          
          auction.winnerId = winner._id;
          await auction.save();

          await NotificationService.sendNotification(
            "auction_won",
            "buyer",
            winner.email,
            {
              auctionId: auction._id,
              auctionName: auction.title,
              winningBid: winner.bidAmount,
              winner: { buyerName: winner.fullName },
              redirectUrl: `${process.env.CLIENT_URL}/auction-winner?auctionId=${auction._id}`
            },
            null,
            auction._id
          );

          await NotificationService.sendNotification(
            "auction_won",
            "admin",
            process.env.SMTP_USER,
            {
              auctionId: auction._id,
              auctionName: auction.title,
              winningBid: winner.bidAmount,
              winner: { buyerName: winner.fullName },
            },
            null,
            auction._id
          );
        }
      }

      io.emit("auctionEnded", {
        auctionId: auction._id,
        title: auction.title,
        winner,
      });
      console.log(
        `Auction ${auction._id} ended automatically${
          winner? ` - Winner: ${winner.email}` : " - No bids"
        }`
      );
    });

    // --- AUCTION START JOB ---
    agendaInstance.define("start auction", async (job) => {
      const { auctionId } = job.attrs.data;
      const auction = await Auction.findById(auctionId);
      if (!auction || auction.status !== "scheduled") return;

      auction.status = "active";
      await auction.save();

      agendaInstance.schedule(auction.endTime, "end auction", {
        auctionId: auction._id,
      });

      io.emit("auctionStarted", {
        auctionId: auction._id,
        title: auction.title,
      });
      console.log(`Auction ${auction._id} started automatically`);
    });


    (async function () {
      await agendaInstance.start();
      console.log('Auction Scheduler initialized and started with Agenda');
      const now = new Date();

      // Schedule all scheduled auctions at startup
      const scheduledAuctions = await Auction.find({ status: "scheduled" });
      scheduledAuctions.forEach((a) =>
        agendaInstance.schedule(a.startTime, "start auction", { auctionId: a._id })
      );

      // Schedule all active auctions at startup
      const activeAuctions = await Auction.find({ status: "active" });
      activeAuctions.forEach((a) =>
        agendaInstance.schedule(a.endTime, "end auction", { auctionId: a._id })
      );
    })();
  }
}


export async function rescheduleAuction(auctionId, startTime, endTime) {
  if (!agendaInstance) throw new Error("Agenda not initialized");

  // cancel all jobs for this auction first
  await agendaInstance.cancel({ "data.auctionId": auctionId });

  // now recreate fresh jobs
  if (startTime) {
    await agendaInstance.schedule(startTime, "start auction", { auctionId });
    console.log(`Created new start job for auction ${auctionId} at ${startTime}`);
  }

  if (endTime) {
    await agendaInstance.schedule(endTime, "end auction", { auctionId });
    console.log(`Created new end job for auction ${auctionId} at ${endTime}`);
  }
}


export async function scheduleNewAuction(auction) {
  if (!agendaInstance) throw new Error("Agenda not initialized");
  await agendaInstance.schedule(auction.endTime, "end auction", {
    auctionId: auction._id,
  });
}


