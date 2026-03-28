import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { OpenAI } from 'openai';

const prisma = new PrismaClient();
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

const upload = multer({
  dest: 'uploads/',
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE || '10485760') // 10MB
  }
});

const extractTextFromFile = async (filePath: string, fileName: string): Promise<string> => {
  const fileExtension = path.extname(fileName).toLowerCase();
  
  if (fileExtension === '.pdf') {
    const pdfParse = require('pdf-parse');
    const pdfBuffer = fs.readFileSync(filePath);
    const data = await pdfParse(pdfBuffer);
    return data.text;
  } else if (fileExtension === '.docx') {
    const mammoth = require('mammoth');
    const result = await mammoth.extractRawText({ path: filePath });
    return result.value;
  } else {
    throw new Error(`Unsupported file type: ${fileExtension}`);
  }
};

const analyzeContractWithAI = async (contractText: string, analysisType: string = 'comprehensive') => {
  const prompt = `
你是一位专业的法律合同分析师。请分析以下合同内容，重点关注普通用户需要了解的重要条款和潜在风险。

合同文本：
${contractText}

分析类型：${analysisType}

请提供以下分析：
1. 合同摘要（200字以内）
2. 关键条款（列出最重要的5-8条条款）
3. 主要风险（针对普通用户识别3-5个关键风险）
4. 主要义务（用户需要履行的3-5个主要义务）
5. 建议（给用户的3-5条实用建议）

请用JSON格式返回，包含字段：summary, keyTerms, risks, obligations, recommendations
`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "你是一位专业的法律合同分析师，擅长用通俗易懂的语言解释复杂的法律条款。"
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 1500
    });

    const aiResponse = response.choices[0].message.content;
    
    // 尝试解析AI返回的JSON
    try {
      return JSON.parse(aiResponse);
    } catch {
      // 如果不是JSON格式，进行解析
      const summaryMatch = aiResponse.match(/合同摘要[：:]\s*([\s\S]*?)(?=关键条款|2\.|$)/);
      const keyTermsMatch = aiResponse.match(/关键条款[：:]\s*([\s\S]*?)(?=主要风险|3\.|$)/);
      const risksMatch = aiResponse.match(/主要风险[：:]\s*([\s\S]*?)(?=主要义务|4\.|$)/);
      const obligationsMatch = aiResponse.match(/主要义务[：:]\s*([\s\S]*?)(?=建议|5\.|$)/);
      const recommendationsMatch = aiResponse.match(/建议[：:]\s*([\s\S]*?)(?=$)/);

      return {
        summary: summaryMatch?.[1]?.trim() || '',
        keyTerms: keyTermsMatch?.[1]?.trim().split('\n').filter(Boolean) || [],
        risks: risksMatch?.[1]?.trim().split('\n').filter(Boolean) || [],
        obligations: obligationsMatch?.[1]?.trim().split('\n').filter(Boolean) || [],
        recommendations: recommendationsMatch?.[1]?.trim().split('\n').filter(Boolean) || []
      };
    }
  } catch (error) {
    console.error('AI分析失败:', error);
    throw new Error('AI分析服务暂时不可用');
  }
};

export const uploadContract = async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: '未上传文件' });
    }

    const { type = 'RENTAL_AGREEMENT', title } = req.body;
    const userId = req.user?.id; // 假设有用户认证中间件

    if (!userId) {
      return res.status(401).json({ error: '用户未认证' });
    }

    // 提取文本内容
    const contractText = await extractTextFromFile(req.file.path, req.file.originalname);
    
    // 分析合同
    const analysis = await analyzeContractWithAI(contractText);

    // 保存合同信息
    const contract = await prisma.contract.create({
      data: {
        title: title || req.file.originalname,
        type,
        fileName: req.file.originalname,
        filePath: req.file.path,
        fileContent: contractText,
        fileSize: req.file.size,
        extractedData: analysis,
        userId
      },
      include: {
        analyses: true
      }
    });

    res.json({
      success: true,
      contract: {
        id: contract.id,
        title: contract.title,
        type: contract.type,
        createdAt: contract.createdAt,
        analysis: analysis
      }
    });

  } catch (error) {
    console.error('合同上传失败:', error);
    res.status(500).json({ 
      error: '合同处理失败',
      details: error instanceof Error ? error.message : '未知错误'
    });
  }
};

export const getContract = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: '用户未认证' });
    }

    const contract = await prisma.contract.findFirst({
      where: {
        id,
        userId
      },
      include: {
        analyses: {
          orderBy: {
            createdAt: 'desc'
          }
        }
      }
    });

    if (!contract) {
      return res.status(404).json({ error: '合同未找到' });
    }

    res.json({
      success: true,
      contract
    });
  } catch (error) {
    console.error('获取合同失败:', error);
    res.status(500).json({ error: '获取合同失败' });
  }
};

export const getUserContracts = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const { page = 1, limit = 10 } = req.query;

    if (!userId) {
      return res.status(401).json({ error: '用户未认证' });
    }

    const contracts = await prisma.contract.findMany({
      where: {
        userId
      },
      include: {
        analyses: {
          take: 1,
          orderBy: {
            createdAt: 'desc'
          }
        }
      },
      skip: (Number(page) - 1) * Number(limit),
      take: Number(limit),
      orderBy: {
        createdAt: 'desc'
      }
    });

    const total = await prisma.contract.count({
      where: {
        userId
      }
    });

    res.json({
      success: true,
      contracts,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    console.error('获取用户合同列表失败:', error);
    res.status(500).json({ error: '获取用户合同列表失败' });
  }
};

export const deleteContract = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: '用户未认证' });
    }

    const contract = await prisma.contract.findFirst({
      where: {
        id,
        userId
      }
    });

    if (!contract) {
      return res.status(404).json({ error: '合同未找到' });
    }

    // 删除文件
    if (contract.filePath) {
      fs.unlink(contract.filePath, (err) => {
        if (err) console.error('删除文件失败:', err);
      });
    }

    await prisma.contract.delete({
      where: {
        id
      }
    });

    res.json({
      success: true,
      message: '合同删除成功'
    });
  } catch (error) {
    console.error('删除合同失败:', error);
    res.status(500).json({ error: '删除合同失败' });
  }
};