⸻

SE RENTA

Documento Estratégico — Versión Pre-Lanzamiento

⸻

⸻

0. Estado Actual del Proyecto

Proyecto en fase MVP funcional y estructuralmente sólido.

Ya no es prototipo.
Ya no es maqueta.
Es sistema operativo comunitario base.

Hoy el producto ya tiene:

• ✅ Autenticación Google funcional
• ✅ Creación de reportes con ubicación real
• ✅ Selección manual de ubicación en mapa
• ✅ Validación inteligente de campos
• ✅ Sistema de votos único por usuario
• ✅ Subcolección votes por reporte
• ✅ Contadores sincronizados correctamente
• ✅ Botón dominante visual
• ✅ Pin dinámico según balance de votos (nuevo icono Se Renta)
• ✅ Toast inteligente solo en eventos reales
• ✅ Reglas de Firestore seguras
• ✅ Custom Claims para admin real
• ✅ Edición de reportes por dueño
• ✅ UX de selección con cursor crosshair
• ✅ Splash dark minimalista
• ✅ FAB circular funcional
• ✅ Panel Admin funcional con control reversible
• ✅ Logo SeRentaIcon + SeRentaLogo (SVG propio, pin de gota con casita)
• ✅ Fuente global Inter 600 — icono 36px, texto 20px
• ✅ Menú mobile: drawer slide-left al tocar foto de usuario
• ✅ Menú mobile incluye: Admin (si aplica), Ranking, Landing, Compartir, Logout
• ✅ Botón ubicación estilo Google Maps (circular blanco con ícono)
• ✅ photoURL guardada en Firestore al hacer login
• ✅ Botón Compartir (Web Share API) — WhatsApp, Instagram, etc.

Esto ya es un sistema comunitario vivo.

⸻

1. Visión

SE RENTA es un mapa comunitario en tiempo real que ayuda a personas que buscan departamento en renta a encontrar opciones reales, activas y validadas por la comunidad.

No es marketplace.
No es portal inmobiliario.
Es una capa de confianza sobre el mundo físico.

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

3. Enfoque Estratégico

Primero resolver:

🔍 Para quien busca depa.

Luego escalar comunidad.

No al revés.

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
• Custom Claims admin
• Reglas seguras activadas

Hosting:
• Vercel

⸻

5. Arquitectura de Votos

Estructura:
reports/{reportId}
└── votes/{userId}

Documento vote:
{
userId,
voteType,
updatedAt
}

Reglas:

• 1 voto por usuario por reporte
• Puede cambiar voto
• Resta anterior y suma nuevo
• Contadores sincronizados
• Seguridad de campos protegida

Sistema justo.

⸻

6. Sistema de Dominancia

Prioridad:

1️⃣ fraudVotes ≥ 3 → 🔴 rojo
2️⃣ inactiveVotes ≥ 2 → ⚫ gris
3️⃣ confirmations dominante → 🟢 verde
4️⃣ possibleFraud dominante → 🟡 amarillo
5️⃣ default → ⚫ negro

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
• Teléfono validado
• Expira en 14 días
• Solo visible si activo y no expirado

⸻

8. Seguridad

• Solo logueados crean
• Solo dueño edita
• Solo dueño escribe su voto
• Admin con custom claims
• Lectura pública segura

No es base abierta.

⸻

🔥 NUEVA SECCIÓN

9. Pre-Lanzamiento Estratégico

Antes de lanzar público necesitamos cerrar:

🔹 Estabilidad UX

• Resaltar botón que el usuario ya votó
• Permitir quitar voto (toggle)
• Asegurar que editar no rompa dominancia

🔹 Señales de Confianza

• Imagen en reportes (muy importante)
• Mostrar fecha creación en popup
• Mostrar días restantes

🔹 Retención

• Notificación in-app cuando se crea reporte
• Luego push PWA

⸻

🚀 Roadmap Actualizado

FASE 2 — Confianza Avanzada (CORTO PLAZO)

1️⃣ Resaltar botón que el usuario ya votó
2️⃣ Permitir quitar voto (toggle a null)
3️⃣ Mostrar fecha de creación
4️⃣ Mostrar contador de días restantes
5️⃣ Agregar imagen simple (aunque sea 1)

⸻

FASE 3 — Retención

• Notificación in-app cuando se crea marcador
• Guardar zona preferida del usuario
• FCM push básico

⸻

FASE 4 — Reputación

• reputationScore
• Extender expiresAt si confirmaciones ≥ X
• Penalización automática por fraude dominante
• Badge visual usuario confiable

⸻

FASE 5 — Escala

• Filtros por precio
• Filtros por colonia
• Sistema de zonas
• Notificaciones por zona

⸻

📊 Métricas para Lanzamiento

NO necesitas mil métricas.

Solo 5:

• Reportes creados por día
• Votos promedio por reporte
• % reportes que cambian a gris
• Usuarios activos diarios
• Tiempo promedio activo

Si esas se mueven → hay producto.

⸻

🚀 Ahora… cómo lanzar YA

Te doy estrategia real:

❌ No hagas “lanzamiento grande”

No estás listo para viralidad.

✅ Haz lanzamiento controlado 1. Lanza solo en CDMX 2. Comparte en:
• 3 grupos de Facebook específicos
• WhatsApp de conocidos
• Twitter/X local 3. Objetivo: 20–50 usuarios reales 4. Observa comportamiento 7 días

Eso es validación real.

⸻

🧠 Pregunta importante

¿Tu objetivo es:

A) Validar que sí lo usan?
B) Generar usuarios rápido?
C) Conseguir inversión?

Porque la estrategia cambia totalmente según eso.

⸻

Si quieres lanzarlo ya, yo haría:

👉 Esta semana cerramos botones ya votado + toggle
👉 Agregamos imagen simple
👉 Lanzamiento controlado

Y luego vemos cómo reacciona el mundo.

¿Te parece ese plan o quieres ir agresivo? 😏
