// const asyncHandler =(fn)=>async(req,res,next)=>{
//   try{
//        await fn(req,res,next)
//   }
//   catch(error){
//     res.status(err.code||500).json({
//       success:false,
//       message:err.message
//     })
//   }
// }
// with try catch




// Function to handle asynchronous request handlers with promises
const asyncHandler = (requestHandler) => {
  return (req, res, next) => {
    Promise.resolve(requestHandler(req, res, next)).catch((err) => next(err))
  }
}

// Export asyncHandler function
export { asyncHandler }
