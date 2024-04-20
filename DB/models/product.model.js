import { Schema, model } from "mongoose";

const productSchema = new Schema({
    title: {
        type: String,
        required: true,
        trim: true,
        min: 3,
        max: 100
    },
    slug: {
        type: String,
        lowercase: true,
    },
    description: {
        type: String,
        required: true,
        min: 50,
        max: 400
    },

    basePrice: {
        type: Number,
        required: true,
    },
    discount: {
        type: Number,
        default: 0,
        min: 0,
        max: 100
    },
    appliedPrice: {
        type: Number,
        required: true,
    },

    isAvailable: {
        type: Boolean,
        default: true
    },
    isEvent: {
        type:Boolean,
        default:false
    },
    eventId: {
        type: Schema.Types.ObjectId,
        ref: "Event",
    },
    isAuction: {
        type:Boolean,
        default:false
    },
    auctionId: {
        type: Schema.Types.ObjectId,
        ref: "Auction",
    },

    artistId: {
        type: Schema.Types.ObjectId,
        ref: "Artist",
        required: true,
    },
    categoryId: {
        type: Schema.Types.ObjectId,
        ref: "Category",
        required: true,
    },
    styleId: {
        type: Schema.Types.ObjectId,
        ref: "Style",
        required: true,
    },
    subjectId: {
        type: Schema.Types.ObjectId,
        ref: "Subject",
        required: true,
    },

    height: {
        type: Number,
        required: true,
    },
    width: {
        type: Number,
        required: true,
    },
    depth: {
        type: Number,
        required: true,
    },
    size: {
        type: String,
        required: true,
    },

    coverImage: {
        public_id: {type: String, required: true},
        secure_url: {type: String, required: true}
    },
    images: [
        {
            public_id: {type: String},
            secure_url: {type: String}
        }
    ],
    folderId: {
        type: String,
        required: true,
    },

    material: {
        type: String,
        required: true,
        trim: true,
    },
}, {timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});


// products in category and poroducts in style and products in subject


productSchema.virtual('Reviews', {
    ref: 'Review',
    localField: '_id',
    foreignField: 'productId'
})

const Product = model("Product", productSchema);

export default Product;