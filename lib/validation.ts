import { z } from 'zod';

// User validation schemas
export const CreateUserSchema = z.object({
  name: z
    .string()
    .min(2, 'الاسم يجب أن يكون على الأقل حرفين')
    .max(100, 'الاسم يجب ألا يتجاوز 100 حرف')
    // Unicode blocks: Arabic (0600–06FF), Arabic Supplement (0750–077F),
    // Arabic Extended-A (08A0–08FF), Arabic Presentation Forms-A (FB50–FDFF),
    // Arabic Presentation Forms-B (FE70–FEFF), plus whitespace/word chars/dots/dashes
    .regex(/^[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDCF\uFDF0-\uFDFF\uFE70-\uFEFF\s\w.-]+$/, 'الاسم يحتوي على أحرف غير مسموح بها'),
  email: z
    .string()
    .email('البريد الإلكتروني غير صحيح')
    .max(254, 'البريد الإلكتروني طويل جداً')
    .toLowerCase(),
  password: z
    .string()
    .min(8, 'كلمة المرور يجب أن تكون 8 أحرف على الأقل')
    .max(128, 'كلمة المرور طويلة جداً')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      'كلمة المرور يجب أن تحتوي على حرف كبير وحرف صغير ورقم'
    ),
  phone: z
    .string()
    .regex(/^(\+966|0)5[0-9]{8}$/, 'رقم الجوال السعودي غير صحيح (مثال: 0512345678)')
    .optional(),
  nationalId: z
    .string()
    .regex(/^[12][0-9]{9}$/, 'رقم الهوية الوطنية غير صحيح')
    .optional(),
  consent: z.boolean().refine((val) => val === true, {
    message: 'يجب الموافقة على سياسة الخصوصية (PDPL)',
  }),
});

export const UpdateUserSchema = CreateUserSchema.partial().omit({ consent: true });

// Transaction validation schemas
export const CreateTransactionSchema = z.object({
  type: z.enum(['credit', 'debit'], {
    errorMap: () => ({ message: 'نوع المعاملة يجب أن يكون credit أو debit' }),
  }),
  amount: z
    .number()
    .positive('المبلغ يجب أن يكون موجباً')
    .max(10_000_000, 'المبلغ يتجاوز الحد المسموح')
    .multipleOf(0.01, 'المبلغ يجب أن يكون بـ هللتين كحد أقصى'),
  description: z
    .string()
    .min(2, 'وصف المعاملة يجب أن يكون على الأقل حرفين')
    .max(500, 'وصف المعاملة طويل جداً'),
  category: z
    .string()
    .min(1, 'الفئة مطلوبة')
    .max(50, 'اسم الفئة طويل جداً'),
  currency: z
    .string()
    .length(3, 'رمز العملة يجب أن يكون 3 أحرف')
    .default('SAR'),
  referenceNumber: z
    .string()
    .max(50, 'رقم المرجع طويل جداً')
    .optional(),
});

export const QuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

// Sanitize string to prevent XSS
export function sanitizeString(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

// Validate and parse request body
export async function parseRequestBody<S extends z.ZodTypeAny>(
  request: Request,
  schema: S
): Promise<{ data: z.output<S>; error: null } | { data: null; error: string }> {
  try {
    const body = await request.json();
    const result = schema.safeParse(body);

    if (!result.success) {
      const errors = result.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join(', ');
      return { data: null, error: errors };
    }

    return { data: result.data, error: null };
  } catch {
    return { data: null, error: 'طلب غير صحيح - تأكد من صحة JSON' };
  }
}

// Validate query parameters
export function parseQueryParams<S extends z.ZodTypeAny>(
  searchParams: URLSearchParams,
  schema: S
): { data: z.output<S>; error: null } | { data: null; error: string } {
  const params = Object.fromEntries(searchParams.entries());
  const result = schema.safeParse(params);

  if (!result.success) {
    const errors = result.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join(', ');
    return { data: null, error: errors };
  }

  return { data: result.data, error: null };
}

export type CreateUserInput = z.infer<typeof CreateUserSchema>;
export type UpdateUserInput = z.infer<typeof UpdateUserSchema>;
export type CreateTransactionInput = z.infer<typeof CreateTransactionSchema>;
export type QueryInput = z.infer<typeof QuerySchema>;
