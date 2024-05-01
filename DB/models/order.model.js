import mongoose from "mongoose";

const orderSchema = new mongoose.Schema({
    user:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    orderItems: [{
        title:{type: String, required: true},
        basePrice:{type: Number, required: true},
        discount:{type: Number, required: true}, 
        appliedPrice:{type: Number, required: true},
        product:{type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true}
    }],
    shippingAddressId:{
        type: mongoose.Schema.ObjectId,
        required: true
    },
    shippingAddress: {
        alias: String,
        street: String,
        region: String,
        city: String,
        country: String,
        postalCode: String,
        phone: String,
    },
    phoneNumber:[{type: String, required: true}],

    totalPrice:{type: Number, required: true}, 

    paymentMethod:{type: String, enum:['Cash' ,'Visa'], default: 'Cash', required: true},
    orderStatus:{type: String , enum:['Pending', 'Paid', 'Delivered', 'Placed', 'Cancelled', 'Refunded', 'Received'], 
    required: true , default: 'Pending'},

    isDelivered:{type: Boolean, required: true, default: false},
    deliveredAt:{type: String},

    isPaid:{type: Boolean, required: true, default: false},
    paidAt:{type: String},

    cancelledAt:{type: String},

    refundRequest:{type: Boolean, default: false},

},{timestamps: true});


const Order = mongoose.model('Order', orderSchema);

export default Order