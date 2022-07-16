
declare namespace Express {
    interface Request {
        requestId: string,
        encryptedMessage: string?,
        verificationResult: boolean
    }
}