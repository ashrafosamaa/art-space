import { Router } from "express";
import { systemRoles } from "../../utils/system-roles.js";
import { authAdmin } from "../../middlewares/auth-admin.middleware.js";
import {multerMiddleHost} from "../../middlewares/multer.middleware.js"
import { allowedExtensions } from "../../utils/allowed-extensions.js";
import { validationMiddleware } from "../../middlewares/validation.middleware.js";

import * as adminController from './admin.controller.js'
import * as validator from "./admin.validator.js"

import expressAsyncHandler from "express-async-handler";

const router = Router();

router.post('/', authAdmin(), multerMiddleHost({
    extensions: allowedExtensions.image
}).single('profileImg'), validationMiddleware(validator.createAdminValidator),
    expressAsyncHandler(adminController.createAdmin))

router.post('/login', validationMiddleware(validator.loginValidator),
    expressAsyncHandler(adminController.login))

router.get('/all', authAdmin(), validationMiddleware(validator.getAllAdminsValidator),
    expressAsyncHandler(adminController.getAllAdmins))

router.get('/single/:adminId', authAdmin(), validationMiddleware(validator.IDValidator),
    expressAsyncHandler(adminController.getAdmin))

router.put('/update/:adminId', authAdmin(), validationMiddleware(validator.updateAdminValidator),
    expressAsyncHandler(adminController.updateAdmin))

router.delete('/account/:adminId', authAdmin(), validationMiddleware(validator.IDValidator),
    expressAsyncHandler(adminController.deleteAdmin))

router.get('/search', authAdmin(), validationMiddleware(validator.searchValidator),
    expressAsyncHandler(adminController.search))

router.get('/profile', authAdmin([systemRoles.CEO, systemRoles.IT, systemRoles.TRACKER]),
    validationMiddleware(validator.noValidator),
    expressAsyncHandler(adminController.getProfile))

router.put('/update-profile', authAdmin([systemRoles.CEO, systemRoles.IT, systemRoles.TRACKER]),
    validationMiddleware(validator.updateAdminProfileValidator),
    expressAsyncHandler(adminController.updateProfile))

router.patch('/update-password', authAdmin([systemRoles.CEO, systemRoles.IT, systemRoles.TRACKER]),
    validationMiddleware(validator.updatePasswordValidator),
    expressAsyncHandler(adminController.updatePassword))

router.put('/update-profile-img', authAdmin([systemRoles.CEO, systemRoles.IT, systemRoles.TRACKER]),
    multerMiddleHost({
        extensions: allowedExtensions.image}).single('profileImg'),
    validationMiddleware(validator.updateProfileImgValidator),
    expressAsyncHandler(adminController.updateProfileImg))

router.delete('/delete-profile', authAdmin([systemRoles.IT, systemRoles.TRACKER]),
    validationMiddleware(validator.noValidator),
    expressAsyncHandler(adminController.deleteProfile))


export default router

