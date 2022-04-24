import COS from 'cos-nodejs-sdk-v5';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
// function getFilename(req: any, file: any): string {
//     let ext = file.originalname.split(".").pop();
//     return `${uuidv4()}.${ext}`;
// }

export interface MulterCOSOptions {
  cos: COS;
  bucket: string;
  region?: string;
  dir: string;
  onProgress?: (progressEvent: any) => void;
}

export default class MulterCOS implements multer.StorageEngine {
  private cos: COS;
  private bucket: string;
  private region: string;
  private dir: string;
  private onProgress: (progressEvent: any) => void;
  constructor(ops: MulterCOSOptions) {
    this.cos = ops.cos;
    this.bucket = ops.bucket;
    this.region = ops.region || 'ap-guangzhou';
    this.dir = ops.dir || 'burdy/upload';
    this.onProgress = ops.onProgress || function (progressEvent: any) {};
  }
  _handleFile(req: any, file: Express.Multer.File, cb: any) {
    const stream = file.stream;
    // put object after 'end' event emit to ensure multer 'readFinished'
    stream.on('end', () => {
      const buffer = Buffer.concat(chunks);
      const key = `${this.dir}/${uuidv4()}`;
      this.cos.putObject(
        {
          Bucket: this.bucket,
          Region: this.region,
          Key: key,
          onProgress: (progressData) => {
            this.onProgress(progressData);
          },
          Body: buffer,
        },
        (err, data) => {
          if (err) {
            cb(err);
          } else {
            cb(null, { ...data, Location: '//' + data.Location, key });
          }
        }
      );
    });
    const chunks: any = [];
    stream.on('readable', () => {
      let chunk;
      while (null !== (chunk = stream.read())) {
        chunks.push(chunk);
      }
    });
  }
  _removeFile(req: any, file: { filename: any }, cb: any) {
    let that = this;
    if (!this.cos) {
      console.error('cos client undefined');
      return cb({ message: 'cos client undefined' });
    }
    // 发生错误, 回滚上传的文件
    this.cos.deleteObject(
      {
        Bucket: that.bucket,
        Region: that.region,
        Key: file.filename,
      },
      function (err, data) {
        if (err) {
          console.log(`rollback failed:${err.error}`);
          return cb(err.error);
        } else {
          console.log('rollback success');
          return cb(null, data);
        }
      }
    );
  }
}
