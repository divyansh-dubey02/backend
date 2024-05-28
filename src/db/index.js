import mongoose from "mongoose"

import { DB_NAME } from "../constants.js"

import express from "express"

const connectDB =async()=>{
  try{
        const connectionINstance = await mongoose.connect(`${process.env.MONGODB_URL}/${DB_NAME}`);
        console.log(`/n MONGODB connected !! DB HOST :${connectionINstance.connection.host}`)
  }
  catch(error){
   console.log("MONGODB CONECTION Failed",error);
   process.exit(1);
  }
}
export default connectDB;