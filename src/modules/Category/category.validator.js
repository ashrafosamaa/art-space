import Joi from "joi";

export const addCategoryValidator = {
    body: Joi.object({
        title: Joi.string().required().min(3)
    })
}


export const getAllCategoriesValidator = {
    query: Joi.object({
        page: Joi.number().optional(),
        size: Joi.number().optional(),
        sortBy: Joi.string().optional()
    })
}


export const IDValidator = {
    params: Joi.object({
        categoryId: Joi.string().length(24).hex().required()
    })
}


export const updateCategoryValidator = {
    params: Joi.object({
        categoryId: Joi.string().length(24).hex().required()
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


export const getProductsInCategoryValidator = {
    query: Joi.object({
        page: Joi.number().optional(),
        size: Joi.number().optional(),
        sortBy: Joi.string().optional()
    }),
    params: Joi.object({
        categoryId: Joi.string().length(24).hex().required()
    })
}