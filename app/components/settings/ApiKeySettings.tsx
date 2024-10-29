import { useStore } from '@nanostores/react';
import { useCallback } from 'react';
import { toast } from 'react-toastify';
import { apiKeysStore } from '~/lib/stores/api-keys';
import styles from './ApiKeySettings.module.scss';

export function ApiKeySettings() {
  const apiKeys = useStore(apiKeysStore);

  const updateApiKey = useCallback((key: keyof typeof apiKeys, value: string) => {
    try {
      apiKeysStore.setKey(key, value.trim());

      if (value.trim()) {
        toast.success(`${key} updated successfully`);
      }
    } catch (error) {
      toast.error(`Failed to update ${key}`);
      console.error('Error updating API key:', error);
    }
  }, []);

  return (
    <div className={styles.container}>
      <h3>API Keys</h3>
      <div className={styles.fields}>
        <div className={styles.field}>
          <label htmlFor="anthropic-key">Anthropic API Key</label>
          <input
            id="anthropic-key"
            type="password"
            value={apiKeys.anthropicApiKey || ''}
            onChange={(e) => updateApiKey('anthropicApiKey', e.target.value)}
            placeholder="Enter Anthropic API key"
            spellCheck={false}
            autoComplete="off"
          />
        </div>
        <div className={styles.field}>
          <label htmlFor="openai-key">OpenAI API Key</label>
          <input
            id="openai-key"
            type="password"
            value={apiKeys.openaiApiKey || ''}
            onChange={(e) => updateApiKey('openaiApiKey', e.target.value)}
            placeholder="Enter OpenAI API key"
            spellCheck={false}
            autoComplete="off"
          />
        </div>
        <div className={styles.field}>
          <label htmlFor="groq-key">Groq API Key</label>
          <input
            id="groq-key"
            type="password"
            value={apiKeys.groqApiKey || ''}
            onChange={(e) => updateApiKey('groqApiKey', e.target.value)}
            placeholder="Enter Groq API key"
            spellCheck={false}
            autoComplete="off"
          />
        </div>
        <div className={styles.field}>
          <label htmlFor="openrouter-key">OpenRouter API Key</label>
          <input
            id="openrouter-key"
            type="password"
            value={apiKeys.openRouterApiKey || ''}
            onChange={(e) => updateApiKey('openRouterApiKey', e.target.value)}
            placeholder="Enter OpenRouter API key"
            spellCheck={false}
            autoComplete="off"
          />
        </div>
        <div className={styles.field}>
          <label htmlFor="ollama-url">Ollama API Base URL</label>
          <input
            id="ollama-url"
            type="text"
            value={apiKeys.ollamaApiBaseUrl || ''}
            onChange={(e) => updateApiKey('ollamaApiBaseUrl', e.target.value)}
            placeholder="Enter Ollama API base URL"
            spellCheck={false}
            autoComplete="off"
          />
        </div>
      </div>
    </div>
  );
}
