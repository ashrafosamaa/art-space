import { scheduleJob } from "node-schedule"
import {DateTime} from 'luxon'

import axios from 'axios';
import Event from "../../DB/models/event.model.js"
import Auction from "../../DB/models/auction.model.js"
import Product from "../../DB/models/product.model.js"
import Order from "../../DB/models/order.model.js";

export function cronEveryQuarterHour(){
    scheduleJob('*/14 * * * *', async ()=> {
        axios.get('https://art-space-v1.onrender.com/admins/keep-alive')
        .then(response => {
            console.log('Keep-alive request sent:', response.data);
        })
        .catch(error => {
            console.error('Error sending keep-alive request:', error.message);
        })
    })
}

export function cronToChangeAuctionsToLive(){
    scheduleJob('0 0 0 * * *', async ()=> {
        // console.log('hi every day at 00:00:00 am check auctions to make status live')
        const auctions = await Auction.find({status: 'not-started'})
        if(!auctions.length) return console.log('No auctions needed to be live today')
        for (const auction of auctions) {
            const beginAtStr = JSON.stringify(auction.beginDate);
            const splitBeginAtstr = beginAtStr.split('.')[0]
            const cleanSplitBeginAtstr = splitBeginAtstr.replace(/"/gi, '');
            const auctionBeginAt = DateTime.fromISO(cleanSplitBeginAtstr)
            if(auctionBeginAt <= DateTime.now()){
                console.log(`Auction: ${auction._id} is opened`);
                auction.status = 'open'
            }
            await auction.save()
        }
    })
}

export function cronToChangeAuctionsToClosed(){
    scheduleJob('0 0 0 * * *', async ()=> {
        // console.log('hi every day at 00:00:00 am check auctions to make status closed')
        const auctions = await Auction.find({status: 'open'})
        if(!auctions.length) return console.log('No auctions needed to be closed today')
        for (const auction of auctions) {
            const endAtStr = JSON.stringify(auction.endDate);
            const splitEndAtstr = endAtStr.split('.')[0]
            const cleanSplitEndAtstr = splitEndAtstr.replace(/"/gi, '');
            const auctionEndAt = DateTime.fromISO(cleanSplitEndAtstr)
            if(auctionEndAt < DateTime.now()){
                console.log(`Auction: ${auction._id} is closed`);
                auction.status = 'closed'
                const product = await Product.findById(auction.productId)
                if(auction.heighstPriceId) { 
                    product.isAvailable = false
                    product.basePrice = auction.variablePrice
                    product.appliedPrice = auction.variablePrice
                    product.discount = 0
                    product.isAuction = false
                    auction.winnerId = auction.heighstPriceId
                    await product.save()
                }
                else {
                    product.isAuction = false
                    product.basePrice = auction.oldBasePrice
                    product.discount = auction.oldDiscount
                    product.appliedPrice = auction.oldAppliedPrice
                    await product.save()
                }
            }
            await auction.save()
        }
    })
}

export function cronToChangeEventsToLive(){
    scheduleJob('0 0 0 * * *', async ()=> {
        console.log('hi every day at 00:00:00 am check events to make status live')
        const events = await Event.find({status: 'not-started'})
        if(!events.length) return console.log('No events needed to be live today')
        for (const event of events) {
            const startAtStr = JSON.stringify(event.startAt);
            const splitStartAtstr = startAtStr.split('.')[0]
            const cleanSplitStartAtstr = splitStartAtstr.replace(/"/gi, '');
            const eventStartAt = DateTime.fromISO(cleanSplitStartAtstr)
            if(eventStartAt <= DateTime.now()){
                console.log(`Event: ${event._id} is opend`);
                event.status = 'open'
            }
            await event.save()
        }
    })
}

export function cronToChangeEventsToClosed(){
    scheduleJob('0 0 0 * * *', async ()=> {
        console.log('hi every day at 00:00:00 am check events to make status closed')
        const events = await Event.find({status: 'open'})
        if(!events.length) return console.log('No events needed to be closed today')
        for (const event of events) {
            const endAtStr = JSON.stringify(event.endAt);
            const splitEndAtstr = endAtStr.split('.')[0]
            const cleanSplitEndAtstr = splitEndAtstr.replace(/"/gi, '');
            const eventEndAt = DateTime.fromISO(cleanSplitEndAtstr)
            if(eventEndAt < DateTime.now()){
                console.log(`Event: ${event._id} is closed`);
                event.status = 'closed'
                // delete products from event
                const products = await Product.find({ eventId: event._id })
                for (const product of products) {
                    product.isEvent = false
                    product.eventId = null
                    await product.save()
                }
            }
            await event.save()
        }
    })
}

export function cronToCancelOrders(){
    scheduleJob('0 0 0 * * *', async ()=> {
        console.log('hi every day at 00:00:00 am check orders')
        const orders = await Order.find({orderStatus: 'Pending'})
        if(!orders.length) return console.log('No orders to cancel')
        for (const order of orders) {
            const createdAtStr = JSON.stringify(order.createdAt);
            const splitCreatedAtstr = createdAtStr.split('.')[0] + '"'
            const cleanSplitCreatedAtstr = splitCreatedAtstr.replace(/"/gi, '');
            const orderCreatedAt = DateTime.fromISO(cleanSplitCreatedAtstr)
        // cancel order after one day from adding it
            if(orderCreatedAt.plus({days: 3}) <= DateTime.now()){ 
                console.log(`Order: ${order._id} cancelled.`);
                order.orderStatus = 'Cancelled'
                for (const item of order.orderItems) {
                    await Product.updateOne({ _id: item.product }, { isAvailable: true });
                }
            }
            await order.save();
        }
    })
}
