import type { NextFunction, Request, Response } from "express";
import pkg from "jsonwebtoken";
const { verify } = pkg;
import { config } from "../config/config.js";
import createHttpError from "http-errors";
const authenticate = (req: Request, res: Response, next: NextFunction) => {
  //to get the token //token is always send in header
  const token = req.header("Authorization");
  if (!token) {
    return next(createHttpError(401, "Authorization token is required"));
  }
  //token parsing
  try {
    const parsedToken = token.split(" ")[1];
    if (!parsedToken) {
      return next(
        createHttpError(401, "Token format is invalid (Bearer <token>)")
      );
    }
    //to verify token
    const decoded = verify(parsedToken, config.jwtSecret as string);
        console.log(`AUTH SUCCESS`);
        console.log("Decoded User ID (sub):", decoded.sub);
    next();
    // req.userId = decoded.sub
  } catch (error) {
    console.log(error);
  }
};

export default authenticate;
