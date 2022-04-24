import { IFileDriver } from '@server/drivers/file.driver';
import multer from 'multer';
import stream from 'stream';
import COS from 'cos-nodejs-sdk-v5';
import MulterCOS, { MulterCOSOptions } from './tencentoss.multer';

import { createHash } from 'crypto';
function getMD5(data: string): string {
  return createHash('md5').update(data).digest('hex');
}

export default class TencentOssDriver implements IFileDriver {
  private static instanceMap: { [key: string]: IFileDriver } = {};
  private provider = 'tencentcos';
  private dir = process.env.TECENTCLOUD_OSSDir || 'burdy/upload';

  private secretId: string = process.env.TECENTCLOUD_SecretId || '';
  private secretKey: string = process.env.TECENTCLOUD_secretKey || '';
  private bucket: string = process.env.TECENTCLOUD_bucket || '';
  private region: string = process.env.TECENTCLOUD_region || 'ap-guangzhou';
  private cos: COS;

  constructor(customOptions: COS.COSOptions) {
    const options: COS.COSOptions = {
      SecretId: customOptions.SecretId || this.secretId,
      SecretKey: customOptions.SecretKey || this.secretKey,
    };
    if (customOptions.Domain) {
      options.Domain = customOptions.Domain;
    }
    if (customOptions.Protocol) {
      options.Protocol = customOptions.Protocol;
    }
    this.cos = new COS(options);
  }
  public static getInstance(customOptions?: COS.COSOptions): IFileDriver {
    let key = 'default';

    if (customOptions && customOptions.Domain) {
      key = getMD5(customOptions.Domain);
    }
    if (!TencentOssDriver.instanceMap[key]) {
      TencentOssDriver.instanceMap[key] = new TencentOssDriver(
        customOptions || {}
      );
    }
    return TencentOssDriver.instanceMap[key];
  }

  getPath = (key: string) => `${this.dir}/${key}`;

  getUpload = () =>
    multer({
      storage: new MulterCOS({
        cos: this.cos,
        bucket: this.bucket,
        region: this.region,
        dir: this.dir,
      }),
    });

  getName = () => this.provider;

  getKey = (key: string = '') => {
    if (key.indexOf('/') > -1) {
      let fieldname = key.split('/').pop() || '';
      return this.getPath(fieldname);
    }
    return this.getPath(key);
  };

  write = async (key: string, data: any) => {
    const params: COS.PutObjectParams = {
      Bucket: this.bucket,
      Region: this.region,
      Key: this.getKey(key),
      Body: data,
    };
    await this.cos.putObject(params);
    return {
      key,
      provider: this.provider,
    };
  };

  stat = async (key: string): Promise<any> => {
    const head = await this.cos.headObject({
      Key: this.getKey(key),
      Bucket: this.bucket,
      Region: this.region,
    });
    return {
      contentLength: head['content-length'],
      cacheControl: head['cache-control'],
      contentType: head['content-type'],
    };
  };

  read = async (key: string) => {
    try {
      const obj = await this.cos.getObject({
        Key: this.getKey(key),
        Bucket: this.bucket,
        Region: this.region,
      });
      return obj.Body;
    } catch (err) {
      return null;
    }
  };

  createReadStream = (key: string, options: any) => {
    const pass = new stream.PassThrough();
    this.cos.getObject({
      Key: this.getKey(key),
      Bucket: this.bucket,
      Region: this.region,
      Output: pass,
    });
    return pass;
  };

  createWriteStream = (key: string) => {
    const pass = new stream.PassThrough();
    this.cos.putObject({
      Bucket: this.bucket,
      Region: this.region,
      Key: this.getKey(key),
      Body: pass,
    });
    return pass;
  };

  uploadReadableStream = async (key: string, stream: any) => {
    return this.cos.putObject({
      Bucket: this.bucket,
      Region: this.region,
      Key: this.getKey(key),
      Body: stream,
    });
  };

  delete = async (params: string | string[]) => {
    if (params) {
      if (Array.isArray(params)) {
        const deleteParams: COS.DeleteMultipleObjectParams = {
          Bucket: this.bucket,
          Region: this.region,
          Objects: [],
        };

        params.forEach((key) => {
          deleteParams.Objects.push({ Key: this.getKey(key) });
        });
        return await this.cos.deleteMultipleObject(deleteParams);
      }
      return await this.cos.deleteObject({
        Key: this.getKey(params),
        Bucket: this.bucket,
        Region: this.region,
      });
    }
    return null;
  };

  copy = async (src: string, dest: string) => {
    await this.cos.putObjectCopy({
      Bucket: this.bucket,
      Region: this.region,
      Key: dest,
      CopySource: this.getKey(src),
    });
    return {
      dest,
    };
  };
}
