import path from "path";
import fs from "fs";
import type { Request, Response, NextFunction } from "express";
import cloudinary from "../config/cloudinary.js";
import createHttpError from "http-errors";
import bookModel from "./bookModel.js";
import {type AuthRequest } from "../middlewares/authenticate.js";
/**
 * Controller to handle the creation of a new book.
 * Processes multi-part form data (images and PDFs), uploads them to Cloudinary,
 * and manages local file cleanup.
 */
const createBook = async (req: Request, res: Response, next: NextFunction) => {
  const { title, genre } = req.body;
 
  const files = req.files as { [fieldname: string]: Express.Multer.File[] };

  if (!files || !files.coverImage || !files.file) {
    return res.status(400).json({
      message:
        "Validation Error: Both 'coverImage' and 'file' (PDF) are required.",
    });
  }

  // --- 2. HANDLE COVER IMAGE UPLOAD ---
  try {
    const coverImage = files.coverImage[0];
    if (!coverImage) {
      return next(createHttpError(401, "err in bookfile"));
    }

    const coverImageMimeType = coverImage.mimetype.split("/").at(-1);

    // Resolve absolute path for Cloudinary uploader
    const coverImageFilePath = path.resolve(coverImage.path);

    const uploadResult = await cloudinary.uploader.upload(coverImageFilePath, {
      filename_override: coverImage.filename,
      folder: "book-covers",
      ...(coverImageMimeType && { format: coverImageMimeType }), // Only adds 'format' if defined
    });

    // --- 3. HANDLE PDF FILE UPLOAD ---

    const bookFileName = files.file[0];
    if (!bookFileName) {
      return next(createHttpError(401, "err in bookfile"));
    }
    const bookFilePath = path.resolve(bookFileName.path);

    const bookFileUploadResult = await cloudinary.uploader.upload(
      bookFilePath,
      {
        resource_type: "raw", // Required for PDF/Non-image files
        filename_override: bookFileName.filename,
        folder: "book-pdfs",
        format: "pdf",
      },
    );

    // --- 4. LOGGING & CLEANUP ---
    console.log("Cloudinary Upload Success:", {
      image: uploadResult.secure_url,
      pdf: bookFileUploadResult.secure_url,
    });
    // @ts-ignore
    console.log("userID:", req.userId);

    const newBook = bookModel.create({
      title,
      genre,
      author: "6911791f0a2b79d63cd6f6fd", //hard code
      coverImage: uploadResult.secure_url,
      file: bookFileUploadResult.secure_url,
    });

    console.log("newBook", await newBook);

    //deleting temorary files code 0.2
    try {
      await fs.promises.unlink(coverImageFilePath);
      await fs.promises.unlink(bookFilePath);
    } catch (error) {
      console.warn(
        "Clean-up warning: Could not delete local temp files:",
        error,
      );
    }

    return res.status(201).json({
      message: "Book created successfully",
      id: (await newBook)._id,
      data: {
        title: (await newBook).title,
        coverImage: uploadResult.secure_url,
        bookFile: bookFileUploadResult.secure_url,
      },
    });
  } catch (error) {
    console.error("Controller Error:", error);
    return next(createHttpError("500", "error while uploading files"));
  }
};



const updateBook = async (req: Request, res: Response, next: NextFunction) =>{
  const { title, genre } = req.body;
  const bookId = req.params.bookId;

  const book = await bookModel.findOne({_id:bookId});
  if(!book){
    return next(createHttpError(404,"book not found"))
  }
  //check access
  const _req = req as AuthRequest;
  if(book.author.toString() !== _req.userId){
    return next(createHttpError(403,"you cannot update others book"))
  }

  const files = req.files as {[fieldname:string]:Express.Multer.File[]};
  let completeCoverImage = "";
  if(files.coverImage){
    const filename = files.coverImage[0].filename;
    const converMimeType = files.coverImage[0].mimetype.split("/").at(-1);

    const filePath = path.resolve(
      __dirname,
      "../../public/data/uploads" + filename
    );

    completeCoverImage = filename;//name/png
    const uploadResult = await cloudinary.uploader.upload(filePath,{
      filename_override:completeCoverImage,
      folder:"book-covers",
    });

    completeCoverImage = uploadResult.secure_url;
    await fs.promises.unlink(filePath);
     
  }

  let completeFileName = "";

  if(files.file){
    if(!files.file[0]){
      return next(createHttpError(401, "err in bookfile"));
    };
    const bookFilePath = path.resolve(
      __dirname,
      "../../public/data/uploads" + files.file[0].filename
    );
    const bookFileName = files.file[0]?.filename;
    completeFileName = `${bookFileName}.pdf`;

    const uploadResultPdf = await cloudinary.uploader.upload(bookFilePath,{
      resource_type:"raw",
      filename_override:completeFileName,
      folder:"book-covers",
    });

    completeFileName = uploadResultPdf.secure_url;
    await fs.promises.unlink(bookFilePath);

  }

  const updatedBook = await bookModel.findOneAndUpdate(
    {
      _id:bookId,
    },
    {
      title:title,
      genre:genre,
      coverImage:completeCoverImage? completeCoverImage :book.coverImage,
      file:completeFileName ? completeFileName :book.file
    },
    {new:true}
  );

  res.json(updatedBook);

}

export { createBook,updateBook };

// middleware authentication after completing book
