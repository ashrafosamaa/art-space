import { Router } from "express";
import { allowedExtensions } from "../../utils/allowed-extensions.js";
import {multerMiddleHost} from "../../middlewares/multer.middleware.js"
import { validationMiddleware } from "../../middlewares/validation.middleware.js";

import * as userAuthController from './user-auth.controller.js'
import * as validator from "./user-auth.validator.js"

import expressAsyncHandler from "express-async-handler";

const router = Router();


router.post('/signup', multerMiddleHost({
    extensions: allowedExtensions.image
}).single('profileImg'), validationMiddleware(validator.signupValidator),
expressAsyncHandler(userAuthController.signUp))

router.post('/verifyemail', validationMiddleware(validator.verifyEmailValidator),
    expressAsyncHandler(userAuthController.verifyEmail))

router.post('/login', validationMiddleware(validator.signinValidator),
    expressAsyncHandler(userAuthController.singIn))
    
router.post('/forgetpassword', validationMiddleware(validator.forgetPasswordValidator),
    expressAsyncHandler(userAuthController.forgotPassword))
    
router.post('/verifycode', validationMiddleware(validator.verifyCodeValidator),
    expressAsyncHandler(userAuthController.verifyCode))

router.patch('/resetpassword', validationMiddleware(validator.resetPasswordValidator),
    expressAsyncHandler(userAuthController.resetPassword))
    
router.post('/resendcode', validationMiddleware(validator.resendCodeValidator),
    expressAsyncHandler(userAuthController.resendCode))


export default router;