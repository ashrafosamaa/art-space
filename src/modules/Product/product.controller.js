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
        return res.status(404).json({
            msg: "Category not found"
        })
    }
    // check that style is found
    const style = await Style.findById(styleId)
    if(!style){
        return res.status(404).json({
            msg: "Style not found"
        })
    }
    // check that subject is found
    const subject = await Subject.findById(subjectId)
    if(!subject){
        return res.status(404).json({
            msg: "Subject not found"
        })
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
        return res.status(400).json({
            msg: "Cover Image are required"
        })
    }
    if(!req.files.Images?.length){
        return res.status(400).json({
            msg: "Images are required"
        })
    }
    // cover image
    let coverImage
    const folderId = generateUniqueString(4)
    const folder = artist.profileImg.public_id.split(`${artist.folderId}/`)[0]
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
    res.status(201).json({ message: 'Product created successfully' })
}

export const getAllProducts = async (req, res, next) => {
    const {page, size, sortBy} = req.query
    const features = new APIFeatures(req.query, Product.find()
    .select("-createdAt -updatedAt -__v -basePrice -images -folderId"))
        .pagination({page, size})
        .sort(sortBy)
    const products = await features.mongooseQuery
    if(!products.length) {
        return res.status(404).json({
            msg: "No products found"
        })
    }
    res.status(200).json({
        msg: "Products fetched successfully",
        products
    })
}

export const getProductById = async (req, res, next)=> {
    const product = await Product.findById(req.params.productId).select("-createdAt -updatedAt -__v -basePrice -folderId")
    if(!product){
        return res.status(404).json({
            msg: "Product not found"
        })
    }
    res.status(200).json({
        msg: "Product fetched successfully",
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
        return res.status(404).json({
            msg: "Product not found"
        })
    }
    // check that category is found
    if(categoryId){
        const category = await Category.findById(categoryId)
        if(!category){
            return res.status(404).json({
                msg: "Category not found"
            })
        }
    }
    // check that style is found
    if(styleId){
        const style = await Style.findById(styleId)
        if(!style){
            return res.status(404).json({
                msg: "Style not found"
            })
        }
    }
    // check that subject is found
    if(subjectId){
        const subject = await Subject.findById(subjectId)
        if(!subject){
            return res.status(404).json({
                msg: "Subject not found"
            })
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
        product
    })
}

export const deleteProduct = async (req, res, next)=> {
    const { productId } = req.params
    const product = await Product.findByIdAndDelete(productId)
    const artist = await Artist.findById(product.artistId)
    if(!product){
        return res.status(404).json({
            msg: "Product not found"
        })
    }

    // delete folder
    const folder = `${process.env.MAIN_FOLDER}/Artists/${artist.folderId}/Products/${product.folderId}`
    await cloudinaryConnection().api.delete_resources_by_prefix(folder)
    await cloudinaryConnection().api.delete_folder(folder)
    // send response
    res.status(200).json({
        msg: "Product deleted successfully"
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
        return res.status(404).json({
            msg: "No products found"
        })
    }
    res.status(200).json({
        msg: "Products fetched successfully",
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
        return res.status(404).json({
            msg: "Product not found"
        })
    }
    if(product.artistId.toString() != _id.toString()){
        return res.status(403).json({
            msg: "Access denied"
        })
    }
    // check that category is found
    if(categoryId){
        const category = await Category.findById(categoryId)
        if(!category){
            return res.status(404).json({
                msg: "Category not found"
            })
        }
    }
    // check that style is found
    if(styleId){
        const style = await Style.findById(styleId)
        if(!style){
            return res.status(404).json({
                msg: "Style not found"
            })
        }
    }
    // check that subject is found
    if(subjectId){
        const subject = await Subject.findById(subjectId)
        if(!subject){
            return res.status(404).json({
                msg: "Subject not found"
            })
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
        return res.status(404).json({
            msg: "Product not found"
        })
    }
    if(product.artistId.toString() != _id.toString()){
        return res.status(403).json({
            msg: "Access denied"
        })
    }
    // get artist 
    const artist = await Artist.findById(_id)

    if(!req.file || product.coverImage.public_id != oldPublicId){
        return res.status(404).json({
            msg: "Cover image hasn't uploaded"
        })
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
        return res.status(404).json({
            msg: "Product not found"
        })
    }
    if(product.artistId.toString() != _id.toString()){
        return res.status(403).json({
            msg: "Access denied"
        })
    }
    // get artist 
    const artist = await Artist.findById(_id)
    let index
    index = product.images.findIndex(img => img.public_id.toString() == oldPublicId.toString())
    if(index == -1){
        return res.status(404).json({
            msg: "Select Image please"
        })
    }
    if(!req.file){
        return res.status(404).json({
            msg: "Image not sent"
        })
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
        product
    })
}

export const deleteMyProduct = async (req, res, next)=> {
    // destruct data from artist
    const { _id } = req.authArtist
    const { productId } = req.params
    const product = await Product.findByIdAndDelete(productId)
    const artist = await Artist.findById(_id)
    if(!product){
        return res.status(404).json({
            msg: "Product not found"
        })
    }
    if(product.artistId.toString() != _id.toString()){
        return res.status(403).json({
            msg: "Access denied"
        })
    }
    // delete folder
    const folder = `${process.env.MAIN_FOLDER}/Artists/${artist.folderId}/Products/${product.folderId}`
    await cloudinaryConnection().api.delete_resources_by_prefix(folder)
    await cloudinaryConnection().api.delete_folder(folder)
    // send response
    res.status(200).json({
        msg: "Product deleted successfully"
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
        return res.status(404).json({
            msg: "No products found"
        })
    }
    res.status(200).json({
        msg: "Products fetched successfully",
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
        return res.status(404).json({
            msg: "No products found"
        })
    }
    res.status(200).json({
        msg: "Products fetched successfully",
        products
    })
}
