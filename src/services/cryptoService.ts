// Imports
import crypto from 'crypto';
import { HTTP_CODE } from '../http/http.codes';
import { HttpError } from '../http/http.error';
import { EncryptionPair } from '../../@types/encryptionPair';

const algorithm = 'aes-256-cbc';

function encrypt(message: string): EncryptionPair {

    const key: Buffer = _getKey();

    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(algorithm, key, iv);
    const encrypted = Buffer.concat([cipher.update(message), cipher.final()]);

    return {
        initVector: iv.toString("hex"),
        encryptedMessage: encrypted.toString("hex")
    }
}

function decrypt(pair: EncryptionPair): string {

    const key: Buffer = _getKey();

    const decipher = crypto.createDecipheriv(algorithm, key, Buffer.from(pair.initVector, "hex"));
    const decrypted = Buffer.concat([decipher.update(Buffer.from(pair.encryptedMessage, "hex")), decipher.final()]);

    return decrypted.toString();
}

function _getKey(): Buffer {
    const key = process.env.ENCRYPTION_KEY;

    if (key === undefined) {
        throw new HttpError('', HTTP_CODE.INTERNAL_SERVER_ERROR);
    }

    return Buffer.from(key, "hex");
}

export {
    encrypt,
    decrypt
}
