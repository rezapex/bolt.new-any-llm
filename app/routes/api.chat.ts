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
  if (args.request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
  }

  return chatAction(args);
}

async function chatAction({ request }: ActionFunctionArgs) {
  try {
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

        try {
          const result = await streamText(messages, env, options);
          return stream.switchSource(result.toAIStream());
        } catch (error) {
          console.error('Error in stream continuation:', error);
          throw error;
        }
      },
    };

    try {
      const result = await streamText(messages, env, options);
      stream.switchSource(result.toAIStream());

      return new Response(stream.readable, {
        status: 200,
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache, no-transform',
          'Connection': 'keep-alive',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        },
      });
    } catch (error) {
      console.error('Error in initial stream:', error);
      throw error;
    }
  } catch (error) {
    console.error('Chat error:', error);

    let errorMessage = 'An error occurred while processing your request.';
    let errorDetails = 'Unknown error occurred';

    if (error instanceof Error) {
      errorMessage = error.message;
      errorDetails = error.stack || 'No stack trace available';
    }

    return new Response(
      JSON.stringify({
        error: errorMessage,
        details: errorDetails,
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
