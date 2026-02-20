⸻

SE RENTA

⸻

0. Estado Actual del Proyecto

Proyecto en fase MVP real y funcional.

Ya no es prototipo.
Ya no es maqueta.
Es sistema operativo básico comunitario.

Hoy el producto ya tiene:
• ✅ Autenticación Google funcional
• ✅ Creación de reportes con ubicación real
• ✅ Selección manual de ubicación en mapa
• ✅ Validación inteligente de campos
• ✅ Sistema de votos único por usuario
• ✅ Subcolección votes por reporte
• ✅ Contadores sincronizados correctamente
• ✅ Botón dominante visual
• ✅ Pin dinámico según balance de votos
• ✅ Toast inteligente solo en eventos reales
• ✅ Reglas de Firestore seguras
• ✅ UX de selección con cursor crosshair
• ✅ Splash dark minimalista
• ✅ FAB circular funcional

Esto ya es un sistema comunitario vivo.

⸻

1. Visión

SE RENTA es un mapa comunitario en tiempo real que ayuda a personas que buscan departamento en renta a encontrar opciones reales, activas y validadas por la comunidad.

No es marketplace.
No es portal inmobiliario.
Es una capa de confianza comunitaria sobre el mundo real.

⸻

2. Problema

Buscar departamento es caótico:
• Fraudes
• Información vieja
• Letreros físicos invisibles en internet
• Grupos desordenados
• Publicaciones falsas

SE RENTA ataca:

Confianza + Actualización + Comunidad.

⸻

3. Enfoque

Primero resolver:

🔍 Para quien busca depa.

Luego escalar comunidad.

⸻

4. Stack Tecnológico (MVP Congelado)

Frontend:
• Next.js (App Router)
• TailwindCSS
• Leaflet + OpenStreetMap
• React Context (Auth)
• React Toastify

Backend:
• Firebase
• Firestore
• Firebase Auth (Google)
• Subcolecciones de votos
• Reglas seguras activadas

Hosting:
• Vercel

⸻

5. Arquitectura de Votos (NUEVO)

Estructura:

reports/{reportId}
└── votes/{userId}

Documento vote:

{
userId,
voteType: “confirm” | “possible” | “fraud” | “inactive”,
updatedAt
}

Reglas:
• 1 voto por usuario por reporte.
• Puede cambiar voto.
• Restar anterior y sumar nuevo.
• Contadores sincronizados.
• No spam.
• No múltiples votos.

Esto convierte el sistema en justo.

⸻

6. Sistema de Dominancia

Orden de prioridad: 1. fraudVotes >= 3 → 🔴 rojo 2. inactiveVotes >= 2 → ⚫ gris 3. confirmations dominante → 🟢 verde 4. possibleFraud dominante → 🟡 amarillo 5. default → ⚫ negro

Botón dominante:
• ring visible
• leve scale
• opacity completa
• otros semi transparentes

El mapa comunica estado sin abrir popup.

⸻

7. Sistema de Reportes

Collection: reports

{
id,
createdAt,
createdBy,
location,
price?,
phone?,
description?,
imageUrl?,
confirmations,
possibleFraudVotes,
fraudVotes,
inactiveVotes,
status,
expiresAt
}

Reglas:
• Mínimo un campo útil
• Teléfono validado 10 dígitos
• Expira en 14 días
• Se muestra solo si:
• status == active
• expiresAt > now

⸻

8. Geolocalización
   • Botón manual
   • Solicita permiso al crear reporte si no existe
   • Ajuste manual tocando mapa
   • Cursor crosshair
   • Mini overlay guía
   • Modal abre automáticamente al seleccionar punto

UX limpia.

⸻

9. Seguridad Firestore (YA ACTIVADA)

Reglas activas:
• Solo usuarios logueados crean/actualizan
• Solo dueño puede escribir su voto
• Solo dueño modifica su user doc
• Lectura pública del mapa

Ya no es base abierta.

⸻

10. UX Implementada
    • FAB circular
    • Botones con contador integrado
    • Botón dominante visual
    • Toast solo en cambios reales
    • Pin cambia color dinámicamente
    • Splash dark minimalista
    • Diseño coherente

Ya se siente producto.

⸻

11. Lo que NO es MVP
    • Chat
    • Pagos
    • Ranking global
    • Medallas
    • Perfil editable complejo
    • Filtros avanzados
    • Búsqueda por colonia

⸻

12. Roadmap Actualizado

FASE 1 — Base (COMPLETADA)
• Mapa
• Auth
• Crear reporte
• Votos
• Dominancia
• Seguridad

⸻

FASE 2 — Confianza Avanzada

1️⃣ Resaltar botón ya votado por el usuario
2️⃣ Permitir quitar voto
3️⃣ Extensión automática de expiresAt si confirmaciones >= X
4️⃣ Ajustar reputación de usuario según calidad de reportes
5️⃣ Bloquear publicación automática si reputationScore < -5

⸻

FASE 3 — Storage
• Subir imagen a Firebase Storage
• Guardar imageUrl real
• Mostrar imagen dentro del popup

⸻

FASE 4 — Sistema de Reputación Real
• reputationScore dinámico
• Usuario confiable obtiene 20 días de duración
• Badge visual en reportes creados por usuarios confiables
• Penalización automática por fraude confirmado

⸻

FASE 5 — Panel Admin
• Ruta protegida /admin
• Lista usuarios
• Cambiar status
• Ban manual
• Reactivar reporte

⸻

13. Métricas Clave
    • Reportes creados por semana
    • Confirmaciones promedio
    • Votos fraude
    • Reportes expirados
    • Usuarios activos
    • Tiempo promedio activo por reporte

⸻

14. Objetivo Real

Validar:
• Que sí lo usen
• Que sí voten
• Que sí confíen
• Que reduzca fraude
• Que el mapa se mantenga limpio

Si eso pasa → escalar.

Si no → iterar sin apego.

⸻

15. Próximo Paso Mañana

Recomendación ordenada:

1️⃣ Resaltar botón que el usuario ya votó
2️⃣ Permitir quitar voto (toggle)
3️⃣ Empezar lógica de reputación básica
4️⃣ Subida de imágenes a Storage

Yo empezaría por el 1️⃣.
