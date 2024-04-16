import { Schema, model } from "mongoose";

const adminSchema = new Schema({
    nId: {
        type: String,
        required: true,
        trim: true,
        unique: true,
        length: 14
    },
    name: {
        type: String,
        required: true,
        trim: true,
    },
    userName: {
        type: String,
        lowercase: true,
        unique: true,
        required: true
    },
    password: {
        type: String,
        required: true,
        minlength: 8
    },
    phoneNumber: {
        type: String,
        required: true,
        length: 11
    },
    profileImg: {
        public_id: String,
        secure_url: String,
    },
    folderId: { type: String, unique: true },
    gender: {
        type: String,
        enum: ["male", "female"],
    },
    role: {
        type: String,
        required: true,
        enum: ["it", "tracker", "ceo"],
    },
    passwordChangedAt: Date,
}, {timestamps: true,});

const Admin = model("Admin", adminSchema);

export default Admin;