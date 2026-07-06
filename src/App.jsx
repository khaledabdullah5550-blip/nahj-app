import React, { useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './firebase';
import Login from './components/Login.jsx';
import Dashboard from './components/Dashboard.jsx';

export default function App() {
  const [user, setUser] = useState(undefined);
  const [lang, setLang] = useState('ar');
  const [theme, setTheme] = useState(() => localStorage.getItem('nahj_theme') || 'light');

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => setUser(u));
    return unsub;
  }, []);

  useEffect(() => {
    const html = document.documentElement;
    html.lang = lang;
    html.dir = lang === 'en' ? 'ltr' : 'rtl';
    html.classList.toggle('ltr', lang === 'en');
  }, [lang]);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    localStorage.setItem('nahj_theme', theme);
  }, [theme]);

  function toggleTheme() {
    setTheme((t) => (t === 'light' ? 'dark' : 'light'));
  }

  if (user === undefined) {
    return <div className="center-loading">جاري التحميل...</div>;
  }

  return (
    <>
      {user
        ? <Dashboard user={user} lang={lang} setLang={setLang} />
        : <Login lang={lang} setLang={setLang} />}
      <button className="theme-toggle" onClick={toggleTheme} title="تبديل الوضع الداكن">
        {theme === 'light' ? '🌙' : '☀️'}
      </button>
    </>
  );
}
