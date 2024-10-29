import { type ActionFunctionArgs } from '@remix-run/cloudflare';
import { MAX_RESPONSE_SEGMENTS, MAX_TOKENS } from '~/lib/.server/llm/constants';
import { CONTINUE_PROMPT } from '~/lib/.server/llm/prompts';
import { streamText, type Messages, type StreamingOptions } from '~/lib/.server/llm/stream-text';
import SwitchableStream from '~/lib/.server/llm/switchable-stream';

export const config = {
  runtime: 'edge',
  regions: ['iad1'],
};

export async function action(args: ActionFunctionArgs) {
  return chatAction(args);
}

async function chatAction({ request }: ActionFunctionArgs) {
  const { messages, apiKeys = {} } = await request.json<{
    messages: Messages;
    apiKeys?: {
      anthropicApiKey?: string;
      openaiApiKey?: string;
      groqApiKey?: string;
      openRouterApiKey?: string;
      ollamaApiBaseUrl?: string;
    };
  }>();
  const stream = new SwitchableStream();

  try {
    const env: Env = {
      ANTHROPIC_API_KEY: apiKeys.anthropicApiKey || process.env.ANTHROPIC_API_KEY || '',
      OPENAI_API_KEY: apiKeys.openaiApiKey || process.env.OPENAI_API_KEY || '',
      GROQ_API_KEY: apiKeys.groqApiKey || process.env.GROQ_API_KEY || '',
      OPEN_ROUTER_API_KEY: apiKeys.openRouterApiKey || process.env.OPEN_ROUTER_API_KEY || '',
      OLLAMA_API_BASE_URL: apiKeys.ollamaApiBaseUrl || process.env.OLLAMA_API_BASE_URL || 'http://localhost:11434',
    };

    const hasValidKey = Object.entries(env).some(([key, value]) => {
      if (key === 'OLLAMA_API_BASE_URL') {
        return false;
      }
      return value && value.trim() !== '';
    });

    if (!hasValidKey) {
      return new Response(
        JSON.stringify({
          error: 'No valid API key provided. Please provide at least one API key in the settings.',
          details: 'At least one API key (Anthropic, OpenAI, Groq, or OpenRouter) is required to use the chat.',
        }),
        {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
          },
        },
      );
    }

    const options: StreamingOptions = {
      toolChoice: 'none',
      onFinish: async ({ text: content, finishReason }) => {
        if (finishReason !== 'length') {
          return stream.close();
        }

        if (stream.switches >= MAX_RESPONSE_SEGMENTS) {
          throw Error('Cannot continue message: Maximum segments reached');
        }

        const switchesLeft = MAX_RESPONSE_SEGMENTS - stream.switches;
        console.log(`Reached max token limit (${MAX_TOKENS}): Continuing message (${switchesLeft} switches left)`);

        messages.push({ role: 'assistant', content });
        messages.push({ role: 'user', content: CONTINUE_PROMPT });

        const result = await streamText(messages, env, options);

        return stream.switchSource(result.toAIStream());
      },
    };

    const result = await streamText(messages, env, options);
    stream.switchSource(result.toAIStream());

    return new Response(stream.readable, {
      status: 200,
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache, no-transform',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
  } catch (error) {
    console.error('Chat error:', error);
    
    return new Response(
      JSON.stringify({
        error: 'An error occurred while processing your request. Please check your API keys and try again.',
        details: error instanceof Error ? error.message : 'Unknown error occurred',
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        },
      },
    );
  }
}
