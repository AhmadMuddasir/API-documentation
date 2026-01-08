import path from "path";
import fs from "fs";
import type { Request, Response, NextFunction } from "express";
import cloudinary from "../config/cloudinary.js";
import createHttpError from "http-errors";
import bookModel from "./bookModel.js";

/**
 * Controller to handle the creation of a new book.
 * Processes multi-part form data (images and PDFs), uploads them to Cloudinary,
 * and manages local file cleanup.
 */
const createBook = async (req: Request, res: Response, next: NextFunction) => {
    try {

        const {title,genre} = req.body;
        // Cast req.files to expected Multer field structure
        const files = req.files as { [fieldname: string]: Express.Multer.File[] };

        // 1. Validation: Ensure required files are present in the request
        if (!files || !files.coverImage || !files.file) {
            return res.status(400).json({ 
                message: "Validation Error: Both 'coverImage' and 'file' (PDF) are required." 
            });
        }

        // --- 2. HANDLE COVER IMAGE UPLOAD ---
        const coverImage = files.coverImage[0];
        const coverImageMimeType = coverImage.mimetype.split("/").at(-1);
        
        // Resolve absolute path for Cloudinary uploader
        const coverImageFilePath = path.resolve(coverImage.path);

        const uploadResult = await cloudinary.uploader.upload(coverImageFilePath, {
            filename_override: coverImage.filename,
            folder: 'book-covers',
            format: coverImageMimeType
        });

        // --- 3. HANDLE PDF FILE UPLOAD ---
        const bookFileName = files.file[0];
        const bookFilePath = path.resolve(bookFileName.path);

       

        const bookFileUploadResult = await cloudinary.uploader.upload(bookFilePath, {
            resource_type: "raw", // Required for PDF/Non-image files
            filename_override: bookFileName.filename,
            folder: "book-pdfs",
            format: "pdf",
        });

        // --- 4. LOGGING & CLEANUP ---
        console.log('Cloudinary Upload Success:', {
            image: uploadResult.secure_url,
            pdf: bookFileUploadResult.secure_url
        });

        // Remove temporary local files to keep the server storage clean;

       
        try {
        
        const newBook =  bookModel.create({
            title,
            genre,
            author:'6911791f0a2b79d63cd6f6fd',
            coverImage:uploadResult.secure_url,
            file:bookFileUploadResult.secure_url
        });
        res.status(201).json({id:(await newBook)._id});
        console.log(newBook);
            await fs.promises.unlink(coverImageFilePath);
            await fs.promises.unlink(bookFilePath);
            //     if (fs.existsSync(coverImageFilePath)) await fs.promises.unlink(coverImageFilePath);
            //     if (fs.existsSync(bookFilePath)) await fs.promises.unlink(bookFilePath);
            } catch (err) {
                    console.warn("Clean-up warning: Could not delete local temp files:", err);
                }


        // 5. SUCCESS RESPONSE
        return res.status(201).json({
            message: "Book uploaded successfully",
            files: {
                coverImage: uploadResult.secure_url,
                bookFile: bookFileUploadResult.secure_url
            }
        });


    } catch (error) {
        console.error("Controller Error:", error);
        return next(createHttpError('500','error while uploading files'))
    }
};

export { createBook };