import { APIFeatures } from "../../utils/api-features.js";
import { allAddresses } from "./user-utils/all-addresses.js";

import User from "../../../DB/models/user.model.js";

import cloudinaryConnection from "../../utils/cloudinary.js";
import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"


export const getAllUsers = async (req, res, next) => {
    // destruct data from req.query
    const {page, size, sortBy} = req.query;
    const features = new APIFeatures(req.query, User.find().select("-password -folderId -createdAt -updatedAt -__v"))
        .pagination({ page, size })
        .sort(sortBy)
    const users = await features.mongooseQuery
    if(!users.length) {
        return next(new Error("No users found", { cause: 404 }))
    }
    // send response
    res.status(200).json({
        msg: "Users data fetched successfully", 
        statusCode: 200,
        users
    })
}

export const getUser = async(req, res, next)=> {
    // destruct data from user
    const {userId} = req.params
    // get user data
    const getUser = await User.findById(userId).select("-password -createdAt -updatedAt -__v -folderId")
    if (!getUser) {
        return next(new Error("User not found", { cause: 404 }))
    }
    // send response
    res.status(200).json({
        msg: "User data fetched successfully",
        statusCode: 200,
        getUser
    })
}

export const search = async (req, res, next) => {
    // destruct data from user
    const { page, size, ...serach } = req.query;
    // get users data
    const features = new APIFeatures(req.query, User.find().select("-password -folderId -createdAt -updatedAt -__v"))
        .pagination({ page, size })
        .searchUsers(serach)
        .sort()
    const users = await features.mongooseQuery
    if (!users.length) {
        return next(new Error("No users found matching with your search query", { cause: 404 }))
    }
    res.status(200).json({
        msg: "Users data fetched successfully",
        statusCode: 200,
        users
    });
}

export const updateUser = async(req, res, next)=> {
    // destruct data from user
    const {userId} = req.params
    const {userName, phoneNumber} = req.body
    // find user
    const user = await User.findById(userId).select("-password -folderId -createdAt -updatedAt -__v")
    // check user
    if(!user){
        return next (new Error("User not found", { cause: 404 }))
    }
    // new phone check
    if(phoneNumber){
        const isPhoneExist = await User.findOne({phoneNumber, _id: {$ne: userId} })
        if(isPhoneExist){
            return next (new Error("Phone number is already exists, Please try another phone number", { cause: 409 }))
        }
        user.phoneNumber = phoneNumber
    }
    // update user data
    if(userName) user.userName = userName
    await user.save()
    // send response
    res.status(200).json({
        msg: "User updated successfully",
        statusCode: 200,
        user
    })
}

export const deleteUser = async(req, res, next)=> {
    // destruct data from user
    const {userId} = req.params
    // delete user data
    const deleteUser = await User.findByIdAndDelete(userId)
    if (!deleteUser) {
        return next (new Error("User not found", { cause: 404 }))
    }
    if(deleteUser.profileImg.public_id){
        const folder = `${process.env.MAIN_FOLDER}/Users/${deleteUser.folderId}`
        await cloudinaryConnection().api.delete_resources_by_prefix(folder)
        await cloudinaryConnection().api.delete_folder(folder)
    }
    // send response
    res.status(200).json({
        msg: "User deleted successfully",
        statusCode: 200
    })
}

export const getAccountData = async (req, res, next)=> {
    // destruct data from user
    const {_id} = req.authUser
    // get user data
    const getUser = await User.findById(_id).select("-password -createdAt -updatedAt -__v -folderId")
    if (!getUser) {
        return next (new Error("User not found", { cause: 404 }))
    }
    // send response
    res.status(200).json({
        msg: "User data fetched successfully",
        statusCode: 200,
        getUser
    })
}

export const updateProfileData = async (req, res, next)=> {
    // destruct data from user
    const {_id} = req.authUser
    const{userName, phoneNumber} = req.body
    // find user
    const user = await User.findById(_id).select("-password -folderId -createdAt -updatedAt -__v")
    // check user
    if(!user){
        return next (new Error("User not found", { cause: 404 }))
    }
    // new phone check
    if(phoneNumber){
        const isPhoneExist = await User.findOne({phoneNumber, _id: {$ne: _id} })
        if(isPhoneExist){
            return next (new Error("Phone number is already exists, Please try another phone number", { cause: 409 }))
        }
        user.phoneNumber = phoneNumber
    }
    // update user data
    if(userName) user.userName = userName
    await user.save()
    // send response
    res.status(200).json({
        msg: "User data updated successfully",
        statusCode: 200,
        user
    })
}

export const updatePassword = async (req, res, next)=> {
    // destruct data from user
    const {_id} = req.authUser
    const {password, oldPassword} = req.body
    // find user
    const user = await User.findById(_id)
    // check old password
    const isPasswordMatch = await bcrypt.compare(oldPassword, user.password)
    if(!isPasswordMatch){
        return next (new Error("Invalid old password", { cause: 400 }))
    }
    // hash password
    const hashedPassword = bcrypt.hashSync(password, +process.env.SALT_ROUNDS)
    // update user data
    user.password = hashedPassword
    user.passwordChangedAt = Date.now()
    await user.save()
    // generate token
    const userToken = jwt.sign({ id: user._id ,email: user.email , userName: user.userName, role: user.role},
        process.env.JWT_SECRET_LOGIN,
        {
            expiresIn: "90d"
        }
    )
    // send response
    res.status(200).json({
        msg: "User password updated successfully",
        statusCode: 200,
        userToken
    })
}

export const updateProfilePicture = async (req, res, next)=> {
    // destruct data from user
    const {_id} = req.authUser
    const {oldPublicId} = req.body
    // check file is uploaded
    if(!req.file){
        return next (new Error("Image is required", { cause: 400 }))
    }
    // update user data
    const user = await User.findById(_id).select("-password -createdAt -updatedAt -__v")
    if(user.profileImg.public_id != oldPublicId){
        return next (new Error("You cannot update this profile's profile picture", { cause: 400 }))
    }
    const newPublicId = oldPublicId.split(`${user.folderId}/`)[1]
    const {secure_url, public_id} = await cloudinaryConnection().uploader.upload(req.file.path, {
        folder: `${process.env.MAIN_FOLDER}/Users/${user.folderId}`,
        public_id: newPublicId
    })
    user.profileImg.secure_url = secure_url
    user.profileImg.public_id = public_id
    // update user data
    await user.save()
    // send response
    res.status(200).json({
        msg: "User profile picture updated successfully",
        statusCode: 200,
        user
    })
}

export const deleteAccount = async (req, res, next)=> {
    // destruct data from user
    const {_id} = req.authUser
    // delete user data
    const deleteUser = await User.findByIdAndDelete(_id)
    if (!deleteUser) {
        return next (new Error("User not found", { cause: 404 }))
    }
    if(deleteUser.profileImg.public_id){
        const folder = `${process.env.MAIN_FOLDER}/Users/${deleteUser.folderId}`
        await cloudinaryConnection().api.delete_resources_by_prefix(folder)
        await cloudinaryConnection().api.delete_folder(folder)
    }
    // send response
    res.status(200).json({
        msg: "User deleted successfully",
        statusCode: 200
    })
}

export const addUserAddress = async (req, res) => {
    // destruct data from user
    const { _id } = req.authUser
    const user = await User.findById(_id);
    // check if address already exists
    for (let i = 0; i < user.addresses.length; i++) {
        if (JSON.stringify(req.body) === JSON.stringify(user.addresses[i], ["alias", "street", "region", "city", "country", "postalCode", "phone"])
        || JSON.stringify(req.body) === JSON.stringify(user.addresses[i], ["alias", "street", "region", "city", "country", "postalCode"])
        || JSON.stringify(req.body) === JSON.stringify(user.addresses[i], ["alias", "street", "region", "city", "country", "phone"])
        || JSON.stringify(req.body) === JSON.stringify(user.addresses[i], ["alias", "street", "region", "city", "country"])) {
            return res.status(200).json({msg: "Address already exists", statusCode: 200});
        }
    }
    // add address
    await user.updateOne({
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
    // destruct data from user
    const {_id} = req.authUser
    // get user data
    const user = await User.findById(_id)
    if (!user) {
        return next (new Error("User not found", { cause: 404 }))
    }
    const userAddresses = allAddresses(user.addresses)
    if(!userAddresses.length){
        return next (new Error("User addresses not found", { cause: 404 }))
    }
    // send response
    res.status(200).json({
        msg: "User addresses fetched successfully",
        statusCode: 200,
        userAddresses
    })
}

export const removeUserAddress = async (req, res) => {
    // destruct data from user
    const { _id } = req.authUser
    const {addressId} = req.params;
    // check who is login and who is deleting
    const user = await User.findByIdAndUpdate(
        _id,
        {
            $pull: {addresses: {_id: addressId}},
        },
        {new: true}
    );
    if (!user) {
        return next (new Error("User not found", { cause: 404 }))
    }
    const userAddresses = allAddresses(user.addresses)
    // send response
    res.status(200).json({
        msg: "User addresses fetched successfully",
        statusCode: 200,
        userAddresses
    })
}