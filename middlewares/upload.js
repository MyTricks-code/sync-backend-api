import multer from "multer"
import cloudinaryStorage from "multer-storage-cloudinary"
import cloudinary from "../config/cloudinary.js"

const ALLOWED_IMAGE_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
])

const storage = cloudinaryStorage({
  cloudinary: { v2: cloudinary },
  params: (_req, _file, cb) => {
    cb(undefined, {
      folder: "sync-ait",
      resource_type: "image",
      allowed_formats: ["jpg", "png", "jpeg", "webp"],
    })
  }
})

const upload = multer({
  storage,
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_IMAGE_MIME_TYPES.has(String(file?.mimetype || "").toLowerCase())) {
      cb(undefined, true)
      return
    }

    cb(new Error("Only JPG, JPEG, PNG and WEBP image files are allowed"))
  },
})

export default upload