// require('dotenv').config({path:'./env'})

import dotenv from "dotenv";
import {app} from "./app.js"
// import mongoose from "mongoose";
// import DB_NAME from './constants.js'
import connectDB from "./db/index.js";

dotenv.config({path:"./env"})

connectDB()
.then(()=>{
    app.listen(process.env.PORT || 8000,()=>{
        console.log(`Server is running at ${process.env.PORT}`);
    })
    app.on("error",(error)=>{
        console.log("Application could not communicate with MongoDB", error);
        throw error;
        
    })
})

.catch((error)=>{
    console.log("Mongo DB Connection failed!",error);
})
