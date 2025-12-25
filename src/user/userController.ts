import type { NextFunction, Request, Response } from "express";
import createHttpError from "http-errors";
import userModel from "./userModel.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { config } from "../config/config.js";
import type { User } from "./userTypes.js";

const createUser = async (req: Request, res: Response, next: NextFunction) => {
  const { name, email, password } = req.body;
  // console.log("req",req.body);
  // return res.json({})
  //validation
  if (!name || !email || !password) {
    const error = createHttpError(400, "All feilds are required");
    return next(error);
  }
  //database call
  // int findOne({}) parenthesis is filter(which record u want to search)

  try {
     
       const user = await userModel.findOne({ email });
       if (user) {
         const error = createHttpError(400, "user Already exist");
         return next(error);
       }

  } catch (error) {
     return next(createHttpError(500,"error while getting user"))
  }

  let newUser:User;
  try {
    
       const hashedPassword = await bcrypt.hash(password, 10);
        newUser = await userModel.create({
         name,
         email,
         password: hashedPassword,
       });
  } catch (error) {
     return next(createHttpError(500,"error while creating user"))
  }

  try {   
     //Token generation JWT//sign by default uses HS256 algorithm

     const token = jwt.sign({
       sub: newUser._id 
      },
      config.jwtSecret as string,{
        expiresIn: "7d",});

       res.status(201).json({ accessToken: token });

  } catch (error) {
     return next(createHttpError(500,"error while generating user"))
  }

};

const loginUser = async(req: Request, res: Response, next: NextFunction)=>{
  const {email,password} = req.body;
  if(!email || !password){
    return next(createHttpError(404,"All fields are required"))

  }
  try {
    const user = await userModel.findOne({email});
    if(!user){
      return next(createHttpError(404,"user not found"));
    }
    //password matched 
    const isMatch = await bcrypt.compare(password,user.password);
    if(!isMatch){
      return next(createHttpError(400,"username or password incorrect"))
    }
    //create accesstoken

    const token = jwt.sign({sub:user._id},config.jwtSecret as string,{
      expiresIn:"7d",
      algorithm:"HS256",
    });

    res.json({accessToken:token});

  } catch (error) {
    return next(createHttpError(500,"error while login"))
  }
}

export { createUser };
export { loginUser };
