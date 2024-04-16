import jwt from 'jsonwebtoken'
import Admin from '../../DB/models/admin.model.js'

export const authAdmin = (accessRoles = "ceo") => {
    return async (req, res, next) => {
        try {
            const { accesstoken } = req.headers
            if (!accesstoken) return next(new Error('Please login first', { cause: 400 }))

            if (!accesstoken.startsWith(process.env.TOKEN_PREFIX)) return next(new Error('Invalid token prefix', { cause: 400 }))

            const token = accesstoken.split(process.env.TOKEN_PREFIX)[1]

            const decodedData = jwt.verify(token, process.env.JWT_SECRET_LOGIN)
            
            if (!decodedData || !decodedData.id) return next(new Error('Invalid token payload', { cause: 400 }))
            
            // admin check 
            const findAdmin = await Admin.findById(decodedData.id, 'name email role')
            if (!findAdmin) return next(new Error('Please signUp first', { cause: 404 }))
            // auhtorization
            if (!accessRoles.includes(findAdmin.role)) return next(new Error('Unauthorized', { cause: 401 }))
            req.authAdmin = findAdmin
            next()
        } catch (error) {
            console.log(error);
            next(new Error('catch error in auth middleware', { cause: 500 }))
        }
    }
}

