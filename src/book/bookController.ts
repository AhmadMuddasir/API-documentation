import path from "path";
import fs from "fs";
import type { Request, Response, NextFunction } from "express";
import cloudinary from "../config/cloudinary.js";
import createHttpError from "http-errors";
import bookModel from "./bookModel.js";
import { type AuthRequest } from "../middlewares/authenticate.js";
import { fileURLToPath } from "url";
// Create __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
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
      return next(createHttpError(401, "err in coverimage"));
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
      author: "6991f56d538c729da7651c7b", //hard code
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

const updateBook = async (req: Request, res: Response, next: NextFunction) => {
  const { title, genre } = req.body;
  const bookId = req.params.bookId;
  console.log("bookid:", bookId);

  const book = await bookModel.findOne({ _id: bookId });
  if (!book) {
    return next(createHttpError(404, "book not found"));
  }

  //check access
  const _req = req as AuthRequest;
  if (book.author.toString() !== _req.userId) {
    console.log("book id of author:", book.author.toString());
    return next(createHttpError(403, "you cannot update others book"));
  }

  const files = req.files as { [fieldname: string]: Express.Multer.File[] };
  let completeCoverImage = book.coverImage; // Default to existing

  if (files.coverImage) {
    const coverImageFile = files.coverImage[0];
    const converMimeType = coverImageFile.mimetype.split("/").at(-1);

    // FIXED: Added missing slash
    const filePath = path.resolve(
      __dirname,
      "../../public/data/uploads/" + coverImageFile.filename,
    );

    const uploadResult = await cloudinary.uploader.upload(filePath, {
      filename_override: coverImageFile.filename,
      folder: "book-covers",
      format: converMimeType,
    });

    completeCoverImage = uploadResult.secure_url;
    await fs.promises.unlink(filePath);
  }

  let completeFileName = book.file; // Default to existing

  if (files.file) {
    const pdfFile = files.file[0];

    // FIXED: Added missing slash
    const bookFilePath = path.resolve(
      __dirname,
      "../../public/data/uploads/" + pdfFile.filename,
    );

    const uploadResultPdf = await cloudinary.uploader.upload(bookFilePath, {
      resource_type: "raw",
      filename_override: pdfFile.filename,
      folder: "book-pdfs", // Changed from "book-covers" to "book-pdfs" to match createBook
      format: "pdf",
    });

    completeFileName = uploadResultPdf.secure_url;
    await fs.promises.unlink(bookFilePath);
    try {
      await fs.promises.unlink(completeCoverImage);
      await fs.promises.unlink(bookFilePath);
    } catch (error) {
      console.warn(
        "Clean-up warning: Could not delete local temp files:",
        error,
      );
    }
  }


  const updatedBook = await bookModel.findOneAndUpdate(
    {
      _id: bookId,
    },
    {
      title: title,
      genre: genre,
      coverImage: completeCoverImage,
      file: completeFileName,
    },
    { new: true },
  );

  res.json(updatedBook);
};

const ListBooks = async(req:Request,res:Response,next:NextFunction)=>{
  try {
    const book = await bookModel.find();

      res.json(book);
    } catch (error) {
      return next(createHttpError(500,"error while getting a book"))

    }

}

export { createBook, updateBook,ListBooks };

// middleware authentication after completing book
//userID//6991f53e538c729da7651c79
