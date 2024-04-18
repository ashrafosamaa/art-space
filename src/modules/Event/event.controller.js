import {APIFeatures} from "../../utils/api-features.js";

import Event from "../../../DB/models/event.model.js";
import Product from "../../../DB/models/product.model.js";


export const createEvent = async (req, res, next) => {
    // destruct data from artist
    const { _id } = req.authArtist
    const { title, description, productIds, duration, startAt } = req.body
    // check products avaliability
    const products = await Product.find({ _id: { $in: productIds } })
    for (const product of products) {
        if(product.isAvailable == false) {
            return next(new Error("A Product is not available", { cause: 404 }))
        }
    }
    if (products.length !== productIds.length) {
        return next(new Error("A Product is not found", { cause: 404 }))
    }
    // check if event already exist
    const isEvent = await Event.findOne({ title, artistId: _id })
    if (isEvent) {
        return next(new Error("Event title already exist, please try new one", { cause: 409 }))
    }
    // set duration and end date
    const startDate = new Date(startAt)
    const endAt = startDate.getTime() + duration * 24 * 60 * 60 * 1000
    // create event
    const event = new Event({
        title,
        description,
        productIds,
        duration,
        startAt,
        endAt,
        artistId: _id
    })
    await event.save()
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
    const event = await Event.findById(eventId)
    .populate({path:"productIds", select:"-createdAt -updatedAt -__v"})
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




