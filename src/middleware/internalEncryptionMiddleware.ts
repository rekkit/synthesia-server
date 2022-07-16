// Imports
import { CRYPTO_REQUEST_TYPE, CryptoRequest, CRYPTO_REQUEST_STATE } from "@prisma/client";
import { NextFunction, Request, Response } from "express";
import { EncryptionPair } from "../../@types/encryptionPair";
import prismaClient from "../config/prisma.client";
import { HTTP_CODE } from "../http/http.codes";
import { EncryptRequestResponse, VerifyRequestResponse } from "../models/cryptoRequestResponse";
import { encrypt } from "../services/cryptoService";
import Singleton from "../services/externalEncryptionService";

function handleExternalEncryptionResponse(req: Request, res: Response, next: NextFunction) {

    // Get the message from the request.
    const message: string = req.query['message']?.toString()!;

    // Encrypt the message
    const pair: EncryptionPair = encrypt(message);

    // Get the external service
    const externalEncryptionService = Singleton.getInstance();
    const encryptionSucceeded: boolean = req.encryptedMessage != undefined;

    prismaClient.cryptoRequest.create({
        data: {
            id: req.requestId,
            createdAt: new Date(),
            lastAttempt: new Date(),
            numberOfAttempts: 0,
            initVector: pair.initVector,
            type: CRYPTO_REQUEST_TYPE.Encrypt,
            encryptedMessageInternal: pair.encryptedMessage,
            state: encryptionSucceeded ? CRYPTO_REQUEST_STATE.Completed : CRYPTO_REQUEST_STATE.Pending
        }
    })
        .then((record: CryptoRequest) => {

            if (encryptionSucceeded) {
                res.status(HTTP_CODE.OK);
                return res.send(new EncryptRequestResponse(
                    record.id,
                    CRYPTO_REQUEST_STATE.Completed,
                    req.encryptedMessage
                ));
            }

            externalEncryptionService.incrementBacklog();
            res.status(HTTP_CODE.CREATED);
            return res.send(new EncryptRequestResponse(
                record.id,
                CRYPTO_REQUEST_STATE.Pending,
                null
            ));
        })
        .catch(() => {
            res.send(HTTP_CODE.INTERNAL_SERVER_ERROR);
        })
}

function handleExternalVerifyResponse(req: Request, res: Response, next: NextFunction) {

    // Get the message from the request.
    const message: string = req.query['message']?.toString()!;
    const signature: string = req.query['signature']?.toString()!;

    // Encrypt the message
    const pair: EncryptionPair = encrypt(message);

    // Get the external service
    const externalEncryptionService = Singleton.getInstance();
    const verificationSucceeded: boolean = req.verificationResult != undefined;

    prismaClient.cryptoRequest.create({
        data: {
            id: req.requestId,
            createdAt: new Date(),
            lastAttempt: new Date(),
            numberOfAttempts: 0,
            type: CRYPTO_REQUEST_TYPE.Verify,
            encryptedMessageExternal: signature,
            initVector: verificationSucceeded ? '' : pair.initVector,
            encryptedMessageInternal: verificationSucceeded ? '' : pair.encryptedMessage,
            state: verificationSucceeded ? CRYPTO_REQUEST_STATE.Completed : CRYPTO_REQUEST_STATE.Pending
        }
    })
        .then((record: CryptoRequest) => {

            if (verificationSucceeded) {
                res.status(HTTP_CODE.OK);
                return res.send(new VerifyRequestResponse(
                    record.id,
                    CRYPTO_REQUEST_STATE.Completed,
                    req.verificationResult
                ));
            }

            externalEncryptionService.incrementBacklog();
            res.status(HTTP_CODE.CREATED);
            return res.send(new VerifyRequestResponse(
                record.id,
                CRYPTO_REQUEST_STATE.Pending,
                null
            ));
        })
        .catch(() => {
            res.send(HTTP_CODE.INTERNAL_SERVER_ERROR);
        })
}

export {
    handleExternalEncryptionResponse,
    handleExternalVerifyResponse
}