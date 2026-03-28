import { Router } from 'express';
import { createAnalysis, getAnalysis, getContractAnalyses } from '../controllers/analysisController';
import { authenticate } from '../middleware/auth';

const router = Router();

// 所有路由都需要认证
router.use(authenticate);

// 创建分析
router.post('/', createAnalysis);

// 获取特定分析
router.get('/:id', getAnalysis);

// 获取合同的所有分析
router.get('/contract/:contractId', getContractAnalyses);

export default router;