'use client';

import { FormEvent, useMemo, useState } from 'react';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { auth } from '@/lib/firebase';
import { isStrongPassword } from '@/lib/auth';
import { upsertUserProfile } from '@/lib/db';
import { PlanTier } from '@/types';
import { useTranslation } from 'react-i18next';

export function RegisterForm() {
  const { t } = useTranslation('common');
  const router = useRouter();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [plan, setPlan] = useState<PlanTier>('free');
  const [error, setError] = useState('');

  const plans = useMemo(
    () => [
      { key: 'free' as const, label: `${t('free')} - ${t('freePrice')}` },
      { key: 'individual' as const, label: `${t('individual')} - ${t('individualPrice')}` },
      { key: 'groups' as const, label: `${t('groups')} - ${t('groupsPrice')}` },
      { key: 'special' as const, label: `${t('special')} - ${t('specialPrice')}` },
    ],
    [t],
  );

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');

    if (!isStrongPassword(password)) {
      setError(t('passwordRules'));
      return;
    }

    if (password !== confirmPassword) {
      setError(t('invalidCredentials'));
      return;
    }

    try {
      const credential = await createUserWithEmailAndPassword(auth, email.trim(), password);
      await upsertUserProfile(credential.user.uid, {
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        plan,
      });
      router.push('/dashboard');
    } catch {
      setError(t('invalidCredentials'));
    }
  }

  return (
    <form className="space-y-3 rounded-lg border bg-white p-6" onSubmit={handleSubmit}>
      <input className="w-full rounded border p-2" placeholder={t('name')} value={name} onChange={(e) => setName(e.target.value)} required />
      <input className="w-full rounded border p-2" placeholder={t('phone')} value={phone} onChange={(e) => setPhone(e.target.value)} required />
      <input className="w-full rounded border p-2" placeholder={t('email')} value={email} onChange={(e) => setEmail(e.target.value)} type="email" required />
      <input className="w-full rounded border p-2" placeholder={t('password')} value={password} onChange={(e) => setPassword(e.target.value)} type="password" required />
      <input className="w-full rounded border p-2" placeholder={t('confirmPassword')} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} type="password" required />
      <select className="w-full rounded border p-2" value={plan} onChange={(e) => setPlan(e.target.value as PlanTier)}>
        {plans.map((item) => (
          <option key={item.key} value={item.key}>
            {item.label}
          </option>
        ))}
      </select>
      {error && <p className="text-sm text-rose-600">{error}</p>}
      <button className="w-full rounded bg-sky-700 px-3 py-2 text-white" type="submit">
        {t('register')}
      </button>
      <p className="text-xs text-gray-500">{t('passwordRules')}</p>
    </form>
  );
}
