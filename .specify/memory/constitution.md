<!--
SYNC IMPACT REPORT
- Version change: 1.0.0 -> 1.1.0
- List of modified principles:
  - II. Rendimiento Ultra Rápido (updated backend caching context from Redis to Django/SQLite)
- Added sections:
  - Arquitectura de Capas
- Removed sections: None
- Templates requiring updates:
  - .specify/templates/plan-template.md (✅ updated)
  - .specify/templates/spec-template.md (✅ updated)
  - .specify/templates/tasks-template.md (✅ updated)
- Follow-up TODOs: None
-->

# Gestor de Tareas Constitution

## Core Principles

### I. Colorido y Altamente Visual
La interfaz de usuario MUST utilizar de forma consistente y estructurada una paleta de colores bien definida para categorizar y diferenciar prioridades de tareas, estados de proyectos y categorías de eventos. Se MUST evitar la saturación visual limitando el uso de colores intensos a elementos clave de interactividad e información crítica, utilizando psicología del color para mejorar la experiencia del usuario.
*Razón*: El uso estratégico del color reduce la carga cognitiva y optimiza la lectura rápida de la interfaz por parte del usuario.

### II. Rendimiento Ultra Rápido
Toda acción del usuario en el frontend MUST completarse de forma inmediata en la interfaz mediante gestión de estado local eficiente (vía React Context o Zustand) y optimización de renderizados en React. En el backend, las consultas MUST estar optimizadas y se SHOULD emplear mecanismos de caché eficientes en Django para garantizar tiempos de respuesta mínimos.
*Razón*: Minimizar la latencia y la sobrecarga del servidor asegura una experiencia de usuario sumamente fluida y profesional.

### III. Modularidad Estricta
El código base MUST estar organizado bajo un esquema estricto de separación de responsabilidades, donde el frontend y el backend estén completamente desacoplados. Cada componente y servicio MUST tener una única responsabilidad clara, facilitando las pruebas aisladas y evitando dependencias circulares.
*Razón*: Un sistema modular y limpio es escalable, reduce la introducción de errores colaterales y simplifica el mantenimiento futuro.

## Stack Tecnológico y Estándares
Este proyecto se construirá utilizando React + Vite + TypeScript para la interfaz de usuario, y Django para el backend, utilizando SQLite como base de datos para desarrollo/maquetación rápida. Se utilizará CSS puro para los estilos visuales para garantizar el máximo rendimiento y control estético.

## Arquitectura de Capas
La estructura del software se divide estrictamente de la siguiente manera:

### Backend (Django)
- **API (Views/Controllers)**: Puntos de entrada HTTP (REST) que reciben las peticiones, gestionan la autenticación y manejan los códigos de respuesta.
- **Serialización (Serializers)**: Validación de datos de entrada y transformación de objetos complejos/Modelos a formato JSON (y viceversa).
- **Servicio (Services/Business Logic)**: Capa pura de lógica de negocio. Aquí se procesan las reglas de Aura y se interactúa con servicios externos (como OpenAI GPT-4o-mini).
- **Persistencia (Models/Repositories)**: Definición de esquemas de datos e interacción directa con la base de datos de Django (SQLite para desarrollo/maquetación rápida).

### Frontend (React + Vite + TypeScript)
- **Interfaz de Usuario (UI Components)**: Componentes visuales y presentacionales (vistas de calendario, botones, formularios, barras de navegación).
- **Gestión de Estado (State Management)**: Almacenamiento local de los datos de la aplicación (vía React Context o Zustand) para sincronización entre secciones.
- **Servicios (API Client/Infrastructure)**: Módulos encargados de realizar las peticiones HTTP (fetch o axios) hacia el Backend.
- **Dominio (Domain/Types)**: Definición de interfaces y tipos de TypeScript que representan las entidades del negocio (Metas, Eventos, Actividades).

## Control de Calidad y Pruebas
Se requiere que todo código nuevo incluya pruebas de unidad y pruebas de integración para asegurar que los componentes funcionen correctamente y no existan regresiones de rendimiento o modularidad.

## Governance
- La Constitución es el documento supremo del proyecto y prevalece sobre cualquier práctica no documentada.
- Las enmiendas requieren documentación explícita, actualización de la versión y fecha de última modificación, y aprobación formal.
- Todos los Pull Requests y revisiones de código MUST verificar la conformidad con esta Constitución.
- Cualquier complejidad técnica introducida MUST justificarse explícitamente en la sección de Complexity Tracking del plan de implementación.
- Utilice `README.md` como guía para el desarrollo y ejecución del proyecto en tiempo de ejecución.

**Version**: 1.1.0 | **Ratified**: 2026-07-03 | **Last Amended**: 2026-07-03
