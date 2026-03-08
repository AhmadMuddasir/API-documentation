import type { NextFunction, Request, Response } from "express";
import pkg from "jsonwebtoken";
const { verify } = pkg;
import { config } from "../config/config.js";
import createHttpError from "http-errors";

export interface AuthRequest extends Request {
  userId: string;
}

const authenticate = (req: Request, res: Response, next: NextFunction) => {
  //to get the token //token is always send in header
  const token = req.header("Authorization");
  if (!token) {
    return next(createHttpError(401, "Authorization token is required"));
  }
  //token parsing

  //to verify token
  try {
    const parsedToken = token.split(" ")[1] as string;
      const decoded = verify(parsedToken, config.jwtSecret as string) as any;
      console.log("Decoded User ID (sub):", decoded.sub);
      (req as AuthRequest).userId = decoded.sub;
      next();
    }
   catch (err) {
    console.error("🔐 Token verification failed:", err);
    // 🔥 FIX: Actually return an error instead of just logging
    return next(createHttpError(401, "Token is not valid"));
  }
};
// req.userId = decoded.sub

export default authenticate;
