import { APIFeatures } from "../../utils/api-features.js";
import { generateUniqueString } from "../../utils/generate-unique-string.js";

import Admin from "../../../DB/models/admin.model.js";
import cloudinaryConnection from "../../utils/cloudinary.js";
import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"

export const createAdmin = async (req, res, next) => {
    // destruct data from ceo
    const { nId, name, userName, password, phoneNumber, gender, role } = req.body
    // check if nIdExist exists
    const nIdExist = await Admin.findOne({ nId })
    if (nIdExist) return next (new Error ("National Id already exists", { cause: 409 }))
    // check if userNameExist exists
    const userNameExist = await Admin.findOne({ userName })
    if (userNameExist) return next (new Error ("User Name already exists", { cause: 409 }))
    // check if phoneNumberExist exists
    const phoneNumberExist = await Admin.findOne({ phoneNumber })
    if (phoneNumberExist) return next(new Error('Phone number is already exists, Please try another phone number', { cause: 400 }))
    // check role
    if (role == "ceo") return next (new Error ("Invalid role, this platform has only one CEO", { cause: 400 }))
    // hash password
    const hashedPassword = bcrypt.hashSync(password, +process.env.SALT_ROUNDS)
    // upload image
    let profileImg
    const folderId = generateUniqueString(4)
    if(req.file){
        const {secure_url, public_id} = await cloudinaryConnection().uploader.upload(req.file.path, {
            folder: `${process.env.MAIN_FOLDER}/Admins/${folderId}`
        })
        profileImg = {
            secure_url,
            public_id
        }
        req.folder = `${process.env.MAIN_FOLDER}/Admins/${folderId}`
    }
    // create admin
    const admin = await Admin.create({
        nId,
        name,
        userName,
        password: hashedPassword,
        phoneNumber,
        gender,
        role,
        profileImg,
        folderId
    })
    if(!admin){
        return next(new Error('Error while adding new Admin', { cause: 500 }))
    }
    // send response
    res.status(201).json({
        msg: "Admin created successfully",
        satusCode: 201
    })
}

export const login = async (req, res, next) => {
    // check Admin data in req.body
    const admin = await Admin.findOne({userName: req.body.userName});
    if (!admin) {
        return next(new Error("Incorrect Username", { cause: 404 }));
    }
    // check password
    const isPasswordCorrect = await bcrypt.compare(req.body.password, admin.password);
    if (!(isPasswordCorrect)) {
        return next(new Error("Incorrect Password", { cause: 404 }));
    }
    // generate token
    const adminToken = jwt.sign({ id: admin._id, userName: req.body.userName, role: admin.role },
        process.env.JWT_SECRET_LOGIN,
        {
            expiresIn: "90d"
        }
    )
    const adminName = admin.name.split(" ")[0];
    // send response
    return res.status(200).json({
        msg: `Login Successfully, Welcome Mr/Ms. ${adminName}`, 
        statusCode: 200,
        adminToken
    });
}

export const getAllAdmins = async (req, res, next) => {
    // destruct data from req.query
    const {_id} = req.authAdmin
    const { page, size, sortBy } = req.query;
    const features = new APIFeatures(req.query, Admin.find({_id: {$ne: _id}}).select("-password -folderId -createdAt -updatedAt -__v"))
        .pagination({ page, size })
        .sort(sortBy)
    const admins = await features.mongooseQuery
    if(!admins.length) {
        return next(new Error("No admins found", { cause: 404 }));
    }
    // send response
    res.status(200).json({
        msg: "Admins data fetched successfully", 
        statusCode: 200,
        admins
    })
}

export const getAdmin = async (req, res, next) => {
    const admin = await Admin.findById(req.params.adminId).select("-password -folderId -createdAt -updatedAt -__v")
    if(!admin) {
        return next(new Error("Admin not found", { cause: 404 }));
    }
    // send response
    res.status(200).json({
        msg: "Admins data fetched successfully", 
        statusCode: 200,
        admin
    })
}

export const updateAdmin = async (req, res, next) => {
    // destruct data from ceo
    const { name, phoneNumber, gender, role } = req.body
    const { adminId } = req.params
    // check if admin exists
    const admin = await Admin.findById(adminId).select("-password -folderId -createdAt -updatedAt -__v")
    if(!admin) return next (new Error("Admin not found", { cause: 404 }));
    // check if phoneNumberExist exists
    const phoneNumberExist = await Admin.findOne({ phoneNumber, _id: {$ne: adminId} })
    if (phoneNumberExist) return next (new Error('Phone number is already exists, Please try another phone number', { cause: 400 }))
    // check role
    if (role == "ceo") return next (new Error ("Invalid role, this platform has only one CEO", { cause: 400 }))
    // update data
    if(name) admin.name = name
    if(phoneNumber) admin.phoneNumber = phoneNumber
    if(gender) admin.gender = gender
    if(role) admin.role = role
    // save admin
    await admin.save()
    // send response
    res.status(200).json({
        msg: "User updated successfully", 
        statusCode: 200,
        admin
    })
}

export const deleteAdmin = async (req, res, next)=> {
    // destruct data from req.params
    const { adminId } = req.params
    // check if admin exists
    const admin = await Admin.findByIdAndDelete(adminId)
    if(!admin) {
        return next(new Error("Admin not found", { cause: 404 }));
    }
    if(admin.profileImg.public_id){
        const folder = `${process.env.MAIN_FOLDER}/Admins/${admin.folderId}`
        await cloudinaryConnection().api.delete_resources_by_prefix(folder)
        await cloudinaryConnection().api.delete_folder(folder)
    }
    // send response
    res.status(200).json({
        msg: "Admin deleted successfully",
        statusCode: 200
    })
}

export const search = async (req, res, next)=> {
    // destruct data from req.query
    const {page, size, sortBy, ...serach} = req.query
    const features = new APIFeatures(req.query, Admin.find().select("-password -folderId -createdAt -updatedAt -__v"))
    .pagination({page, size})
    .searchAdmins(serach)
    .sort(sortBy)
    const admins = await features.mongooseQuery
    if(!admins.length) {
        return next (new Error("No admins found matching with your search query", { cause: 404 }));
    }
    res.status(200).json({ 
        msg: "Admins fetched successfully", 
        statusCode: 200,
        admins
    })
}

export const getProfile = async (req, res, next) => {
    // get admin data
    const admin = await Admin.findById(req.authAdmin.id).select("-password -folderId -createdAt -updatedAt -__v")
    if(!admin) {
        return next(new Error("Admin not found", { cause: 404 }));
    }
    // send response
    res.status(200).json({
        msg: "Admin data fetched successfully", 
        statusCode: 200,
        admin
    })
}

export const updateProfile = async (req, res, next)=> {
    // destruct data from admin
    const { name, phoneNumber, gender } = req.body
    const { _id } = req.authAdmin
    // check if admin exists
    const admin = await Admin.findById(_id).select("-password -folderId -createdAt -updatedAt -__v")
    if(!admin){
        return next(new Error("Admin not found", { cause: 404 }));
    }
    // check if phoneNumberExist exists
    const phoneNumberExist = await Admin.findOne({ phoneNumber, _id: {$ne: _id} })
    if(phoneNumberExist){
        return next(new Error('Phone number is already exists, Please try another phone number', { cause: 400 }))
    }
    // update data
    if(name) admin.name = name
    if(phoneNumber) admin.phoneNumber = phoneNumber
    if(gender) admin.gender = gender
    // save admin
    await admin.save()
    // send response
    res.status(200).json({
        msg: "User updated successfully", 
        statusCode: 200,
        admin
    })
}

export const updatePassword = async (req, res, next)=> {
    // destruct data from req.body
    const { oldPassword, password } = req.body
    const { _id } = req.authAdmin
    // check if admin exists
    const admin = await Admin.findById(_id)
    if(!admin){
        return next(new Error("Admin not found", { cause: 404 }));
    }
    // check if password is correct
    const isPasswordMatch = bcrypt.compareSync(oldPassword, admin.password)
    if(!isPasswordMatch){
        return next(new Error("Incorrect old password", { cause: 400 }));
    }
    // update password
    admin.password = bcrypt.hashSync(password, +process.env.SALT_ROUNDS)
    // save admin
    await admin.save()
    // generate token
    const adminToken = jwt.sign({ id: admin._id, userName: admin.userName, role: admin.role },
        process.env.JWT_SECRET_LOGIN,
        {
            expiresIn: "90d"
        }
    ) 
    // send response
    res.status(200).json({
        msg: "Password updated successfully", 
        statusCode: 200,
        adminToken
    })
}

export const updateProfileImg = async(req, res, next)=> {
    // destruct data from admin
    const {_id} = req.authAdmin
    const {oldPublicId} = req.body
    // check file is uploaded
    if(!req.file){
        return next(new Error("Please upload a photo", { cause: 400 }))
    }
    // update admin data
    const admin = await Admin.findById(_id).select("-password -createdAt -updatedAt -__v")
    if(admin.profileImg.public_id != oldPublicId){
        return next(new Error("Failed to update profile picture, please try again", { cause: 400 }))
    }
    const newPublicId = oldPublicId.split(`${admin.folderId}/`)[1]
    const {secure_url, public_id} = await cloudinaryConnection().uploader.upload(req.file.path, {
        folder: `${process.env.MAIN_FOLDER}/Admins/${admin.folderId}`,
        public_id: newPublicId
    })
    admin.profileImg.secure_url = secure_url
    admin.profileImg.public_id = public_id
    // update admin data
    await admin.save()
    // send response
    res.status(200).json({
        msg: "Admin profile picture updated successfully",
        statusCode: 200,
        admin
    })
}

export const deleteProfile = async (req, res, next)=> {
    // destruct data from admin
    const { _id } = req.authAdmin
    // check if admin exists
    const admin = await Admin.findById(_id)
    if(!admin){
        return next(new Error("Admin not found", { cause: 404 }));
    }
    if(admin.profileImg.public_id){
        const folder = `${process.env.MAIN_FOLDER}/Admins/${admin.folderId}`
        await cloudinaryConnection().api.delete_resources_by_prefix(folder)
        await cloudinaryConnection().api.delete_folder(folder)
    }
    // delete admin
    await admin.deleteOne()
    // send response
    res.status(200).json({
        msg: "Admin deleted successfully",
        statusCode: 200
    })
}