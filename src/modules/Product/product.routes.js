import { Router } from "express";
import { systemRoles } from "../../utils/system-roles.js";
import { authAdmin } from "../../middlewares/auth-admin.middleware.js";
import { authArtist } from "../../middlewares/auth-artist.middleware.js";
import { allowedExtensions } from "../../utils/allowed-extensions.js";
import {multerMiddleHost} from "../../middlewares/multer.middleware.js"
import { validationMiddleware } from "../../middlewares/validation.middleware.js";

import * as productController from './product.controller.js'
import * as validator from "./product.validator.js"

import expressAsyncHandler from "express-async-handler";

const router = Router();

router.post('/add', authArtist(), multerMiddleHost({
    extensions: allowedExtensions.image
}).fields([{ name: 'Cover', maxCount: 1 }, { name: 'Images', maxCount: 8 }]),
    validationMiddleware(validator.addProductValidator),
    expressAsyncHandler(productController.addProduct))

router.get('/all', validationMiddleware(validator.getAllProductsValidator),
    expressAsyncHandler(productController.getAllProducts))

router.get('/with-auctions', validationMiddleware(validator.getAllProductsValidator),
    expressAsyncHandler(productController.getProductsWithAuction))

router.get('/single/:productId', validationMiddleware(validator.IDValidator),
    expressAsyncHandler(productController.getProductById))

router.put('/update/:productId', authAdmin([systemRoles.IT]), validationMiddleware(validator.updateProductValidator),
    expressAsyncHandler(productController.updateProduct))

router.delete('/delete/:productId', authAdmin([systemRoles.IT]), validationMiddleware(validator.IDValidator),
    expressAsyncHandler(productController.deleteProduct))

router.get('/myProducts', authArtist(), validationMiddleware(validator.getAllProductsValidator),
    expressAsyncHandler(productController.getMyProducts))

router.put('/updateMyProduct/:productId', authArtist(), validationMiddleware(validator.updateProductValidator),
    expressAsyncHandler(productController.updateMyProduct))

router.patch('/changeCoverImg/:productId', authArtist(),
    multerMiddleHost({extensions: allowedExtensions.image
        }).single('Cover'), validationMiddleware(validator.changeCoverImgValidator),
expressAsyncHandler(productController.updateCoverImg))

router.patch('/changeSpecificImage/:productId', authArtist(),
    multerMiddleHost({extensions: allowedExtensions.image
        }).single('Image'), validationMiddleware(validator.changeCoverImgValidator),
expressAsyncHandler(productController.updateSpecificImg))

router.delete('/deleteMyProduct/:productId', authArtist(), validationMiddleware(validator.IDValidator),
    expressAsyncHandler(productController.deleteMyProduct))

router.get('/search', validationMiddleware(validator.search),
    expressAsyncHandler(productController.search))
    
router.get('/filter', validationMiddleware(validator.filter),
        expressAsyncHandler(productController.filterProducts))


export default router