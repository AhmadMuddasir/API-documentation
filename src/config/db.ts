import mongoose, { mongo } from 'mongoose';
import { config } from './config.js';

const connectDB = async()=>{
    try{
         mongoose.connection.on("connected",()=>{
              console.log("connected successfully ")
          });
          
          //for future error
          mongoose.connection.on('error',()=>{
               console.log(`error in connecting to database`)
          });

          await mongoose.connect(config.databaseUrl as string);

    }catch(err){
     console.log(err);
     process.exit(1);
    }
}

export default connectDB;