import app from './app';
import Singleton from './services/externalEncryptionService';

const externalEncryptionService = Singleton.getInstance();

setInterval(() => { externalEncryptionService.processBacklog() }, 1000);

app.listen(3000, "0.0.0.0");