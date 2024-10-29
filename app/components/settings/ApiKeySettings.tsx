import { useStore } from '@nanostores/react';
import { useCallback, useState } from 'react';
import { toast } from 'react-toastify';
import { apiKeysStore } from '~/lib/stores/api-keys';
import styles from './ApiKeySettings.module.scss';

export function ApiKeySettings() {
  const apiKeys = useStore(apiKeysStore);
  const [localKeys, setLocalKeys] = useState(apiKeys);

  const handleInputChange = (key: keyof typeof apiKeys, value: string) => {
    setLocalKeys((prev) => ({ ...prev, [key]: value }));
  };

  const saveChanges = useCallback(() => {
    try {
      Object.entries(localKeys).forEach(([key, value]) => {
        apiKeysStore.setKey(key as keyof typeof apiKeys, (value || '').trim());
      });
      toast.success('API keys saved successfully');
    } catch (error) {
      toast.error('Failed to save API keys');
      console.error('Error saving API keys:', error);
    }
  }, [localKeys]);

  return (
    <div className={styles.container}>
      <h3>API Keys</h3>
      <div className={styles.fields}>
        <div className={styles.field}>
          <label htmlFor="anthropic-key">Anthropic API Key</label>
          <input
            id="anthropic-key"
            type="password"
            value={localKeys.anthropicApiKey || ''}
            onChange={(e) => handleInputChange('anthropicApiKey', e.target.value)}
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
            value={localKeys.openaiApiKey || ''}
            onChange={(e) => handleInputChange('openaiApiKey', e.target.value)}
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
            value={localKeys.groqApiKey || ''}
            onChange={(e) => handleInputChange('groqApiKey', e.target.value)}
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
            value={localKeys.openRouterApiKey || ''}
            onChange={(e) => handleInputChange('openRouterApiKey', e.target.value)}
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
            value={localKeys.ollamaApiBaseUrl || ''}
            onChange={(e) => handleInputChange('ollamaApiBaseUrl', e.target.value)}
            placeholder="Enter Ollama API base URL"
            spellCheck={false}
            autoComplete="off"
          />
        </div>
      </div>
      <div className={styles.actions}>
        <button
          onClick={saveChanges}
          className="bg-bolt-elements-primary text-bolt-elements-textOnPrimary hover:bg-bolt-elements-primary-hover px-4 py-2 rounded-md transition-colors"
        >
          Save Changes
        </button>
      </div>
    </div>
  );
}
