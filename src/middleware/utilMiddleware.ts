// Imports
import { v4 } from 'uuid';
import { NextFunction, Request, Response } from 'express';

function requestId(req: Request, res: Response, next: NextFunction) {

    req.requestId = v4();
    next();
}

export {
    requestId
}
