'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/context/AppContext';

export default function AdminLoginPage() {
  const router = useRouter();
  const { t } = useApp();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      if (res.ok) {
        router.push('/admin');
        router.refresh();
      } else {
        const data = await res.json();
        setError(data.error || 'Login failed');
      }
    } catch {
      setError('Connection error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-sand-50 dark:bg-charcoal px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-forest flex items-center justify-center text-ivory font-bold text-2xl font-arabic mx-auto mb-4">
            م
          </div>
          <h1 className="text-2xl font-bold text-charcoal dark:text-ivory">لوحة التحكم</h1>
          <p className="text-charcoal/60 dark:text-ivory/60 mt-1">Mafroshat Al Saree — Admin</p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-ivory dark:bg-charcoal-light rounded-2xl border border-charcoal/10 dark:border-charcoal-border p-6 lg:p-8 shadow-card"
        >
          {error && (
            <div className="mb-4 p-3 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 text-sm">
              {error}
            </div>
          )}

          <label className="block mb-4">
            <span className="text-sm font-medium text-charcoal dark:text-ivory mb-1.5 block">
              اسم المستخدم / Username
            </span>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              className="w-full h-11 px-3 rounded-xl bg-sand-100 dark:bg-charcoal-elevated border border-charcoal/10 dark:border-charcoal-border text-sm focus:outline-none focus:border-forest"
            />
          </label>

          <label className="block mb-6">
            <span className="text-sm font-medium text-charcoal dark:text-ivory mb-1.5 block">
              كلمة المرور / Password
            </span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full h-11 px-3 rounded-xl bg-sand-100 dark:bg-charcoal-elevated border border-charcoal/10 dark:border-charcoal-border text-sm focus:outline-none focus:border-forest"
            />
          </label>

          <button
            type="submit"
            disabled={loading}
            className="w-full h-11 rounded-xl bg-forest text-ivory font-medium hover:bg-forest-light transition-colors disabled:opacity-50"
          >
            {loading ? 'جاري الدخول...' : 'تسجيل الدخول'}
          </button>

          <p className="mt-4 text-xs text-charcoal/40 dark:text-ivory/40 text-center">
            البيانات الافتراضية: admin / admin123 — غيّرها بعد أول دخول
          </p>
        </form>

        <div className="text-center mt-6">
          <a href="/" className="text-sm text-charcoal/60 dark:text-ivory/60 hover:text-forest">
            ← العودة للموقع
          </a>
        </div>
      </div>
    </div>
  );
}
