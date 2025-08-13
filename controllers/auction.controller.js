import {Auction,Bid} from '../models/auction.model.js';

export const createAuctionController = async (req, res, next) => {
  try {
    const existing = await Auction.findOne({ name: req.body.sku });

    if (existing) {
      return res.status(409).json({ error: 'Auction already exists' });
    }

    const auction = new Auction(req.body);
    await auction.save();

    
    res.status(201).json({ message: 'Auction created', auction });

  } catch (err) {
    next(err);
  }

};

  export const getAllAuctions = async (req, res) => {
   
  try {
    const auctions = await Auction.find();
    res.status(200).json(auctions);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch auctions", error: err.message });
  }
};
