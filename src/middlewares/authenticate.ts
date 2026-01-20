import type { NextFunction, Request, Response } from "express";

const authenticate = (req:Request,res:Response,next:NextFunction)=>{
     //to get the token //token is always send in header
     const token = req.header('Authorization')
          if(!token){
               return next(createHttpError(401),"Authorization token is required")
          }
          //token parsing

          const parsedToken 
     
}