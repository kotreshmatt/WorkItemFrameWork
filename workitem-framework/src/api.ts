import express from 'express';
import bodyParser from 'body-parser';
import logger from './utils/logger';
import { workItemFramework } from './framework/WorkItemFramework';
import { UserRepository } from './framework/repositories/UserRepository';

const app = express();
app.use(bodyParser.json());

// init temporal client
(async () => {
  try {
    await workItemFramework.initTemporal();
    logger.info('WorkItemFramework temporal initialized');
  } catch (err) {
    logger.warn('Temporal init failed on server start', { err });
  }
})();

// basic health check
app.get('/health', (req, res) => res.json({ status: 'OK', ts: new Date().toISOString() }));

// create work item (POST /workitems)
app.post('/api/workitems', async (req, res) => {
  try {
    const config = req.body;
    const id = await workItemFramework.createWorkItem(config);
    res.status(201).json({ id });
  } catch (err: any) {
    logger.error('create workitem failed', { err });
    res.status(500).json({ error: err.message });
  }
});

// get workitem view
app.get('/api/workitems/:id', async (req, res) => {
  const id = parseInt(req.params.id, 10);
  try {
    const view = await workItemFramework.getWorkItemView(id);
    if (!view) return res.status(404).json({ error: 'Not found' });
    res.json(view);
  } catch (err: any) {
    logger.error('get workitem failed', { err, id });
    res.status(500).json({ error: err.message });
  }
});

// list for user
app.get('/api/workitems/user/:userId', async (req, res) => {
  try {
    const views = await workItemFramework.getUserWorkItemsViews(req.params.userId);
    res.json(views);
  } catch (err: any) {
    logger.error('list user workitems failed', { err });
    res.status(500).json({ error: err.message });
  }
});

// claim
app.post('/api/workitems/:id/claim', async (req, res) => {
  const id = parseInt(req.params.id, 10);
  const { userId } = req.body;
  try {
    await workItemFramework.claimWorkItem(id, userId);
    res.json({ ok: true });
  } catch (err: any) {
    logger.error('claim failed', { err, id, userId });
    res.status(400).json({ error: err.message });
  }
});

// complete
app.post('/api/workitems/:id/complete', async (req, res) => {
  const id = parseInt(req.params.id, 10);
  const { userId, resultData } = req.body;
  try {
    await workItemFramework.completeWorkItem(id, userId, resultData);
    res.json({ ok: true });
  } catch (err: any) {
    logger.error('complete failed', { err, id, userId });
    res.status(400).json({ error: err.message });
  }
});

// cancel
app.post('/api/workitems/:id/cancel', async (req, res) => {
  const id = parseInt(req.params.id, 10);
  const { reason } = req.body;
  try {
    await workItemFramework.cancelWorkItem(id, reason);
    res.json({ ok: true });
  } catch (err: any) {
    logger.error('cancel failed', { err, id });
    res.status(400).json({ error: err.message });
  }
});

// future enhancement: user api
const userRepo = new UserRepository();

app.get('/api/users/:id', async (req, res) => {
  try {
    const users = await userRepo.findByIds([req.params.id]);
    if (!users.length) return res.status(404).json({ error: 'Not found' });
    res.json(users[0]);
  } catch (err: any) {
    logger.error('get user failed', { err });
    res.status(500).json({ error: err.message });
  }
});

// cancel temporal workflow (graceful)
app.post('/api/workflows/:workflowId/cancel', async (req, res) => {
  const { workflowId } = req.params;
  try {
    await workItemFramework.cancelWorkflow(workflowId);
    res.json({ ok: true, message: `Cancel requested for workflow ${workflowId}` });
  } catch (err: any) {
    logger.error('cancel workflow failed', { err, workflowId });
    res.status(400).json({ error: err.message });
  }
});

const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;
app.listen(PORT, () => logger.info(`API Server listening on ${PORT}`));
