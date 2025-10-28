import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { Settings, Save, Database, Mail, Shield } from "lucide-react"

export function SettingsView() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Configuración</h1>
          <p className="text-muted-foreground">
            Gestiona la configuración de la plataforma
          </p>
        </div>
        <Button>
          <Save className="w-4 h-4 mr-2" />
          Guardar Cambios
        </Button>
      </div>

      {/* General Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Configuración General
          </CardTitle>
          <CardDescription>
            Configuración básica de la aplicación
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="app-name">Nombre de la Aplicación</Label>
              <Input id="app-name" defaultValue="Llanero" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="app-url">URL de la Aplicación</Label>
              <Input id="app-url" defaultValue="https://llanero.app" />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="app-description">Descripción</Label>
            <Input id="app-description" defaultValue="Plataforma administrativa moderna" />
          </div>
        </CardContent>
      </Card>

      {/* Database Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="w-5 h-5" />
            Base de Datos
          </CardTitle>
          <CardDescription>
            Configuración de Supabase y base de datos
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Backup Automático</Label>
              <p className="text-sm text-muted-foreground">
                Realizar backups automáticos diarios
              </p>
            </div>
            <Switch defaultChecked />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Logs de Auditoría</Label>
              <p className="text-sm text-muted-foreground">
                Registrar todas las acciones de usuarios
              </p>
            </div>
            <Switch defaultChecked />
          </div>
        </CardContent>
      </Card>

      {/* Email Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="w-5 h-5" />
            Configuración de Email
          </CardTitle>
          <CardDescription>
            Configuración del servicio de correo electrónico
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="smtp-host">Servidor SMTP</Label>
              <Input id="smtp-host" placeholder="smtp.gmail.com" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="smtp-port">Puerto</Label>
              <Input id="smtp-port" placeholder="587" />
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="smtp-user">Usuario</Label>
              <Input id="smtp-user" placeholder="tu@email.com" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="from-email">Email Remitente</Label>
              <Input id="from-email" placeholder="noreply@llanero.app" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Security Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Seguridad
          </CardTitle>
          <CardDescription>
            Configuración de seguridad y autenticación
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Autenticación de Dos Factores</Label>
              <p className="text-sm text-muted-foreground">
                Requerir 2FA para todos los usuarios admin
              </p>
            </div>
            <Switch />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Sesiones Múltiples</Label>
              <p className="text-sm text-muted-foreground">
                Permitir múltiples sesiones por usuario
              </p>
            </div>
            <Switch defaultChecked />
          </div>
          <Separator />
          <div className="space-y-2">
            <Label htmlFor="session-timeout">Tiempo de Sesión (minutos)</Label>
            <Input id="session-timeout" defaultValue="60" type="number" />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}