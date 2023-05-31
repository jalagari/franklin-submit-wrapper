import { uuid } from "@cfworker/uuid";
import CustomError from '../model/CustomError.js';

export default class FileUpload {
  includeDate = false;

  perFileSize = 2;

  totalFileSize = 10;

  allowedFiles = ['image/png', 'application/pdf'];

  constructor(env) {
    this.perFileSize = env.FILE_SIZE_LIMIT_IN_MB || this.perFileSize;
    this.totalFileSize = env.TOTAL_FILE_SIZE_LIMIT_IN_MB || this.totalFileSize;
    this.allowedFiles = env.FILE_ALLOWED ? env.FILE_ALLOWED.split(',') : this.allowedFiles;
  }

  validateFile(file) {
    const fileMb = file.size / 1024 ** 2;
    console.log("File size", fileMb, this.perFileSize)
    if (fileMb > this.perFileSize) {
      throw new CustomError(`File size should be < ${this.perFileSize} MB.`, 413);
    }
    
    if (!this.allowedFiles.includes(file?.type)) {
      throw new CustomError(`${file?.type} based files are not supported.`, 415);
    }

    // TODO - validate file name length
  }

  async verifyAndUploadFiles(payload, formData) {
    let fileFields = formData.get('fileFields');
    console.log("File Fields", fileFields, this.perFileSize)
    if (fileFields && formData) {
      fileFields = JSON.parse(fileFields);
      for( let fileField of fileFields) {
        const files = formData.getAll(fileField);
        const folderName = await this.generateFolderPath();
        for (const file of files) {
          if (file instanceof File) {
            await this.uploadFile(folderName, file);
          }
        }
        payload[fileField] = folderName;
      }
    }
  }

  generateFolderPath() {
    const date = new Date();
    let path = this.includeDate ? `${date.getFullYear()}/${date.getMonth()}/${date.getDay()}/` : '';
    path += uuid();

    return path;
  }

  uploadFile(folderName, file) {
    this.validateFile(file);
    this.displayFileInfo(file);
    return `${folderName}/${file.name}`;
  }

  // eslint-disable-next-line class-methods-use-this
  displayFileInfo(file) {
    // eslint-disable-next-line no-console
    console.log(`Name - ${file.name}, Type - ${file.type}, Size - ${file.size}`);
  }
}
