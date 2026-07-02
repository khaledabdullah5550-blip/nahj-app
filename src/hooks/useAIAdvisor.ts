'use client';

import { useState } from 'react';
import { PlanTier, Transaction } from '@/types';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export function useAIAdvisor(language: 'en' | 'ar', plan: PlanTier, transactions: Transaction[]) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);

  async function askAdvisor(message: string) {
    const nextMessages: ChatMessage[] = [...messages, { role: 'user', content: message }];
    setMessages(nextMessages);
    setLoading(true);

    try {
      const response = await fetch('/api/ai-advisor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, language, plan, transactions }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? 'AI request failed');
      }

      setMessages((prev) => [...prev, { role: 'assistant', content: data.reply }]);
    } catch {
      setMessages((prev) => [...prev, { role: 'assistant', content: language === 'ar' ? 'تعذر الحصول على رد الآن.' : 'Unable to fetch AI response right now.' }]);
    } finally {
      setLoading(false);
    }
  }

  return { messages, loading, askAdvisor };
}
