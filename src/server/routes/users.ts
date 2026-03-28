import { Router } from 'express';
import { register, login, getProfile } from '../controllers/userController';

const router = Router();

// 用户注册
router.post('/register', register);

// 用户登录
router.post('/login', login);

// 获取用户信息（需要认证）
router.get('/profile', getProfile);

export default router;