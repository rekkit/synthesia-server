// Imports
import { CryptoRequest, CRYPTO_REQUEST_TYPE } from "@prisma/client";
import express, { Router, Request, Response } from "express";
import prismaClient from "../config/prisma.client";
import { HTTP_CODE } from "../http/http.codes";
import { validatorResultHandler } from "../middleware/errorMiddleware";
import { EncryptRequestResponse, VerifyRequestResponse } from "../models/cryptoRequestResponse";
import { requestIdValidator } from "./encryptionRequestsControllerValidation";

const encryptionRequestsController: Router = express.Router();

encryptionRequestsController.get(
    '',
    requestIdValidator,
    validatorResultHandler,
    function (req: Request, res: Response) {

        const requestId: string = req.query["requestId"]?.toString()!;

        prismaClient.cryptoRequest.findFirst({
            where: {
                id: requestId
            }
        })
            .then((encryptionRequest: CryptoRequest | null) => {
                if (encryptionRequest == null) {
                    res.status(HTTP_CODE.NOT_FOUND);
                    return res.send();
                }

                res.status(HTTP_CODE.OK);

                if (encryptionRequest.type == CRYPTO_REQUEST_TYPE.Encrypt) {
                    res.send(new EncryptRequestResponse(
                        requestId,
                        encryptionRequest.state,
                        encryptionRequest.encryptedMessageExternal
                    ));
                }
                else {
                    res.send(new VerifyRequestResponse(
                        requestId,
                        encryptionRequest.state,
                        encryptionRequest.verificationResult
                    ));
                }
            })
            .catch(() => {
                res.status(HTTP_CODE.INTERNAL_SERVER_ERROR);
                return res.send();
            });
    });

export {
    encryptionRequestsController
}