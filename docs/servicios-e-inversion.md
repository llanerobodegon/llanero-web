# Servicios e Inversion - Llanero App

## Que servicios usamos y para que sirven?

| Servicio | Para que sirve? | Plan actual |
|----------|----------------|-------------|
| **Vercel** | Es donde "vive" la pagina web de administracion. Cuando abres el navegador y entras al panel, Vercel es quien lo muestra al mundo. | Gratis (Hobby) |
| **Supabase** | Es la base de datos y el cerebro detras de la app. Guarda toda la informacion: productos, pedidos, bodegones, usuarios, etc. Tambien maneja el inicio de sesion y los permisos. | Gratis (Free) |
| **Expo** | Es la herramienta que permite que la app funcione tanto en telefonos iPhone como Android. Se encarga de construir y publicar las apps moviles. | Gratis (Free) |
| **Resend** | Servicio de envio de correos electronicos. Permite enviar notificaciones, confirmaciones de pedidos y comunicaciones por email a los usuarios. | No configurado |
| **Apple Developer** | Cuenta de desarrollador requerida para publicar la app en la App Store (iPhone/iPad). Sin esta cuenta no se puede distribuir la app en dispositivos Apple. | No adquirida |
| **Google Play Developer** | Cuenta de desarrollador requerida para publicar la app en Google Play Store (Android). Sin esta cuenta no se puede distribuir la app en dispositivos Android. | No adquirida |

---

## Estado actual y recomendaciones

### Supabase - Upgrade recomendado (PRIORITARIO)

Se ha alcanzado el limite de transferencia de datos (egress) del plan gratuito. Esto significa que la app puede dejar de funcionar correctamente si no se sube al plan Pro.

**Que incluye el plan Pro?**
- 8 GB de almacenamiento en base de datos (vs 500 MB gratis)
- 250 GB de transferencia de datos mensual
- 100,000 usuarios activos mensuales
- Sin pausas por inactividad (el plan gratis pausa el proyecto si no se usa en 1 semana)
- Backups diarios

### Resend - Integracion recomendada

Actualmente no esta configurado ningun servicio de correo electronico. Se recomienda integrar Resend para poder enviar:
- Confirmaciones de pedidos
- Notificaciones importantes
- Recuperacion de contrasenas

El plan gratuito incluye 3,000 correos por mes, suficiente para iniciar operaciones.

### Vercel - Mantener plan gratuito

El plan gratuito es suficiente por ahora. Incluye 100 GB de ancho de banda y 1 millon de solicitudes mensuales. Cuando el trafico crezca significativamente se puede evaluar el plan Pro.

### Expo - Mantener plan gratuito

El plan gratuito permite hasta 30 compilaciones de la app por mes (15 Android + 15 iOS) y actualizaciones para 1,000 usuarios activos. Es suficiente para la etapa actual.

### Apple Developer Account - Requerido para publicar en App Store

Para poder publicar y mantener la app disponible en la App Store (iPhone/iPad) se necesita una cuenta de desarrollador de Apple. Tiene un costo de **$99/ano** y debe renovarse cada ano para que la app siga disponible en la tienda.

### Google Play Developer Account - Requerido para publicar en Google Play

Para publicar la app en Google Play Store (Android) se necesita una cuenta de desarrollador de Google. Tiene un costo unico de **$25** (pago unico, no se renueva).

---

## Tabla comparativa de costos

### Escenario actual (todo gratis)

| Servicio | Plan | Costo mensual | Costo anual |
|----------|------|:-------------:|:-----------:|
| Vercel | Hobby (Gratis) | $0 | $0 |
| Supabase | Free | $0 | $0 |
| Expo | Free | $0 | $0 |
| Resend | No configurado | $0 | $0 |
| Apple Developer | No adquirida | $0 | $0 |
| Google Play Developer | No adquirida | $0 | $0 |
| **Total** | | **$0** | **$0** |

### Escenario recomendado

| Servicio | Plan | Costo mensual | Costo anual |
|----------|------|:-------------:|:-----------:|
| Vercel | Hobby (Gratis) | $0 | $0 |
| Supabase | **Pro** | **$25** | **$300** |
| Expo | Free | $0 | $0 |
| Resend | Free | $0 | $0 |
| Apple Developer | Requerido | $8.25* | $99 |
| Google Play Developer | Requerido (pago unico) | - | $25** |
| **Total** | | **~$33.25** | **$424** |

*\* $99/ano dividido en 12 meses como referencia.*
*\*\* Pago unico, no recurrente. Solo aplica el primer ano.*

### Escenario de crecimiento (futuro)

| Servicio | Plan | Costo mensual | Costo anual |
|----------|------|:-------------:|:-----------:|
| Vercel | Pro | $20 | $240 |
| Supabase | Pro | $25 | $300 |
| Expo | Production | $99 | $1,188 |
| Resend | Pro | $20 | $240 |
| Apple Developer | Requerido | $8.25* | $99 |
| Google Play Developer | Activa | $0 | $0 |
| **Total** | | **~$172.25** | **$2,067** |

*\* $99/ano dividido en 12 meses como referencia.*

> **Nota:** Todos los precios estan en dolares estadounidenses (USD). Supabase no ofrece descuento por pago anual; los servicios de infraestructura se facturan mensualmente. Apple Developer se paga anualmente. Google Play Developer es un pago unico de $25. Los costos pueden variar si se exceden los limites incluidos en cada plan.

---

## Accion inmediata requerida

1. **Subir Supabase a Pro ($25/mes)** - El limite de transferencia ya se alcanzo. Sin esta actualizacion la app puede presentar fallas.
2. **Adquirir Apple Developer Account ($99/ano)** - Requerida para publicar la app en la App Store.
3. **Adquirir Google Play Developer Account ($25 unico)** - Requerida para publicar la app en Google Play Store.
4. **Configurar Resend (gratis)** - Para habilitar el envio de correos electronicos desde la plataforma.

---

*Documento generado el 26 de febrero de 2026*

*Fuentes de precios: [Vercel Pricing](https://vercel.com/pricing) | [Supabase Pricing](https://supabase.com/pricing) | [Expo Pricing](https://expo.dev/pricing) | [Resend Pricing](https://resend.com/pricing) | [Apple Developer](https://developer.apple.com/support/enrollment/) | [Google Play Console](https://support.google.com/googleplay/android-developer/answer/6112435)*
