import mongoose from "mongoose";

const orderAuctionSchema = new mongoose.Schema({
    userId:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },

    auctionId:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Auction',
        required: true
    },

    paymentStatus:{type: String , enum:['Pending', 'Paid'], required: true , default: 'Pending'},

    payment_intent: String,

    payUrl: String,

    shippingAddressId: {
        type: mongoose.Schema.ObjectId,
        required: true
    },

},{timestamps: true});

const AuctionOrder = mongoose.model('AuctionOrder', orderAuctionSchema);

export default AuctionOrder