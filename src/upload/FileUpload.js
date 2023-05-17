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
    this.allowedFiles = env.FILE_ALLOWED || this.allowedFiles;
  }

  #validateFile(file) {
    const fileMb = file.size / 1024 ** 2;
    console.log("File size", fileMb, this.perFileSize)
    if (fileMb > this.perFileSize) {
      throw new CustomError(`File size should be < ${this.perFileSize} MB.`, 413);
    }
    
    if (this.allowedFiles?.length > 0 && !this.allowedFiles.includes(file?.type)) {
      throw new CustomError(`${file?.type} based files are not supported.`, 415);
    }

    // TODO - validate file name length
  }

  verifyAndUploadFiles(payload, formData) {
    let fileNames = formData.get('fileNames');
    console.log("File Names", fileNames, this.perFileSize)
    if (fileNames && formData) {
      fileNames = JSON.parse(fileNames);
      fileNames.forEach((fileName) => {
        const files = formData.getAll(fileName);
        [...files].forEach((file) => {
          if (file instanceof File) {
            payload[fileName] = this.#uploadFile(file);
          }
        });
      });
    }
  }

  #generateFolderPath() {
    const date = Date.now();
    let path = this.includeDate ? `${date.getFullYear()}/${date.getMonth()}/${date.getDay()}/` : '';
    path += uuid();

    return path;
  }

  #uploadFile(file) {
    this.displayFileInfo(file);
    this.#validateFile(file);
    return `${this.#generateFolderPath()}/${file.name}`;
  }

  // eslint-disable-next-line class-methods-use-this
  displayFileInfo(file) {
    // eslint-disable-next-line no-console
    console.log(`Name - ${file.name}, Type - ${file.type}, Size - ${file.size}`);
  }
}
