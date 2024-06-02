import { Router } from "express";
import { 
  loginUser,
  logoutUser,
  registerUser,
  refreshAccessToken,
  changeCurrentPassword,
  updateAccountDetails,
  updateUserAvatar,
  updateUserCoverImage,
  getCurrentUser,
  getUserChannelProfile,
  getWatchHistory
} from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

// Initialize a new Router instance
const router = Router();

// Define a POST route at '/register' with file upload handling
router.route("/register").post(
  // Use Multer middleware to handle multiple file uploads
  upload.fields([
    {
      name: "avatar", // Name of the field for the avatar file
      maxCount: 1, // Maximum number of files allowed for this field
    },
    {
      name: "coverimage", // Name of the field for the cover image file
      maxCount: 1, // Maximum number of files allowed for this field
    },
  ]),
  // Controller function to handle the registration logic
  registerUser
);

// Define a POST route at '/login' to handle user login
router.route("/login").post(loginUser);

// Secured routes (require authentication)

// Define a POST route at '/logout' to handle user logout
router.route("/logout").post(verifyJWT, logoutUser);

// Define a POST route at '/refresh-token' to refresh access token
router.route("/refresh-token").post(refreshAccessToken);

// Define a POST route at '/changeCurrentPassword' to change user's password
router.route("/changeCurrentPassword").post(verifyJWT, changeCurrentPassword);

// Define a PATCH route at '/updateAccountDetails' to update user's account details
router.route("/updateAccountDetails").patch(verifyJWT, updateAccountDetails);

// Define a PATCH route at '/updateUserAvatar' to update user's avatar
router.route("/updateUserAvatar").patch(verifyJWT, upload.single("avatar"), updateUserAvatar);

// Define a PATCH route at '/updateUserCoverImage' to update user's cover image
router.route("/updateUserCoverImage").patch(verifyJWT, upload.single("coverimage"), updateUserCoverImage);

// Define a GET route at '/getCurrentUser' to get current user's information
router.route("/getCurrentUser").get(verifyJWT, getCurrentUser);

// Define a GET route at '/c/:username' to get user channel profile by username
router.route("/c/:username").get(verifyJWT, getUserChannelProfile);

// Define a GET route at '/WatchHistory' to get user's watch history
router.route("/WatchHistory").get(verifyJWT, getWatchHistory);

// Export the router to be used in the main app
export default router;
