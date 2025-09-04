import express from 'express';
import { createUserController, getAllUsersController, getUserController, updateUserController, deleteUserController } from '../controllers/user.controller.js';
import sellerModel from '../models/seller.model.js';
import bidderModel from '../models/bidder.model.js';
import  validateUser   from '../middleware/validation.user.js'; // placeholder

const sellerRouter = express.Router();
sellerRouter.get('/', getAllUsersController(sellerModel)); // admin only
sellerRouter.get('/:id', getUserController(sellerModel));
sellerRouter.post('/', validateUser, createUserController(sellerModel));
sellerRouter.put('/:id', validateUser, updateUserController(sellerModel));
sellerRouter.delete('/:id', deleteUserController(sellerModel));

const bidderRouter = express.Router();
bidderRouter.get('/', getAllUsersController(bidderModel)); // admin only
bidderRouter.get('/:id', getUserController(bidderModel));
bidderRouter.post('/', validateUser, createUserController(bidderModel));
bidderRouter.put('/:id', validateUser, updateUserController(bidderModel));
bidderRouter.delete('/:id', deleteUserController(bidderModel));

export { sellerRouter, bidderRouter };
