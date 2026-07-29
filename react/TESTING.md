# Geonity — Plan de Testeo

## Índice
1. [Autenticación](#1-autenticación)
2. [Navbar](#2-navbar)
3. [Listado de Proyectos](#3-listado-de-proyectos)
4. [Detalle de Proyecto](#4-detalle-de-proyecto)
5. [Crear / Editar Proyecto](#5-crear--editar-proyecto)
6. [Añadir Observación](#6-añadir-observación)
7. [Organizaciones](#7-organizaciones)
8. [Perfil de Usuario](#8-perfil-de-usuario)
9. [Invitaciones](#9-invitaciones)
10. [Páginas Públicas](#10-páginas-públicas)
11. [Comportamiento Global](#11-comportamiento-global)

---

## 1. Autenticación

### 1.1 Login con email/contraseña
- [ ] Login con credenciales correctas → redirige a `/`
- [ ] Login con email incorrecto → muestra error
- [ ] Login con contraseña incorrecta → muestra error
- [ ] Campo email con formato inválido → error de validación antes de enviar
- [ ] Campo contraseña vacío → error de validación antes de enviar
- [ ] Al hacer login correctamente, la navbar muestra el avatar del usuario (no el botón Login)
- [ ] Recargar la página tras login → sigue logueado (token persiste)

### 1.2 Login con Google
- [ ] Botón Google abre el selector de cuenta de Google
- [ ] Completar el flujo → redirige a `/`
- [ ] Cancelar el selector → muestra toast de error, no redirige

### 1.3 Registro
- [ ] Registro con datos válidos → muestra modal de confirmación de email
- [ ] Contraseñas que no coinciden → error en campo
- [ ] Contraseña con menos de 8 caracteres → error en campo
- [ ] Email ya registrado → muestra error del servidor
- [ ] Desde el modal de éxito → clic en "Login" lleva a `/login`

### 1.4 Cierre de sesión
- [ ] Logout desde el menú de usuario → redirige a `/login`
- [ ] Tras logout, intentar acceder a `/` redirige a `/login`
- [ ] Tras logout, volver al navegador (back) no permite acceder

---

## 2. Navbar

### 2.1 Estado autenticado
- [ ] Aparece avatar con iniciales del usuario
- [ ] Menú de avatar: opción "Perfil" lleva a `/profile`
- [ ] Menú de avatar: opción "Logout" cierra sesión
- [ ] Campana de notificaciones visible
- [ ] Si hay invitaciones pendientes → badge rojo con el número (o "9+" si > 9)
- [ ] Sin invitaciones → no aparece badge

### 2.2 Estado no autenticado
- [ ] Aparece botón "Login" en lugar del avatar
- [ ] Solo se muestra el enlace "About" en la navegación
- [ ] Clic en "Login" lleva a `/login`

### 2.3 Selector de idioma
- [ ] Dropdown muestra los 6 idiomas disponibles (EN, ES, PT, IT, FR, DE)
- [ ] Cambiar idioma actualiza los textos de la interfaz
- [ ] El idioma activo aparece destacado en el dropdown

---

## 3. Listado de Proyectos

### 3.1 Vista general
- [ ] Carga y muestra la lista de proyectos
- [ ] Cada tarjeta muestra: nombre, cover (o gradiente), badges relevantes
- [ ] Badge de candado en proyectos privados
- [ ] Badge de mapa en proyectos con coordenadas difusas (fuzzy)
- [ ] Badge de globo en proyectos globales
- [ ] Contador de likes visible

### 3.2 Tabs
- [ ] Tab "Todos los proyectos" muestra todos
- [ ] Tab "Mis proyectos" muestra solo los del usuario actual
- [ ] Cambiar de tab resetea los filtros activos

### 3.3 Búsqueda y filtros
- [ ] Buscar por nombre filtra los resultados en tiempo real
- [ ] Filtrar por tema (topic) reduce la lista correctamente
- [ ] Filtrar por país reduce la lista
- [ ] Combinar búsqueda + tema + país funciona correctamente
- [ ] Borrar filtros restaura la lista completa

### 3.4 Ordenación
- [ ] Ordenar por "Última observación" cambia el orden
- [ ] Ordenar por "Última actualización" cambia el orden
- [ ] Ordenar por "Más observaciones" cambia el orden

### 3.5 Acciones en tarjeta
- [ ] Clic en tarjeta → navega al detalle del proyecto
- [ ] Botón de corazón → toggle like (cambia estado visual)
- [ ] Botón de invitar (proyectos propios) → abre modal de invitación
- [ ] Modal de invitación: campo de email + botón enviar
- [ ] Modal de invitación: lista de invitaciones pendientes visible
- [ ] Botón editar (crown/shield) → navega a `/projects/:id/edit`

### 3.6 Crear proyecto
- [ ] Botón "+ Nuevo Proyecto" lleva a `/projects/new`

---

## 4. Detalle de Proyecto

### 4.1 Carga de datos
- [ ] Muestra nombre, descripción, cover del proyecto
- [ ] Muestra organizaciones vinculadas (cliclables)
- [ ] Muestra contador de likes y observaciones
- [ ] Badges correctos (privado, fuzzy, global, finalizado)

### 4.2 Proyecto privado
- [ ] Al acceder muestra modal de contraseña
- [ ] Contraseña incorrecta → error en modal
- [ ] Contraseña correcta → cierra modal y carga el mapa con observaciones

### 4.3 Mapa y observaciones
- [ ] El mapa carga y muestra observaciones como puntos
- [ ] En modo fuzzy → muestra hexágonos, no puntos exactos
- [ ] Cambiar zoom del mapa en modo fuzzy actualiza los hexágonos
- [ ] Clic en observación → abre panel lateral con detalles
- [ ] Panel lateral: botones anterior/siguiente entre observaciones
- [ ] Panel lateral: botón cerrar cierra el panel
- [ ] Toggle "Mis observaciones" filtra a las del usuario actual

### 4.4 Acciones de usuario
- [ ] Botón "Añadir observación" (activo si no ha finalizado) → navega al formulario
- [ ] Botón "Añadir observación" deshabilitado si el proyecto ha finalizado
- [ ] Botón corazón → toggle like
- [ ] Botón descargar CSV (si aplica) → descarga el archivo

### 4.5 Acciones de admin/creador
- [ ] Botón "Editar" → navega a `/projects/:id/edit`
- [ ] Botón "Invitar" → abre modal de invitación con email
- [ ] Modal invitación: muestra invitaciones enviadas con estado
- [ ] Modal invitación: botón cancelar invitación pendiente
- [ ] Botón "Eliminar" (solo creador) → abre diálogo de confirmación
- [ ] Confirmar eliminación → navega a `/` y el proyecto desaparece

---

## 5. Crear / Editar Proyecto

### 5.1 Crear proyecto nuevo
- [ ] Navegar a `/projects/new` muestra el formulario vacío
- [ ] Campo nombre obligatorio: guardar sin nombre → botón deshabilitado
- [ ] Guardar con nombre → crea el proyecto y redirige al detalle

### 5.2 Información básica (tab Info)
- [ ] Campo nombre: texto libre
- [ ] Campo descripción: editor rich text con selector de idioma (default, EN, ES, PT, IT, FR, DE)
- [ ] Cambiar idioma en descripción → campo muestra/edita ese idioma
- [ ] Cover: clic en el área abre selector de archivo
- [ ] Cover: al seleccionar imagen abre diálogo de recorte
- [ ] Cover: confirmar recorte → muestra preview
- [ ] Cover: botón "Remove cover" elimina la imagen
- [ ] Topics: selector dropdown, aparecen como chips eliminables
- [ ] No se pueden seleccionar topics duplicados

### 5.3 Toggles de configuración
- [ ] Switch "Privado" → activa y aparece campo de contraseña
- [ ] Switch "Private data" → se activa/desactiva
- [ ] Switch "Global" → al desactivar aparece selector de países
- [ ] Selector de países: añade países como chips
- [ ] Chips de países: botón × los elimina
- [ ] Switch "Fuzzy" → se activa/desactiva
- [ ] Switch "Finalizado" → se activa con borde rojo
- [ ] Switch "Email al recibir observación" → se activa/desactiva
- [ ] Selector "Plataformas permitidas": all / mobile / web

### 5.4 Campos de observación (tab Fields)
- [ ] Selector de idioma global: píldoras en la barra sticky
- [ ] Cambiar idioma global → todos los campos muestran ese idioma
- [ ] Botón "Añadir campo" → aparece nueva tarjeta al final
- [ ] Al añadir campo hace scroll hasta él
- [ ] Drag & drop: arrastrar tarjeta por el handle cambia el orden
- [ ] Botón papelera en tarjeta → elimina el campo
- [ ] Clic en tarjeta → se marca con borde (seleccionada)

#### Para cada campo:
- [ ] Selector de tipo: muestra icono + label (7 tipos disponibles)
- [ ] Al cambiar tipo → icono del header cambia
- [ ] Campo "Question": texto localizado, se edita por idioma
- [ ] Campo "Help text": texto localizado opcional
- [ ] Switch "Required": activa/desactiva
- [ ] Franja de color izquierda según tipo del campo

#### Campos CHOICE / MCHOICE:
- [ ] Switch "Allow other" visible
- [ ] Chips de opciones visibles
- [ ] Escribir en chip "Add…" + Enter → crea nuevo chip
- [ ] Clic en chip existente → edita inline
- [ ] Enter o click fuera al editar → guarda el valor
- [ ] Botón × en chip → elimina la opción
- [ ] El value (slug) aparece en pequeño debajo de los chips
- [ ] Cambiar idioma global → chips muestran el label en ese idioma
- [ ] Dos opciones con el mismo value → error al guardar

### 5.5 Mensaje de éxito (tab Message)
- [ ] Editor rich text localizado
- [ ] Cambiar idioma muestra/edita ese idioma

### 5.6 Organizaciones (tab Orgs)
- [ ] Lista de organizaciones propias disponibles para vincular
- [ ] Toggle para vincular/desvincular organizaciones

### 5.7 Guardar
- [ ] Botón "Guardar" deshabilitado si no hay nombre
- [ ] Guardar correctamente → toast de confirmación + redirige al detalle
- [ ] Error al guardar → toast de error

### 5.8 Import / Export JSON
- [ ] Botón "Export JSON" descarga el proyecto como archivo `.json`
- [ ] Botón "Import JSON" abre selector de archivo
- [ ] Importar JSON válido → rellena el formulario con los datos
- [ ] Importar JSON inválido → toast de error

### 5.9 Editar proyecto existente
- [ ] Navegar a `/projects/:id/edit` carga los datos actuales del proyecto
- [ ] Campos de observación existentes aparecen correctamente
- [ ] Los choices existentes tienen sus values preservados (no se regeneran)
- [ ] Modificar datos y guardar → actualiza el proyecto
- [ ] Añadir campos nuevos a proyecto sin field_form → se guardan correctamente

---

## 6. Añadir Observación

### 6.1 Selección de ubicación
- [ ] Al entrar, alerta indica que hay que seleccionar ubicación
- [ ] Clic en el mapa → aparece marcador y coordenadas en la alerta
- [ ] Coordenadas muestran 5 decimales
- [ ] Intentar enviar sin ubicación → error de validación

### 6.2 Campos del formulario
- [ ] Preguntas aparecen ordenadas por `order`
- [ ] Cada pregunta muestra: label, badge de tipo, help text (si existe)
- [ ] Campos obligatorios marcados con `*` rojo

#### Tipos de campo:
- [ ] **STR** (Texto): Textarea funcional
- [ ] **NUM / INT / FLOAT**: Input numérico (acepta decimales con FLOAT)
- [ ] **DATE**: Selector de fecha
- [ ] **BOOL**: Switch (Sí/No)
- [ ] **CHOICE**: Dropdown con opciones; si hay "Otro…" aparece input de texto al seleccionarlo
- [ ] **MCHOICE**: Dropdown para añadir opciones; chips mostrando las seleccionadas; × para eliminar cada una; soporte "Otro…"
- [ ] **IMG / IMAGE**: Input de archivo, muestra preview de la imagen seleccionada
- [ ] **FILE**: Input de archivo
- [ ] **QR / BARCODE**: Input de texto + botón de cámara; cámara abre visor inline; detección automática cierra la cámara y rellena el campo; botón × cancela el escaneo

### 6.3 Envío
- [ ] Enviar con campos correctos → toast de éxito o modal con mensaje
- [ ] Si el proyecto tiene `post_observation_message` → aparece modal con HTML renderizado
- [ ] Cerrar modal → redirige al detalle del proyecto
- [ ] Error en el servidor → toast de error

---

## 7. Organizaciones

### 7.1 Listado
- [ ] Carga y muestra todas las organizaciones
- [ ] Tab "Mis organizaciones" filtra las propias
- [ ] Si hay invitaciones pendientes → banner visible con botones aceptar/rechazar
- [ ] Aceptar invitación → desaparece del banner, aparece en "Mis organizaciones"
- [ ] Rechazar invitación → desaparece del banner

### 7.2 Crear organización
- [ ] Botón "+ Nueva organización" abre diálogo de creación
- [ ] Formulario de creación: nombre, descripción, logo, cover
- [ ] Guardar → aparece en el listado

### 7.3 Detalle de organización
- [ ] Carga nombre, descripción, logo, cover, datos de contacto
- [ ] Tab "Proyectos": lista los proyectos de la organización
- [ ] Tab "Miembros": lista admins y miembros separados
- [ ] Tab "Invitaciones" (solo admins/creadores): lista invitaciones enviadas

### 7.4 Acciones de admin/creador
- [ ] Botón "Editar" → abre diálogo de edición
- [ ] Editar y guardar → datos actualizados
- [ ] Botón "Invitar" → abre diálogo con email + rol (member/administrator)
- [ ] Enviar invitación → aparece en lista de invitaciones
- [ ] Cancelar invitación pendiente → desaparece de la lista
- [ ] Botón "Eliminar" (creador) → confirmación → redirige al listado

### 7.5 Miembro no creador
- [ ] Botón "Salir" visible → confirmación → usuario deja la organización

---

## 8. Perfil de Usuario

### 8.1 Ver perfil
- [ ] Muestra nombre, país, visibilidad, biografía
- [ ] Tab "Proyectos": secciones de admin, participando y me gusta
- [ ] Tab "Organizaciones": secciones de gestión y membresía
- [ ] Cada proyecto/org cliclable → navega al detalle

### 8.2 Editar perfil
- [ ] Botón "Editar" abre el diálogo
- [ ] Modificar nombre → se actualiza
- [ ] Subir nueva foto de cover → preview visible
- [ ] Editar biografía con rich text
- [ ] Cambiar país → se guarda
- [ ] Toggle visibilidad → se guarda
- [ ] Guardar → toast de éxito

### 8.3 Eliminar cuenta
- [ ] Botón "Eliminar cuenta" en zona de peligro del diálogo de edición
- [ ] Toggle "Mantener observaciones" disponible
- [ ] Confirmar → logout automático y redirige a `/login`

---

## 9. Invitaciones

### 9.1 Vista general
- [ ] Muestra invitaciones pendientes de proyectos y organizaciones
- [ ] Cada tarjeta muestra: nombre, rol, quién invitó, fecha de expiración
- [ ] Invitaciones expiradas aparecen con badge "Expirado" y sin botones de acción

### 9.2 Acciones
- [ ] Aceptar invitación de proyecto → redirige al detalle del proyecto
- [ ] Rechazar invitación de proyecto → desaparece de la lista
- [ ] Aceptar invitación de organización → redirige al detalle de la organización
- [ ] Rechazar invitación de organización → desaparece de la lista
- [ ] Si no hay invitaciones → mensaje "No hay invitaciones pendientes"

### 9.3 Navbar
- [ ] Badge en campana refleja el número correcto de invitaciones totales
- [ ] Tras aceptar/rechazar → badge se actualiza (polling cada 60s o tras mutación)

---

## 10. Páginas Públicas

### 10.1 About (`/about`)
- [ ] Carga sin requerir autenticación
- [ ] Si autenticado: botón "Explorar proyectos" lleva a `/`
- [ ] Si no autenticado: botón "Login" lleva a `/login`

### 10.2 Privacy Policy (`/privacy-policy`)
- [ ] Accesible sin login
- [ ] Contenido visible y legible

### 10.3 Delete Account (`/delete-account`)
- [ ] Accesible sin login
- [ ] Muestra información sobre el proceso de eliminación

---

## 11. Comportamiento Global

### 11.1 Persistencia de sesión
- [ ] Recargar la página → sigue logueado y el navbar muestra el avatar
- [ ] Abrir en nueva pestaña → sigue logueado
- [ ] Token expirado → redirige automáticamente a `/login`

### 11.2 Manejo de errores
- [ ] Error de red → toast con mensaje de error
- [ ] Error 401 → logout automático + redirige a `/login`
- [ ] Error 500 del servidor → toast con descripción del error

### 11.3 Rutas protegidas
- [ ] Acceder a `/` sin login → redirige a `/login`
- [ ] Acceder a `/projects/new` sin login → redirige a `/login`
- [ ] Ruta inexistente → redirige a `/`

### 11.4 Cambio de idioma
- [ ] Cambiar idioma desde la navbar → textos de la UI se actualizan
- [ ] El idioma se mantiene al navegar entre páginas
- [ ] Las respuestas del backend reflejan el idioma activo (Accept-Language header)

### 11.5 Responsive
- [ ] En móvil: navbar, tarjetas y formularios se adaptan correctamente
- [ ] Diálogos y modales centrados y legibles en pantallas pequeñas
