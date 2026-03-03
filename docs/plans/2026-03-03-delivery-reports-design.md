# Diseño: Reporte de Repartidores

**Fecha:** 2026-03-03
**Módulo:** Reportes (`/admin/reports`)
**Estado:** Aprobado

---

## Objetivo

Agregar una sección en el módulo de reportes que permita al admin/gerente ver cuántos deliveries realizó cada repartidor en un rango de fechas, junto con el monto total de fees generado, para facilitar el cálculo de pago a cada repartidor.

---

## Decisiones de Diseño

| Decisión | Opción elegida |
|---|---|
| Vista | Por repartidor (una fila por persona) |
| Moneda | Solo USD |
| Estados incluidos | Solo `completed` |
| Tipos de orden | Solo `delivery_type = 'delivery'` |
| Filtro de almacén | Sí, respeta el almacén seleccionado |
| Ubicación en UI | Nueva sección al final del reporte (bajo la tabla de pedidos) |

---

## Arquitectura

Sigue el patrón existente del módulo:

```
Supabase (orders JOIN users)
  → dashboard.service.ts → getDeliveryStats(warehouseId?, dateRange?)
  → useReportsViewModel → deliveryStats: DeliveryStatRow[]
  → DeliveryStatsTable component (nuevo)
  → reports-content.tsx (se agrega al final)
```

---

## Consulta SQL (lógica)

```sql
SELECT
  u.id,
  u.first_name,
  u.last_name,
  COUNT(o.id) AS total_deliveries,
  SUM(o.delivery_fee_usd) AS total_fee_usd
FROM orders o
JOIN users u ON o.delivery_person_id = u.id
WHERE
  o.delivery_type = 'delivery'
  AND o.status = 'completed'
  AND o.created_at BETWEEN :from AND :to
  AND (:warehouse_id IS NULL OR o.warehouse_id = :warehouse_id)
GROUP BY u.id, u.first_name, u.last_name
ORDER BY total_deliveries DESC
```

---

## Interfaz de Datos

```typescript
export interface DeliveryStatRow {
  deliveryPersonId: string
  deliveryPersonName: string
  totalDeliveries: number
  totalFeeUsd: number
}
```

---

## Componente: DeliveryStatsTable

**Archivo:** `src/components/shared/delivery-stats-table.tsx`

### Columnas de la tabla

| Columna | Tipo | Descripción |
|---|---|---|
| Repartidor | string | Nombre completo del repartidor |
| N° de Deliveries | number | Cantidad de pedidos completados |
| Fee Total (USD) | number (currency) | Suma de `delivery_fee_usd` |

### Comportamiento

- Ordenable por cualquier columna (click en header)
- Sin paginación (los repartidores son pocos)
- Si no hay datos en el rango → mensaje vacío: "No hay deliveries completados en este período"
- Skeleton de carga consistente con el resto del módulo
- Usa los componentes `Table`, `TableHeader`, etc. de `components/ui/table.tsx`

---

## Cambios por archivo

| Archivo | Cambio |
|---|---|
| `src/services/dashboard.service.ts` | Agregar `getDeliveryStats()` |
| `src/viewmodels/useReportsViewModel.ts` | Agregar `deliveryStats` al estado y fetch |
| `src/components/shared/delivery-stats-table.tsx` | Nuevo componente de tabla |
| `src/components/reports/reports-content.tsx` | Agregar sección al final |
| `src/components/reports/report-print-view.tsx` | (Opcional) Incluir en PDF |

---

## Exclusiones (fuera de scope)

- No se incluye en el PDF por ahora (se puede agregar en iteración futura)
- No hay filtro adicional dentro de la sección (usa el selector de fechas y almacén global)
- No hay detalle por pedido individual dentro de esta sección
