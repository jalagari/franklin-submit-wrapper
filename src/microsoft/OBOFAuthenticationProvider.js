import Cache from "../Cache";
import CustomError from "../model/CustomError";
import { getURLEncoded, getUUID } from "../model/Util.js";

export class OBOFAuthenticationProvider {

    clientId;
    clientSecret;
    tenantId;
    redirectPath = '/register/token';
    
    /** {@link Token} */
    token;
    accessToken;
    code;
    hostURL;
    cache;

    constructor(env) {
        this.clientId = env.AZURE_CLIENT_ID;
        this.clientSecret = env.AZURE_CLIENT_SECRET;
        this.tenantId = env.AZURE_TENANT_ID;
        this.hostURL = env.HOST_URL;
        this.scope = env.APP_SCOPE || 'https://graph.microsoft.com/.default';
        this.cache = new Cache(env.FRANKLIN_UPLOAD_KV)

    }

    authorize() {
        let uuid = getUUID();
        const url =`https://login.microsoftonline.com/${this.tenantId}/oauth2/v2.0/authorize?client_id=${this.clientId}&response_type=code&redirect_uri=${this.hostURL}${this.redirectPath}&response_mode=query&scope=${encodeURIComponent(this.scope)}&state=${uuid}`
        return url;
    }
    
    async #getToken(grantType= 'authorization_code', includeInCache = true) {
        let data = {
            client_id: this.clientId,
            client_secret: this.clientSecret,
            redirect_uri: `${this.hostURL}${this.redirectPath}`,
            grant_type: grantType,
            scope: this.scope
        }
        if(grantType === 'authorization_code') {
            data.code = this.code;
        } else {
            data.refresh_token = this.token?.refresh_token;
        }

        console.log('Generating token')
        const response = await fetch(`https://login.microsoftonline.com/${this.tenantId}/oauth2/v2.0/token`,{
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8'
                },
            body: getURLEncoded(data)
        })
        console.log('Token Gen status', response.status)
        if(response.ok) {
            const result = await response.json();
            if(includeInCache) {
                delete this.token.sharePointToken;
                await this.cache?.put('token', result);
            }
            return result?.access_token;
        } else {
            let error = new CustomError(response.statusText, response.status, await response.text());
            throw error;
        }
    }

    async refreshAccessToken() {
        this.token = await this.cache?.get('token');
        if(this.token?.refresh_token) {
            console.log(`Generating access token using refresh token`)
            this.accessToken = await this.#getToken('refresh_token');
        } else {
            throw new CustomError('Required Authorization, use /authorize')
        }
    }

    async getAccessToken(code) {
        this.code = code;
        this.token = await this.cache?.get('token');
        this.accessToken = this.token?.access_token;
        if(code) {
            console.log(`Generating access token`)
            this.accessToken = await this.#getToken();
        }
        if (this.accessToken) {
            return this.accessToken;
        } else if (this.token?.refresh_token) {
            await this.refreshAccessToken();
            return this.accessToken;
        }
        throw new CustomError('Required Authorization, use /authorize')
    }
}