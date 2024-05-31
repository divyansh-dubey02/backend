import { app } from "./app.js";
import connectDB from "./db/index.js";
import dotenv from "dotenv";

// Load environment variables from .env file
dotenv.config({
  path: "./.env",
});

// Connect to the database
connectDB()
  .then(() => {
    // Start the server
    app.listen(process.env.PORT || 8000, () => {
      console.log(`Server is running at port ${process.env.PORT}`);
    });
  })
  .catch((err) => {
    console.log("MongoDB connection failed", err);
  });

// Alternative approach for database connection using async-await
// (async()=>{
//   try{
//      await mongoose.connect(`${process.env.MONGODB_URL}/${DB_NAME}`)
//      app.on("error",(error)=>{
//       console.log("Not able to talk to database",error);
//       throw error;
//      })
//     app.listen(process.env.PORT,()=>{
//       console.log(`App is listening on port ${process.env.PORT}`);
//     })

//   }
//   catch(error){
//     console.log("ERROR",error);

//   }
// })()
