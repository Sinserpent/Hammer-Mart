  import { Auction } from '../models/auction.model.js';

  export const createAuctionController = async (req, res, next) => {
    try {
      // Just trust whatever comes from req.body
      const auction = new Auction(req.body);
      await auction.save();

      res.status(201).json({ message: 'Auction created', auction });
    } catch (err) {
      next(err);
    }
  };

  export const getAllAuctionIds = async (req, res, next) => {
    try {
      const auctions = await Auction.find({}, '_id'); // only return IDs if you prefer
      res.status(200).json(auctions);
    } catch (err) {
      next(err);
    }
  };

  export const getAuctionById = async (req, res, next) => {
    try {
      const auction = await Auction.findById(req.params.id);
      if (!auction) return res.status(404).json({ error: 'Auction not found' });
      res.status(200).json(auction);
    } catch (err) {
      next(err);
    }
  };
