import { v2 as cloudinary } from "cloudinary";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import multer from "multer";

const hasCloudinaryConfig =
  !!process.env.CLOUDINARY_CLOUD_NAME &&
  !!process.env.CLOUDINARY_API_KEY &&
  !!process.env.CLOUDINARY_API_SECRET;

if (hasCloudinaryConfig) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
}

const storage = hasCloudinaryConfig
  ? new CloudinaryStorage({
      cloudinary: cloudinary,
      params: {
        folder: "medi-store",
        allowed_formats: ["jpeg", "png", "jpg", "gif", "webp"],
        quality: "auto",
        fetch_format: "auto",
      } as any,
    })
  : multer.memoryStorage();

export const upload = multer({ storage });

export { cloudinary };
