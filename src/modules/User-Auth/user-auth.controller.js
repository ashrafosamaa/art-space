import User from "../../../DB/models/user.model.js";
import Artist from "../../../DB/models/artist.model.js";
import cloudinaryConnection from "../../utils/cloudinary.js"

import { generateUniqueString } from "../../utils/generate-unique-string.js"
import sendEmailService from "../../servcies/send-email-service.js"

import crypto from 'crypto'
import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"

export const signUp = async (req, res, next)=> {
    // destruct data from req.body
    const{
        userName,
        email,
        password,
        phoneNumber,
        gender,
        alias,
        street,
        region,
        city,
        country,
        postalCode,
        phone,
    } = req.body
    // check if email already exists
    const isEmailExistinArtist = await Artist.findOne({email})
    if(isEmailExistinArtist){
        return next (new Error("Email is already exists as Artist aaccount, Please try another email to login as User", { cause: 409 }))
    }
    // check if email already exists
    const isEmailExist = await User.findOne({email})
    if(isEmailExist){
        return next (new Error("Email is already exists, Please try another email", { cause: 409 }))
    }
    // check if phoneNumber already exists
    const isPhoneExist = await User.findOne({phoneNumber})
    if(isPhoneExist){
        return next (new Error("Phone number is already exists, Please try another phone number", { cause: 409 }))
    }
    // password hashing
    const hashedPassword = bcrypt.hashSync(password, +process.env.SALT_ROUNDS)
    // upload image
    let profileImg
    const folderId = generateUniqueString(4)
    if(req.file){
        const {secure_url, public_id} = await cloudinaryConnection().uploader.upload(req.file.path, {
            folder: `${process.env.MAIN_FOLDER}/Users/${folderId}`
        })
        profileImg = {
            secure_url,
            public_id
        }
        req.folder = `${process.env.MAIN_FOLDER}/Users/${folderId}`
    }
    let addresses = []
    if(alias || street || region || city || country || postalCode || phone) {
        addresses = [{
            alias,
            street,
            region,
            city,
            country,
            postalCode: postalCode ?? null,
            phone: phone ?? null
        }]
    }
    // create new document in database
    const newUser = await User.create({
        userName,
        email,
        password: hashedPassword,
        phoneNumber,
        addresses,
        gender,
        profileImg,
        folderId
    })
    if(!newUser) {
        return next(new Error("An error occurred while creating user", { cause: 500 }))
    }
    req.savedDocument = {model: User, _id: newUser._id}
    // generate otp
    const activateCode = Math.floor(1000 + Math.random() * 9000).toString();
    newUser.accountActivateCode = crypto
        .createHash("sha256")
        .update(activateCode)
        .digest("hex")
    newUser.accountActivateExpires = Date.now() + 10 * 60 * 1000;
    // send email
    try {
        await sendEmailService({
            to: email,
            subject: "Verification Code (valid for 10 minutes)",
            message:`Hi ${newUser.userName},\nYour verification code is ${activateCode}.
            \nEnter this code in our [website or app] to activate your [customer portal] account.
            \nWe’re glad you’re here!\nThe Art Space team\n`,
        });
        // save user
        await newUser.save()
    } catch (error) {
        newUser.accountActivateCode = undefined;
        newUser.accountActivateExpires = undefined;
        await newUser.save();
        return next(new Error("An error occurred while sending email", { cause: 500 }))
    }
    // send response
    res.status(201).json({
        msg: "User created successfully, Please check your email to verify your account",
        statusCode: 201,
    })
}

export const verifyEmail = async (req, res, next)=> {
    const { activateCode, email } = req.body
    // find user by email
    const user = await User.findOne({email})
    if(!user){
        return next (new Error("User not found", { cause: 404 }))
    }
    // verify otp
    const hashedResetCode = crypto
    .createHash("sha256")
    .update(activateCode)
    .digest("hex");
    // check if otp is valid
    if(user.accountActivateCode !== hashedResetCode || user.accountActivateExpires <= Date.now()){
        return next (new Error("Invalid verification code or expired", { cause: 404 }))
    }
    // update user
    user.accountActive = true;
    user.accountActivateCode = undefined;
    user.accountActivateExpires = undefined;
    await user.save();
    // generate token
    const userToken = jwt.sign({ id: user._id ,email , userName: user.userName, role: user.role},
        process.env.JWT_SECRET_LOGIN,
        {
            expiresIn: "90d"
        }
    )
    // send response
    res.status(200).json({
        msg: "Account verified successfully",
        statusCode: 200,
        userToken
    })
}

export const singIn = async (req, res, next)=> {
    //destruct data from req.body
    const{email, password} = req.body
    // check if user exists
    const user = await User.findOne({email})
    if(!user){
        return next (new Error("Invalid login credentials", { cause: 404 }))
    }
    // check if user is active
    if(user.accountActive == false){
        return next (new Error("Please Verify your account first", { cause: 404 }))
    }
    // compare password
    const isPasswordMatch = bcrypt.compareSync(password, user.password);
    if (!isPasswordMatch) {
        return next (new Error("Invalid login credentials", { cause: 404 }))
    }
    // generate token
    const userToken = jwt.sign({ id: user._id ,email , userName: user.userName, role: user.role },
        process.env.JWT_SECRET_LOGIN,
        {
            expiresIn: "90d"
        }
    )
    await user.save()
    // send response
    res.status(200).json({
        msg: "User logged in successfully",
        statusCode: 200,
        userToken,
    })
}

export const forgotPassword = async (req, res, next) => {
    // destruct data from req.body
    const { email } = req.body
    // check if user exists
    const user = await User.findOne({email});
    if (!user) {
        return next(new Error("User not found", { cause: 404 }));
    }
    const resetCode = Math.floor(1000 + Math.random() * 9000).toString();

    user.passwordResetCode = crypto
        .createHash("sha256")
        .update(resetCode)
        .digest("hex");

    user.passwordResetExpires = Date.now() + 10 * 60 * 1000; 
    user.passwordResetVerified = false;
    // save user
    await user.save();
    // send email
    try {
        await sendEmailService({
            to: email,
            subject: "Welcome To Art Space",
            message: `Hi ${user.userName},\nThere was a request to change your password!\n
            If you did not make this request then please ignore this email.\n
            Otherwise, Please enter this code to change your password: ${resetCode}\n`
        })
    } catch (error) {
        user.passwordResetCode = undefined;
        user.passwordResetExpires = undefined;
        user.passwordResetVerified = undefined;

        await user.save();

        return next(new Error("An error occurred while sending email", { cause: 500 }));
    }
    // send response
    res.status(200).json({
        msg: "Email sent successfully",
        statusCode: 200
    });
}

export const verifyCode = async (req, res, next) => {
    // destruct data from req.body
    const { resetCode, email } = req.body;
    // hash reset code
    const hashedResetCode = crypto
        .createHash("sha256")
        .update(resetCode)
        .digest("hex");
    // check if user exists
    const user = await User.findOne({email})
    if (!user) {
        return next(new Error("User not found", { cause: 404 }));
    }
    if (user.passwordResetCode !== hashedResetCode || user.passwordResetExpires <= Date.now()) {
        return next(new Error("Invalid verification code or expired", { cause: 404 }));
    }

    user.passwordResetVerified = true;
    await user.save();

    return res.status(200).json({
        msg: "Code verified successfully",
        statusCode: 200
    });
}

export const resetPassword = async (req, res, next) => {
    // destruct data from req.body
    const { email, password } = req.body;
    // check if user exists
    const user = await User.findOne({email});
    if (!user.passwordResetVerified || !user) {
        return next(new Error("You need to send request to verify code first", { cause: 404 }));
    }
    // update data
    user.password = bcrypt.hashSync(password, +process.env.SALT_ROUNDS)
    user.passwordResetCode = undefined;
    user.passwordResetExpires = undefined;
    user.passwordResetVerified = undefined;
    // save user
    await user.save();
    // generate token
    const userToken = jwt.sign({ id: user._id ,email , userName: user.userName, role: user.role },
        process.env.JWT_SECRET_LOGIN,
        {
            expiresIn: "90d"
        }
    )
    // send response
    return res.status(200).json({
        msg: "Password changed successfully",
        statusCode: 200,
        userToken
    })
}

export const resendCode = async (req, res, next) => {
    // destruct data from req.body
    const { email } = req.body;
    const user = await User.findOne({email, accountActive: false});
    if (!user) {
        return next(new Error("User not found, or account is already activated", { cause: 404 }));
    }
    const code = Math.floor(1000 + Math.random() * 9000).toString();

    user.accountActivateCode = crypto
        .createHash("sha256")
        .update(code)
        .digest("hex")
    user.accountActivateExpires = Date.now() + 10 * 60 * 1000;
    // send email
    try {
        await sendEmailService({
            to: email,
            subject: "Verification Code (valid for 10 minutes)",
            message:`Hi ${user.userName},\nYour verification code is ${code}.
            \nEnter this code in our [website or app] to activate your [customer portal] account.
            \nWe’re glad you’re here!\nThe Art Space team\n`,
        });
        await user.save();
    } catch (error) {
        user.accountActivateCode = undefined;
        user.accountActivateExpires = undefined;
        await user.save();
        return next(new Error("An error occurred while sending email", { cause: 500 }));
    }
    // send response
    return res.status(200).json({
        msg: "Code sent successfully, Check your email",
        statusCode: 200
    });
}