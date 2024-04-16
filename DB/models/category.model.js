import { Schema, model } from "mongoose";

const categorySchema = new Schema({
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

const Category = model("Category", categorySchema);

export default Category;