import express from "express";

import { createBook } from "./bookController.js";

const bookRouter = express.Router();

bookRouter.post("/",createBook);

export default bookRouter;