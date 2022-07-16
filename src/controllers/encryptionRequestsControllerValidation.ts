// Imports
import { query } from "express-validator";
import { HTTP_CODE } from "../http/http.codes";
import { HttpError } from "../http/http.error";

// Validaton chains
const requestIdValidationChain = query('requestId')
    .exists()
    .withMessage(new HttpError('Must pass a requestId as a query parameter.', HTTP_CODE.BAD_REQUEST))
    .isUUID()
    .withMessage(new HttpError('The requestId query parameter must be a valid UUID.', HTTP_CODE.BAD_REQUEST));

// Validators
const requestIdValidator = [
    requestIdValidationChain
]

export {
    requestIdValidator
}
