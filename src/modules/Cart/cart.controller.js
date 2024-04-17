import Cart from "../../../DB/models/cart.model.js"
import Product from "../../../DB/models/product.model.js"

export const addProductToCart = async (req, res, next) => {
    // destruct data from the user
    const { _id } = req.authUser
    const { productId } = req.body
    // check that product is found
    const product = await Product.findById(productId)
    if(!product) return next(new Error("Product not found", { cause: 404 }))
    if(product.isAvailable == false) return next(new Error("Product is not available", { cause: 404 }))
    // check that cart is not found
    const userCart = await Cart.findOne({ userId: _id }).select("-createdAt -updatedAt -__v")
    if (!userCart) {
        const cart = {
            userId: _id,
            products: [
                {
                    productId,
                    basePrice: product.appliedPrice,
                    title: product.title
                }
            ],
            subTotal: product.appliedPrice
        }
        const newCart = (await Cart.create(cart))
        req.savedDocument = { model: Cart, _id: newCart._id }
        return res.status(201).json({
            msg: "Product added to cart successfully",
            statusCode: 201,
            cartData
        })
    }
    // add new product to cart
    let isProductsExists = false
    let subTotal = 0
    for (const product of userCart.products) {
        if(product.productId == productId){
            isProductsExists = true
        }
    }
    if(isProductsExists){
        return res.status(200).json({
            msg: "Product already exists in your cart",
            statusCode: 200
        })
    }
    // add new product to cart
    if(!isProductsExists){
        userCart.products.push({
            productId,
            basePrice: product.appliedPrice,
            title: product.title
        })
    }
    for (const product of userCart.products) {
        subTotal += product.basePrice
    }
    userCart.subTotal = subTotal
    await userCart.save()
    // send response
    res.status(201).json({
        msg: "Product added to cart successfully",
        statusCode: 201,
        userCart
    })
}

export const getCart = async (req, res, next) => {
    // destruct data from the user
    const { _id } = req.authUser
    // check that cart is found
    const userCart = await Cart.findOne({ userId: _id }).select("-createdAt -updatedAt -__v")
    if (!userCart) return next(new Error("Cart not found", { cause: 404 }))
    // send response
    res.status(200).json({
        msg: "Cart fetched successfully", 
        statusCode: 200, 
        userCart 
    })
}

export const removeProductFromCart = async (req, res, next)=> {
    // destruct data from the user
    const { _id } = req.authUser
    const { productId } = req.body
    // check that cart is found
    const userCart = await Cart.findOne({ userId: _id, 'products.productId': productId }).select("-createdAt -updatedAt -__v")
    if(!userCart) return next(new Error("Product not found", { cause: 404 }))
    // remove product from cart
    userCart.products = userCart.products.filter(product => product.productId != productId)
    // update cost of cart
    let subTotal = 0
    for (const product of userCart.products) {
        subTotal += product.basePrice
    }
    userCart.subTotal = subTotal
    const newCart = await userCart.save()
    // check that cart is empty
    if(newCart.products.length == 0) {
        await newCart.deleteOne()
        return res.status(200).json({
            msg: "Cart is empty now, please add new product",
            statusCode: 200
        })
    }
    res.status(200).json({ 
        msg: "Product removed from cart successfully", 
        statusCode: 200, 
        userCart 
    })
}

export const deleteCart = async (req, res, next)=> {
    // destruct data from the user
    const { _id } = req.authUser
    const { cartId } = req.params
    // check that cart is found
    const userCart = await Cart.findOne({_id: cartId, userId: _id})
    if(!userCart) return next(new Error("Cart not found", { cause: 404 }))
    // delete cart
    await userCart.deleteOne()
    res.status(200).json({ 
        msg: "Cart deleted successfully", 
        statusCode: 200
    })
}
