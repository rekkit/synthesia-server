// Imports
import express, { Router, Request, Response } from "express";
import { signValidator, verifyValidator } from "./encryptionControllerValidation";
import { validatorResultHandler } from "../middleware/errorMiddleware";
import { encryptMessageExternal, verifyExternal } from '../middleware/externalCryptoMiddleware';
import { handleExternalEncryptionResponse, handleExternalVerifyResponse } from '../middleware/internalEncryptionMiddleware';
import { HTTP_CODE } from "../http/http.codes";

const encryptionController: Router = express.Router();

encryptionController.get(
    '/sign',
    signValidator, // Checks the call to make sure everything is there. 
    validatorResultHandler, // Handles the validator result if there's an exception.
    encryptMessageExternal, // Makes a call to the external API to try and encrypt the message
    handleExternalEncryptionResponse, // We either got a response from the external API or we didn't. This middleware handles both cases.
    function (res: Response) {

        // We shouldn't make it this far since the middleware should have handled everything. Return an internal server error.
        res.status(HTTP_CODE.INTERNAL_SERVER_ERROR);
        res.send();
    });

encryptionController.get(
    '/verify',
    verifyValidator, // Checks the call to make sure everything is there. 
    validatorResultHandler, // Handles the validator result if there's an exception.
    verifyExternal, // Sends a request to the external crypto service to try and verify the message.
    handleExternalVerifyResponse, // Handles the response from the API. If we didn't get a response, creates the pending request in the DB.
    function (res: Response) {

        // We shouldn't make it this far since the middleware should have handled everything. Return an internal server error.
        res.status(HTTP_CODE.INTERNAL_SERVER_ERROR);
        res.send();
    });

export {
    encryptionController
}
