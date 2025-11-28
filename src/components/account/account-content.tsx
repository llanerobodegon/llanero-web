"use client"

import { useState, useEffect } from "react"
import { toast } from "sonner"
import { Loader2, User, Lock } from "lucide-react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { createClient } from "@/lib/supabase/client"

function AccountSkeleton() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-48" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </CardContent>
      </Card>
    </div>
  )
}

interface UserProfile {
  firstName: string
  lastName: string
  email: string
  phone: string
  phoneCode: string
}

export function AccountContent() {
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isChangingPassword, setIsChangingPassword] = useState(false)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    phoneCode: "0412",
  })
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  })

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (user) {
          const { data: userData } = await supabase
            .from("users")
            .select("first_name, last_name, email, phone, phone_code")
            .eq("id", user.id)
            .single()

          if (userData) {
            const profileData = {
              firstName: userData.first_name || "",
              lastName: userData.last_name || "",
              email: userData.email || user.email || "",
              phone: userData.phone || "",
              phoneCode: userData.phone_code || "0412",
            }
            setProfile(profileData)
            setFormData({
              firstName: profileData.firstName,
              lastName: profileData.lastName,
              phone: profileData.phone,
              phoneCode: profileData.phoneCode,
            })
          }
        }
      } catch (err) {
        console.error("Error fetching profile:", err)
        toast.error("Error al cargar el perfil")
      } finally {
        setIsLoading(false)
      }
    }

    fetchProfile()
  }, [])

  const handleSaveProfile = async () => {
    try {
      setIsSaving(true)
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        toast.error("No se encontró el usuario")
        return
      }

      const { error } = await supabase
        .from("users")
        .update({
          first_name: formData.firstName,
          last_name: formData.lastName,
          phone: formData.phone || null,
          phone_code: formData.phone ? formData.phoneCode : null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id)

      if (error) throw error

      setProfile((prev) => prev ? {
        ...prev,
        firstName: formData.firstName,
        lastName: formData.lastName,
        phone: formData.phone,
        phoneCode: formData.phoneCode,
      } : null)

      toast.success("Perfil actualizado")
    } catch (err) {
      console.error("Error updating profile:", err)
      toast.error("Error al actualizar el perfil")
    } finally {
      setIsSaving(false)
    }
  }

  const handleChangePassword = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error("Las contraseñas no coinciden")
      return
    }

    if (passwordData.newPassword.length < 6) {
      toast.error("La contraseña debe tener al menos 6 caracteres")
      return
    }

    try {
      setIsChangingPassword(true)
      const supabase = createClient()

      const { error } = await supabase.auth.updateUser({
        password: passwordData.newPassword,
      })

      if (error) throw error

      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      })
      toast.success("Contraseña actualizada")
    } catch (err) {
      console.error("Error changing password:", err)
      toast.error("Error al cambiar la contraseña")
    } finally {
      setIsChangingPassword(false)
    }
  }

  const hasProfileChanges = profile && (
    formData.firstName !== profile.firstName ||
    formData.lastName !== profile.lastName ||
    formData.phone !== profile.phone ||
    formData.phoneCode !== profile.phoneCode
  )

  const canChangePassword = passwordData.newPassword &&
    passwordData.confirmPassword &&
    passwordData.newPassword === passwordData.confirmPassword

  return (
    <div className="flex flex-1 flex-col gap-6 px-4 py-[50px] mx-auto w-full max-w-[800px]">
      {/* Title Section */}
      <div className="mb-2">
        <h1 className="text-2xl font-semibold">Configuración de cuenta</h1>
        <p className="text-sm text-muted-foreground">
          Administra tu información personal y seguridad
        </p>
      </div>

      {isLoading ? (
        <AccountSkeleton />
      ) : profile ? (
        <Tabs defaultValue="personal" className="w-full">
          <TabsList>
            <TabsTrigger value="personal" className="cursor-pointer">
              <User className="h-4 w-4 mr-2" />
              Información Personal
            </TabsTrigger>
            <TabsTrigger value="security" className="cursor-pointer">
              <Lock className="h-4 w-4 mr-2" />
              Seguridad
            </TabsTrigger>
          </TabsList>

          <TabsContent value="personal" className="mt-6">
            <Card>
              <CardContent className="pt-6 space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">Nombre</Label>
                    <Input
                      id="firstName"
                      value={formData.firstName}
                      onChange={(e) => setFormData((prev) => ({ ...prev, firstName: e.target.value }))}
                      placeholder="Tu nombre"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Apellido</Label>
                    <Input
                      id="lastName"
                      value={formData.lastName}
                      onChange={(e) => setFormData((prev) => ({ ...prev, lastName: e.target.value }))}
                      placeholder="Tu apellido"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Correo electrónico</Label>
                  <Input
                    id="email"
                    value={profile.email}
                    disabled
                    className="bg-muted"
                  />
                  <p className="text-xs text-muted-foreground">
                    El correo electrónico no se puede cambiar
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Teléfono</Label>
                  <div className="flex gap-2">
                    <select
                      value={formData.phoneCode}
                      onChange={(e) => setFormData((prev) => ({ ...prev, phoneCode: e.target.value }))}
                      className="flex h-9 w-24 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    >
                      <option value="0412">0412</option>
                      <option value="0414">0414</option>
                      <option value="0416">0416</option>
                      <option value="0422">0422</option>
                      <option value="0424">0424</option>
                      <option value="0426">0426</option>
                    </select>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => setFormData((prev) => ({ ...prev, phone: e.target.value }))}
                      placeholder="1234567"
                      className="flex-1"
                    />
                  </div>
                </div>

                {hasProfileChanges && (
                  <div className="flex justify-end gap-2 pt-2">
                    <Button
                      variant="outline"
                      onClick={() => setFormData({
                        firstName: profile.firstName,
                        lastName: profile.lastName,
                        phone: profile.phone,
                        phoneCode: profile.phoneCode,
                      })}
                      disabled={isSaving}
                    >
                      Cancelar
                    </Button>
                    <Button onClick={handleSaveProfile} disabled={isSaving}>
                      {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Guardar cambios
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="security" className="mt-6">
            <Card>
              <CardContent className="pt-6 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="newPassword">Nueva contraseña</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    value={passwordData.newPassword}
                    onChange={(e) => setPasswordData((prev) => ({ ...prev, newPassword: e.target.value }))}
                    placeholder="••••••••"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirmar contraseña</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={passwordData.confirmPassword}
                    onChange={(e) => setPasswordData((prev) => ({ ...prev, confirmPassword: e.target.value }))}
                    placeholder="••••••••"
                  />
                  {passwordData.newPassword && passwordData.confirmPassword &&
                   passwordData.newPassword !== passwordData.confirmPassword && (
                    <p className="text-xs text-destructive">Las contraseñas no coinciden</p>
                  )}
                </div>

                <div className="flex justify-end pt-2">
                  <Button
                    onClick={handleChangePassword}
                    disabled={!canChangePassword || isChangingPassword}
                  >
                    {isChangingPassword && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Cambiar contraseña
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      ) : null}
    </div>
  )
}
