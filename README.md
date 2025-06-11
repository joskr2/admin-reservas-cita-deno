# Horizonte Clínica - Sistema de Gestión

Sistema de gestión de citas para clínica psicológica desarrollado con Fresh (Deno) y Deno KV.

## Características

- 🏥 Gestión de citas médicas
- 👥 Administración de psicólogos y pacientes
- 🏢 Control de salas de atención
- 🔐 Sistema de autenticación por roles
- 📊 Dashboard con estadísticas
- 🎨 Interfaz moderna con TailwindCSS

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

Si experimentas errores relacionados con la base de datos KV, puedes usar el script de reparación:

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

// Sesiones
["sessions", sessionId] -> { userEmail: string }
```

## Configuración

### Variables de Entorno

```bash
# Opcional: Puerto del servidor (default: 8000)
PORT=8000

# Opcional: Entorno de ejecución
DENO_ENV=development
```

### Datos Iniciales

El script `deno task seed` crea:

- Usuario superadmin: `admin@horizonte.com` / `admin123`
- Psicólogos de prueba
- Salas de atención (A, B, C, D, E)
- Citas de ejemplo

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

## Contribución

1. Fork del proyecto
2. Crear rama para feature (`git checkout -b feature/nueva-funcionalidad`)
3. Commit de cambios (`git commit -am 'Agregar nueva funcionalidad'`)
4. Push a la rama (`git push origin feature/nueva-funcionalidad`)
5. Crear Pull Request

## Licencia

Este proyecto está bajo la Licencia MIT.
