import mongoose, { Schema } from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";
const VideoSchema =new Schema({
  videoFile:{
    type:String,     //cloudnsry url
    required:true,
  },
  thumbnail:{
    type:String,     //cloudnsry url
    required:true,
  },
  title:{
    type:String,     
    required:true,
  },
  description:{
    type:String,    
    required:true,
  },
  duration:{
    type:Number,     //cloudnsry url
    required:true,
  },
  views:{
    type:Number,    
    default:0,
  },
  ispublic:{
    type:Boolean,     //cloudnsry url
    default:0,
  },
  owner:{
    type:Schema.Types.ObjectId,     //cloudnsry url
    ref:"User",
  },
},{timestamps:true})

VideoSchema.plugin(mongooseAggregatePaginate)

export const Video =mongoose.model("Video",VideoSchema);