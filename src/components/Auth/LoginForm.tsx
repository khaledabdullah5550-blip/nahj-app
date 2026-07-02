'use client';

import { FormEvent, useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';

export function LoginForm() {
  const { t } = useTranslation('common');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError('');
    setLoading(true);

    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
      router.push('/dashboard');
    } catch {
      setError(t('invalidCredentials'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="space-y-3 rounded-lg border bg-white p-6" onSubmit={handleSubmit}>
      <input className="w-full rounded border p-2" placeholder={t('email')} value={email} onChange={(e) => setEmail(e.target.value)} type="email" required />
      <input className="w-full rounded border p-2" placeholder={t('password')} value={password} onChange={(e) => setPassword(e.target.value)} type="password" required />
      {error && <p className="text-sm text-rose-600">{error}</p>}
      <button className="w-full rounded bg-sky-700 px-3 py-2 text-white" type="submit" disabled={loading}>
        {loading ? t('loading') : t('login')}
      </button>
      <p className="text-xs text-gray-500">{t('activityAutoLogout')}</p>
    </form>
  );
}
