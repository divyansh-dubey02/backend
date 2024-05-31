import { Router } from "express";
import { loginUser, logoutUser, registerUser,refreshAccessToken } from "../controllers/user.controller.js";
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

router.route("/login").post(loginUser)

//secured routes 


router.route("/logout").post(verifyJWT, logoutUser)

router.route("/refresh-token").post(refreshAccessToken)
// Export the router to be used in the main app
export default router;
