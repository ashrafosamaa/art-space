import userAuthRouter from "./User-Auth/user-auth.routes.js"
import userRouter from "./User/user.routes.js"
import artistAuthRouter from "./Artist-Auth/artist-auth.routes.js"
import artistRouter from "./Artist/artist.routes.js"
import categoryRouter from "./Category/category.routes.js"
import adminRouter from "./Admin/admin.routes.js"
import styleRouter from "./Style/style.routes.js"
import subjectRouter from "./Subject/subject.routes.js"
import productRouter from "./Product/product.routes.js"
import cartRouter from "./Cart/cart.routes.js"
import eventRouter from "./Event/event.routes.js"
import auctionRouter from "./Auction/auction.routes.js"

export {
    userAuthRouter,
    userRouter,
    artistAuthRouter,
    artistRouter,
    categoryRouter,
    adminRouter,
    styleRouter,
    subjectRouter,
    productRouter,
    cartRouter,
    eventRouter,
    auctionRouter
}