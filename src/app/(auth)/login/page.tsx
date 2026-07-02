'use client';

import Link from 'next/link';
import { AppNav } from '@/components/Navigation/AppNav';
import { LoginForm } from '@/components/Auth/LoginForm';

export default function LoginPage() {
  return (
    <main className="mx-auto min-h-screen max-w-xl p-4">
      <AppNav authenticated={false} />
      <LoginForm />
      <p className="mt-4 text-sm text-gray-500">
        New user? <Link href="/register" className="underline">Create account</Link>
      </p>
    </main>
  );
}
