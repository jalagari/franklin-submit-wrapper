import { uuid } from "@cfworker/uuid";

export class Util {
    static FRANKLIN_UPLOAD_KV = null;
    
    static getUUID() {
        return uuid();
    }

    static getURLEncoded(data) {
        const formBody = [];
        for (var property in data) {
            var encodedKey = encodeURIComponent(property);
            var encodedValue = encodeURIComponent(data[property]);
            formBody.push(encodedKey + "=" + encodedValue);
        }
        return formBody.join("&");
    }

    static setCache = async (data) => await Util.FRANKLIN_UPLOAD_KV?.put('token', JSON.stringify(data))

    static getCache = async() => {
        let data = await Util.FRANKLIN_UPLOAD_KV?.get('token');
        if (data) {
            return JSON.parse(data);
        }
        return {};
    }

    static isTokenExipred = (error) => error?.message === 'Access token has expired or is not yet valid.'
}