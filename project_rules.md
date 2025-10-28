# Project Rules - Llanero

## 📋 Especificaciones del Proyecto

### 🚀 Stack Tecnológico

- **Framework**: Next.js 15.5.4 con App Router
- **Lenguaje**: TypeScript 5
- **Estilos**: Tailwind CSS v4
- **Componentes UI**: shadcn/ui (estilo New York, theme Orange) + Dashboard-01
- **Iconos**: Lucide React v0.544.0
- **Backend**: Supabase (Auth + Database + File Storage S3)
- **Utilidades**: class-variance-authority, clsx, tailwind-merge

### 🌐 Reglas de Idioma

- **Código**: Todo el código (comentarios, variables, nombres de páginas, funciones, etc.) debe estar en **inglés**
- **UI Frontend**: Solo el contenido visible al usuario en el frontend se mostrará en **español**
- **Documentación**: Los archivos de documentación pueden estar en español
- **Commits**: Los mensajes de commit deben estar en inglés

### 🏗️ Estructura del Proyecto

```
llanero/
├── app/                    # App Router de Next.js
│   ├── (public)/          # Rutas públicas
│   │   ├── page.tsx       # Landing page (/)
│   │   └── layout.tsx     # Layout público
│   ├── admin/             # Rutas administrativas
│   │   ├── layout.tsx     # Layout del dashboard
│   │   ├── page.tsx       # Dashboard principal (/admin)
│   │   └── [view]/        # Vistas dinámicas del admin
│   ├── globals.css        # Estilos globales con Tailwind
│   └── layout.tsx         # Layout raíz
├── components/            # Componentes reutilizables
│   ├── ui/               # Componentes de shadcn/ui
│   ├── admin/            # Componentes específicos del admin
│   └── public/           # Componentes públicos
├── lib/                  # Utilidades y configuraciones
│   ├── utils.ts          # Funciones utilitarias (cn, etc.)
│   ├── supabase/         # Configuración de Supabase
│   └── auth/             # Utilidades de autenticación
├── hooks/                # Custom hooks de React
├── types/                # Definiciones de tipos TypeScript
└── public/               # Archivos estáticos
```

### 🗺️ Arquitectura de Rutas

#### Rutas Públicas
- **`/`** - Landing page principal
- Acceso libre sin autenticación

#### Rutas Administrativas (SPA)
- **`/admin`** - Dashboard principal (página padre)
- **`/admin/[view]`** - Vistas dinámicas dentro del dashboard
- Requiere autenticación con Supabase
- Navegación SPA (Single Page Application)
- Layout persistente con sidebar y navegación

### 🎨 Configuración de shadcn/ui

- **Estilo**: New York
- **RSC**: Habilitado (React Server Components)
- **TSX**: Habilitado
- **Color base**: Neutral
- **CSS Variables**: Habilitado
- **Prefijo**: Sin prefijo
- **Dashboard**: dashboard-01 template

### 🗄️ Configuración de Supabase

- **Autenticación**: Email/Password, OAuth providers
- **Base de datos**: PostgreSQL con Row Level Security (RLS)
- **File Storage**: S3-compatible storage para archivos
- **Real-time**: Subscripciones en tiempo real
- **Edge Functions**: Funciones serverless (opcional)

### 📦 Aliases de Importación

```typescript
"@/components" → "./components"
"@/utils" → "./lib/utils"
"@/ui" → "./components/ui"
"@/lib" → "./lib"
"@/hooks" → "./hooks"
```

## 🔧 Reglas de Desarrollo

### 📁 Organización de Archivos

1. **Componentes UI**: Usar shadcn/ui para componentes base
2. **Iconos**: Usar exclusivamente Lucide React
3. **Estilos**: Tailwind CSS con CSS Variables habilitadas
4. **Tipos**: TypeScript estricto para todos los archivos

### 🎯 Convenciones de Código

#### Componentes
```typescript
// ✅ Correcto
import { Button } from "@/ui/button"
import { Search, User } from "lucide-react"

export function MyComponent() {
  return (
    <Button variant="default" size="md">
      <Search className="w-4 h-4 mr-2" />
      Buscar
    </Button>
  )
}
```

#### Iconos de Lucide React
```typescript
// ✅ Correcto - Importar iconos específicos
import { Home, Settings, User, ChevronDown } from "lucide-react"

// ❌ Incorrecto - No importar todo el paquete
import * as Icons from "lucide-react"
```

#### Estilos con Tailwind
```typescript
// ✅ Correcto - Usar la función cn para combinar clases
import { cn } from "@/lib/utils"

const className = cn(
  "base-classes",
  variant === "primary" && "primary-classes",
  className
)
```

### 🚀 Scripts de Desarrollo

```bash
# Desarrollo con Turbopack
npm run dev

# Build de producción con Turbopack
npm run build

# Iniciar servidor de producción
npm run start

# Linting
npm run lint
```

### 📋 Checklist para Nuevos Componentes

- [ ] Usar TypeScript con tipos explícitos
- [ ] Implementar con shadcn/ui cuando sea posible
- [ ] Usar iconos de Lucide React
- [ ] Aplicar estilos con Tailwind CSS
- [ ] Usar aliases de importación (@/components, @/lib, etc.)
- [ ] Seguir convenciones de nomenclatura de React
- [ ] Documentar props con JSDoc si es necesario

### 🎨 Guía de Estilos

#### Colores
- Usar variables CSS de shadcn/ui
- Color base: Neutral
- Mantener consistencia con el design system

#### Espaciado
- Usar sistema de espaciado de Tailwind
- Mantener consistencia en márgenes y padding

#### Tipografía
- Usar clases de Tailwind para tipografía
- Mantener jerarquía visual clara

### 🔍 Mejores Prácticas

1. **Performance**: Aprovechar React Server Components cuando sea posible
2. **Accesibilidad**: Usar componentes de shadcn/ui que incluyen ARIA
3. **SEO**: Optimizar metadata en layout.tsx y páginas
4. **Responsive**: Diseñar mobile-first con Tailwind
5. **Type Safety**: Usar TypeScript estricto en todo el proyecto

### 🚫 Evitar

- ❌ Instalar librerías de iconos adicionales (usar solo Lucide React)
- ❌ Estilos inline o CSS modules (usar Tailwind)
- ❌ Componentes UI custom cuando shadcn/ui tiene alternativa
- ❌ Importaciones absolutas sin aliases
- ❌ JavaScript en lugar de TypeScript

## 📋 Plan de Implementación

### Fase 1: Configuración Base
1. **Instalar Supabase**
   ```bash
   npm install @supabase/supabase-js @supabase/auth-helpers-nextjs
   ```

2. **Instalar Dashboard shadcn/ui**
   ```bash
   npx shadcn@latest add dashboard-01
   ```

3. **Configurar variables de entorno**
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   ```

### Fase 2: Estructura de Rutas
1. **Crear estructura de carpetas**
   - `app/(public)/` para rutas públicas
   - `app/admin/` para dashboard administrativo
   - `components/admin/` para componentes del dashboard

2. **Implementar layouts**
   - Layout público con header/footer
   - Layout admin con sidebar y navegación

### Fase 3: Autenticación
1. **Configurar Supabase Auth**
   - Middleware de autenticación
   - Protección de rutas admin
   - Login/logout components

2. **Implementar guards**
   - Redirección automática
   - Estados de carga
   - Manejo de errores

### Fase 4: Dashboard SPA
1. **Implementar navegación SPA**
   - Router interno del dashboard
   - Gestión de estado de vistas
   - Breadcrumbs y navegación

2. **Crear vistas administrativas**
   - Vista de usuarios
   - Vista de configuración
   - Vista de archivos/media

### Fase 5: Integración Completa
1. **Base de datos**
   - Esquemas y tablas
   - RLS policies
   - Migraciones

2. **File Storage**
   - Upload de archivos
   - Gestión de buckets
   - Optimización de imágenes

## Esquema de Base de Datos

### Referencia SQL
- **Ubicación**: `/sql/supabase.sql`
- **Propósito**: Contiene el esquema completo de la base de datos Supabase
- **Uso obligatorio**: Siempre consultar este archivo antes de implementar funciones que interactúen con la base de datos

### Principales entidades del esquema:
- **users**: Gestión de usuarios y autenticación
- **roles**: Sistema de roles y permisos
- **bodegons**: Tiendas/bodegas del sistema
- **bodegon_products**: Productos de las bodegas
- **bodegon_categories/subcategories**: Categorización de productos
- **restaurants**: Restaurantes del sistema
- **restaurant_products**: Productos de restaurantes
- **orders**: Sistema de pedidos
- **order_status**: Estados de pedidos
- **payments**: Sistema de pagos
- **coupons**: Sistema de cupones y descuentos

### Regla importante:
**SIEMPRE** revisar el archivo `/sql/supabase.sql` antes de crear funciones, queries o componentes que interactúen con la base de datos para asegurar compatibilidad con el esquema existente.

---

**Última actualización**: Enero 2025
**Versión del proyecto**: 0.1.0