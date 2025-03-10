import { Schema, model } from "mongoose";

const eventSchema = new Schema({
    title: {
        type: String,
        trim: true,
        required: true,
    },

    slug: {
        type: String,
        required: true,
        lowercase: true,
    },

    description: {
        type: String,
        trim: true,
        required: true,
    },

    artistId: {
        type: Schema.ObjectId,
        ref: "Artist",
        required: true
    },
    viewrsIds: [
        {
            type: Schema.Types.ObjectId,
            ref: 'User',
        },
    ],

    duration: {
        type: Number,
        required: true,
        max: 14
    },

    startAt: {
        type: Date,
        required: true
    },

    endAt: {
        type: Date,
    },

    productIds: [
        {
            type: Schema.Types.ObjectId,
            ref: 'Product',
            required: true
        },
        
    ],

    views: {
        type: Number,
        default: 0
    },

    status: {
        type: String,
        enum: ['not-started' ,'open', 'closed'],
        default: 'not-started'
    }
}, {timestamps: true});


const Event = model("Event", eventSchema);

export default Event