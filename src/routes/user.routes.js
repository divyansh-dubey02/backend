import { Router } from "express";
import { registerUser } from "../controllers/user.controller.js";
import{upload} from "../middlewares/multer.middleware.js"
const router= Router();


router.route("/register").post(
  upload.fields([
     {
      name:"avtar",
      maxCount:1
     },
     {
      name:"coverimage",
      maxCount:1
     }
  ]),
  registerUser)
// http://localhost:8000/api/v1/users/register



export default router;