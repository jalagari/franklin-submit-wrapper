import { MicrosoftGraphSharePoint } from "../microsoft/MicrosoftGraphSharePoint";
import { sanitizeFileName } from "../model/Util";
import AbstractFileUpload from "./AbstractFileUpload"

export default class SharePointFileUpload extends AbstractFileUpload {

    /**
     * SharePoint Client {@link MicrosoftGraphSharePoint}. 
     */
    sharePoint;

    constructor(env) {
        super(env);
        this.sharePoint = new MicrosoftGraphSharePoint(env);
    }

    async createFolder(folderName) { 
        await this.sharePoint.createFolder(folderName);
    }

    async uploadFile(folderName, file, fileName) {
        await this.sharePoint.createFile(folderName, fileName, await file.arrayBuffer(), file.type)
        return `${folderName}/${fileName}`;
    }
}