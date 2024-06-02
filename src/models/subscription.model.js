import mongoose ,{ Schema } from "mongoose"

const subcriptionSchema =new Schema({
  subscriber:{
    type:Schema.Types.ObjectId,  //one whoe is subscribing 
    ref:"User"
  },
  channel:{
    type:Schema.Types.ObjectId,  //one to whom "subscriber" is subscribing  
    ref:"User"
  },

},{timestamps:true})

export const Subscription = mongoose.model("Subscription",subcriptionSchema)