import {
  Timestamp,
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore';
import { db } from './firebase';
import { Budget, Transaction, TransactionType, UserProfile } from '@/types';

export async function upsertUserProfile(userId: string, profile: Omit<UserProfile, 'createdAt' | 'updatedAt'>): Promise<void> {
  const ref = doc(db, 'users', userId, 'meta', 'profile');
  await setDoc(
    ref,
    {
      ...profile,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    },
    { merge: true },
  );
}

export function subscribeUserProfile(userId: string, onData: (profile: UserProfile | null) => void): () => void {
  const ref = doc(db, 'users', userId, 'meta', 'profile');
  return onSnapshot(ref, (snap) => {
    if (!snap.exists()) {
      onData(null);
      return;
    }
    const data = snap.data();
    onData({
      name: data.name,
      email: data.email,
      phone: data.phone,
      plan: data.plan,
      createdAt: data.createdAt?.toDate?.() ?? new Date(),
      updatedAt: data.updatedAt?.toDate?.() ?? new Date(),
    });
  });
}

export async function addTransaction(userId: string, payload: { type: TransactionType; amount: number; category: string; description: string }): Promise<void> {
  await addDoc(collection(db, 'transactions', userId, 'items'), {
    ...payload,
    date: Timestamp.now(),
    createdAt: Timestamp.now(),
  });
}

export async function editTransaction(
  userId: string,
  transactionId: string,
  payload: { type: TransactionType; amount: number; category: string; description: string },
): Promise<void> {
  const ref = doc(db, 'transactions', userId, 'items', transactionId);
  await updateDoc(ref, payload);
}

export async function removeTransaction(userId: string, transactionId: string): Promise<void> {
  await deleteDoc(doc(db, 'transactions', userId, 'items', transactionId));
}

export function subscribeTransactions(userId: string, onData: (transactions: Transaction[]) => void): () => void {
  const q = query(collection(db, 'transactions', userId, 'items'), orderBy('date', 'desc'));

  return onSnapshot(q, (snapshot) => {
    const transactions: Transaction[] = snapshot.docs.map((item) => {
      const data = item.data();
      return {
        id: item.id,
        type: data.type,
        amount: data.amount,
        category: data.category,
        description: data.description,
        date: data.date?.toDate?.() ?? new Date(),
        createdAt: data.createdAt?.toDate?.() ?? new Date(),
      };
    });
    onData(transactions);
  });
}

export async function addBudget(userId: string, payload: Omit<Budget, 'id' | 'createdAt' | 'spent'>): Promise<void> {
  await addDoc(collection(db, 'budgets', userId, 'items'), {
    ...payload,
    spent: 0,
    createdAt: Timestamp.now(),
  });
}

export function subscribeBudgets(userId: string, month: string, onData: (budgets: Budget[]) => void): () => void {
  const q = query(collection(db, 'budgets', userId, 'items'), where('month', '==', month));
  return onSnapshot(q, (snapshot) => {
    const budgets: Budget[] = snapshot.docs.map((item) => {
      const data = item.data();
      return {
        id: item.id,
        category: data.category,
        limit: data.limit,
        spent: data.spent,
        month: data.month,
        createdAt: data.createdAt?.toDate?.() ?? new Date(),
      };
    });
    onData(budgets);
  });
}
