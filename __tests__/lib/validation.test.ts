import { CreateUserSchema, CreateTransactionSchema, QuerySchema } from '@/lib/validation';

describe('CreateUserSchema', () => {
  const validUser = {
    name: 'محمد علي',
    email: 'test@example.com',
    password: 'Password1',
    consent: true,
  };

  it('accepts a valid user object', () => {
    const result = CreateUserSchema.safeParse(validUser);
    expect(result.success).toBe(true);
  });

  it('lowercases email', () => {
    const result = CreateUserSchema.safeParse({ ...validUser, email: 'TEST@EXAMPLE.COM' });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.email).toBe('test@example.com');
  });

  it('rejects an invalid email', () => {
    const result = CreateUserSchema.safeParse({ ...validUser, email: 'not-an-email' });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toContain('البريد الإلكتروني');
    }
  });

  it('rejects a missing name', () => {
    const result = CreateUserSchema.safeParse({ ...validUser, name: undefined });
    expect(result.success).toBe(false);
  });

  it('rejects a short password', () => {
    const result = CreateUserSchema.safeParse({ ...validUser, password: 'abc' });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toContain('كلمة المرور');
    }
  });

  it('rejects a password without uppercase', () => {
    const result = CreateUserSchema.safeParse({ ...validUser, password: 'password1' });
    expect(result.success).toBe(false);
  });

  it('rejects a password without digits', () => {
    const result = CreateUserSchema.safeParse({ ...validUser, password: 'PasswordOnly' });
    expect(result.success).toBe(false);
  });

  it('rejects consent = false with Arabic message', () => {
    const result = CreateUserSchema.safeParse({ ...validUser, consent: false });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toContain('PDPL');
    }
  });

  it('rejects an invalid Saudi phone number', () => {
    const result = CreateUserSchema.safeParse({ ...validUser, phone: '12345678' });
    expect(result.success).toBe(false);
  });

  it('accepts a valid Saudi phone number', () => {
    const result = CreateUserSchema.safeParse({ ...validUser, phone: '0512345678' });
    expect(result.success).toBe(true);
  });

  it('accepts a valid nationalId', () => {
    const result = CreateUserSchema.safeParse({ ...validUser, nationalId: '1234567890' });
    expect(result.success).toBe(true);
  });

  it('rejects an invalid nationalId (wrong prefix)', () => {
    const result = CreateUserSchema.safeParse({ ...validUser, nationalId: '3234567890' });
    expect(result.success).toBe(false);
  });
});

describe('CreateTransactionSchema', () => {
  const validTransaction = {
    type: 'credit' as const,
    amount: 100.5,
    description: 'راتب شهري',
    category: 'دخل',
  };

  it('accepts a valid transaction', () => {
    const result = CreateTransactionSchema.safeParse(validTransaction);
    expect(result.success).toBe(true);
  });

  it('defaults currency to SAR', () => {
    const result = CreateTransactionSchema.safeParse(validTransaction);
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.currency).toBe('SAR');
  });

  it('rejects an invalid type', () => {
    const result = CreateTransactionSchema.safeParse({ ...validTransaction, type: 'transfer' });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toContain('credit');
    }
  });

  it('rejects amount ≤ 0', () => {
    const result = CreateTransactionSchema.safeParse({ ...validTransaction, amount: 0 });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toContain('موجباً');
    }
  });

  it('rejects negative amounts', () => {
    const result = CreateTransactionSchema.safeParse({ ...validTransaction, amount: -50 });
    expect(result.success).toBe(false);
  });

  it('rejects amount above max', () => {
    const result = CreateTransactionSchema.safeParse({ ...validTransaction, amount: 10_000_001 });
    expect(result.success).toBe(false);
  });

  it('accepts an optional referenceNumber', () => {
    const result = CreateTransactionSchema.safeParse({
      ...validTransaction,
      referenceNumber: 'REF-12345',
    });
    expect(result.success).toBe(true);
  });
});

describe('QuerySchema', () => {
  it('uses defaults when no params supplied', () => {
    const result = QuerySchema.safeParse({});
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.page).toBe(1);
      expect(result.data.limit).toBe(20);
      expect(result.data.sortOrder).toBe('desc');
    }
  });

  it('coerces string numbers', () => {
    const result = QuerySchema.safeParse({ page: '2', limit: '50' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.page).toBe(2);
      expect(result.data.limit).toBe(50);
    }
  });

  it('rejects limit > 100', () => {
    const result = QuerySchema.safeParse({ limit: '200' });
    expect(result.success).toBe(false);
  });
});
