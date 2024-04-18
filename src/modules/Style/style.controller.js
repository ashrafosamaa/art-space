import { APIFeatures } from "../../utils/api-features.js";

import Style from "../../../DB/models/style.model.js";
import Product from "../../../DB/models/product.model.js";

import slugify from "slugify";

export const addStyle = async (req, res, next)=> {
    // destruct data from req.body
    const {title} = req.body
    // check name
    const isNameExist = await Style.findOne({ title })
    if(isNameExist) return next(new Error('This title is already exist, Please try another title', { cause: 409 }))
    // slug
    const slug = slugify(title, '-')
    // create new style
    const styleCreated = (await Style.create({ title, slug }))
    // rollback saved document
    req.savedDocument = {model: Style, _id: styleCreated._id}
    if (!styleCreated) {
        return next(new Error('Error while adding Style', { cause: 500 }))
    }
    // io
    getIO().emit('new', 'refresh')
    // send response
    res.status(201).json({
        msg: "Style created successfully",
        statusCode: 201
    })
}

export const getAllStyles = async (req, res, next)=> {
    // destruct data from req.query
    const {page, size, sortBy} = req.query
    const features = new APIFeatures(req.query, Style.find().select("-createdAt -updatedAt -__v"))
    .pagination({page, size})
    .sort(sortBy)
    const styles = await features.mongooseQuery
    if(!styles.length) {
        return next(new Error('No Styles found', { cause: 404 }))
    }
    res.status(200).json({
        msg: "Styles fetched successfully",
        statusCode: 200,
        styles
    })
}

export const getStyleById = async (req, res, next)=> {
    // destruct data from req.params
    const {styleId} = req.params
    const style = await Style.findById(styleId).select("-createdAt -updatedAt -__v")
    if(!style) {
        return next(new Error('No Style found', { cause: 404 }))
    }
    res.status(200).json({ 
        msg: "Style fetched successfully", 
        statusCode: 200,
        style 
    })
}

export const updateStyle = async (req, res, next)=> {
    // destruct data from ceo
    const {styleId} = req.params
    const {title} = req.body
    // check name
    const isNameExist = await Style.findOne({title, _id: {$ne: styleId}})
    if(isNameExist) return next(new Error('This title is already exist, Please try another title', { cause: 409 }))
    // slug
    const slug = slugify(title, '-')
    // update Style
    const styleUpdated = await Style.findByIdAndUpdate(styleId, {title, slug}, {new: true}).select("-createdAt -updatedAt -__v")
    if (!styleUpdated) {
        return next(new Error('Error while updating Style', { cause: 500 }))
    }
    // io
    getIO().emit('new', 'refresh')
    // send response
    res.status(200).json({
        msg: "Style updated successfully",
        statusCode: 200,
        styleUpdated
    })
}

export const deleteStyle = async (req, res, next)=> {
    // destruct data from ceo
    const {styleId} = req.params
    // delete Style
    const styleDeleted = await Style.findByIdAndDelete(styleId)
    if (!styleDeleted) {
        return next(new Error('Error while deleting Style', { cause: 500 }))
    }
    // io
    getIO().emit('new', 'refresh')
    // send response
    res.status(200).json({
        msg: "Style deleted successfully",
        statusCode: 200
    })
}

export const search = async (req, res, next)=> {
    // destruct data from req.query
    const {page, size, sortBy, ...serach} = req.query
    const features = new APIFeatures(req.query, Style.find().select("-createdAt -updatedAt -__v"))
    .pagination({page, size})
    .searchCategories(serach)
    .sort(sortBy)
    const styles = await features.mongooseQuery
    if(!styles.length) {
        return next(new Error('No Styles found', { cause: 404 }))
    }
    res.status(200).json({ 
        msg: "Style fetched successfully", 
        statusCode: 200,
        styles 
    })
}

export const getProductsInStyle = async (req, res, next)=> {
    // destruct data from user
    const {styleId} = req.params
    const {page, size, sortBy} = req.query
    const features = new APIFeatures(req.query, Product.find({styleId}).select("-createdAt -updatedAt -__v -basePrice -images -folderId"))
    .pagination({page, size})
    .sort(sortBy)
    const products = await features.mongooseQuery
    if(!products.length) {
        return next(new Error('No products found', { cause: 404 }))
    }
    res.status(200).json({ 
        msg: "Products fetched successfully", 
        statusCode: 200, 
        products
    })
}

export const getProductsWithStyle = async (req, res, next)=> {
    // destruct data from user
    const {page, size, sortBy} = req.query
    const features = new APIFeatures(req.query, Style.find()
    .select('-createdAt -updatedAt -__v')
    .populate([{
        path: 'products',
        select: '-createdAt -updatedAt -__v '}])) 
    .pagination({page, size})
    .sort(sortBy)
    const styles = await features.mongooseQuery
    if(!styles.length) {
        return next(new Error('No styles found', { cause: 404 }))
    }
    res.status(200).json({ 
        msg: "Styles and Products fetched successfully", 
        statusCode: 200, 
        styles
    })
} 