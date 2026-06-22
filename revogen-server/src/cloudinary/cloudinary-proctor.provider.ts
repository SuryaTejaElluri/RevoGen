/**
 * Uploads a base64 image to the proctoring Cloudinary account (_2 credentials).
 * We pass credentials per-request using the `api_key` / `api_secret` options
 * so this never conflicts with the main Cloudinary account used for resumes.
 */
import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';

export async function uploadProctoringScreenshot(
  base64DataUrl: string,
  folder: string,
): Promise<UploadApiResponse> {
  return new Promise((resolve, reject) => {
    cloudinary.uploader.upload(
      base64DataUrl,
      {
        folder,
        resource_type: 'image',
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME_2,
        api_key: process.env.CLOUDINARY_API_KEY_2,
        api_secret: process.env.CLOUDINARY_API_SECRET_2,
        // Optimise for thumbnails — strip metadata, compress
        quality: 'auto:low',
        fetch_format: 'auto',
        width: 640,
        crop: 'limit',
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result as UploadApiResponse);
      },
    );
  });
}
