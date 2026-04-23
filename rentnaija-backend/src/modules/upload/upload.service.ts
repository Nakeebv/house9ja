import { Injectable } from '@nestjs/common';
import * as crypto from 'crypto';

@Injectable()
export class UploadService {
  sign(folder: string) {
    const timestamp = Math.round(Date.now() / 1000);
    const apiSecret = process.env.CLOUDINARY_API_SECRET!;
    const paramsToSign = `folder=${folder}&timestamp=${timestamp}`;
    const signature = crypto.createHash('sha1').update(paramsToSign + apiSecret).digest('hex');

    return {
      signature,
      timestamp,
      api_key: process.env.CLOUDINARY_API_KEY!,
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
    };
  }
}
