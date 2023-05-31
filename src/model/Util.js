import { uuid } from "@cfworker/uuid";

export function getURLEncoded(data) {
    const formBody = [];
    for (var property in data) {
        var encodedKey = encodeURIComponent(property);
        var encodedValue = encodeURIComponent(data[property]);
        formBody.push(encodedKey + "=" + encodedValue);
    }
    return formBody.join("&");
}

export function sanitizeFileName(fileName) {
    return fileName.replace(/[^a-z0-9]/gi, '_').toLowerCase();
}

export function getUUID() {
    return uuid();
}

export function isTokenExipred (error) {
    return error?.message === 'Access token has expired or is not yet valid.'
}