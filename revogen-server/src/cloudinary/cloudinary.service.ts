import { Injectable } from '@nestjs/common';
import { UploadApiResponse,} from 'cloudinary';
import * as streamifier from 'streamifier';
import cloudinary from './cloudinary.provider';

@Injectable()
export class CloudinaryService {
  uploadFile(
    file: Express.Multer.File,
  ): Promise<UploadApiResponse> {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          resource_type: 'raw',
          folder: 'revogen-resumes',
        },
        (error, result) => {
          if (error) return reject(error);
          resolve(result as UploadApiResponse);
        },
      );

      streamifier.createReadStream(file.buffer)
        .pipe(uploadStream);
    });
  }
}