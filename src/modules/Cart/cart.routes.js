import { Router } from "express";
import { authUser } from "../../middlewares/auth-user.middleware.js";
import { validationMiddleware } from "../../middlewares/validation.middleware.js";

import * as cartController from './cart.controller.js'
import * as validator from "./cart.validator.js"

import expressAsyncHandler from "express-async-handler";

const router = Router()

router.post('/', authUser(), validationMiddleware(validator.bodyIDValidator),
    expressAsyncHandler(cartController.addProductToCart))

router.get('/', authUser(), validationMiddleware(validator.nothingValidator),
    expressAsyncHandler(cartController.getCart))

router.patch('/', authUser(), validationMiddleware(validator.bodyIDValidator),
    expressAsyncHandler(cartController.removeProductFromCart))

router.delete('/:cartId', authUser(), validationMiddleware(validator.paramsIDValidator),
    expressAsyncHandler(cartController.deleteCart))


export default router