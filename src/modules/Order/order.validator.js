import Joi from "joi";

export const createOrderValidator = {
    body: Joi.object({
        productId: Joi.string().length(24).hex().required(),
        shippingAddressId: Joi.string().length(24).hex().required(),
        paymentMethod: Joi.string().valid('Cash', 'Visa').required()
    })
}


export const convertCartToOrderValidator = {
    body: Joi.object({
        shippingAddressId: Joi.string().length(24).hex().required(),
        paymentMethod: Joi.string().valid('Cash', 'Visa').required()
    })
}


export const getOrdersValidator = {
    query: Joi.object({
        page: Joi.number().optional(),
        size: Joi.number().optional(),
        sortBy: Joi.string().optional()
    })
}


export const noValidator = {
    body: Joi.object({
        zaza: Joi.string().length(2).optional()
    })
}


export const IDValidator = {
    params: Joi.object({
        orderId: Joi.string().length(24).hex().required()
    })
}