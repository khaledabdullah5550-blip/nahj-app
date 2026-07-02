'use client';

import Link from 'next/link';
import { AppNav } from '@/components/Navigation/AppNav';
import { RegisterForm } from '@/components/Auth/RegisterForm';

export default function RegisterPage() {
  return (
    <main className="mx-auto min-h-screen max-w-xl p-4">
      <AppNav authenticated={false} />
      <RegisterForm />
      <p className="mt-4 text-sm text-gray-500">
        Already have an account? <Link href="/login" className="underline">Login</Link>
      </p>
    </main>
  );
}
