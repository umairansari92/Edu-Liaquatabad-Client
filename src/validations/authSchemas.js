import { z } from 'zod';

// ─── Reusable Primitives ───────────────────────────────────────────────────────

/**
 * Blocks script injection, HTML tags, MongoDB operators, and common XSS vectors.
 * Applied to all freeform text inputs before submission.
 */
const SCRIPT_INJECTION_REGEX = /<[^>]*>|javascript:|on\w+\s*=|\$where|\$expr/i;
const SPECIAL_CHARS_STRICT_REGEX = /[<>{}()\[\]\\\/]/;

const safeString = (maxLen = 200, minLen = 0, minMsg = '') => {
  let schema = z.string().trim().max(maxLen, `Must be ${maxLen} characters or fewer`);
  if (minLen > 0) {
    schema = schema.min(minLen, minMsg || `Must be at least ${minLen} characters`);
  }
  return schema.refine((val) => !SCRIPT_INJECTION_REGEX.test(val), {
    message: 'Input contains disallowed characters or code patterns.',
  });
};

const nameField = (label = 'Name') =>
  z
    .string()
    .trim()
    .min(2, `${label} must be at least 2 characters`)
    .max(100, `${label} must be 100 characters or fewer`)
    .refine((val) => !SCRIPT_INJECTION_REGEX.test(val), {
      message: 'Input contains disallowed characters or code patterns.',
    })
    .refine((val) => !SPECIAL_CHARS_STRICT_REGEX.test(val), {
      message: `${label} must not contain special characters.`,
    });

export const emailField = z
  .string()
  .trim()
  .toLowerCase()
  .min(5, 'Email is required')
  .max(254, 'Email address is too long')
  .email('Please enter a valid email address')
  .refine((val) => !SCRIPT_INJECTION_REGEX.test(val), {
    message: 'Email contains disallowed patterns.',
  });

export const passwordField = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(128, 'Password is too long')
  .refine((val) => /[A-Z]/.test(val), { message: 'Must contain at least one uppercase letter.' })
  .refine((val) => /[0-9]/.test(val), { message: 'Must contain at least one number.' })
  .refine((val) => !SCRIPT_INJECTION_REGEX.test(val), { message: 'Password contains disallowed patterns.' });

const phoneField = z
  .string()
  .trim()
  .regex(/^(\+92|0)?[3][0-9]{9}$/, 'Enter a valid Pakistani mobile number (e.g. 03001234567)')
  .max(15, 'Phone number too long');

export const otpField = z
  .string()
  .trim()
  .regex(/^\d{6}$/, 'OTP must be exactly 6 digits');

const rollNumberField = z
  .string()
  .trim()
  .min(1, 'Roll number is required')
  .max(20, 'Roll number is too long')
  .regex(/^[A-Za-z0-9\-\/]+$/, 'Roll number may only contain letters, numbers, hyphens, or slashes');

export const loginIdentifierField = z
  .string()
  .trim()
  .min(1, 'Email or GR Number is required')
  .max(254, 'Identifier is too long')
  .refine((val) => !SCRIPT_INJECTION_REGEX.test(val), {
    message: 'Disallowed characters detected.',
  });

export const grNumberField = z
  .string()
  .trim()
  .min(1, 'GR Number is required')
  .max(30, 'GR Number is too long')
  .regex(/^[A-Za-z0-9\-\/]+$/, 'GR Number may only contain letters, numbers, hyphens, or slashes')
  .refine((val) => !SCRIPT_INJECTION_REGEX.test(val), { message: 'Disallowed characters.' });

// ─── Auth Schemas (mirrors server-side validation exactly) ────────────────────

/** Login form schema */
export const loginSchema = z.object({
  email: loginIdentifierField,
  password: z.string().min(1, 'Password is required').max(128, 'Password is too long'),
  captchaAnswer: z.union([z.string(), z.number()]).optional(),
  captchaChallengeToken: z.string().optional(),
  _gotcha: z.string().optional(),
});

/** Send OTP form schema */
export const sendOtpSchema = z.object({
  email: emailField,
  purpose: z.enum(['REGISTRATION', 'PASSWORD_RESET', 'MFA_LOGIN', 'SENSITIVE_ACTION']),
});

/** Verify OTP form schema */
export const verifyOtpSchema = z.object({
  email: emailField,
  otpCode: otpField,
  purpose: z.enum(['REGISTRATION', 'PASSWORD_RESET', 'MFA_LOGIN', 'SENSITIVE_ACTION']),
});

/** Student registration schema: Simple account creation with GR Number */
export const studentRegistrationSchema = z
  .object({
    fullName: nameField('Student Name'),
    fatherOrGuardianName: nameField('Father / Guardian Name'),
    schoolId: z.string().trim().min(1, 'Please select your School'),
    grNumber: grNumberField,
    password: passwordField,
    confirmPassword: z.string().min(1, 'Please re-type your account password'),
    _gotcha: z.string().optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match.',
    path: ['confirmPassword'],
  });

export const studentFormSchema = studentRegistrationSchema;
export const registerStudentSchema = studentRegistrationSchema;

/** Teacher registration initial form schema (pre-OTP validation) */
export const teacherFormSchema = z.object({
  fullName: nameField('Full Name'),
  email: emailField,
  password: passwordField,
  phoneNumber: phoneField,
  designation: safeString(100, 2, 'Designation is required'),
  qualification: safeString(100, 2, 'Qualification is required'),
  schoolId: z.string().optional(),
});

/** Teacher registration full schema (with OTP) */
export const registerTeacherSchema = teacherFormSchema.extend({
  otpCode: otpField,
  captchaAnswer: z.string().optional(),
  captchaChallengeToken: z.string().optional(),
  _gotcha: z.string().optional(),
});

/** Password reset request (forgot password step 1) */
export const passwordResetRequestSchema = z.object({
  email: emailField,
});

/** Password reset confirm (forgot password step 2) */
export const passwordResetConfirmSchema = z
  .object({
    email: emailField,
    otpCode: otpField,
    newPassword: passwordField,
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Passwords do not match.',
    path: ['confirmPassword'],
  });
