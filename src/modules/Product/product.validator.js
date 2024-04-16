import Joi from "joi";

export const addProductValidator = {
    body: Joi.object({
        title: Joi.string().required().min(3).max(100),
        description: Joi.string().required().min(50).max(400),
        basePrice: Joi.number().required(),
        discount: Joi.number().optional(),
        material: Joi.string().required(),
        depth: Joi.number().required(),
        height: Joi.number().required(),
        width: Joi.number().required(),
        categoryId: Joi.string().length(24).hex().required(),
        styleId: Joi.string().length(24).hex().required(),
        subjectId: Joi.string().length(24).hex().required()
    })
}


export const getAllProductsValidator = {
    query: Joi.object({
        page: Joi.number().optional(),
        size: Joi.number().optional(),
        sortBy: Joi.string().optional()
    })
}


export const IDValidator = {
    params: Joi.object({
        productId: Joi.string().length(24).hex().required()
    })
}


export const updateProductValidator = {
    body: Joi.object({
        title: Joi.string().optional().min(3).max(100),
        description: Joi.string().optional().min(50).max(400),
        basePrice: Joi.number().optional(),
        discount: Joi.number().optional(),
        material: Joi.string().optional(),
        depth: Joi.number().optional(),
        height: Joi.number().optional(),
        width: Joi.number().optional(),
        categoryId: Joi.string().length(24).hex().optional(),
        styleId: Joi.string().length(24).hex().optional(),
        subjectId: Joi.string().length(24).hex().optional()
    }),
    params: Joi.object({
        productId: Joi.string().length(24).hex().required()
    })
}


export const changeCoverImgValidator = {
    body: Joi.object({
        oldPublicId: Joi.string().required()
    }),
    params: Joi.object({
        productId: Joi.string().length(24).hex().required()
    })
}


export const search = {
    query: Joi.object({
        page: Joi.number().optional(),
        size: Joi.number().optional(),
        sortBy: Joi.string().optional(),
        title: Joi.string().optional().min(3).max(100),
        material: Joi.string().optional(),
        slug: Joi.string().optional().min(3).max(100),
        appliedPrice: Joi.number().optional(),
        discount: Joi.number().optional(),
        priceFrom: Joi.number().optional(),
        priceTo: Joi.number().optional(),
        isAvailable: Joi.boolean().optional(),
        artistId: Joi.string().length(24).hex().optional(),
        depth: Joi.number().optional(),
        height: Joi.number().optional(),
        width: Joi.number().optional(),
        size: Joi.string().optional(),
    })
}


export const filter = {
    page: Joi.number().optional(),
    size: Joi.number().optional(),
    sortBy: Joi.string().optional(),
    categoryId: Joi.string().length(24).hex().optional(),
    styleId: Joi.string().length(24).hex().optional(),
    subjectId: Joi.string().length(24).hex().optional()
}