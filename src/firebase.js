import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getFunctions } from 'firebase/functions';
import { initializeAppCheck, ReCaptchaV3Provider } from 'firebase/app-check';

// إعدادات مشروعك الفعلي في Firebase (هذه القيم عامة وليست سرية)
const firebaseConfig = {
  apiKey: "AIzaSyB7zWGS8lwRHBsomA-O_IH3uEZbb4gIsIc",
  authDomain: "nahj-app-664f5.firebaseapp.com",
  projectId: "nahj-app-664f5",
  storageBucket: "nahj-app-664f5.firebasestorage.app",
  messagingSenderId: "574577875060",
  appId: "1:574577875060:web:90dfa10d15d7cf020d1921",
  measurementId: "G-JCWYPND9HC"
};

export const app = initializeApp(firebaseConfig);

// حماية من إساءة الاستخدام الآلي — معطّلة مؤقتًا بسبب خلل بإعداد reCAPTCHA يسبب حظر الطلبات (400 throttled)
// TODO: أعد تفعيلها بعد التأكد من تطابق Site Key و Secret Key بشكل صحيح
const RECAPTCHA_SITE_KEY = "PASTE_YOUR_RECAPTCHA_KEY_HERE";
if (false && RECAPTCHA_SITE_KEY !== "PASTE_YOUR_RECAPTCHA_KEY_HERE") {
  initializeAppCheck(app, {
    provider: new ReCaptchaV3Provider(RECAPTCHA_SITE_KEY),
    isTokenAutoRefreshEnabled: true,
  });
}

export const auth = getAuth(app);
export const db = getFirestore(app);
export const functions = getFunctions(app);
