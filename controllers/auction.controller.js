import { Auction } from "../models/auction.model.js";
import {
  rescheduleAuction,
  scheduleNewAuction,
} from "../middleware/auction.scheduler.js";
import jwt from "jsonwebtoken";

// Create Auction
export const createAuctionController = async (req, res, next) => {
  try {
    const token = req.cookies.admin_token;
    if (!token) {
      return res
        .status(401)
        .json({ error: "No admin authentication token found" });
    }

    let decodedToken;
    try {
      decodedToken = jwt.verify(token, process.env.JWT_SECRET, {
        issuer: "HammerBidMart",
      });
    } catch {
      return res.status(401).json({ error: "Invalid or expired token" });
    }

    // ✅ Parse extraFields if sent as a string
    if (typeof req.body.extraFields === "string") {
      try {
        req.body.extraFields = JSON.parse(req.body.extraFields);
      } catch {
        return res.status(400).json({ error: "Invalid JSON for extraFields" });
      }
    }

    // ✅ Ensure it's always an array
    if (!Array.isArray(req.body.extraFields)) {
      req.body.extraFields = [];
    }

    // ✅ Validate structure (optional but good practice)
    req.body.extraFields = req.body.extraFields.filter(
      (field) =>
        field &&
        typeof field.key === "string" &&
        typeof field.value === "string"
    );


    const newAuction = new Auction({
      ...req.body,
      sellerId: decodedToken.id,
      sellerModel: "Admin",
    });

    await newAuction.save();

    const io = req.app.get("io");
    io.emit("auction_list_update", newAuction);

    await rescheduleAuction(newAuction._id, newAuction.startTime, newAuction.endTime);

    res.status(201).json({ message: "Auction created", auction: newAuction });
  } catch (err) {
    next(err);
  }
};

export const getAuctionDistilled = async (req, res, next) => {
  try {
    const auctions = await Auction.find({})
      .select('startTime endTime images status description teaser title category')
      .lean();

    // Only keep the first image
    const formattedAuctions = auctions.map(a => ({
      ...a,
      image: a.images[0] || null,
      images: undefined // remove original images array
    }));

    res.status(200).json(formattedAuctions);
  } catch (err) {
    next(err);
  }
};

// Get All Auctions
export const getAllAuctions = async (req, res, next) => {
  try {
    const auctions = await Auction.find({});

    res.status(200).json(auctions);
  } catch (err) {
    next(err);
  }
};


export const updateAuctionController = async (req, res, next) => {
  try {
    const { id } = req.params;

    const auction = await Auction.findById(id);
    if (!auction) {
      return res.status(404).json({ message: "Auction not found." });
    }

    const now = new Date()
    if (new Date(auction.endTime)<now){
      res
      .status(400)
      .json({ message: "Cannot Update Auctions After END"});
    }
    // --- Handle REMOVED IMAGES ---
    let currentImages = [...(auction.images || [])];

    if (req.body.removedImages) {
      let removedImages = [];
      try {
        removedImages = JSON.parse(req.body.removedImages);
      } catch {
        removedImages = Array.isArray(req.body.removedImages)
          ? req.body.removedImages
          : [req.body.removedImages];
      }

      currentImages = currentImages.filter(
        (img) => !removedImages.includes(img)
      );

      // TODO: add deletion logic if needed
    }

    // --- Handle EXISTING IMAGES ---
    const imagesField = req.body.existingImages;
    if (imagesField) {
      if (Array.isArray(imagesField)) {
        currentImages = [...currentImages, ...imagesField];
      } else if (typeof imagesField === "string") {
        try {
          const parsedImages = JSON.parse(imagesField);
          currentImages = [...currentImages, ...parsedImages];
        } catch {
          currentImages = [...currentImages, imagesField];
        }
      }
    }

    // --- Handle NEW UPLOADED IMAGES ---
    const newUploadedImages = req.uploadedImages || [];
    currentImages = [...currentImages, ...newUploadedImages];
    auction.images = [...new Set(currentImages)];

    // --- Handle REMOVED VIDEO ---
    let currentVideo = auction.video;
    if (req.body.removedVideo) {
      currentVideo = null;
      // TODO: delete old video file if required
    }

    // --- Handle VIDEO UPLOAD/UPDATE ---
    if (req.uploadedVideo) {
      if (currentVideo && currentVideo !== req.uploadedVideo) {
        // TODO: delete old video file if required
      }
      currentVideo = req.uploadedVideo;
    } else if (req.body.existingVideo) {
      currentVideo = req.body.existingVideo;
    }
    auction.video = currentVideo;

    // --- Handle EXTRA FIELDS ---
    if (req.body.extraFields) {
      if (typeof req.body.extraFields === "string") {
        try {
          auction.extraFields = JSON.parse(req.body.extraFields);
        } catch {
          console.log("Failed to parse extraFields, keeping existing");
        }
      } else {
        auction.extraFields = req.body.extraFields;
      }
    }

    // --- Update other fields ---
    if (req.body.title) auction.title = req.body.title;
    if (req.body.teaser) auction.teaser = req.body.teaser;
    if (req.body.description) auction.description = req.body.description;
    if (req.body.startingPrice) auction.startingPrice = req.body.startingPrice;
    if (req.body.category) auction.category = req.body.category;

    if (
      new Date(req.body.startTime).getTime() !==
        new Date(auction.startTime).getTime() ||
      new Date(req.body.endTime).getTime() !==
        new Date(auction.endTime).getTime()
    ) {
      const newStartTime = new Date(req.body.startTime);
      const newEndTime = new Date(req.body.endTime);
      const now = new Date();

      // update auction times
      auction.startTime = newStartTime;
      auction.endTime = newEndTime;

      if (newStartTime > now) {
        auction.status = "scheduled";
      } else if (newStartTime <= now && newEndTime > now) {
        auction.status = "active";
      } else {
        auction.status = "ended";
      }

      await rescheduleAuction(auction._id, auction.startTime, auction.endTime);
    }

    await auction.save();

    // call agenda rescheduler with new times

    if (req.body.minBidIncrement) {
      auction.minBidIncrement = req.body.minBidIncrement;
    }

    const updatedAuction = await auction.save();

    const io = req.app.get("io");
    io.emit("auction_updated", updatedAuction);

    // Respond immediately
    res
      .status(200)
      .json({ message: "Auction updated", auction: updatedAuction });

    // Continue to reschedule middleware (fire-and-forget)
    next();
  } catch (err) {
    next(err);
  }
};

// Delete Auction
export const deleteAuctionController = async (req, res, next) => {
  try {
    const { id } = req.params;
    const deletedAuction = await Auction.findByIdAndDelete(id);

    if (!deletedAuction) {
      return res.status(404).json({ message: "Auction not found" });
    }

    const io = req.app.get("io");
    io.emit("auction_deleted", { id });

    res.status(200).json({ message: "Auction deleted", id });
  } catch (err) {
    next(err);
  }
};

// Get auctions for authenticated admin
export const getAuctions = async (req, res, next) => {
  try {
    const token = req.cookies.admin_token;
    if (!token) {
      return res
        .status(401)
        .json({ error: "No admin authentication token found" });
    }

    let decodedToken;
    try {
      decodedToken = jwt.verify(token, process.env.JWT_SECRET, {
        issuer: "HammerBidMart",
      });
    } catch (err) {
      console.error("JWT Error:", err.name, "-", err.message);
      return res.status(401).json({ error: "Invalid or expired token" });
    }

    const sellerId = decodedToken.id;

    // Fetch all auctions created by this admin
    const auctions = await Auction.find({ sellerId, sellerModel: "Admin" });

    res.status(200).json({ auctions });
  } catch (err) {
    console.error("Error Name:", err.name);
    console.error("Error Message:", err.message);
    console.error("Error Stack:", err.stack);
    next(err);
  }
};

// Get all active auctions
export async function getAllActiveAuctions(req, res) {
  try {
    const count = await Auction.countDocuments({ status: "active" });
    return res.json({ activeAuctions: count });
  } catch (err) {
    console.error("Error counting active auctions:", err);
    return res.status(500).json({ message: "Internal Server Error" });
  }
}
