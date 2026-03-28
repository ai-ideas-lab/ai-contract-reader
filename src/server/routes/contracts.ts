import { Router } from 'express';
import { uploadContract, getContract, getUserContracts, deleteContract } from '../controllers/contractController';
import { authenticate } from '../middleware/auth';
import multer from 'multer';

const router = Router();

const upload = multer({
  dest: 'uploads/',
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE || '10485760') // 10MB
  }
});

// 所有路由都需要认证
router.use(authenticate);

// 上传合同
router.post('/upload', upload.single('file'), uploadContract);

// 获取特定合同
router.get('/:id', getContract);

// 获取用户的合同列表
router.get('/', getUserContracts);

// 删除合同
router.delete('/:id', deleteContract);

export default router;