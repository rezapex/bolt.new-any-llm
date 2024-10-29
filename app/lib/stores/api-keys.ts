import { map } from 'nanostores';

export interface ApiKeys {
  anthropicApiKey?: string;
  openaiApiKey?: string;
  groqApiKey?: string;
  openRouterApiKey?: string;
  ollamaApiBaseUrl?: string;
}

export const apiKeysStore = map<ApiKeys>({});

// persist api keys in localStorage
if (typeof window !== 'undefined') {
  const savedKeys = localStorage.getItem('api-keys');

  if (savedKeys) {
    try {
      const parsed = JSON.parse(savedKeys);
      apiKeysStore.set(parsed);
    } catch (e) {
      console.error('Failed to parse saved API keys:', e);
    }
  }

  apiKeysStore.subscribe((keys) => {
    localStorage.setItem('api-keys', JSON.stringify(keys));
  });
}
