import express, { type Application, type NextFunction,type Request,type Response } from 'express';
import createHttpError from 'http-errors';
import globalErrorHandler from './middlewares/globalErrorHandler.js';

const app: Application = express(); 

//Routes endpoints URL

//1)express 2)app = express 3)server listens toPORT 4)app.get()...

// http method= get,post,put,patch,delete
app.get('/',(req,res,next)=>{  //request handler
     res.json({message:"welcome to my api"});
})

app.use(globalErrorHandler);


export default app;