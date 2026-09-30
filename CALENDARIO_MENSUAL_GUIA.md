# 📅 Vista de Calendario Mensual - Guía de Uso

## ✨ Nueva Funcionalidad

Ahora puedes ver todas tus citas en un calendario mensual completo, donde los días con citas se destacan visualmente para una mejor planificación.

## 🎯 Características

### 1. **Botón de Alternancia Vista**
- Ubicado en la esquina superior derecha junto al botón "Nueva"
- **Icono de Calendario** 📅: Cambia a vista mensual
- **Icono de Lista** 📋: Cambia a vista semanal (detallada)

### 2. **Colores en el Calendario Mensual**

#### Días con Citas:
- 🟤 **Color Marrón/Dorado**: Muestra el número de citas (ej: "3 citas")
- Más visible y destacado
- Al hacer hover, el día se eleva visualmente

#### Días sin Citas:
- ⚪ **Color Gris Claro**: Muestra "Sin citas"
- Menos prominente pero igual clickeable

#### Días Especiales (Festivos):
- 🎨 **Color Personalizado**: El color que hayas configurado
- Muestra la etiqueta debajo (ej: "Festivo", "Cerrado")
- Tiene un fondo sutil del color elegido

### 3. **Interacciones**

#### Hacer Click en un Día:
- ✅ Abre el formulario para crear una nueva cita
- ✅ Funciona tanto para días con citas como sin citas
- ❌ Bloqueado si el día está marcado como "festivo bloqueado"

#### Icono de Calendario en cada Día:
- Aparece al pasar el mouse sobre el día
- Permite marcar/editar el día como especial
- Útil para marcar festivos rápidamente

### 4. **Navegación**

#### Cambiar de Mes:
- **◀ Flecha Izquierda**: Mes anterior
- **▶ Flecha Derecha**: Mes siguiente
- **Botón "Hoy"**: Regresa al mes actual

#### Entre Vistas:
- Vista mensual → Botón con icono de lista
- Vista semanal → Botón con icono de calendario

## 🎨 Código de Colores Visual

```
┌─────────────────────────────────────┐
│  CALENDARIO - Junio 2026            │
├─────────────────────────────────────┤
│                                     │
│  [5]  ← Día sin citas (gris claro) │
│  Sin citas                          │
│                                     │
│  [12] ← Día con 3 citas (dorado)   │
│  3 citas                            │
│                                     │
│  [25] ← Festivo (rojo)              │
│  🏷️ Navidad                         │
│                                     │
│  [Hoy] ← Día actual (borde gris)   │
│                                     │
└─────────────────────────────────────┘
```

## 🚀 Flujo de Trabajo Recomendado

### Para Ver Disponibilidad General:
1. Haz click en el botón de **calendario mensual** 📅
2. Observa el mes completo de un vistazo
3. Los días con muchas citas serán evidentes
4. Identifica huecos disponibles fácilmente

### Para Agendar una Cita:
1. En vista mensual, haz click en el día deseado
2. Si el día está disponible, se abre el formulario
3. Completa los datos de la cita
4. Guarda y verás actualizado el contador

### Para Ver Detalles de Citas:
1. Cambia a vista **semanal** 📋
2. Verás el detalle completo de cada cita
3. Hora, cliente, servicio, etc.

### Para Marcar Días Especiales:
1. En vista mensual, pasa el mouse sobre un día
2. Haz click en el pequeño icono de calendario
3. Configura etiqueta y color
4. El día se marcará visualmente en el calendario

## 📊 Ventajas de la Vista Mensual

### ✅ Visualización Rápida:
- Ve todo el mes de un vistazo
- Identifica patrones de ocupación
- Planifica mejor tu disponibilidad

### ✅ Código de Colores Intuitivo:
- Días ocupados destacados en dorado
- Días libres en gris claro
- Festivos en colores personalizados

### ✅ Contador de Citas:
- Sabes exactamente cuántas citas tienes
- Sin necesidad de contar manualmente
- Actualización en tiempo real

### ✅ Interacción Directa:
- Click en cualquier día para agendar
- No necesitas navegar a otra página
- Flujo de trabajo más rápido

## 🎯 Casos de Uso

### Caso 1: Planificación Mensual
```
Necesito: Ver mi disponibilidad del mes
Solución: 
1. Click en botón "Mes" 📅
2. Observar colores y contadores
3. Identificar días con poca ocupación
```

### Caso 2: Agendar en Día Específico
```
Necesito: Agendar una cita el día 15
Solución:
1. Vista mensual
2. Click en día 15
3. Completar formulario
```

### Caso 3: Marcar Festivos del Mes
```
Necesito: Marcar varios días festivos
Solución:
1. Vista mensual
2. Click en icono 📅 de cada día festivo
3. Configurar etiqueta y color rojo
4. Activar "Bloquear citas"
```

## 💡 Tips y Trucos

### Tip 1: Navegación Rápida
- Usa las flechas del teclado (si el navegador lo permite)
- Mantén presionado para avanzar rápido entre meses

### Tip 2: Vista Híbrida
- Usa vista mensual para planificar
- Cambia a semanal para ver detalles
- Alterna según necesites

### Tip 3: Días Especiales Visuales
- Usa colores consistentes (ej: rojo = festivos)
- Ayuda a identificar patrones rápidamente
- Más fácil para nuevos usuarios

### Tip 4: Pantalla Completa
- En móvil, rota horizontal para mejor vista
- En desktop, maximiza el navegador
- Más días visibles = mejor planificación

## 📱 Responsive

### En Móvil:
- Vista mensual adaptada
- Grid 7 columnas (más compacto)
- Días más pequeños pero legibles
- Touch optimizado

### En Tablet:
- Grid más espacioso
- Celdas de tamaño medio
- Buena visibilidad de contadores

### En Desktop:
- Grid amplio y cómodo
- Toda la información visible
- Hover effects completos

## 🐛 Solución de Problemas

### No veo el botón de vista mensual:
- Verifica que estés en la página de Citas
- Refresca la página (Ctrl+R)
- El botón está junto a "Nueva Cita"

### Los colores no se muestran:
- Los días del mes anterior/siguiente tienen opacidad reducida
- Solo los días del mes actual tienen color completo
- Refresca si acabas de hacer un deploy

### No puedo hacer click en un día:
- Verifica que sea del mes actual
- Los días de meses anteriores/siguientes están bloqueados
- Si es festivo bloqueado, verás un mensaje

## 🎉 Resumen

La vista de calendario mensual te permite:
- 📊 **Visualizar** todo el mes de un vistazo
- 🎨 **Identificar** días con/sin citas por color
- ⚡ **Agendar** citas con un solo click
- 🏷️ **Marcar** días especiales fácilmente
- 🔄 **Alternar** entre vista detallada y general

**¡Gestiona tus citas de manera más eficiente!** 🚀

---

**Actualizado**: 3 de junio de 2026  
**Versión**: 1.0.0
