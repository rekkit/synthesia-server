# synthesia-server
Proxy server for the unreliable crypto API.

# Instructions
Below are the instructions on how to set up the server and how to use the three endpoints that this API has.

## Setup
To set up the server, extract the `docker-compose.yml` and `.env` files that you received from me into a directory. Then run:

    docker compose up -d

The server listens on port `3000` while PostgreSQL is available on port `5433` on the host. Make sure these ports aren't being used by other processes. The password for the database will also be sent to you. If you want to see what's going on under the hood, connect to the postgres instance using the password on port `5433`.

There is a single table and you can query it using the below query:
```
select 
    * 
from 
    "CryptoRequest" cr 
order by 
    state, "lastAttempt" desc
```

The fields of interest are `state` and `type`, both of which are explained in detail in the next section.
    
## Endpoints
### Sign
You can request that the server sign a message using the call: 

    GET http://localhost:3000/crypto/sign?message={message}


The response will have the form:
```
{
    "requestId": "ae8bf091-ee38-4fb5-b15a-f304ccb611ea",
    "state": <STATE>,
    "type": "Encrypt",
    "value": {
        "signature": <SIGNATURE>
    }
}
```

`<STATE>` can be either `Pending` or `Completed`. 
* If it is `Pending`, the `signature` field will be `null` since we haven't received a response from the unreliable server yet, or we haven't been able to make a request because of rate limiting. 
* If it is `Completed`, the `signature` field will contain the response from the unreliable server.
 
If the request is `Pending`, you can poll for its status using the third API call (see below).

### Verify
You can request that the server verify a message given a signature, using the call: 

    GET http://localhost:3000/crypto/verify?message={message}&signature={signature}

The response will have the form:
```
{
    "requestId": "fa292e12-5acb-486f-8d90-fe003eef84fe",
    "state": <STATE>,
    "type": "Verify",
    "value": {
        "isValidMessageSignaturePair": <IS_VALID_MSG>
    }
}
```

Again, `<STATE>` can be either `Pending` or `Completed`. 
* If it is `Pending`, the `isValidMessageSignaturePair` field will be `null` since we don't have a response ready yet.
* If it is `Completed`, the `isValidMessageSignaturePair` field will contain the response from the unreliable server, either `true` or `false`.

Although the external API doesn't fail for the verify endpoint, we are still subject to rate limiting, so you might not always get a result from this API on the first attempt. Again, if the request is `Pending`, you can poll for its status using the third API call (see below).

### Poll requests
This endpoint allows you to check the status of a sign or verify operation and is called as shown below:
   
    GET http://localhost:3000/crypto/requests?requestId={requestId}

You get the `requestId` from the server when you call the sign or verify endpoints. The response from this endpoint is the following:
```
{
    "requestId": "fa292e12-5acb-486f-8d90-fe003eef84fe",
    "state": <STATE>,
    "type": <REQUEST_TYPE>,
    "value": {
        "isValidMessageSignaturePair": <IS_VALID_MSG>
    }
}
```
* `state` can be `Pending` or `Completed`. If it's `Pending`, keep polling until you get a response with the `Completed` state.
* `type` is the type of the request, i.e. `Encrypt` or `Verify`. This is so that the response has the same shape for both operations.
* `value` is the value of the response. 
    * If the operation is an `Encrypt` operation, the `value` field has the shape:
        ```
        "value": {
            "signature": <SIGNATURE>
        }
        ```
    * If the operation is a `Verify` operation, the `value` field has the shape:
        ```
        "value": {
            "isValidMessageSignaturePair": <IS_VALID_MSG>
        }
        ```
