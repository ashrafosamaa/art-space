import Joi from "joi";

export const createAuctionValidator = {
    body: Joi.object({
        duration: Joi.number().required().max(3).min(1),
        beginDate: Joi.date().greater(Date.now()-(24*60*60*1000)).required(),
        beginPrice: Joi.number().required(),
        productId: Joi.string().length(24).hex().required(),
    })
}


export const getProductsWithAuctionValidator = {
    query: Joi.object({
        page: Joi.number().optional(),
        size: Joi.number().optional(),
        sortBy: Joi.string().optional()
    })
}


export const IdValidator = {
    params: Joi.object({
        auctionId: Joi.string().length(24).hex().required()
    })
}


export const requestToJoinAuctionValidator = {
    params: Joi.object({
        auctionId: Joi.string().length(24).hex().required()
    }),
    body: Joi.object({
        shippingAddressId: Joi.string().length(24).hex().required()
    })
}


export const updateAuctionValidator = {
    params: Joi.object({
        auctionId: Joi.string().length(24).hex().required()
    }),
    body: Joi.object({
        duration: Joi.number().optional().max(3).min(1),
        beginDate: Joi.date().greater(Date.now()-(24*60*60*1000)).optional(),
        beginPrice: Joi.number().optional(),
        productId: Joi.string().length(24).hex().optional()
    })
}


export const takePartInAuctionValidator = {
    body: Joi.object({
        variablePrice: Joi.number().required(),
    }),
    params: Joi.object({
        auctionId: Joi.string().length(24).hex().required()
    })
}