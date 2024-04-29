import { Router } from "express";
import { systemRoles } from "../../utils/system-roles.js";
import { authAdmin } from "../../middlewares/auth-admin.middleware.js";
import { authUser } from "../../middlewares/auth-user.middleware.js";
import { authArtist } from "../../middlewares/auth-artist.middleware.js";
import { validationMiddleware } from "../../middlewares/validation.middleware.js";

import * as orderController from './order.controller.js'
import * as validator from "./order.validator.js"

import expressAsyncHandler from "express-async-handler";

const router = Router();

router.post('/create', authUser(), validationMiddleware(validator.createOrderValidator),
    expressAsyncHandler(orderController.createOrder))

export default router