import type { NextFunction, Request, Response } from "express";
import createHttpError from "http-errors";
import userModel from "./userModel.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { config } from "../config/config.js";

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
  const user = await userModel.findOne({ email });
  if (user) {
    const error = createHttpError(400, "user Already exist");
    return next(error);
  }
  const hashedPassword = await bcrypt.hash(password, 10);
  const newUser = await userModel.create({
    name,
    email,
    password: hashedPassword,
  });
  //Token generation JWT//sign by default uses HS256 algorithm
  const token = jwt.sign({ sub: newUser._id }, config.jwtSecret as string, {
    expiresIn: "7d",
    //optional
    algorith:"HS256",
  });
  res.json({ accessToken: token });

  //response
};

export { createUser };
