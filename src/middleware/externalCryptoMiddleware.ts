// Imports
import Singleton from '../services/externalEncryptionService';
import { NextFunction, Request, Response } from "express";
import { HTTP_CODE } from '../http/http.codes';
import { AxiosError } from 'axios';

function encryptMessageExternal(req: Request, res: Response, next: NextFunction) {

    // Get the encryption service singleton.
    const encryptionService = Singleton.getInstance();

    // Get the message from the request.
    const message: string = req.query['message']?.toString()!;

    const encryptionPromise = encryptionService.externalEncryptRequest(message);

    // If the encryption promise is null, we didn't even attempt a request because we're over the current limit.
    if (encryptionPromise == null) return next();

    // If the promise isn't null, we've made a request to the encryption server.
    encryptionPromise
        .then((encryptionRes) => {
            // If we got a response, we want to return it.
            req.encryptedMessage = encryptionRes.data;
            next();
        })
        .catch(() => {
            // If we didn't get a response because of an error, we move on.
            // The next middleware will handle it.
            next();
        });
}

function verifyExternal(req: Request, res: Response, next: NextFunction) {

    // Get the encryption service singleton.
    const encryptionService = Singleton.getInstance();

    // Get the message from the request as well as the signature.
    const message: string = req.query['message']?.toString()!;
    const signature: string = req.query['signature']?.toString()!;

    const verifyPromise = encryptionService.externalVerifyRequest(message, signature);

    if (verifyPromise == null) return next();

    // If the promise isn't null, we've made a request to the encryption server.
    verifyPromise
        .then(() => {
            // If we get a positive response, we know the signature and message are a match.
            req.verificationResult = true;
            next();
        })
        .catch((err: AxiosError<string, any>) => {
            // If we didn't get a response because of an error, we need to check what that error is.
            // If it's 400 the message doesn't match the signature. 
            if (encryptionService.isInvalidMessageSignaturePair(err.response)) {
                req.verificationResult = false;
            }

            // The next middleware will handle the response.
            next();
        });
}

export {
    encryptMessageExternal,
    verifyExternal
}