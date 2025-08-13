import { Auction, Bid } from '../models/auction.model.js';
import User from '../models/bidder.model.js';




export async function joinAuction(socket, roomId) {
    await rebuildAuctionFromDB(roomId);
  try {
    const auction = await Auction.findById(roomId);
    if (!auction) {
      socket.emit('error', { message: 'Auction not found' });
      return;
    }

    if (Date.now() >= new Date(auction.endTime).getTime()) {
      if (auction.status !== 'ended') {
        auction.status = 'ended';
        await auction.save();
      }
      socket.emit('auctionEnded', { auctionId: roomId });
      return;
    }

    socket.join(roomId);
    socket.to(roomId).emit('userJoined', { userId: socket.id });
    socket.emit('joined', { auctionId: roomId });

    console.log(`User ${socket.id} joined auction ${roomId}`);
  } catch (err) {
    console.error(err);
    socket.emit('error', { message: 'Invalid auction ID' });
  }
}





export async function placeBid(io, socket, { roomId, name, email, amount }) {
    
await rebuildAuctionFromDB(roomId);

  try {
    if (typeof amount !== 'number' || amount <= 0) {
      socket.emit('error', { message: 'Invalid bid amount' });
      return;
    }

    const auction = await Auction.findById(roomId);
    if (!auction) {
      socket.emit('error', { message: 'Auction not found' });
      return;
    }

    if (Date.now() >= new Date(auction.endTime).getTime()) {
      if (auction.status !== 'ended') {
        auction.status = 'ended';
        await auction.save();
        io.to(roomId).emit('auctionEnded', { auctionId: roomId });
      }
      socket.emit('error', { message: 'Auction has ended' });
      return;
    }

    let bidder = await User.findOne({ email });
    if (!bidder) {
      socket.emit('error', { message: 'Please Create An Account To Bid' });
      return;
    }
    

    if (amount <= (auction.highestBid || 0)) {
      socket.emit('error', { message: 'Bid must be higher than current highest bid' });
      return;
    }

    if (amount < (auction.price || 0)) {
      await rebuildAuctionFromDB(roomId);
      socket.emit('error', { message: 'Bid Must Be Higher than Price' });
      return;
    }

    const newBid = await Bid.create({
      auctionId: auction._id,
      bidderId: bidder._id,
      amount
    });

    auction.highestBid = amount;
    auction.highestBidId = newBid._id;
    auction.topBids.push(newBid._id);
    if (auction.topBids.length > 10) auction.topBids = auction.topBids.slice(-10);
    await auction.save();

    io.to(roomId).emit('newBid', {
      bidId: newBid._id,
      bidder: { id: bidder._id, name: bidder.name, email: bidder.email },
      amount,
      createdAt: newBid.createdAt
    });

    console.log(`Bid placed in auction ${roomId} by ${bidder.email}: ${amount}`);
  } catch (err) {
    console.error(err);
    socket.emit('error', { message: 'Error placing bid' });
  }
}




export async function rebuildAuctionFromDB(auctionId) {
  const bids = await Bid.find({ auctionId }).sort({ amount: -1, createdAt: -1 }).limit(10).lean();
  if (!bids.length) {
    // No bids? Reset auction values
    await Auction.findByIdAndUpdate(auctionId, {
      $set: { highestBid: 0, highestBidId: null, topBids: [] }
    });
    return;
  }

  const topBidIds = bids.map(bid => bid._id);
  const highestBid = bids[0].amount;
  const highestBidId = bids[0]._id;

  await Auction.findByIdAndUpdate(auctionId, {
    $set: {
      highestBid,
      highestBidId,
      topBids: topBidIds
    }
  });
}
