import { CRYPTO_REQUEST_STATE, CRYPTO_REQUEST_TYPE } from "@prisma/client";

abstract class CryptoRequestResponse {

    requestId: string;

    state: CRYPTO_REQUEST_STATE;

    type: CRYPTO_REQUEST_TYPE;

    constructor(requestId: string, state: CRYPTO_REQUEST_STATE, type: CRYPTO_REQUEST_TYPE) {
        this.requestId = requestId
        this.state = state
        this.type = type
    }
}

class EncryptRequestResponse extends CryptoRequestResponse {

    value: { signature: string | null }

    constructor(
        requestId: string,
        state: CRYPTO_REQUEST_STATE,
        signature: string | null
    ) {
        super(requestId, state, CRYPTO_REQUEST_TYPE.Encrypt);
        this.value = { signature }
    }
}

class VerifyRequestResponse extends CryptoRequestResponse {

    value: { isValidMessageSignaturePair: boolean | null }

    constructor(
        requestId: string,
        state: CRYPTO_REQUEST_STATE,
        isValidMessageSignaturePair: boolean | null
    ) {
        super(requestId, state, CRYPTO_REQUEST_TYPE.Verify);
        this.value = { isValidMessageSignaturePair }
    }
}

export {
    EncryptRequestResponse,
    VerifyRequestResponse
}