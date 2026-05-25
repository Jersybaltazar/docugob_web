/**
 * DocuGob — Auth schemas.
 *
 * Single source of truth for sign-in / sign-up validation. Both the
 * client form (`react-hook-form` + `zodResolver`) and any future server
 * proxy consume these schemas, keeping the rules aligned.
 *
 * Password policy mirrors AUDIT §10.6: minimum length plus four
 * character-class requirements (upper, lower, digit, symbol). The
 * messages are in Spanish since the user base is bilingual but reads
 * Spanish in the product.
 */

import { z } from "zod";

const PASSWORD_MIN_LENGTH = 8;
const NAME_MAX_LENGTH = 255;

/**
 * Strong password schema. Returned as a standalone export so we can
 * reuse it in the future password-reset flow without duplicating rules.
 */
export const passwordSchema = z
  .string()
  .min(PASSWORD_MIN_LENGTH, `Mínimo ${PASSWORD_MIN_LENGTH} caracteres`)
  .refine((v) => /[A-Z]/.test(v), "Debe incluir una mayúscula")
  .refine((v) => /[a-z]/.test(v), "Debe incluir una minúscula")
  .refine((v) => /\d/.test(v), "Debe incluir un dígito")
  .refine((v) => /[^A-Za-z0-9]/.test(v), "Debe incluir un símbolo");

export const signInSchema = z.object({
  email: z.string().email("Correo electrónico inválido"),
  // Sign-in only checks presence + min length; full validation already
  // happened at sign-up. Avoids confusing the user by reporting "weak
  // password" on an account they created before the policy tightened.
  password: z.string().min(1, "Ingresa tu contraseña"),
});
export type SignInValues = z.infer<typeof signInSchema>;

export const signUpSchema = z.object({
  full_name: z
    .string()
    .min(2, "Ingresa tu nombre completo")
    .max(NAME_MAX_LENGTH, "Demasiado largo"),
  tenant_name: z
    .string()
    .min(2, "Ingresa el nombre de tu entidad")
    .max(NAME_MAX_LENGTH, "Demasiado largo"),
  email: z.string().email("Correo electrónico inválido"),
  password: passwordSchema,
});
export type SignUpValues = z.infer<typeof signUpSchema>;
