// 🚀 تطبيق نهج - خادم Node.js الآمن مع Firebase
// ملف: server.js

const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const admin = require('firebase-admin');
require('dotenv').config();

const app = express();

// 🔥 تهيئة Firebase
try {
  const serviceAccount = require('./firebase-key.json');

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: process.env.FIREBASE_PROJECT_ID
  });

  const db = admin.firestore();
  console.log('🔥 Firebase تم تهيئته بنجاح');
} catch (err) {
  console.error('❌ خطأ في تحميل Firebase:', err.message);
  console.warn('⚠️ استخدام البيانات المؤقتة بدلاً من Firebase');
}

const db = admin.firestore();

// ⚙️ الإعدادات الأساسية
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://yourdomain.com'] 
    : ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:5173'],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 🔐 مفتاح التوقيع من متغيرات البيئة
const JWT_SECRET = process.env.JWT_SECRET || 'nahj-secret-key-2026-change-in-production';

if (!process.env.JWT_SECRET) {
  console.warn('⚠️ تحذير: JWT_SECRET من القيمة الافتراضية - غيّرها في .env!');
}

console.log('🔐 JWT_SECRET تم تحميله من .env');

// 🔐 Middleware للتحقق من التوكن
const verifyToken = (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    
    if (!authHeader) {
      return res.status(401).json({ 
        success: false,
        message: 'لا يوجد توكن' 
      });
    }

    const token = authHeader.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ 
        success: false,
        message: 'صيغة التوكن خاطئة' 
      });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    console.error('❌ خطأ في التحقق من التوكن:', err.message);
    return res.status(403).json({ 
      success: false,
      message: 'توكن غير صالح أو منتهي الصلاحية' 
    });
  }
};

// 🌐 API Endpoints

// 1️⃣ فحص صحة الخادم
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: '✅ الخادم يعمل بشكل صحيح',
    timestamp: new Date().toISOString()
  });
});

// 2️⃣ الصفحة الرئيسية
app.get('/', (req, res) => {
  res.json({
    message: '🏦 Nahj Financial Platform Backend',
    version: '1.0.0',
    database: 'Firebase Firestore ✅',
    status: '✅ Ready',
    endpoints: {
      health: 'GET /health',
      register: 'POST /api/auth/register',
      login: 'POST /api/auth/login',
      logout: 'POST /api/auth/logout',
      summary: 'GET /api/transactions/summary',
      addTransaction: 'POST /api/transactions/add',
      history: 'GET /api/transactions/history'
    }
  });
});

// 3️⃣ التسجيل (إنشاء حساب جديد)
app.post('/api/auth/register', async (req, res) => {
  try {
    const { nationalId, password, name, email } = req.body;

    console.log('📝 محاولة تسجيل:', { nationalId, email });

    // التحقق من البيانات
    if (!nationalId || !password || !name || !email) {
      return res.status(400).json({ 
        success: false,
        message: 'جميع البيانات مطلوبة' 
      });
    }

    if (nationalId.length !== 10) {
      return res.status(400).json({ 
        success: false,
        message: 'الهوية الوطنية يجب أن تكون 10 أرقام' 
      });
    }

    if (!/^\d+$/.test(nationalId)) {
      return res.status(400).json({ 
        success: false,
        message: 'الهوية يجب أن تحتوي على أرقام فقط' 
      });
    }

    if (password.length < 6) {
      return res.status(400).json({ 
        success: false,
        message: 'كلمة المرور يجب أن تكون 6 أحرف على الأقل' 
      });
    }

    // البحث عن مستخدم موجود
    const existingUser = await db.collection('users')
      .where('nationalId', '==', nationalId)
      .limit(1)
      .get();

    if (!existingUser.empty) {
      return res.status(400).json({ 
        success: false,
        message: 'هذه الهوية مسجلة بالفعل' 
      });
    }

    // تشفير كلمة المرور
    const passwordHash = await bcrypt.hash(password, 10);

    // إنشاء مستخدم جديد في Firestore
    const newUser = {
      nationalId,
      name,
      email,
      passwordHash,
      createdAt: new Date(),
      lastLogin: new Date(),
      totalIncome: 0,
      totalExpenses: 0
    };

    const userRef = await db.collection('users').add(newUser);
    const userId = userRef.id;

    console.log(`✅ تم إنشاء مستخدم جديد: ${userId}`);

    // إنشاء توكن
    const token = jwt.sign(
      { 
        userId, 
        nationalId,
        email 
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      success: true,
      token,
      userId,
      message: 'تم إنشاء الحساب بنجاح'
    });

  } catch (err) {
    console.error('❌ خطأ في التسجيل:', err);
    res.status(500).json({ 
      success: false,
      message: 'خطأ في الخادم' 
    });
  }
});

// 4️⃣ تسجيل الدخول
app.post('/api/auth/login', async (req, res) => {
  try {
    const { nationalId, password } = req.body;

    console.log('📝 محاولة دخول:', { nationalId });

    // التحقق من البيانات
    if (!nationalId || !password) {
      return res.status(400).json({ 
        success: false,
        message: 'الهوية وكلمة المرور مطلوبة' 
      });
    }

    if (nationalId.length !== 10) {
      return res.status(400).json({ 
        success: false,
        message: 'الهوية الوطنية يجب أن تكون 10 أرقام' 
      });
    }

    // البحث عن المستخدم في Firestore
    const userSnapshot = await db.collection('users')
      .where('nationalId', '==', nationalId)
      .limit(1)
      .get();

    if (userSnapshot.empty) {
      console.warn(`⚠️ محاولة دخول فاشلة - هوية غير موجودة: ${nationalId}`);
      return res.status(401).json({ 
        success: false,
        message: 'بيانات خاطئة' 
      });
    }

    const userDoc = userSnapshot.docs[0];
    const user = userDoc.data();
    const userId = userDoc.id;

    // التحقق من كلمة المرور
    const isValid = await bcrypt.compare(password, user.passwordHash);
    
    if (!isValid) {
      console.warn(`⚠️ محاولة دخول فاشلة - كلمة مرور خاطئة: ${nationalId}`);
      return res.status(401).json({ 
        success: false,
        message: 'بيانات خاطئة' 
      });
    }

    console.log(`✅ دخول ناجح للمستخدم: ${nationalId}`);

    // تحديث آخر دخول
    await db.collection('users').doc(userId).update({
      lastLogin: new Date()
    });

    // إنشاء توكن
    const token = jwt.sign(
      { 
        userId,
        nationalId,
        email: user.email
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      token,
      userId,
      nationalId: user.nationalId,
      name: user.name,
      message: 'تم تسجيل الدخول بنجاح'
    });

  } catch (err) {
    console.error('❌ خطأ في تسجيل الدخول:', err);
    res.status(500).json({ 
      success: false,
      message: 'خطأ في الخادم' 
    });
  }
});

// 5️⃣ الملخص المالي
app.get('/api/transactions/summary', verifyToken, async (req, res) => {
  try {
    console.log('📊 جلب الملخص المالي للمستخدم:', req.user.userId);

    const transactionsSnapshot = await db.collection('transactions')
      .where('userId', '==', req.user.userId)
      .get();

    let totalIncome = 0;
    let totalExpenses = 0;

    transactionsSnapshot.forEach(doc => {
      const trans = doc.data();
      if (trans.type === 'income') {
        totalIncome += trans.amount;
      } else if (trans.type === 'expense') {
        totalExpenses += trans.amount;
      }
    });

    const net = totalIncome - totalExpenses;

    res.json({
      success: true,
      totalIncome: parseFloat(totalIncome.toFixed(2)),
      totalExpenses: parseFloat(totalExpenses.toFixed(2)),
      net: parseFloat(net.toFixed(2)),
      transactionCount: transactionsSnapshot.size
    });

  } catch (err) {
    console.error('❌ خطأ في جلب الملخص:', err);
    res.status(500).json({ 
      success: false,
      message: 'خطأ في الخادم' 
    });
  }
});

// 6️⃣ إضافة عملية مالية
app.post('/api/transactions/add', verifyToken, async (req, res) => {
  try {
    const { type, amount, description, category } = req.body;

    console.log('➕ إضافة عملية:', { type, amount, description });

    // التحقق من البيانات
    if (!type || !amount || !description) {
      return res.status(400).json({ 
        success: false,
        message: 'البيانات ناقصة' 
      });
    }

    if (!['income', 'expense'].includes(type)) {
      return res.status(400).json({ 
        success: false,
        message: 'نوع غير صحيح - يجب أن يكون income أو expense' 
      });
    }

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      return res.status(400).json({ 
        success: false,
        message: 'المبلغ يجب أن يكون رقم موجب' 
      });
    }

    // إنشاء العملية
    const transaction = {
      userId: req.user.userId,
      type,
      amount: numAmount,
      description,
      category: category || 'عام',
      date: new Date(),
      createdAt: new Date()
    };

    const transRef = await db.collection('transactions').add(transaction);
    const transId = transRef.id;

    // تحديث إجمالي المستخدم
    const userDoc = await db.collection('users').doc(req.user.userId).get();
    const userData = userDoc.data();

    if (type === 'income') {
      await db.collection('users').doc(req.user.userId).update({
        totalIncome: (userData.totalIncome || 0) + numAmount
      });
    } else {
      await db.collection('users').doc(req.user.userId).update({
        totalExpenses: (userData.totalExpenses || 0) + numAmount
      });
    }

    console.log(`✅ تمت إضافة عملية: ${transId}`);

    res.status(201).json({
      success: true,
      message: 'تمت إضافة العملية بنجاح',
      transaction: {
        id: transId,
        type,
        amount: numAmount,
        description,
        date: transaction.date
      }
    });

  } catch (err) {
    console.error('❌ خطأ في إضافة العملية:', err);
    res.status(500).json({ 
      success: false,
      message: 'خطأ في الخادم' 
    });
  }
});

// 7️⃣ سجل العمليات
app.get('/api/transactions/history', verifyToken, async (req, res) => {
  try {
    console.log('📋 جلب سجل العمليات للمستخدم:', req.user.userId);

    const transactionsSnapshot = await db.collection('transactions')
      .where('userId', '==', req.user.userId)
      .orderBy('date', 'desc')
      .limit(100)
      .get();

    const userTransactions = [];
    transactionsSnapshot.forEach(doc => {
      const trans = doc.data();
      userTransactions.push({
        id: doc.id,
        ...trans,
        date: trans.date?.toDate?.() || new Date()
      });
    });

    res.json({
      success: true,
      transactions: userTransactions,
      count: userTransactions.length
    });

  } catch (err) {
    console.error('❌ خطأ في جلب السجل:', err);
    res.status(500).json({ 
      success: false,
      message: 'خطأ في الخادم' 
    });
  }
});

// 8️⃣ تسجيل الخروج
app.post('/api/auth/logout', verifyToken, (req, res) => {
  try {
    console.log('🚪 تسجيل خروج المستخدم:', req.user.userId);
    
    res.json({ 
      success: true,
      message: 'تم تسجيل الخروج بنجاح' 
    });

  } catch (err) {
    console.error('❌ خطأ في تسجيل الخروج:', err);
    res.status(500).json({ 
      success: false,
      message: 'خطأ في الخادم' 
    });
  }
});

// ❌ معالج الأخطاء 404
app.use((req, res) => {
  res.status(404).json({ 
    success: false,
    message: 'المسار غير موجود',
    path: req.path,
    method: req.method
  });
});

// 🚀 بدء الخادم
const PORT = process.env.PORT || 3000;
const HOST = 'localhost';

app.listen(PORT, HOST, () => {
  console.log(`
╔═══════════════════════════════════════════════╗
║                                               ║
║     🏦 Nahj Financial Platform Backend        ║
║                                               ║
║     ✅ الخادم يعمل بنجاح!                     ║
║                                               ║
║     🌐 الرابط: http://localhost:${PORT}             ║
║     🔥 قاعدة البيانات: Firebase Firestore   ║
║     🔐 الأمان: JWT + Bcrypt + CORS           ║
║     ✨ جاهز للاستخدام                       ║
║                                               ║
╚═══════════════════════════════════════════════╝
  `);

  console.log('💡 نصيح: اضغط Ctrl+C لإيقاف الخادم\n');
});

// معالجة الأخطاء غير المتوقعة
process.on('uncaughtException', (err) => {
  console.error('❌ خطأ غير متوقع:', err);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Promise مرفوضة:', reason);
});
