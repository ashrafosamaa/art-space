import { Router } from "express";
import { systemRoles } from "../../utils/system-roles.js";
import { authAdmin } from "../../middlewares/auth-admin.middleware.js";
import { authArtist } from "../../middlewares/auth-artist.middleware.js";
import { allowedExtensions } from "../../utils/allowed-extensions.js";
import {multerMiddleHost} from "../../middlewares/multer.middleware.js"
import { validationMiddleware } from "../../middlewares/validation.middleware.js";

import * as artistController from './artist.controller.js'
import * as validator from "./artist.validator.js"

import expressAsyncHandler from "express-async-handler";

const router = Router();

router.get('/', authAdmin([systemRoles.IT]), validationMiddleware(validator.getAllArtistsValidator),
    expressAsyncHandler(artistController.getAllArtists))

router.get('/account/:artistId', authAdmin([systemRoles.IT]), validationMiddleware(validator.IDValidator),
    expressAsyncHandler(artistController.getArtist))

router.get('/search', authAdmin([systemRoles.IT]), validationMiddleware(validator.searchValidator),
    expressAsyncHandler(artistController.search))

router.put('/update/:artistId', authAdmin([systemRoles.IT]), validationMiddleware(validator.updateArtistValidator),
    expressAsyncHandler(artistController.updateArtist))

router.delete('/delete/:artistId', authAdmin([systemRoles.IT]), validationMiddleware(validator.IDValidator),
    expressAsyncHandler(artistController.deleteArtist))

router.get('/profiledata/:artistId', authArtist(), validationMiddleware(validator.IDValidator),
    expressAsyncHandler(artistController.getAccountData))

router.put('/updateprofile/:artistId', authArtist(), validationMiddleware(validator.updateArtistValidator),
    expressAsyncHandler(artistController.updateProfileData))
    
router.patch('/updatepassword/:artistId', authArtist(), validationMiddleware(validator.updatePasswordValidator),
    expressAsyncHandler(artistController.updatePassword))

router.put('/updateprofilepicture/:artistId', authArtist(),
    multerMiddleHost({extensions: allowedExtensions.image
        }).single('profileImg'), validationMiddleware(validator.updateProfilePictureValidator),
expressAsyncHandler(artistController.updateProfilePicture))

router.delete('/deleteaccount/:artistId', authArtist(), validationMiddleware(validator.IDValidator),
    expressAsyncHandler(artistController.deleteAccount))

router.post('/add-address/:artistId', authArtist(), validationMiddleware(validator.addArtistAddressValidator),
    expressAsyncHandler(artistController.addArtistAddress))

router.get('/alladdresses/:artistId', authArtist(), validationMiddleware(validator.IDValidator),
    expressAsyncHandler(artistController.getProfileAddresses))

router.delete('/deleteaddress/:addressId', authArtist(), validationMiddleware(validator.addressIdValidator), 
    expressAsyncHandler(artistController.removeArtistAddress))

router.get('/products/:artistId', validationMiddleware(validator.productsValidator),
    expressAsyncHandler(artistController.getProductsForArtist))


export default router;