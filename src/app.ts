// Imports
import express, { Express } from 'express';
import { requestId } from './middleware/utilMiddleware';
import { errorHandler } from './middleware/errorMiddleware';
import { encryptionController } from './controllers/encryptionController';
import { encryptionRequestsController } from './controllers/encryptionRequestsController';

const app: Express = express();

// Body parser
app.use(express.json());
app.use(express.urlencoded({extended: true}));

// Request ID middleware
app.use(requestId);

// Routes
app.use('/crypto', encryptionController);
app.use('/encryptionRequests', encryptionRequestsController);

// Error handler
app.use(errorHandler);

export default app;
