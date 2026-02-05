import mongoose from "mongoose";


const connectDB = async ()=>{
    await mongoose.connect(`${process.env.DB_URL}/sync`)
    mongoose.connection.on('connected', ()=>{
        console.log('database connected')
    })
}

export default connectDB