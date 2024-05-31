import { apiError } from "../utils/apiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken";
import { User } from "../models/user.model.js";

// Middleware to verify JWT and authenticate user
export const verifyJWT = asyncHandler(async (req, res, next) => {
  try {
    // Extract token from cookies or Authorization header
    const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "").trim();
  
    if (!token) {
      throw new apiError(401, 'Unauthorized request');
    }
  
    // Verify the token
    const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
  
    // Find the user by decoded token ID and exclude password and requestToken fields
    const user = await User.findById(decodedToken?._id).select("-password -requestToken");
  
    if (!user) {
      // If user not found, throw unauthorized error
      throw new apiError(401, "Invalid access token");
    }
  
    // Attach user to request object and proceed
    req.user = user;
    next();
  } catch (error) {
    throw new apiError(401, error?.message || "Invalid access token");
  }
});
