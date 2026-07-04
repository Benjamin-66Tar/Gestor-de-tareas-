# Technical Research: Navigation Layout & Core Architecture

## 1. State Management: Zustand vs. React Context

### Decision
Use **Zustand** as the primary state management library for the frontend.

### Rationale
- **Performance**: Zustand does not suffer from the context loss or unnecessary re-render issues inherent in React Context. Components only re-render when the specific selected state slices change, supporting the "Rendimiento Ultra Rápido" principle.
- **Simplicity**: Extremely minimal boilerplate compared to Redux, and simpler than React Context which requires Providers wrapping the component tree.
- **Developer Experience**: Seamless integration with TypeScript, providing strong typing out-of-the-box.

### Alternatives Considered
- **React Context**: Rejected because it triggers a re-render of all consumer components when any part of the context value changes, unless heavily optimized.
- **Redux Toolkit**: Too heavy and verbose for the current scope of the task manager.

---

## 2. API Layer: Django REST Framework (DRF) vs. Vanilla Django Views

### Decision
Use **Django REST Framework (DRF)** for building REST APIs.

### Rationale
- **Validation**: DRF Serializers provide structured validation of input data and clear serialization rules.
- **Ecosystem**: DRF is the industry standard for REST APIs in Django, offering excellent authentication, permission, and pagination tools.
- **Documentation**: Built-in support for OpenAPI generation and clean browsable APIs.

### Alternatives Considered
- **Vanilla Django `JsonResponse`**: Rejected because manual serialization and validation of complex models increases code clutter and susceptibility to bugs.

---

## 3. Caching Layer: Django Caching with Redis

### Decision
Use the **`django-redis`** package to configure Redis as Django's cache backend.

### Rationale
- **Standard**: `django-redis` is the most robust and widely accepted package for caching in Django.
- **Performance**: High throughput and sub-millisecond response times for read operations.
- **Features**: Supports connection pooling, query caching, and caching entire views.

### Alternatives Considered
- **In-memory cache (locmem)**: Good for development, but not suitable for production scaling.
- **Database cache**: Too much overhead on SQLite/PostgreSQL.

---

## 4. NLP & AI Integration: OpenAI Structured Outputs

### Decision
Use the **OpenAI Python SDK** with the `response_format` parameter set to enforce structured outputs using Pydantic models.

### Rationale
- **Reliability**: Structured outputs guarantee that the model (GPT-4o-mini) returns JSON conforming precisely to a Pydantic schema, eliminating JSON parsing errors.
- **Efficiency**: No need for complex regex parsing or retry loops on invalid output.

### Alternatives Considered
- **Raw JSON Mode**: Requires manual validation and error handling when the model occasionally produces invalid structures.
