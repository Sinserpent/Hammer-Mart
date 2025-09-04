// socket.controller.js
import { Auction, Bid, AuctionWin } from '../models/auction.model.js';
import User from '../models/bidder.model.js';
import NotificationService from '../controllers/Email.controller.js';

export async function placeBid(io, socket, { auctionId, email, amount }) {
  try {
    if (typeof amount !== 'number' || amount <= 0) {
      return socket.emit('error', { message: 'Invalid bid amount' });
    }

    const auction = await Auction.findById(auctionId);
    if (!auction) return socket.emit('error', { message: 'Auction not found' });

    const now = Date.now();
    if (now >= auction.endTime.getTime()) {
      if (auction.status !== 'ended') {
        auction.status = 'ended';
        await auction.save();
        io.emit('auctionEnded', { auctionId });
      }
      return socket.emit('error', { message: 'Auction has ended' });
    }

    const bidder = await User.findOne({ email });
    if (!bidder) return socket.emit('error', { message: 'Please create an account to bid' });

    const minBid = (auction.highestBid || 0) + (auction.minIncrement || 0);
    if (amount <= minBid || amount < (auction.price || 0)) {
      return socket.emit('error', { message: `Bid must be higher than ${minBid} and starting price ${auction.price || 0}` });
    }

    const newBid = await Bid.create({ auctionId, bidderId: bidder._id, amount });

    // Update auction with new bid and status
    auction.highestBid = amount;
    auction.highestBidId = newBid._id;
    auction.topBids = [...auction.topBids, newBid._id].slice(-10);
    
    // Update auction status based on activity
    if (auction.status === 'pending') {
      auction.status = 'active';
    }
    
    // Save auction updates
    await auction.save();

    // Get top 5 bidders for email notifications
    const topBidders = await Bid.find({ auctionId })
      .sort({ amount: -1 })
      .limit(5)
      .populate('bidderId', 'email name')
      .lean();

    // Emit to socket (your existing code)
    io.emit('newBid', {
      auctionId,
      bidId: newBid._id,
      bidder: { id: bidder._id, name: bidder.name },
      amount,
      createdAt: newBid.createdAt
    });

    // Trigger email notifications directly
    await NotificationService.handleAuctionBid(
      {
        auctionId: auction._id,
        auctionTitle: auction.title,
        currentHighestBid: auction.highestBid,
        endTime: auction.endTime,
        productDetails: { name: auction.title }
      },
      {
        bidderId: bidder._id,
        bidAmount: amount,
        bidTime: newBid.createdAt
      },
      topBidders.map(bid => ({
        bidderId: bid.bidderId._id,
        email: bid.bidderId.email,
        bidAmount: bid.amount
      }))
    );

    console.log(`Bid placed in auction ${auctionId} by ${bidder.email}: ${amount}`);
  } catch (err) {
    console.error(err);
    socket.emit('error', { message: 'Error placing bid' });
  }
}