import { uuid } from "@cfworker/uuid";
import src from "..";

const nonAlphNumeric = /[^a-z0-9]/gi;
const replaceBy = "_";

export function sanitizeFileName(fileName) {
    let lastIndex = fileName?.lastIndexOf('.');
    if (lastIndex != -1) {
        const name = fileName.substr(0, lastIndex);
        const extension = fileName.substr(lastIndex+1);
        return name.replace(nonAlphNumeric, replaceBy).toLowerCase() + "." + extension.replace(nonAlphNumeric, replaceBy)
    }
    return fileName.replace(nonAlphNumeric, replaceBy).toLowerCase();
}

export function getUUID() {
    return uuid();
}

export function isTokenExipred (error) {
    return error?.message === 'Access token has expired or is not yet valid.'
}