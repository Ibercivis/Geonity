# Plan de Testing — Geonity App

> Versión: marzo 2026
> Plataforma: Android (debug)
> Para cada caso: indica si PASA / FALLA y anota cualquier comportamiento inesperado.

---

## 1. Registro e inicio de sesión

### 1.1 Registro
- [ ] Desde la pantalla de login, pulsa "¿No tienes cuenta? Crear cuenta"
- [ ] Rellena email, contraseña y repite contraseña → pulsa "Crear cuenta"
- [ ] **Esperado:** mensaje "Revisa tu email" y vuelve al login
- [ ] Intenta registrar con un email ya existente → **Esperado:** mensaje de error en rojo
- [ ] Intenta registrar con contraseñas que no coinciden → **Esperado:** error de validación
- [ ] Intenta registrar con contraseña menor de 8 caracteres → **Esperado:** error de validación

### 1.2 Login
- [ ] Introduce email y contraseña correctos → **Esperado:** accede a la app
- [ ] Introduce credenciales incorrectas → **Esperado:** mensaje de error
- [ ] En Android: al hacer login correctamente, el sistema ofrece guardar la contraseña → **Esperado:** aparece el diálogo del sistema para guardar credenciales

### 1.3 Logout
- [ ] Ve a Perfil → pulsa "Cerrar sesión"
- [ ] **Esperado:** vuelve a la pantalla de login y no se puede volver atrás

---

## 2. Perfil y cuenta

### 2.1 Eliminar cuenta
- [ ] Ve a Perfil → sección "Zona de peligro" → pulsa "Eliminar cuenta"
- [ ] **Esperado:** aparece diálogo de confirmación con opción "Mantener mis observaciones"
- [ ] Confirma con "Mantener mis observaciones" marcado → **Esperado:** cuenta eliminada, redirige al login
- [ ] Repite el proceso con "Mantener mis observaciones" desmarcado → **Esperado:** cuenta eliminada con observaciones borradas

---

## 3. Mapa de observaciones

### 3.1 Cambio de capa
- [ ] Abre el mapa de observaciones
- [ ] Haz zoom a un nivel concreto (ej. ciudad)
- [ ] Cambia entre capa normal y satélite
- [ ] **Esperado:** el zoom y la posición se mantienen al cambiar de capa (no reinicia la vista)

### 3.2 Panel de detalle
- [ ] Pulsa sobre una observación en el mapa
- [ ] **Esperado:** aparece panel inferior con datos de la observación
- [ ] **Esperado:** NO aparece ningún campo "Usuario ID" (solo info relevante)

---

## 4. Crear observación

- [ ] Abre un proyecto y pulsa "Nueva observación"
- [ ] Rellena todos los campos: texto, número, selección, etc.
- [ ] Pulsa "Guardar"
- [ ] **Esperado:** observación creada correctamente y aparece en el mapa
- [ ] Comprueba en el servidor/admin que los campos de **texto y número** se han enviado con su valor

### 4.1 Con imágenes
- [ ] Crea una observación adjuntando una o varias fotos
- [ ] **Esperado:** las imágenes se muestran correctamente en el detalle de la observación
- [ ] **Esperado:** las URLs de las imágenes apuntan al servidor correcto (no a localhost)

---

## 5. Proyectos

### 5.1 Editar proyecto — categorías
- [ ] Edita un proyecto que ya tiene categorías seleccionadas
- [ ] **Esperado:** las categorías previamente guardadas aparecen ya marcadas (chips seleccionados) al abrir el editor

### 5.2 Administradores e invitaciones
- [ ] Entra en un proyecto como creador → pulsa "Administradores e Invitaciones"
- [ ] **Esperado:** se muestra la sección "Gestión actual" con el creador y administradores existentes
- [ ] Introduce un email válido → pulsa "Invitar"
- [ ] **Esperado:** aparece confirmación de invitación enviada
- [ ] **Esperado:** la invitación aparece en la sección "Invitaciones pendientes"
- [ ] Acepta la invitación desde el email → vuelve a la pantalla
- [ ] **Esperado:** la invitación aceptada ya NO aparece como pendiente

---

## 6. Modo oscuro

Activa el modo oscuro en el sistema y verifica las siguientes pantallas:

- [ ] Login → texto e inputs legibles
- [ ] Home → tarjetas de proyectos con buen contraste
- [ ] **Administradores e Invitaciones** → secciones "Gestión actual" e "Invitaciones pendientes" sin fondos azules/naranjas hardcodeados, buen contraste
- [ ] Detalle de organización → badges de rol (Creador, Admin, etc.) con buen contraste
- [ ] Perfil → sección "Zona de peligro" visible

---

## 7. Modo offline

- [ ] Descarga un proyecto para uso offline
- [ ] Desactiva la conexión a internet
- [ ] Abre el mapa del proyecto descargado → **Esperado:** el mapa carga desde caché
- [ ] Crea una observación sin conexión → **Esperado:** se guarda como pendiente
- [ ] Reactiva la conexión → **Esperado:** la observación pendiente se sincroniza automáticamente

---

## Notas generales

- Anotar el dispositivo y versión de Android utilizado
- Si algo falla, incluir captura de pantalla y pasos exactos para reproducirlo
- Probar tanto en modo claro como oscuro cuando sea relevante
