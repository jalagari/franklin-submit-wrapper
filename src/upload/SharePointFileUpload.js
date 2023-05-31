import { MicrosoftGraphSharePoint } from "../microsoft/MicrosoftGraphSharePoint";
import FileUpload from "./FileUpload"

export default class SharePointFileUpload extends FileUpload {

    sharePoint;

    constructor(env) {
        super(env);
        this.sharePoint = new MicrosoftGraphSharePoint(env);
    }

    async generateFolderPath() { 
        const folderName = super.generateFolderPath();
        await this.sharePoint.createFolder(folderName);
        return folderName;
    }

    async uploadFile(folderName, file) {
       super.uploadFile(folderName, file);

        await this.sharePoint.createFile(folderName, file.name, await file.arrayBuffer(), file.type)

        return `${folderName}/${file.name}`;
    }

}