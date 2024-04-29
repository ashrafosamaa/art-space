import Joi from "joi";

export const createOrderValidator = {
    body: Joi.object({
        productId: Joi.string().length(24).hex().required(),
        shippingAddressId: Joi.string().length(24).hex().required(),
        paymentMethod: Joi.string().valid('Cash', 'Visa').required()
    })
}