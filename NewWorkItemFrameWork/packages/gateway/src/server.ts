import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import { workItemRoutes } from './routes/workitem.routes';
import { errorHandler } from './middleware/errorHandler';
import { requestLogger } from './middleware/requestLogger';

const app = express();
const PORT = process.env.GATEWAY_PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(requestLogger);

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/workitems', workItemRoutes);

// Error handling
app.use(errorHandler);

app.listen(PORT, () => {
    console.log(`🚀 Gateway server running on port ${PORT}`);
    console.log(`📍 Health check: http://localhost:${PORT}/health`);
    console.log(`📍 API base: http://localhost:${PORT}/api/workitems`);
});
