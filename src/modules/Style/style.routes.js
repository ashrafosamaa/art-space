import { Router } from "express";
import { authAdmin } from "../../middlewares/auth-admin.middleware.js";
import { validationMiddleware } from "../../middlewares/validation.middleware.js";

import * as styleController from './style.controller.js'
import * as validator from "./style.validator.js"

import expressAsyncHandler from "express-async-handler";

const router = Router();

router.post('/', authAdmin(), validationMiddleware(validator.addStyleValidator),
    expressAsyncHandler(styleController.addStyle))

router.get('/', validationMiddleware(validator.getAllStylesValidator),
    expressAsyncHandler(styleController.getAllStyles))

router.get('/single/:styleId', validationMiddleware(validator.IDValidator),
    expressAsyncHandler(styleController.getStyleById))

router.put('/:styleId', authAdmin(), validationMiddleware(validator.updateStyleValidator),
    expressAsyncHandler(styleController.updateStyle))

router.delete('/:styleId', authAdmin(), validationMiddleware(validator.IDValidator),
    expressAsyncHandler(styleController.deleteStyle))

router.get('/search', validationMiddleware(validator.searchValidator),
    expressAsyncHandler(styleController.search))

router.get('/products/:styleId', validationMiddleware(validator.getProductsInStyleValidator),
    expressAsyncHandler(styleController.getProductsInStyle))

router.get('/with-products', validationMiddleware(validator.getAllStylesValidator),
    expressAsyncHandler(styleController.getProductsWithStyle))

export default router
