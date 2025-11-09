import type { NextFunction, Request, Response } from "express";
import createHttpError from "http-errors";

const createUser =async (
     req:Request,
     res:Response,
     next:NextFunction)=>{
          const {name,email,password} = req.body;
          // console.log("req",req.body);
          // return res.json({})
          //validation
          if(!name || !email || !password){
               const error = createHttpError(400,"All feilds are required");
               return next(error);

          }
          //process
          //response
          res.json({message:"user created"})
     
}

export {createUser};
