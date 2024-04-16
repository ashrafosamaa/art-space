import { Schema, model } from "mongoose";

const styleSchema = new Schema({
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

const Style = model("Style", styleSchema);

export default Style;