# Guía: Sistema de Consentimientos para Procedimientos Estéticos

## 📋 ¿Qué se implementó?

Se agregó un **sistema completo de consentimientos digitales** en la tarjeta del cliente con las siguientes características:

### ✅ Características Principales

1. **Firma Digital Táctil**
   - Compatible con tablets, móviles y mouse
   - Canvas interactivo de 320x150px
   - Opción de limpiar y reintentar
   - Captura en formato PNG/Base64

2. **Consentimiento Genérico Adaptable**
   - Plantilla completa con información legal
   - Se personaliza automáticamente con:
     - Nombre del cliente
     - Nombre del procedimiento (Botox, Ácido Hialurónico, Microblading, etc.)
   - Vista previa en tiempo real

3. **Almacenamiento Seguro en Firebase**
   - Guardado de consentimiento completo + firma
   - Asociado al cliente específico
   - Timestamp de firma
   - Acceso solo del propietario

4. **Gestión de Consentimientos**
   - Ver lista de consentimientos anteriores
   - Descargar como HTML (imprimible)
   - Eliminar consentimientos antiguos
   - Ordenados cronológicamente

---

## 🎯 Cómo Usar

### Crear un Nuevo Consentimiento

1. **Abre la tarjeta del cliente** desde la sección de Clientes
2. **Haz clic en el botón** "Nuevo Consentimiento" (botón azul con icono de checkmark)
3. **Ingresa el nombre del procedimiento**
   - Ejemplos: "Botox", "Ácido Hialurónico", "Microblading", "Peeling", etc.
4. **Revisa la vista previa** del consentimiento
   - Verás el texto completo que firmará el paciente
5. **Firma digitalmente en el canvas**
   - Usa el dedo en tablet/móvil
   - Usa el mouse en computadora
   - Botón "Limpiar" si necesitas reintentar
6. **Haz clic en "Guardar Consentimiento"**
   - Se guardará automáticamente en la base de datos

### Ver Consentimientos Anteriores

1. **En la tarjeta del cliente**, haz clic en "Consentimientos (count)"
   - El número indica cuántos consentimientos tiene
2. **Se abrirá una lista** con todos los consentimientos firmados
3. **Para cada consentimiento puedes:**
   - 👁️ **Ver** (ojo) - Ver el documento completo con firma
   - 📥 **Descargar** (flecha) - Descargar como HTML para imprimir
   - 🗑️ **Eliminar** (basura) - Borrar el consentimiento

### Descargar/Imprimir

1. En la lista de consentimientos, haz clic en **"Descargar PDF"**
2. Se descargará un archivo HTML con el nombre: `Consentimiento-[Procedimiento]-[Fecha].html`
3. **Abre el archivo en el navegador**
4. **Imprime usando Ctrl+P o Cmd+P**
   - Selecciona la opción "Guardar como PDF"
   - O imprime directamente a papel

---

## 📄 Contenido del Consentimiento

El consentimiento incluye:

- ✅ Nombre del paciente (cliente)
- ✅ Nombre del procedimiento (personalizable)
- ✅ Información sobre el procedimiento
- ✅ Beneficios esperados
- ✅ Posibles riesgos y efectos secundarios
- ✅ Alternativas de tratamiento
- ✅ Tiempo de recuperación
- ✅ Consideraciones post-procedimiento
- ✅ Autorización y consentimiento del paciente
- ✅ Firma digital del paciente
- ✅ Espacios para firma del profesional
- ✅ Lugar, fecha y hora

---

## 🔒 Seguridad

- ✅ Solo el dueño puede acceder a sus consentimientos
- ✅ Las firmas se guardan codificadas en Base64
- ✅ Protegidas por reglas de Firebase
- ✅ Cada consentimiento está vinculado al usuario

---

## 💡 Tips de Uso

1. **Nombres de procedimiento claros**: Evita abreviaturas, usa nombres completos
2. **Firma legible**: Firma despacio y de forma clara en el canvas
3. **Guarda copias**: Descarga los HTML después de firmar para guardar copias
4. **Procedimientos múltiples**: Puedes crear un consentimiento por cada procedimiento
5. **Editar cliente**: Si eliminas el cliente, se eliminan todos sus consentimientos

---

## 📱 Mejores Prácticas

**Para Tablets/Móviles:**
- Usa un stylus para mejor precisión en la firma
- Gira el dispositivo a horizontal para más espacio
- Ten buena iluminación

**Para Escritorio:**
- Usa un mousepad amplio para la firma
- Zoom en la página si es necesario
- Imprime antes de guardar (recomendado)

---

## ❓ Preguntas Frecuentes

**P: ¿Puedo editar el consentimiento después de firmado?**
R: No, los consentimientos firmados son definitivos. Si necesitas cambios, elimina y crea uno nuevo.

**P: ¿Se guardan los consentimientos en la nube?**
R: Sí, en Firebase. Cada consentimiento incluye la firma en formato imagen.

**P: ¿Puedo cambiar el texto del consentimiento?**
R: Actualmente es una plantilla genérica estándar. Solo cambia el nombre del procedimiento.

**P: ¿Qué pasa si borro un cliente?**
R: Se eliminan automáticamente todos sus consentimientos también.

**P: ¿Cómo descargo para imprimir?**
R: Haz clic en el icono de descarga (flecha), abre el HTML y usa Ctrl+P para imprimir.

---

**¡El sistema está listo para usar! 🎉**
