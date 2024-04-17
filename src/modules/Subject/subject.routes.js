import { Router } from "express";
import { authAdmin } from "../../middlewares/auth-admin.middleware.js";
import { validationMiddleware } from "../../middlewares/validation.middleware.js";

import * as subjectController from './subject.controller.js'
import * as validator from "./subject.validator.js"

import expressAsyncHandler from "express-async-handler";

const router = Router();

router.post('/', authAdmin(), validationMiddleware(validator.addSubjectValidator),
    expressAsyncHandler(subjectController.addSubject))

router.get('/', validationMiddleware(validator.getAllSubjectsValidator),
    expressAsyncHandler(subjectController.getAllSubjects))

router.get('/single/:subjectId', validationMiddleware(validator.IDValidator),
    expressAsyncHandler(subjectController.getSubjectById))

router.put('/:subjectId', authAdmin(), validationMiddleware(validator.updateSubjectValidator),
    expressAsyncHandler(subjectController.updateSubject))

router.delete('/:subjectId', authAdmin(), validationMiddleware(validator.IDValidator),
    expressAsyncHandler(subjectController.deleteSubject))

router.get('/search', validationMiddleware(validator.searchValidator),
    expressAsyncHandler(subjectController.search))

router.get('/products/:subjectId', validationMiddleware(validator.getProductsInSubjectValidator),
    expressAsyncHandler(subjectController.getProductsInSubject))

export default router