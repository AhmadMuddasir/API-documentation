//   var publicId = "book-covers/lqyygacxt8ygqrhljs7r"
//   var coverImage= "https://res.cloudinary.com/dewx7lgyd/image/upload/v1772080683/book-covers/lqyygacxt8ygqrhljs7r.png"
//   const coverFileSplits = coverImage.split("/")
  
//   const coverImagePublicId =  coverFileSplits.at(-2)+"/" + coverFileSplits.at(-1)?.split(".").at(-2)

//   console.log(coverImagePublicId);
//   console.log(coverFileSplits[7] + "/"+ coverFileSplits[8].slice(0,20));
const coverImage = "https://res.cloudinary.com/dewx7lgyd/image/upload/v1772080683/book-covers/lqyygacxt8ygqrhljs7r.png";
const parts = coverImage.split("/upload/")[1];
console.log(parts)