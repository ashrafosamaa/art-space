import { generateOTP } from "../../utils/generate-unique-string.js"
import {DateTime} from 'luxon'

import Order from "../../../DB/models/order.model.js"
import Product from "../../../DB/models/product.model.js"
import User from "../../../DB/models/user.model.js"

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
        price: isProductAvailable.appliedPrice,
        product: productId
    }]
    // prices calculation
    const discount = isProductAvailable.discount
    const totalPrice = orderItems[0].price
    // order status + paymentmethod
    let orderStatus;
    if(paymentMethod === 'Cash') orderStatus = 'Placed';
    // create order
    const order = new Order({
        user: _id,
        orderItems,
        shippingAddressId,
        phoneNumber: user.phoneNumber,
        totalPrice,
        paymentMethod,
        orderStatus,
        discount,
        shippingAddress: {
            alias: isAddressValid.alias,
            street: isAddressValid.street,
            region: isAddressValid.region,
            city: isAddressValid.city,
            country: isAddressValid.country,
            postalCode: isAddressValid.postalCode,
            phone: isAddressValid.phone,
        }
    })
    // save order
    await order.save();
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
        discount: order.discount,
        paidAmount: order.totalPrice,
        phone: isAddressValid.phone ?? user.phoneNumber
    }
    await createInvoice(orderInvoice, `${orderCode}.pdf`);
    // send email
    try {
        await sendEmailService({
            to: req.authUser.email,
            subject: 'Order Confirmation',
            message: '<h1>Check your Invoice Confirmation below</h1>',
            attachments: [{path: `./Files/${orderCode}.pdf`}]
        })
    } catch (error) {
        await order.deleteOne();
        isProductAvailable.isAvailable = true;
        await isProductAvailable.save();
        return next(new Error("An error occurred while sending email", { cause: 500 }))
    }
    // send response
    res.status(201).json({
        msg: 'Order created successfully', 
        statusCode: 201,
        order
    })
}
