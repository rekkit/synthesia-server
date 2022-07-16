
import { HTTP_CODE } from "./http.codes";

export class HttpError extends Error {

    statusCode: HTTP_CODE;

    constructor(message: string, statusCode: HTTP_CODE) {
        super(message);

        this.statusCode = statusCode;
    }

}

