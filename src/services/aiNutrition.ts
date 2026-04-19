import type { FoodItem } from '../types';

const PROXY_URL =
  process.env.EXPO_PUBLIC_AI_PROXY_URL ||
  'https://calora-ai-six.vercel.app/api/ai-nutrition';
const APP_SECRET = process.env.EXPO_PUBLIC_APP_SECRET || '';

const REQUEST_TIMEOUT_MS = 20_000; // 20 seconds
const MAX_RETRIES = 2; // up to 2 retries (3 total attempts)
const RETRY_DELAY_MS = 1500;

export function hasAIKey(): boolean {
  return PROXY_URL.length > 0;
}

export interface AIFoodAnalysis {
  name: string;
  totalGrams: number;
  caloriesPer100g: number;
  proteinPer100g: number;
  fatPer100g: number;
  carbsPer100g: number;
  fiberPer100g: number;
  sugarsPer100g: number;
  saturatedFatPer100g: number;
  saltPer100g: number;
  benefits: string;
  confidence: 'high' | 'medium' | 'low';
}

/** Fetch with timeout via AbortController */
async function fetchWithTimeout(
  url: string,
  options: RequestInit,
  timeoutMs: number = REQUEST_TIMEOUT_MS,
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

/** Determine if an error is worth retrying */
function isRetryable(status: number): boolean {
  // Retry on server errors and rate limits, not on client errors
  return status >= 500 || status === 429 || status === 408;
}

/** Sleep helper */
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Core request with timeout + retry */
async function aiRequest(body: Record<string, string>): Promise<AIFoodAnalysis> {
  if (!PROXY_URL) {
    throw new Error('AI proxy URL is not configured');
  }

  const headers: Record<string, string> = {
    'content-type': 'application/json',
  };
  if (APP_SECRET) headers['x-app-secret'] = APP_SECRET;

  const jsonBody = JSON.stringify(body);
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const response = await fetchWithTimeout(PROXY_URL, {
        method: 'POST',
        headers,
        body: jsonBody,
      });

      if (!response.ok) {
        const errText = await response.text().catch(() => '');
        if (attempt < MAX_RETRIES && isRetryable(response.status)) {
          lastError = new Error(`AI request failed (${response.status})`);
          await sleep(RETRY_DELAY_MS * (attempt + 1)); // exponential-ish backoff
          continue;
        }
        throw new Error(`AI request failed (${response.status}): ${errText.slice(0, 200)}`);
      }

      const data = await response.json();
      if (!data?.analysis) {
        throw new Error('AI did not return structured data');
      }

      if (__DEV__) {
        console.log('[AI] request:', body);
        console.log('[AI] response:', JSON.stringify(data.analysis, null, 2));
      }

      return data.analysis as AIFoodAnalysis;
    } catch (e: any) {
      // AbortError = timeout
      if (e.name === 'AbortError') {
        lastError = new Error('Request timed out');
        if (attempt < MAX_RETRIES) {
          await sleep(RETRY_DELAY_MS * (attempt + 1));
          continue;
        }
      }
      // Network errors (no internet, DNS failure)
      if (e.message?.includes('Network request failed') || e.message?.includes('fetch')) {
        lastError = e;
        if (attempt < MAX_RETRIES) {
          await sleep(RETRY_DELAY_MS * (attempt + 1));
          continue;
        }
      }
      throw e;
    }
  }

  throw lastError ?? new Error('AI request failed after retries');
}

export async function analyzeFoodImage(
  imageBase64: string,
  lang: string = 'ru',
  text?: string,
): Promise<AIFoodAnalysis> {
  const payload: Record<string, string> = { image: imageBase64, lang };
  if (text?.trim()) payload.text = text.trim();
  return aiRequest(payload);
}

export async function analyzeFoodText(
  text: string,
  lang: string = 'ru'
): Promise<AIFoodAnalysis> {
  return aiRequest({ text, lang });
}

export function aiAnalysisToFoodItem(analysis: AIFoodAnalysis): FoodItem {
  return {
    id: `ai_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    name: analysis.name,
    caloriesPer100g: Math.round(analysis.caloriesPer100g),
    proteinPer100g: Math.round(analysis.proteinPer100g * 10) / 10,
    fatPer100g: Math.round(analysis.fatPer100g * 10) / 10,
    carbsPer100g: Math.round(analysis.carbsPer100g * 10) / 10,
    fiberPer100g: Math.round(analysis.fiberPer100g * 10) / 10,
    sugarsPer100g: Math.round(analysis.sugarsPer100g * 10) / 10,
    saturatedFatPer100g: Math.round(analysis.saturatedFatPer100g * 10) / 10,
    saltPer100g: Math.round(analysis.saltPer100g * 100) / 100,
    source: 'custom',
  };
}
