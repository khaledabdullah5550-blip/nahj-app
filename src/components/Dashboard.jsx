import React, { useEffect, useState, useMemo, useRef } from 'react';
import { signOut, updateProfile } from 'firebase/auth';
import {
  collection, doc, addDoc, onSnapshot, query, orderBy,
  setDoc, getDoc, updateDoc, deleteDoc,
} from 'firebase/firestore';
import { auth, db } from '../firebase';
import { i18n } from '../i18n';

const AUTO_LOGOUT_MS = 5 * 60 * 1000; // 5 دقائق خمول
const OWNER_UID = "4IDARHpPnmS0NrK1xYD1cnryZcM2"; // حسابك أنت فقط يشوف لوحة الإدارة

export default function Dashboard({ user, lang, setLang }) {
  const t = i18n[lang];
  const uid = user.uid;
  const isOwner = uid === OWNER_UID;

  const [activeTab, setActiveTab] = useState('home');
  const [allFeedback, setAllFeedback] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [budget, setBudget] = useState({ monthlyLimit: 0 });
  const [goals, setGoals] = useState([]);
  const [alerts, setAlerts] = useState({});
  const [aiText, setAiText] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [budgetInput, setBudgetInput] = useState('');
  const [goalName, setGoalName] = useState('');
  const [goalTarget, setGoalTarget] = useState('');
  const [smsText, setSmsText] = useState('');
  const [pendingSMS, setPendingSMS] = useState(null);
  // ملاحظة: حالة الباقات (selectedTier) أُزيلت مؤقتًا مع إخفاء تبويب الباقات
  const [feedbackText, setFeedbackText] = useState('');

  const logoutTimer = useRef(null);
  const aiAbortController = useRef(null);
  const isFirstLangRender = useRef(true);

  function flash(key, type, msg) {
    setAlerts((a) => ({ ...a, [key]: { type, msg } }));
    setTimeout(() => setAlerts((a) => ({ ...a, [key]: null })), 6000);
  }

  function handleLogout() {
    if (aiAbortController.current) aiAbortController.current.abort();
    window.speechSynthesis?.cancel();
    signOut(auth);
  }

  function speakText(text) {
    if (!window.speechSynthesis) {
      flash('txn', 'warning', lang === 'ar' ? 'متصفحك لا يدعم هذي الميزة' : 'Your browser does not support this feature');
      return;
    }
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    const voices = window.speechSynthesis.getVoices();
    const saudiVoice = voices.find((v) => v.lang === 'ar-SA') || voices.find((v) => v.lang?.startsWith('ar'));
    if (saudiVoice) utterance.voice = saudiVoice;
    utterance.lang = saudiVoice?.lang || 'ar-SA';
    utterance.rate = 0.95;
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
  }

  function handleManualLogout() {
    if (confirm(lang === 'ar' ? 'هل متأكد من الخروج؟' : 'Confirm logout?')) {
      if (aiAbortController.current) aiAbortController.current.abort();
      window.speechSynthesis?.cancel();
      signOut(auth);
    }
  }

  // ===== إيقاف أي طلب أو صوت شغال لو المكوّن اتقفل (خروج، إغلاق تبويب...) =====
  useEffect(() => {
    return () => {
      if (aiAbortController.current) aiAbortController.current.abort();
      window.speechSynthesis?.cancel();
    };
  }, []);

  // ===== مسح المحادثة المعروضة عند تبديل اللغة (تفاديًا لاختلاط عربي/إنجليزي بنفس الخيط) =====
  useEffect(() => {
    if (isFirstLangRender.current) { isFirstLangRender.current = false; return; }
    setChatMessages([]);
    window.speechSynthesis?.cancel();
    setIsSpeaking(false);
  }, [lang]);

  // ===== الخروج الآمن التلقائي بعد 5 دقائق خمول =====
  useEffect(() => {
    function resetTimer() {
      if (logoutTimer.current) clearTimeout(logoutTimer.current);
      logoutTimer.current = setTimeout(() => {
        signOut(auth);
      }, AUTO_LOGOUT_MS);
    }
    const events = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'];
    events.forEach((ev) => window.addEventListener(ev, resetTimer));
    resetTimer();
    return () => {
      events.forEach((ev) => window.removeEventListener(ev, resetTimer));
      if (logoutTimer.current) clearTimeout(logoutTimer.current);
    };
  }, []);

  // ===== الاستماع الحي لبيانات المستخدم في Firestore =====
  useEffect(() => {
    const txnsQuery = query(collection(db, 'users', uid, 'transactions'), orderBy('date', 'desc'));
    const unsubTxns = onSnapshot(txnsQuery, (snap) => {
      setTransactions(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });

    const budgetRef = doc(db, 'users', uid, 'meta', 'budget');
    const unsubBudget = onSnapshot(budgetRef, (snap) => {
      if (snap.exists()) setBudget(snap.data());
    });

    const goalsQuery = query(collection(db, 'users', uid, 'goals'), orderBy('createdAt', 'desc'));
    const unsubGoals = onSnapshot(goalsQuery, (snap) => {
      setGoals(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });

    return () => { unsubTxns(); unsubBudget(); unsubGoals(); };
  }, [uid]);

  // لوحة الإدارة: يجلب كل الملاحظات فقط لو الحساب هو حساب المطوّر
  useEffect(() => {
    if (!isOwner) return;
    const fbQuery = query(collection(db, 'feedback'), orderBy('createdAt', 'desc'));
    const unsubFeedback = onSnapshot(fbQuery, (snap) => {
      setAllFeedback(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    return () => unsubFeedback();
  }, [isOwner]);

  const thisMonthTxns = useMemo(() => {
    const now = new Date();
    return transactions.filter((tx) => {
      const d = tx.date?.toDate ? tx.date.toDate() : new Date(tx.date);
      return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
    });
  }, [transactions]);

  const income = thisMonthTxns.filter((x) => x.type === 'income').reduce((s, x) => s + x.amount, 0);
  const expense = thisMonthTxns.filter((x) => x.type === 'expense').reduce((s, x) => s + x.amount, 0);

  async function handleAddTransaction(type) {
    if (!name || !amount || !category) { flash('txn', 'warning', t.errFill); return; }
    const num = parseFloat(amount);
    if (isNaN(num) || num <= 0) { flash('txn', 'error', t.errAmount); return; }
    await addDoc(collection(db, 'users', uid, 'transactions'), {
      type, category, name, amount: num, date: new Date().toISOString(), source: 'manual',
    });
    flash('txn', 'success', lang === 'ar' ? '✅ تمت الإضافة' : '✅ Added');
    setName(''); setAmount(''); setCategory('');
  }

  async function handleSaveBudget() {
    const val = parseFloat(budgetInput);
    if (isNaN(val) || val <= 0) { flash('budget', 'error', t.errAmount); return; }
    await setDoc(doc(db, 'users', uid, 'meta', 'budget'), { monthlyLimit: val }, { merge: true });
    flash('budget', 'success', lang === 'ar' ? '✅ تم الحفظ' : '✅ Saved');
  }

  async function handleAddGoal() {
    const target = parseFloat(goalTarget);
    if (!goalName || isNaN(target) || target <= 0) { flash('goals', 'warning', t.errFill); return; }
    await addDoc(collection(db, 'users', uid, 'goals'), {
      name: goalName, target, saved: 0, createdAt: new Date().toISOString(),
    });
    setGoalName(''); setGoalTarget('');
  }

  async function handleContribute(goalId, currentSaved, target) {
    const amtStr = prompt(lang === 'ar' ? 'كم تبي تضيف لهذا الهدف؟' : 'How much to add?');
    const amt = parseFloat(amtStr);
    if (isNaN(amt) || amt <= 0) return;
    const newSaved = Math.min(target, currentSaved + amt);
    await updateDoc(doc(db, 'users', uid, 'goals', goalId), { saved: newSaved });
  }

  async function deleteTransaction(txnId) {
    const msg = lang === 'ar' ? 'حذف هذه العملية نهائيًا؟' : 'Delete this transaction permanently?';
    if (!confirm(msg)) return;
    await deleteDoc(doc(db, 'users', uid, 'transactions', txnId));
  }

  function analyzeSMS() {
    const text = smsText.trim();
    if (!text) { flash('sms', 'warning', t.errFill); return; }
    const amountMatch = text.match(/(\d{1,3}(?:[,\d]{0,})(?:\.\d{1,2})?)\s*(?:ريال|ر\.?س|sar|sr)?/i);
    if (!amountMatch) { flash('sms', 'warning', lang === 'ar' ? 'لم أجد مبلغًا واضحًا' : 'No clear amount found'); return; }
    const amount = parseFloat(amountMatch[1].replace(/,/g, ''));
    if (isNaN(amount) || amount <= 0) { flash('sms', 'warning', lang === 'ar' ? 'لم أجد مبلغًا واضحًا' : 'No clear amount found'); return; }

    const debitWords = /(خصم|سحب|شراء|دفع|purchase|debit|withdraw|paid)/i;
    const creditWords = /(إيداع|ايداع|راتب|تحويل وارد|credit|deposit|salary|refund|received)/i;
    let type = 'expense';
    if (creditWords.test(text) && !debitWords.test(text)) type = 'income';

    let merchant = null;
    const ldaMatch = text.match(/لدى\s+([\u0600-\u06FFA-Za-z0-9\s]{2,30})/);
    if (ldaMatch) {
      merchant = ldaMatch[1];
    } else {
      const fallbackMatch = text.match(/(?:من|at|from)\s+([\u0600-\u06FFA-Za-z0-9\s]{2,30})/);
      if (fallbackMatch) merchant = fallbackMatch[1];
    }
    if (merchant) merchant = merchant.trim().split(/\s{2,}|\n/)[0];

    setPendingSMS({ type, amount, merchant: merchant || t.unknownMerchant });
  }

  async function confirmSMS() {
    if (!pendingSMS) return;
    await addDoc(collection(db, 'users', uid, 'transactions'), {
      type: pendingSMS.type,
      category: pendingSMS.type === 'income' ? 'أخرى دخل' : 'أخرى',
      name: pendingSMS.merchant,
      amount: pendingSMS.amount,
      date: new Date().toISOString(),
      source: 'sms',
    });
    flash('sms', 'success', lang === 'ar' ? '✅ تمت الإضافة للسجل' : '✅ Added to record');
    setSmsText(''); setPendingSMS(null);
  }

  const AI_ENABLED = true;
  const WORKER_URL = "https://nahj-advisor.khaled-abdullah5550.workers.dev";
  const [chatMessages, setChatMessages] = useState([]); // [{role:'user'|'model', text}]
  const [nameInput, setNameInput] = useState('');
  const [savingName, setSavingName] = useState(false);

  async function saveDisplayName() {
    if (!nameInput.trim()) return;
    setSavingName(true);
    try {
      await updateProfile(user, { displayName: nameInput.trim() });
      window.location.reload(); // أبسط طريقة نحدّث بيها بيانات user بكل مكان بالتطبيق فورًا
    } catch (err) {
      console.error(err);
      setSavingName(false);
    }
  }
  const [chatInput, setChatInput] = useState('');

  // تحميل سجل المحادثة المحفوظ (يبني استمرارية وثقة، مو محادثة تبدأ من الصفر كل مرة)
  useEffect(() => {
    const chatRef = doc(db, 'users', uid, 'meta', 'chatHistory');
    getDoc(chatRef).then((snap) => {
      if (snap.exists() && Array.isArray(snap.data().messages)) {
        setChatMessages(snap.data().messages);
      }
    });
  }, [uid]);

  async function persistChat(messages) {
    const trimmed = messages.slice(-20); // آخر 20 رسالة بس، يكفي للسياق وما يكبر الحجم
    await setDoc(doc(db, 'users', uid, 'meta', 'chatHistory'), { messages: trimmed }, { merge: true });
  }

  function buildSummary() {
    const byCategory = {};
    thisMonthTxns.filter((x) => x.type === 'expense').forEach((x) => {
      byCategory[x.category] = (byCategory[x.category] || 0) + x.amount;
    });
    const now = new Date();
    const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthTxns = transactions.filter((tx) => {
      const d = tx.date?.toDate ? tx.date.toDate() : new Date(tx.date);
      return d.getFullYear() === lastMonthDate.getFullYear() && d.getMonth() === lastMonthDate.getMonth();
    });
    const lastMonthExpense = lastMonthTxns.filter((x) => x.type === 'expense').reduce((s, x) => s + x.amount, 0);
    return {
      userName: user.displayName || null,
      thisMonthIncome: income, thisMonthExpense: expense,
      lastMonthExpense: lastMonthTxns.length > 0 ? lastMonthExpense : null,
      monthlyBudget: budget.monthlyLimit || null, expenseByCategory: byCategory,
      goals: goals.map((g) => ({ name: g.name, target: g.target, saved: g.saved })),
    };
  }

  async function sendChatMessage(overrideText) {
    const text = (overrideText ?? chatInput).trim();
    if (!text) return;
    if (transactions.length < 3) { setChatMessages((m) => [...m, { role: 'model', text: t.aiNeedData }]); return; }

    const userMsg = { role: 'user', text };
    const newMessages = [...chatMessages, userMsg];
    setChatMessages(newMessages);
    setChatInput('');
    setAiLoading(true);

    const controller = new AbortController();
    aiAbortController.current = controller;
    try {
      const idToken = await user.getIdToken();
      const response = await fetch(WORKER_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${idToken}` },
        body: JSON.stringify({
          lang,
          summary: buildSummary(),
          history: chatMessages,
          message: text,
        }),
        signal: controller.signal,
      });
      if (!response.ok) {
        let serverMsg = null;
        try { serverMsg = (await response.json()).error; } catch (_) {}
        setChatMessages((m) => [...m, { role: 'model', text: serverMsg || t.aiErr }]);
        return;
      }
      const result = await response.json();
      const replyText = result.reply || result.error || t.aiErr;
      const updated = [...newMessages, { role: 'model', text: replyText }];
      setChatMessages(updated);
      persistChat(updated);
    } catch (err) {
      if (err.name === 'AbortError') return;
      console.error(err);
      setChatMessages((m) => [...m, { role: 'model', text: t.aiErr }]);
    } finally {
      setAiLoading(false);
    }
  }

  function startConversation() {
    const starter = lang === 'ar'
      ? 'أعطني نظرة سريعة على وضعي المالي هذا الشهر'
      : 'Give me a quick look at my finances this month';
    sendChatMessage(starter);
  }

  function exportCSV() {
    if (transactions.length === 0) return;
    const headers = lang === 'ar'
      ? ['النوع', 'الفئة', 'الوصف', 'المبلغ', 'التاريخ', 'المصدر']
      : ['Type', 'Category', 'Description', 'Amount', 'Date', 'Source'];
    const rows = transactions.map((tx) => {
      const d = tx.date?.toDate ? tx.date.toDate() : new Date(tx.date);
      return [tx.type === 'income' ? t.credit : t.debit, tx.category, tx.name, tx.amount, d.toLocaleDateString('en-CA'), tx.source];
    });
    const csvContent = '\uFEFF' + [headers, ...rows].map((r) => r.map((c) => `"${c}"`).join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `nahj-transactions-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function submitFeedback() {
    if (!feedbackText.trim()) { flash('feedback', 'warning', t.errFill); return; }
    await addDoc(collection(db, 'feedback'), {
      message: feedbackText.trim(),
      email: user.email,
      uid,
      createdAt: new Date().toISOString(),
      page: 'nahj-app',
    });
    flash('feedback', 'success', lang === 'ar' ? '✅ شكرًا! وصلتنا ملاحظتك' : '✅ Thanks! Your feedback was received');
    setFeedbackText('');
  }

  const spentPct = budget.monthlyLimit ? Math.min(100, (expense / budget.monthlyLimit) * 100) : 0;
  const now = new Date();
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const daysRemaining = Math.max(1, daysInMonth - now.getDate() + 1);
  const dailyBudget = budget.monthlyLimit ? Math.max(0, (budget.monthlyLimit - expense) / daysRemaining) : null;
  const barColor = spentPct >= 100 ? 'var(--danger)' : spentPct >= 80 ? 'var(--warning)' : 'var(--success)';
  const budgetStatus = spentPct >= 100 ? t.budgetOver : spentPct >= 80 ? t.budgetNear : t.budgetOk;

  const TABS = [
    { id: 'home', icon: '🏠', label: lang === 'ar' ? 'الرئيسية' : 'Home' },
    { id: 'txns', icon: '💳', label: lang === 'ar' ? 'العمليات' : 'Transactions' },
    // ملاحظة: تبويب "الباقات" مخفي مؤقتًا لحين تفعيل بوابة دفع حقيقية — لا داعي نعرض أسعار على نسخة تجريبية مجانية بالكامل
    { id: 'goals', icon: '🎯', label: lang === 'ar' ? 'الأهداف' : 'Goals' },
    { id: 'feedback', icon: '💬', label: lang === 'ar' ? 'تواصل' : 'Feedback' },
    ...(isOwner ? [{ id: 'admin', icon: '🛠️', label: lang === 'ar' ? 'الإدارة' : 'Admin' }] : []),
  ];

  return (
    <div className="app-container">
      <div className="top-nav">
        <div className="nav-title">📊 {t.welcomeMsg}, {user.displayName || user.email}</div>
        <div className="nav-controls">
          <button className="chip-btn" onClick={() => { setChatMessages([]); window.speechSynthesis?.cancel(); setIsSpeaking(false); setLang(lang === 'ar' ? 'en' : 'ar'); }}>{t.lang}</button>
          <button className="chip-btn outline" onClick={handleManualLogout}>{t.logout}</button>
        </div>
      </div>

      <div className="trial-banner">
        {lang === 'ar'
          ? '🎁 هذه نسخة تجريبية مجانية بالكامل حاليًا لأغراض الاختبار. بعض الخدمات قد تصبح باشتراك مدفوع لاحقًا بعد انتهاء فترة التجربة — بياناتك المحفوظة تبقى معك بأي حال.'
          : '🎁 This is currently a completely free trial version for testing purposes. Some services may become paid subscriptions later — your saved data stays with you regardless.'}
      </div>

      {!user.displayName && (
        <div className="main-card">
          <h3>👋 {lang === 'ar' ? 'أضف اسمك' : 'Add your name'}</h3>
          <p style={{ fontSize: 12, color: 'var(--text-light)', marginBottom: 10 }}>
            {lang === 'ar' ? 'عشان "مساعد" يقدر يناديك باسمك بالمحادثة' : 'So "Assistant" can address you by name in chat'}
          </p>
          <div className="input-row">
            <input type="text" value={nameInput} onChange={(e) => setNameInput(e.target.value)} placeholder={lang === 'ar' ? 'مثال: خالد' : 'e.g. Khaled'} />
            <button className="btn-primary" style={{ margin: 0 }} onClick={saveDisplayName} disabled={savingName || !nameInput.trim()}>
              {savingName ? <span className="spinner"></span> : (lang === 'ar' ? 'حفظ' : 'Save')}
            </button>
          </div>
        </div>
      )}

      <div className="bottom-tabs">
        {TABS.map((tab) => (
          <button key={tab.id} className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`} onClick={() => setActiveTab(tab.id)}>
            <span className="tab-icon">{tab.icon}</span>
            <span className="tab-label">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* ===== تبويب الرئيسية ===== */}
      {activeTab === 'home' && (
        <>
          {dailyBudget !== null && (
            <div className="daily-budget-hero">
              <div className="daily-budget-label">📅 {lang === 'ar' ? 'ميزانيتك اليوم' : "Today's budget"}</div>
              <div className="daily-budget-value">{dailyBudget.toFixed(0)} <span>{t.currency}</span></div>
              <div className="daily-budget-sub">
                {lang === 'ar' ? `موزّعة على ${daysRemaining} يوم متبقي بالشهر` : `Spread over ${daysRemaining} days left this month`}
              </div>
            </div>
          )}

          <div className="stats-grid">
            <div className="stat-card income"><div className="stat-label">📈 {t.lblIncome}</div><div className="stat-value">{income.toFixed(2)}</div><div style={{ fontSize: 10, color: '#7f8c8d' }}>{t.currency}</div></div>
            <div className="stat-card expense"><div className="stat-label">📉 {t.lblExpense}</div><div className="stat-value">{expense.toFixed(2)}</div><div style={{ fontSize: 10, color: '#7f8c8d' }}>{t.currency}</div></div>
            <div className="stat-card balance"><div className="stat-label">💰 {t.lblBalance}</div><div className="stat-value">{(income - expense).toFixed(2)}</div><div style={{ fontSize: 10, color: '#7f8c8d' }}>{t.currency}</div></div>
          </div>

          <div className="main-card">
            <h3>{t.budgetTitle}</h3>
            {alerts.budget && <div className={`alert ${alerts.budget.type}`} style={{ display: 'block' }}>{alerts.budget.msg}</div>}
            <div className="input-row">
              <input type="number" placeholder={t.budgetPh} value={budgetInput} onChange={(e) => setBudgetInput(e.target.value)} min="0" step="0.01" />
              <button className="btn-primary" style={{ margin: 0 }} onClick={handleSaveBudget}>{t.budgetSave}</button>
            </div>
            {budget.monthlyLimit > 0 && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-light)' }}>
                  <span>{(lang === 'ar' ? 'المصروف: ' : 'Spent: ') + expense.toFixed(2)}</span>
                  <span>{(lang === 'ar' ? 'الحد: ' : 'Limit: ') + budget.monthlyLimit.toFixed(2)}</span>
                </div>
                <div className="budget-bar-track"><div className="budget-bar-fill" style={{ width: spentPct + '%', background: barColor }}></div></div>
                <div style={{ fontSize: 12, fontWeight: 600, color: barColor }}>{budgetStatus}</div>
              </div>
            )}
          </div>

          <div className="main-card">
            <div className="advisor-header">
              <div className="advisor-avatar">🧭</div>
              <div>
                <div className="advisor-name">{lang === 'ar' ? 'مساعد — مستشارك في نهج' : 'Assistant — Your Nahj Advisor'}</div>
                <div className="advisor-status">● {lang === 'ar' ? 'جاهز يسولف وياك' : 'Ready to chat'}</div>
              </div>
            </div>

            <div className="chat-thread">
              {chatMessages.length === 0 && (
                <div className="chat-bubble model">
                  {lang === 'ar'
                    ? `أهلًا فيك${user.displayName ? ' يا ' + user.displayName : ''} 👋 أنا مساعد، وودّي أتعرف على وضعك المالي أول بأول وأكون معك خطوة بخطوة. جرب تسألني أي شي، أو اضغط الزر تحت نبدأ.`
                    : `Hey${user.displayName ? ' ' + user.displayName : ' there'} 👋 I'm Assistant. I'd love to get to know your finances and walk with you step by step. Ask me anything, or tap below to start.`}
                </div>
              )}
              {chatMessages.map((m, i) => (
                <div key={i} className={`chat-bubble ${m.role}`}>
                  {m.text}
                  {m.role === 'model' && i === chatMessages.length - 1 && (
                    <button className="speak-inline-btn" onClick={() => speakText(m.text)} title={lang === 'ar' ? 'استمع' : 'Listen'}>
                      {isSpeaking ? '⏹' : '🔊'}
                    </button>
                  )}
                </div>
              ))}
              {aiLoading && <div className="chat-bubble model"><span className="spinner" style={{ borderTopColor: 'var(--primary)' }}></span></div>}
            </div>

            {chatMessages.length === 0 ? (
              <button className="btn-primary" onClick={startConversation} disabled={aiLoading}>
                {lang === 'ar' ? '✨ ابدأ المحادثة' : '✨ Start the conversation'}
              </button>
            ) : (
              <div className="chat-input-row">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') sendChatMessage(); }}
                  placeholder={lang === 'ar' ? 'اكتب ردك هنا...' : 'Type your reply...'}
                  disabled={aiLoading}
                />
                <button className="btn-primary" style={{ width: 'auto', margin: 0 }} onClick={() => sendChatMessage()} disabled={aiLoading || !chatInput.trim()}>
                  {lang === 'ar' ? 'إرسال' : 'Send'}
                </button>
              </div>
            )}
          </div>
        </>
      )}

      {/* ===== تبويب العمليات ===== */}
      {activeTab === 'txns' && (
        <>
          <div className="main-card">
            <h3>{t.addTitle}</h3>
            {alerts.txn && <div className={`alert ${alerts.txn.type}`} style={{ display: 'block' }}>{alerts.txn.msg}</div>}
            <div className="input-row full"><input type="text" placeholder={t.namePh} value={name} onChange={(e) => setName(e.target.value)} /></div>
            <div className="input-row">
              <input type="number" placeholder={t.amountPh} value={amount} onChange={(e) => setAmount(e.target.value)} min="0" step="0.01" />
              <select value={category} onChange={(e) => setCategory(e.target.value)}>
                <option value="">{t.selectOpt}</option>
                <optgroup label={lang === 'ar' ? '📤 مصروفات' : '📤 Expenses'}>
                  {t.expenses.map(([val, label]) => <option key={val} value={val}>{label}</option>)}
                </optgroup>
                <optgroup label={lang === 'ar' ? '📥 إيرادات' : '📥 Income'}>
                  {t.incomes.map(([val, label]) => <option key={val} value={val}>{label}</option>)}
                </optgroup>
              </select>
            </div>
            <div className="button-row">
              <button className="btn-action expense" onClick={() => handleAddTransaction('expense')}>{t.btnExpense}</button>
              <button className="btn-action income" onClick={() => handleAddTransaction('income')}>{t.btnIncome}</button>
            </div>
          </div>

          <div className="main-card">
            <h3>{t.smsTitle}</h3>
            <p style={{ fontSize: 12, color: 'var(--text-light)', marginBottom: 10 }}>{t.smsDesc}</p>
            {alerts.sms && <div className={`alert ${alerts.sms.type}`} style={{ display: 'block' }}>{alerts.sms.msg}</div>}
            <textarea placeholder={t.smsPh} value={smsText} onChange={(e) => setSmsText(e.target.value)}></textarea>
            <button className="btn-primary" onClick={analyzeSMS}>{t.smsAnalyze}</button>
            {pendingSMS && (
              <div className="sms-preview">
                <div className="sms-preview-row">
                  <span>{lang === 'ar' ? 'النوع' : 'Type'}:</span>
                  <select value={pendingSMS.type} onChange={(e) => setPendingSMS({ ...pendingSMS, type: e.target.value })} style={{ width: 'auto', padding: '4px 8px' }}>
                    <option value="expense">{t.debit}</option>
                    <option value="income">{t.credit}</option>
                  </select>
                </div>
                <div className="sms-preview-row">
                  <span>{lang === 'ar' ? 'المبلغ' : 'Amount'}:</span>
                  <input type="number" value={pendingSMS.amount} onChange={(e) => setPendingSMS({ ...pendingSMS, amount: parseFloat(e.target.value) || 0 })} style={{ width: 100, padding: '4px 8px' }} step="0.01" min="0" />
                </div>
                <div className="sms-preview-row">
                  <span>{lang === 'ar' ? 'الجهة' : 'Merchant'}:</span>
                  <input type="text" value={pendingSMS.merchant} onChange={(e) => setPendingSMS({ ...pendingSMS, merchant: e.target.value })} style={{ width: 160, padding: '4px 8px' }} />
                </div>
                <p style={{ fontSize: 9, color: 'var(--text-light)', margin: '4px 0 8px' }}>
                  {lang === 'ar' ? '💡 تقدر تعدّل أي قيمة أعلاه قبل الإضافة لو التحليل التلقائي أخطأ' : '💡 You can edit any value above before adding if the automatic analysis got it wrong'}
                </p>
                <div className="button-row">
                  <button className="btn-action income" onClick={confirmSMS}>{t.smsConfirm}</button>
                  <button className="btn-action expense" onClick={() => setPendingSMS(null)}>{t.smsCancel}</button>
                </div>
              </div>
            )}
          </div>

          <div className="main-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
              <h3 style={{ border: 'none', marginBottom: 0, paddingBottom: 0 }}>{t.historyTitle}</h3>
              <button className="chip-btn" onClick={exportCSV} disabled={transactions.length === 0}>⬇️ {lang === 'ar' ? 'تصدير CSV' : 'Export CSV'}</button>
            </div>
            <div style={{ borderBottom: '2px solid var(--primary)', margin: '10px 0 14px 0' }}></div>
            <div className="txn-list">
              {transactions.length === 0 && <div className="empty-state">{t.empty}</div>}
              {transactions.slice(0, 30).map((tx) => {
                const d = tx.date?.toDate ? tx.date.toDate() : new Date(tx.date);
                return (
                  <div className="txn-row" key={tx.id}>
                    <div>
                      <span className={`tag ${tx.source}`}>{tx.source === 'sms' ? 'SMS' : (lang === 'ar' ? 'يدوي' : 'Manual')}</span>
                      {tx.name}
                      <div className="txn-meta">{tx.category} · {d.toLocaleDateString(lang === 'ar' ? 'ar-SA' : 'en-US', { month: 'short', day: 'numeric' })}</div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div className={`txn-amt ${tx.type}`}>{tx.type === 'income' ? '+' : '-'}{tx.amount.toFixed(2)}</div>
                      <button onClick={() => deleteTransaction(tx.id)} title={lang === 'ar' ? 'حذف' : 'Delete'} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, opacity: 0.6 }}>🗑️</button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}

      {/* ===== تبويب الأهداف ===== */}
      {activeTab === 'goals' && (
        <div className="main-card">
          <h3>{t.goalsTitle}</h3>
          {alerts.goals && <div className={`alert ${alerts.goals.type}`} style={{ display: 'block' }}>{alerts.goals.msg}</div>}
          <div className="input-row">
            <input type="text" placeholder={t.goalNamePh} value={goalName} onChange={(e) => setGoalName(e.target.value)} />
            <input type="number" placeholder={t.goalTargetPh} value={goalTarget} onChange={(e) => setGoalTarget(e.target.value)} min="0" step="0.01" />
          </div>
          <button className="btn-primary" onClick={handleAddGoal}>{t.goalAdd}</button>
          <div style={{ marginTop: 12 }}>
            {goals.length === 0 && <div className="empty-state">{t.empty}</div>}
            {goals.map((g) => {
              const pct = Math.min(100, (g.saved / g.target) * 100);
              return (
                <div className="goal-card" key={g.id}>
                  <div className="goal-top"><span>{g.name}</span><span>{g.saved.toFixed(0)} / {g.target.toFixed(0)} {t.currency}</span></div>
                  <div className="budget-bar-track"><div className="budget-bar-fill" style={{ width: pct + '%', background: 'var(--primary)' }}></div></div>
                  <button className="link-btn" onClick={() => handleContribute(g.id, g.saved, g.target)}>+ {lang === 'ar' ? 'إضافة مبلغ' : 'Add amount'}</button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ===== تبويب الباقات: مخفي مؤقتًا (راجع الملاحظة أعلى مصفوفة TABS) — الكود محفوظ بسجل Git لو احتجناه لاحقًا ===== */}

      {/* ===== تبويب تواصل معنا ===== */}
      {activeTab === 'feedback' && (
        <div className="main-card">
          <h3>{lang === 'ar' ? '💬 تواصل معنا / اقتراحاتك' : '💬 Contact us / Suggestions'}</h3>
          <p style={{ fontSize: 12, color: 'var(--text-light)', marginBottom: 12 }}>
            {lang === 'ar'
              ? 'لاحظت شي غلط، أو عندك اقتراح لتحسين التطبيق؟ اكتبه هنا ويوصلنا مباشرة.'
              : 'Noticed something wrong, or have a suggestion? Write it here and it reaches us directly.'}
          </p>
          {alerts.feedback && <div className={`alert ${alerts.feedback.type}`} style={{ display: 'block' }}>{alerts.feedback.msg}</div>}
          <textarea
            placeholder={lang === 'ar' ? 'اكتب ملاحظتك هنا...' : 'Write your feedback here...'}
            value={feedbackText}
            onChange={(e) => setFeedbackText(e.target.value)}
            style={{ minHeight: 120 }}
          ></textarea>
          <button className="btn-primary" onClick={submitFeedback}>{lang === 'ar' ? 'إرسال الملاحظة' : 'Send Feedback'}</button>
        </div>
      )}

      {/* ===== تبويب الإدارة (يظهر فقط لحساب المطوّر) ===== */}
      {activeTab === 'admin' && isOwner && (
        <div className="main-card">
          <h3>🛠️ {lang === 'ar' ? 'لوحة الإدارة — كل الملاحظات' : 'Admin — All Feedback'}</h3>
          <p style={{ fontSize: 11, color: 'var(--text-light)', marginBottom: 12 }}>
            {lang === 'ar' ? `إجمالي الملاحظات: ${allFeedback.length}` : `Total feedback: ${allFeedback.length}`}
          </p>
          <div className="txn-list" style={{ maxHeight: 500 }}>
            {allFeedback.length === 0 && <div className="empty-state">{lang === 'ar' ? 'لا توجد ملاحظات بعد' : 'No feedback yet'}</div>}
            {allFeedback.map((fb) => (
              <div key={fb.id} className="goal-card">
                <div style={{ fontSize: 11, color: 'var(--text-light)', marginBottom: 6, display: 'flex', justifyContent: 'space-between' }}>
                  <span>{fb.email}</span>
                  <span>{new Date(fb.createdAt).toLocaleString(lang === 'ar' ? 'ar-SA' : 'en-US')}</span>
                </div>
                <div style={{ fontSize: 13 }}>{fb.message}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="compliance-info">
        <strong>{t.complianceTitle}</strong>
        <span>{t.complianceMsg}</span>
      </div>
    </div>
  );
}
