"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Eye, EyeOff, ShieldAlert } from "lucide-react";
import { cn } from "@/lib/utils";
import { useMediaQuery } from "@/hooks/use-media-query";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import {
  Field,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { useLoginViewModel } from "@/src/viewmodels/useLoginViewModel";

type RecoveryStep = "email" | "otp" | "password";

function RecoveryForm({
  className,
  recoveryEmail,
  setRecoveryEmail,
  step,
  otp,
  setOtp,
  newPassword,
  setNewPassword,
  confirmPassword,
  setConfirmPassword,
  onSendCode,
  onVerifyCode,
  onUpdatePassword,
  onResendCode,
  isLoading,
  resendCountdown,
}: {
  className?: string;
  recoveryEmail: string;
  setRecoveryEmail: (value: string) => void;
  step: RecoveryStep;
  otp: string;
  setOtp: (value: string) => void;
  newPassword: string;
  setNewPassword: (value: string) => void;
  confirmPassword: string;
  setConfirmPassword: (value: string) => void;
  onSendCode: (e: React.FormEvent) => void;
  onVerifyCode: (e: React.FormEvent) => void;
  onUpdatePassword: (e: React.FormEvent) => void;
  onResendCode: () => void;
  isLoading: boolean;
  resendCountdown: number;
}) {
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  if (step === "password") {
    const passwordsMatch = newPassword === confirmPassword;
    const isValidPassword = newPassword.length >= 8;

    return (
      <form onSubmit={onUpdatePassword} className={cn("grid items-start gap-4", className)}>
        <Field>
          <FieldLabel htmlFor="new-password">Nueva contraseña</FieldLabel>
          <div className="relative">
            <Input
              id="new-password"
              type={showNewPassword ? "text" : "password"}
              placeholder="Mínimo 8 caracteres"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              disabled={isLoading}
            />
            <button
              type="button"
              onClick={() => setShowNewPassword(!showNewPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
            >
              {showNewPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>
        </Field>
        <Field>
          <FieldLabel htmlFor="confirm-password">Confirmar contraseña</FieldLabel>
          <div className="relative">
            <Input
              id="confirm-password"
              type={showConfirmPassword ? "text" : "password"}
              placeholder="Repite tu contraseña"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              disabled={isLoading}
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
            >
              {showConfirmPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>
          {confirmPassword && !passwordsMatch && (
            <p className="text-sm text-destructive mt-1">Las contraseñas no coinciden</p>
          )}
        </Field>
        <Button type="submit" disabled={!isValidPassword || !passwordsMatch || isLoading}>
          {isLoading ? "Actualizando..." : "Actualizar contraseña"}
        </Button>
      </form>
    );
  }

  if (step === "otp") {
    return (
      <form onSubmit={onVerifyCode} className={cn("grid items-start gap-4", className)}>
        <p className="text-sm text-muted-foreground text-center">
          Código enviado a <span className="font-semibold text-foreground">{recoveryEmail}</span>
        </p>
        <div className="flex justify-center">
          <InputOTP
            maxLength={6}
            value={otp}
            onChange={setOtp}
          >
            <InputOTPGroup>
              <InputOTPSlot index={0} />
              <InputOTPSlot index={1} />
              <InputOTPSlot index={2} />
            </InputOTPGroup>
            <InputOTPSeparator />
            <InputOTPGroup>
              <InputOTPSlot index={3} />
              <InputOTPSlot index={4} />
              <InputOTPSlot index={5} />
            </InputOTPGroup>
          </InputOTP>
        </div>
        <Button type="submit" disabled={otp.length !== 6 || isLoading}>
          {isLoading ? "Verificando..." : "Verificar código"}
        </Button>
        <p className="text-sm text-center text-muted-foreground">
          {resendCountdown > 0 ? (
            <>Reenviar código en <span className="font-semibold">{resendCountdown}s</span></>
          ) : (
            <span
              onClick={onResendCode}
              className="text-primary hover:underline cursor-pointer"
            >
              Reenviar código
            </span>
          )}
        </p>
      </form>
    );
  }

  return (
    <form onSubmit={onSendCode} className={cn("grid items-start gap-4", className)}>
      <Field>
        <FieldLabel htmlFor="recovery-email">Correo electrónico</FieldLabel>
        <Input
          id="recovery-email"
          type="email"
          placeholder="correo@ejemplo.com"
          value={recoveryEmail}
          onChange={(e) => setRecoveryEmail(e.target.value)}
          required
          disabled={isLoading}
        />
      </Field>
      <Button type="submit" disabled={isLoading}>
        {isLoading ? "Enviando..." : "Enviar código"}
      </Button>
    </form>
  );
}

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const searchParams = useSearchParams();
  const unauthorizedError = searchParams.get("error") === "unauthorized";
  const { isLoading, error, login } = useLoginViewModel();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [recoveryEmail, setRecoveryEmail] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [recoveryStep, setRecoveryStep] = useState<RecoveryStep>("email");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isRecoveryLoading, setIsRecoveryLoading] = useState(false);
  const [resendCountdown, setResendCountdown] = useState(0);
  const isDesktop = useMediaQuery("(min-width: 768px)");

  useEffect(() => {
    if (resendCountdown > 0) {
      const timer = setTimeout(() => setResendCountdown(resendCountdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCountdown]);

  const startResendCountdown = () => {
    setResendCountdown(60);
  };

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsRecoveryLoading(true);
    // TODO: Implement code sending logic
    console.log("Send code to:", recoveryEmail);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIsRecoveryLoading(false);
    setRecoveryStep("otp");
    startResendCountdown();
  };

  const handleResendCode = async () => {
    setIsRecoveryLoading(true);
    // TODO: Implement code resending logic
    console.log("Resend code to:", recoveryEmail);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIsRecoveryLoading(false);
    startResendCountdown();
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsRecoveryLoading(true);
    // TODO: Implement code verification logic
    console.log("Verify code:", otp);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIsRecoveryLoading(false);
    setRecoveryStep("password");
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsRecoveryLoading(true);
    // TODO: Implement password update logic
    console.log("Update password for:", recoveryEmail);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIsRecoveryLoading(false);
    setIsOpen(false);
    resetRecoveryForm();
  };

  const resetRecoveryForm = () => {
    setRecoveryEmail("");
    setRecoveryStep("email");
    setOtp("");
    setNewPassword("");
    setConfirmPassword("");
    setResendCountdown(0);
  };

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      resetRecoveryForm();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await login({ email, password });
  };

  const RecoveryTrigger = (
    <span className="ml-auto text-sm underline-offset-4 hover:underline cursor-pointer">
      ¿Olvidaste tu contraseña?
    </span>
  );

  const recoveryTitle = {
    email: "Recuperar contraseña",
    otp: "Verificar código",
    password: "Nueva contraseña",
  }[recoveryStep];

  const recoveryDescription = {
    email: "Ingresa tu correo electrónico y te enviaremos un código de verificación.",
    otp: "Ingresa el código que enviamos a tu correo electrónico.",
    password: "Ingresa tu nueva contraseña.",
  }[recoveryStep];

  const RecoveryDialog = isDesktop ? (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{RecoveryTrigger}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{recoveryTitle}</DialogTitle>
          <DialogDescription>{recoveryDescription}</DialogDescription>
        </DialogHeader>
        <RecoveryForm
          recoveryEmail={recoveryEmail}
          setRecoveryEmail={setRecoveryEmail}
          step={recoveryStep}
          otp={otp}
          setOtp={setOtp}
          newPassword={newPassword}
          setNewPassword={setNewPassword}
          confirmPassword={confirmPassword}
          setConfirmPassword={setConfirmPassword}
          onSendCode={handleSendCode}
          onVerifyCode={handleVerifyCode}
          onUpdatePassword={handleUpdatePassword}
          onResendCode={handleResendCode}
          isLoading={isRecoveryLoading}
          resendCountdown={resendCountdown}
        />
      </DialogContent>
    </Dialog>
  ) : (
    <Drawer open={isOpen} onOpenChange={handleOpenChange}>
      <DrawerTrigger asChild>{RecoveryTrigger}</DrawerTrigger>
      <DrawerContent>
        <div className="mx-auto w-full max-w-sm">
          <DrawerHeader className="text-left">
            <DrawerTitle>{recoveryTitle}</DrawerTitle>
            <DrawerDescription>{recoveryDescription}</DrawerDescription>
          </DrawerHeader>
          <RecoveryForm
            className="px-4"
            recoveryEmail={recoveryEmail}
            setRecoveryEmail={setRecoveryEmail}
            step={recoveryStep}
            otp={otp}
            setOtp={setOtp}
            newPassword={newPassword}
            setNewPassword={setNewPassword}
            confirmPassword={confirmPassword}
            setConfirmPassword={setConfirmPassword}
            onSendCode={handleSendCode}
            onVerifyCode={handleVerifyCode}
            onUpdatePassword={handleUpdatePassword}
            onResendCode={handleResendCode}
            isLoading={isRecoveryLoading}
            resendCountdown={resendCountdown}
          />
          <DrawerFooter className="pt-2">
            <DrawerClose asChild>
              <Button variant="outline">Cancelar</Button>
            </DrawerClose>
          </DrawerFooter>
        </div>
      </DrawerContent>
    </Drawer>
  );

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-xl">Bienvenido a Llanero Admin</CardTitle>
          <CardDescription>
            Ingresa con tu correo y contraseña
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <FieldGroup>
              {(error || unauthorizedError) && (
                <div className="flex items-center gap-2 text-sm text-destructive text-center p-3 bg-destructive/10 rounded-md">
                  <ShieldAlert className="size-4 shrink-0" />
                  <span>{error || "No tienes permisos para acceder al panel de administración"}</span>
                </div>
              )}
              <Field>
                <FieldLabel htmlFor="email">Correo electrónico</FieldLabel>
                <Input
                  id="email"
                  type="email"
                  placeholder="correo@ejemplo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={isLoading}
                />
              </Field>
              <Field>
                <div className="flex items-center">
                  <FieldLabel htmlFor="password">Contraseña</FieldLabel>
                  {RecoveryDialog}
                </div>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
              </Field>
              <Field>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? "Ingresando..." : "Ingresar"}
                </Button>
              </Field>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
