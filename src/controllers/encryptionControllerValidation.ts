import { check } from "express-validator";
import { HTTP_CODE } from "../http/http.codes";
import { HttpError } from "../http/http.error";

// Validaton chains
const messageValidationChain = check('message')
    .exists()
    .withMessage(new HttpError('Must pass a message parameter.', HTTP_CODE.BAD_REQUEST));

const signatureValidationChain = check('signature')
    .exists()
    .withMessage(new HttpError('Must pass a signature parameter.', HTTP_CODE.BAD_REQUEST));

// Validators
const signValidator = [
    messageValidationChain
]

const verifyValidator = [
    messageValidationChain,
    signatureValidationChain
]

export {
    signValidator,
    verifyValidator
}
