import multer from "multer"
import cloudinaryStorage from "multer-storage-cloudinary"
import cloudinary from "../config/cloudinary.js"

const storage = cloudinaryStorage({
  cloudinary: { v2: cloudinary },
  params: (_req, file) => {
    const isPdf = file?.mimetype === "application/pdf"

    return {
      folder: "sync-ait",
      resource_type: isPdf ? "raw" : "image",
      allowed_formats: ["jpg", "png", "jpeg", "pdf", "webp"],
    }
  }
})

const upload = multer({ storage })

export default upload