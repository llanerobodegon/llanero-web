"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LoginCredentials } from "@/src/models/user.model";
import { authService } from "@/src/services/auth.service";

export function useLoginViewModel() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const login = async (credentials: LoginCredentials) => {
    setIsLoading(true);
    setError(null);

    try {
      await authService.login(credentials);
      router.push("/admin");
      router.refresh();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Error al iniciar sesión";
      // Translate common Supabase error messages to Spanish
      if (message.includes("Invalid login credentials")) {
        setError("Credenciales inválidas");
      } else if (message.includes("Email not confirmed")) {
        setError("Email no confirmado");
      } else {
        setError(message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const resetPassword = async (email: string) => {
    setIsLoading(true);
    setError(null);

    try {
      await authService.resetPassword(email);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Error al enviar email";
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const clearError = () => setError(null);

  return {
    isLoading,
    error,
    login,
    resetPassword,
    clearError,
  };
}
