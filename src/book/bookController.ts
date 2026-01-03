import type{ Request,Response,NextFunction} from "express";

const createBook = async(
     req:Request,
     res:Response,
     next:NextFunction
)=>{

     res.json({});
}

export {createBook};

//multer is used to handle multi part form data