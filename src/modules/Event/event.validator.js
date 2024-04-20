import Joi from "joi";

export const createEventValidator = {
    body: Joi.object({
        title: Joi.string().required().min(3).max(100),
        description: Joi.string().required().min(50).max(400),
        startAt: Joi.date().greater(Date.now()-(24*60*60*1000)).required(),
        duration: Joi.number().required().max(14),
        productIds: Joi.array().items(Joi.string().length(24).hex().required()).required(),
    })
}


export const getEventsValidator = {
    query: Joi.object({
        page: Joi.number().optional(),
        size: Joi.number().optional(),
        sortBy: Joi.string().optional()
    })
}


export const getEventValidator = {
    params: Joi.object({
        eventId: Joi.string().length(24).hex().required()
    })
}


export const updateEventValidator = {
    body: Joi.object({
        title: Joi.string().optional().min(3).max(100),
        description: Joi.string().optional().min(50).max(400),
        startAt: Joi.date().greater(Date.now()-(24*60*60*1000)).optional(),
        duration: Joi.number().optional().max(14),
    }),
    params: Joi.object({
        eventId: Joi.string().length(24).hex().required()
    })
}


export const noValidators = {
    body: Joi.object({
        zaza: Joi.string().length(2).optional()
    })
}


export const editProductsInEventValidator = {
    params: Joi.object({
        eventId: Joi.string().length(24).hex().required()
    }),
    body: Joi.object({
        productIds: Joi.array().items(Joi.string().length(24).hex().required()).required(),
    })
}


export const searchValidator = {
    query: Joi.object({
        page: Joi.number().optional(),
        size: Joi.number().optional(),
        sortBy: Joi.string().optional(),
        title: Joi.string().optional().max(100),
        description: Joi.string().optional().max(400),
        artistId: Joi.string().length(24).hex().optional(),
    })
}


export const filterValidator = {
    query: Joi.object({
        page: Joi.number().optional(),
        size: Joi.number().optional(),
        sortBy: Joi.string().optional(),
        dateFrom: Joi.date().optional(),
        dateTo: Joi.date().optional(),
        duration: Joi.number().optional()
    })
}