import express from "express";
import path from "node:path";
import { createBook, ListBooks, updateBook } from "./bookController.js";
import multer from "multer";
import authenticate from "../middlewares/authenticate.js";

const bookRouter = express.Router();

const upload = multer({
  dest: path.join(process.cwd(), "public", "data", "uploads"),
  limits: { fileSize: 3e7 },
});
//post method for book
bookRouter.post(
  "/",
  authenticate,
  upload.fields([
    { name: "coverImage", maxCount: 1 },
    { name: "file", maxCount: 1 },
  ]),
  createBook
);
// update using put or patch
bookRouter.patch(
  "/:bookId",
  authenticate,//authentication require
  upload.fields([
    { name: "coverImage", maxCount: 1 },
    { name: "file", maxCount: 1 },
  ]),
  updateBook
);

bookRouter.get("/",ListBooks) ////no authentication required

export default bookRouter;
