import { apiError } from "../utils/apiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { apiResponse } from "../utils/apiResponse.js";
import jwt from "jsonwebtoken"


//this is the method to generate the access token and refresh tokens
const generateAccessAndRefreshTokens = async (userId)=>{
  try {
    
    const user= await User.findById(userId)
   const accessToken = user.generateAccessToken() // Corrected typo: accesssToken -> accessToken
   const refreshToken= user.generateRefreshToken()

    user.refreshToken=refreshToken //insert refresh token to database
    await user.save({validateBeforeSave:false}) //save refresh token to database 

    return{accessToken, refreshToken} // Corrected typo: accesssToken -> accessToken

  } catch (error) {

    throw new apiError(500,"something went wrong while generating the refresh and access tokens")
    
  }
}


const registerUser = asyncHandler(async (req, res) => {
  // get user details from frontend
  const { username, email, fullname, password } = req.body;
  console.log("email", email);

  // validation to ensure all fields are filled
  if ([fullname, email, username, password].some(field => field.trim() === "")) {
    throw new apiError(400, "All fields are required");
  }

  // check if user already exists by username or email
  const existingUser = await User.findOne({
    $or: [{ username }, { email }]
  });

  if (existingUser) {
    throw new apiError(409, "User with email or username already exists");
  }
console.log(req.files)
  // check for images and avatar
  const avatarLocalPath = req.files?.avatar?.[0]?.path;
  // const coverImageLocalPath = req.files?.coverimage?.[0]?.path;
 
 let  coverImageLocalPath;
  if(req.files && Array.isArray(req.files.coverimage)&& req.files.coverimage.length >0){
    coverImageLocalPath = req.files.coverimage[0].path;
  }

  if (!avatarLocalPath) {
    throw new apiError(400, "Avatar file is required");

  }
  // if (!coverImageLocalPath) {
  //   throw new apiError(400, "Cover image upload failed");
  // }
  

  // upload avatar and cover image to Cloudinary
  const avatar = await uploadOnCloudinary(avatarLocalPath);
  const coverimage = coverImageLocalPath ? await uploadOnCloudinary(coverImageLocalPath) : null;

  if (!avatar) {
    throw new apiError(400, "Avatar upload failed");
  }
  // if (!coverimage) {
  //   throw new apiError(400, "cover image upload failed");
  // }

  // create user object and entry in DB
  const user = await User.create({
    fullname,
    avatar: avatar.url,
    coverimage: coverimage ? coverimage.url : "",
    username: username.toLowerCase(),
    email,
    password,
  });

  // remove password and refresh token fields from response
  const createdUser = await User.findById(user._id).select("-password -refreshToken");

  // check for user creation
  if (!createdUser) {
    throw new apiError(500, "Something went wrong while registering the user");
  }

  // return response
  return res.status(201).json(
    new apiResponse(201, createdUser, "User registered successfully")
  );
});

const loginUser = asyncHandler(async (req, res) => {
  // Request body -> extract data
  const { email, username, password } = req.body;

  if (!username && !email) {
    throw new apiError(400, "Username or email is required");
  }

  // Find the user by username or email
  const user = await User.findOne({
    $or: [{ username }, { email }]
  });

  if (!user) {
    throw new apiError(404, "User does not exist");
  }

  // Check if the password is correct
  const isPasswordValid = await user.isPasswordCorrect(password);

  if (!isPasswordValid) {
    throw new apiError(404, "Invalid user credentials");
  }

  // Generate access and refresh tokens
  const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(user._id);

  // Get the logged-in user's details excluding the password and refresh token
  const loggedInUser = await User.findById(user._id).select("-password -refreshToken");

  // Cookie options
  const options = {
    httpOnly: true,
    secure: true,
  };

  // Send response with cookies and user details
  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new apiResponse(
        200,
        { user: loggedInUser, accessToken, refreshToken },
        "User logged in successfully"
      )
    );
});


const logoutUser = asyncHandler(async (req, res) => {
  // Update the user's refreshToken to null (or remove the field)
  await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        refreshToken: null,
      },
    },
    {
      new: true,
    }
  );

  // Set options for clearing cookies
  const options = {
    httpOnly: true,
    secure: true,
    sameSite: "strict",
  };

  // Clear the cookies and send response
  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json({ message: "Logged out successfully" });
});
const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken;

  if (!incomingRefreshToken) {
    throw new apiError(401, "Unauthorized request");
  }

  try {
    const decodedToken = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET);
  
    const user = await User.findById(decodedToken?._id);
    if (!user) {
      throw new apiError(401, "Invalid refresh token");
    }
    if (incomingRefreshToken !== user?.refreshToken) {
      throw new apiError(401, "Refresh token is expired or used");
    }
  
    const options = {
      httpOnly: true,
      secure: true,
    };
  
    const { accessToken, refreshToken: newRefreshToken } = await generateAccessAndRefreshTokens(user._id);
  
    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", newRefreshToken, options)
      .json(
        new apiResponse(
          200,
          { accessToken, refreshToken: newRefreshToken },
          "Access token refreshed successfully"
        )
      );
  } catch (error) {
    throw new apiError(401, "Invalid refresh tokens");
  }
});

export { registerUser, loginUser, logoutUser,refreshAccessToken };
