import { v2 as cloudinary } from "cloudinary";
import { response } from "express";
import fs from "fs";

// Configuration
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Function to upload a file on Cloudinary
export const uploadOnCloudinary = async (localFilePath) => {
  try {
    if (!localFilePath) return null;
    // Upload the file on Cloudinary
    const response = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "auto",
    });
    // File has been uploaded successfully
    fs.unlinkSync(localFilePath);
    return response;
  } catch (error) {
    fs.unlinkSync(localFilePath); // Remove the locally saved temporary file as the operation failed
    return null;
  }
};

// Function to delete a file from Cloudinary
export const deleteFromCloudinary = async (publicId) => {
  try {
    // Check if publicId is provided
    if (!publicId) return null;
    
    // Delete the file from Cloudinary using the provided publicId
    const response = await cloudinary.uploader.destroy(publicId);

    // Return the response from Cloudinary
    return response;
  } catch (error) {
    // If there's an error, return null
    return null;
  }
};
