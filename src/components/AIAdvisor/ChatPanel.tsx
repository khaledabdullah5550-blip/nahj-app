'use client';

import { FormEvent, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { PlanTier, Transaction } from '@/types';
import { useAIAdvisor } from '@/hooks/useAIAdvisor';

export function ChatPanel({ language, plan, transactions }: { language: 'en' | 'ar'; plan: PlanTier; transactions: Transaction[] }) {
  const { t } = useTranslation('common');
  const [input, setInput] = useState('');
  const { messages, loading, askAdvisor } = useAIAdvisor(language, plan, transactions);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!input.trim()) {
      return;
    }
    await askAdvisor(input);
    setInput('');
  }

  return (
    <section className="rounded-lg border bg-white p-4">
      <h2 className="mb-3 font-semibold">{t('aiAdvisor')}</h2>
      <div className="mb-3 max-h-60 space-y-2 overflow-auto">
        {messages.map((message, index) => (
          <div key={`${message.role}-${index}`} className={`rounded-md p-2 text-sm ${message.role === 'user' ? 'bg-sky-50' : 'bg-gray-100'}`}>
            {message.content}
          </div>
        ))}
      </div>
      <form className="flex gap-2" onSubmit={submit}>
        <input className="flex-1 rounded border p-2" value={input} onChange={(event) => setInput(event.target.value)} placeholder={t('askAdvisor')} />
        <button className="rounded bg-sky-700 px-3 py-2 text-white" type="submit" disabled={loading || !input.trim()}>
          {loading ? t('loading') : t('send')}
        </button>
      </form>
    </section>
  );
}
