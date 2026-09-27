import { GoogleGenAI } from '@google/genai';

let aiInstance: GoogleGenAI | null = null;

export const PRIMARY_MODEL = 'gemini-3.8-flash';
export const FALLBACK_MODELS = ['gemini-3.1-flash-lite', 'gemini-flash-latest'];

export function getGeminiClient(): GoogleGenAI {
  if (!aiInstance) {
    const apiKey = process.env.GEMINI_API_KEY || '';
    aiInstance = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiInstance;
}

// Simple in-memory LRU/TTL cache for repeated prompts (5-minute TTL)
interface CacheEntry {
  response: any;
  expiresAt: number;
}
const aiResponseCache = new Map<string, CacheEntry>();

function getCacheKey(request: any): string {
  try {
    const contentsStr = JSON.stringify(request.contents || '');
    const configStr = JSON.stringify(request.config || '');
    return `${contentsStr}::${configStr}`;
  } catch {
    return '';
  }
}

/**
 * Generate content with automatic resilience against 503/429/high-demand errors,
 * dynamically failing over across healthy Gemini models.
 */
export async function generateContentWithRetry(
  request: Parameters<GoogleGenAI['models']['generateContent']>[0]
): Promise<ReturnType<GoogleGenAI['models']['generateContent']>> {
  const apiKey = process.env.GEMINI_API_KEY || '';
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured or available.');
  }

  // Check cache first for rapid response and quota conservation
  const cacheKey = getCacheKey(request);
  if (cacheKey) {
    const cached = aiResponseCache.get(cacheKey);
    if (cached && Date.now() < cached.expiresAt) {
      return cached.response;
    }
  }

  const ai = getGeminiClient();
  const requestedModel = request.model || PRIMARY_MODEL;

  // Build ordered list of unique models to try
  const modelsToTry = Array.from(
    new Set([requestedModel, PRIMARY_MODEL, ...FALLBACK_MODELS])
  );

  let lastError: any = null;
  const exhaustedModels = new Set<string>();

  for (const modelName of modelsToTry) {
    try {
      const timeoutMs = modelName === PRIMARY_MODEL ? 25000 : 20000;
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(
          () => reject(new Error(`Model ${modelName} request timed out (${timeoutMs / 1000}s).`)),
          timeoutMs
        )
      );
      const response = (await Promise.race([
        ai.models.generateContent({
          ...request,
          model: modelName,
        }),
        timeoutPromise,
      ])) as any;

      // Cache successful response (5 minutes)
      if (cacheKey && response?.text) {
        aiResponseCache.set(cacheKey, {
          response,
          expiresAt: Date.now() + 5 * 60 * 1000,
        });
        // Limit cache size to 100 entries
        if (aiResponseCache.size > 100) {
          const oldestKey = aiResponseCache.keys().next().value;
          if (oldestKey) aiResponseCache.delete(oldestKey);
        }
      }

      return response;
    } catch (err: any) {
      lastError = err;
      const errMsg = String(err?.message || '');
      const errStatus = err?.status || err?.code || '';
      const isQuota =
        errMsg.includes('429') ||
        errMsg.includes('Quota exceeded') ||
        errMsg.includes('RESOURCE_EXHAUSTED') ||
        errStatus === 429 ||
        errStatus === 'RESOURCE_EXHAUSTED';

      if (isQuota) {
        exhaustedModels.add(modelName);
        console.warn(`Model ${modelName} quota reached. Trying next fallback model...`);
        continue;
      }

      const isTemporary =
        errMsg.includes('503') ||
        errMsg.includes('UNAVAILABLE') ||
        errMsg.includes('high demand') ||
        errMsg.includes('Resource has been exhausted') ||
        errMsg.toLowerCase().includes('timed out') ||
        errMsg.toLowerCase().includes('timeout') ||
        errStatus === 503 ||
        errStatus === 'UNAVAILABLE';

      if (isTemporary) {
        console.warn(`Model ${modelName} temporary issue (${errStatus || 'timeout'}): trying next model...`);
        // Short pause to allow socket cleanup
        await new Promise((resolve) => setTimeout(resolve, 150));
        continue;
      }

      // If it's a non-temporary validation error, break
      console.warn(`Model ${modelName} non-recoverable status:`, errMsg);
      break;
    }
  }

  // If ALL attempted models were exhausted due to daily per-model limits
  if (exhaustedModels.size >= modelsToTry.length) {
    throw new Error('Hệ thống AI hiện đang đạt giới hạn yêu cầu (Quota). Vui lòng thử lại sau giây lát hoặc sử dụng chế độ dự phòng.');
  }

  // If initial failover pass was exhausted due to temporary spikes across all models, do 1 retry with backoff on primary
  try {
    console.warn(`All models experienced spikes, attempting final backoff retry with ${PRIMARY_MODEL}...`);
    await new Promise((resolve) => setTimeout(resolve, 500));
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error(`Final retry timed out (25s).`)), 25000)
    );
    return (await Promise.race([
      ai.models.generateContent({
        ...request,
        model: PRIMARY_MODEL,
      }),
      timeoutPromise,
    ])) as any;
  } catch (finalErr: any) {
    throw lastError || finalErr || new Error('Hệ thống AI hiện đang có lượng truy cập cao. Xin vui lòng thử lại sau giây lát.');
  }
}
