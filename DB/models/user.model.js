import { Schema, model } from "mongoose";

const userSchema = new Schema({
    userName: {
        type: String,
        required: true,
        trim: true,
    },
    email: {
        type: String,
        lowercase: true,
        unique: true,
        required: true,
    },
    password: {
        type: String,
        required: true,
        min: 8,
    },
    phoneNumber: {
        type: String,
        unique: true,
        length: 11
    },
    profileImg: {
        secure_url: { type: String },
        public_id: { type: String }
    },
    folderId: { type: String, unique: true },
    addresses: [
        {
            alias: String,
            street: String,
            region: String,
            city: String,
            country: String,
            postalCode: String,
            phone: String,
        },
    ],
    gender: {
        type: String,
        enum: ["male", "female"],
        default: "male",
    },
    accountActivateCode: String,
    accountActivateExpires: Date,
    accountActive: {
        type: Boolean,
        default: false,
    },
    passwordChangedAt: Date,
    passwordResetCode: String,
    passwordResetExpires: Date,
    passwordResetVerified: Boolean,
    role: {
        type: String,
        enum: ["user"],
        default: "user",
    },
    auctionStatus: {
        type: String,
        enum: ["none", "pending", "paid"],
        default: "none",
    },
    auctionId: {
        type: Schema.Types.ObjectId,
        ref: 'Auction',
        default: null
    },
}, { timestamps: true })

const User = model('User', userSchema)

export default User