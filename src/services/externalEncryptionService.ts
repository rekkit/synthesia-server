// Imports
import { CryptoRequest, CRYPTO_REQUEST_STATE, CRYPTO_REQUEST_TYPE } from "@prisma/client";
import axios, { AxiosError, AxiosRequestConfig, AxiosResponse } from "axios";
import prismaClient from "../config/prisma.client";
import { HTTP_CODE } from "../http/http.codes";
import { HttpError } from "../http/http.error";
import { Queue } from "../util/queue";
import { decrypt } from "./cryptoService";

class ExternalEncryptionService {

    httpConfig: AxiosRequestConfig = { headers: { Authorization: process.env.SYNTHESIA_API_KEY! } }

    requestsInBacklog: number = 0;

    maxRequestsPerMinute: number = process.env.MAX_REQUESTS_PER_MINUTE == null
        ? 10 : Number(process.env.MAX_REQUESTS_PER_MINUTE);

    lastNRequests: Queue<Date> = new Queue<Date>(this.maxRequestsPerMinute);

    constructor() {
        prismaClient.cryptoRequest.aggregate({
            where: {
                state: {
                    equals: CRYPTO_REQUEST_STATE.Pending
                }
            },
            _count: {
                _all: true
            }
        })
            .then((res) => {
                
                Singleton.instance.requestsInBacklog = res._count._all;
            })
            .catch(() => {
                // Do nothing
            })

        prismaClient.cryptoRequest.findMany({
            orderBy: {
                lastAttempt: "desc"
            },
            take: this.maxRequestsPerMinute
        })
            .then((encryptionRequests) => {

                for (let i = encryptionRequests.length - 1; i > -1; i--) {
                    this.lastNRequests.queue(encryptionRequests[i].lastAttempt);
                }
            })
            .catch(() => {
                // Do nothing.
            })
    }

    isInvalidMessageSignaturePair(response: AxiosResponse<string, any> | undefined): boolean | null {

        if (response === undefined) return null;

        if (response.status === HTTP_CODE.BAD_REQUEST && response.data == 'Error 400: Invalid signature for message!\n') return true;

        if (response.status === HTTP_CODE.OK) return true;

        return null;
    }

    // If we haven't made any requests OR
    // We've made less than 10 requests in total OR
    // The last request was more than a minute ago
    // We can make a request to the API.
    isRequestPossible(): boolean {

        let oldestRequestTime: Date | null = this.lastNRequests.oldest();

        return oldestRequestTime == null || 
            this.lastNRequests.size() < this.maxRequestsPerMinute || 
            (new Date().valueOf() - oldestRequestTime.valueOf()) > 60000;
    }

    externalEncryptRequest(message: string): Promise<AxiosResponse<string, any>> | null {

        if (this.isRequestPossible()) {

            this.lastNRequests.queue(new Date());
            return axios.get(`https://hiring.api.synthesia.io/crypto/sign?message=${message}`, this.httpConfig);
        }

        // Otherwise, return null
        return null;
    }

    externalVerifyRequest(message: string, signature: string): Promise<AxiosResponse<string, any>> | null {

        if (this.isRequestPossible()) {

            this.lastNRequests.queue(new Date());
            return axios.get(`https://hiring.api.synthesia.io/crypto/verify?message=${message}&signature=${signature}`, this.httpConfig);
        }

        // Otherwise, return null
        return null;
    }

    incrementBacklog(): void {
        this.requestsInBacklog += 1;
    }

    processEncryptRequest(cryptoRequest: CryptoRequest): void {

        const message: string = decrypt({ 
            initVector: cryptoRequest.initVector!, 
            encryptedMessage: cryptoRequest.encryptedMessageInternal! });
        const encryptionPromise = this.externalEncryptRequest(message);

        // If the promise is null, we can't make a request so we exit the loop.
        if (encryptionPromise == null) return;

        // If we can make a request, we make it.
        cryptoRequest.lastAttempt = new Date();
        cryptoRequest.numberOfAttempts++;

        encryptionPromise
            .then((externalEncryptionReq) => {

                cryptoRequest.encryptedMessageExternal = externalEncryptionReq.data;
                cryptoRequest.state = CRYPTO_REQUEST_STATE.Completed;

                prismaClient.cryptoRequest.update({
                    where: {
                        id: cryptoRequest.id
                    },
                    data: cryptoRequest
                })
                    .then(() => {
                        // Nothing to do if the update was a success.
                    })
                    .catch((err) => { 
                        throw err 
                    });
            })
            .catch(() => {
                
                prismaClient.cryptoRequest.update({
                    where: {
                        id: cryptoRequest.id
                    },
                    data: cryptoRequest
                })
                    .then(() => {
                        // Nothing to do if the update was a success.
                    })
                    .catch((err) => { 
                        throw err 
                    });
            });
    }

    processVerifyRequest(cryptoRequest: CryptoRequest): void {
        
        const message: string = decrypt({ 
            initVector: cryptoRequest.initVector!, 
            encryptedMessage: cryptoRequest.encryptedMessageInternal! });
        const verifyPromise = this.externalVerifyRequest(message, cryptoRequest.encryptedMessageExternal!);

        // If the promise is null, we can't make a request so we exit the loop.
        if (verifyPromise == null) return;

        // If we can make a request, we make it.
        cryptoRequest.lastAttempt = new Date();
        cryptoRequest.numberOfAttempts++;

        verifyPromise
            .then(() => {

                cryptoRequest.verificationResult = true;
                cryptoRequest.state = CRYPTO_REQUEST_STATE.Completed;

                prismaClient.cryptoRequest.update({
                    where: {
                        id: cryptoRequest.id
                    },
                    data: cryptoRequest
                })
                    .then(() => {
                        // Nothing to do if the update was a success.
                    })
                    .catch((err) => { 
                        throw err;
                    });
            })
            .catch((err: AxiosError<string, any>) => {

                // If we get a 400 + the correct message, we know the message and signature don't match.
                // Update the request to reflect that.
                if (this.isInvalidMessageSignaturePair(err.response)) {
                    cryptoRequest.verificationResult = false;
                    cryptoRequest.state = CRYPTO_REQUEST_STATE.Completed;
                }
                
                prismaClient.cryptoRequest.update({
                    where: {
                        id: cryptoRequest.id
                    },
                    data: cryptoRequest
                })
                    .then(() => {
                        // Nothing to do if the update was a success.
                    })
                    .catch((err) => { 
                        throw err 
                    });
            });
    }

    processBacklog(): void {

        if (this.requestsInBacklog === 0 || !this.isRequestPossible()) return;

        const backlogPromise = prismaClient.cryptoRequest.findMany({
            where: {
                state: {
                    not: CRYPTO_REQUEST_STATE.Completed
                }
            },
            orderBy: {
                lastAttempt: 'asc'
            },
            take: this.maxRequestsPerMinute
        });

        backlogPromise
            .then((cryptoRequests: CryptoRequest[]) => {

                for (let cryptoReq of cryptoRequests) {

                    switch (cryptoReq.type) {
                        case CRYPTO_REQUEST_TYPE.Encrypt:
                            this.processEncryptRequest(cryptoReq);
                            break;
                        case CRYPTO_REQUEST_TYPE.Verify:
                            this.processVerifyRequest(cryptoReq)
                            break;
                        default:
                            throw new HttpError('', HTTP_CODE.INTERNAL_SERVER_ERROR);
                    }                    
                }
            })
            .catch(() => {
                // Do nothing, usually I would log here.
                // We don't want to block repeat execution because of a DB error.
            });        
    }
}

class Singleton {

    static instance: ExternalEncryptionService;

    constructor() {
        throw new Error("Do not use the constructor to get the singleton. Instead, use Singleton.getInstance().")
    }

    static getInstance(): ExternalEncryptionService {

        if (!Singleton.instance) {
            Singleton.instance = new ExternalEncryptionService();
        }

        return Singleton.instance;
    }
}

export default Singleton;