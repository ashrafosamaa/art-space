import {DateTime} from 'luxon'
import { APIFeatures } from "../../utils/api-features.js"
import { confirmPaymentIntent, createCheckOutSession, createPaymentIntent, refundPaymentIntent } from "../../payment-handlers/stripe.js"
import { generateOTP } from "../../utils/generate-unique-string.js"

import User from "../../../DB/models/user.model.js"
import Cart from "../../../DB/models/cart.model.js"
import Order from "../../../DB/models/order.model.js"
import Auction from '../../../DB/models/auction.model.js'
import Product from "../../../DB/models/product.model.js"
import AuctionOrder from '../../../DB/models/auction-payment.model.js'

import Stripe from "stripe";
import createInvoice from "../../utils/invoice-pdf.js"
import sendEmailService from "../../servcies/send-email-service.js"

export const createOrder = async (req, res ,next) => {
    //destruct data from the user
    const { productId, paymentMethod, shippingAddressId } = req.body
    const { _id } = req.authUser
    // user data
    const user = await User.findById(_id)
    // check that address that user insert is valid and found in his addresses
    const isAddressValid = user.addresses.find(address => address._id == shippingAddressId)
    if(!isAddressValid) return next (new Error ('Address not found in your profile', { cause: 404 }))
    // product check
    const isProductAvailable = await Product.findById(productId)
    if(!isProductAvailable) return next (new Error ('Product not found', { cause: 404 }))
    if(isProductAvailable.isAvailable == false) return next (new Error ('Product is not available', { cause: 404 }))
    if(isProductAvailable.isAuction == true) return next (new Error ('Product is not available right now', { cause: 404 }))
    // set orderitems
    let orderItems = [{
        title: isProductAvailable.title,
        basePrice: isProductAvailable.basePrice,
        discount: isProductAvailable.discount,
        appliedPrice: isProductAvailable.appliedPrice,
        product: productId,
    }]
    // prices calculation
    const totalPrice = orderItems[0].appliedPrice
    // order status + paymentmethod
    let orderStatus;
    if(paymentMethod === 'Cash') orderStatus = 'Placed';
    // create order
    const order = await Order.create({
        user: _id,
        orderItems,
        shippingAddressId,
        phoneNumber: user.phoneNumber,
        totalPrice,
        paymentMethod,
        orderStatus,
        shippingAddress: {
            alias: isAddressValid.alias,
            street: isAddressValid.street,
            region: isAddressValid.region,
            city: isAddressValid.city,
            country: isAddressValid.country,
            postalCode: isAddressValid.postalCode ?? null,
            phone: isAddressValid.phone ?? null,
        }
    })
    // save order
    req.savedDocument = { model: Order, _id: order._id }
    // update product stock
    isProductAvailable.isAvailable = false;
    await isProductAvailable.save();
    // create invoice
    const orderCode = `${user.userName}-${generateOTP(3)}`
    // order invoice
    const orderInvoice = {
        name: user.userName,
        postalCode: isAddressValid.postalCode,
        street: isAddressValid.street,
        region: isAddressValid.region,
        city: isAddressValid.city,
        country: isAddressValid.country,
        orderCode,
        date: DateTime.now().toFormat('yyyy-MM-dd HH:mm:ss'),
        items: order.orderItems,
        basePrice: isProductAvailable.basePrice,
        discount: isProductAvailable.discount,
        paidAmount: order.totalPrice,
        subTotal: isProductAvailable.basePrice,
        phone: isAddressValid.phone ?? user.phoneNumber
    }
    await createInvoice(orderInvoice, `${orderCode}.pdf`);
    // send email
    try {
        await sendEmailService({
            to: req.authUser.email,
            subject: 'Order Confirmation',
            message: '<h1>Check your Invoice Confirmation below</h1>',
            attachments: [{path: `./Orders/${orderCode}.pdf`}]
        }) 
    } catch (error) {
        await order.deleteOne();
        isProductAvailable.isAvailable = true;
        await isProductAvailable.save();
        return next(new Error("An error occurred while sending email, plesae try again", { cause: 500 }))
    }
    // send response
    res.status(201).json({
        msg: 'Order created successfully', 
        statusCode: 201,
        order
    })
}

export const convertCartToOrder = async (req, res, next) => {
    //destruct data from the user
    const { paymentMethod, shippingAddressId } = req.body
    const { _id } = req.authUser
    // check that cart is found
    const userCart = await Cart.findOne({userId: _id});
    if(!userCart) return next (new Error ('Cart not found', { cause: 404 }))
    // user data
    const user = await User.findById(_id)
    // check that address that user insert is valid and found in his addresses
    const isAddressValid = user.addresses.find(address => address._id == shippingAddressId)
    if(!isAddressValid) return next (new Error ('Address not found in your profile', { cause: 404 }))
    // set orderitems
    let orderItems = userCart.products.map(cartItem => {
        return{
            title: cartItem.title,
            basePrice: cartItem.basePrice,
            discount: cartItem.discount,
            appliedPrice: cartItem.appliedPrice,
            product: cartItem.productId,
        }
    })
    // check that product is found
    for (const item of orderItems) {
        const isProductAvailable = await Product.findById(item.product)
        if(isProductAvailable.isAvailable == false) return next (new Error ('Product is not available', { cause: 404 }))
    }
    // prices calculation
    let baseTotal = 0
    for (const item of orderItems) {
        baseTotal += item.basePrice
    }
    const totalPrice = userCart.subTotal;
    // order status + paymentmethod
    let orderStatus;
    if(paymentMethod === 'Cash') orderStatus = 'Placed';
    // create order
    const order = await Order.create({
        user: _id,
        orderItems,
        shippingAddressId,
        phoneNumber: user.phoneNumber,
        totalPrice,
        paymentMethod,
        orderStatus,
        shippingAddress: {
            alias: isAddressValid.alias,
            street: isAddressValid.street,
            region: isAddressValid.region,
            city: isAddressValid.city,
            country: isAddressValid.country,
            postalCode: isAddressValid.postalCode ?? null,
            phone: isAddressValid.phone ?? null,
        }
    });
    // save order
    req.savedDocument = { model: Order, _id: order._id }
    // create invoice
    const orderCode = `${user.userName}-${generateOTP(3)}`
    // order invoice
    const orderInvoice = {
        name: user.userName,
        postalCode: isAddressValid.postalCode,
        street: isAddressValid.street,
        region: isAddressValid.region,
        city: isAddressValid.city,
        country: isAddressValid.country,
        orderCode,
        date: DateTime.now().toFormat('yyyy-MM-dd HH:mm:ss'),
        items: order.orderItems,
        basePrice: order.orderItems,
        discount: order.orderItems,
        paidAmount: order.totalPrice,
        subTotal: baseTotal,
        phone: isAddressValid.phone ?? user.phoneNumber
    }
    await createInvoice(orderInvoice, `${orderCode}.pdf`);
    // send email
    try {
        await sendEmailService({
            to: req.authUser.email,
            subject: 'Order Confirmation',
            message: '<h1>Check your Invoice Confirmation below</h1>',
            attachments: [{path: `./Orders/${orderCode}.pdf`}]
        })
        for (const item of orderItems) {
            const isProduct = await Product.findById(item.product)
            isProduct.isAvailable = false;
            await isProduct.save()
        }
        await Cart.findByIdAndDelete({_id: userCart._id});
    } catch (error) {
        await order.deleteOne();
        return next(new Error("An error occurred while sending email, plesae try again", { cause: 500 }))
    }
    // send response
    res.status(201).json({
        msg: 'Order created successfully', 
        statusCode: 201,
        order
    })
}

export const getAllOrdersForAdmin = async (req, res, next) => {
    // destruct data from the user
    const {page, size, sortBy} = req.query
    // check that order is found
    const features = new APIFeatures(req.query, Order.find().select('totalPrice paymentMethod orderStatus'))
    .pagination({page, size})
    .sort(sortBy)
    const orders = await features.mongooseQuery
    if(!orders.length) return next(new Error('Orders not found', { cause: 404 }));
    // send response
    res.status(200).json({
        msg: 'Orders retrieved successfully', 
        statusCode: 200,
        orders
    })
}

export const getMyOrders = async (req, res, next) => {
    // destruct data from the user
    const {_id} = req.authUser
    // check that order is found
    const orders = await Order.find({user: _id}).select('totalPrice paymentMethod orderStatus')
    // check that order is found
    if(!orders.length) return next(new Error('Orders not found', { cause: 404 }));
    // send response
    res.status(200).json({
        msg: 'Orders retrieved successfully', 
        statusCode: 200,
        orders
    })
}

export const getOrderById = async (req, res, next) => {
    // destruct data from the user
    const {_id} = req.authUser
    const {orderId} = req.params;
    // check that order is found
    const order = await Order.findOne({_id: orderId, user: _id})
    // check that order is found
    if(!order) return next(new Error('Order not found', { cause: 404 }));
    // send response
    res.status(200).json({
        msg: 'Orders retrieved successfully', 
        statusCode: 200,
        order
    })
}

export const requestToRefundOrder = async (req, res, next)=> {
    // destruct data from the user
    const{orderId} = req.params
    const {_id} = req.authUser
    // check that order is found
    const findOrder = await Order.findOne({_id: orderId, refundRequest: false, user: _id})
    if(!findOrder) return next (new Error('Order not found or cannot be refunded', {cause: 404}))
    if(findOrder.orderStatus != 'Paid' && findOrder.orderStatus != 'Received') return next( new Error
        ('Order cannot be refunded, you can cancel it', {cause: 404}))
    // check time
    if(findOrder.orderStatus == 'Received'){
        const now = DateTime.now()
        const receivedAt = DateTime.fromFormat(findOrder.receivedAt, 'yyyy-MM-dd HH:mm:ss')
        if(receivedAt.plus({days: 14}) <= now) return next(new Error
            ('Order cannot be refunded, because you received it before 14 days or more', { cause: 404 }))
    }
    // update order
    findOrder.refundRequest = true
    // save order
    // await findOrder.save()
    // send response
    res.status(200).json({
        msg: 'Your request has been sent successfully',
        statusCode: 200,
    })
}

export const cancelMyOrder = async (req, res, next) => {
    // destruct data from the user
    const{orderId} = req.params
    const {_id} = req.authUser
    // check that order is found
    const findOrder = await Order.findOne({_id: orderId, user: _id})
    if(!findOrder) return next (new Error('Order not found or cannot be canceled', {cause: 404}))
    // update order
    if(findOrder.orderStatus != 'Placed' && findOrder.orderStatus != 'Pending') return next(new Error('Order cannot be cancelled', { cause: 404 }));
    // save order
    findOrder.orderStatus = 'Cancelled';
    findOrder.cancelledAt = DateTime.now().toFormat('yyyy-MM-dd HH:mm:ss')
    await findOrder.save();
    // send response
    res.status(200).json({
        msg: 'Order cancelled successfully',
        statusCode: 200,
    })
}

export const updateOrderStatusFirst = async (req, res, next) => {
    // destruct data from the tracker
    const {orderId} = req.params;
    // check that order is found
    const order = await Order.findById(orderId);
    // check that order is found
    if(!order) return next(new Error('Order not found', { cause: 404 }))
    if(order.orderStatus == 'Paid') return next(new Error('Order already paid', { cause: 404 }))
    if(order.orderStatus != 'Pending') return next(new Error('Order cannot be updated to paid', { cause: 404 }))
    order.orderStatus = 'Paid'
    order.paidAt = DateTime.now().toFormat('yyyy-MM-dd HH:mm:ss')
    // update order
    await order.save()
    // send response
    res.status(200).json({
        msg: 'Order status updated successfully', 
        statusCode: 200,
    })
}

export const updateOrderStatusSecond = async (req, res, next) => {
    // destruct data from the trcker
    const {orderId} = req.params;
    // check that order is found
    const order = await Order.findById(orderId);
    // check that order is found
    if(!order) return next(new Error('Order not found', { cause: 404 }))
    if(order.orderStatus == 'Delivered') return next(new Error('Order already delevering now', { cause: 404 }))
    if(order.orderStatus != 'Paid' && order.orderStatus != 'Placed') return next(new Error('Order cannot be delivered right now', { cause: 404 }))
    order.orderStatus = 'Delivered'
    order.deliveredAt = DateTime.now().toFormat('yyyy-MM-dd HH:mm:ss')
    // update order
    await order.save()
    // send response
    res.status(200).json({
        msg: 'Order status updated successfully', 
        statusCode: 200,
    })
}

export const updateOrderStatusThird = async (req, res, next) => {
    // destruct data from the user
    const {orderId} = req.params;
    const {status} = req.body;
    if(status != 'Cancelled' && status != 'Received') return next(new Error('Invalid status', { cause: 400 }));
    // check that order is found
    const order = await Order.findById(orderId);
    // check that order is found
    if(!order) return next(new Error('Order not found', { cause: 404 }));
    if(order.orderStatus == 'Cancelled') return next(new Error('Order already cancelled', { cause: 404 }));
    if(order.orderStatus == 'Received') return next(new Error('Order already received', { cause: 404 }));
    if(status == 'Cancelled') {
        if(order.orderStatus != 'Placed' || order.orderStatus != 'Pending') return next(new Error('Order cannot be cancelled', { cause: 404 }))
        order.orderStatus = 'Cancelled'
        order.cancelledAt = DateTime.now().toFormat('yyyy-MM-dd HH:mm:ss')
    }
    if(status == 'Received') {
        if(order.orderStatus != 'Delivered') return next(new Error('Order cannot updated to received', { cause: 404 }))
        order.orderStatus = 'Received'
        order.receivedAt = DateTime.now().toFormat('yyyy-MM-dd HH:mm:ss')
    }
    await order.save()
    // send response
    res.status(200).json({
        msg: 'Order status updated successfully', 
        statusCode: 200,
    })
}

export const stripePay = async (req, res, next)=> {
    // destruct data from the user
    const {_id} = req.authUser
    const {orderId}= req.params;
    // check that order is found
    const order = await Order.findOne({_id: orderId, user: _id, orderStatus: 'Pending'});
    if(!order) return next(new Error('Order not found', { cause: 404 }))
    // check out data
    const paymnetObj = {
        customer_email: req.authUser.email,
        metadata: {orderId: order._id.toString()},
        success_url: `${req.protocol}://${req.headers.host}/orders/sucess-payment/${order._id.toString()}`,
        cancel_url: `${req.protocol}://${req.headers.host}/orders/fail-payment/${order._id.toString()}`,
        line_items: order.orderItems.map(item=>{
            return{
                price_data:{
                    currency: 'EGP',
                    product_data:{
                        name: item.title
                    },
                    unit_amount: item.appliedPrice * 100
                },
                quantity: 1,
            }
        })
    }
    // pay
    const checkOutSession = await createCheckOutSession(paymnetObj)
    const payUrl = checkOutSession.url
    order.payUrl = payUrl
    const paymentIntent = await createPaymentIntent({amount: order.totalPrice, currency: 'EGP'})
    order.payment_intent = paymentIntent.id;
    await order.save()
    // send response
    res.status(200).json({
        msg: 'Click the link to pay for the order', 
        statusCode: 200,
        payUrl,
    })
}

export const webhookOrder = async (req, res, next) => {
    const sig = req.headers['stripe-signature']
    let event;
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    try {
        event = stripe.webhooks.constructEvent(req.body, sig, process.env.END_POINT_SECRET_ORDER);
    } catch (err) {
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }
    const { orderId } = event.data.object.metadata
    // Handle the event
    if(event.type == 'checkout.session.completed') {
        // const checkoutSessionCompleted = event.data.object;
        const confirmedOrder = await Order.findById(orderId)
        await confirmPaymentIntent({paymentIntentId: confirmedOrder.payment_intent});

        confirmedOrder.payUrl = null
        confirmedOrder.orderStatus = "Paid"
        confirmedOrder.paidAt = DateTime.now().toFormat('yyyy-MM-dd HH:mm:ss')
        await confirmedOrder.save()

        return res.status(200).json({
            msg: "Order paid successfully",
            statusCode: 200,
        })
    }else {
        return res.status(400).json({
            msg: "Something went wrong while paying, please try again.",
            statusCode: 400,
        })
    }
}

export const refundOrder = async (req, res, next) => {
    // destruct data from the user
    const{orderId} = req.params
    // check that order is found
    const findOrder = await Order.findOne({_id: orderId, orderStatus: 'Paid', refundRequest: true})
    if(!findOrder) return next(new Error('Order not found or cannot be refunded', { cause: 404 }))
    // refund the payment intent
    const refund = await refundPaymentIntent({paymentIntentId: findOrder.payment_intent});
    // update order
    findOrder.orderStatus = 'Refunded';
    findOrder.refundRequest = false;
    findOrder.refundedAt = DateTime.now().toFormat('yyyy-MM-dd HH:mm:ss');
    // update products in order to be available
    findOrder.orderItems.forEach(async product => {
        const updateProduct = await Product.findByIdAndUpdate(product.product, {isAvailable: true}, {new: true})
        await updateProduct.save()
    })
    // save order
    await findOrder.save();
    // send response
    res.status(200).json({
        msg: 'Order refunded successfully',
        statusCode: 200,
    })
}

export const auctionToWinnerByAdmin = async (req, res, next) => {
    // destruct data from the admin
    const {auctionId} = req.params
    // check that auction is found
    const findAuction = await Auction.findById(auctionId)
    if(!findAuction) return next(new Error('Auction not found', { cause: 404 }))
    // check that auction is not ended
    if(findAuction.status != 'closed') return next(new Error('Auction is still not ended', { cause: 404 }))
    if(!findAuction.winnerId && findAuction.status == 'closed') return next(new Error('Auction has no winner', { cause: 404 }))
    const auctionOrder = await AuctionOrder.findOne({auctionId, userId: findAuction.winnerId})
    if(!auctionOrder) return next(new Error('Auction order not found', { cause: 404 }))
    // create order
    const user = await User.findById(findAuction.winnerId)
    const userAddress = user.addresses.find(address => address._id == auctionOrder.shippingAddressId.toString())
    if(!userAddress) return next (new Error ('Address not found in your profile', { cause: 404 }))
    // set orderitems
    const product = await Product.findById(findAuction.productId)
    let orderItems = [{
        title: product.title,
        basePrice: findAuction.variablePrice,
        discount: 0,
        appliedPrice: findAuction.variablePrice,
        product: findAuction.productId,
    }]
    const totalPrice = orderItems[0].appliedPrice
    const order = await Order.create({
        user: findAuction.winnerId,
        orderItems,
        shippingAddressId: auctionOrder.shippingAddressId,
        phoneNumber: user.phoneNumber,
        totalPrice,
        paymentMethod: 'Cash',
        orderStatus: 'Placed',
        shippingAddress: {
            alias: userAddress.alias,
            street: userAddress.street,
            region: userAddress.region,
            city: userAddress.city,
            country: userAddress.country,
            postalCode: userAddress.postalCode ?? null,
            phone: userAddress.phone ?? null,
        }
    })
    // create invoice
    const orderCode = `${user.userName}-${generateOTP(3)}`
    // order invoice
    const orderInvoice = {
        name: user.userName,
        postalCode: userAddress.postalCode,
        street: userAddress.street,
        region: userAddress.region,
        city: userAddress.city,
        country: userAddress.country,
        orderCode,
        date: DateTime.now().toFormat('yyyy-MM-dd HH:mm:ss'),
        items: order.orderItems,
        basePrice: order.totalPrice,
        discount: 0,
        paidAmount: order.totalPrice,
        subTotal: order.totalPrice,
        phone: userAddress.phone ?? user.phoneNumber
    }
    await createInvoice(orderInvoice, `${orderCode}.pdf`);
    product.isAvailable = false;
    await product.save();
    // send email
    try {
        await sendEmailService({
            to: user.email,
            subject: 'Order Confirmation, Congratulation you win the auction',
            message: '<h1>Check your Invoice Confirmation below</h1>',
            attachments: [{path: `./Orders/${orderCode}.pdf`}]
        }) 
    } catch (error) {
        await order.deleteOne();
        product.isAvailable = true;
        await product.save();
        return next(new Error("An error occurred while sending email, plesae try again", { cause: 500 }))
    }
    // send response
    res.status(201).json({
        msg: 'Order created successfully', 
        statusCode: 201,
        order
    })
}
