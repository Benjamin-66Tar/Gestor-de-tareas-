# Feature Specification: Navigation Layout

**Feature Branch**: `001-navigation-layout`

**Created**: 2026-07-03

**Status**: Draft

**Input**: User description: "Navbar: Izquierda: Logotipo/Texto "Aura" con tipografía destacada y branding colorido. Derecha: Icono de notificaciones con badge de conteo y componente de perfil de usuario (Avatar). TabBar (Debajo de Navbar): Pestañas de navegación horizontal para conmutar dinámicamente entre las secciones: Calendario, Objetivos, Proyectos y Eventos."

## Clarifications

### Session 2026-09-03
- Q: ¿Cuál debe ser el mecanismo y estructura central para gestionar y visualizar las metas en la sección de Objetivos? → A: Progreso cuantificable e hitos (Metas con porcentaje de avance 0-100%, fecha límite, categoría temática y lista de hitos/sub-metas clave para completarlas).
- Q: ¿Cómo debe actualizarse el porcentaje de progreso (0-100%) de cada meta? → A: Modo híbrido configurable por meta: ajuste manual libre (0-100%) o cálculo automático basado en hitos completados, donde los hitos tienen ponderación igual por defecto con opción de asignar valores/pesos personalizados a cada hito.
- Q: ¿Cómo debe organizarse y visualizarse la lista de objetivos dentro de la pantalla de la sección? → A: Vista dual conmutable (Tarjetas visuales con barra de progreso e hitos, o Lista compacta tipo tabla), con filtros rápidos por estado (Todas, Activas, Completadas, Pausadas) y por categorías temáticas.
- Q: ¿Qué tipo de interfaz o flujo de interacción debe utilizarse para crear y editar los objetivos y sus hitos en pantalla? → A: Panel lateral deslizable (Slide-over drawer) desde el borde derecho, permitiendo ver y editar detalles, notas, ponderaciones e hitos sin perder el contexto de la lista de metas.
- Q: ¿Cómo deben relacionarse las fechas límite de los objetivos e hitos con la vista de Calendario y las notificaciones? → A: Sincronización automática con Calendario (Los objetivos e hitos con fecha límite se proyectan automáticamente en la vista de Calendario con el color de su categoría y emiten notificaciones/alertas de proximidad).

### Session 2026-09-07
- Q: ¿Cómo debe estructurarse la visualización y navegación principal de la sección de Proyectos? → A: Hub de proyectos con tarjetas visuales (color, estado, porcentaje de progreso) que al hacer clic abren un espacio de trabajo dedicado con tablero Kanban y vista conmutable de lista de tareas.
- Q: ¿Cómo debe estructurarse el flujo de trabajo (estados/columnas) y los atributos clave de las tareas en el tablero Kanban de cada proyecto? → A: Flujo fijo de 3 estados ("Por hacer", "En progreso", "Completado"), con tareas que incluyen título, prioridad visual colorida (Baja, Media, Alta), fecha límite y checklist de subtareas, calculando automáticamente el porcentaje de avance del proyecto según las tareas completadas.
- Q: ¿Cómo deben integrarse los Proyectos y sus tareas con las demás secciones (Objetivos y Calendario)? → A: Integración flexible completa: los proyectos pueden asociarse opcionalmente a un Objetivo existente, y todas las tareas con fecha límite se proyectan automáticamente en la vista de Calendario estilizadas con el color identificativo del proyecto.
- Q: ¿Qué patrón de interfaz debe utilizarse para crear y editar los Proyectos y las Tareas dentro de la sección? → A: Creación rápida directa (botón de alta ágil en el hub y al pie de cada columna Kanban) complementada con un panel lateral deslizable (Slide-over drawer) desde el borde derecho para ver y editar los detalles completos (fechas, prioridad, checklist de subtareas, vínculos).
- Q: ¿Cómo debe gestionarse la búsqueda, el filtrado y el ciclo de vida (estados) de los Proyectos en el Hub principal? → A: Píldoras de filtro rápido por ciclo de vida ("Activos", "Completados", "Archivados", con "Activos" por defecto) y barra de búsqueda instantánea para filtrar proyectos en tiempo real por título o etiqueta.

### Session 2026-09-14
- Q: ¿Cuál debe ser el propósito, alcance y estructura de datos principal de los eventos gestionados en la sección de Eventos? → A: Eventos de agenda flexibles (reuniones, citas, entregas, fechas especiales) con título, fecha/hora de inicio y fin, ubicación física o enlace virtual, categoría temática de color y descripción/notas.
- Q: ¿Cómo debe estructurarse la visualización y organización de los eventos dentro de la pantalla de la sección de Eventos? → A: Agenda cronológica segmentada por bloques temporales ("Hoy", "Esta semana", "Próximos", "Pasados") con tarjetas visuales destacadas por el color de su categoría y filtros rápidos por categoría.
- Q: ¿Cómo deben integrarse los eventos con la sección de Calendario y el sistema de notificaciones/alertas de Aura? → A: Sincronización automática completa: todo evento se proyecta en la vista de Calendario según su fecha/hora y color de categoría, emitiendo notificaciones/alertas al aproximarse su inicio.
- Q: ¿Qué patrón de interfaz e interacción debe utilizarse para dar de alta y editar los eventos en la sección de Eventos? → A: Botón de creación rápida complementado con un panel lateral deslizable (Slide-over drawer) desde el borde derecho para ver y editar los detalles completos (fechas, horas, enlaces, categorías y recordatorios) preservando el contexto.
- Q: ¿Cómo debe gestionarse el ciclo de vida y los estados de los eventos dentro de la agenda y el calendario? → A: Estados explícitos conmutables ("Programado", "Completado", "Cancelado") con acciones rápidas para marcar como completado o cancelar desde la tarjeta o drawer, diferenciando visualmente los eventos concluidos.

### Session 2026-09-17
- Q: ¿Cómo debe gestionar el backend la evaluación y despacho de notificaciones Web Push para eventos y fechas límite sin requerir servicios externos pesados? → A: Programador liviano en proceso (Background Task Runner / scheduler integrado en Django) que evalúa periódicamente (intervalos de 1 a 5 min) eventos y tareas próximas y despacha cargas Web Push cifradas con pywebpush, sin intermediarios externos como Redis o Celery.
- Q: ¿Cómo debe estructurar el backend el almacenamiento y la depuración de las suscripciones push para evitar conflictos entre dispositivos (laptop y celulares)? → A: Multi-dispositivo (1:N) con auto-depuración: modelo PushSubscription con relación 1 a muchos con User, entregando alertas a todos los dispositivos registrados del usuario y eliminando automáticamente registros cuando el servicio push devuelva HTTP 410 (Gone) o 404.
- Q: ¿Cuál debe ser el alcance y la estrategia de caché del Service Worker y la PWA en el frontend? → A: Service Worker enfocado en Push + PWA (Network-First / Sin caché de API): manifest.json y Service Worker optimizados para habilitar la instalación PWA (iOS 16.4+ y Android) y procesar eventos push/notificationclick, resolviendo siempre las llamadas a la API contra la red en vivo para evitar inconsistencias de datos.
- Q: ¿Cómo debe reaccionar el Service Worker al pulsar una notificación push en laptop o celular? → A: Navegación contextual (Deep Link) con reutilización de ventana: el payload contiene la ruta destino; el Service Worker enfoca la pestaña existente si ya está abierta y navega al ítem concreto (evento/tarea/meta), o abre una nueva ventana si la app estaba cerrada.
- Q: ¿Cómo debe estructurarse la interfaz y el momento de solicitud del permiso para activar las notificaciones en laptop y celular? → A: Activación contextual y explícita por botón: no solicitar permiso al cargar la página; disponer de un control visual accesible (dropdown de notificaciones o ajustes) que active el prompt tras un clic/toque explícito (respetando la restricción de User Gesture de Safari y Chrome) con una guía auxiliar de "Añadir a pantalla de inicio" si se detecta iOS fuera de PWA.

### Session 2026-09-22
- Q: ¿Cómo debe ser el flujo y la interacción cuando el usuario ya tiene su cuenta creada y vuelve a ingresar a la aplicación? → A: Pantalla de bienvenida con imagen y las 2 frases, botón de acceso directo ("Entrar a Aura") y opción secundaria para cambiar de cuenta (sesión persistente sin requerir credenciales nuevamente).
- Q: ¿Cómo deben presentarse y alternarse los formularios de Crear Cuenta e Iniciar Sesión en la segunda parte de la pantalla? → A: Pestañas conmutables (Tabs "Iniciar Sesión" y "Crear Cuenta") en el encabezado del contenedor para alternar de forma inmediata entre ambos formularios sin recargar.
- Q: ¿Qué datos y credenciales deben solicitarse en los formularios para Crear Cuenta e Iniciar Sesión? → A: Registro con Nombre de usuario, Correo electrónico y Contraseña (con confirmación de contraseña); Inicio de sesión mediante Correo electrónico o Nombre de usuario junto a la Contraseña.
- Q: En pantallas de celulares o dispositivos móviles (pantallas estrechas), ¿cómo debe adaptarse la distribución de las dos partes de la pantalla? → A: Apilado vertical en una sola columna con el bloque visual (imagen y 2 frases) arriba en formato compacto y los formularios o botón de acceso debajo con desplazamiento suave.
- Q: ¿Cómo debe comportarse la interfaz cuando el usuario pulsa "Cerrar sesión" (desde el menú de perfil de la Navbar) o "Cambiar de cuenta" (desde la pantalla de bienvenida)? → A: Invalida la sesión activa y restaura de inmediato la pantalla dividida completa, mostrando el panel visual (imagen y 2 frases) junto a las pestañas de Iniciar Sesión y Crear Cuenta.

### Session 2026-09-26
- Q: ¿Cómo deseas que se configure la anticipación de los recordatorios y alertas Web Push para las fechas límite de los Objetivos? → A: Selector configurable en el formulario (al momento exacto, 15 min, 1 hora o 1 día antes), con paridad a la sección de Eventos y campo `reminder_minutes` en Goal evaluado por el scheduler de Django.
- Q: Respecto a 'Esa solución aplícalo en las otras secciones', ¿cómo deseas que se manejen las fechas y recordatorios en las Tareas de Proyectos? → A: Soportar Fecha y Hora exacta (`datetime-local`) con conversión local (vía helper centralizado en dateUtils) y selector de recordatorios configurables (`reminder_minutes`) también en Tareas de Proyectos, con alertas Web Push sincronizadas.
- Q: ¿Cómo debe comportarse el despachador de notificaciones si un Objetivo o Tarea ya fue completado o está en pausa? → A: Suprimir automáticamente las notificaciones y alertas push si el Objetivo está en 'Completado' o 'En Pausa', o la Tarea está 'Completado' (DONE).

### Session 2026-09-29
- Q: ¿Cómo debe integrarse la gestión de cursos, libros y fuentes de aprendizaje dentro de la navegación principal de Aura? → A: Pestaña independiente y dedicada en el TabBar (ej. "Aprendizaje" / "Conocimiento"), con paridad de navegación respecto a Calendario, Objetivos, Proyectos y Eventos.
- Q: ¿Cómo debe gestionarse y medirse el progreso de los cursos y materiales de aprendizaje? → A: Modo híbrido configurable por ítem: permite tanto un desglose detallado de módulos/capítulos o checklist interactivo como un ajuste ágil de porcentaje global o páginas leídas.
- Q: ¿Cuál debe ser el mecanismo principal para combatir el olvido y reactivar los cursos y lecturas en pausa o inactivos? → A: Híbrido de reactivación: alertas periódicas Web Push automáticas tras inactividad prolongada (5-7 días sin registrar avance en recursos activos) combinadas con la capacidad de agendar bloques de tiempo de estudio proyectados en el Calendario de Aura.
- Q: ¿Cómo deben organizarse y visualizarse los cursos, libros y artículos dentro de la pantalla principal de la pestaña de Aprendizaje? → A: Organización por estados de aprendizaje (agrupación visual por 'Por empezar / En cola', 'En curso', 'En pausa', 'Completado'), con vista dual conmutable (Tarjetas visuales con barra de progreso e indicadores de inactividad / Lista compacta), barra de búsqueda instantánea y píldoras de filtrado rápido por tipo de fuente (Cursos, Libros, Artículos, Podcasts).
- Q: ¿Qué información y herramientas de acceso rápido debe contener la ficha de cada recurso de aprendizaje en su panel lateral deslizable (drawer)? → A: Ficha de continuidad completa aplicable a cursos, libros, artículos y documentación de tecnología oficial: botón directo 'Abrir recurso' (URL externa), campo de 'Último punto alcanzado' (módulo, página o sección leída), área de notas/conclusiones clave (Key Takeaways en Markdown) y lista o checklist interactivo de módulos/temas.
- Q: ¿Cómo debe relacionarse la sección de Aprendizaje con los demás pilares de Aura (Objetivos y Proyectos)? → A: Vinculación opcional flexible: cada recurso de aprendizaje puede asociarse opcionalmente a un Objetivo estratégico o a un Proyecto de Aura (o mantenerse como aprendizaje libre/independiente), permitiendo que el progreso del curso/libro alimente opcionalmente los hitos de la meta vinculada.
- Q: ¿Cómo debe crearse y comportarse una sesión de estudio cuando el usuario decide apartar tiempo para avanzar en un curso o libro? → A: Sesión de estudio como evento de agenda integrado con EventItem: acción 'Agendar sesión de estudio' en la ficha del recurso que crea un evento en el Calendario de Aura tipificado con el color del recurso, enlace directo al contenido y recordatorio Web Push configurable (15 min antes).

### Session 2026-10-05
- Q: ¿Cómo debe comportarse el evento o actividad en la interfaz al presionar "Listo hoy", y qué efecto exacto debe tener sobre el evento general? → A: Check-in diario no destructivo (Marca la sesión cumplida únicamente para la fecha actual con badge "✓ Realizado hoy" y suma a la racha de constancia, manteniendo el evento activo en el calendario para las fechas siguientes del rango).
- Q: ¿Cómo debe calcularse y medirse la racha de constancia (Streak 🔥) cuando estudias diferentes materias o actividades? → A: Modo dual configurable por el usuario (Permite elegir entre racha individual de días consecutivos por cada curso/actividad independiente, o meta de frecuencia semanal de días cumplidos, con opción de alternar entre ambos modos de medición).
- Q: ¿En qué puntos de la aplicación debe estar visible y accesible la acción "✓ Listo hoy" para registrar la constancia sin fricción? → A: Enfoque en planificación temporal (Disponible en las tarjetas de eventos del bloque "Hoy" en la sección de Eventos y como botón de un clic en las columnas diarias del modo agrandador del Calendario Semanal).
- Q: ¿Cómo debe funcionar la interacción al pulsar "✓ Listo hoy" y qué sucede si lo marcas por error (reversibilidad)? → A: Toggle directo de un solo clic reversible (Al pulsar registra de inmediato el check-in diario con feedback visual verde y suma a la racha; pulsar nuevamente sobre el control desmarca la sesión y restaura el estado previo sin diálogos ni bloqueos).
- Q: ¿Cómo deben coexistir en la tarjeta la acción diaria de constancia ("✓ Listo hoy") y la finalización definitiva de todo el curso ("Completar")? → A: Jerarquía diferenciada (El botón principal y destacado de cada día es "✓ Listo hoy" para registrar el hábito diario; la acción de dar por concluido el curso completo queda como una opción secundaria explícita "Concluir evento definitivamente" en el menú o detalles para evitar cierres prematuros o accidentales).
- Q: ¿Dónde debe ubicarse y cómo se debe acceder a la Tabla de Progreso y Constancia dentro de la interfaz de Aura? → A: En Aprendizaje con acceso rápido desde Calendario (Modo de vista conmutable en Aprendizaje: [ Kanban ] | [ Lista ] | [ 📊 Matriz de Progreso ], complementado con un botón de acceso directo en la cabecera del Calendario semanal para saltar a la matriz sin fricción).
- Q: ¿Qué cursos o actividades deben aparecer listados en las filas de la Tabla de Progreso? → A: Cursos activos y eventos de estudio del calendario (La tabla consolida los recursos de Aprendizaje en curso junto con los eventos de estudio programados en el Calendario, ofreciendo filtros rápidos para alternar entre "En curso" o "Todos").
- Q: ¿Cómo debe funcionar la cuadrícula semanal de constancia (Lunes a Domingo) dentro de la tabla? → A: Semana activa con navegación histórica (Muestra los 7 días de la semana con "Hoy" resaltado y marcas de check de asistencia, con controles de paso semanal "←" "→" para auditar el cumplimiento en semanas anteriores).
- Q: ¿Cómo debe funcionar el botón de acción rápida para avanzar contenido ([ + Avanzar tema ]) directamente desde la tabla? → A: Avance inteligente en 1 clic (Detecta automáticamente el modo del recurso: si tiene checklist de temas completa el siguiente tema pendiente en orden; si es numérico incrementa en +1 unidad, actualizando el progreso y porcentaje al instante sin modales).
- Q: ¿Cómo deben ordenarse y priorizarse las materias y actividades dentro de la Tabla de Progreso? → A: Prioridad por pendiente de hoy (La tabla sitúa al inicio las materias que aún no tienen check-in completado en la fecha actual para dirigir la atención inmediata del usuario, seguidas de las ya completadas ordenadas por racha activa, complementada con un buscador de texto en tiempo real).
- Q: ¿Cómo debe definirse y asignarse si un objetivo es de "Corto Plazo" o "Largo Plazo"? → A: Selector manual con sugerencia inteligente (El usuario elige directamente en el drawer [ ⚡ Corto Plazo ] o [ 🏔️ Largo Plazo ], con preselección sugerida automática si la fecha límite ingresada es menor o mayor a 30 días, preservando el control final del usuario).
- Q: ¿Cómo deben organizarse y visualizarse los objetivos a Corto y Largo Plazo dentro del Panel (GoalsView)? → A: Pestañas de filtro rápido en los controles (Filtros de horizonte temporal [ Todos ] | [ ⚡ Corto Plazo ] | [ 🏔️ Largo Plazo ] en la barra de controles para filtrar al instante tanto en modo tarjetas como en lista tabular).
- Q: ¿Cómo deben reflejarse las metas a Corto y Largo Plazo en las métricas de la cabecera (Activas, Cumplidas, Avance Promedio)? → A: Métricas dinámicas contextuales (Las tarjetas estadísticas del encabezado se recalculan dinámicamente según el filtro de plazo activo, mostrando en la vista "Todos" el balance global acompañado de un micro-desglose numérico entre corto y largo plazo).
- Q: ¿Debe existir una relación jerárquica opcional entre objetivos (poder vincular un objetivo de Corto Plazo como parte de un objetivo de Largo Plazo)? → A: Vinculación jerárquica opcional (Permite asociar opcionalmente un objetivo de Corto Plazo a un objetivo padre de Largo Plazo para que su cumplimiento tribute a la visión macro, o mantenerlo como objetivo táctico 100% autónomo).
- Q: ¿Cómo debe distinguirse visualmente en la tarjeta (GoalCard) y en la tabla (GoalTable) si una meta es de Corto o Largo Plazo? → A: Estilo híbrido con distinción dorada para metas a largo plazo (Metas de Corto Plazo con badge distintivo [ ⚡ Corto Plazo ] en color cian/esmeralda; metas de Largo Plazo con badge [ 🏔️ Largo Plazo ] acompañado de un matiz de fondo y bordes en color dorado/ámbar resplandeciente para otorgarles una jerarquía estratégica prémium sobresaliente).
- Q: ¿Cómo debe calcularse el porcentaje de progreso global (0-100%) de un objetivo cuando tiene Proyectos, Cursos de Aprendizaje e Hitos vinculados? → A: Promedio automático según componentes presentes (El sistema calcula el porcentaje global como la media equitativa del progreso promedio de los Proyectos vinculados, los Cursos vinculados y los Hitos propios que existan asociados a la meta, adaptándose automáticamente sin requerir pesos manuales).
- Q: ¿Cómo deben visualizarse los Proyectos y Cursos conectados dentro de la tarjeta del objetivo (GoalCard)? → A: Secciones desplegables independientes con enlace directo (Bloques colapsables con acordeón tipo [ Ver proyectos ▼ ] y [ Ver cursos ▼ ], mostrando para cada ítem su título, porcentaje individual, barra de progreso y botón de salto directo al tablero Kanban o al recurso de estudio).
- Q: ¿Dónde y cómo debe poder el usuario vincular Proyectos y Cursos a un Objetivo? → A: Vinculación bidireccional (El GoalDrawer permite seleccionar y enlazar directamente qué Proyectos y Cursos de Aprendizaje pertenecen a la meta mediante selectores visuales, manteniendo al mismo tiempo la capacidad de asociarlos desde las fichas de cada proyecto o recurso individual).
- Q: ¿Cómo debe mostrarse la barra de progreso en la tarjeta del objetivo (GoalCard) para que quede claro de dónde surge el porcentaje? → A: Barra global con chips de desglose multifactorial (Muestra la barra general y el porcentaje consolidado del objetivo, complementada con chips informativos compactos que detallan el avance de cada pilar presente: [ 🚀 Proyectos: X% ] | [ 📚 Aprendizaje: Y% ] | [ 📌 Hitos: Z% ]).
- Q: Cuando todos los proyectos, cursos e hitos vinculados a un objetivo alcanzan el 100% de progreso, ¿cómo debe gestionarse la finalización y el ciclo de vida de la meta? → A: Confirmación con celebración al 100% (La barra llega al 100% y resalta con una insignia o botón de celebración para 'Concluir y archivar objetivo', permitiendo que el usuario celebre el logro y confirme el cierre formal sin que el sistema lo archive abruptamente de forma automática).




## User Scenarios & Testing *(mandatory)*

### User Story 1 - Header Navigation Bar (Navbar) (Priority: P1)
As a user, I want a persistent header at the top of the application to see the application branding ("Aura") and access utility actions (notifications and profile).

**Why this priority**: It is the core branding and anchor element for the application shell.

**Independent Test**: Can load the application on any route and verify the Navbar is present with the correct branding logo on the left, and notification and profile buttons on the right.

**Acceptance Scenarios**:
1. **Given** the user has loaded any application page, **When** they look at the top header, **Then** they MUST see the "Aura" logo on the left and the notification icon and user avatar on the right.
2. **Given** the user has 3 unread notifications, **When** the page loads, **Then** the notification icon MUST display a numeric badge showing "3".
3. **Given** the user has 0 unread notifications, **When** the page loads, **Then** the notification icon MUST NOT show any badge.

---

### User Story 2 - Section Switching TabBar (Priority: P1)
As a user, I want to switch dynamically between Calendar, Goals, Projects, and Events via a tab bar so that I can manage my tasks and events.

**Why this priority**: It is the primary navigation mechanism for the core views of the application.

**Independent Test**: Can click each tab and verify the correct placeholder content renders in the main view area without a full page refresh.

**Acceptance Scenarios**:
1. **Given** the user is viewing the application, **When** they click on the "Objetivos" tab, **Then** the main viewport MUST switch to the Goals section immediately, and the "Objetivos" tab MUST display the active visual highlight.
2. **Given** the user is on the "Proyectos" tab, **When** they reload the page, **Then** the active tab MUST remain "Proyectos" and the viewport MUST load the Projects section.
3. **Given** the user navigates to the "Objetivos" tab, **When** the section renders, **Then** it MUST display the user's active goals showing title, visual progress bar (0-100%), target deadline, category tag, and milestone items.
4. **Given** the user is in the "Objetivos" section, **When** they toggle between Card and List view, **Then** the layout MUST switch immediately while preserving active status and category filters.
5. **Given** the user is in the "Objetivos" section, **When** they click to create or edit a goal, **Then** a slide-over drawer panel MUST open from the right edge allowing them to configure properties, progress mode, and milestone weights without leaving the view.
6. **Given** a goal or milestone has an assigned deadline, **When** the user switches to the "Calendario" tab, **Then** the deadline MUST appear marked on the corresponding date styled with the goal's category color.

---

### User Story 3 - Quick Action Dropdowns (Priority: P2)
As a user, I want to interact with the notification icon and profile avatar to view recent alerts and settings.

**Why this priority**: Enhances utility by providing contextual actions without leaving the current view.

**Independent Test**: Can click on the notification badge and avatar to trigger respective dropdown panels and verify content.

**Acceptance Scenarios**:
1. **Given** the user is on any screen, **When** they click the notification icon, **Then** a dropdown panel MUST open displaying a list of recent notification items.
2. **Given** the user has the notification dropdown open, **When** they click outside the panel, **Then** the dropdown MUST close.
3. **Given** the user is on any screen, **When** they click the avatar, **Then** a profile options menu MUST open containing links for Profile, Settings, and Log Out.
4. **Given** the user opens the notification dropdown, **When** they inspect the header or action controls, **Then** they MUST see an explicit button or toggle to activate Web Push notifications on the current device (laptop or mobile) that only triggers the browser permission dialog upon direct user click.
5. **Given** a user opens the application on iOS Safari outside of standalone PWA mode, **When** inspecting notification options, **Then** the UI MUST show clear guidance explaining how to add the app to the home screen ("Añadir a pantalla de inicio") to enable push alerts.

---

### User Story 4 - Projects Management Hub & Workspace (Priority: P1)
As a user, I want to view a hub of my projects and open a dedicated project workspace with a Kanban board and list view, so that I can organize and track all tasks for each project.

**Why this priority**: Core functionality for the "Proyectos" navigation section.

**Independent Test**: Can navigate to the Projects tab, view a grid of project cards with progress and status, click a project card to enter its workspace, and toggle between Kanban and list views.

**Acceptance Scenarios**:
1. **Given** the user navigates to the "Proyectos" tab, **When** the section renders, **Then** it MUST display a hub grid of project cards showing project title, color identifier, status, and overall progress percentage.
2. **Given** the user is viewing the projects hub, **When** they click on a project card, **Then** the view MUST transition to the project workspace displaying its Kanban board and task management tools.
3. **Given** the user is inside a project workspace, **When** they toggle between Kanban board and task list view, **Then** the view MUST update immediately while retaining the current project context.
4. **Given** the user is inside a project workspace, **When** they click to go back or breadcrumb navigate, **Then** they MUST return to the main projects hub.
5. **Given** the user is viewing a project's Kanban board, **When** they inspect the board columns, **Then** they MUST see exactly three workflow columns: "Por hacer", "En progreso", and "Completado".
6. **Given** a user changes a task status by moving it to "Completado", **When** the change is saved, **Then** the project's overall progress percentage MUST recalculate automatically and update both in the workspace header and on the projects hub card.
7. **Given** a project task, **When** viewed or edited, **Then** it MUST display its title, color-coded priority badge (Baja, Media, Alta), deadline date, and an interactive checklist of subtasks.
8. **Given** a project is linked to an existing Goal, **When** tasks are completed in the project, **Then** the associated Goal displays the linked project and its progress status.
9. **Given** a project task has an assigned deadline date, **When** the user switches to the "Calendario" tab, **Then** the task deadline MUST appear on the calendar date, color-coded with the project's theme color.
10. **Given** the user is on the projects hub or inside a Kanban column, **When** they trigger quick-add, **Then** they can create a project or task immediately with basic info without a full-page modal interrupting their view.
11. **Given** the user clicks to edit full details of a project or task, **When** the action triggers, **Then** a slide-over drawer panel MUST open from the right edge, allowing editing of color, priority, deadline, checklist of subtasks, and goal linkage without leaving the dashboard.
12. **Given** the user is viewing the projects hub, **When** they switch between "Activos", "Completados", and "Archivados" filter pills, or type into the instant search bar, **Then** the projects grid MUST immediately update to show only matching projects without reloading.

---

### User Story 5 - Events Management Hub & Schedule (Priority: P1)
As a user, I want to manage and view my scheduled events (meetings, appointments, deadlines, special dates) with start/end date and time, location/link, and color category, so that I can keep track of all my commitments.

**Why this priority**: Core functionality for the "Eventos" navigation section.

**Independent Test**: Can navigate to the Events tab, view events with details, and see title, date/time, location/link, and category badge.

**Acceptance Scenarios**:
1. **Given** the user is on the "Eventos" tab, **When** viewing an event, **Then** it MUST show the event title, start and end date/time, location or virtual meeting URL, category color badge, and description/notes.
2. **Given** the user is on the "Eventos" tab, **When** the section renders, **Then** events MUST be organized into chronological time blocks ("Hoy", "Esta semana", "Próximos", "Pasados") and allow quick filtering by category tags.
3. **Given** an event has a scheduled date and time, **When** the user switches to the "Calendario" tab, **Then** the event MUST appear on the calendar styled with its category theme color, and the system MUST issue notification alerts prior to event start.
4. **Given** the user clicks to create or edit an event, **When** the action triggers, **Then** a slide-over drawer panel MUST open from the right edge, allowing configuration of full details (dates, times, location/link, category, alerts) without leaving the dashboard.
5. **Given** an event is displayed in the events agenda or slide-over drawer, **When** the user marks it as completed or canceled, **Then** its lifecycle status MUST update immediately to "Completado" or "Cancelado" with appropriate visual styling (e.g. muted contrast or completed indicator) across both the Events section and Calendar view.

---

### User Story 6 - Welcome & Authentication Screen (Priority: P1)
As a visitor or returning user, I want a split screen showing an inspiring visual panel (image and two phrases) and authentication forms (account creation and login), so that I can easily sign up or log in, and upon returning with an active account, enjoy a clean welcome screen with direct one-click entry without re-entering credentials.

**Why this priority**: It is the gateway to the application, providing account creation, secure login, and a friction-free return experience.

**Independent Test**: Can open the app on a fresh session to see both the visual hero panel (image and two phrases) alongside sign up and sign in options; upon creating an account or logging in, returning to the app displays the welcome screen with direct entry and account switching options.

**Acceptance Scenarios**:
1. **Given** a new visitor loads the application, **When** the auth screen renders, **Then** it MUST display a split layout with the first part featuring the hero image and two phrases, and the second part featuring account creation and login forms.
2. **Given** a user has created an account and has an active session, **When** they re-open the application, **Then** the screen MUST display only the welcome section (hero image and two phrases) with a primary button to enter ("Entrar a Aura") and a secondary option to switch accounts or log out.
3. **Given** a user on the welcome screen clicks "Entrar a Aura", **When** the action triggers, **Then** they MUST be routed immediately to the main application navigation without requiring password entry.
4. **Given** a visitor or user without active session views the authentication screen, **When** they click between the "Iniciar Sesión" and "Crear Cuenta" tabs, **Then** the form fields MUST switch immediately without reloading the page, preserving the visual split layout.
5. **Given** a user fills the registration form, **When** they provide a valid username, email, and matching password confirmation, **Then** the account MUST be created, logging the user in and routing them to the application while recording session persistence.
6. **Given** a registered user on the login tab, **When** they submit valid credentials (username or email plus password), **Then** authentication MUST succeed and route to the main application navigation.
7. **Given** a user opens the welcome or authentication screen on a mobile viewport, **When** the page renders, **Then** the layout MUST stack vertically into a single column showing the visual hero block at the top and the interactive form/button block below without horizontal overflow.
8. **Given** a user clicks "Cerrar sesión" from the profile dropdown menu or "Cambiar de cuenta" from the welcome screen, **When** the action triggers, **Then** the active session MUST be cleared and the screen MUST restore the complete split layout displaying the visual hero block alongside the toggleable authentication tabs ("Iniciar Sesión" and "Crear Cuenta").

---

### User Story 6 - Learning & Knowledge Management Hub (Aprendizaje) (Priority: P2)
As a user managing multiple courses, books, technical articles, and technology documentation, I want a dedicated "Aprendizaje" tab to track all my learning activities with modular and direct progress, continuity details, inactivity alerts, and calendar study sessions, so that I never forget or abandon what I set out to learn.

**Why this priority**: Solves the core user problem of course abandonment, fragmented learning sources, and lost progress context across platforms.

**Independent Test**: Can navigate to the "Aprendizaje" tab, create a learning resource (course, book, article, or tech documentation), update progress, view dormancy/inactivity warning badges, open its slide-over drawer to view notes/topics, schedule a study session on the Calendar, and receive Web Push alerts upon inactivity.

**Acceptance Scenarios**:
1. **Given** the user is viewing the application navigation, **When** they click the "Aprendizaje" tab in the TabBar, **Then** the main viewport MUST switch to the Learning Hub displaying learning state groups ("Por empezar", "En curso", "En pausa", "Completado"), resource type filters (Cursos, Libros, Artículos, Documentación), and a real-time search input.
2. **Given** a learning item in "En curso" has had no recorded progress for 5 or more days, **When** the learning hub renders, **Then** the card MUST display a visual dormancy warning badge indicating days of inactivity, and the background scheduler MUST issue a Web Push notification to prompt the user.
3. **Given** the user is inspecting a learning item, **When** they click on the card, **Then** a slide-over drawer MUST open from the right edge showing the direct platform link, last reached point (module/page), markdown key takeaways notes, and an interactive module checklist.
4. **Given** a user is configuring a learning item, **When** they click "Agendar sesión de estudio", **Then** the system MUST create an event in the Calendar styled with the resource's theme color, scheduled start/end times, and a 15-minute advance Web Push reminder.
5. **Given** a user updates an item's progress (either by ticking off modular topics or entering a direct percentage/page count), **When** saved, **Then** the item's progress bar and last activity timestamp MUST update immediately in the UI.
6. **Given** a learning item is optionally linked to a Goal, **When** progress on the learning item is updated, **Then** it MUST reflect on the associated Goal's progress tracking.

### User Story 7 - Daily Check-in & Consistency Tracking (Listo Hoy & Racha) (Priority: P1)
As a user with ongoing study activities and long-term courses, I want to mark "Listo hoy" on my daily sessions and track my consistency streak without prematurely completing the entire multi-week course, so that I maintain regular study habits and clearly see my progress over time.

**Why this priority**: Solves the core user frustration of courses being closed prematurely by "Completar" when they only wanted to log today's study session.

**Independent Test**: Can schedule a study activity spanning multiple days, click "✓ Listo hoy" on the "Hoy" event card or weekly calendar column, verify that today's session is marked complete with a green badge and increases the streak, while the event remains active for future days. Clicking the badge again cleanly reverts the check-in.

**Acceptance Scenarios**:
1. **Given** a study event or multi-day activity is scheduled for today, **When** viewing the event card in "Hoy", **Then** the primary action displayed MUST be "✓ Listo hoy".
2. **Given** the user clicks "✓ Listo hoy", **Then** the card MUST immediately display a green "✓ Realizado hoy" badge, record the check-in for the current date, and increment the user's active streak (🔥) in under 50ms without closing the parent event.
3. **Given** a session has been marked as "✓ Realizado hoy", **When** the user clicks the check-in control again, **Then** the system MUST revert the check-in, restore the pending state, and decrement the streak counter accordingly.
4. **Given** the user is viewing the weekly calendar view ("Modo Agrandador"), **When** inspecting the day's column, **Then** study session cards MUST display a single-click check-in control allowing the user to mark attendance directly from the calendar.
5. **Given** a user wishes to configure their streak tracking, **When** inspecting settings or consistency options, **Then** they MUST be able to choose between consecutive daily streaks per individual course or a weekly frequency target (completed days per week).
6. **Given** the user wishes to conclude an entire multi-week course or event permanently, **When** accessing the event options or details, **Then** an explicit secondary action ("Concluir evento definitivamente") MUST be available to finalize the item without confusing it with the daily check-in.

### User Story 8 - Activity Progress & Habits Matrix (Tabla de Progreso y Hábitos) (Priority: P1)
As a user studying multiple ongoing courses and subjects, I want a centralized progress and habits table where I can simultaneously monitor my daily consistency streak, see my weekly attendance (Monday to Sunday), and track my module/topic completion with 1-click quick advancement actions, so that I maintain strong study discipline without losing context of where I left off.

**Why this priority**: Solves the user's explicit need for "una tabla o elemento que pueda ver el progreso" combining consistency habits and module progression in one place.

**Independent Test**: Can open the Learning section, switch to "Matriz de Progreso", verify all active courses and study events appear sorted by today's pending status, click "✓ Listo hoy" to toggle today's checkmark on the Monday-Sunday weekly matrix, click "+ Avanzar tema" to immediately complete the next pending topic, and use the calendar shortcut to jump to the table.

**Acceptance Scenarios**:
1. **Given** the user is in the "Aprendizaje" section, **When** they toggle the view selector to "Matriz de Progreso", **Then** the view MUST display the comprehensive tabular matrix of active learning courses and scheduled study events.
2. **Given** the user is viewing the weekly calendar, **When** they click the "Ver Tabla de Progreso" shortcut button, **Then** the application MUST transition to the Aprendizaje tab with the "Matriz de Progreso" mode active.
3. **Given** an activity row in the matrix, **When** viewing the weekly attendance column, **Then** it MUST display 7 day indicators (Lun-Dom) with checkmarks for days attended, highlighting today's column, and providing "←" "→" controls to inspect previous weeks.
4. **Given** an activity row in the matrix, **When** the user clicks "+ Avanzar tema", **Then** the system MUST complete the next pending topic in order (or increment +1 unit for numeric items) and update the progress bar in under 50ms without opening popups.
5. **Given** multiple courses are loaded in the matrix, **When** rendering the table, **Then** items pending today's check-in MUST appear at the top, followed by completed items ordered by active streak length.

### User Story 9 - Short-Term vs Long-Term Strategic Goals (Objetivos a Corto y Largo Plazo) (Priority: P1)
As a user tracking both strategic personal development goals and tactical immediate targets, I want to clearly distinguish and filter between Short-Term and Long-Term goals, with distinct visual badges and a golden highlight for long-term visions, so that I can focus on immediate milestones without losing track of my big picture.

**Why this priority**: Solves the problem of tactical tasks and long-term milestones cluttering the same view without temporal differentiation.

**Independent Test**: Can open the Goals view, filter by "Corto Plazo" or "Largo Plazo", create a goal with smart deadline suggestion, view dynamic header metrics adapting to the selected horizon, and see long-term goal cards highlighted with an amber/gold border and subtle ambient glow.

**Acceptance Scenarios**:
1. **Given** the user is in the "Objetivos" section, **When** they click the "Corto Plazo" or "Largo Plazo" filter pill, **Then** the view MUST immediately filter the visible goal cards or table rows, updating header metrics to match the filtered subset.
2. **Given** the user is creating or editing a goal in the drawer, **When** entering a deadline date, **Then** the system MUST automatically suggest either "Corto Plazo" (<30 days) or "Largo Plazo" (>30 days), while preserving the user's ability to override with a single click.
3. **Given** a goal classified as "Largo Plazo", **When** rendered in the card grid or table, **Then** it MUST display a "🏔️ Largo Plazo" badge and a distinctive golden/amber border accent with subtle ambient background tint.
4. **Given** a goal classified as "Corto Plazo", **When** creating or editing the goal, **Then** the user MAY optionally select an existing Long-Term goal as its parent objective to link tactical execution to a broader vision.

### User Story 10 - Connected Goals Progress & Alignment (Conexión de Objetivos con Proyectos y Aprendizaje) (Priority: P1)
As a user tracking strategic goals that rely on concrete execution, I want my goals to dynamically reflect progress from linked Projects and Learning courses alongside Milestones, displaying collapsible breakdown sections, multi-factor progress chips, bidirectional linkage, and a celebration badge upon reaching 100%, so that my everyday task and study execution directly drives my high-level objectives.

**Why this priority**: Solves the disconnection between tactical daily execution (Kanban projects, course completion) and strategic goals, eliminating manual synchronization and providing a unified view of accomplishment.

**Independent Test**: Can link projects and learning courses to a Goal in the drawer or item card, advance project tasks or course topics, verify that the goal's overall progress recalculates automatically as the equitable average of present components, inspect the collapsible "Proyectos" and "Cursos" accordions with deep links in the GoalCard, see the multi-factor progress chips, and verify that reaching 100% displays the celebration badge with a prompt to confirm conclusion and archive.

**Acceptance Scenarios**:
1. **Given** a goal with linked projects, learning courses, and/or milestones, **When** progress advances in any linked item, **Then** the goal's overall progress percentage MUST recalculate automatically as the equitable average of the present component categories without requiring manual weighting.
2. **Given** a GoalCard rendered in the Goals view, **When** inspected, **Then** it MUST display collapsible accordion sections for linked "🚀 Proyectos (X)" and "📚 Cursos (Y)" showing each item's title, individual progress bar, percentage, and 1-click navigation links to its Kanban workspace or study resource.
3. **Given** a GoalCard with multiple linked components, **When** displaying the consolidated progress bar, **Then** it MUST include compact multi-factor chips detailing the individual category averages (e.g. `[ 🚀 Proyectos: X% ]`, `[ 📚 Aprendizaje: Y% ]`, `[ 📌 Hitos: Z% ]`).
4. **Given** the user is creating or editing a Goal in GoalDrawer, **When** configuring links, **Then** they MUST be able to select and link multiple Projects and LearningItems directly from the drawer (bidirectional association).
5. **Given** all linked projects, courses, and milestones reach 100% progress, **When** viewing the goal, **Then** it MUST display a celebration badge and explicit confirmation control ("🎉 ¡Meta alcanzada! Concluir y archivar objetivo") allowing the user to celebrate the achievement and confirm formal closure and archiving without abrupt automatic closure.

---

## Edge Cases



- **Mobile Viewports**: On narrow screens, the TabBar horizontal text might overflow. The system MUST render it cleanly (e.g. using horizontal swipe or compact icons with text).
- **Mobile Auth Layout**: On narrow viewports (<768px), the split screen MUST collapse from side-by-side columns into a single vertical stack, scaling the hero image proportionally so that all inputs and action buttons remain comfortably accessible without zoom or clipped elements.
- **Extremely High Notification Counts**: If the user has more than 99 notifications, the badge MUST display "99+" instead of wrapping or breaking the layout.
- **Daily Check-in on Multi-day Activities**: Marking "Listo hoy" MUST NOT complete, cancel, or archive the parent multi-day event or learning resource; all subsequent dates within the range MUST remain active and visible in the schedule.
- **Accidental Click Reversal**: If the user marks "Listo hoy" by mistake, clicking the control again MUST immediately revert the check-in and recalculate the streak without page refresh or blocking dialogs.

- **Lost Connectivity**: If the application fails to fetch the latest notifications count, the badge SHOULD fail silently without displaying corrupt text or breaking the header layout.

## Requirements *(mandatory)*

### Functional Requirements
- **FR-001**: The system MUST render the main header (Navbar) at the top of all views.
- **FR-002**: The Navbar MUST display the branding logo "Aura" on the left with a colorful, high-visual-contrast design.
- **FR-003**: The Navbar MUST display a notification icon on the right, which shows a numeric badge of unread notifications.
- **FR-004**: The Navbar MUST display a user avatar on the right representing the logged-in user.
- **FR-005**: The TabBar MUST be displayed directly below the Navbar, containing five distinct navigation tabs: "Calendario", "Objetivos", "Proyectos", "Eventos", and "Aprendizaje".
- **FR-006**: Clicking any tab MUST dynamically switch the content in the main viewport to the corresponding section without full page reloads.
- **FR-007**: The active tab MUST be visually highlighted using a distinct color state to indicate the current section to the user.
- **FR-008**: The system MUST persist the active tab state locally to maintain the user's location upon page refresh.
- **FR-009**: Clicking the notification icon MUST toggle a notification dropdown panel.
- **FR-010**: Clicking the user avatar MUST toggle a user settings dropdown menu.
- **FR-011**: The "Objetivos" section MUST allow users to view and manage goals defined with measurable progress (0-100%), target deadline, category tag, and milestone items.
- **FR-012**: The "Objetivos" section MUST support two progress tracking modes configurable per goal: manual percentage adjustment (0-100%) or automatic milestone-based calculation.
- **FR-013**: In automatic milestone mode, the progress MUST calculate equally across milestones by default, while supporting optional custom weighting/values per milestone.
- **FR-014**: The "Objetivos" section MUST display visual progress bars for each goal, reflecting completion percentage and status.
- **FR-015**: The "Objetivos" section MUST provide a view switcher allowing users to toggle between a visual card grid and a compact list/table view.
- **FR-016**: The "Objetivos" section MUST support filtering goals by status (All, Active, Completed, Paused) and by category tags across both view modes.
- **FR-017**: The "Objetivos" section MUST provide a slide-over drawer from the right edge for creating and editing goals without navigating away from the dashboard.
- **FR-018**: The slide-over drawer MUST allow managing milestones (add, edit title, mark complete, remove) and assigning custom weights/values when in milestone progress mode.
- **FR-019**: Goals and dated milestones MUST automatically project onto the "Calendario" section as deadline markers, styled using the goal's category theme color.
- **FR-020**: The system MUST support configurable deadline reminders for Goals (at exact deadline, 15 min, 1 hour, or 1 day before via `reminder_minutes`), issuing in-app notifications and Web Push alerts. Reminders MUST be automatically suppressed if the Goal is in `COMPLETED` or `PAUSED` status.
- **FR-021**: The "Proyectos" section MUST display a projects hub showing cards for each project with title, color identifier, status, and overall task completion progress.
- **FR-022**: Selecting a project card MUST open a dedicated project workspace featuring an interactive Kanban board and a toggleable task list view.
- **FR-023**: The project workspace MUST support returning to the projects hub via breadcrumb or back navigation.
- **FR-024**: The project workspace Kanban board MUST provide three fixed workflow columns: "Por hacer", "En progreso", and "Completado".
- **FR-025**: Tasks within a project MUST support title, description, color-coded priority level (Baja, Media, Alta), optional deadline date and time (`datetime-local`) with local timezone formatting, configurable reminder offset (`reminder_minutes`), and an embedded checklist of subtasks.
- **FR-026**: The system MUST automatically calculate each project's overall progress percentage as `(completed tasks / total tasks) * 100`, updating the progress bar in real time upon task status changes.
- **FR-027**: When all tasks in a project are in the "Completado" column, the project's progress MUST display 100%. If a project has zero tasks, its progress MUST default to 0%.
- **FR-028**: Projects MAY be optionally linked to an existing `Goal`, allowing users to connect project execution directly to overarching goals.
- **FR-029**: Project tasks with assigned deadline dates MUST automatically project onto the "Calendario" section, styled using the parent project's theme color.
- **FR-030**: The system MUST issue notification alerts and Web Push dispatches when a project task deadline is approaching (based on configured `reminder_minutes` or due threshold) or overdue. Reminders MUST be automatically suppressed if the Task is in `DONE` status.
- **FR-031**: The projects hub and project workspace MUST support quick creation triggers for adding new projects and tasks with minimal input friction.
- **FR-032**: Detailed inspection and editing of projects and project tasks MUST utilize a slide-over drawer panel emerging from the right viewport edge, preserving view context.
- **FR-033**: The projects hub MUST provide quick-filter status pills for "Activos" (default), "Completados", and "Archivados" to control which project lifecycle state is currently displayed.
- **FR-034**: The projects hub MUST include an instant, real-time search input that filters project cards by title or category tags as the user types.
- **FR-035**: The "Eventos" section MUST allow users to manage flexible schedule events (meetings, appointments, deadlines, special dates) including title, start date/time, end date/time, physical location or virtual URL link, color-coded category tag, and notes/description.
- **FR-036**: The "Eventos" section MUST organize events into chronological time blocks ("Hoy", "Esta semana", "Próximos", "Pasados") displayed as visual cards with category theme colors, and provide quick filters by category tags.
- **FR-037**: Events with scheduled dates and times MUST automatically project onto the "Calendario" section, styled with their category theme color.
- **FR-038**: The system MUST issue notification alerts when an event start time is approaching.
- **FR-039**: The "Eventos" section MUST provide quick-creation triggers and a slide-over drawer panel emerging from the right edge for inspecting, creating, and editing full event details.
- **FR-040**: Events MUST support three lifecycle states: "Programado" (default), "Completado", and "Cancelado", providing quick-action controls in the event card and slide-over drawer to transition states with instant visual feedback.
- **FR-041**: The backend MUST execute a lightweight in-process background task scheduler (evaluating at intervals of 1 to 5 minutes) to detect upcoming event reminders, approaching goal deadlines (with configurable reminder offsets), and approaching/overdue task deadlines, generating notification records and dispatching encrypted Web Push payloads via `pywebpush` without requiring external queue brokers.
- **FR-042**: The system MUST support multi-device push notifications per user (1:N relationship between User and PushSubscription), allowing concurrent registrations from laptops and mobile devices, and MUST automatically prune/delete expired or invalid subscription records upon receiving HTTP 410 (Gone) or 404 (Not Found) responses from push services.
- **FR-043**: The frontend application MUST provide a Progressive Web App (PWA) manifest and a dedicated Service Worker configured primarily for PWA installation and Web Push event handling (`push`, `notificationclick`), utilizing a Network-First strategy for API communications to avoid stale data conflicts with real-time tasks and events.
- **FR-044**: Upon user interaction with a Web Push notification (`notificationclick`), the Service Worker MUST detect whether an active application window or tab is already open, focusing the existing window if present or opening a new window if closed, and route directly to the relevant contextual item (event, task, or goal) indicated in the push notification payload.
- **FR-045**: The application MUST NOT prompt for notification permissions automatically upon initial page load; instead, it MUST provide an explicit user-facing activation control (e.g. within the notification dropdown or user settings) triggered by direct user gesture, and display contextual onboarding guidance (instructing to "Añadir a pantalla de inicio") if an iOS device is detected running outside of standalone PWA mode.
- **FR-046**: The system MUST provide an initial screen divided into two primary visual parts: the first part containing a hero image and two phrases/quotes, and the second part containing forms to create an account (Sign Up) and log in (Sign In).
- **FR-047**: For returning users with an existing account / active session, the system MUST display only the welcome section (hero image and two phrases) featuring a primary button to enter the application ("Entrar a Aura") and a secondary option to switch accounts or sign out, without prompting for login credentials again.
- **FR-048**: The authentication panel MUST feature toggleable tabs ("Iniciar Sesión" and "Crear Cuenta") in its header, allowing immediate switching between login and registration forms with local state transition.
- **FR-049**: The account creation form MUST require a unique username, valid email address, password, and password confirmation with client-side and server-side validation against mismatched passwords.
- **FR-050**: The login form MUST allow authentication using either the registered username or email address along with the password.
- **FR-051**: The system MUST render the welcome and authentication layout using a responsive two-column grid on desktop/tablet viewports and automatically collapse into a stacked single-column layout on mobile viewports.
- **FR-052**: Triggering a logout action from the profile dropdown or clicking "Cambiar de cuenta" from the welcome screen MUST clear local session credentials and transition the view back to the complete split screen displaying the hero banner alongside the authentication form tabs.
- **FR-053**: The system MUST provide an "Aprendizaje" section accessible via the TabBar to manage courses, books, technical articles, and technology documentation.
- **FR-054**: The "Aprendizaje" section MUST categorize resources by learning states: "Por empezar / En cola", "En curso", "En pausa", and "Completado".
- **FR-055**: The "Aprendizaje" section MUST support dual view modes: a visual card grid and a compact list view, complemented by an instant search input and quick-filter pills by source type (Cursos, Libros, Artículos, Documentación de Tecnología).
- **FR-056**: Each learning resource MUST support hybrid progress tracking configurable per item: either automatic calculation based on modular checklist topics completed, or direct input of numeric/percentage progress and pages read.
- **FR-057**: The system MUST detect inactivity on active learning resources ("En curso"), displaying a visual dormancy badge on cards with 5+ days without recorded progress, and dispatching Web Push notifications prompting the user to resume learning.
- **FR-058**: The "Aprendizaje" section MUST provide a slide-over drawer emerging from the right edge for inspecting and editing resource details, including direct resource URL ("Abrir recurso"), "Último punto alcanzado" (module, page, or section), Key Takeaways notes in Markdown, and an interactive checklist of modular topics.
- **FR-059**: The slide-over drawer and item card MUST provide an "Agendar sesión de estudio" action that creates an `EventItem` in the "Calendario" section styled with the resource's theme color, scheduled start/end times, direct URL link, and a 15-minute advance Web Push reminder.
- **FR-060**: Learning resources MAY be optionally linked to an existing `Goal` or `Project`, allowing progress on the learning resource to automatically feed into the associated Goal's progress or Project execution.
- **FR-061**: The background scheduler MUST evaluate dormancy on learning items alongside existing task and goal reminders, suppressing inactivity alerts if the resource is in "En pausa" o "Completado" status.
- **FR-062**: The "Eventos" (bloque "Hoy") and "Calendario" (modo agrandador semanal) sections MUST provide a "✓ Listo hoy" daily check-in action for study sessions and multi-day activities, recording daily completion for the current date without prematurely closing or canceling the overall multi-day event or course.
- **FR-063**: Clicking "✓ Listo hoy" MUST operate as an instant, reversible single-click toggle with immediate visual feedback (green badge "✓ Realizado hoy"), updating the user's streak in real time without blocking confirmation modals. Clicking the control again MUST undo the check-in and restore the previous state.
- **FR-064**: The system MUST support a dual consistency tracking mode configurable by the user: either tracking consecutive daily streaks (Streak 🔥) per individual course/activity, or tracking a weekly frequency target of completed days across the active week.
- **FR-065**: Event cards in the "Hoy" block MUST implement a clear visual hierarchy where "✓ Listo hoy" is the prominent primary daily action, while permanently concluding the entire course or multi-week activity ("Concluir evento definitivamente") is maintained as an explicit secondary action.
- **FR-066**: The "Aprendizaje" section MUST provide a view mode selector allowing users to switch dynamically between Kanban board, simple list, and the "Matriz de Progreso y Hábitos" (`ActivityProgressMatrix`).
- **FR-067**: The "Calendario" section MUST provide a direct quick-link action button in its control header ("Ver Tabla de Progreso") that immediately navigates to the "Matriz de Progreso" view in the Aprendizaje section.
- **FR-068**: The "Matriz de Progreso" MUST list active learning resources alongside scheduled study events from the Calendar, displaying columns for: Activity Name/Platform, Consistency Streak (🔥), Weekly Matrix (Lun-Dom with attendance checkmarks and week stepper "←" "→"), Content Progress bar (completed vs pending units/topics), and instant actions (`[ ✓ Listo hoy ]` and `[ + Avanzar tema ]`).
- **FR-069**: Clicking `[ + Avanzar tema ]` in the progress matrix MUST automatically complete the next pending modular topic (for topic-based resources) or increment unit count by +1 (for numeric resources) in a single click without opening dialogs, immediately recalculating progress percentage.
- **FR-070**: The "Matriz de Progreso" MUST prioritize activities pending completion today at the top of the list, followed by completed items ordered by active streak length, complemented by an instant real-time search filter.
- **FR-071**: The "Objetivos" section MUST classify goals into two time horizons: "Corto Plazo" (`SHORT_TERM`) and "Largo Plazo" (`LONG_TERM`), supporting manual selection with automatic date-based preselection (<30 days vs >30 days).
- **FR-072**: The "Objetivos" section MUST provide quick-filter pills in the controls bar: `[ Todos ]`, `[ ⚡ Corto Plazo ]`, and `[ 🏔️ Largo Plazo ]`, immediately filtering both Card and List views.
- **FR-073**: The "Objetivos" header stats counter (Activas, Cumplidas, Avance Promedio) MUST dynamically recalculate to reflect the selected time horizon filter, and display a micro-breakdown count when viewing "Todos".
- **FR-074**: Short-Term goals MAY be optionally linked to an existing Long-Term parent goal (`parent_goal`), establishing a hierarchical relationship without breaking standalone short-term goals.
- **FR-075**: Goal cards and table rows MUST visually distinguish time horizons: Short-Term goals display a cyan/emerald `⚡ Corto Plazo` badge; Long-Term goals display a `🏔️ Largo Plazo` badge accompanied by a distinctive golden/amber border accent and subtle ambient background tint.
- **FR-076**: The system MUST automatically calculate a Goal's overall progress percentage as the equitable average of all present linked components (average of linked Projects, average of linked LearningItems, and average of GoalMilestones). If a component type has no linked items, it MUST NOT penalize the calculation.
- **FR-077**: Goal cards in the "Objetivos" section MUST display collapsible accordion sections for linked Projects (`🚀 Proyectos (X)`) and linked Learning resources (`📚 Cursos (Y)`), showing individual completion percentages, visual progress bars, and direct 1-click navigation links to their workspace or resource card.
- **FR-078**: The GoalCard progress display MUST include compact multi-factor chips below the consolidated progress bar displaying individual component averages (e.g., `[ 🚀 Proyectos: X% ]`, `[ 📚 Aprendizaje: Y% ]`, `[ 📌 Hitos: Z% ]`) when multiple component types are linked.
- **FR-079**: The system MUST support bidirectional linkage between Goals, Projects, and LearningItems, allowing users to link or unlink Projects and Learning items directly within `GoalDrawer` as well as from their individual item detail drawers.
- **FR-080**: When a Goal's calculated progress reaches 100%, the UI MUST display a celebration badge and explicit confirmation control ("🎉 ¡Meta alcanzada! Concluir y archivar objetivo") allowing the user to mark the goal as `COMPLETED` and archive it, while preserving the active state until explicit user confirmation.

### Key Entities
- **UserSession**: Represents the currently logged-in user, exposing username, email, avatar image URL, auth state, and session persistence status.
- **Notification**: Represents a single notification item, with properties for read/unread state and creation timestamp.
- **PushSubscription**: Represents an active Web Push subscription device associated with a User (1:N), storing the endpoint URL, cryptographic keys (`p256dh`, `auth`), user agent metadata, and registration timestamp.
- **NavigationSection**: Represents a valid section tab (Calendar, Goals, Projects, Events, Learning).
- **Goal**: Represents an objective with title, target deadline, reminder_minutes (configurable alert offset: 0, 15, 60, 1440 mins), category tag, progress mode (`Manual`, `MilestoneBased`, or `Connected`), progress percentage (0-100%), status (Active, Completed, Paused), time_horizon (`SHORT_TERM` or `LONG_TERM`), optional parent_goal link, linked projects, and linked learning items.
- **GoalMilestone**: Represents a key checkable milestone or sub-target associated with a Goal, including title, completion state, and an optional weight value.
- **Project**: Represents a project with title, description, color theme/tag, lifecycle status (`Active`, `Completed`, `Archived`), calculated overall task progress (0-100%), and an optional foreign link to a `Goal`.
- **ProjectTask**: Represents a task within a project, belonging to one of three workflow columns (`ToDo`, `InProgress`, `Done`), with title, description, priority (`Low`, `Medium`, `High`), deadline datetime, reminder_minutes (configurable alert offset: 0, 15, 60, 1440 mins), and an ordered list of subtasks.
- **TaskSubtask**: Represents a checkable subtask item within a `ProjectTask`, with title and completion state.
- **EventItem**: Represents an event with title, description/notes, start datetime, end datetime, location or virtual meeting URL, color category tag, and lifecycle status (`Programado`, `Completado`, `Cancelado`).
- **LearningItem**: Represents a learning resource (course, book, article, technology documentation) with title, resource_type (`COURSE`, `BOOK`, `ARTICLE`, `TECH_DOC`), platform_url, status (`BACKLOG`, `IN_PROGRESS`, `PAUSED`, `COMPLETED`), progress_mode (`MANUAL`, `TOPICS`), progress_percentage (0-100), current_unit, total_units, last_point_reached, takeaways_markdown, last_activity_at, optional link to `Goal`, and optional link to `Project`.
- **LearningTopic**: Represents a checkable modular topic or chapter within a `LearningItem`, with title, completion state, order, and optional section grouping.
- **ActivityCheckIn**: Represents a completed daily session for a specific user, date, and associated learning item or study event item, storing completion status, streak counter metadata, and timestamps.

## Success Criteria *(mandatory)*

### Measurable Outcomes
- **SC-001**: Users can switch between sections via the TabBar with no visible delay, updating the view in under 100 milliseconds.
- **SC-002**: The layout is responsive, displaying correctly on mobile, tablet, and desktop viewports without horizontal scrolling or overlapping text.
- **SC-003**: The color coding for the active tab and notification badge is accessible, maintaining a minimum color contrast ratio of 4.5:1.
- **SC-004**: 100% of users can successfully find and access the primary views (Calendario, Objetivos, Proyectos, Eventos, Aprendizaje) within their first 5 seconds of interaction.
- **SC-005**: Returning users with an active session can access the main dashboard from the welcome screen in under 1 second with a single click on "Entrar a Aura" without re-entering credentials.
- **SC-006**: Users can access their active course platform or document in 1 click from the learning card or drawer, and schedule a study session event on the Calendar in under 3 clicks.
- **SC-007**: Users can complete their daily study check-in in 1 single click (<50ms local UI response) from either the "Hoy" event card or the weekly calendar column, instantly reflecting updated streak status.
- **SC-008**: Users can view their entire weekly consistency grid and advance a module or mark a daily check-in in under 1 click from the progress matrix, with state updating in less than 50ms.
- **SC-009**: Users can filter between Short-Term and Long-Term goals in under 1 click with instantaneous view updates (<50ms).
- **SC-010**: Users can inspect linked projects and courses directly inside a Goal card in under 1 click, and see recalculated goal progress in under 50ms upon updating any linked project task or course unit.




## Assumptions

- We assume that "Aura" is the project name or main product brand.
- The design of the active tab and notification badge will utilize the project's color palette (defined in the constitution as "Colorido y Altamente Visual").
- User profile data and notification count will be loaded upon application startup.
- The visual hero panel in the welcome/auth screen will initially use a vibrant, colorful placeholder illustration and inspirational productivity phrases aligned with Aura's brand identity until the user provides final assets.
