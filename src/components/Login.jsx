import React, { useState } from 'react';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  updateProfile,
} from 'firebase/auth';
import { auth } from '../firebase';
import { i18n } from '../i18n';

export default function Login({ lang, setLang }) {
  const t = i18n[lang];
  const [mode, setMode] = useState('login'); // 'login' | 'signup'
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [alert, setAlert] = useState(null); // {type, msg}
  const [loading, setLoading] = useState(false);

  const pwChecks = {
    length: password.length >= 8,
    upper: /[A-Z]/.test(password),
    lower: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
  };
  const pwStrongEnough = pwChecks.length && pwChecks.upper && pwChecks.lower && pwChecks.number;
  const reqLabels = {
    length: lang === 'ar' ? '٨ خانات على الأقل' : 'At least 8 characters',
    upper: lang === 'ar' ? 'حرف كبير (A-Z)' : 'Uppercase letter (A-Z)',
    lower: lang === 'ar' ? 'حرف صغير (a-z)' : 'Lowercase letter (a-z)',
    number: lang === 'ar' ? 'رقم (0-9)' : 'Number (0-9)',
  };

  async function handleSubmit(e) {
    e.preventDefault();
    if (!email || !password) {
      setAlert({ type: 'warning', msg: t.errFill });
      return;
    }
    if (mode === 'signup' && !name.trim()) {
      setAlert({ type: 'warning', msg: lang === 'ar' ? 'اكتب اسمك عشان يناديك المساعد فيه' : 'Enter your name so the assistant can call you by it' });
      return;
    }
    if (mode === 'signup' && !pwStrongEnough) {
      setAlert({ type: 'error', msg: lang === 'ar' ? 'كلمة المرور لا تستوفي المتطلبات' : 'Password does not meet requirements' });
      return;
    }
    setLoading(true);
    setAlert(null);
    try {
      if (mode === 'login') {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        const cred = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(cred.user, { displayName: name.trim() });
      }
      // onAuthStateChanged في App.jsx بيتكفل بتحويل الشاشة تلقائيًا
    } catch (err) {
      setAlert({ type: 'error', msg: friendlyError(err.code) });
    } finally {
      setLoading(false);
    }
  }

  async function handleReset() {
    if (!email) {
      setAlert({ type: 'warning', msg: t.errFill });
      return;
    }
    try {
      await sendPasswordResetEmail(auth, email);
      setAlert({ type: 'success', msg: t.resetSent });
    } catch (err) {
      setAlert({ type: 'error', msg: friendlyError(err.code) });
    }
  }

  function friendlyError(code) {
    const map = {
      'auth/invalid-email': lang === 'ar' ? 'صيغة البريد الإلكتروني غير صحيحة' : 'Invalid email format',
      'auth/user-not-found': lang === 'ar' ? 'لا يوجد حساب بهذا البريد' : 'No account with this email',
      'auth/wrong-password': lang === 'ar' ? 'كلمة المرور غير صحيحة' : 'Wrong password',
      'auth/email-already-in-use': lang === 'ar' ? 'هذا البريد مستخدم مسبقًا' : 'Email already in use',
      'auth/weak-password': lang === 'ar' ? 'كلمة المرور ضعيفة جدًا (6 خانات على الأقل)' : 'Password too weak (min 6 chars)',
      'auth/invalid-credential': lang === 'ar' ? 'البريد أو كلمة المرور غير صحيحة' : 'Invalid email or password',
    };
    return map[code] || t.errAuth;
  }

  return (
    <div className="screen">
      <div className="box">
        <div className="logo-section">
          <button className="lang-btn-abs" onClick={() => setLang(lang === 'ar' ? 'en' : 'ar')}>
            {lang === 'ar' ? 'EN' : 'AR'}
          </button>
          <div className="logo-icon">🏦</div>
          <h1>{t.appName}</h1>
          <p className="subtitle">{t.tagline}</p>
          <span className="badge">{t.versionBadge}</span>
        </div>

        {alert && <div className={`alert ${alert.type}`} style={{ display: 'block' }}>{alert.msg}</div>}

        <form onSubmit={handleSubmit}>
          {mode === 'signup' && (
            <div className="form-group">
              <label>{lang === 'ar' ? 'اسمك' : 'Your name'}</label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder={lang === 'ar' ? 'مثال: خالد' : 'e.g. Khaled'} required />
            </div>
          )}
          <div className="form-group">
            <label>{t.emailLbl}</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div className="form-group">
            <label>{t.passLbl}</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} minLength={6} required />
            {mode === 'signup' && (
              <div className="pw-reqs">
                {Object.entries(pwChecks).map(([key, ok]) => (
                  <div key={key} className={`req-item ${ok ? 'met' : 'unmet'}`}>
                    <span>{ok ? '✓' : '✗'}</span><span>{reqLabels[key]}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? <span className="spinner"></span> : (mode === 'login' ? t.loginBtn : t.signupBtn)}
          </button>
          <button type="button" className="link-btn" onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setAlert(null); }}>
            {mode === 'login' ? t.switchToSignup : t.switchToLogin}
          </button>
          {mode === 'login' && (
            <div>
              <button type="button" className="link-btn" onClick={handleReset}>{t.forgotPass}</button>
            </div>
          )}
        </form>

        <div className="security-info">
          <strong>🔒 {lang === 'ar' ? 'الأمان' : 'Security'}</strong>
          {lang === 'ar'
            ? 'تسجيل الدخول عبر Firebase Authentication الآمن. كلمات المرور لا تُخزَّن أبدًا كنص واضح.'
            : 'Login powered by Firebase Authentication. Passwords are never stored as plain text.'}
        </div>
      </div>
    </div>
  );
}
