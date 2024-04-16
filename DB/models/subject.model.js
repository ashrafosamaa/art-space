import { Schema, model } from "mongoose";

const subjectSchema = new Schema({
    title: {
        type: String,
        unique: true,
        trim: true,
        required: true,
    },
    slug: {
        type: String,
        lowercase: true,
    }
}, {timestamps: true})

const Subject = model("Subject", subjectSchema);

export default Subject;