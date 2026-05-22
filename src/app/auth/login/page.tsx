import { Suspense } from 'react';
import { LoginForm } from './LoginForm';

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-700 to-indigo-700">
        <div className="text-white text-sm">Loading...</div>
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}
