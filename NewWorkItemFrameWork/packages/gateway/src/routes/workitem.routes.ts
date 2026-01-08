import { Router } from 'express';
import { WorkItemController } from '../controllers/WorkItemController';

const router = Router();
const controller = new WorkItemController();

// Command endpoints
router.post('/:workItemId/claim', controller.claim);
router.post('/:workItemId/complete', controller.complete);
router.post('/:workItemId/cancel', controller.cancel);

// Query endpoints
router.get('/:workItemId', controller.getWorkItem);
router.get('/user/:userId', controller.getWorkItemsByUser);
router.get('/state/:state', controller.getWorkItemsByState);
router.get('/', controller.getAllWorkItems);

export const workItemRoutes = router;
