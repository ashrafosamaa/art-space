import User from "../../../DB/models/user.model.js"
import Artist from "../../../DB/models/artist.model.js"
import cloudinaryConnection from "../../utils/cloudinary.js"

import { generateUniqueString } from "../../utils/generate-unique-string.js"
import sendEmailService from "../../servcies/send-email-service.js"

import crypto from 'crypto'
import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"

export const signUp = async (req, res, next)=> {
    // destruct data from req.body
    const{
        artistName,
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
    const isEmailExistinUser = await User.findOne({email})
    if(isEmailExistinUser){
        return next (new Error("Email is already exists as User account, Please try another email to login as Artist", { cause: 409 }))
    }
    // check if email already exists
    const isEmailExist = await Artist.findOne({email})
    if(isEmailExist){
        return next (new Error("Email is already exists, Please try another email", { cause: 409 }))
    }
    // check if phoneNumber already exists
    const isPhoneExist = await Artist.findOne({phoneNumber})
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
            folder: `${process.env.MAIN_FOLDER}/Artists/${folderId}/Profile-Img`
        })
        profileImg = {
            secure_url,
            public_id
        }
        req.folder = `${process.env.MAIN_FOLDER}/Artists/${folderId}/Profile-Img`
    }
    let addresses = []
    if(alias || street || region || city || country || postalCode || phone) {
        addresses = [{
            alias,
            street,
            region,
            city,
            country,
            postalCode,
            phone
        }]
    }
    // create new document in database
    const newArtist = await Artist.create({
        artistName,
        email,
        password: hashedPassword,
        phoneNumber,
        addresses,
        gender,
        profileImg,
        folderId
    })
    if(!newArtist) {
        return next(new Error("An error occurred while creating Artist", { cause: 500 }))
    }
    req.savedDocument = {model: Artist, _id: newArtist._id}
    // generate otp
    const activateCode = Math.floor(1000 + Math.random() * 9000).toString();
    newArtist.accountActivateCode = crypto
        .createHash("sha256")
        .update(activateCode)
        .digest("hex")
    newArtist.accountActivateExpires = Date.now() + 10 * 60 * 1000;
    // send email
    try {
        await sendEmailService({
            to: email,
            subject: "Verification Code (valid for 10 minutes)",
            message:`Hi ${newArtist.artistName},\nYour verification code is ${activateCode}.
            \nEnter this code in our [website or app] to activate your [customer portal] account.
            \nWe’re glad you’re here!\nThe Art Space team\n`,
        });
        // save user
        await newArtist.save()
    } catch (error) {
        newArtist.accountActivateCode = undefined;
        newArtist.accountActivateExpires = undefined;
        await newArtist.save();
        return next(new Error("An error occurred while sending email", { cause: 500 }))
    }
    // send response
    res.status(201).json({
        msg: "Artist created successfully, Please check your email to verify your account",
        statusCode: 201
    })
}

export const verifyEmail = async (req, res, next)=> {
    const { activateCode, email } = req.body
    // find artist by email
    const artist = await Artist.findOne({email})
    if(!artist){
        return next(new Error("Artist not found", { cause: 404 }))
    }
    // verify otp
    const hashedResetCode = crypto
    .createHash("sha256")
    .update(activateCode)
    .digest("hex");
    // check if otp is valid
    if(artist.accountActivateCode !== hashedResetCode || artist.accountActivateExpires <= Date.now()){
        return next(new Error("Invalid verification code or expired", { cause: 404 }))
    }
    // update artist
    artist.accountActive = true;
    artist.accountActivateCode = undefined;
    artist.accountActivateExpires = undefined;
    await artist.save();
    // generate token
    const artistToken = jwt.sign({ id: artist._id ,email , artistName: artist.artistName, role: artist.role},
        process.env.JWT_SECRET_LOGIN,
        {
            expiresIn: "90d"
        }
    )
    // send response
    res.status(200).json({
        msg: "Account verified successfully",
        statusCode: 200,
        artistToken
    })
}

export const singIn = async (req, res, next)=> {
    //destruct data from req.body
    const{email, password} = req.body
    // check if artist exists
    const artist = await Artist.findOne({email})
    if(!artist){
        return next(new Error("Invalid login credentials", { cause: 404 }))
    }
    // check if artist is active
    if(artist.accountActive == false){
        return next(new Error("Please Verify your account first", { cause: 404 }))
    }
    // compare password
    const isPasswordMatch = bcrypt.compareSync(password, artist.password);
    if (!isPasswordMatch) {
        return next(new Error("Invalid login credentials", { cause: 404 }))
    }
    // generate token
    const artistToken = jwt.sign({ id: artist._id ,email , artistName: artist.artistName, role: artist.role },
        process.env.JWT_SECRET_LOGIN,
        {
            expiresIn: "90d"
        }
    )
    await artist.save()
    // send response
    res.status(200).json({
        msg: "Artist logged in successfully",
        statusCode: 200,
        artistToken,
    })
}

export const forgotPassword = async (req, res, next) => {
    // destruct data from req.body
    const { email } = req.body
    // check if artist exists
    const artist = await Artist.findOne({email});
    if (!artist) {
        return next(new Error("Artist not found", { cause: 404 }));
    }
    const resetCode = Math.floor(1000 + Math.random() * 9000).toString();

    artist.passwordResetCode = crypto
        .createHash("sha256")
        .update(resetCode)
        .digest("hex");
    artist.passwordResetExpires = Date.now() + 10 * 60 * 1000; 
    artist.passwordResetVerified = false;
    // save artist
    await artist.save();
    // send email
    try {
        await sendEmailService({
            to: email,
            subject: "Welcome To Art Space",
            message: `Hi ${artist.artistName},\nThere was a request to change your password!\n
            If you did not make this request then please ignore this email.\n
            Otherwise, Please enter this code to change your password: ${resetCode}\n`
        })
    } catch (error) {
        artist.passwordResetCode = undefined;
        artist.passwordResetExpires = undefined;
        artist.passwordResetVerified = undefined;
        await artist.save();
        return next(new Error("An error occurred while sending email", { cause: 500 }))
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
    // check if artist exists
    const artist = await Artist.findOne({email})
    if (!artist) {
        return next(new Error("Artist not found", { cause: 404 }));
    }
    if (artist.passwordResetCode !== hashedResetCode || artist.passwordResetExpires <= Date.now()) {
        return next(new Error("Invalid verification code or expired", { cause: 404 }));
    }
    // update artist
    artist.passwordResetVerified = true;
    await artist.save();
    // send response
    res.status(200).json({
        msg: "Code verified successfully",
        statusCode: 200
    });
}

export const resetPassword = async (req, res, next) => {
    // destruct data from req.body
    const { email, password } = req.body;
    // check if artist exists
    const artist = await Artist.findOne({email});
    if (!artist.passwordResetVerified || !artist) {
        return next(new Error("Invalid verification code or expired", { cause: 404 }));
    }
    // update data
    artist.password = bcrypt.hashSync(password, +process.env.SALT_ROUNDS)
    artist.passwordResetCode = undefined;
    artist.passwordResetExpires = undefined;
    artist.passwordResetVerified = undefined;
    // save artist
    await artist.save();
    // generate token
    const artistToken = jwt.sign({ id: artist._id ,email , artistName: artist.artistName, role: artist.role },
        process.env.JWT_SECRET_LOGIN,
        {
            expiresIn: "90d"
        }
    )
    // send response
    res.status(200).json({
        msg: "Password changed successfully",
        statusCode: 200,
        artistToken
    })
}

export const resendCode = async (req, res, next) => {
    // destruct data from req.body
    const { email } = req.body;
    const artist = await Artist.findOne({email, accountActive: false});
    if (!artist) {
        return next(new Error("Artist not found", { cause: 404 }));
    }
    const code = Math.floor(1000 + Math.random() * 9000).toString();

    artist.accountActivateCode = crypto
        .createHash("sha256")
        .update(code)
        .digest("hex")
    artist.accountActivateExpires = Date.now() + 10 * 60 * 1000;
    // send email
    try {
        await sendEmailService({
            to: email,
            subject: "Verification Code (valid for 10 minutes)",
            message:`Hi ${artist.artistName},\nYour verification code is ${code}.
            \nEnter this code in our [website or app] to activate your [customer portal] account.
            \nWe’re glad you’re here!\nThe Art Space team\n`,
        });
        await artist.save();
    } catch (error) {
        artist.accountActivateCode = undefined;
        artist.accountActivateExpires = undefined;
        await artist.save();
        return next(new Error("An error occurred while sending email", { cause: 500 }));
    }
    // send response
    res.status(200).json({
        msg: "Code sent successfully, Check your email",
        statusCode: 200
    });
}