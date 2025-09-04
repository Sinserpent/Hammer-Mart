// auction.socket.events.js
import { placeBid } from '../controllers/socket.controller.js';

export default function auctionSocket(io) {
  io.on('connection', (socket) => {
    console.log(`Socket connected: ${socket.id}`);

    socket.on('bid', async (data) => {
      await placeBid(io, socket, data);
    });

    socket.on('disconnect', () => {
      console.log(`Socket disconnected: ${socket.id}`);
    });
  });
}
