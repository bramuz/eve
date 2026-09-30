# 📅 Funcionalidad de Días Especiales

## Descripción
Esta funcionalidad te permite marcar días específicos en el calendario con colores personalizados y etiquetas, ideal para festivos, vacaciones, o días cerrados donde no se deben agendar citas.

## ✨ Características

### 1. Marcar Días Especiales
- Haz clic en el ícono de calendario (📅) en cualquier día para marcarlo como especial
- Puedes editar días especiales existentes haciendo clic nuevamente en el ícono

### 2. Personalización
- **Etiqueta**: Asigna un nombre al día (Ej: "Festivo", "Vacaciones", "Cerrado")
- **Color**: Elige entre 8 colores predefinidos o selecciona uno personalizado
- **Bloqueo de citas**: Activa esta opción para evitar que se agenden citas en ese día

### 3. Colores Predefinidos
- 🔴 **Rojo**: Para festivos o días cerrados
- 🟠 **Naranja**: Para advertencias
- 🟡 **Amarillo**: Para precaución
- 🟢 **Verde**: Días disponibles especiales
- 🔵 **Azul**: Eventos especiales
- 🟣 **Morado**: Eventos importantes
- 🌸 **Rosa**: Celebraciones
- ⚫ **Gris**: Días deshabilitados

### 4. Etiquetas Sugeridas
- Festivo
- Vacaciones
- Cerrado
- Evento Especial
- Día Personal
- Capacitación
- Mantenimiento

## 🚀 Cómo Usar

### Marcar un día como especial:
1. Ve a la página de **Citas** (📅)
2. Encuentra el día que quieres marcar
3. Haz clic en el ícono de **calendario** (📅) en la esquina del día
4. Completa el formulario:
   - Escribe una etiqueta descriptiva
   - Selecciona un color
   - Activa "Bloquear agendamiento" si no quieres permitir citas
5. Haz clic en **Guardar**

### Editar un día especial:
1. Haz clic en el ícono de calendario del día especial
2. Modifica la información que necesites
3. Haz clic en **Actualizar**

### Eliminar un día especial:
1. Abre el formulario del día especial (ícono de calendario)
2. Haz clic en **Eliminar Día Especial** al final del formulario
3. Confirma la eliminación

## 🔒 Validaciones

### Al intentar agendar en días bloqueados:
- ❌ No se permitirá crear la cita
- ⚠️ Se mostrará una advertencia explicando por qué
- 📋 La etiqueta del día se mostrará en el mensaje

### Al seleccionar una fecha con día especial:
- Si el día está **bloqueado**: El botón de guardar se deshabilitará
- Si el día **NO está bloqueado**: Se mostrará una advertencia informativa pero se permitirá agendar

## 🎨 Visualización

### Vista Móvil:
- El encabezado del día mostrará el color personalizado
- La etiqueta aparecerá debajo del nombre del día
- Si está bloqueado, se mostrará "🚫 Día bloqueado para citas"

### Vista Desktop:
- Cada día en el grid mostrará el color en su encabezado
- La etiqueta se mostrará con un ícono 🏷️
- Indicador visual de días bloqueados

## 🗄️ Configuración de Firebase

### Reglas de Firestore
Asegúrate de desplegar las reglas de Firestore incluidas en el archivo `firestore.rules`:

```bash
firebase deploy --only firestore:rules
```

Las reglas incluyen permisos para la nueva colección `specialDays` que:
- Permite lectura solo al propietario
- Permite crear días especiales autenticados
- Permite actualizar y eliminar solo al propietario

## 💡 Casos de Uso

### Festivos:
- Marca días festivos en **rojo**
- Etiqueta: "Festivo Nacional"
- Bloquea las citas

### Vacaciones:
- Marca períodos de vacaciones en **azul**
- Etiqueta: "Vacaciones"
- Bloquea las citas

### Días con horario especial:
- Marca en **amarillo** o **naranja**
- Etiqueta: "Horario Reducido"
- NO bloquees las citas (solo advertencia)

### Eventos especiales:
- Marca en **morado**
- Etiqueta: "Evento Privado"
- Decide si bloquear o no según el caso

## 📝 Notas Importantes

1. **Los días especiales son por usuario**: Cada usuario tiene sus propios días especiales
2. **Citas existentes**: Si ya hay citas agendadas en un día que marcas como bloqueado, las citas existentes NO se eliminarán, pero no podrás agregar nuevas
3. **Persistencia**: Los días especiales se guardan en Firestore y estarán disponibles en todas tus sesiones
4. **Zona horaria**: Los días se guardan según la zona horaria local de tu navegador

## 🐛 Solución de Problemas

### No puedo marcar un día como especial:
- Verifica que estés autenticado
- Asegúrate de haber desplegado las reglas de Firestore

### No se muestran los colores correctamente:
- Refresca la página
- Verifica que el navegador soporte CSS personalizado

### Las citas no se bloquean:
- Verifica que la opción "Bloquear agendamiento" esté activada
- La validación ocurre al intentar guardar la cita, no al seleccionar la fecha

## 🔄 Actualizaciones Futuras Planeadas

- [ ] Vista de lista de todos los días especiales
- [ ] Plantillas de días festivos por país
- [ ] Repetición anual automática de días especiales
- [ ] Exportar/importar días especiales
- [ ] Notificaciones para días especiales próximos

---

¿Necesitas ayuda? Revisa la documentación principal o contacta al soporte técnico.
