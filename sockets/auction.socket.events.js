import { joinAuction, placeBid } from '../controllers/socket.controller.js';

export default function auctionSocket(io) {
  io.on('connection', (socket) => {
    console.log(`Socket connected: ${socket.id}`);

    socket.on('joinAuction', async (roomId) => {
      try {
        await joinAuction(socket, roomId);
      } catch (err) {
        console.error('Join Auction Error:', err);
        socket.emit('error', { message: 'Failed to join auction' });
      }
    });

    socket.on('bid', async (data) => {
      try {
        await placeBid(io, socket, data);
      } catch (err) {
        console.error('Bid Error:', err);
        socket.emit('error', { message: 'Failed to place bid' });
      }
    });

    socket.on('disconnect', () => {
      console.log(`Socket disconnected: ${socket.id}`);
    });
  });
}
