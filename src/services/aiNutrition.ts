import type { FoodItem } from '../types';

const PROXY_URL =
  process.env.EXPO_PUBLIC_AI_PROXY_URL ||
  'https://calora-ai-six.vercel.app/api/ai-nutrition';
const APP_SECRET = process.env.EXPO_PUBLIC_APP_SECRET || '';

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

export async function analyzeFoodText(
  text: string,
  lang: string = 'ru'
): Promise<AIFoodAnalysis> {
  if (!PROXY_URL) {
    throw new Error('AI proxy URL is not configured');
  }

  const headers: Record<string, string> = {
    'content-type': 'application/json',
  };
  if (APP_SECRET) headers['x-app-secret'] = APP_SECRET;

  const response = await fetch(PROXY_URL, {
    method: 'POST',
    headers,
    body: JSON.stringify({ text, lang }),
  });

  if (!response.ok) {
    const errText = await response.text().catch(() => '');
    throw new Error(`AI request failed (${response.status}): ${errText.slice(0, 200)}`);
  }

  const data = await response.json();
  if (!data?.analysis) {
    throw new Error('AI did not return structured data');
  }

  return data.analysis as AIFoodAnalysis;
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
