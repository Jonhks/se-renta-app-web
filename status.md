Amo cómo está tomando forma esto.
Hoy sí fue día productivo de verdad.

Te dejo el status.md actualizado, incorporando TODO lo que ya hicimos y lo que definimos hoy.

Puedes reemplazar tu archivo completo por esto 👇

⸻

SE RENTA

0. Estado del Proyecto

Proyecto en fase MVP real.

Objetivo:
Validar rápido y resolver el problema real de encontrar departamentos en renta confiables.

No estamos construyendo la app perfecta.
Estamos construyendo la versión que prueba si esto funciona.

Hoy ya tenemos:
• Autenticación funcional
• Creación de reportes
• Renderizado en mapa
• Sistema base de reputación
• Estados de usuario
• Pins personalizados negros
• Selección manual de ubicación

Ya no es idea.
Ya es producto funcional.

⸻

1. Visión

SE RENTA es un mapa comunitario en tiempo real que ayuda a personas que están buscando departamento en renta a encontrar opciones reales, activas y validadas por la comunidad.

No es un portal inmobiliario.
No es un marketplace tradicional.
Es una capa comunitaria enfocada en confianza y reducción de fraude.

⸻

2. Problema

Buscar departamento es caótico:
• Fraude frecuente
• Información desactualizada
• Letreros físicos que no aparecen en internet
• Grupos desordenados
• Publicaciones falsas

No existe una herramienta enfocada 100% en quien busca renta con validación comunitaria.

⸻

3. Enfoque

Primero resolver:

🔍 Para quien busca depa.

La comunidad ayuda.
Pero el foco es el buscador.

⸻

4. Stack Tecnológico (Congelado para MVP)

Frontend:
• Next.js (App Router)
• TailwindCSS
• Leaflet + OpenStreetMap
• React Context (Auth)
• React Toastify

Backend:
• Firebase
• Firestore
• Firebase Auth (Google Only)
• Firebase Storage (pendiente integrar)

Hosting:
• Vercel

⸻

5. Estructura de Proyecto
   se-renta/
   ├─ app/
   │ ├─ layout.tsx
   │ ├─ page.tsx
   │ ├─ globals.css
   ├─ components/
   │ ├─ LeafletMap.tsx
   │ ├─ CreateReportButton.tsx
   │ ├─ CreateReportModal.tsx
   │ ├─ ConfirmDialog.tsx
   ├─ lib/
   │ ├─ firebase.ts
   │ ├─ AuthContext.tsx
   ├─ public/
   ├─ status.md

Reglas:
• UI reusable → components/
• Firebase logic → lib/
• Rutas → app/
• No mezclar lógica de negocio con UI visual
• Todo cambio debe indicar archivo exacto

⸻

6. Autenticación (YA IMPLEMENTADA)

Solo:
• Google Auth

Implementado:
• Login con popup
• Creación automática de documento en users
• Actualización de lastLogin
• Estado visible en header
• Logout con dialog bonito (no window.confirm)

Estados de usuario:
• active
• restricted
• banned

Visual:
• Usuario ve su nombre
• Ve su reputación ⭐
• Si banned → “Cuenta suspendida”
• Botón salir siempre visible

⸻

7. Geolocalización

Actual:
• Mapa inicia en CDMX
• Botón “Usar mi ubicación”
• Al crear reporte:
• Si no hay ubicación → solicita permiso automáticamente
• Puede ajustar ubicación manualmente
• Puede seleccionar ubicación tocando el mapa
• Al seleccionar punto → se abre modal automáticamente

Esto es UX fuerte y correcta.

⸻

8. Sistema de Reportes (Implementado Base)

Collection: reports

{
id,
createdAt,
createdBy,
location: { lat, lng },
price,
phone,
description,
imageUrl,
status: "active",
confirmations: 0,
possibleFraudVotes: 0,
fraudVotes: 0,
expiresAt
}

## ⸻

Reglas actuales:
• Debe tener al menos:
• precio OR
• descripción OR
• foto OR
• teléfono válido (10 dígitos)
• Teléfono validado
• Expiración automática a 14 días
• Usuario confiable (futuro) → 20 días

⸻

9. Renderizado en Mapa (YA IMPLEMENTADO)
   • Query Firestore:
   • status == active
   • expiresAt > now
   • Index requerido en Firestore (ya creado)
   • Pins personalizados negros (no azul Leaflet)
   • Popup muestra:
   • precio
   • descripción
   • teléfono
   • confirmaciones

⸻

10. Sistema de Confianza

Score del Reporte

Reglas definidas (a implementar):

+1 → Confirmación
-2 → Posible fraude
-5 → Fraude confirmado

Si fraudVotes >= 3 → reporte oculto automáticamente.

⸻

Reputación del Usuario

Collection: users

{
id,
displayName,
email,
reputationScore,
contributionsCount,
status: "active" | "restricted" | "banned",
isAdmin,
createdAt,
lastLogin
}

Restricciones actuales:
• restricted → botón visible pero no funcional
• banned → botón visible pero muestra 🚫

Regla futura:
Si reputationScore < -5 → bloquear publicación automática.

⸻

11. Moderación

Modelo híbrido:

Sistema comunitario automático + panel admin básico.

Futuro:
• Ruta protegida /admin
• Lista usuarios
• Cambiar status
• Reactivar reporte
• Banear cuentas

⸻

12. UX Implementada Hoy
    • FAB circular minimalista
    • Estados visuales según usuario
    • Modal moderno
    • Validaciones inteligentes
    • Toasts claros
    • Ajuste manual de ubicación
    • Apertura automática del modal al elegir punto

Producto ya se siente serio.

⸻

13. Roadmap Actualizado

FASE 1 — Base ✅
• Next setup
• Tailwind
• Leaflet
• Ubicación
• Autenticación
• Crear reporte
• Mostrar reportes

FASE 2 — Confianza Visible 1. Implementar confirmaciones en popup 2. Implementar posible fraude 3. Implementar fraude confirmado 4. Cambiar color de pin según estado 5. Recalcular reputationScore

FASE 3 — Storage
• Subir imagen a Firebase Storage
• Guardar imageUrl real
• Mostrar imagen en popup

FASE 4 — Auto-Extensión
• Confirmaciones extienden expiresAt
• Usuario confiable obtiene +6 días automáticos

FASE 5 — Panel Admin Básico
• Ruta protegida
• Lista usuarios
• Cambiar status
• Ban manual

⸻

14. Reglas de Código

Siempre indicar:
• Archivo exacto
• Ruta
• Qué reemplazar
• Qué agregar
• Qué borrar

No tocar múltiples archivos sin claridad.
No duplicar lógica.

⸻

15. Métricas Clave
    • Reportes creados por semana
    • Confirmaciones por reporte
    • Votos fraude
    • Usuarios activos
    • Reportes expirados
    • Tiempo promedio activo de un reporte

⸻

16. Objetivo Real

Validar:
• Que sí lo usen
• Que sí reporten
• Que sí confirmen
• Que reduzca fraude
• Que el mapa se mantenga limpio

Si eso pasa → escalar.
Si no pasa → ajustar o matar.

Sin apego emocional.

⸻

17. Próximo Paso Real

Implementar:

👉 Confirmaciones dentro del popup
👉 Botón “Disponible”
👉 Botón “Posible fraude”
👉 Botón “Fraude confirmado”

Y recalcular score dinámico.

Eso ya convierte esto en sistema comunitario real.

⸻

18. Extras Futuros (Etapa 2)
    • Si tiene foto → score inicial +1
    • Si tiene teléfono → +0.5
    • Si descripción > 50 caracteres → +0.5
    • Halo especial para reportes confiables
    • Pin verde / amarillo / rojo según score
