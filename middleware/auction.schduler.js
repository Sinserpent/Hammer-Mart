// auction.scheduler.js
import Agenda from 'agenda';
import { Auction, Bid } from '../models/auction.model.js';
import User from '../models/bidder.model.js';
import NotificationService from '../controllers/Email.controller.js';

let ioInstance;

export function initAuctionScheduler(io, mongoUrl) {
  ioInstance = io;
  const agenda = new Agenda({ db: { address: mongoUrl, collection: 'agendaJobs' } });

  // Define the auction end job
  agenda.define('end auction', async job => {
    const { auctionId } = job.attrs.data;
    const auction = await Auction.findById(auctionId);
    if (!auction || auction.status === 'ended') return;

    auction.status = 'ended';
    await auction.save();

    // Get the winner (highest bidder)
    let winner = null;
    if (auction.highestBidId) {
      const winningBid = await Bid.findById(auction.highestBidId).populate('bidderId', 'email name');
      if (winningBid) {
        winner = {
          _id: winningBid.bidderId._id,
          email: winningBid.bidderId.email,
          name: winningBid.bidderId.name,
          bidAmount: winningBid.amount
        };
      }
    }

    // Send auction win notifications
    if (winner) {
      await NotificationService.handleAuctionWin(
        {
          auctionId: auction._id,
          auctionTitle: auction.title,
          finalAmount: auction.highestBid,
          productDetails: { name: auction.title }
        },
        winner
      );
    }

    io.emit('auctionEnded', { auctionId: auction._id, winner });
    console.log(`Auction ${auction._id} ended automatically${winner ? ` - Winner: ${winner.email}` : ' - No bids'}`);
  });

  // Schedule all active auctions
  (async function () {
    await agenda.start();
    const activeAuctions = await Auction.find({ status: 'active' });
    activeAuctions.forEach(a => agenda.schedule(a.endTime, 'end auction', { auctionId: a._id }));
  })();

  return agenda;
}

// Optional helper to schedule a new auction dynamically
export async function scheduleNewAuction(auction) {
  if (!ioInstance) throw new Error('Scheduler not initialized with io');
  const agenda = new Agenda({ db: { address: process.env.MONGO_URI, collection: 'agendaJobs' } });
  await agenda.start();
  await agenda.schedule(auction.endTime, 'end auction', { auctionId: auction._id });
}