import { Router } from "express";
import { systemRoles } from "../../utils/system-roles.js";
import { authAdmin } from "../../middlewares/auth-admin.middleware.js";
import { authArtist } from "../../middlewares/auth-artist.middleware.js";
import { authUser } from "../../middlewares/auth-user.middleware.js";
import { validationMiddleware } from "../../middlewares/validation.middleware.js";

import * as eventController from './event.controller.js'
import * as validator from "./event.validator.js"

import expressAsyncHandler from "express-async-handler";

const router = Router();

router.post('/add', authArtist(), validationMiddleware(validator.createEventValidator),
    expressAsyncHandler(eventController.createEvent))

router.get('/with-products/:eventId', authUser(), validationMiddleware(validator.getEventValidator),
    expressAsyncHandler(eventController.getEvent))

router.get('/all', validationMiddleware(validator.getEventsValidator),
    expressAsyncHandler(eventController.getEvents))

router.get('/myevents', authArtist(), validationMiddleware(validator.getEventsValidator),
    expressAsyncHandler(eventController.getAllMyEvents))

router.get('/mine/:eventId', authArtist(), validationMiddleware(validator.getEventValidator),
    expressAsyncHandler(eventController.getMyEvent))

router.put('/update/:eventId', authArtist(), validationMiddleware(validator.updateEventValidator),
    expressAsyncHandler(eventController.updateMyEvent))

router.patch('/add-product/:eventId', authArtist(), validationMiddleware(validator.editProductsInEventValidator),
    expressAsyncHandler(eventController.addNewProductsToEvent))

router.patch('/delete-product/:eventId', authArtist(), validationMiddleware(validator.editProductsInEventValidator),
    expressAsyncHandler(eventController.deleteProductsFromEvent))

router.delete('/:eventId', authArtist(), validationMiddleware(validator.getEventValidator),
    expressAsyncHandler(eventController.deleteMyEvent))

router.get('/admin/:eventId', authAdmin([systemRoles.IT]), validationMiddleware(validator.getEventValidator),
    expressAsyncHandler(eventController.getEventForAdmin))

router.put('/admin/:eventId', authAdmin([systemRoles.IT]), validationMiddleware(validator.updateEventValidator),
    expressAsyncHandler(eventController.updateEventByAdmin))

router.delete('/admin/:eventId', authAdmin([systemRoles.IT]), validationMiddleware(validator.getEventValidator),
    expressAsyncHandler(eventController.deleteEventByAdmin))

router.get('/search', validationMiddleware(validator.searchValidator),
    expressAsyncHandler(eventController.search))

router.get('/filter', validationMiddleware(validator.filterValidator),
    expressAsyncHandler(eventController.filter))


export default router