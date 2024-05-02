import db_connection from "../DB/connection.js"

import { globalResponse } from "./middlewares/global-response.middleware.js"
import { rollbackSavedDocument } from "./middlewares/rollback-saved-document.middleware.js"
import { rollbackUploadedFiles } from "./middlewares/rollback-uploaded-files.middleware.js"
import { generateIO } from "./utils/io-generation.js"
import { cronEveryQuarterHour, cronToChangeAuctionsToClosed, cronToChangeAuctionsToLive } from "./utils/crons.js"
import { cronToChangeEventsToClosed, cronToChangeEventsToLive } from "./utils/crons.js"
import cors from 'cors'

import * as routers from "./modules/index.routes.js"

export const initiateApp = (app, express)=> {
    const port = process.env.PORT

    app.use(cors())

    app.use((req, res, next) => {
        if (req.originalUrl == "/auctions/webhook") {
            next()
        }
        else if (req.originalUrl == "/orders/webhook") {
            next()
        }
        else {
            express.json()(req, res, next)
        }
    })

    db_connection()

    app.use('/userAuth', routers.userAuthRouter)
    app.use('/user', routers.userRouter)
    app.use('/artistAuth', routers.artistAuthRouter)
    app.use('/artist', routers.artistRouter)
    app.use('/admins', routers.adminRouter)
    app.use('/categories', routers.categoryRouter)
    app.use('/styles', routers.styleRouter)
    app.use('/subjects', routers.subjectRouter)
    app.use('/products', routers.productRouter)
    app.use('/cart', routers.cartRouter)
    app.use('/events', routers.eventRouter)
    app.use('/auctions', routers.auctionRouter)
    app.use('/orders', routers.orderRouter)

    app.use('*', (req, res, next)=> {
        return next(new Error('Page not found', { cause: 404 }))
    })

    app.use(globalResponse, rollbackUploadedFiles, rollbackSavedDocument)
    cronEveryQuarterHour()
    cronToChangeAuctionsToLive()
    cronToChangeEventsToLive()
    cronToChangeAuctionsToClosed()
    cronToChangeEventsToClosed()

    const server = app.listen(port, ()=> console.log(`server is running on host`))

    const io = generateIO(server)
    io.on('connection', (socket) => {
        console.log('a client connected' , {id:socket.id});
    })
}