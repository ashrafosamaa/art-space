import { APIFeatures } from "../../utils/api-features.js";
import { getIO } from "../../utils/io-generation.js";


import Subject from "../../../DB/models/subject.model.js";
import Product from "../../../DB/models/product.model.js";

import slugify from "slugify";

export const addSubject = async (req, res, next)=> {
    // destruct data from req.body
    const {title} = req.body
    // check name
    const isNameExist = await Subject.findOne({ title })
    if(isNameExist) return next(new Error('This title is already exist, Please try another title', { cause: 409 }))
    // slug
    const slug = slugify(title, '-')
    // create new subject
    const subjectCreated = (await Subject.create({ title, slug }))
    // rollback saved document
    req.savedDocument = {model: Subject, _id: subjectCreated._id}
    if (!subjectCreated) {
        return next(new Error('Error while adding Subject', { cause: 500 }))
    }
    // io
    getIO().emit('new', 'refresh')
    // send response
    res.status(201).json({
        msg: "Subject created successfully",
        statusCode: 201
    })
}

export const getAllSubjects = async (req, res, next)=> {
    // destruct data from req.query
    const subjects = await Subject.find()
    if(!subjects.length) {
        return next(new Error('No Subjects found', { cause: 404 }))
    }
    res.status(200).json({ 
        msg: "Subjects fetched successfully", 
        statusCode: 200, 
        subjects 
    })
}

export const getSubjectById = async (req, res, next)=> {
    // destruct data from req.params
    const {subjectId} = req.params
    const subject = await Subject.findById(subjectId).select("-createdAt -updatedAt -__v")
    if(!subject) {
        return next(new Error('No Subject found', { cause: 404 }))
    }
    res.status(200).json({ 
        msg: "Subject fetched successfully", 
        statusCode: 200,
        subject 
    })
}

export const updateSubject = async (req, res, next)=> {
    // destruct data from ceo
    const {subjectId} = req.params
    const {title} = req.body
    // check name
    const isNameExist = await Subject.findOne({title, _id: {$ne: subjectId}})
    if(isNameExist) return next(new Error('This title is already exist, Please try another title', { cause: 409 }))
    // slug
    const slug = slugify(title, '-')
    // update Subject
    const subjectUpdated = await Subject.findByIdAndUpdate(subjectId, {title, slug}, {new: true}).select("-createdAt -updatedAt -__v")
    if (!subjectUpdated) {
        return next(new Error('Error while updating Subject', { cause: 500 }))
    }
    // io
    getIO().emit('new', 'refresh')
    // send response
    res.status(200).json({
        msg: "Subject updated successfully",
        statusCode: 200,
        subjectUpdated
    })
}

export const deleteSubject = async (req, res, next)=> {
    // destruct data from ceo
    const {subjectId} = req.params
    // delete Subject
    const subjectDeleted = await Subject.findByIdAndDelete(subjectId)
    if (!subjectDeleted) {
        return next(new Error('Error while deleting Subject', { cause: 500 }))
    }
    // io
    getIO().emit('new', 'refresh')
    // send response
    res.status(200).json({
        msg: "Subject deleted successfully",
        statusCode: 200,
    })
}

export const search = async (req, res, next)=> {
    // destruct data from req.query
    const {...serach} = req.query
    const features = new APIFeatures(req.query, Subject.find().select("-createdAt -updatedAt -__v"))
    .searchCategories(serach)
    const subjects = await features.mongooseQuery
    if(!subjects.length) {
        return next(new Error('No Subjects found', { cause: 404 }))
    }
    res.status(200).json({
        msg: "Subject fetched successfully", 
        statusCode: 200,
        subjects 
    })
}

export const getProductsInSubject = async (req, res, next)=> {
    // destruct data from user
    const {subjectId} = req.params
    const {page, size, sortBy} = req.query
    const features = new APIFeatures(req.query, Product.find({subjectId}).select("-createdAt -updatedAt -__v -basePrice -images -folderId"))
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

export const getProductsWithSubject = async (req, res, next)=> {
    // destruct data from user
    const {page, size, sortBy} = req.query
    const features = new APIFeatures(req.query, Subject.find()
    .select('-createdAt -updatedAt -__v')
    .populate([{
        path: 'products',
        select: '-createdAt -updatedAt -__v '}])) 
    .pagination({page, size})
    .sort(sortBy)
    const subjects = await features.mongooseQuery
    if(!subjects.length) {
        return next(new Error('No subjects found', { cause: 404 }))
    }
    res.status(200).json({ 
        msg: "Subjects and Products fetched successfully", 
        statusCode: 200, 
        subjects
    })
}