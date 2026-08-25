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

const GROQ_BASE_URL = 'https://api.groq.com/openai/v1';
const GROQ_DEFAULT_MODEL = 'llama-3.3-70b-versatile';
const OPENAI_BASE_URL = 'https://api.openai.com/v1';

export function resolveAiConfig(): AiConfig {
  const apiKey =
    process.env.LIVECHECK_AI_KEY ?? process.env.GROQ_API_KEY ?? process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error(
      'no API key found. Put GROQ_API_KEY=... in a .env file next to where you run the command (or set LIVECHECK_AI_KEY / OPENAI_API_KEY)'
    );
  }

  const isGroq = apiKey === process.env.GROQ_API_KEY && !process.env.LIVECHECK_AI_KEY;
  const defaultBaseUrl = process.env.LIVECHECK_AI_BASE_URL ?? (isGroq ? GROQ_BASE_URL : OPENAI_BASE_URL);
  const defaultModel =
    process.env.LIVECHECK_AI_MODEL ?? (isGroq ? GROQ_DEFAULT_MODEL : 'gpt-4o-mini');

  return {
    apiKey,
    baseUrl: defaultBaseUrl.replace(/\/$/, ''),
    model: defaultModel,
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
