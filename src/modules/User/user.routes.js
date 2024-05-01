import { Router } from "express";
import { systemRoles } from "../../utils/system-roles.js";
import { authUser } from "../../middlewares/auth-user.middleware.js";
import { authAdmin } from "../../middlewares/auth-admin.middleware.js";
import { allowedExtensions } from "../../utils/allowed-extensions.js";
import {multerMiddleHost} from "../../middlewares/multer.middleware.js"
import { validationMiddleware } from "../../middlewares/validation.middleware.js";

import * as userController from './user.controller.js'
import * as validator from "./user.validator.js"

import expressAsyncHandler from "express-async-handler";

const router = Router();

router.get('/', authAdmin([systemRoles.IT]), validationMiddleware(validator.getAllUsersValidator),
    expressAsyncHandler(userController.getAllUsers))

router.get('/account/:userId', authAdmin([systemRoles.IT]), validationMiddleware(validator.IDValidator),
    expressAsyncHandler(userController.getUser))

router.get('/search', authAdmin([systemRoles.IT]), validationMiddleware(validator.searchValidator),
    expressAsyncHandler(userController.search))

router.put('/update/:userId', authAdmin([systemRoles.IT]), validationMiddleware(validator.updateUserValidator),
    expressAsyncHandler(userController.updateUser))

router.delete('/delete/:userId', authAdmin([systemRoles.IT]), validationMiddleware(validator.IDValidator),
    expressAsyncHandler(userController.deleteUser))

router.get('/profiledata', authUser(), validationMiddleware(validator.noValidator),
    expressAsyncHandler(userController.getAccountData))

router.put('/updateprofile', authUser(), validationMiddleware(validator.updateByUserValidator),
    expressAsyncHandler(userController.updateProfileData))

router.patch('/updatepassword', authUser(), validationMiddleware(validator.updatePasswordValidator),
    expressAsyncHandler(userController.updatePassword))

router.put('/updateprofilepicture', authUser(),
    multerMiddleHost({extensions: allowedExtensions.image
        }).single('profileImg'), validationMiddleware(validator.updateProfilePictureValidator),
expressAsyncHandler(userController.updateProfilePicture))

router.delete('/deleteaccount', authUser(), validationMiddleware(validator.noValidator),
    expressAsyncHandler(userController.deleteAccount))

router.post('/add-address', authUser(), validationMiddleware(validator.addUserAddressValidator),
    expressAsyncHandler(userController.addUserAddress))

router.get('/alladdresses', authUser(), validationMiddleware(validator.noValidator),
    expressAsyncHandler(userController.getProfileAddresses))

router.delete('/deleteaddress/:addressId', authUser(), validationMiddleware(validator.addressIdValidator), 
    expressAsyncHandler(userController.removeUserAddress))


export default router;