import express from "express"
import cookieParser from "cookie-parser"
import cors from "cors"
const app =express()

// Enable CORS with options
app.use(cors({
  origin:process.env.CORS_ORIGIN,
  credentials:true
}))

// Parse JSON bodies and set size limit
app.use(express.json({limit:"16kb"}))

// Parse URL-encoded bodies and set size limit
app.use(express.urlencoded({extended:true,limit:"16kb"}))

// Serve static files from the 'public' directory
app.use(express.static("public"))

// Parse cookies
app.use(cookieParser())

// Routes import 
import userRouter from "./routes/user.routes.js"

// Routes declaration 
app.use("/api/v1/users",userRouter)

// Export the app
export { app }
