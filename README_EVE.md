# Eve - Gestión Profesional

Una aplicación web moderna y completamente responsive para trabajadores independientes como barberos, estilistas, manicuristas, tatuadores, entrenadores, técnicos y freelancers.

## 🚀 Características

- **Dashboard Moderno**: Vista general con estadísticas en tiempo real
- **Gestión de Citas**: Sistema completo de agendamiento con estados
- **Gestión de Clientes**: Base de datos de clientes con historial
- **Inventario de Productos**: Control de stock y precios
- **Ventas**: Sistema de ventas con múltiples productos
- **Pagos y Abonos**: Seguimiento de pagos y saldos pendientes
- **Autenticación**: Login con email/contraseña y Google
- **Modo Oscuro**: Tema claro y oscuro
- **Responsive**: Funciona perfectamente en móvil, tablet y escritorio

## 🛠️ Tecnologías

### Frontend
- **React** - Biblioteca de UI
- **Vite** - Build tool y dev server
- **TypeScript** - Tipado estático
- **Tailwind CSS** - Estilos utilitarios
- **React Router DOM** - Navegación
- **Framer Motion** - Animaciones
- **React Hook Form** - Gestión de formularios
- **Lucide React** - Iconos
- **date-fns** - Manipulación de fechas
- **Sonner** - Notificaciones toast

### Backend y Servicios
- **Firebase Authentication** - Autenticación de usuarios
- **Firestore Database** - Base de datos NoSQL
- **Firebase Storage** - Almacenamiento de archivos

## 📦 Instalación

1. Clona el repositorio
```bash
git clone <tu-repo>
cd eve
```

2. Instala las dependencias
```bash
npm install
```

3. Configura Firebase
   - Crea un proyecto en [Firebase Console](https://console.firebase.google.com/)
   - Habilita Authentication (Email/Password y Google)
   - Crea una base de datos Firestore
   - Copia tus credenciales de Firebase

4. Configura las variables de entorno
   - Copia `.env.example` a `.env`
   - Completa las variables con tus credenciales de Firebase

```env
VITE_FIREBASE_API_KEY=tu_api_key
VITE_FIREBASE_AUTH_DOMAIN=tu_auth_domain
VITE_FIREBASE_PROJECT_ID=tu_project_id
VITE_FIREBASE_STORAGE_BUCKET=tu_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=tu_sender_id
VITE_FIREBASE_APP_ID=tu_app_id
```

5. Inicia el servidor de desarrollo
```bash
npm run dev
```

## 🏗️ Estructura del Proyecto

```
src/
├── components/         # Componentes reutilizables
│   ├── ui/            # Componentes UI base
│   ├── layout/        # Componentes de layout
│   ├── appointments/  # Componentes de citas
│   ├── clients/       # Componentes de clientes
│   ├── products/      # Componentes de productos
│   └── sales/         # Componentes de ventas
├── pages/             # Páginas de la aplicación
├── layouts/           # Layouts principales
├── routes/            # Configuración de rutas
├── context/           # Context API (Auth, Theme)
├── firebase/          # Configuración y servicios de Firebase
├── types/             # Tipos TypeScript
└── hooks/             # Custom hooks
```

## 🔥 Firestore Collections

La aplicación utiliza las siguientes colecciones en Firestore:

- `users` - Información de usuarios
- `appointments` - Citas agendadas
- `clients` - Base de datos de clientes
- `products` - Inventario de productos
- `sales` - Registro de ventas
- `payments` - Historial de pagos

## 🎨 Características de UI/UX

- Diseño moderno y minimalista
- Animaciones suaves con Framer Motion
- Modo oscuro completo
- Componentes reutilizables
- Notificaciones toast elegantes
- Estados de carga y vacío
- Validación de formularios
- Responsive en todos los dispositivos

## 🚀 Deploy

### Build de producción
```bash
npm run build
```

### Preview del build
```bash
npm run preview
```

## 📝 Scripts Disponibles

- `npm run dev` - Inicia el servidor de desarrollo
- `npm run build` - Crea el build de producción
- `npm run preview` - Preview del build de producción
- `npm run lint` - Ejecuta el linter

## 🔐 Seguridad

- Rutas protegidas con autenticación
- Validación en el cliente y servidor
- Reglas de seguridad de Firestore (configurar en Firebase Console)

## 🤝 Contribuir

Las contribuciones son bienvenidas. Por favor:

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT.

## 👨‍💻 Autor

Desarrollado con ❤️ para trabajadores independientes

---

**Eve** - Gestión Profesional 2024
