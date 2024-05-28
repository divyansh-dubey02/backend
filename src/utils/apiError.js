class apiError extends Error{
  constructor(
    statusCode,
    message="somthing went wrong",
    errors=[],
    statch=""
  ){
    super(message)
    this.statusCode=statusCode
    this.data=null
    this.message=message
    this.message=false,
    this.errors=errors

    if(statch){
      this.statch=statch
    }else{
      Error.captureStackTrace(this,this.constructor)
    }
  }
}

export{apiError}