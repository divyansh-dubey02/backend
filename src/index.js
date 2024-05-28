import { app } from "./app.js";
import connectDB from "./db/index.js";
import dotenv from "dotenv"
// require('dotenv').config({path: './env'});
dotenv.config({
  path:'./env'
})
connectDB()
.then(()=>{
  app.listen(process.env.PORT || 8000,()=>{
    console.log(`server is running at port ${process.env.PORT}`);
  })
})
.catch((err)=>{
  console.log("mongodb conection failed",err);
})



//  import express from "express"
// const app =express();
// this is second aproch for the database conection 
// (async()=>{
//   try{
//      await mongoose.connect(`${process.env.MONGODB_URL}/${DB_NAME}`)
//      app.on("error",(error)=>{
//       console.log("not able to talk to database",error);
//       throw error;
//      })
//     app.listen(process.env.PORT,()=>{
//       console.log(`app is listening on port ${process.env.PORT}`);
//     })

//   }
//   catch(error){
//     console.log("ERROR",error);

//   }
// })()