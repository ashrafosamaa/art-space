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

router.post('/cart', authUser(), validationMiddleware(validator.convertCartToOrderValidator),
    expressAsyncHandler(orderController.convertCartToOrder))

router.get('/all-for-admins', authAdmin([systemRoles.TRACKER]), validationMiddleware(validator.getOrdersValidator),
    expressAsyncHandler(orderController.getAllOrdersForAdmin))

router.get('/mine', authUser(), validationMiddleware(validator.noValidator),
    expressAsyncHandler(orderController.getMyOrders))

router.get('/single/:orderId', authUser(), validationMiddleware(validator.IDValidator),
    expressAsyncHandler(orderController.getOrderById))

router.patch('/refund-my/:orderId', authUser(), validationMiddleware(validator.IDValidator),
    expressAsyncHandler(orderController.requestToRefundOrder))

router.patch('/cancel-my/:orderId', authUser(), validationMiddleware(validator.IDValidator),
    expressAsyncHandler(orderController.cancelMyOrder))

router.patch('/update-paid/:orderId', authAdmin([systemRoles.TRACKER]), validationMiddleware(validator.IDValidator),
    expressAsyncHandler(orderController.updateOrderStatusFirst))
    
router.patch('/update-delivered/:orderId', authAdmin([systemRoles.TRACKER]), validationMiddleware(validator.IDValidator),
    expressAsyncHandler(orderController.updateOrderStatusSecond))
    
router.patch('/update-cancelled-received/:orderId', authAdmin([systemRoles.TRACKER]), validationMiddleware(validator.IDValidator),
    expressAsyncHandler(orderController.updateOrderStatusThird))



export default router