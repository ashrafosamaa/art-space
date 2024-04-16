import mongoose from "mongoose";

const db_connection = async ()=> {
    await mongoose.connect(process.env.CONNECTION_URL_HOST)
    .then((res)=> console.log(`db connection successfully`))
    .catch((err)=> console.log(`db connection failed`))
}

export default db_connection