import Joi from "joi";

export const createEventValidator = {
    body: Joi.object({
        title: Joi.string().required().min(3).max(100),
        description: Joi.string().required().min(50).max(400),
        startAt: Joi.date().greater(Date.now()-(24*60*60*1000)).required(),
        duration: Joi.number().required(),
        productIds: Joi.array().items(Joi.string().length(24).hex()).required(),
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
