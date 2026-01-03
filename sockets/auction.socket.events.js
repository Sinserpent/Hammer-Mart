
import { placeBid } from "../controllers/socket.controller.js";

export default function auctionSocket(io) {
  io.on("connection", (socket) => {
    console.log(`Socket connected: ${socket.id}`);

    // Event 1: Join auction room
    socket.on("join", (auctionId) => {
      if (!auctionId) {
        console.log(`Socket ${socket.id} tried to join without auctionId`);
        return;
      }
      
      socket.join(auctionId);
      console.log(`Socket ${socket.id} joined auction room: ${auctionId}`);
      
      // Notify others in the room that someone joined (optional)
      socket.to(auctionId).emit('user_joined', {
        message: 'A user joined the auction',
        timestamp: new Date().toISOString()
      });
    });

    // Event 2: Leave auction room  
    socket.on("leave", (auctionId) => {
      if (!auctionId) {
        console.log(`Socket ${socket.id} tried to leave without auctionId`);
        return;
      }
      
      socket.leave(auctionId);
      console.log(`Socket ${socket.id} left auction room: ${auctionId}`);
      
      // Notify others in the room that someone left (optional)
      socket.to(auctionId).emit('user_left', {
        message: 'A user left the auction',
        timestamp: new Date().toISOString()
      });
    });

    // Event 3: Place bid
    socket.on("bid", async (data) => {
      console.log(`Socket ${socket.id} placing bid:`, data);
      
      // Validate required data
      if (!data.auctionId || !data.bidAmount || !data.userId) {
        socket.emit('bid_error', { 
          message: 'Missing required bid data (auctionId, bidAmount, or userId)' 
        });
        return;
      }

      // Ensure bidAmount is a number
      const bidAmount = parseFloat(data.bidAmount);
      if (isNaN(bidAmount) || bidAmount <= 0) {
        socket.emit('bid_error', { 
          message: 'Invalid bid amount' 
        });
        return;
      }

      // Process the bid
      await placeBid(io, socket, {
        auctionId: data.auctionId,
        bidAmount: bidAmount,
        userId: data.userId
      });
    });

    // Handle disconnect
    socket.on("disconnect", () => {
      console.log(`Socket disconnected: ${socket.id}`);
    });

    // Handle connection errors
    socket.on("error", (error) => {
      console.error(`Socket ${socket.id} error:`, error);
    });
  });
}
