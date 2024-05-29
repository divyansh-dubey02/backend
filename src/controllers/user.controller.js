import { apiError } from "../utils/apiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { apiResponse } from "../utils/apiResponse.js";

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

  // check for images and avatar
  const avatarLocalPath = req.files?.avatar?.[0]?.path;
  const coverImageLocalPath = req.files?.coverImage?.[0]?.path;

  if (!avatarLocalPath) {
    throw new apiError(400, "Avatar file is required");
  }

  // upload avatar and cover image to Cloudinary
  const avatar = await uploadOnCloudinary(avatarLocalPath);
  const coverImage = coverImageLocalPath ? await uploadOnCloudinary(coverImageLocalPath) : null;

  if (!avatar) {
    throw new apiError(400, "Avatar upload failed");
  }

  // create user object and entry in DB
  const user = await User.create({
    fullname,
    avatar: avatar.url,
    coverImage: coverImage ? coverImage.url : "",
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

export { registerUser };
