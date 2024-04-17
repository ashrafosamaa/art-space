import Joi from "joi";

export const addSubjectValidator = {
    body: Joi.object({
        title: Joi.string().required().min(3)
    })
}


export const getAllSubjectsValidator = {
    query: Joi.object({
        page: Joi.number().optional(),
        size: Joi.number().optional(),
        sortBy: Joi.string().optional()
    })
}


export const IDValidator = {
    params: Joi.object({
        subjectId: Joi.string().length(24).hex().required()
    })
}


export const updateSubjectValidator = {
    params: Joi.object({
        subjectId: Joi.string().length(24).hex().required()
    }),
    body: Joi.object({
        title: Joi.string().required().min(3)
    })
}


export const searchValidator = {
    query: Joi.object({
        page: Joi.number().optional(),
        size: Joi.number().optional(),
        sortBy: Joi.string().optional(),
        title: Joi.string().optional(),
        slug: Joi.string().optional()
    })
}


export const getProductsInSubjectValidator = {
    query: Joi.object({
        page: Joi.number().optional(),
        size: Joi.number().optional(),
        sortBy: Joi.string().optional()
    }),
    params: Joi.object({
        subjectId: Joi.string().length(24).hex().required()
    })
}