import { APIFeatures } from "../../utils/api-features.js";
import { allAddresses } from "./artist-utils/all-addresses.js";

import Artist from "../../../DB/models/artist.model.js";
import Product from "../../../DB/models/product.model.js";
import Event from "../../../DB/models/event.model.js";
import cloudinaryConnection from "../../utils/cloudinary.js";
import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"


export const getAllArtists = async (req, res, next) => {
    // destruct data from req.query
    const {page, size, sortBy} = req.query;
    const features = new APIFeatures(req.query, Artist.find().select("-password -folderId -createdAt -updatedAt -__v"))
        .pagination({ page, size })
        .sort(sortBy)
    const artists = await features.mongooseQuery
    if(!artists.length) {
        return next(new Error("No artists found", { cause: 404 }));
    }
    // send response
    res.status(200).json({
        msg: "Artists data fetched successfully", 
        statusCode: 200,
        artists
    })
}

export const getArtist = async(req, res, next)=> {
    // destruct data from artist
    const {artistId} = req.params
    // get artist data
    const artist = await Artist.findById(artistId).select("-password -createdAt -updatedAt -__v -folderId")
    if (!artist) {
        return next(new Error("Artist not found", { cause: 404 }));
    }
    // send response
    res.status(200).json({
        msg: "Artist data fetched successfully",
        statusCode: 200,
        artist
    })
}

export const search = async (req, res, next) => {
    // destruct data from artist
    const { page, size, ...serach } = req.query;
    // get artist data
    const features = new APIFeatures(req.query, Artist.find().select("-password -folderId -createdAt -updatedAt -__v"))
        .pagination({ page, size })
        .searchArtists(serach)
        .sort()
    const artists = await features.mongooseQuery
    if (!artists.length) {
        return next(new Error("No artists found matching with your search query", { cause: 404 }));
    }
    res.status(200).json({
        msg: "Artists data fetched successfully",
        statusCode: 200,
        artists
    });
}

export const updateArtist = async(req, res, next)=> {
    // destruct data from artist
    const {artistId} = req.params
    const {artistName, phoneNumber} = req.body
    // update artist data
    const artist = await Artist.findById(artistId).select("-password -folderId -createdAt -updatedAt -__v")
    // check artist
    if(!artist){
        return next(new Error("Artist not found", { cause: 404 }));
    }
    // new phone check
    if(phoneNumber){
        const isPhoneExist = await Artist.findOne({phoneNumber, _id: {$ne: artistId} })
        if(isPhoneExist){
            return next(new Error("Phone number is already exists, Please try another phone number", { cause: 409 }));
        }
        artist.phoneNumber = phoneNumber
    }
    if(artistName) artist.artistName = artistName
    // save artist
    await artist.save()
    // send response
    res.status(200).json({
        msg: "Artist updated successfully",
        statusCode: 200,
        artist
    })
}

export const deleteArtist = async(req, res, next)=> {
    // destruct data from artist
    const {artistId} = req.params
    // delete artist data
    const deleteArtist = await Artist.findById(artistId)
    if (!deleteArtist) {
        return next(new Error("Artist not found", { cause: 404 }));
    }
    const products = await Product.find({artistId})
    // delete folder
    if(deleteArtist.profileImg.public_id || products.length){
        const folderProfile = `${process.env.MAIN_FOLDER}/Artists/${deleteArtist.folderId}`
        await cloudinaryConnection().api.delete_resources_by_prefix(folderProfile)
        await cloudinaryConnection().api.delete_folder(folderProfile)
        await Product.deleteMany({artistId})
    }
    const events = await Event.find({artistId})
    if(events.length){
        await Event.deleteMany({artistId})
    }
    // delete artist
    await deleteArtist.deleteOne()
    // send response
    res.status(200).json({
        msg: "Artist deleted successfully",
        statusCode: 200
    })
}

export const getAccountData = async (req, res, next)=> {
    // destruct data from artist
    const {_id} = req.authArtist
    const {artistId} = req.params
    if(_id != artistId){
        return next (new Error("You cannot access this profile's data", { cause: 400 }));
    }
    // get artist data
    const getArtist = await Artist.findById(_id).select("-password -createdAt -updatedAt -__v -folderId")
    if (!getArtist) {
        return next(new Error("Artist not found", { cause: 404 }));
    }
    // send response
    res.status(200).json({
        msg: "Artist data fetched successfully",
        statusCode: 200,
        getArtist
    })
}

export const updateProfileData = async (req, res, next)=> {
    // destruct data from artist
    const {_id} = req.authArtist
    const {artistId} = req.params
    const {artistName, phoneNumber} = req.body
    // check who is login and who is updating
    if(_id != artistId){
        return next (new Error("You cannot access this profile's data", { cause: 400 }));
    }
    // find artist
    const artist = await Artist.findById(_id).select("-password -folderId -createdAt -updatedAt -__v")
    // check artist
    if(!artist) return next(new Error("Artist not found", { cause: 404 }));
    // new phone check
    if(phoneNumber){
        const isPhoneExist = await Artist.findOne({phoneNumber, _id: {$ne: _id} })
        if(isPhoneExist){
            return next(new Error("Phone number is already exists, Please try another phone number", { cause: 409 }));
        }
        artist.phoneNumber = phoneNumber
    }
    // update artist data
    if(artistName) artist.artistName = artistName
    await artist.save()
    // send response
    res.status(200).json({
        msg: "Artist data updated successfully",
        statusCode: 200,
        artist
    })
}

export const updatePassword = async (req, res, next)=> {
    // destruct data from artist
    const {_id} = req.authArtist
    const {artistId} = req.params
    const {password, oldPassword} = req.body
    // check who is login and who is updating
    if(_id != artistId){
        return next (new Error("You cannot update this profile's password", { cause: 400 }));
    }
    // find artist
    const artist = await Artist.findById(_id)
    // check old password
    const isPasswordMatch = await bcrypt.compare(oldPassword, artist.password)
    if(!isPasswordMatch){
        return next(new Error("Invalid old password", { cause: 400 }));
    }
    // hash password
    const hashedPassword = bcrypt.hashSync(password, +process.env.SALT_ROUNDS)
    // update artist data
    artist.password = hashedPassword
    artist.passwordChangedAt = Date.now()
    await artist.save()
    // generate token
    const artistToken = jwt.sign({ id: artist._id ,email: artist.email, artistName: artist.artistName, role: artist.role},
        process.env.JWT_SECRET_LOGIN,
        {
            expiresIn: "90d"
        }
    )
    // send response
    res.status(200).json({
        msg: "Artist password updated successfully",
        statusCode: 200,
        artistToken
    })
}

export const updateProfilePicture = async (req, res, next)=> {
    // destruct data from artist
    const {_id} = req.authArtist
    const {oldPublicId} = req.body
    const {artistId} = req.params
    if(_id != artistId){
        return next (new Error("You cannot update this profile's data", { cause: 400 }));
    }
    // update artist data
    const artist = await Artist.findById(_id).select("-password -createdAt -updatedAt -__v")
    if(artist.profileImg.public_id != oldPublicId || !req.file){
        return next(new Error("Failed to update profile picture, please try again", { cause: 400 }));
    }
    const newPublicId = oldPublicId.split(`${artist.folderId}/Profile-Img`)[1]
    const {secure_url, public_id} = await cloudinaryConnection().uploader.upload(req.file.path, {
        folder: `${process.env.MAIN_FOLDER}/Artists/${artist.folderId}/Profile-Img`,
        public_id: newPublicId
    })
    artist.profileImg.secure_url = secure_url
    artist.profileImg.public_id = public_id
    // update artist data
    await artist.save()
    // send response
    res.status(200).json({
        msg: "Artist profile picture updated successfully",
        statusCode: 200,
        artist
    })
}

export const deleteAccount = async (req, res, next)=> {
    // destruct data from artist
    const {_id} = req.authArtist
    const {artistId} = req.params
    if(_id != artistId){
        return next (new Error("You cannot delete this profile", { cause: 400 }));
    }
    // delete artist data
    const deleteArtist = await Artist.findById(_id)
    if (!deleteArtist) {
            return next(new Error("Artist not found", { cause: 404 }));
    }
    const products = await Product.find({artistId})
    // delete folder
    if(deleteArtist.profileImg.public_id || products.length){
        const folderProfile = `${process.env.MAIN_FOLDER}/Artists/${deleteArtist.folderId}`
        await cloudinaryConnection().api.delete_resources_by_prefix(folderProfile)
        await cloudinaryConnection().api.delete_folder(folderProfile)
        await Product.deleteMany({artistId})
    }
    const events = await Event.find({artistId})
    if(events.length){
        await Event.deleteMany({artistId})
    }
    // delete artist
    await deleteArtist.deleteOne()
    // send response
    res.status(200).json({
        msg: "Artist deleted successfully",
        statusCode: 200
    })
}

export const addArtistAddress = async (req, res) => {
    // destruct data from artist
    const { _id } = req.authArtist
    const {artistId} = req.params
    if(_id != artistId){
        return next (new Error("You cannot add address to this profile", { cause: 400 }));
    }
    const artist = await Artist.findById(_id);
    // check if address already exists
    for (let i = 0; i < artist.addresses.length; i++) {
        if (JSON.stringify(req.body) === JSON.stringify(artist.addresses[i], ["alias", "street", "region", "city", "country", "postalCode", "phone"])
        || JSON.stringify(req.body) === JSON.stringify(artist.addresses[i], ["alias", "street", "region", "city", "country", "postalCode"])
        || JSON.stringify(req.body) === JSON.stringify(artist.addresses[i], ["alias", "street", "region", "city", "country", "phone"])
        || JSON.stringify(req.body) === JSON.stringify(artist.addresses[i], ["alias", "street", "region", "city", "country"])) {
            return res.status(200).json({msg: "Address already exists", statusCode: 200});
        }
    }
    // add address
    await artist.updateOne({
            $addToSet: {addresses: req.body},
        },
        {new: true}
    )
    // send response
    res.status(201).json({
        msg: "Address added successfully",
        statusCode: 201
    });
}

export const getProfileAddresses = async (req, res) => {
    // destruct data from artist
    const { artistId } = req.params;
    const {_id} = req.authArtist
    // check who is login and who is viewing
    if(_id != artistId){
        return next (new Error("You cannot view this profile's data", { cause: 400 }));
    }
    // get artist data
    const artist = await Artist.findById(artistId)
    if (!artist) {
        return next (new Error("Artist not found", { cause: 404 }));
    }
    const artistAddresses = allAddresses(artist.addresses)
    if(!artistAddresses.length){
        return next (new Error("Artist addresses not found", { cause: 404 }));
    }
    // send response
    res.status(200).json({
        msg: "Artist addresses fetched successfully",
        statusCode: 200,
        artistAddresses
    })
}

export const removeArtistAddress = async (req, res) => {
    // destruct data from artist
    const { _id } = req.authArtist
    const {addressId} = req.params;
    // check who is login and who is deleting
    const artist = await Artist.findByIdAndUpdate(
        _id,
        {
            $pull: {addresses: {_id: addressId}},
        },
        {new: true}
    );
    if (!artist) {
        return next (new Error("Artist not found", { cause: 404 }));
    }
    const artistAddresses = allAddresses(artist.addresses)
    // send response
    res.status(200).json({
        msg: "Artist addresses fetched successfully",
        statusCode: 200,
        artistAddresses
    })
}

export const getProductsForArtist = async (req, res, next)=> {
    // destruct data from user
    const {artistId} = req.params
    const {page, size, sortBy} = req.query
    const features = new APIFeatures(req.query, Product.find({artistId}).select("-createdAt -updatedAt -__v -basePrice -images -folderId"))
    .pagination({page, size})
    .sort(sortBy)
    const products = await features.mongooseQuery
    if(!products.length) {
        return next(new Error('No products found for this artist', { cause: 404 }))
    }
    res.status(200).json({ 
        msg: "Products fetched successfully", 
        statusCode: 200, 
        products
    })
}

export const getEventsForArtist = async (req, res, next)=> {
    // destruct data from user
    const {artistId} = req.params
    const {page, size, sortBy} = req.query
    const features = new APIFeatures(req.query, Event.find({artistId}).select("-createdAt -updatedAt -__v"))
    .pagination({page, size})
    .sort(sortBy)
    const events = await features.mongooseQuery
    if(!events.length) {
        return next(new Error('No events found for this artist', { cause: 404 }))
    }
    res.status(200).json({ 
        msg: "Events fetched successfully", 
        statusCode: 200, 
        events
    })
}
