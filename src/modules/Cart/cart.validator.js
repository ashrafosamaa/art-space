import Joi from "joi";

export const bodyIDValidator = {
    body: Joi.object({
        productId: Joi.string().length(24).hex().required()
    })
}


export const paramsIDValidator = {
    params: Joi.object({
        cartId: Joi.string().length(24).hex().required()
    })
}


export const nothingValidator = {
    body: Joi.object({
        zaza: Joi.string().length(2).optional()
    })
}
