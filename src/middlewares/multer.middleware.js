import multer from "multer";

// Function to set up storage engine for multer file upload
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./public/temp"); // specify the destination directory for the uploaded files
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname);
  },
});

// Export multer instance for file upload
export const upload = multer({ storage });
