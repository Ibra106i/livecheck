import type { AuditReport } from '../core/types';
import { buildPrompt } from './prompt';

interface AiConfig {
  apiKey: string;
  baseUrl: string;
  model: string;
}

interface ChatResponse {
  choices?: Array<{ message?: { content?: string } }>;
}

export function resolveAiConfig(): AiConfig {
  const apiKey = process.env.LIVECHECK_AI_KEY ?? process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error(
      'no API key found. Set LIVECHECK_AI_KEY (or OPENAI_API_KEY). Optional: LIVECHECK_AI_BASE_URL, LIVECHECK_AI_MODEL'
    );
  }
  return {
    apiKey,
    baseUrl: (process.env.LIVECHECK_AI_BASE_URL ?? 'https://api.openai.com/v1').replace(/\/$/, ''),
    model: process.env.LIVECHECK_AI_MODEL ?? 'gpt-4o-mini',
  };
}

export async function enhanceReport(report: AuditReport): Promise<string> {
  const config = resolveAiConfig();
  const prompt = buildPrompt(report);

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 60000);
  try {
    const res = await fetch(`${config.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify({
        model: config.model,
        temperature: 0.3,
        messages: [
          { role: 'system', content: prompt.system },
          { role: 'user', content: prompt.user },
        ],
      }),
      signal: controller.signal,
    });

    if (!res.ok) {
      const body = await res.text().catch(() => '');
      throw new Error(`provider returned ${res.status}${body ? `: ${body.slice(0, 200)}` : ''}`);
    }

    const data = (await res.json()) as ChatResponse;
    const content = data.choices?.[0]?.message?.content?.trim();
    if (!content) {
      throw new Error('provider returned an empty completion');
    }
    return content;
  } finally {
    clearTimeout(timer);
  }
}
