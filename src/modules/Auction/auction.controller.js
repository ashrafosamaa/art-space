import { APIFeatures } from "../../utils/api-features.js";
import { createCheckOutSessionForAuction } from "../../payment-handlers/stripe.js";
import { getIO } from "../../utils/io-generation.js";


import User from "../../../DB/models/user.model.js";
import Auction from "../../../DB/models/auction.model.js";
import Product from "../../../DB/models/product.model.js";
import AuctionOrder from "../../../DB/models/auction-payment.model.js";

import Stripe from "stripe";

export const createAuction = async (req, res, next) => {
    // destructe data from artist
    const {_id} = req.authArtist
    const { duration, beginDate, beginPrice, productId } = req.body
    // check if product is found
    const product = await Product.findOne({ _id: productId, artistId: _id })
    if (!product) {
        return next(new Error('Product not found', { cause: 404 }))
    }
    // check that owner is artist
    if (product.artistId.toString() !== _id.toString()) {
        return next(new Error(`You are not authorized to add ${product.title} to your auction`, { cause: 404 }))
    }
    // check that product is available
    if (product.isAvailable == false) {
        return next(new Error(`${product.title} is not available`, { cause: 404 }))
    }
    // check that product is not in event or auction
    if (product.isEvent == true) {
        return next(new Error(`${product.title} is already in an event`, { cause: 404 }))
    }
    if (product.isAuction == true) {
        return next(new Error(`${product.title} is already in another auction`, { cause: 404 }))
    }
    // set duration and end date
    const startDate = new Date(beginDate)
    const endDate = startDate.getTime() + duration * 24 * 60 * 60 * 1000
    // create auction
    const auction = {
        artistId: _id,
        productId,
        beginPrice,
        variablePrice: beginPrice,
        beginDate,
        duration,
        endDate
    }
    const newAuction = await Auction.create(auction)
    newAuction.oldBasePrice = product.basePrice
    newAuction.oldDiscount = product.discount
    newAuction.oldAppliedPrice = product.appliedPrice
    // update product
    product.isAuction = true
    if(product.discount) product.discount = 0
    product.basePrice = beginPrice
    product.appliedPrice = beginPrice
    await product.save()
    // update auction
    await newAuction.save()
    // send response
    res.status(201).json({
        msg: 'Auction created successfully',
        statusCode: 201,
    })
}

export const getMyProductsInAuction = async (req, res, next)=> {
    // destruct data from artist
    const { _id } = req.authArtist
    const { page, size, sortBy } = req.query
    const features = new APIFeatures(req.query, Product.find({ artistId: _id, isAuction: true })
    .select("-createdAt -updatedAt -__v -oldBasePrice -oldDiscount -oldAppliedPrice"))
    .pagination({page, size})
    .sort(sortBy)
    const products = await features.mongooseQuery
    if(!products.length) {
        return next(new Error('No products found', { cause: 404 }))
    }
    res.status(200).json({
        msg: "Products fetched successfully",
        statusCode: 200,
        products
    })
}

export const getMyAuctionByIdWithProducts = async (req, res, next)=> {
    // destruct data from artist
    const { _id } = req.authArtist
    const { auctionId } = req.params
    const auction = await Auction.findOne({_id: auctionId, artistId: _id})
    .populate({path:"productId", select:"-createdAt -updatedAt -__v -images -folderId"})
    .select("-createdAt -updatedAt -__v -oldBasePrice -oldDiscount -oldAppliedPrice")
    if(!auction) {
        return next(new Error('Auction not found', { cause: 404 }))
    }
    res.status(200).json({
        msg: "Auction fetched successfully",
        statusCode: 200,
        auction
    })
}

export const getAllAuctions = async (req, res, next)=> {
    const { page, size, sortBy } = req.query
    const features = new APIFeatures(req.query, Auction.find()
    .select("-createdAt -updatedAt -__v -oldBasePrice -oldDiscount -oldAppliedPrice -productId"))
    .pagination({page, size})
    .sort(sortBy)
    const auctions = await features.mongooseQuery
    if(!auctions.length) {
        return next(new Error('No Auctions found', { cause: 404 }))
    }
    res.status(200).json({
        msg: "Auction fetched successfully",
        statusCode: 200,
        auctions
    })
}

export const updateMyAuction = async (req, res, next)=> {
    // destructe data from artist
    const { _id } = req.authArtist
    const { auctionId } = req.params
    const { duration, beginDate, beginPrice, productId } = req.body
    // check auction is found
    const auction = await Auction.findOne({ _id: auctionId, artistId: _id })
    if (!auction) {
        return next(new Error('Auction not found', { cause: 404 }))
    }
    // check that time is still not start
    if(auction.status == 'open' || auction.status == 'closed') {
        return next(new Error('Auction is already started, you can not update on it', { cause: 400 }))
    }
    let finalPrice
    if(beginPrice) {
        auction.beginPrice = beginPrice
        auction.variablePrice = beginPrice
        finalPrice = beginPrice
        const newProductPrice = await Product.findById(auction.productId)
        newProductPrice.basePrice = beginPrice
        newProductPrice.appliedPrice = beginPrice
        await newProductPrice.save()
    }
    if(!beginPrice) {
        finalPrice = auction.beginPrice
    }
    // update product in auction 
    if(productId){
        // check that product is in the auction already
        if(productId.toString() == auction.productId.toString()) {
            return next(new Error('Product is already in the auction', { cause: 400 }))
        }
        // check that product is available
        const newProduct = await Product.findOne({ _id: productId, artistId: _id })
        if (!newProduct) {
            return next(new Error('Product not found', { cause: 404 }))
        }
        // check product is available
        if (newProduct.isAvailable == false) {
            return next(new Error(`${newProduct.title} is not available`, { cause: 404 }))
        }
        // check that product is not in event or auction
        if (newProduct.isEvent == true) {
            return next(new Error(`${newProduct.title} is already in an event`, { cause: 404 }))
        }
        if (newProduct.isAuction == true && productId.toString() != auction.productId.toString()) {
            return next(new Error(`${newProduct.title} is already in another auction`, { cause: 404 }))
        }
        // update delete old product
        const oldProduct = await Product.findById(auction.productId)
        oldProduct.isAuction = false
        oldProduct.basePrice = auction.oldBasePrice
        oldProduct.discount = auction.oldDiscount
        oldProduct.appliedPrice = auction.oldAppliedPrice
        await oldProduct.save()
        // update new product
        auction.oldBasePrice = newProduct.basePrice
        auction.oldDiscount = newProduct.discount
        auction.oldAppliedPrice = newProduct.appliedPrice
        // update new product
        newProduct.isAuction = true
        if(newProduct.discount) newProduct.discount = 0
        newProduct.basePrice = finalPrice
        newProduct.appliedPrice = finalPrice
        await newProduct.save()
        // update auction
        auction.productId = productId
    }
    if(duration){
        const startDate = new Date(auction.beginDate)
        auction.endDate = startDate.getTime() + duration * 24 * 60 * 60 * 1000
        auction.duration = duration
    }
    if(beginDate){
        const startDate = new Date(beginDate)
        auction.beginDate = startDate
        auction.endDate = startDate.getTime() + auction.duration * 24 * 60 * 60 * 1000
    }
    await auction.save()
    res.status(200).json({
        msg: "Auction updated successfully",
        statusCode: 200,
    })
}

export const deleteMyAuction = async (req, res, next)=> {
    // destructe data from artist
    const { _id } = req.authArtist
    const { auctionId } = req.params
    // check auction is found
    const auction = await Auction.findOne({ _id: auctionId, artistId: _id })
    if (!auction) {
        return next(new Error('Auction not found', { cause: 404 }))
    }
    // check that auction is start
    if(auction.status == 'open' || auction.status == 'not-started') {
        if(auction.userIds.length > 0) {
            return next(new Error('Can not delete auction, there is an auction in progress and it has users', { cause: 403 }))
        }
    }
    // update delete old product if there
    const oldProduct = await Product.findById(auction.productId)
    oldProduct.isAuction = false
    oldProduct.basePrice = auction.oldBasePrice
    oldProduct.discount = auction.oldDiscount
    oldProduct.appliedPrice = auction.oldAppliedPrice
    await oldProduct.save()
    // delete auction
    await auction.deleteOne()
    res.status(200).json({
        msg: "Auction deleted successfully",
        statusCode: 200,
    })
}

export const updateAnAuctionByAdmin = async (req, res, next)=> {
    // destructe data from admin
    const { auctionId } = req.params
    const { duration, beginDate, beginPrice, productId } = req.body
    // check auction is found
    const auction = await Auction.findById(auctionId)
    if (!auction) {
        return next(new Error('Auction not found', { cause: 404 }))
    }
    // check that time is still not start
    if(auction.status == 'open' || auction.status == 'closed') {
        return next(new Error('Auction is already started, you can not update on it', { cause: 400 }))
    }
    // set prices
    let finalPrice
    if(beginPrice) {
        auction.beginPrice = beginPrice
        auction.variablePrice = beginPrice
        finalPrice = beginPrice
        const newProductPrice = await Product.findById(auction.productId)
        newProductPrice.basePrice = beginPrice
        newProductPrice.appliedPrice = beginPrice
        await newProductPrice.save()
    }
    if(!beginPrice) {
        finalPrice = auction.beginPrice
    }
    if(productId){
        // check that product is in the auction already
        if(productId.toString() == auction.productId.toString()) {
            return next(new Error('Product is already in the auction', { cause: 400 }))
        }
        // check that product is available
        const newProduct = await Product.findOne({ _id: productId, artistId: auction.artistId })
        if (!newProduct) {
            return next(new Error('Product not found', { cause: 404 }))
        }
        // check product is available
        if (newProduct.isAvailable == false) {
            return next(new Error(`${newProduct.title} is not available`, { cause: 404 }))
        }
        // check that product is not in event or auction
        if (newProduct.isEvent == true) {
            return next(new Error(`${newProduct.title} is already in an event`, { cause: 404 }))
        }
        if (newProduct.isAuction == true && productId.toString() != auction.productId.toString()) {
            return next(new Error(`${newProduct.title} is already another auction`, { cause: 404 }))
        }
        // update delete old product
        const oldProduct = await Product.findById(auction.productId)
        oldProduct.isAuction = false
        oldProduct.basePrice = auction.oldBasePrice
        oldProduct.discount = auction.oldDiscount
        oldProduct.appliedPrice = auction.oldAppliedPrice
        await oldProduct.save()
        // update new product
        auction.oldBasePrice = newProduct.basePrice
        auction.oldDiscount = newProduct.discount
        auction.oldAppliedPrice = newProduct.appliedPrice
        // update new product
        newProduct.isAuction = true
        if(newProduct.discount) newProduct.discount = 0
        newProduct.basePrice = finalPrice
        newProduct.appliedPrice = finalPrice
        await newProduct.save()
        // update auction
        auction.productId = productId
    }
    if(duration){
        const startDate = new Date(auction.beginDate)
        auction.endDate = startDate.getTime() + duration * 24 * 60 * 60 * 1000
        auction.duration = duration
    }
    if(beginDate){
        const startDate = new Date(beginDate)
        auction.beginDate = startDate
        auction.endDate = startDate.getTime() + auction.duration * 24 * 60 * 60 * 1000
    }
    // update auction
    await auction.save()
    res.status(200).json({
        msg: "Auction updated successfully",
        statusCode: 200,
    })
}

export const deleteAnAuctionByAdmin = async (req, res, next)=> {
    const { auctionId } = req.params
    // check auction is found
    const auction = await Auction.findOne({ _id: auctionId })
    if (!auction) {
        return next(new Error('Auction not found', { cause: 404 }))
    }
    // check that auction is start
    if(auction.status == 'open' || auction.status == 'not-started') {
        if(auction.userIds.length > 0) {
            return next(new Error('Can not delete auction, there is an auction in progress and it has users', { cause: 403 }))
        }
    }
    // update delete old product if there
    const oldProduct = await Product.findById(auction.productId)
    oldProduct.isAuction = false
    oldProduct.basePrice = auction.oldBasePrice
    oldProduct.discount = auction.oldDiscount
    oldProduct.appliedPrice = auction.oldAppliedPrice
    await oldProduct.save()
    // delete auction
    await auction.deleteOne()
    res.status(200).json({
        msg: "Auction deleted successfully",
        statusCode: 200,
    })
}

export const viewAuction = async (req, res, next)=> {
    const { auctionId } = req.params
    const auction = await Auction.findOne({_id: auctionId, status: { $in: ['open', 'not-started'] }})
    .populate({path:"productId", select:"-createdAt -updatedAt -__v -folderId"})
    .select("-createdAt -updatedAt -__v -oldBasePrice -oldDiscount -oldAppliedPrice")
    if(!auction) {
        return next(new Error('Auction not found', { cause: 404 }))
    }
    res.status(200).json({
        msg: "Auctions fetched successfully",
        statusCode: 200,
        auction
    })
}

export const requestToJoinAuction = async (req, res, next)=> {
    // destruct data from user
    const { _id } = req.authUser
    const { auctionId } = req.params
    const { shippingAddressId } = req.body
    // check auction is found
    const auction = await Auction.findById(auctionId)
    if (!auction) {
        return next(new Error('Auction not found', { cause: 404 }))
    }
    // check that auction is start
    if(auction.status == "closed") return next(new Error('Auction is finished, you can not request to join it', { cause: 403 }))
    // check user not make twice request for single auction
    const auctionOrder = await AuctionOrder.findOne({userId: _id, auctionId})
    if(auctionOrder) return next(new Error('You have already requested to join this auction', { cause: 403 }))
    // address check
    const user = await User.findById(_id)
    const isAddressValid = user.addresses.find(address => address._id == shippingAddressId)
    if(!isAddressValid) return next (new Error ('Address not found in your profile', { cause: 404 }))
    // create auction request payment
    const auctionPaymnet = await AuctionOrder.create({
        userId: _id,
        auctionId,
        shippingAddressId,
        shippingAddress: {
            alias: isAddressValid.alias,
            street: isAddressValid.street,
            region: isAddressValid.region,
            city: isAddressValid.city,
            country: isAddressValid.country,
            postalCode: isAddressValid.postalCode,
            phone: isAddressValid.phone,
        },
    })
    if(!auctionPaymnet) return next(new Error('Something went wrong, please try again.', { cause: 500 }))
    // update auction
    await auction.save()
    res.status(201).json({
        msg: "Request to join auction added successfully",
        statusCode: 201,
    })
    // to do :
    // . Check link below to pay.\
    // , pay 200 L.E by your credit card\
    // . After payment you will be able to join the auction.\
}

export const payAuction = async (req, res, next)=> {
    // destruct data from user
    const { _id } = req.authUser
    const { auctionId } = req.params
    // check auction is found
    const auction = await Auction.findOne({_id: auctionId, status: { $in: ['open', 'not-started'] }})
    if (!auction) {
        return next(new Error('Auction not found or auction is closed', { cause: 404 }))
    }
    // check that auction order request sent
    const auctionOrder = await AuctionOrder.findOne({userId: _id, auctionId})
    if(!auctionOrder) return next(new Error('You are not request to join this auction, please request to join first', { cause: 403 }))
    if(auctionOrder.paymentStatus == "Paid") return next(new Error('You have already paid for joining this auction', { cause: 403 }))
    // payment object
    const paymentObj = {
        customer_email: req.authUser.email,
        metadata: {auctionOrderID: auctionOrder._id.toString()},
        success_url: `${req.protocol}://${req.headers.host}/orders/sucess-payment/${auctionOrder._id.toString()}`,
        cancel_url: `${req.protocol}://${req.headers.host}/orders/fail-payment/${auctionOrder._id.toString()}`,
    }
    const checkOutSession = await createCheckOutSessionForAuction(paymentObj)
    const payUrl = checkOutSession.url
    auctionOrder.payUrl = payUrl
    await auctionOrder.save()
    res.status(200).json({
        msg: "Check paymnet link below to pay and join the auction",
        statusCode: 200,
        payUrl
    })
}

export const webhookAuction = async (req, res, next) => {
    const sig = req.headers['stripe-signature']
    let event;
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    try {
        event = stripe.webhooks.constructEvent(req.body, sig, process.env.END_POINT_SECRET_AUCTION);
    } catch (err) {
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }
    const { auctionOrderID } = event.data.object.metadata
    // Handle the event
    if(event.type == 'checkout.session.completed') {
        // const checkoutSessionCompleted = event.data.object;
        const auctionOrder = await AuctionOrder.findOneAndUpdate({_id: auctionOrderID}, {paymentStatus: "Paid", payUrl: null})
        const userId = auctionOrder.userId
        const auction = await Auction.findOne({_id: auctionOrder.auctionId})
        auction.userIds.push(userId)
        await auction.save()
        return res.status(200).json({
            msg: "Auction order is paid successfully",
            statusCode: 200,
        })
    }else {
        return res.status(400).json({
            msg: "Something went wrong while paying, please try again.",
            statusCode: 400,
        })
    }
}

export const takePartInAuction = async (req, res, next)=> {
    // destruct data from user
    const { _id } = req.authUser
    const { auctionId } = req.params
    const { variablePrice } = req.body
    // check auction is found
    const auction = await Auction.findOne({_id: auctionId, status: 'open'})
    if (!auction) {
        return next(new Error('Auction not found or auction is closed', { cause: 404 }))
    }
    // check that auction order request sent
    const auctionOrder = await AuctionOrder.findOne({userId: _id, auctionId})
    if(!auctionOrder) return next(new Error
        ('You are not request to join this auction, please request to join first', { cause: 403 }))
    if(auctionOrder.paymentStatus == "Pending") return next(new Error
        ('You dont have paid for joining this auction', { cause: 403 }))
    // check variable price
    if(auction.variablePrice >= variablePrice) return next(new Error
        ('Variable price is not enough, please try with a higher price', { cause: 403 }))
    auction.variablePrice = variablePrice
    auction.heighstPriceId = _id
    await auction.save()
    // socket.io
    getIO().emit('new-price', auction.variablePrice)
    res.status(200).json({ 
        msg: 'New price added successfully',
        statusCode: 200
    })
}