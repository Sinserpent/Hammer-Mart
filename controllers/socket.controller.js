
import { Bid, Auction } from '../models/auction.model.js';
import userModel from '../models/user.model.js';

export const placeBid = async (io, socket, data) => {
  const { auctionId, bidAmount, userId } = data;

  try {
    console.log('Placing bid:', { auctionId, bidAmount, userId });

    // Validate userId is provided
    if (!userId) {
      return socket.emit('bid_error', { message: 'User ID is required' });
    }

    // Verify user exists and is a buyer
    const user = await userModel.findById(userId);
    if (!user) {
      return socket.emit('bid_error', { message: 'User not found' });
    }


    // Find the auction
    const auction = await Auction.findById(auctionId);
    if (!auction) {
      return socket.emit('bid_error', { message: 'Auction not found' });
    }

    // Check if auction is still active
    const now = new Date();
    const auctionEndTime = new Date(auction.endTime);
    
    if (auction.status === 'ended' || now > auctionEndTime) {
      return socket.emit('bid_error', { message: 'Auction has ended' });
    }

    if (auction.status !== 'active' && auction.status !== 'scheduled') {
      return socket.emit('bid_error', { message: 'Auction is not active' });
    }

    // Validate bid amount
    const currentHighestBid = auction.highestBid || auction.startingPrice || 0;
    
    if (bidAmount <= currentHighestBid) {
      return socket.emit('bid_error', { 
        message: `Bid must be higher than current bid of ${currentHighestBid.toLocaleString()}` 
      });
    }

    if (bidAmount < auction.startingPrice) {
      return socket.emit('bid_error', { 
        message: `Minimum bid amount is ${auction.startingPrice.toLocaleString()}` 
      });
    }

    // Create new bid
    const newBid = await Bid.create({ 
      auctionId, 
      userId: userId, // Using userId as buyerId
      amount: bidAmount,
      timestamp: new Date()
    });

    // Update auction
    auction.highestBid = bidAmount;
    auction.highestBidId = newBid._id;
    auction.currentBid = bidAmount;
    
    // Add to topBids array (keep last 10)
    auction.topBids = [...(auction.topBids || []), newBid._id].slice(-10);
    
    // If auction was scheduled, make it active
    if (auction.status === 'scheduled') {
      auction.status = 'active';
    }
    
    await auction.save();

    console.log('Bid placed successfully:', { auctionId, bidAmount, userId });

    // Emit success to the bidder
    socket.emit('bid_success', {
      auctionId,
      bidAmount,
      userId,
      message: 'Bid placed successfully!'
    });

    // Emit bid update to all users in the auction room
    io.to(auctionId).emit('bid_update', {
      auctionId,
      bidAmount,
      bidder: user.fullName, // Include bidder name for display
      timestamp: new Date().toISOString(),
      message: 'New bid placed!'
    });

  } catch (err) {
    console.error('Bid error:', err);
    socket.emit('bid_error', { 
      message: 'Failed to place bid. Please try again.' 
    });
  }
};