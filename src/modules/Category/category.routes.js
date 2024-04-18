import { Router } from "express";
import { authAdmin } from "../../middlewares/auth-admin.middleware.js";
import { validationMiddleware } from "../../middlewares/validation.middleware.js";

import * as categoryController from './category.controller.js'
import * as validator from "./category.validator.js"

import expressAsyncHandler from "express-async-handler";

const router = Router();

router.post('/', authAdmin(), validationMiddleware(validator.addCategoryValidator),
    expressAsyncHandler(categoryController.addCategory))

router.get('/', validationMiddleware(validator.getAllCategoriesValidator),
    expressAsyncHandler(categoryController.getAllCategories))

router.get('/single/:categoryId', validationMiddleware(validator.IDValidator),
    expressAsyncHandler(categoryController.getCategoryById))

router.put('/:categoryId', authAdmin(), validationMiddleware(validator.updateCategoryValidator),
    expressAsyncHandler(categoryController.updateCategory))

router.delete('/:categoryId', authAdmin(), validationMiddleware(validator.IDValidator),
    expressAsyncHandler(categoryController.deleteCategory))

router.get('/search', validationMiddleware(validator.searchValidator),
    expressAsyncHandler(categoryController.search))

router.get('/products/:categoryId', validationMiddleware(validator.getProductsInCategoryValidator),
    expressAsyncHandler(categoryController.getProductsInCategory))
    
router.get('/with-products', validationMiddleware(validator.getAllCategoriesValidator),
    expressAsyncHandler(categoryController.getProductsWithCategory))

export default router