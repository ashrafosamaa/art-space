import { Router } from "express";
import { systemRoles } from "../../utils/system-roles.js";
import { authAdmin } from "../../middlewares/auth-admin.middleware.js";
import { authArtist } from "../../middlewares/auth-artist.middleware.js";
import { authUser } from "../../middlewares/auth-user.middleware.js";
import { validationMiddleware } from "../../middlewares/validation.middleware.js";

import * as auctionController from './auction.controller.js'
import * as validator from "./auction.validator.js"

import expressAsyncHandler from "express-async-handler";
import express from "express";

const router = Router();

router.post('/create', authArtist(), validationMiddleware(validator.createAuctionValidator),
    expressAsyncHandler(auctionController.createAuction))

router.get('/my-products', authArtist(), validationMiddleware(validator.getProductsWithAuctionValidator),
    expressAsyncHandler(auctionController.getMyProductsInAuction))

router.get('/mine/:auctionId', authArtist(), validationMiddleware(validator.IdValidator),
    expressAsyncHandler(auctionController.getMyAuctionByIdWithProducts))

router.get('/all', validationMiddleware(validator.getProductsWithAuctionValidator),
    expressAsyncHandler(auctionController.getAllAuctions))

router.put('/update/:auctionId', authArtist(), validationMiddleware(validator.updateAuctionValidator),
    expressAsyncHandler(auctionController.updateMyAuction))

router.delete('/delete/:auctionId', authArtist(), validationMiddleware(validator.IdValidator),
    expressAsyncHandler(auctionController.deleteMyAuction))

router.put('/admin-update/:auctionId' , authAdmin([systemRoles.IT]) , validationMiddleware(validator.updateAuctionValidator),
    expressAsyncHandler(auctionController.updateAnAuctionByAdmin))

router.delete('/admin-delete/:auctionId' , authAdmin([systemRoles.IT]) , validationMiddleware(validator.IdValidator),
    expressAsyncHandler(auctionController.deleteAnAuctionByAdmin))

router.get('/user/:auctionId', authUser(), validationMiddleware(validator.IdValidator),
    expressAsyncHandler(auctionController.viewAuction))

router.post('/request-user/:auctionId', authUser(), validationMiddleware(validator.IdValidator),
    expressAsyncHandler(auctionController.requestToJoinAuction))

router.post('/pay-stripe/:auctionId', authUser(), validationMiddleware(validator.IdValidator),
    expressAsyncHandler(auctionController.payAuction))

router.post('/webhook', express.raw({type: 'application/json'}),
    expressAsyncHandler(auctionController.webhookAuction))

router.post('/take-part/:auctionId', authUser(), validationMiddleware(validator.takePartInAuctionValidator),
    expressAsyncHandler(auctionController.takePartInAuction))

export default router