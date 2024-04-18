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
}, {timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
})

subjectSchema.virtual('products', {
    ref: 'Product',
    localField: '_id',
    foreignField: 'subjectId'
})

const Subject = model("Subject", subjectSchema);

export default Subject;