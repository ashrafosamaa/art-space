import { Schema, model } from "mongoose";

const auctionSchema = new Schema({
    duration: {
        type: Number,
        required: true,
        max: 3
    },
    beginDate: {
        type: Date,
        required: true
    },
    endDate: {
        type: Date,
        required: true
    },
    beginPrice: {
        type: Number,
        required: true,
    },
    variablePrice: {
        type: Number,
        required: true,
    },

    productId: {
        type: Schema.Types.ObjectId,
        ref: 'Product',
        required: true
    },
    artistId: {
        type: Schema.Types.ObjectId,
        ref: 'Artist',
        required: true
    },
    userIds: [
        {
            type: Schema.Types.ObjectId,
            ref: 'User',
        },
    ],
    heighstPriceId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
    },
    winnerId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
    },

    oldBasePrice: {
        type: Number
    },
    oldDiscount: {
        type: Number
    },
    oldAppliedPrice: {
        type: Number
    },

    status: {
        type: String,
        enum: ['not-started' ,'open', 'closed'],
        default: 'not-started'
    }
}, {timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
})

auctionSchema.virtual('products', {
    ref: 'Product',
    localField: '_id',
    foreignField: 'auctionId'
})

const Auction = model("Auction", auctionSchema);

export default Auction;