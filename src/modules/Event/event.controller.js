import {APIFeatures} from "../../utils/api-features.js";

import Event from "../../../DB/models/event.model.js";
import Product from "../../../DB/models/product.model.js";

import slugify from "slugify"; 


export const createEvent = async (req, res, next) => {
    // destruct data from artist
    const { _id } = req.authArtist
    const { title, description, productIds, duration, startAt } = req.body
    // check if event already exist
    const isEvent = await Event.findOne({ title, artistId: _id })
    if (isEvent) {
        return next(new Error("Event title already exist, please try new one", { cause: 409 }))
    }
    // check products avaliability
    const products = await Product.find({ _id: { $in: productIds } })
    for (const product of products) {
        if(product.artistId.toString() !== _id.toString()) {
            return next(new Error(`You are not authorized to add ${product.title} to your event`, { cause: 404 }))
        }
        if(product.isAvailable == false) {
            return next(new Error(`${product.title} is not available`, { cause: 404 }))
        }
        if(product.isAuction == true) {
            return next(new Error(`${product.title} is also in an auction`, { cause: 404 }))
        }
        if(product.isEvent == true) {
            return next(new Error(`${product.title} is also in an event`, { cause: 404 }))
        }
    }
    if (products.length !== productIds.length) {
        return next(new Error("A Product is not found", { cause: 404 }))
    }
    const slug = slugify( title, '-' )
    // set duration and end date
    const startDate = new Date(startAt)
    const endAt = startDate.getTime() + duration * 24 * 60 * 60 * 1000
    // create event
    const event = new Event({
        title,
        slug,
        description,
        productIds,
        duration,
        startAt,
        endAt,
        artistId: _id
    })
    await event.save()
    for (const product of products) {
        product.isEvent = true
        product.eventId = event._id
        await product.save()
    }
    // send response
    res.status(201).json({
        msg: "Event created successfully",
        statusCode: 201
    })
}

export const getEvent = async (req, res, next) => {
    // destruct data from user 
    const { _id } = req.authUser
    const { eventId } = req.params
    const event = await Event.findOne({_id: eventId, status: 'open'})
    .populate({path:"productIds", select:"-createdAt -updatedAt -__v -viewrsId"})
    .select("-createdAt -updatedAt -__v")
    if(!event) {
        return next(new Error('No event found', { cause: 404 }))
    }
    // check that it's first time for this user
    const isFirstTime = !event.viewrsIds.includes(_id)
    if(isFirstTime) {
        event.viewrsIds.push(_id)
        event.views += 1
        await event.save()
    }
    // send response
    res.status(200).json({
        msg: "Event fetched successfully",
        statusCode: 200,
        event
    })
}

export const getEvents = async (req, res, next) => {
    // destruct data from req.query
    const {page, size, sortBy} = req.query
    const features = new APIFeatures(req.query, Event.find().select("-createdAt -updatedAt -__v -productIds"))
    .pagination({page, size})
    .sort(sortBy)
    const events = await features.mongooseQuery
    if(!events.length) {
        return next(new Error('No events found', { cause: 404 }))
    }
    res.status(200).json({
        msg: "Events fetched successfully",
        statusCode: 200,
        events
    })
}

export const getAllMyEvents = async (req, res, next)=> {
    // destruct data from artist
    const { _id } = req.authArtist
    const {page, size, sortBy} = req.query
    const features = new APIFeatures(req.query, Event.find({ artistId: _id })
    .populate({path:"productIds", select:"-createdAt -updatedAt -__v"})
    .select("-createdAt -updatedAt -__v -productIds"))
    .pagination({page, size})
    .sort(sortBy)
    const events = await features.mongooseQuery
    if(!events.length) {
        return next(new Error('No events found', { cause: 404 }))
    }
    res.status(200).json({
        msg: "Events fetched successfully",
        statusCode: 200,
        events
    })
}

export const getMyEvent = async (req, res, next)=> {
    // destruct data from artist
    const { _id } = req.authArtist
    const { eventId } = req.params
    const event = await Event.find({ _id: eventId, artistId: _id})
    .populate({path:"productIds", select:"-createdAt -updatedAt -__v -viewrsId"})
    .select("-createdAt -updatedAt -__v")
    if(!event.length) {
        return next(new Error('No event found', { cause: 404 }))
    }
    res.status(200).json({
        msg: "Event fetched successfully",
        statusCode: 200,
        event
    })
}

export const updateMyEvent = async (req, res, next) => {
    // destruct data from artist
    const { _id } = req.authArtist
    const { eventId } = req.params
    const { title, description, duration, startAt } = req.body
    // check if event exist
    const event = await Event.findById(eventId)
    if(!event) {
        return next(new Error('Event not found', { cause: 404 }))
    }
    // check that time is still not start
    if(event.status == 'open') {
        return next(new Error('Event is already started, you can not update on it', { cause: 400 }))
    }
    // check if title already exist
    if(title) {
        const isTitleExist = await Event.findOne({ title, artistId: _id, _id: { $ne: eventId } })
        if (isTitleExist) {
            return next(new Error("Event title already exist, please try new one", { cause: 409 }))
        }
        event.title = title
        event.slug = slugify( title, '-' )
    }
    if(description) {
        event.description = description
    }
    if(duration) {
        const startDate = new Date(event.startAt)
        event.endAt = startDate.getTime() + duration * 24 * 60 * 60 * 1000
        event.duration = duration
    }
    if(startAt){
        event.startAt = startAt
        const startDate = new Date(startAt)
        event.endAt = startDate.getTime() + event.duration * 24 * 60 * 60 * 1000
    }
    // update event
    await event.save()
    // send response
    res.status(200).json({
        msg: "Event updated successfully",
        statusCode: 200
    })
}

export const addNewProductsToEvent = async (req, res, next) => {
    // destruct data from artist
    const { _id } = req.authArtist
    const { eventId } = req.params
    const { productIds } = req.body
    // check if event exist
    const event = await Event.findOne({ _id: eventId, artistId: _id })
    if(!event) {
        return next(new Error('Event not found', { cause: 404 }))
    }
    // check that time is still not start
    if(event.status == 'open') {
        return next(new Error('Event is already started, you can not update on it', { cause: 400 }))
    }
    // check products avaliability
    const products = await Product.find({ _id: { $in: productIds } })
    for (const product of products) {
        if(product.artistId.toString() !== _id.toString()) {
            return next(new Error(`You are not authorized to add ${product.title} to your event`, { cause: 404 }))
        }
        if(product.isAvailable == false) {
            return next(new Error(`${product.title} is not available`, { cause: 404 }))
        }
        if(product.isAuction == true) {
            return next(new Error(`${product.title} is also in an auction`, { cause: 404 }))
        }
        if(product.isEvent == true) {
            return next(new Error(`${product.title} is also in an event`, { cause: 404 }))
        }
    }
    // check that all products are found
    if (products.length !== productIds.length) {
    return next(new Error("A Product is not found", { cause: 404 }))
    }
    // update products data
    for (const product of products) {
        product.isEvent = true
        product.eventId = event._id
        await product.save()
    }
    // update event
    event.productIds.push(...productIds)
    await event.save()
    // send response
    res.status(200).json({
        msg: "Products added successfully",
        statusCode: 200
    })
}

export const deleteProductsFromEvent = async (req, res, next)=> {
    // destruct data from artist
    const { _id } = req.authArtist
    const { eventId } = req.params
    const { productIds } = req.body
    // check if event exist
    const event = await Event.findOne({ _id: eventId, artistId: _id })
    if(!event) {
        return next(new Error('Event not found', { cause: 404 }))
    }
    // check that time is still not start
    if(event.status == 'open') {
        return next(new Error('Event is already started, you can not update on it', { cause: 400 }))
    }
    // check products avaliability
    const products = await Product.find({ _id: { $in: productIds }, })
    for (const product of products) {
        if(product.artistId.toString() !== _id.toString()) {
            return next(new Error(`You are not authorized to delete ${product.title} from event`, { cause: 404 }))
        }
        if(product.isEvent == false) {
            return next(new Error(`${product.title} is not in event`, { cause: 404 }))
        }
        if(product.eventId != eventId) {
            return next(new Error(`${product.title} can not be deleted`, { cause: 404 }))
        }
    }
    // check that all products are found
    if (products.length !== productIds.length) {
    return next(new Error("A Product is not found", { cause: 404 }))
    }
    // update products data
    for (const product of products) {
        product.isEvent = false
        product.eventId = null
        await product.save()
    }
    // update event
    event.productIds.pull(...productIds)
    await event.save()
    // send response
    res.status(200).json({
        msg: "Products deleted successfully",
        statusCode: 200
    })
}

export const deleteMyEvent = async (req, res, next)=> {
    // destruct data from artist
    const { _id } = req.authArtist
    const { eventId } = req.params
    // check if event exist
    const event = await Event.findOne({ _id: eventId, artistId: _id })
    if(!event) {
        return next(new Error('Event not found', { cause: 404 }))
    }
    // delete event
    await event.deleteOne()
    // delete products from event
    const products = await Product.find({ eventId: eventId })
    for (const product of products) {
        product.isEvent = false
        product.eventId = null
        await product.save()
    }
    // send response
    res.status(200).json({
        msg: "Event deleted successfully",
        statusCode: 200
    })
}

export const getEventForAdmin = async (req, res, next)=> {
    // destruct data from artist
    const { eventId } = req.params
    // check if event exist
    const event = await Event.findOne({ _id: eventId })
    .populate({path:"productIds", select:"-createdAt -updatedAt -__v"})
    .select("-createdAt -updatedAt -__v")
    if(!event) {
        return next(new Error('Event not found', { cause: 404 }))
    }
    // send response
    res.status(200).json({
        msg: "Event fetched successfully",
        statusCode: 200,
        event
    })
}

export const updateEventByAdmin = async (req, res, next)=> {
    // destruct data from artist
    const { eventId } = req.params
    const { title, description, duration, startAt } = req.body
    // check if event exist
    const event = await Event.findById(eventId)
    if(!event) {
        return next(new Error('Event not found', { cause: 404 }))
    }
    // check that time is still not start
    if(event.status == 'open') {
        return next(new Error('Event is already started, you can not update on it', { cause: 400 }))
    }
    // update event
    if(title) {
        const isTitleExist = await Event.findOne({ title, artistId: event.artistId, _id: { $ne: eventId } })
        if (isTitleExist) {
            return next(new Error("Event title already exist, please try new one", { cause: 409 }))
        }
        event.title = title
        event.slug = slugify( title, '-' )
    }    if(description) event.description = description
    if(duration) {
        const startDate = new Date(event.startAt)
        event.endAt = startDate.getTime() + duration * 24 * 60 * 60 * 1000
        event.duration = duration
    }
    if(startAt) {
        event.startAt = startAt
        const startDate = new Date(startAt)
        event.endAt = startDate.getTime() + event.duration * 24 * 60 * 60 * 1000
    }
    await event.save()
    // send response
    res.status(200).json({
        msg: "Event updated successfully",
        statusCode: 200
    })
}

export const deleteEventByAdmin = async (req, res, next)=> {
    // destruct data from artist
    const { eventId } = req.params
    // check if event exist
    const event = await Event.findById(eventId)
    if(!event) {
        return next(new Error('Event not found', { cause: 404 }))
    }
    // delete event
    await event.deleteOne()
    // delete products from event
    const products = await Product.find({ eventId: eventId })
    for (const product of products) {
        product.isEvent = false
        product.eventId = null
        await product.save()
    }
    // send response
    res.status(200).json({
        msg: "Event deleted successfully",
        statusCode: 200
    })
}

export const search = async (req, res, next)=> {
    // destruct data from user
    const { page, size, sortBy, ...search } = req.query
    const features = new APIFeatures(req.query, Event.find()
    .select("-createdAt -updatedAt -__v"))
    .pagination({ page, size })
    .sort(sortBy)
    .searchEvents(search)
    const events = await features.mongooseQuery
    if(!events.length) {
        return next(new Error('No event found with this search', { cause: 404 }))
    }
    res.status(200).json({
        msg: "Products fetched successfully",
        statusCode: 200,
        events
    })
}

export const filter = async (req, res, next)=> {
    // destruct data from user
    const { page, size, sortBy, ...search } = req.query
    const features = new APIFeatures(req.query, Event.find()
    .select("-createdAt -updatedAt -__v"))
    .pagination({ page, size })
    .sort(sortBy)
    .filterEventsTime(search)
    const events = await features.mongooseQuery
    if(!events.length) {
        return next(new Error('No event found with this search', { cause: 404 }))
    }
    res.status(200).json({
        msg: "Products fetched successfully",
        statusCode: 200,
        events
    })
}