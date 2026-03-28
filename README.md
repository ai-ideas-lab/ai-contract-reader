# AI Contract Reader (AI 合同阅读助手)

一个基于AI的合同阅读助手，帮助普通人理解复杂的法律条款。

## 功能特性

- 📄 **多格式支持**: 支持PDF和DOCX格式的合同文件
- 🤖 **AI智能分析**: 使用OpenAI GPT-4进行专业的合同分析
- 🔍 **多维度分析**: 
  - 合同摘要和关键条款提取
  - 风险评估和识别
  - 义务分析和建议
  - 个性化解读
- 📊 **用户友好界面**: 简洁的React前端界面
- 🔐 **安全认证**: JWT用户认证系统
- 📱 **响应式设计**: 支持桌面和移动设备

## 技术栈

### 后端
- **Node.js + Express.js**: 服务器框架
- **TypeScript**: 类型安全的JavaScript
- **Prisma**: 数据库ORM
- **PostgreSQL**: 主数据库
- **OpenAI API**: AI服务集成
- **JWT**: 用户认证
- **Multer**: 文件上传处理

### 前端
- **React 18**: 用户界面库
- **Material-UI**: UI组件库
- **Vite**: 构建工具
- **TypeScript**: 类型安全

## 快速开始

### 环境要求

- Node.js 18+
- npm 8+
- PostgreSQL 12+

### 安装步骤

1. **克隆项目**
```bash
git clone https://github.com/ai-ideas-lab/ai-contract-reader.git
cd ai-contract-reader
```

2. **安装依赖**
```bash
npm install
```

3. **环境配置**
```bash
cp .env.example .env
```

编辑 `.env` 文件，配置以下变量：
```env
# 数据库配置
DATABASE_URL="postgresql://username:password@localhost:5432/ai_contract_reader"

# OpenAI API密钥
OPENAI_API_KEY="your_openai_api_key_here"

# JWT密钥
JWT_SECRET="your_jwt_secret_here"

# 服务器配置
PORT=8000
NODE_ENV=development

# 前端配置
CORS_ORIGIN="http://localhost:3000"
```

4. **数据库设置**
```bash
# 生成Prisma客户端
npm run db:generate

# 运行数据库迁移
npm run db:migrate
```

5. **启动开发服务器**
```bash
# 同时启动前端和后端
npm run dev
```

这将启动：
- 后端服务器: http://localhost:8000
- 前端开发服务器: http://localhost:3000

## 项目结构

```
ai-contract-reader/
├── src/
│   ├── server/                 # 后端代码
│   │   ├── controllers/       # 控制器
│   │   ├── routes/           # 路由
│   │   ├── services/         # 服务层
│   │   ├── middleware/       # 中间件
│   │   └── index.ts          # 服务器入口
│   ├── components/           # React组件
│   ├── utils/               # 工具函数
│   ├── types/               # TypeScript类型
│   ├── App.tsx             # 主应用组件
│   └── index.tsx            # React入口
├── prisma/
│   └── schema.prisma       # 数据库模式
├── uploads/               # 文件上传目录
├── dist/                  # 构建输出
└── package.json           # 项目配置
```

## API文档

### 用户认证
- `POST /api/users/register` - 用户注册
- `POST /api/users/login` - 用户登录
- `GET /api/users/profile` - 获取用户信息

### 合同管理
- `POST /api/contracts/upload` - 上传合同文件
- `GET /api/contracts` - 获取用户合同列表
- `GET /api/contracts/:id` - 获取特定合同
- `DELETE /api/contracts/:id` - 删除合同

### 合同分析
- `POST /api/analyses` - 创建合同分析
- `GET /api/analyses/:id` - 获取特定分析
- `GET /api/analyses/contract/:contractId` - 获取合同的所有分析

### 其他
- `GET /api/health` - 健康检查

## 使用说明

### 1. 注册账号
首次使用需要注册账号，提供邮箱、密码和姓名。

### 2. 上传合同
- 点击"上传合同"按钮
- 选择PDF或DOCX格式的合同文件
- 填写合同标题和选择合同类型
- 上传文件后，系统会自动进行AI分析

### 3. 查看分析结果
- 在合同列表中可以看到AI生成的摘要和关键条款
- 点击合同可以查看详细的分析报告
- 支持多种分析类型：综合分析、关键条款、风险评估、义务审查

### 4. 管理合同
- 可以查看所有上传的合同
- 支持删除不需要的合同文件
- 合同分析结果会自动保存

## 开发命令

```bash
# 开发环境
npm run dev          # 启动前后端开发服务器
npm run dev:server   # 仅启动后端
npm run dev:client   # 仅启动前端

# 构建生产版本
npm run build        # 构建前后端
npm run build:server # 仅构建后端
npm run build:client # 仅构建前端

# 数据库操作
npm run db:migrate   # 运行数据库迁移
npm run db:generate  # 生成Prisma客户端
npm run db:studio    # 打开Prisma Studio

# 测试和代码质量
npm run test         # 运行测试
npm run test:watch   # 监听模式运行测试
npm run lint         # 代码检查
npm run lint:fix     # 自动修复代码问题
```

## 部署指南

### 环境配置
生产环境中需要设置：
- 生产数据库URL
- OpenAI API密钥
- JWT密钥
- CORS配置

### 构建和部署
```bash
# 构建生产版本
npm run build

# 启动生产服务器
npm start
```

### Docker部署
```bash
# 构建镜像
docker build -t ai-contract-reader .

# 运行容器
docker run -p 8000:8000 ai-contract-reader
```

## 数据库模式

主要数据表：
- `users`: 用户信息
- `contracts`: 合同文件和元数据
- `analyses`: AI分析结果

详细定义请参考 `prisma/schema.prisma`。

## 安全考虑

- 用户密码使用bcrypt加密存储
- JWT令牌用于用户认证
- 文件上传大小限制（10MB）
- API速率限制保护
- CORS配置限制访问来源

## 贡献指南

1. Fork项目
2. 创建功能分支
3. 提交更改
4. 推送到分支
5. 创建Pull Request

## 许可证

MIT License

## 联系方式

- 项目主页: https://github.com/ai-ideas-lab/ai-contract-reader
- 问题反馈: https://github.com/ai-ideas-lab/ai-contract-reader/issues

---

*AI Ideas Lab - 让AI技术惠及每个人*