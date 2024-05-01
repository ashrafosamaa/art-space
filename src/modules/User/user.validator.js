import Joi from "joi";

export const getAllUsersValidator = {
    query: Joi.object({
        page: Joi.number().optional(),
        size: Joi.number().optional(),
        sortBy: Joi.string().optional()
    })
}


export const IDValidator = {
    params: Joi.object({
        userId: Joi.string().length(24).hex().required()
    })
}


export const noValidator = {
    body: Joi.object({
        zaza: Joi.string().length(2).optional()
    })
}


export const searchValidator = {
    query: Joi.object({
        page: Joi.number().optional(),
        size: Joi.number().optional(),
        userName: Joi.string().optional(),
        email: Joi.string().optional(),
        phoneNumber: Joi.string().optional().pattern(/^[0-9]+$/, "i"),
        gender: Joi.string().optional()
    })
}


export const updateUserValidator = {
    params: Joi.object({
        userId: Joi.string().length(24).hex().required()
    }),
    body: Joi.object({
        userName : Joi.string().optional().min(3),
        phoneNumber: Joi.string().optional().length(11).pattern(/^[0-9]+$/, "i"),
    })
}


export const updateByUserValidator = {
    body: Joi.object({
        userName : Joi.string().optional().min(3),
        phoneNumber: Joi.string().optional().length(11).pattern(/^[0-9]+$/, "i"),
    })
}


export const updatePasswordValidator = { 
    body: Joi.object({
        oldPassword: Joi.string().required().min(8),
        password: Joi.string().required().min(8)
        .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[#@$!%*?&])[A-Za-z\d#@$!%*?&]{8,}$/, "i")
        .messages({
            'string.pattern.base': 'Password must contain at least one lowercase letter, one uppercase letter, one digit, and one special character'
        }),
        passwordConfirm: Joi.string().required().valid(Joi.ref('password')),
    })
}


export const updateProfilePictureValidator = {
    body: Joi.object({
        oldPublicId: Joi.string().required()
    })
}


export const addUserAddressValidator = {
    body: Joi.object({
        alias: Joi.string().required(),
        street: Joi.string().required(),
        region: Joi.string().required(),
        city: Joi.string().required(),
        country: Joi.string().required(),
        postalCode: Joi.string().optional().pattern(/^[0-9]+$/, "i"),
        phone: Joi.string().optional().pattern(/^[0-9]+$/, "i"),
    })
}


export const addressIdValidator = {
    params: Joi.object({
        addressId: Joi.string().length(24).hex().required()
    })
}