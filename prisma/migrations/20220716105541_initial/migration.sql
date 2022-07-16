-- CreateEnum
CREATE TYPE "CRYPTO_REQUEST_TYPE" AS ENUM ('Encrypt', 'Verify');

-- CreateEnum
CREATE TYPE "CRYPTO_REQUEST_STATE" AS ENUM ('Pending', 'Completed');

-- CreateTable
CREATE TABLE "CryptoRequest" (
    "id" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL,
    "lastAttempt" TIMESTAMP(3) NOT NULL,
    "numberOfAttempts" INTEGER NOT NULL,
    "state" "CRYPTO_REQUEST_STATE" NOT NULL DEFAULT 'Pending',
    "type" "CRYPTO_REQUEST_TYPE" NOT NULL,
    "initVector" VARCHAR,
    "encryptedMessageInternal" VARCHAR,
    "encryptedMessageExternal" VARCHAR,
    "verificationResult" BOOLEAN,

    CONSTRAINT "CryptoRequest_pkey" PRIMARY KEY ("id")
);
