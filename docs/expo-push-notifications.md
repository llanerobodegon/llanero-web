# Push Notifications — React Native / Expo

## Resumen

El backend ya está configurado. Las Edge Functions envían push notifications via **Expo Push API** usando el `push_token` almacenado en la tabla `users`. Esta guía explica cómo configurar el proyecto de React Native para:

1. Solicitar permisos y obtener el `push_token`
2. Guardar el token en Supabase
3. Manejar notificaciones recibidas (foreground y background)
4. Navegar al pedido al tocar una notificación

---

## Flujo por rol

| Rol | Cuándo recibe push |
|-----|--------------------|
| `admin` (2) | Cada vez que se crea un nuevo pedido |
| `manager` (3) | Cuando se crea un pedido en su bodegón asignado |
| `customer` (1) | Cuando su pedido cambia a: confirmado, en camino, completado, cancelado |
| `delivery` (4) | Cuando se le asigna un pedido |

---

## 1. Instalación de dependencias

```bash
npx expo install expo-notifications expo-device expo-constants
```

---

## 2. Configuración en `app.json`

```json
{
  "expo": {
    "plugins": [
      [
        "expo-notifications",
        {
          "icon": "./assets/notification-icon.png",
          "color": "#ffffff",
          "sounds": ["./assets/notification.wav"]
        }
      ]
    ],
    "android": {
      "googleServicesFile": "./google-services.json",
      "permissions": ["NOTIFICATIONS", "VIBRATE"]
    },
    "ios": {
      "bundleIdentifier": "com.tu-app.llanero",
      "infoPlist": {
        "UIBackgroundModes": ["remote-notification"]
      }
    }
  }
}
```

> **Nota:** Para iOS necesitas una cuenta de Apple Developer y configurar APNs en el dashboard de Expo (eas.json).

---

## 3. Hook `usePushNotifications`

Crea el archivo `hooks/usePushNotifications.ts`:

```typescript
import { useEffect, useRef } from "react"
import * as Notifications from "expo-notifications"
import * as Device from "expo-device"
import Constants from "expo-constants"
import { Platform } from "react-native"
import { supabase } from "@/lib/supabase" // ajusta el path

// Comportamiento de la notificación cuando la app está en foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
})

async function registerForPushNotifications(): Promise<string | null> {
  if (!Device.isDevice) {
    console.warn("Push notifications only work on physical devices")
    return null
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync()
  let finalStatus = existingStatus

  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync()
    finalStatus = status
  }

  if (finalStatus !== "granted") {
    console.warn("Push notification permission denied")
    return null
  }

  // Android: crear canal de notificaciones
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "default",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#FF231F7C",
      sound: "notification.wav",
    })
  }

  const projectId = Constants.expoConfig?.extra?.eas?.projectId
  if (!projectId) {
    console.warn("EAS projectId not found in app.json")
    return null
  }

  const token = (await Notifications.getExpoPushTokenAsync({ projectId })).data
  return token
}

async function savePushToken(token: string) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  await supabase
    .from("users")
    .update({
      push_token: token,
      push_token_updated_at: new Date().toISOString(),
    })
    .eq("id", user.id)
}

export function usePushNotifications(
  onNotificationTap?: (data: Record<string, unknown>) => void
) {
  const notificationListener = useRef<Notifications.EventSubscription>()
  const responseListener = useRef<Notifications.EventSubscription>()

  useEffect(() => {
    // Registrar y guardar token
    registerForPushNotifications().then((token) => {
      if (token) savePushToken(token)
    })

    // Listener: notificación recibida con app en foreground
    notificationListener.current = Notifications.addNotificationReceivedListener(
      (notification) => {
        console.log("Notification received:", notification)
      }
    )

    // Listener: usuario toca la notificación
    responseListener.current = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        const data = response.notification.request.content.data as Record<string, unknown>
        onNotificationTap?.(data)
      }
    )

    return () => {
      notificationListener.current?.remove()
      responseListener.current?.remove()
    }
  }, [onNotificationTap])
}
```

---

## 4. Uso en el layout raíz

En tu `app/_layout.tsx` (o el componente raíz con el router):

```typescript
import { useRouter } from "expo-router"
import { usePushNotifications } from "@/hooks/usePushNotifications"

export default function RootLayout() {
  const router = useRouter()

  usePushNotifications((data) => {
    // Navegar al pedido cuando el usuario toca la notificación
    if (data?.order_id) {
      router.push(`/orders/${data.order_id}`)
    }
  })

  return (
    // ... tu layout
  )
}
```

---

## 5. Toggle de notificaciones (configuración de usuario)

Permite al usuario activar/desactivar notificaciones desde su perfil:

```typescript
async function toggleAppNotifications(enabled: boolean) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  await supabase
    .from("users")
    .update({ app_notification: enabled })
    .eq("id", user.id)

  // Si desactiva, limpiar el token para no recibir más
  if (!enabled) {
    await supabase
      .from("users")
      .update({ push_token: null })
      .eq("id", user.id)
  }
}
```

---

## 6. Configuración EAS (para builds en producción)

Instala EAS CLI:

```bash
npm install -g eas-cli
eas login
eas build:configure
```

`eas.json`:

```json
{
  "cli": {
    "version": ">= 10.0.0"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "production": {
      "distribution": "store"
    }
  }
}
```

`app.json` — agrega el `projectId` de EAS:

```json
{
  "expo": {
    "extra": {
      "eas": {
        "projectId": "TU_EAS_PROJECT_ID"
      }
    }
  }
}
```

> El `projectId` lo encuentras en https://expo.dev después de correr `eas build:configure`.

---

## 7. Datos que llegan en cada notificación

Cada push incluye un objeto `data` con:

### Nuevo pedido (admin/manager)
```json
{
  "order_id": "uuid",
  "order_number": "ORD-00042",
  "warehouse_id": "uuid"
}
```

### Estado del pedido (cliente)
```json
{
  "order_id": "uuid",
  "order_number": "ORD-00042",
  "status": "on_delivery"
}
```

### Pedido asignado (delivery)
```json
{
  "order_id": "uuid",
  "order_number": "ORD-00042"
}
```

---

## 8. Probar notificaciones en desarrollo

Puedes probar manualmente desde la consola de Expo:
https://expo.dev/notifications

O via curl con un token de prueba:

```bash
curl -X POST https://exp.host/--/api/v2/push/send \
  -H "Content-Type: application/json" \
  -d '{
    "to": "ExponentPushToken[TU_TOKEN]",
    "title": "Nuevo pedido recibido",
    "body": "Pedido ORD-00001 por $25.00",
    "data": { "order_id": "uuid", "order_number": "ORD-00001" }
  }'
```
