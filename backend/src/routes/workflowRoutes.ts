// workflowRoutes.ts
import { Router } from 'express';
import { executeWorkflow, getNodes } from '../controller/workflowController';

const router = Router();

router.post('/workflow/execute', executeWorkflow);
router.get('/nodes', getNodes);
router.post('/execute', executeWorkflow);

export default router;
