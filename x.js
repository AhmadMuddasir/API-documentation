// const string = "ahmad muddasit"
// const array = string.split(' ')
// console.log(array[1]);// Example router code
// bookRouter.post("/", authenticate, upload.fields([
//     { name: 'coverImage', maxCount: 1 },
//     { name: 'file', maxCount: 1 }
// ]), createBook);

// **In Postman, you MUST match these exact names:**

// 1.  Open Postman and go to the **Body** tab.
// 2.  Select **form-data**.
// 3.  Ensure your keys are exactly:
//     * `title` (Text)
//     * `genre` (Text)
//     * `coverImage` (File) — **Check this spelling!**
//     * `file` (File) — **Check this spelling!**

// If you used `bookFile` as a key in Postman instead of `file`, Multer will throw the "Unexpected field" error. 

// ### Summary of fixes in the code:
// * **Syntax Corrected**: Fixed the misplaced closing braces and semicolons that were crashing your app.
// * **User Authentication**: Integrated `req.userId` from your `authenticate` middleware instead of the hardcoded ID.
// * **Optimized Await**: Removed redundant `(await newBook)` calls by awaiting the creation at the start.
// * **Cleanup**: Kept the local file deletion logic to prevent server storage from filling up.