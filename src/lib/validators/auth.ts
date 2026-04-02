/**
 * Auth Validators — shared Zod schemas for auth forms.
 * Used by both client-side form validation and server-side validation.
 */

import { z } from "zod";

export const loginSchema = z.object({
  email: z
    .string()
    .min(1, "L'email è obbligatoria")
    .email("Inserisci un indirizzo email valido"),
  password: z.string().min(1, "La password è obbligatoria"),
});

export type LoginInput = z.infer<typeof loginSchema>;

export const registerSchema = z
  .object({
    name: z
      .string()
      .min(2, "Il nome deve avere almeno 2 caratteri")
      .max(100, "Il nome non può superare 100 caratteri"),
    email: z
      .string()
      .min(1, "L'email è obbligatoria")
      .email("Inserisci un indirizzo email valido"),
    password: z
      .string()
      .min(12, "La password deve avere almeno 12 caratteri")
      .regex(/[A-Z]/, "La password deve contenere almeno una lettera maiuscola")
      .regex(/[0-9]/, "La password deve contenere almeno un numero")
      .regex(/[^A-Za-z0-9]/, "La password deve contenere almeno un carattere speciale"),
    confirmPassword: z.string().min(1, "Conferma la password"),
    privacyPolicy: z.literal(true, {
      errorMap: () => ({ message: "Devi accettare l'Informativa sulla Privacy" }),
    }),
    ageConfirmation: z.literal(true, {
      errorMap: () => ({ message: "Devi dichiarare di avere almeno 16 anni" }),
    }),
    marketingConsent: z.boolean().default(false),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Le password non coincidono",
    path: ["confirmPassword"],
  });

export type RegisterInput = z.infer<typeof registerSchema>;

export const forgotPasswordSchema = z.object({
  email: z
    .string()
    .min(1, "L'email è obbligatoria")
    .email("Inserisci un indirizzo email valido"),
});

export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;

export const resetPasswordSchema = z
  .object({
    token: z.string().min(1, "Token mancante"),
    password: z
      .string()
      .min(12, "La password deve avere almeno 12 caratteri")
      .regex(/[A-Z]/, "La password deve contenere almeno una lettera maiuscola")
      .regex(/[0-9]/, "La password deve contenere almeno un numero")
      .regex(/[^A-Za-z0-9]/, "La password deve contenere almeno un carattere speciale"),
    confirmPassword: z.string().min(1, "Conferma la password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Le password non coincidono",
    path: ["confirmPassword"],
  });

export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
