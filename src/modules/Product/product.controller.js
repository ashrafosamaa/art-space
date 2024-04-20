import { APIFeatures } from "../../utils/api-features.js";
import { generateUniqueString } from "../../utils/generate-unique-string.js";

import Product from "../../../DB/models/product.model.js";
import Artist from "../../../DB/models/artist.model.js";
import Category from "../../../DB/models/category.model.js";
import Style from "../../../DB/models/style.model.js";
import Subject from "../../../DB/models/subject.model.js";

import slugify from "slugify";
import cloudinaryConnection from "../../utils/cloudinary.js";

export const addProduct = async (req, res, next)=> {
    // destruct data from user
    const { title, description, basePrice, discount, material, depth, height, width, categoryId, styleId, subjectId } = req.body
    const artistId = req.authArtist._id
    // check that category is found
    const category = await Category.findById(categoryId)
    if(!category){
        return next(new Error('Category not found', { cause: 404 }))
    }
    // check that style is found
    const style = await Style.findById(styleId)
    if(!style){
        return next(new Error('Style not found', { cause: 404 }))
    }
    // check that subject is found
    const subject = await Subject.findById(subjectId)
    if(!subject){
        return next(new Error('Subject not found', { cause: 404 }))
    }
    const artist = await Artist.findById(artistId)
    // slug
    const slug = slugify(title, {lower: true, replacement: '-'})
    // price calculation
    const appliedPrice = basePrice - (basePrice * ((discount || 0) / 100))
    // size
    const size = `${height}h x ${width}w x ${depth}d`
    // check images
    if(!req.files.Cover){
        return next(new Error('Cover Image is required', { cause: 400 }))
    }
    if(!req.files.Images?.length){
        return next(new Error('Images are required', { cause: 400 }))
    }
    // cover image
    let coverImage
    const folderId = generateUniqueString(4)
    let folder
    if(artist.profileImg.public_id){
        folder = artist.profileImg.public_id.split(`${artist.folderId}/`)[0]
    }
    else if(!artist.profileImg.public_id){
        folder = `${process.env.MAIN_FOLDER}/Artists/`
    }
    if(req.files.Cover){
        const { secure_url, public_id } = await cloudinaryConnection().uploader.upload(req.files.Cover[0].path, {
            folder: folder + `${artist.folderId}` + `/Products/${folderId}/Cover`
        })
        coverImage = { secure_url, public_id }
        req.folder = folder + `${artist.folderId}` + `/Products/${folderId}/Cover`
    }
    // images 
    let images = []
    if(req.files.Images){
        for (const file of req.files.Images) {
            const { secure_url, public_id } = await cloudinaryConnection().uploader.upload(file.path, {
                folder: folder + `${artist.folderId}` + `/Products/${folderId}/Images`
            })
            images.push({ secure_url, public_id })
        }
        req.folder = folder + `${artist.folderId}` + `/Products/${folderId}/Images`
    }
    // product
    const product = {
        title, description, slug, folderId, basePrice, discount, appliedPrice,
        artistId, categoryId, styleId, subjectId, images, coverImage, material, depth, height, width, size
    }
    const newProduct = await Product.create(product)
    req.savedDocument = { model: Product, _id: newProduct._id }
    // send response
    res.status(201).json({
        msg: 'Product created successfully',
        statusCode: 201,
    })
}

export const getAllProducts = async (req, res, next) => {
    const {page, size, sortBy} = req.query
    const features = new APIFeatures(req.query, Product.find({ isEvent: false })
    .select("-createdAt -updatedAt -__v -basePrice -images -folderId"))
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

export const getProductsWithAuction = async (req, res, next)=> {
    // destruct data from artist
    const {page, size, sortBy} = req.query
    const features = new APIFeatures(req.query, Product.find({ isAuction: true })
    .select("-createdAt -updatedAt -__v -basePrice -images -folderId"))
    .pagination({page, size})
    .sort(sortBy)
    const products = await features.mongooseQuery
    if(!products.length) {
        return next(new Error('No events found', { cause: 404 }))
    }
    res.status(200).json({
        msg: "Products fetched successfully",
        statusCode: 200,
        products
    })
}

export const getProductById = async (req, res, next)=> {
    const product = await Product.findById(req.params.productId).select("-createdAt -updatedAt -__v -basePrice -folderId")
    if(!product){
        return next(new Error("Product not found", { cause: 404 }))
    }
    res.status(200).json({
        msg: "Product fetched successfully",
        statusCode: 200,
        product
    })
}

export const updateProduct = async (req, res, next)=> {
    // destruct data from artist
    const {productId} = req.params
    const { title, description, basePrice, discount, material, depth, height, width, categoryId, styleId, subjectId } = req.body
    // check that product is found
    const product = await Product.findById(productId).select("-createdAt -updatedAt -__v -basePrice -folderId")
    if(!product){
        return next(new Error("Product not found", { cause: 404 }))
    }
    // check that category is found
    if(categoryId){
        const category = await Category.findById(categoryId)
        if(!category){
            return next(new Error("Category not found", { cause: 404 }))
        }
    }
    // check that style is found
    if(styleId){
        const style = await Style.findById(styleId)
        if(!style){
            return next(new Error("Style not found", { cause: 404 }))
        }
    }
    // check that subject is found
    if(subjectId){
        const subject = await Subject.findById(subjectId)
        if(!subject){
            return next(new Error("Subject not found", { cause: 404 }))
        }
    }
    if(title){
        product.title = title
        product.slug = slugify(title, {lower: true, replacement: '-'})
    }
    if(description) product.description = description
    if(material) product.material = material

    if(depth) product.depth = depth
    if(height) product.height = height
    if(width) product.width = width

    if(discount) product.discount = discount
    if(basePrice) product.basePrice = basePrice

    await product.save()

    product.size = `${product.height}h x ${product.width}w x ${product.depth}d`
    product.appliedPrice = product.basePrice - (product.basePrice * ((product.discount || 0) / 100))

    // send response
    await product.save()
    res.status(200).json({
        msg: "Product updated successfully",
        statusCode: 200,
        product
    })
}

export const deleteProduct = async (req, res, next)=> {
    const { productId } = req.params
    const product = await Product.findById(productId)
    if(!product){
        return next(new Error("Product not found", { cause: 404 }))
    }
    const artist = await Artist.findById(product.artistId)
    if(product.isEvent == true) {
        return next(new Error("Cannot delete this product, please remove it from event first", { cause: 400 }))
    }

    // delete folder
    const folder = `${process.env.MAIN_FOLDER}/Artists/${artist.folderId}/Products/${product.folderId}`
    await cloudinaryConnection().api.delete_resources_by_prefix(folder)
    await cloudinaryConnection().api.delete_folder(folder)
    await product.deleteOne()
    // send response
    res.status(200).json({
        msg: "Product deleted successfully",
        statusCode: 200
    })
}

export const getMyProducts = async (req, res, next)=> {
    const { _id } = req.authArtist
    const { page, size, sortBy } = req.query
    const features = new APIFeatures(req.query, Product.find({artistId: _id})
    .select("-createdAt -updatedAt -__v -basePrice -folderId -images"))
        .pagination({ page, size })
        .sort(sortBy)
    const products = await features.mongooseQuery
    if(!products.length) {
        return next (new Error ("No products found", { cause: 404 }))
    }
    res.status(200).json({
        msg: "Products fetched successfully",
        statusCode: 200,
        products
    })
}

export const updateMyProduct = async (req, res, next)=> {
    // destruct data from artist
    const { _id } = req.authArtist
    const { productId } = req.params
    const { title, description, basePrice, discount, material, depth, height, width, categoryId, styleId, subjectId } = req.body
    // check that product is found
    const product = await Product.findById(productId).select("-createdAt -updatedAt -__v -basePrice -folderId")
    if(!product){
        return next(new Error("Product not found", { cause: 404 }))
    }
    if(product.artistId.toString() != _id.toString()){
        return next (new Error("Unauthorized", { cause: 401 }))
    }
    // check that category is found
    if(categoryId){
        const category = await Category.findById(categoryId)
        if(!category){
            return next (new Error("Category not found", { cause: 404 }))
        }
    }
    // check that style is found
    if(styleId){
        const style = await Style.findById(styleId)
        if(!style){
            return next (new Error("Style not found", { cause: 404 }))
        }
    }
    // check that subject is found
    if(subjectId){
        const subject = await Subject.findById(subjectId)
        if(!subject){
            return next (new Error("Subject not found", { cause: 404 }))
        }
    }
    if(title){
        product.title = title
        product.slug = slugify(title, {lower: true, replacement: '-'})
    }
    if(description) product.description = description
    if(material) product.material = material

    if(depth) product.depth = depth
    if(height) product.height = height
    if(width) product.width = width

    if(discount) product.discount = discount
    if(basePrice) product.basePrice = basePrice
    
    await product.save()

    product.size = `${product.height}h x ${product.width}w x ${product.depth}d`
    product.appliedPrice = product.basePrice - (product.basePrice * ((product.discount || 0) / 100))

    // send response
    await product.save()
    res.status(200).json({
        msg: "Product updated successfully",
        statusCode: 200,
        product
    })
}

export const updateCoverImg = async (req, res, next)=> {
    // destruct data from artist
    const { _id } = req.authArtist
    const { productId } = req.params
    const {oldPublicId} = req.body
    // check that product is found
    const product = await Product.findById(productId).select("-createdAt -updatedAt -__v -basePrice -images")
    if(!product){
        return next(new Error("Product not found", { cause: 404 }))
    }
    if(product.artistId.toString() != _id.toString()){
        return next (new Error("Access denied", { cause: 403 }))
    }
    // get artist 
    const artist = await Artist.findById(_id)

    if(!req.file || product.coverImage.public_id != oldPublicId){
        return next(new Error("Cover image not found", { cause: 404 }))
    }
    // cover image
    const newPublicId = oldPublicId.split(`${artist.folderId}/Products/${product.folderId}/Cover`)[1]
    const { secure_url, public_id } = await cloudinaryConnection().uploader.upload(req.file.path, {
        folder: `${process.env.MAIN_FOLDER}/Artists/${artist.folderId}/Products/${product.folderId}/Cover`,
        public_id: newPublicId
    })
    product.coverImage.secure_url = secure_url
    product.coverImage.public_id = public_id
    // save product data
    await product.save()
    // send response
    res.status(200).json({
        msg: "Cover image updated successfully",
        statusCode: 200,
        product
    })
}

export const updateSpecificImg = async (req, res, next)=> {
    // destruct data from artist
    const { _id } = req.authArtist
    const { productId } = req.params
    const {oldPublicId} = req.body
    // check that product is found
    const product = await Product.findById(productId).select("-createdAt -updatedAt -__v -basePrice")
    if(!product){
        return next(new Error('Product not found', { cause: 404 }))
    }
    if(product.artistId.toString() != _id.toString()){
        return next(new Error('Access denied', { cause: 403 }))
    }
    // get artist 
    const artist = await Artist.findById(_id)
    let index
    index = product.images.findIndex(img => img.public_id.toString() == oldPublicId.toString())
    if(index == -1){
        return next(new Error('Image not found', { cause: 404 }))
    }
    if(!req.file){
        return next(new Error('Image hasn\'t uploaded', { cause: 404 }))
    }
    await cloudinaryConnection().uploader.destroy(oldPublicId)
    const newPublicId = oldPublicId.split(`${artist.folderId}/Products/${product.folderId}/Images`)[1]
    const { secure_url, public_id } = await cloudinaryConnection().uploader.upload(req.file.path, {
        folder: `${process.env.MAIN_FOLDER}/Artists/${artist.folderId}/Products/${product.folderId}/Images`,
        public_id: newPublicId
    })
    product.images[index].secure_url = secure_url
    product.images[index].public_id = public_id
    // save product data
    await product.save()
    // send response
    res.status(200).json({
        msg: "Selected image updated successfully",
        statusCode: 200,
        product
    })
}

export const deleteMyProduct = async (req, res, next)=> {
    // destruct data from artist
    const { _id } = req.authArtist
    const { productId } = req.params
    const product = await Product.findById(productId)
    const artist = await Artist.findById(_id)
    if(!product){
        return next(new Error("Product not found", { cause: 404 }))
    }
    if(product.artistId.toString() != _id.toString()){
        return next(new Error("Access denied", { cause: 403 }))
    }
    if(product.isEvent == true) {
        return next(new Error("Cannot delete this product, please remove it from event first", { cause: 400 }))
    }
    // delete folder
    const folder = `${process.env.MAIN_FOLDER}/Artists/${artist.folderId}/Products/${product.folderId}`
    await cloudinaryConnection().api.delete_resources_by_prefix(folder)
    await cloudinaryConnection().api.delete_folder(folder)
    await product.deleteOne()
    // send response
    res.status(200).json({
        msg: "Product deleted successfully",
        statusCode: 200
    })
}

export const search = async (req, res, next)=> {
    const { page, size, sortBy, ...search } = req.query
    const features = new APIFeatures(req.query, Product.find()
    .select("-createdAt -updatedAt -__v -images -folderId"))
        .pagination({ page, size })
        .sort(sortBy)
        .searchProduct(search)
    const products = await features.mongooseQuery
    if(!products.length) {
        return next(new Error("No products found", { cause: 404 }))
    }
    res.status(200).json({
        msg: "Products fetched successfully",
        statusCode: 200,
        products
    })
}

export const filterProducts = async (req, res, next)=> {
    const { page, size, sortBy, ...search } = req.query
    const features = new APIFeatures(req.query, Product.find()
    .select("-createdAt -updatedAt -__v -images -folderId"))
        .pagination({page, size})
        .sort(sortBy)
        .filterProducts(search)
    const products = await features.mongooseQuery
    if(!products.length) {
        return next(new Error("No products found", { cause: 404 }))
    }
    res.status(200).json({
        msg: "Products fetched successfully",
        statusCode: 200,
        products
    })
}
