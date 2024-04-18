import { APIFeatures } from "../../utils/api-features.js";
import { getIO } from "../../utils/io-generation.js";

import Category from "../../../DB/models/category.model.js";
import Product from "../../../DB/models/product.model.js";

import slugify from "slugify"; 

export const addCategory = async (req, res, next)=> {
    // destruct data from req.body
    const {title} = req.body
    // check name
    const isNameExist = await Category.findOne({title})
    if(isNameExist) return next(new Error('This title is already exist, Please try another title', { cause: 409 }))
    // slug
    const slug = slugify(title, '-')
    // create new category
    const newCategory = { title, slug }
    const categoryCreated = (await Category.create(newCategory))
    // rollback saved document
    req.savedDocument = {model: Category, _id: categoryCreated._id}
    if (!categoryCreated) {
        return next(new Error('Error while adding Category', { cause: 500 }))
    }
    // io
    getIO().emit('new', 'refresh')
    // send response
    res.status(201).json({
        msg: "Category created successfully",
        statusCode: 201
    })
}

export const getAllCategories = async (req, res, next)=> {
    // destruct data from req.query
    const {page, size, sortBy} = req.query
    const features = new APIFeatures(req.query, Category.find().select("-createdAt -updatedAt -__v"))
    .pagination({page, size})
    .sort(sortBy)
    const category = await features.mongooseQuery
    if(!category.length) {
        return next(new Error('No categories found', { cause: 404 }))
    }
    res.status(200).json({ 
        msg: "Category fetched successfully", 
        statusCode: 200, 
        category 
    })
}

export const getCategoryById = async (req, res, next)=> {
    // destruct data from req.params
    const {categoryId} = req.params
    const category = await Category.findById(categoryId).select("-createdAt -updatedAt -__v")
    if(!category) {
        return next(new Error('No category found', { cause: 404 }))
    }
    res.status(200).json({ 
        msg: "Category fetched successfully", 
        statusCode: 200, 
        category
    })
}

export const updateCategory = async (req, res, next)=> {
    // destruct data from ceo
    const {categoryId} = req.params
    const {title} = req.body
    // check name
    const isNameExist = await Category.findOne({title, _id: {$ne: categoryId}})
    if(isNameExist) return next(new Error('This title is already exist, Please try another title', { cause: 409 }))
    // slug
    const slug = slugify(title, '-')
    // update category
    const categoryUpdated = await Category.findByIdAndUpdate(categoryId, {title, slug}, {new: true}).select("-createdAt -updatedAt -__v")
    if (!categoryUpdated) {
        return next(new Error('Error while updating Category', { cause: 500 }))
    }
    // io
    getIO().emit('new', 'refresh')
    // send response
    res.status(200).json({
        msg: "Category updated successfully",
        statusCode: 200,
        categoryUpdated
    })
}

export const deleteCategory = async (req, res, next)=> {
    // destruct data from ceo
    const {categoryId} = req.params
    // delete category
    const categoryDeleted = await Category.findByIdAndDelete(categoryId)
    if (!categoryDeleted) {
        return next(new Error('Error while deleting Category', { cause: 500 }))
    }
    // io
    getIO().emit('new', 'refresh')
    // send response
    res.status(200).json({
        msg: "Category deleted successfully",
        statusCode: 200
    })
}

export const search = async (req, res, next)=> {
    // destruct data from req.query
    const {page, size, sortBy, ...serach} = req.query
    const features = new APIFeatures(req.query, Category.find().select("-createdAt -updatedAt -__v"))
    .pagination({page, size})
    .searchCategories(serach)
    .sort(sortBy)
    const category = await features.mongooseQuery
    if(!category.length) {
        return next(new Error('No category found', { cause: 404 }))
    }
    res.status(200).json({
        msg: "Category fetched successfully",
        statusCode: 200,
        category 
    })
}

export const getProductsInCategory = async (req, res, next)=> {
    // destruct data from user
    const {categoryId} = req.params
    const {page, size, sortBy} = req.query
    const features = new APIFeatures(req.query, Product.find({categoryId}).select("-createdAt -updatedAt -__v -basePrice -images -folderId"))
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

export const getProductsWithCategory = async (req, res, next)=> {
    // destruct data from user
    const {page, size, sortBy} = req.query
    const features = new APIFeatures(req.query, Category.find()
    .select('-createdAt -updatedAt -__v')
    .populate([{
        path: 'products',
        select: '-createdAt -updatedAt -__v '}])) 
    .pagination({page, size})
    .sort(sortBy)
    const categories = await features.mongooseQuery
    if(!categories.length) {
        return next(new Error('No categories found', { cause: 404 }))
    }
    res.status(200).json({ 
        msg: "Categories and Products fetched successfully", 
        statusCode: 200, 
        categories
    })
} 
