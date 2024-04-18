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



export default router