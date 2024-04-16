import Joi from "joi";

export const createAdminValidator = {
    body: Joi.object({
        nId: Joi.string().required().length(14).pattern(/^[0-9]+$/, "i")
        .messages({
            'string.pattern.base': 'National ID must contain only 14 numbers'
        }),
        userName : Joi.string().required().min(5),
        name: Joi.string().required().min(3),
        password: Joi.string().required().min(8)
        .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[#@$!%*?&])[A-Za-z\d#@$!%*?&]{8,}$/, "i")
        .messages({
            'string.pattern.base': 'Password must contain at least one lowercase letter, one uppercase letter, one digit, and one special character'
        }),
        passwordConfirm: Joi.string().required().valid(Joi.ref('password')),
        phoneNumber: Joi.string().required().length(11).pattern(/^[0-9]+$/, "i"),
        gender: Joi.string().optional().valid('male', 'female').default('male'),
        role: Joi.string().required().valid('it', 'tracker'),
    })
}


export const loginValidator = {
    body: Joi.object({
        userName : Joi.string().required().min(5),
        password: Joi.string().required().min(8),
    })
}


export const getAllAdminsValidator = {
    query: Joi.object({
        page: Joi.number().optional(),
        size: Joi.number().optional(),
        sortBy: Joi.string().optional()
    })
}


export const IDValidator = {
    params: Joi.object({
        adminId: Joi.string().length(24).hex().required()
    })
}


export const updateAdminValidator = {
    params: Joi.object({
        adminId: Joi.string().length(24).hex().required()
    }),
    body: Joi.object({
        name: Joi.string().optional().min(3),
        phoneNumber: Joi.string().optional().length(11).pattern(/^[0-9]+$/, "i"),
        gender: Joi.string().optional().valid('male', 'female'),
        role: Joi.string().optional().valid('it', 'tracker'),
    })
}


export const searchValidator = {
    query: Joi.object({
        page: Joi.number().optional(),
        size: Joi.number().optional(),
        sortBy: Joi.string().optional(),
        userName: Joi.string().optional(),
        name: Joi.string().optional(),
        nId: Joi.string().optional().pattern(/^[0-9]+$/, "i"),
        phoneNumber: Joi.string().optional().pattern(/^[0-9]+$/, "i"),
        gender: Joi.string().optional().valid('male', 'female'),
        role: Joi.string().optional().valid('it', 'tracker'),
    })
}


export const noValidator = {
    body: Joi.object({
        Ay_7aga_Yasa7y: Joi.string().optional()
    })
}


export const updateAdminProfileValidator = {
    body: Joi.object({
        name: Joi.string().optional().min(3),
        phoneNumber: Joi.string().optional().length(11).pattern(/^[0-9]+$/, "i"),
        gender: Joi.string().optional().valid('male', 'female'),
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


export const updateProfileImgValidator = {
    body: Joi.object({
        oldPublicId: Joi.string().required()
    })
}