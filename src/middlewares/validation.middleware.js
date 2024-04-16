const reqKeys = ['query', 'body', 'params', 'headers'];
export const validationMiddleware = (schema) => {
    return (req, res, next) => {
        let validationErrorArr = []
        for (const key of reqKeys) {
            const validationResult = schema[key]?.validate(req[key], { abortEarly: false })
            if (validationResult?.error) {
                validationErrorArr.push(...validationResult.error.details)
            }
        }
        if (validationErrorArr.length) {
            return res.status(400).json({
                err_msg: "validation error",
                errors: validationErrorArr.map(ele => ele.message)
            })
        }
        next()
    }
}
