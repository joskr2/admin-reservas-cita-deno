# Horizonte Clínica - Sistema de Gestión

Sistema de gestión de citas para clínica psicológica desarrollado con Fresh
(Deno) y Deno KV.

## Características

- 🏥 Gestión de citas psicológicas
- 👥 Administración de psicólogos y pacientes
- 🏢 Control de salas especializadas (12 tipos diferentes)
- 🔐 Sistema de autenticación por roles
- 📊 Dashboard con estadísticas y calendario
- 🎨 Interfaz moderna y responsiva con TailwindCSS
- 📱 Optimizada para dispositivos móviles
- 🔒 Criptografía compatible con Deno Deploy

## Tecnologías

- **Fresh 1.6.8** - Framework web para Deno
- **Deno KV** - Base de datos distribuida
- **TypeScript** - Tipado estático
- **TailwindCSS** - Framework CSS
- **Preact** - Biblioteca de componentes

## Instalación y Desarrollo

```bash
# Clonar el repositorio
git clone <repository-url>
cd horizonte-clinica-deno

# Inicializar datos de prueba
deno task seed

# Iniciar servidor de desarrollo
deno task start
```

## Scripts Disponibles

```bash
# Desarrollo
deno task start          # Servidor de desarrollo con hot reload
deno task build          # Construir para producción
deno task preview        # Vista previa de producción

# Calidad de código
deno task check          # Verificar formato, lint y tipos
deno task manifest       # Regenerar manifest de Fresh

# Base de datos
deno task seed           # Poblar datos iniciales
deno task fix-kv         # Reparar datos corruptos en KV

# Actualización
deno task update         # Actualizar Fresh a la última versión
```

## Estructura del Proyecto

```
horizonte-clinica-deno/
├── components/          # Componentes de servidor
│   ├── appointments/    # Componentes de citas
│   ├── dashboard/       # Componentes del dashboard
│   ├── layout/          # Componentes de layout
│   └── ui/             # Componentes de interfaz
├── islands/            # Componentes interactivos (cliente)
├── routes/             # Rutas y páginas
│   ├── api/           # Endpoints de API
│   ├── appointments/  # Páginas de citas
│   ├── dashboard/     # Dashboard
│   ├── patients/      # Gestión de pacientes
│   └── psychologists/ # Gestión de psicólogos
├── lib/               # Lógica de negocio
│   ├── services/      # Servicios
│   └── utils/         # Utilidades
├── static/            # Archivos estáticos
├── types/             # Definiciones TypeScript
└── scripts/           # Scripts de mantenimiento
```

## Roles de Usuario

### Superadmin

- Gestión completa de usuarios
- Acceso a todas las funcionalidades
- Administración de salas y configuración

### Psychologist

- Gestión de sus propias citas
- Visualización de pacientes asignados
- Acceso limitado al dashboard

## Base de Datos (Deno KV)

### Mantenimiento

Si experimentas errores relacionados con la base de datos KV, puedes usar el
script de reparación:

```bash
deno task fix-kv
```

Este script:

- Limpia índices corruptos
- Reconstruye índices desde datos principales
- Verifica la integridad de los datos

### Estructura de Datos

```typescript
// Usuarios
["users", email] -> User
["users_by_role", role, email] -> email

// Citas
["appointments", id] -> Appointment
["appointments_by_psychologist", email, id] -> Appointment

// Salas
["rooms", roomId] -> Room

// Pacientes
["patients", id] -> Patient

// Sesiones
["sessions", sessionId] -> { userEmail: string }
```

## Configuración

### Variables de Entorno

Crea un archivo `.env` basado en `.env.example`:

```bash
# Base de datos (opcional para desarrollo local)
DENO_KV_URL=https://api.deno.com/databases/YOUR_DATABASE_ID/connect

# Puerto del servidor (default: 8000)
PORT=8000

# Entorno de ejecución
DENO_ENV=production
```

#### Configuración de Base de Datos:

**Desarrollo Local:**
- Sin `DENO_KV_URL`: Usa base de datos local SQLite
- Ideal para desarrollo y testing

**Producción/Remoto:**
- Requiere dos variables:
  - `DENO_KV_URL`: URL de conexión a tu base de datos
  - `DENO_KV_ACCESS_TOKEN`: Token de acceso de tu cuenta Deno Deploy

Para obtener el access token:
1. Ve a [https://dash.deno.com/account](https://dash.deno.com/account)
2. Genera un nuevo access token
3. Agrégalo a tu archivo `.env`

### Datos Iniciales

El script `deno task seed` crea:

- Usuario superadmin: `admin@horizonte.com` / `password123`
- 2 psicólogos de prueba
- 12 salas especializadas (terapia individual, familiar, grupal, evaluación, etc.)
- Pacientes y citas de ejemplo

## Desarrollo

### Agregar Nuevas Funcionalidades

1. **Componentes de Servidor**: Agregar en `components/`
2. **Componentes Interactivos**: Agregar en `islands/`
3. **Rutas**: Agregar en `routes/`
4. **APIs**: Agregar en `routes/api/`
5. **Tipos**: Definir en `types/index.ts`

### Regenerar Manifest

Después de agregar nuevas rutas o islands:

```bash
deno task manifest
```

## Producción

```bash
# Construir aplicación
deno task build

# Ejecutar en producción
deno task preview
```

## Últimas Actualizaciones

### 🔧 Mejoras de Seguridad
- **Criptografía**: Reemplazado bcrypt por Web Crypto API para compatibilidad con Deno Deploy
- **Hash de contraseñas**: PBKDF2 con 100,000 iteraciones usando SHA-256
- **Compatibilidad**: Totalmente funcional en Deno Deploy

### 📱 Optimizaciones Mobile
- **Diseño responsivo**: Interfaces optimizadas para móviles y tablets
- **Touch targets**: Botones y controles con tamaño mínimo de 44px
- **Calendario**: Vista semanal adaptativa con scroll horizontal controlado
- **Formularios**: Layout responsive que se adapta desde mobile a desktop

### 🎨 Sistema de Iconos
- **36 iconos**: Sistema completo con soporte dark/light mode
- **SVG vectoriales**: Escalado perfecto en todas las resoluciones
- **Navegación**: Flechas de calendario y controles completamente funcionales

### 🗄️ Base de Datos
- **Limpieza automática**: Scripts para limpiar datos de testing
- **Inspección**: Herramientas para análisis del estado de la base de datos
- **12 salas especializadas**: Configuradas para diferentes tipos de terapia
- **Datos realistas**: Pacientes y citas con información detallada

### 🔄 Scripts Disponibles
```bash
# Gestión de base de datos
deno task inspect-db     # Ver estado actual de la DB
deno task cleanup-data   # Limpiar datos de testing
deno task fix-kv         # Reparar datos corruptos

# Desarrollo y producción
deno task start          # Servidor con hot reload
deno task build          # Construcción para producción
deno task preview        # Vista previa de producción
```

## Contribución

1. Fork del proyecto
2. Crear rama para feature (`git checkout -b feature/nueva-funcionalidad`)
3. Commit de cambios (`git commit -am 'Agregar nueva funcionalidad'`)
4. Push a la rama (`git push origin feature/nueva-funcionalidad`)
5. Crear Pull Request

## Licencia

Este proyecto está bajo la Licencia MIT.
