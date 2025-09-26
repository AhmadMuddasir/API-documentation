import app from "./src/app.js";
import connectDB from "./src/config/db.js";
import { config } from "./src/config/config.js";

const startServer = async()=>{
     await connectDB();

     const port = config.port || 3000;

     app.listen(port,()=>{
          console.log(`listening on port:${port}`);
     })
}
startServer();