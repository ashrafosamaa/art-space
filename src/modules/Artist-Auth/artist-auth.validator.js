import Joi from "joi";

export const signupValidator = {
    body: Joi.object({
        artistName : Joi.string().required().min(3),
        email: Joi.string().email().required(),
        password: Joi.string().required().min(8)
        .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[#@$!%*?&])[A-Za-z\d#@$!%*?&]{8,}$/, "i")
        .messages({
            'string.pattern.base': 'Password must contain at least one lowercase letter, one uppercase letter, one digit, and one special character'
        }),
        passwordConfirm: Joi.string().required().valid(Joi.ref('password')),
        phoneNumber: Joi.string().required().length(11).pattern(/^[0-9]+$/, "i"),
        gender: Joi.string().optional().valid('male', 'female').default('male'),
        alias: Joi.string().optional(),
        street: Joi.string().optional(),
        region: Joi.string().optional(),
        city: Joi.string().optional(),
        country: Joi.string().optional(),
        postalCode: Joi.string().optional().pattern(/^[0-9]+$/, "i"),
        phone: Joi.string().optional().pattern(/^[0-9]+$/, "i"),
    })
}


export const verifyEmailValidator = {
    body: Joi.object({
        activateCode : Joi.string().required().length(4),
        email: Joi.string().email().required(),
    })
}


export const signinValidator = {
    body: Joi.object({
        password: Joi.string().required().min(8),
        email: Joi.string().email().required(),
    })
}


export const forgetPasswordValidator = {
    body: Joi.object({
        email: Joi.string().email().required(),
    })
}


export const verifyCodeValidator = {
    body: Joi.object({
        resetCode : Joi.string().required().length(4),
        email: Joi.string().email().required(),
    })
}


export const resetPasswordValidator = {
    body: Joi.object({
        password: Joi.string().required().min(8)
        .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[#@$!%*?&])[A-Za-z\d#@$!%*?&]{8,}$/, "i")
        .messages({
            'string.pattern.base': 'Password must contain at least one lowercase letter, one uppercase letter, one digit, and one special character'
        }),
        passwordConfirm: Joi.string().required().valid(Joi.ref('password')),
        email: Joi.string().email().required(),
    })
}


export const resendCodeValidator = {
    body: Joi.object({
        email: Joi.string().email().required(),
    })
}