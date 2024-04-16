import { Router } from "express";
import { allowedExtensions } from "../../utils/allowed-extensions.js";
import {multerMiddleHost} from "../../middlewares/multer.middleware.js"
import { validationMiddleware } from "../../middlewares/validation.middleware.js";

import * as artistAuthController from './artist-auth.controller.js'
import * as validator from "./artist-auth.validator.js"

import expressAsyncHandler from "express-async-handler";

const router = Router();

router.post('/signup', multerMiddleHost({
    extensions: allowedExtensions.image
}).single('profileImg'), validationMiddleware(validator.signupValidator),
    expressAsyncHandler(artistAuthController.signUp))

router.post('/verifyemail', validationMiddleware(validator.verifyEmailValidator),
    expressAsyncHandler(artistAuthController.verifyEmail))

router.post('/login', validationMiddleware(validator.signinValidator),
    expressAsyncHandler(artistAuthController.singIn))

router.post('/forgetpassword', validationMiddleware(validator.forgetPasswordValidator),
    expressAsyncHandler(artistAuthController.forgotPassword))

router.post('/verifycode', validationMiddleware(validator.verifyCodeValidator),
    expressAsyncHandler(artistAuthController.verifyCode))

router.patch('/resetpassword', validationMiddleware(validator.resetPasswordValidator),
    expressAsyncHandler(artistAuthController.resetPassword))
    
router.post('/resendcode', validationMiddleware(validator.resendCodeValidator),
    expressAsyncHandler(artistAuthController.resendCode))

export default router;