import mongoose from "mongoose";

const cartSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    products: [
        {
            productId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Product',
                required: true
            },
            basePrice: {
                type: Number,
                required: true,
                default: 0
            },
            appliedPrice: {
                type: Number,
                required: true,
                default: 0
            },
            title: {
                type: String,
                required: true
            },
            discount: {
                type: Number,
                required: true,
                min: 0,
                max: 100
            }
        }
    ],
    subTotal: {
        type: Number,
        required: true,
        default: 0
    },

}, {
    timestamps: true
})

const Cart = mongoose.model('Cart', cartSchema);

export default Cart