import path from "path";
import fs from "fs";
import type { Request, Response, NextFunction } from "express";
import cloudinary from "../config/cloudinary.js";
import createHttpError from "http-errors";
import bookModel from "./bookModel.js";
import { type AuthRequest } from "../middlewares/authenticate.js";

const createBook = async (req: Request, res: Response, next: NextFunction) => {
  const { title, genre } = req.body;
  const files = req.files as { [fieldname: string]: Express.Multer.File[] };

  if (!files || !files.coverImage || !files.file) {
    return res.status(400).json({
      message: "Validation Error: Both 'coverImage' and 'file' (PDF) are required.",
    });
  }

  try {
    // 1. Upload Cover Image
    const coverImage = files.coverImage[0];
    const coverImageFilePath = path.resolve(coverImage.path); // Use Multer's path directly
    const coverImageMimeType = coverImage.mimetype.split("/").at(-1);

    const uploadResult = await cloudinary.uploader.upload(coverImageFilePath, {
      filename_override: coverImage.filename,
      folder: "book-covers",
      ...(coverImageMimeType && { format: coverImageMimeType }),
    });

    // 2. Upload PDF File
    const bookFileName = files.file[0];
    const bookFilePath = path.resolve(bookFileName.path); // Use Multer's path directly

    const bookFileUploadResult = await cloudinary.uploader.upload(bookFilePath, {
      resource_type: "raw",
      filename_override: bookFileName.filename,
      folder: "book-pdfs",
      format: "pdf",
    });

    // 3. Save to Database
    const newBook = await bookModel.create({
      title,
      genre,
      author: "6991f56d538c729da7651c7b", // Hardcoded for now
      coverImage: uploadResult.secure_url,
      file: bookFileUploadResult.secure_url,
    });

    // 4. Clean up local temporary files
    try {
      await fs.promises.unlink(coverImageFilePath);
      await fs.promises.unlink(bookFilePath);
    } catch (error) {
      console.warn("Could not delete local temp files:", error);
    }

    return res.status(201).json({
      message: "Book created successfully",
      id: newBook._id,
      data: {
        title: newBook.title,
        coverImage: uploadResult.secure_url,
        bookFile: bookFileUploadResult.secure_url,
      },
    });
  } catch (error) {
    console.error("Controller Error:", error);
    return next(createHttpError(500, "Error while uploading files"));
  }
};

const updateBook = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { title, genre } = req.body;
    const bookId = req.params.bookId;

    const book = await bookModel.findOne({ _id: bookId });
    if (!book) {
      return next(createHttpError(404, "Book not found"));
    }

    const _req = req as AuthRequest;
    if (book.author.toString() !== _req.userId) {
      return next(createHttpError(403, "You cannot update someone else's book"));
    }

    const files = req.files as { [fieldname: string]: Express.Multer.File[] };
    let completeCoverImage = book.coverImage; 
    let completeFileName = book.file; 

    // 1. If user uploaded a NEW cover image, process it
    if (files && files.coverImage) {
      const coverImageFile = files.coverImage[0];
      const filePath = path.resolve(coverImageFile.path); // Much safer than __dirname

      const uploadResult = await cloudinary.uploader.upload(filePath, {
        filename_override: coverImageFile.filename,
        folder: "book-covers",
        format: coverImageFile.mimetype.split("/").at(-1),
      });

      completeCoverImage = uploadResult.secure_url; // Update to new URL
      await fs.promises.unlink(filePath); // Delete local temp file
    }

    // 2. If user uploaded a NEW PDF file, process it
    if (files && files.file) {
      const pdfFile = files.file[0];
      const bookFilePath = path.resolve(pdfFile.path); // Much safer than __dirname

      const uploadResultPdf = await cloudinary.uploader.upload(bookFilePath, {
        resource_type: "raw",
        filename_override: pdfFile.filename,
        folder: "book-pdfs",
        format: "pdf",
      });

      completeFileName = uploadResultPdf.secure_url; // Update to new URL
      await fs.promises.unlink(bookFilePath); // Delete local temp file
    }

    // 3. Update Database
    const updatedBook = await bookModel.findOneAndUpdate(
      { _id: bookId },
      {
        title: title || book.title, // Keep old title if no new one provided
        genre: genre || book.genre,
        coverImage: completeCoverImage,
        file: completeFileName,
      },
      { new: true }
    );

    res.json(updatedBook);
  } catch (error) {
    console.error("Update Error:", error);
    return next(createHttpError(500, "Error while updating book"));
  }
};

const ListBooks = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const book = await bookModel.find();
    res.json(book);
  } catch (error) {
    return next(createHttpError(500, "Error while getting books"));
  }
};

const getSinglebook = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const bookId = req.params.bookId;
    const book = await bookModel.findOne({ _id: bookId });
    if (!book) {
      return next(createHttpError(404, "Book not found"));
    }
    return res.json(book);
  } catch (error) {
    return next(createHttpError(500, "Error while getting a book"));
  }
};

export { createBook, updateBook, ListBooks, getSinglebook };