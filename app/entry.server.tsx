import type { AppLoadContext, EntryContext } from '@remix-run/cloudflare';
import { RemixServer } from '@remix-run/react';
import { isbot } from 'isbot';
import { renderToString } from 'react-dom/server';
import { renderHeadToString } from 'remix-island';
import { Head } from './root';
import { themeStore } from '~/lib/stores/theme';
import { initializeModelList } from '~/utils/constants';

export default async function handleRequest(
  request: Request,
  responseStatusCode: number,
  responseHeaders: Headers,
  remixContext: EntryContext,
  _loadContext: AppLoadContext,
) {
  await initializeModelList();

  const html = renderToString(<RemixServer context={remixContext} url={request.url} />);
  const head = renderHeadToString({ request, remixContext, Head });

  const markup = `<!DOCTYPE html>
    <html lang="en" data-theme="${themeStore.value}">
      <head>${head}</head>
      <body>
        <div id="root" class="w-full h-full">${html}</div>
      </body>
    </html>`;

  responseHeaders.set('Content-Type', 'text/html');
  responseHeaders.set('Cross-Origin-Embedder-Policy', 'require-corp');
  responseHeaders.set('Cross-Origin-Opener-Policy', 'same-origin');

  return new Response(markup, {
    headers: responseHeaders,
    status: responseStatusCode,
  });
}
