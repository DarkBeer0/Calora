const PROXY_BASE =
  process.env.EXPO_PUBLIC_AI_PROXY_URL?.replace('/api/ai-nutrition', '') ||
  'https://calora-ai-six.vercel.app';
const APP_SECRET = process.env.EXPO_PUBLIC_APP_SECRET || '';

export interface FeedbackData {
  message: string;
  name?: string;
  email?: string;
}

export async function sendFeedback(data: FeedbackData): Promise<void> {
  const url = `${PROXY_BASE}/api/feedback`;

  const headers: Record<string, string> = {
    'content-type': 'application/json',
  };
  if (APP_SECRET) headers['x-app-secret'] = APP_SECRET;

  const response = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errText = await response.text().catch(() => '');
    throw new Error(`Feedback failed (${response.status}): ${errText.slice(0, 200)}`);
  }
}
