"use client";

/**
 * DocuGob — Sign-in orchestration hook (AUDIT §5.3).
 *
 * Bundles every concern the sign-in form has into a single hook so the
 * page component is purely presentational:
 *   - react-hook-form setup with the Zod resolver
 *   - the `useLogin` mutation
 *   - toast on success / error
 *   - loading flag
 *
 * The page receives `{ register, errors, onHandleSubmit, loading }`
 * and renders the JSX. No business logic in the view.
 */

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { toast } from "@/components/ui/use-toast";
import { ApiError } from "@/lib/api/client";
import { useLogin } from "@/hooks/auth/use-auth";
import { signInSchema, type SignInValues } from "@/schemas/auth.schema";

export function useSignInForm() {
  const login = useLogin();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignInValues>({
    resolver: zodResolver(signInSchema),
    defaultValues: { email: "", password: "" },
    mode: "onChange",
  });

  const onHandleSubmit = handleSubmit(async (values) => {
    try {
      await login.mutateAsync(values);
      toast({ title: "Éxito", description: "Sesión iniciada" });
    } catch (err) {
      const message =
        err instanceof ApiError ? err.message : "No se pudo iniciar sesión";
      toast({ title: "Error", description: message, variant: "destructive" });
    }
  });

  return {
    register,
    errors,
    onHandleSubmit,
    loading: isSubmitting || login.isPending,
  };
}
