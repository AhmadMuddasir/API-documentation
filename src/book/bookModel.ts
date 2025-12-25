import mongoose, { mongo } from "mongoose";
import type { Book } from "./bookTypes.js";
const bookSchema =  new mongoose.Schema<Book>({
     title:{
          type:String,
          required:true
     },
     author:{
          type:mongoose.Schema.ObjectId,
          required:true
     },
     coverImage:{
          type:String,
          required:true
     },
     file:{
          type:String,
          required:true,
     },
     genre:{
          type:String,
          required:true
     }
},
{timestamps:true}
);

export default mongoose.model<Book>("Book",bookSchema);