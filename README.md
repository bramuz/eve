# 🌟 Eve - Sistema de Gestión para Trabajadores Independientes

<div align="center">

![Eve Logo](public/favicon.svg)

**Sistema completo de gestión empresarial diseñado para profesionales independientes**

[![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)](https://github.com/Bramuz/eve)
[![React](https://img.shields.io/badge/React-19.2.5-61dafb.svg)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-6.0.2-blue.svg)](https://www.typescriptlang.org/)
[![Firebase](https://img.shields.io/badge/Firebase-10.8.0-orange.svg)](https://firebase.google.com/)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)

</div>

---

## ✨ Características

### 📊 Dashboard Completo
- Resumen de estadísticas del negocio
- Gráficos interactivos de ventas y pagos
- Métricas en tiempo real
- Vista de citas próximas

### 👥 Gestión de Clientes
- Base de datos completa de clientes
- Historial de servicios y pagos
- Notas y observaciones
- Seguimiento de deudas

### 📅 Sistema de Citas
- Calendario interactivo
- Recordatorios automáticos
- Gestión de horarios
- Estados de citas (pendiente, confirmada, completada, cancelada)

### 💰 Control de Ventas
- Registro de ventas de productos
- Control de inventario
- Histórico de transacciones
- Reportes de ventas

### 💳 Gestión de Pagos
- Seguimiento de pagos pendientes
- Múltiples métodos de pago
- Historial completo
- Notificaciones de vencimiento

### 🎨 Interfaz Moderna
- Diseño responsive (móvil y escritorio)
- Modo oscuro/claro
- Animaciones fluidas con Framer Motion
- UI intuitiva con Tailwind CSS

### 🔐 Seguridad
- Autenticación con Firebase Auth
- Recuperación de contraseña
- Rutas protegidas
- Datos encriptados

### 🚀 Optimización
- Cache busting automático
- Detección de nuevas versiones
- Recarga automática de actualizaciones
- Build optimizado con Vite

---

## 🛠️ Tecnologías

### Frontend
- **React 19.2.5** - UI Library
- **TypeScript 6.0.2** - Type Safety
- **Vite 8.0.10** - Build Tool
- **Tailwind CSS 3.4.1** - Styling
- **Framer Motion 11.0.5** - Animations

### Backend & Database
- **Firebase 10.8.0**
  - Authentication
  - Firestore Database
  - Hosting

### Librerías Destacadas
- **React Router 6.22.0** - Routing
- **React Hook Form 7.50.0** - Forms
- **React Big Calendar 1.19.4** - Calendar
- **Recharts 2.12.0** - Charts
- **Lucide React 0.460.0** - Icons
- **Sonner 1.4.0** - Toast Notifications
- **date-fns 3.6.0** - Date Utilities

---

## 📦 Instalación

### Prerrequisitos
- Node.js 18+ 
- npm o yarn
- Cuenta de Firebase

### Pasos de Instalación

1. **Clonar el repositorio**
   ```bash
   git clone https://github.com/Bramuz/eve.git
   cd eve
   ```

2. **Instalar dependencias**
   ```bash
   npm install
   ```

3. **Configurar Firebase**
   
   Crea un archivo `.env` en la raíz del proyecto:
   ```env
   VITE_FIREBASE_API_KEY=tu_api_key
   VITE_FIREBASE_AUTH_DOMAIN=tu_auth_domain
   VITE_FIREBASE_PROJECT_ID=tu_project_id
   VITE_FIREBASE_STORAGE_BUCKET=tu_storage_bucket
   VITE_FIREBASE_MESSAGING_SENDER_ID=tu_sender_id
   VITE_FIREBASE_APP_ID=tu_app_id
   ```

   > Ver [`FIREBASE_CONFIG_CHECKLIST.md`](FIREBASE_CONFIG_CHECKLIST.md) para instrucciones detalladas

4. **Iniciar servidor de desarrollo**
   ```bash
   npm run dev
   ```

5. **Abrir en el navegador**
   ```
   http://localhost:5173
   ```

---

## 🚀 Scripts Disponibles

```bash
# Desarrollo
npm run dev          # Inicia servidor de desarrollo

# Build
npm run build        # Compila para producción

# Preview
npm run preview      # Preview del build de producción

# Deploy
npm run deploy       # Build + Deploy a Firebase

# Linting
npm run lint         # Ejecuta ESLint
```

---

## 📁 Estructura del Proyecto

```
eve/
├── public/              # Assets estáticos
│   ├── favicon.svg
│   └── icons.svg
├── src/
│   ├── assets/          # Imágenes y recursos
│   ├── components/      # Componentes React
│   │   ├── appointments/
│   │   ├── clients/
│   │   ├── layout/
│   │   ├── products/
│   │   ├── sales/
│   │   └── ui/
│   ├── context/         # Context API
│   │   ├── AuthContext.tsx
│   │   └── ThemeContext.tsx
│   ├── firebase/        # Configuración Firebase
│   │   ├── auth.ts
│   │   ├── config.ts
│   │   └── firestore.ts
│   ├── hooks/           # Custom Hooks
│   │   └── useVersionCheck.ts
│   ├── layouts/         # Layouts
│   ├── pages/           # Páginas
│   │   ├── Dashboard.tsx
│   │   ├── Appointments.tsx
│   │   ├── Clients.tsx
│   │   ├── Products.tsx
│   │   ├── Sales.tsx
│   │   ├── Payments.tsx
│   │   └── Login.tsx
│   ├── routes/          # Configuración de rutas
│   ├── types/           # TypeScript types
│   ├── App.tsx
│   └── main.tsx
├── firebase.json        # Configuración Firebase
├── vite.config.ts       # Configuración Vite
├── tailwind.config.js   # Configuración Tailwind
└── tsconfig.json        # Configuración TypeScript
```

---

## 🔧 Configuración

### Firebase
1. Crea un proyecto en [Firebase Console](https://console.firebase.google.com/)
2. Habilita Authentication (Email/Password)
3. Crea una base de datos Firestore
4. Configura las reglas de seguridad (ver documentación)
5. Obtén las credenciales y agrégalas al `.env`

### Hosting
Para desplegar en Firebase Hosting:

```bash
# Instalar Firebase CLI (si no lo tienes)
npm install -g firebase-tools

# Login en Firebase
firebase login

# Inicializar Firebase (si es necesario)
firebase init

# Deploy
npm run deploy
```

---

## 📚 Documentación Adicional

- [README_EVE.md](README_EVE.md) - Descripción general del proyecto
- [README_CONFIGURACION.md](README_CONFIGURACION.md) - Guía de configuración
- [FIREBASE_CONFIG_CHECKLIST.md](FIREBASE_CONFIG_CHECKLIST.md) - Checklist de Firebase
- [SOLUCION_CACHE_VERSIONES.md](SOLUCION_CACHE_VERSIONES.md) - Sistema de versiones
- [TESTING_CACHE.md](TESTING_CACHE.md) - Guía de testing
- [URGENTE_CONFIGURACION_DOMINIO.md](URGENTE_CONFIGURACION_DOMINIO.md) - Configuración de dominio

---

## 🤝 Contribuir

Las contribuciones son bienvenidas! Para contribuir:

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

---

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo `LICENSE` para más detalles.

---

## 👨‍💻 Autor

**Bramuz**
- GitHub: [@Bramuz](https://github.com/Bramuz)
- Email: brayanml93@gmail.com

---

## 🙏 Agradecimientos

- Diseño inspirado en las mejores prácticas de UX/UI
- Iconos por [Lucide](https://lucide.dev/)
- Comunidad de React y Firebase

---

## 📞 Soporte

Si tienes preguntas o necesitas ayuda:

1. Revisa la [documentación](README_EVE.md)
2. Abre un [Issue](https://github.com/Bramuz/eve/issues)
3. Contacta al autor

---

<div align="center">

**⭐ Si este proyecto te fue útil, considera darle una estrella ⭐**

Hecho con ❤️ por [Bramuz](https://github.com/Bramuz)

</div>
