# SE RENTA

## 0. Estado del Proyecto

Proyecto en fase MVP.
Objetivo: validar rápido y resolver el problema real de encontrar departamentos en renta confiables.

No estamos construyendo la app perfecta.
Estamos construyendo la versión que prueba si esto funciona.

---

# 1. Visión

SE RENTA es un mapa comunitario en tiempo real que ayuda a personas que están buscando departamento en renta a encontrar opciones reales, activas y validadas por la comunidad.

No es un portal inmobiliario.
No es un marketplace tradicional.
Es una capa comunitaria enfocada en confianza y reducción de fraude.

---

# 2. Problema

Buscar departamento es caótico:

- Fraude frecuente
- Información desactualizada
- Letreros físicos que no aparecen en internet
- Grupos desordenados
- Publicaciones falsas

No existe una herramienta enfocada 100% en quien busca renta con validación comunitaria.

---

# 3. Enfoque

Primero resolver:
🔍 Para quien busca depa.

La comunidad ayuda.
Pero el foco es el buscador.

---

# 4. Stack Tecnológico (Congelado para MVP)

Frontend:
- Next.js (App Router)
- TailwindCSS
- React Query
- Leaflet + OpenStreetMap

Backend:
- Firebase
- Firestore
- Firebase Storage
- Firebase Auth (Google Only)

Hosting:
- Vercel

---

# 5. Estructura de Proyecto

Estructura actual:

se-renta/
├─ app/
│   ├─ layout.tsx
│   ├─ page.tsx
│   ├─ globals.css
├─ components/
│   ├─ Map.tsx
│   ├─ LeafletMap.tsx
├─ lib/
├─ public/
├─ status.md


Regla:
- UI reusable va en `components/`
- Lógica Firebase va en `lib/`
- Rutas van en `app/`

---

# 6. Autenticación (MVP)

Solo:
- Google Auth

No:
- Email/password
- Recuperación
- Registro manual

Razón:
Reducir fricción y cuentas falsas.

---

# 7. Geolocalización

- El mapa inicia centrado en CDMX.
- Botón manual: “Usar mi ubicación”.
- No se pide permiso automáticamente.
- Centra mapa y dibuja marcador.
- UX sin fricción.

---

# 8. Sistema de Reportes

Collection: `reports`

{
id,
createdAt,
createdBy,
location: { lat, lng },
price,
phone,
description,
images[],
status: “active” | “inactive” | “expired”,
confirmations,
possibleFraudVotes,
fraudVotes,
expiresAt
}

---

# 9. Auto-Expiración

- Reporte normal: 14 días.
- Usuario confiable: 20 días.
- Confirmaciones pueden extender duración.
- Si `expiresAt < now` → no se muestra.

Objetivo:
Mapa limpio y confiable.

---

# 10. Sistema de Confianza

## Score del Reporte

Reglas:

+1 → Confirmación disponible  
-2 → Posible fraude  
-5 → Fraude confirmado  

Si `fraudVotes >= 3` → reporte oculto automáticamente.

---

## Reputación del Usuario

Collection: `users`

{
id,
displayName,
email,
reputationScore,
contributionsCount,
status: “active” | “restricted” | “banned”,
isAdmin: boolean
}

### Gana reputación cuando:
- Crea reportes confirmados.
- Marca fraude que luego es confirmado.
- Tiene reportes activos sin conflicto.

### Pierde reputación cuando:
- Publica reportes marcados fraude.
- Acumula votos negativos.
- Publica spam.

### Restricción automática:
Si reputationScore < -5 → no puede publicar.

---

# 11. Moderación

Modelo híbrido:

- Sistema comunitario automático.
- Panel admin básico accesible solo si `isAdmin = true`.

Funciones futuras del panel:
- Ver reportes marcados fraude.
- Banear usuario.
- Restringir usuario.
- Reactivar reporte.

---

# 12. Lo que NO es el MVP

- Chat interno
- Sistema de pagos
- Ranking público global
- Medallas
- Gamificación
- Perfil editable complejo

---

# 13. Roadmap Técnico Paso a Paso

FASE 1 — Base (Hecho parcialmente)
- Next setup
- Tailwind
- Leaflet funcionando
- Botón ubicación

FASE 2 — Autenticación
- Configurar Firebase
- Google Auth
- Crear documento user al login

FASE 3 — Crear Report
- Formulario básico
- Guardar en Firestore
- Subir imagen a Storage
- Set expiresAt automático

FASE 4 — Mostrar Reports
- Query Firestore
- Renderizar markers dinámicos
- Mostrar popup con info

FASE 5 — Confirmaciones
- Botón confirmar disponible
- Botón posible fraude
- Botón fraude confirmado

FASE 6 — Reputación
- Actualizar reputationScore
- Bloquear publicación si negativo
- Extender duración si confiable

FASE 7 — Panel Admin Básico
- Ruta protegida
- Lista usuarios
- Cambiar status manual

---

# 14. Reglas de Código

- Todo código nuevo debe indicar:
  - Archivo exacto
  - Ruta
  - Qué reemplazar
  - Qué agregar
- No modificar múltiples archivos sin indicarlo claramente.
- No duplicar lógica en componentes.

---

# 15. Métricas Clave

- Reportes creados por semana
- Confirmaciones por reporte
- Tasa de fraude detectado
- Usuarios activos
- Reportes expirados vs activos

---

# 16. Objetivo Real

Validar que:

- Personas sí usan el mapa.
- Sí reportan.
- Sí confirman.
- Sí ayuda a reducir fraude.

Si eso pasa → escalar.
Si no pasa → ajustar o matar.

---

# 17. Próximo Paso

Implementar:
Google Auth.

No avanzar a reportes antes de login.

