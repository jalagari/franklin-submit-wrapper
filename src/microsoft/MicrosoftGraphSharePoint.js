import { Client } from "@microsoft/microsoft-graph-client";
import { OBOFAuthenticationProvider } from "./OBOFAuthenticationProvider.js";
import { isTokenExipred } from "../model/Util.js";

export class MicrosoftGraphSharePoint {

    static APPLICATION_JSON = 'application/json';

    #siteId;
    #defaultPath;
    #client;
    #url;
    #folderId;

    #tokenRefreshTried = false;
    #obofAuthenticationProvider;

    constructor(env) {
        this.#siteId = env.SITE_ID;
        this.#defaultPath = env.SITE_FILE_UPLOAD_PATH;
        this.#folderId = env.SITE_FILE_UPLOAD_ID;
        this.#url = `/sites/${this.#siteId}/drive`;
        this.#obofAuthenticationProvider =  new OBOFAuthenticationProvider(env); 

        this.#client = Client.initWithMiddleware({
            debugLogging: false,
            authProvider: this.#obofAuthenticationProvider
        }); 
    }

    async createFolder(folderName) {
        try {
            console.log(`Creating Folder with name ${folderName}`)
    
            const driveItem = {
                name: folderName,
                folder: { },
                '@microsoft.graph.conflictBehavior': 'rename'
              };
            
            let response = await this.#client
                    .api(`${this.#url}/items/${this.#folderId}/children`)
                    .post(driveItem);
            console.log(`Folder created successfuly`)
            return response;
        } catch (err) {
            await this.retryWithTokenRefresh(err, this.createFolder, folderName);
        }
    }

    async createFile(folderName, fileName, content, contentType) {
        try {
            console.log(`Uploading File with name ${fileName}`)
            let response = await this.#client
                .api(`${this.#url}/root:/${this.#defaultPath}/${folderName}/${fileName}:/content`)
                .header('content-type', contentType)
                .put(content);
            console.log(`File Uploading completed`)
            return response;
        } catch (err) {
            await this.retryWithTokenRefresh(err, this.createFile, folderName, fileName, content, contentType);
        }
    }

    async createEmptyFile(folderName, fileName = 'file1.json') {

        let content = {name: "dummy file"};
        return await this.createFile(folderName, fileName, content, 'application/json');
    }

    async retryWithTokenRefresh(err, execFun, ...args) {
        if( !this.#tokenRefreshTried && isTokenExipred(err)) {
            await this.#obofAuthenticationProvider.refreshAccessToken();
            this.#tokenRefreshTried = true;
            execFun && execFun.apply(this, args)
        } else {
            throw err;
        }
    }
}