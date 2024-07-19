import {
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { FileInterceptor } from '@nestjs/platform-express';
import * as AWS from 'aws-sdk';

const BUCKET_NAME = 'nest-loship-123';

@Controller('uploads')
export class UploadsController {
  constructor(private readonly config: ConfigService) {}

  @Post('')
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(@UploadedFile() file: Express.Multer.File) {
    AWS.config.update({
      credentials: {
        accessKeyId: this.config.get('AWS_ACCESS_KEY'),
        secretAccessKey: this.config.get('AWS_SECRET_ACCESS_KEY'),
      },
    });
    try {
      const objectName = `${Date.now() + file.originalname}`;
      await new AWS.S3()
        .putObject({
          Body: file.buffer,
          Bucket: BUCKET_NAME,
          Key: objectName,
          ACL: 'public-read',
        })
        .promise();

      const fileUrl = `https://${BUCKET_NAME}.s3.amazonaws.com/${objectName}`;
      return { url: fileUrl };
    } catch (error) {
      console.log(error);
    }
  }
}
