import { Client } from "@microsoft/microsoft-graph-client";
import { OBOFAuthenticationProvider } from "./OBOFAuthenticationProvider.js";
import { Util } from "../model/Util.js";

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
            debugLogging: true,
            authProvider: this.#obofAuthenticationProvider
        }); 
    }

    #getDefaultItem = async () => {
        let response = await this.#client.api(`${this.#url}/root:/${this.#defaultPath}`).get();
        return response;
    }

    #getItem = async (path) => {
        let response = await this.#client.api(`${this.#url}/root:/${this.#defaultPath}/${path}`).get();
        return response;
    }

    createFolder = async(folderName) => {
        try {
            console.log(`Creating Folder with name ${folderName}`)
            if (!this.#folderId) {
                let item = await this.#getDefaultItem(this.#defaultPath);
                this.#folderId = item?.id;
            }
    
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

    createFile = async(folderName, fileName, content, contentType) => {
        try {
            console.log(`Uploading File with name ${fileName}`)
            let response = await this.#client
                .api(`${this.#url}/root:/${this.#defaultPath}/${folderName}/${fileName}:/content`)
                .header('content-type', contentType)
                .put(content);
            console.log(`File Uploading completed`)
            return response;
        } catch (err) {
            await this.retryWithTokenRefresh(err, this.createFolder, folderName);
        }
    }

    createEmptyFile = async(folderName, fileName = 'file1.json') => {

        let content = {name: "dummy file"};
        return await this.createFile(folderName, fileName, content, 'application/json');
    }

    async retryWithTokenRefresh(err, execFun, ...args) {
        if( !this.#tokenRefreshTried && Util.isTokenExipred(err)) {
            await this.#obofAuthenticationProvider.refreshAccessToken();
            this.#tokenRefreshTried = true;
            execFun && execFun.apply(this, args)
            this.createFolder(folderName);
        } else {
            throw err;
        }
    }
}