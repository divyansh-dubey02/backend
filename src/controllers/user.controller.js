import { apiError } from "../utils/apiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary,deleteFromCloudinary } from "../utils/cloudinary.js";
import { apiResponse } from "../utils/apiResponse.js";
import jwt from "jsonwebtoken"
import { response } from "express";


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
  // Retrieve the refresh token from cookies or request body
  const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken;

  // If no refresh token is provided, throw an unauthorized error
  if (!incomingRefreshToken) {
    throw new apiError(401, "Unauthorized request");
  }

  try {
    // Verify the provided refresh token
    const decodedToken = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET);

    // Find the user by the ID decoded from the token
    const user = await User.findById(decodedToken?._id);
    if (!user) {
      throw new apiError(401, "Invalid refresh token");
    }

    // Check if the provided refresh token matches the one stored for the user
    if (incomingRefreshToken !== user?.refreshToken) {
      throw new apiError(401, "Refresh token is expired or used");
    }

    // Set options for the new cookies
    const options = {
      httpOnly: true,
      secure: true,
    };

    // Generate new access and refresh tokens for the user
    const { accessToken, refreshToken: newRefreshToken } = await generateAccessAndRefreshTokens(user._id);

    // Send the new tokens as cookies and in the response body
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
    // If any error occurs, throw an unauthorized error
    throw new apiError(401, "Invalid refresh tokens");
  }
});const changeCurrentPassword = asyncHandler(async (req, res) => {
  // Extract old password, new password, and confirm password from the request body
  const { oldPassword, newPassword, conformPassword } = req.body;

  // Check if the new password and confirm password match
  if (!(newPassword === conformPassword)) {
    throw new apiError(400, "Password does not match");
  }

  // Find the user by the ID from the request's user object
  const user = await User.findById(req.user?._id);

  if (!user) {
    throw new apiError(404, "User not found");
  }

  // Check if the provided old password is correct
  const isPasswordCorrect = await user.isPasswordCorrect(oldPassword);
  if (!isPasswordCorrect) {
    throw new apiError(400, "Invalid old password");
  }

  // Update the user's password with the new password
  user.password = newPassword;
  await user.save({ validateBeforeSave: false });

  // Send a success response
  return res
    .status(200)
    .json(new apiResponse(200, {}, "Password changed successfully"));
});
const getCurrentUser = asyncHandler(async (req, res) => {
  try {
    // Get the current user's ID from the request object
    const userId = req.user?._id;

    // Fetch the user data from the database using the user ID
    const user = await User.findById(userId).select("-password -refreshToken");

    // Check if the user exists
    if (!user) {
      throw new apiError(404, "User not found");
    }

    // Send the user information in the response
    return res.status(200).json(new apiResponse(200, user, "Current user fetched successfully"));
  } catch (error) {
    // Handle errors and send appropriate response
    return res.status(error.status || 500).json(new apiResponse(error.status || 500, null, error.message));
  }
});


const updateAccountDetails = asyncHandler(async (req, res) => {
  // Extract fullname and email from the request body
  const { fullname, email } = req.body;

  // Check if both fullname and email are provided
  if (!fullname || !email) {
    throw new apiError(400, "All the fields are required");
  }

  // Find and update the user by ID, setting the new fullname and email
  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        fullname: fullname,
        email: email
      }
    },
    { new: true }
  ).select("-password"); // Exclude the password field from the result

  // Send the updated user information in the response
  return res
    .status(200)
    .json(new apiResponse(200, user, "Account details updated successfully"));
});
const updateUserAvatar = asyncHandler(async (req, res) => {
  // Get the local path of the uploaded avatar file
  const avatarLocalPath = req.file?.path;

  // If the avatar file is missing, throw an error
  if (!avatarLocalPath) {
    throw new apiError(400, "Avatar file is missing");
  }
  
  
    // Get the current user
    const currentUser = await User.findById(req.user._id);

    // If the current user has a previous avatar, delete it from Cloudinary
    if (currentUser.avatar) {
      const publicId = currentUser.avatar.split('/').pop().split('.')[0]; // Extract the public ID from the avatar URL
      await deleteFromCloudinary(publicId);
    }


  // Upload the avatar to Cloudinary
  const avatar = await uploadOnCloudinary(avatarLocalPath);

  // If there's an error during upload, throw an error
  if (!avatar.url) {
    throw new apiError(400, "Error while uploading the avatar");
  }

  // Find and update the user's avatar URL by their ID
  const user = await User.findByIdAndUpdate(
    req.user?._id,
    { $set: { avatar: avatar.url } },
    { new: true }
  ).select("-password"); // Exclude the password field from the result

  // Send the updated user information in the response
  return res
    .status(200)
    .json(new apiResponse(200, user, "Avatar updated successfully"));
});

const updateUserCoverImage = asyncHandler(async (req, res) => {
  // Get the local path of the uploaded cover image file
  const coverImageLocalPath = req.file?.path;

  // If the cover image file is missing, throw an error
  if (!coverImageLocalPath) {
    throw new apiError(400, "Cover image file is missing");
  }


    // Get the current user
    const currentUser = await User.findById(req.user._id);

    // If the current user has a previous coverimage , delete it from Cloudinary
    if (currentUser.coverimage) {
      const publicId = currentUser.coverimage.split('/').pop().split('.')[0]; // Extract the public ID from the avatar URL
      await deleteFromCloudinary(publicId);
    }


  // Upload the cover image to Cloudinary
  const coverImage = await uploadOnCloudinary(coverImageLocalPath);

  // If there's an error during upload, throw an error
  if (!coverImage.url) {
    throw new apiError(400, "Error while uploading the cover image");
  }

  // Find and update the user's cover image URL by their ID
  const user = await User.findByIdAndUpdate(
    req.user?._id,
    { $set: { coverImage: coverImage.url } },
    { new: true }
  ).select("-password"); // Exclude the password field from the result

  // Send the updated user information in the response
  return res
    .status(200)
    .json(new apiResponse(200, user, "Cover image updated successfully"));
});
const getUserChannelProfile = asyncHandler(async (req, res) => {
  // Extract username from URL parameters
  const { username } = req.params;

  // Check if username is provided and trim whitespace
  if (!username?.trim()) {
    throw new apiError(400, "Username is missing");
  }

  // Aggregate pipeline to fetch user channel profile
  const channel = await User.aggregate([
    {
      // Match the username (case-insensitive) in the users collection
      $match: {
        username: username.toLowerCase(),
      },
    },
    {
      // Lookup subscriptions where the user is the channel
      $lookup: {
        from: "subscription",
        localField: "_id",
        foreignField: "channel",
        as: "subscriber",
      },
    },
    {
      // Lookup subscriptions where the user is the subscriber
      $lookup: {
        from: "subscription",
        localField: "_id",
        foreignField: "subscriber",
        as: "subscribedTo",
      },
    },
    {
      // Add fields for subscriber count, channel subscriber count, and subscription status
      $addFields: {
        subscribercount: {
          $size: "$subscriber",
        },
        channelsubscribercount: {
          $size: "$subscribedTo",
        },
        isSubscribed: {
          // Check if the current user is subscribed to this channel
          $cond: {
            if: { $in: [req.user?._id, "$subscriber.subscriber"] },
            then: true,
            else: false,
          },
        },
      },
    },
    {
      // Project the required fields to include in the result
      $project: {
        fullname: 1,
        username: 1,
        subscribercount: 1,
        channelsubscribercount: 1,
        isSubscribed: 1,
        avatar: 1,
        coverimage: 1,
        email: 1,
      },
    },
  ]);

  // Check if the channel exists
  if (!channel.length) {
    throw new apiError(400, "Channel does not exist");
  }

  // Send the channel profile in the response
  return res.status(200).json(new apiResponse(200, channel[0], "User channel fetched successfully"));
});

const getWatchHistory = asyncHandler(async (req, res) => {
  // Aggregate pipeline to fetch watch history for the current user
  const user = await User.aggregate([
    {
      // Match the current user by ID
      $match: {
        _id: new mongoose.Types.ObjectId(req.user._id),
      },
    },
    {
      // Lookup videos in the user's watch history
      $lookup: {
        from: "video",
        localField: "watchHistory",
        foreignField: "_id",
        as: "watchHistory",
        pipeline: [
          {
            // Lookup the owner of each video
            $lookup: {
              from: "user",
              localField: "owner",
              foreignField: "_id",
              as: "owner",
              pipeline: [
                {
                  // Project the required fields from the owner
                  $project: {
                    fullname: 1,
                    username: 1,
                    avatar: 1,
                  },
                },
              ],
            },
          },
          {
            // Add owner field to each video in the watch history
            $addFields: {
              owner: {
                $first: "$owner",
              },
            },
          },
        ],
      },
    },
  ]);

  // Send the watch history in the response
  return res
  .status(200)
  .json(new apiResponse(200, user[0].watchHistory, "Watch history fetched successfully"));
});

export { registerUser,
   loginUser,
    logoutUser,
    refreshAccessToken,
    changeCurrentPassword,
    updateAccountDetails,
    updateUserAvatar,
    updateUserCoverImage,
    getCurrentUser,
    getUserChannelProfile,
    getWatchHistory
  };
