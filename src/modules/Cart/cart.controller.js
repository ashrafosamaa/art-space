import Cart from "../../../DB/models/cart.model.js";
import Product from "../../../DB/models/product.model.js";

export const addProductToCart = async (req, res, next) => {
    // destruct data from the user
    const { _id } = req.authUser
    const { productId } = req.body 
    // check that product is found
    const product = await Product.findById(productId)
    if(!product) return next(new Error("Product not found", { cause: 404 }))
    if(product.isAvailable == false) return next(new Error("Product is not available", { cause: 404 }))
    // check that cart is not found
    const userCart = await Cart.findOne({ userId: _id })
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
        const newCart = await Cart.create(cart)
        req.savedDocument = { model: Cart, _id: newCart._id }
        return res.status(201).json({
            msg: "Product added to cart successfully",
            statusCode: 201,
            newCart
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
    // add new product to cart
    if(!isProductsExists){
        userCart.products.push({
            productId,
            basePrice: product.appliedPrice,
            title: product.title
        })
    }
    for (const product of userCart.products) {
        subTotal += product.finalPrice
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


