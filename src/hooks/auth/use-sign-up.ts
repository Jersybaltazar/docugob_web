"use client";

/**
 * DocuGob — Sign-up orchestration hook (AUDIT §5.3).
 *
 * Same shape as `useSignInForm` — encapsulates the form, the
 * `useRegister` mutation, and the toast feedback so the page is pure
 * JSX.
 */

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { toast } from "@/components/ui/use-toast";
import { ApiError } from "@/lib/api/client";
import { useRegister } from "@/hooks/auth/use-auth";
import { signUpSchema, type SignUpValues } from "@/schemas/auth.schema";

export function useSignUpForm() {
  const register_ = useRegister();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignUpValues>({
    resolver: zodResolver(signUpSchema),
    defaultValues: { full_name: "", tenant_name: "", email: "", password: "" },
    mode: "onChange",
  });

  const onHandleSubmit = handleSubmit(async (values) => {
    try {
      await register_.mutateAsync(values);
      toast({
        title: "Éxito",
        description: "Cuenta creada — bienvenido a DocuGob",
      });
    } catch (err) {
      const message =
        err instanceof ApiError ? err.message : "No se pudo crear la cuenta";
      toast({ title: "Error", description: message, variant: "destructive" });
    }
  });

  return {
    register,
    errors,
    onHandleSubmit,
    loading: isSubmitting || register_.isPending,
  };
}
