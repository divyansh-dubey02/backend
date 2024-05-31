import mongoose, { Schema } from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

// Video model schema definition
const VideoSchema = new Schema(
  {
    videoFile: {
      type: String, // cloudinary url
      required: true,
    },
    thumbnail: {
      type: String, // cloudinary url
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    duration: {
      type: Number, // cloudinary url
      required: true,
    },
    views: {
      type: Number,
      default: 0,
    },
    ispublic: {
      type: Boolean, // cloudinary url
      default: false,
    },
    owner: {
      type: Schema.Types.ObjectId, // cloudinary url
      ref: "User",
    },
  },
  { timestamps: true }
);

// Plugin to enable pagination
VideoSchema.plugin(mongooseAggregatePaginate);

// Export Video model
export const Video = mongoose.model("Video", VideoSchema);
