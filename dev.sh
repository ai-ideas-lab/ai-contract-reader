#!/bin/bash

# AI Contract Reader 开发环境设置脚本
# 用于快速启动开发环境和进行常见操作

echo "🚀 AI Contract Reader 开发环境设置"
echo "====================================="

# 检查Node.js版本
echo "📋 检查环境..."
if ! command -v node &> /dev/null; then
    echo "❌ Node.js 未安装，请先安装 Node.js 18+"
    exit 1
fi

NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js 版本过低，需要 18+，当前版本: $(node --version)"
    exit 1
fi

echo "✅ Node.js 版本: $(node --version)"

# 检查npm
if ! command -v npm &> /dev/null; then
    echo "❌ npm 未安装"
    exit 1
fi

echo "✅ npm 版本: $(npm --version)"

# 检查PostgreSQL
if ! command -v psql &> /dev/null; then
    echo "⚠️  PostgreSQL 未安装，请确保数据库服务器运行在 localhost:5432"
    echo "   或者修改 .env 文件中的 DATABASE_URL"
fi

# 创建环境文件
if [ ! -f .env ]; then
    echo "📝 创建环境配置文件..."
    cp .env.example .env
    echo "✅ 已创建 .env 文件，请编辑其中的配置"
    echo "   特别是 DATABASE_URL 和 OPENAI_API_KEY"
else
    echo "✅ 环境配置文件已存在"
fi

# 安装依赖
echo "📦 安装项目依赖..."
npm install

if [ $? -ne 0 ]; then
    echo "❌ 依赖安装失败"
    exit 1
fi

echo "✅ 依赖安装完成"

# 生成Prisma客户端
echo "🗄️  生成数据库客户端..."
npm run db:generate

if [ $? -ne 0 ]; then
    echo "❌ 数据库客户端生成失败"
    exit 1
fi

echo "✅ 数据库客户端生成完成"

# 检查数据库连接
echo "🔍 检查数据库连接..."
if command -v psql &> /dev/null; then
    # 尝试从.env文件提取数据库URL
    if [ -f .env ]; then
        DB_URL=$(grep DATABASE_URL .env | cut -d'=' -f2-)
        if [ -n "$DB_URL" ]; then
            # 简单检查数据库连接
            DB_NAME=$(echo $DB_URL | grep -oP '/\K[^?]+' | head -1)
            if psql "$DB_URL" -c "SELECT 1;" &> /dev/null; then
                echo "✅ 数据库连接正常"
                
                # 运行迁移
                echo "🔄 运行数据库迁移..."
                npm run db:migrate
                
                if [ $? -eq 0 ]; then
                    echo "✅ 数据库迁移完成"
                else
                    echo "❌ 数据库迁移失败，请检查数据库配置"
                fi
            else
                echo "❌ 无法连接到数据库，请检查 DATABASE_URL 配置"
            fi
        fi
    fi
else
    echo "⚠️  PostgreSQL客户端未安装，跳过数据库检查"
fi

echo ""
echo "🎉 开发环境设置完成！"
echo ""
echo "📝 下一步操作："
echo "1. 编辑 .env 文件，配置数据库连接和OpenAI API密钥"
echo "2. 如果使用PostgreSQL，确保数据库服务器正在运行"
echo "3. 运行开发服务器："
echo "   npm run dev"
echo ""
echo "🌐 服务将启动在："
echo "   前端: http://localhost:3000"
echo "   后端: http://localhost:8000"
echo ""
echo "📚 更多信息请查看 README.md"