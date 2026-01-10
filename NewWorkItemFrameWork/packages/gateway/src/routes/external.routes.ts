import { Router } from 'express';
import { DataPoolController } from '../controllers/DataPoolController';
import { AuditLogController } from '../controllers/AuditLogController';
import { InboxConfigController } from '../controllers/InboxConfigController';

const router = Router();

// Initialize controllers
const dataPoolController = new DataPoolController();
const auditLogController = new AuditLogController();
const inboxConfigController = new InboxConfigController();

// DataPool routes
router.post('/datapool', (req, res) => dataPoolController.upsertData(req, res));
router.get('/datapool/:caseId', (req, res) => dataPoolController.getData(req, res));
router.delete('/datapool/:caseId', (req, res) => dataPoolController.deleteData(req, res));

// AuditLog routes
router.post('/auditlog', (req, res) => auditLogController.logEvent(req, res));
router.get('/auditlog/:caseId', (req, res) => auditLogController.getEventsByCaseId(req, res));
router.get('/auditlog/event/:eventType', (req, res) => auditLogController.getEventsByType(req, res));

// InboxConfig routes
router.post('/inboxconfig', (req, res) => inboxConfigController.create(req, res));
router.get('/inboxconfig', (req, res) => inboxConfigController.getAll(req, res));
router.get('/inboxconfig/:templateId', (req, res) => inboxConfigController.getByTemplateId(req, res));
router.put('/inboxconfig/:templateId', (req, res) => inboxConfigController.update(req, res));
router.delete('/inboxconfig/:templateId', (req, res) => inboxConfigController.delete(req, res));

export default router;
