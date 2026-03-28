import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { OpenAI } from 'openai';

const prisma = new PrismaClient();
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export const createAnalysis = async (req: Request, res: Response) => {
  try {
    const { contractId, analysisType = 'comprehensive' } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: '用户未认证' });
    }

    // 获取合同信息
    const contract = await prisma.contract.findFirst({
      where: {
        id: contractId,
        userId
      }
    });

    if (!contract) {
      return res.status(404).json({ error: '合同未找到' });
    }

    if (!contract.fileContent) {
      return res.status(400).json({ error: '合同文本内容不可用' });
    }

    // 根据分析类型进行AI分析
    let analysis;
    switch (analysisType) {
      case 'key_terms':
        analysis = await analyzeKeyTerms(contract.fileContent);
        break;
      case 'risk_assessment':
        analysis = await assessRisks(contract.fileContent);
        break;
      case 'obligation_review':
        analysis = await reviewObligations(contract.fileContent);
        break;
      default:
        analysis = await comprehensiveAnalysis(contract.fileContent);
    }

    // 保存分析结果
    const savedAnalysis = await prisma.analysis.create({
      data: {
        contractId,
        userId,
        analysisType,
        summary: analysis.summary,
        keyTerms: analysis.keyTerms,
        risks: analysis.risks,
        obligations: analysis.obligations,
        recommendations: analysis.recommendations,
        confidence: analysis.confidence || 0.9
      },
      include: {
        contract: {
          select: {
            id: true,
            title: true,
            type: true
          }
        }
      }
    });

    res.json({
      success: true,
      analysis: savedAnalysis
    });
  } catch (error) {
    console.error('创建分析失败:', error);
    res.status(500).json({ 
      error: '创建分析失败',
      details: error instanceof Error ? error.message : '未知错误'
    });
  }
};

export const getAnalysis = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: '用户未认证' });
    }

    const analysis = await prisma.analysis.findFirst({
      where: {
        id,
        userId
      },
      include: {
        contract: {
          select: {
            id: true,
            title: true,
            type: true
          }
        }
      }
    });

    if (!analysis) {
      return res.status(404).json({ error: '分析未找到' });
    }

    res.json({
      success: true,
      analysis
    });
  } catch (error) {
    console.error('获取分析失败:', error);
    res.status(500).json({ error: '获取分析失败' });
  }
};

export const getContractAnalyses = async (req: Request, res: Response) => {
  try {
    const { contractId } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: '用户未认证' });
    }

    const analyses = await prisma.analysis.findMany({
      where: {
        contractId,
        userId
      },
      orderBy: {
        createdAt: 'desc'
      },
      include: {
        contract: {
          select: {
            id: true,
            title: true,
            type: true
          }
        }
      }
    });

    res.json({
      success: true,
      analyses
    });
  } catch (error) {
    console.error('获取合同分析列表失败:', error);
    res.status(500).json({ error: '获取合同分析列表失败' });
  }
};

// AI分析函数
const comprehensiveAnalysis = async (contractText: string) => {
  const prompt = `
你是一位专业的法律合同分析师。请详细分析以下合同内容，为普通用户提供易懂的解释和关键信息。

合同文本：
${contractText}

请提供以下分析：
1. 合同摘要（200字以内）：用通俗易懂的语言说明这个合同的主要内容和目的
2. 关键条款（数组形式）：列出5-8个对用户最重要的条款，每条用简短的语言说明
3. 主要风险（数组形式）：识别3-5个可能对用户产生负面影响的关键风险
4. 主要义务（数组形式）：列出3-5个用户需要履行的核心义务
5. 建议（数组形式）：给用户3-5条实用的行动建议
6. 置信度评分（0-1）：你对分析结果的可信度评估

请以JSON格式返回，包含字段：summary, keyTerms, risks, obligations, recommendations, confidence
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
      max_tokens: 2000
    });

    const aiResponse = response.choices[0].message.content;
    
    try {
      return JSON.parse(aiResponse);
    } catch {
      // 如果不是JSON格式，进行解析
      return parseAIResponse(aiResponse);
    }
  } catch (error) {
    console.error('AI分析失败:', error);
    throw new Error('AI分析服务暂时不可用');
  }
};

const analyzeKeyTerms = async (contractText: string) => {
  const prompt = `
请分析以下合同，提取最重要的关键词和条款：

合同文本：
${contractText}

请重点关注：
1. 关键数字（金额、期限、数量等）
2. 限制性条款
3. 违约责任
4. 解除条款
5. 争议解决方式
6. 保密条款

请以JSON格式返回，包含字段：summary, keyTerms, recommendations, confidence
`;

  const response = await openai.chat.completions.create({
    model: "gpt-4",
    messages: [
      {
        role: "system",
        content: "你是一位专业的法律合同分析师，擅长识别关键条款。"
      },
      {
        role: "user",
        content: prompt
      }
    ],
    temperature: 0.5,
    max_tokens: 1500
  });

  const aiResponse = response.choices[0].message.content;
  
  try {
    return JSON.parse(aiResponse);
  } catch {
    return parseAIResponse(aiResponse);
  }
};

const assessRisks = async (contractText: string) => {
  const prompt = `
请分析以下合同，识别潜在风险：

合同文本：
${contractText}

请重点关注以下风险类型：
1. 财务风险（费用、违约金、赔偿等）
2. 法律风险（责任承担、争议解决等）
3. 履约风险（无法按时完成的风险）
4. 权利风险（权利受限、撤销权等）
5. 其他重要风险

请以JSON格式返回，包含字段：summary, risks, recommendations, confidence
`;

  const response = await openai.chat.completions.create({
    model: "gpt-4",
    messages: [
      {
        role: "system",
        content: "你是一位专业的风险分析专家。"
      },
      {
        role: "user",
        content: prompt
      }
    ],
    temperature: 0.6,
    max_tokens: 1500
  });

  const aiResponse = response.choices[0].message.content;
  
  try {
    return JSON.parse(aiResponse);
  } catch {
    return parseAIResponse(aiResponse);
  }
};

const reviewObligations = async (contractText: string) => {
  const prompt = `
请分析以下合同，明确用户的义务：

合同文本：
${contractText}

请明确列出用户需要履行的所有主要义务，包括：
1. 支付义务
2. 提供信息义务
3. 履行合同义务
4. 保密义务
5. 通知义务
6. 配合义务

请以JSON格式返回，包含字段：summary, obligations, recommendations, confidence
`;

  const response = await openai.chat.completions.create({
    model: "gpt-4",
    messages: [
      {
        role: "system",
        content: "你是一位专业的法律义务分析专家。"
      },
      {
        role: "user",
        content: prompt
      }
    ],
    temperature: 0.5,
    max_tokens: 1500
  });

  const aiResponse = response.choices[0].message.content;
  
  try {
    return JSON.parse(aiResponse);
  } catch {
    return parseAIResponse(aiResponse);
  }
};

const parseAIResponse = (response: string) => {
  const summaryMatch = response.match(/summary[：:]\s*"([^"]+)"/) || 
                       response.match(/摘要[：:]\s*"([^"]+)"/);
  const keyTermsMatch = response.match(/keyTerms[：:]\s*\[([\s\S]*?)\]/) || 
                        response.match(/关键条款[：:]\s*\[([\s\S]*?)\]/);
  const risksMatch = response.match(/risks[：:]\s*\[([\s\S]*?)\]/) || 
                    response.match(/风险[：:]\s*\[([\s\S]*?)\]/);
  const obligationsMatch = response.match(/obligations[：:]\s*\[([\s\S]*?)\]/) || 
                          response.match(/义务[：:]\s*\[([\s\S]*?)\]/);
  const recommendationsMatch = response.match(/recommendations[：:]\s*\[([\s\S]*?)\]/) || 
                              response.match(/建议[：:]\s*\[([\s\S]*?)\]/);
  const confidenceMatch = response.match(/confidence[：:]\s*(\d+\.?\d*)/);

  return {
    summary: summaryMatch?.[1]?.replace(/["']/g, '') || '',
    keyTerms: keyTermsMatch?.[1]?.replace(/["']/g, '').split(',').map((s: string) => s.trim()).filter(Boolean) || [],
    risks: risksMatch?.[1]?.replace(/["']/g, '').split(',').map((s: string) => s.trim()).filter(Boolean) || [],
    obligations: obligationsMatch?.[1]?.replace(/["']/g, '').split(',').map((s: string) => s.trim()).filter(Boolean) || [],
    recommendations: recommendationsMatch?.[1]?.replace(/["']/g, '').split(',').map((s: string) => s.trim()).filter(Boolean) || [],
    confidence: confidenceMatch ? parseFloat(confidenceMatch[1]) : 0.9
  };
};