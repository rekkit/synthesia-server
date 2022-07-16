import axios from "axios";
import { HTTP_CODE } from "../http/http.codes";
import { HttpError } from "../http/http.error";
import { NextFunction, Request, Response } from "express";
import { Result, ValidationError, validationResult } from "express-validator";

function validatorResultHandler(req: Request, res: Response, next: NextFunction) {

    let err: Result<ValidationError> = validationResult(req);

    if (!err.isEmpty()) {

        let errorArray: ValidationError[] = err.array();
        let httpErr: HttpError = errorArray.length === 0 ? null : errorArray[0].msg;

        return httpErr === undefined || httpErr === null
            ? next(new HttpError('', HTTP_CODE.BAD_REQUEST))
            : next(httpErr);
    }

    next();
}

function errorHandler(err: HttpError, req: Request, res: Response, next: NextFunction) {

    if (HTTP_CODE[err.statusCode]) {
        res.status(err.statusCode);
    }
    else {
        res.status(HTTP_CODE.INTERNAL_SERVER_ERROR);
    }

    res.send(err.message);
}

export {
    errorHandler,
    validatorResultHandler
}