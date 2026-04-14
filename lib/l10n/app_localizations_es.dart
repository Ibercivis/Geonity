// ignore: unused_import
import 'package:intl/intl.dart' as intl;
import 'app_localizations.dart';

// ignore_for_file: type=lint

/// The translations for Spanish Castilian (`es`).
class AppLocalizationsEs extends AppLocalizations {
  AppLocalizationsEs([String locale = 'es']) : super(locale);

  @override
  String get cancel => 'Cancelar';

  @override
  String get confirm => 'Confirmar';

  @override
  String get save => 'Guardar';

  @override
  String get delete => 'Borrar';

  @override
  String get edit => 'Editar';

  @override
  String get close => 'Cerrar';

  @override
  String get back => 'Volver';

  @override
  String get finish => 'Finalizar';

  @override
  String get accept => 'Aceptar';

  @override
  String get reject => 'Rechazar';

  @override
  String get send => 'Enviar';

  @override
  String get invite => 'Invitar';

  @override
  String get yes => 'Sí';

  @override
  String get no => 'No';

  @override
  String get error => 'Error';

  @override
  String get success => 'Éxito';

  @override
  String get next => 'Siguiente';

  @override
  String get insert => 'Insertar';

  @override
  String get qrScannerTitle => 'Escanear código';

  @override
  String get qrScannerCodeDetected => 'Código detectado';

  @override
  String get qrScannerConfirmCode => '¿Es este el código correcto?';

  @override
  String get qrScannerInstructions => 'Apunta al código QR o código de barras';

  @override
  String get appTitle => 'Geonity';

  @override
  String get appSubtitle => 'Observaciones geolocalizadas';

  @override
  String get loginTitle => 'Iniciar sesión';

  @override
  String get loginEmailLabel => 'Email';

  @override
  String get loginEmailHint => 'tu@email.com';

  @override
  String get loginEmailRequired => 'Introduce tu email';

  @override
  String get loginUsernameLabel => 'Username/Email';

  @override
  String get loginUsernameHint => 'usuario o email';

  @override
  String get loginPasswordLabel => 'Contraseña';

  @override
  String get loginErrorMessage =>
      'Error al iniciar sesión. Verifica tus credenciales.';

  @override
  String get loginUsernameRequired => 'Por favor ingresa tu usuario o email';

  @override
  String get loginPasswordRequired => 'Por favor ingresa tu contraseña';

  @override
  String get loginPasswordMinLength =>
      'La contraseña debe tener al menos 6 caracteres';

  @override
  String get loginNoAccount => '¿No tienes cuenta? ';

  @override
  String get loginRegister => 'Regístrate';

  @override
  String get registerTitle => 'Crear cuenta';

  @override
  String get registerEmailHint => 'tu@email.com';

  @override
  String get registerEmailInvalid => 'Email no válido';

  @override
  String get registerPasswordLabel => 'Contraseña';

  @override
  String get registerPasswordRequired => 'Introduce una contraseña';

  @override
  String get registerPasswordMinLength => 'Mínimo 8 caracteres';

  @override
  String get registerPasswordRepeatLabel => 'Repetir contraseña';

  @override
  String get registerPasswordRepeatRequired => 'Repite la contraseña';

  @override
  String get registerPasswordMismatch => 'Las contraseñas no coinciden';

  @override
  String get registerCheckEmail => 'Revisa tu email para confirmar tu cuenta';

  @override
  String get registerCreateAccount => 'Crear cuenta';

  @override
  String get registerAlreadyHaveAccount => '¿Ya tienes cuenta? ';

  @override
  String get registerSignIn => 'Inicia sesión';

  @override
  String get navProjects => 'Proyectos';

  @override
  String get navOrganizations => 'Organizaciones';

  @override
  String get navProfile => 'Perfil';

  @override
  String get createNewTitle => 'Crear nuevo';

  @override
  String get createNewProject => 'Nuevo Proyecto';

  @override
  String get createNewOrganization => 'Nueva Organización';

  @override
  String get logout => 'Cerrar sesión';

  @override
  String get dangerZone => 'Zona de peligro';

  @override
  String get deleteAccount => 'Eliminar cuenta';

  @override
  String get deleteAccountTitle => 'Eliminar cuenta';

  @override
  String get deleteAccountMessage =>
      'Esta acción es irreversible. Tu cuenta será eliminada permanentemente.';

  @override
  String get deleteAccountKeepObservations => 'Mantener mis observaciones';

  @override
  String get deleteAccountObservationsWarning =>
      'Si desactivas esta opción, todas tus observaciones serán eliminadas.';

  @override
  String get invitationsTitle => 'Invitaciones';

  @override
  String invitationsCount(Object count) {
    return 'Invitaciones ($count)';
  }

  @override
  String get invitationsEmpty => 'No tienes invitaciones pendientes';

  @override
  String get invitationAccepted => '¡Invitación aceptada!';

  @override
  String get invitationRejected => 'Invitación rechazada';

  @override
  String get invitationToProject => 'proyecto';

  @override
  String get invitationToOrganization => 'institución';

  @override
  String get searchProjects => 'Buscar proyectos';

  @override
  String get searchResults => 'RESULTADOS DE BÚSQUEDA';

  @override
  String searchResultsCount(Object query, Object count) {
    return '\"$query\" - $count resultado';
  }

  @override
  String searchResultsCountPlural(Object query, Object count) {
    return '\"$query\" - $count resultados';
  }

  @override
  String get myProjects => 'Mis proyectos';

  @override
  String get exploreProjects => 'Explorar';

  @override
  String get drafts => 'Borradores';

  @override
  String get noDraftsTitle => 'Sin borradores';

  @override
  String get noDraftsSubtitle =>
      'Los proyectos que guardes como borrador aparecerán aquí';

  @override
  String get continueDraft => 'Continuar editando';

  @override
  String get noMyProjectsTitle => 'Sin proyectos';

  @override
  String get noMyProjectsSubtitle => 'Únete a un proyecto o crea el tuyo';

  @override
  String get filterByCategory => 'Filtrar por categoría';

  @override
  String get category => 'Categoría';

  @override
  String projectCreatedBy(Object creator) {
    return 'Creado por: $creator';
  }

  @override
  String get projectInstitutions => 'Instituciones';

  @override
  String get projectLoadError => 'No se pudo cargar el proyecto';

  @override
  String get projectDeleteConfirmTitle => '¿Borrar proyecto?';

  @override
  String get projectDeleteConfirmMessage => 'Esta acción no se puede deshacer.';

  @override
  String get projectDeleted => 'Proyecto eliminado';

  @override
  String get projectDeleteError => 'Error al eliminar el proyecto';

  @override
  String get projectAvailableOffline => 'Proyecto disponible sin conexión';

  @override
  String get projectOfflineDeleteTitle => 'Eliminar datos offline';

  @override
  String get projectOfflineDeleteMessage =>
      'Se eliminarán los datos y el mapa descargado. Las observaciones pendientes de sincronizar no se perderán.';

  @override
  String get projectUpdated => 'Proyecto actualizado exitosamente';

  @override
  String get projectCreated => 'Proyecto creado exitosamente';

  @override
  String get projectUpdateError => 'Error al actualizar el proyecto';

  @override
  String get projectCreateError => 'Error al crear el proyecto';

  @override
  String get editProjectTitle => 'Editar Proyecto';

  @override
  String get newProjectTitle => 'Nuevo Proyecto';

  @override
  String get whatToEdit => '¿Qué deseas editar?';

  @override
  String get addCoverImage => 'Añadir imagen de portada';

  @override
  String get projectDescriptionLabel => 'Descripción *';

  @override
  String get projectDescriptionRequired => 'Por favor ingresa una descripción';

  @override
  String get globalProjectSubtitle =>
      'El proyecto está abierto a todo el mundo';

  @override
  String get addCountry => 'Añadir país';

  @override
  String get projectPasswordLabel => 'Contraseña del proyecto *';

  @override
  String get projectPasswordRequired =>
      'La contraseña es obligatoria para proyectos privados';

  @override
  String get offlineProjectsShown =>
      'Sin conexión — mostrando proyectos guardados offline';

  @override
  String get organizationsTitle => 'Organizaciones';

  @override
  String get organizationLoadError => 'No se pudo cargar la organización';

  @override
  String get organizationDeleteConfirmTitle => '¿Borrar organización?';

  @override
  String get organizationDeleteConfirmMessage =>
      'Esta acción no se puede deshacer.';

  @override
  String get organizationDeleted => 'Organización eliminada';

  @override
  String get organizationDeleteError => 'Error al eliminar la organización';

  @override
  String get organizationLeaveConfirmTitle => 'Abandonar organización';

  @override
  String get organizationLeaveConfirmMessage =>
      '¿Estás seguro de que quieres abandonar esta organización?';

  @override
  String get organizationLeft => 'Has abandonado la organización';

  @override
  String get organizationLeaveError => 'Error al abandonar la organización';

  @override
  String get organizationProjects => 'Proyectos';

  @override
  String get organizationMembers => 'Miembros';

  @override
  String get organizationRoleCreator => 'Creador';

  @override
  String get organizationRoleAdministrator => 'Administrador';

  @override
  String get organizationRoleMember => 'Miembro';

  @override
  String get createOrganizationTitle => 'Crear organización';

  @override
  String get editOrganizationTitle => 'Editar organización';

  @override
  String get organizationNameLabel => 'Nombre de la organización';

  @override
  String get organizationNameHint => 'Escribe el nombre de la organización...';

  @override
  String get organizationNameRequired =>
      'Por favor ingresa el nombre de la organización';

  @override
  String get organizationBiographyLabel => 'Biografía';

  @override
  String get organizationBiographyHint =>
      'Presenta tu organización en la biografía';

  @override
  String get organizationProfileImage => 'Imagen del perfil';

  @override
  String get organizationCoverImage => 'Imagen de portada';

  @override
  String get organizationCreated => 'Organización creada exitosamente';

  @override
  String get organizationUpdated => 'Organización actualizada exitosamente';

  @override
  String get organizationCreateError => 'Error al crear la organización';

  @override
  String get organizationUpdateError => 'Error al actualizar la organización';

  @override
  String get adminAndInvitationsTitle => 'Administradores e Invitaciones';

  @override
  String get administrators => 'Administradores';

  @override
  String get inviteAsAdminInstruction =>
      'Invita a otros usuarios como administradores del proyecto';

  @override
  String get emailExampleHint => 'correo@ejemplo.com';

  @override
  String get creator => 'Creador';

  @override
  String get administrator => 'Administrador';

  @override
  String get inviteMemberTitle => 'Invitar miembro';

  @override
  String get inviteMemberEmailLabel => 'Email';

  @override
  String get inviteMemberEmailHint => 'usuario@ejemplo.com';

  @override
  String get inviteMemberRoleLabel => 'Rol';

  @override
  String get inviteMemberEmailInvalid => 'Por favor ingresa un email válido';

  @override
  String get invitationSent => 'Invitación enviada correctamente';

  @override
  String get invitationSendError => 'Error al enviar la invitación';

  @override
  String get invitationSendInstruction =>
      'Invita a otros usuarios a la organización';

  @override
  String get invitationsSentLabel => 'Invitaciones enviadas:';

  @override
  String get invitationsExpireInfo => 'Las invitaciones expiran en 7 días';

  @override
  String get manageMembersTitle => 'Gestión de Miembros';

  @override
  String get currentManagement => 'Gestión actual';

  @override
  String get pendingInvitations => 'Invitaciones pendientes';

  @override
  String invitedBy(Object name) {
    return 'Invitado por $name';
  }

  @override
  String expires(Object date) {
    return 'Expira: $date';
  }

  @override
  String get statusPending => 'Pendiente';

  @override
  String get emailRequired => 'Por favor, introduce un correo electrónico';

  @override
  String get emailValidRequired =>
      'Por favor, introduce un correo electrónico válido';

  @override
  String get emailAlreadyInvited => 'Este correo ya ha sido invitado';

  @override
  String get mapTitle => 'Mapa';

  @override
  String get mapInteractive => 'Interactive map will appear here';

  @override
  String get mapNoObservations =>
      'Este proyecto no tiene mapa de observaciones';

  @override
  String get mapNoFieldForm =>
      'El proyecto no cuenta con un formulario de campo configurado para registrar observaciones.';

  @override
  String get mapGettingLocation => 'Obteniendo ubicación...';

  @override
  String get mapLocationServicesDisabled =>
      'Los servicios de ubicación están desactivados';

  @override
  String get mapLocationPermissionDenied => 'Permisos de ubicación denegados';

  @override
  String get mapLocationPermissionPermanentlyDenied =>
      'Los permisos de ubicación están permanentemente denegados';

  @override
  String mapLocationError(Object error) {
    return 'Error al obtener la ubicación: $error';
  }

  @override
  String get fuzzyPrivacyNote =>
      'Por razones de privacidad, se muestra la zona aproximada de observación.';

  @override
  String get observationAdminValues => 'Valores de administración';

  @override
  String offlinePendingBadge(Object count) {
    return '$count obs. pendientes de envío';
  }

  @override
  String get offlineModeBadge => 'Modo sin conexión';

  @override
  String observationTitle(Object id) {
    return 'Observación #$id';
  }

  @override
  String get observationDate => 'Fecha';

  @override
  String get observationCoordinates => 'Coordenadas';

  @override
  String get observationUser => 'Usuario';

  @override
  String get observationDescription => 'Descripción';

  @override
  String get observationAdditionalData => 'Datos adicionales';

  @override
  String observationImages(Object count) {
    return 'Imágenes ($count)';
  }

  @override
  String get observationCenterOnMap => 'Centrar en el mapa';

  @override
  String get observationImageLoadError => 'Error al cargar la imagen';

  @override
  String get profileObservationDefault => 'Observación';

  @override
  String get addObservationTitle => 'Nueva observación';

  @override
  String get addObservationSubmit => 'Enviar observación';

  @override
  String addObservationLocationError(Object error) {
    return 'Error al obtener ubicación: $error';
  }

  @override
  String get observationCreated => 'Observación creada exitosamente';

  @override
  String get observationCreateError => 'Error al crear la observación';

  @override
  String get offlineObservationSaved =>
      'Sin conexión — Observación guardada, se enviará al recuperar señal';

  @override
  String get selectAtLeastOneOption => 'Selecciona al menos una opción';

  @override
  String get fieldRequired => 'Campo requerido';

  @override
  String fieldEnter(Object label) {
    return 'Ingresa $label';
  }

  @override
  String fieldSelect(Object label) {
    return 'Selecciona $label';
  }

  @override
  String get fieldSelectDate => 'Selecciona fecha';

  @override
  String get fieldAddImage => 'Agregar imagen';

  @override
  String get fieldScanCode => 'Escanea un código';

  @override
  String get imagePickerTitle => 'Seleccionar imagen';

  @override
  String get imagePickerTakePhoto => 'Tomar foto';

  @override
  String get imagePickerChooseGallery => 'Elegir de galería';

  @override
  String get profileEditTitle => 'Editar Perfil';

  @override
  String get profileCoverImage => 'Imagen de portada';

  @override
  String get profileCoverImageChange => 'Toca para cambiar imagen';

  @override
  String get profileCoverImageAdd => 'Toca para agregar imagen de portada';

  @override
  String get profileFirstName => 'Nombre';

  @override
  String get profileFirstNameRequired => 'Por favor ingresa tu nombre';

  @override
  String get profileLastName => 'Apellido';

  @override
  String get profileLastNameRequired => 'Por favor ingresa tu apellido';

  @override
  String get profileBiography => 'Biografía';

  @override
  String get profileBiographyHint => 'Cuéntanos sobre ti...';

  @override
  String get profileCountry => 'País';

  @override
  String get profileCountrySearch => 'Buscar país';

  @override
  String get profileCountrySearchHint => 'Empieza a escribir...';

  @override
  String get profileCountrySelect => 'Selecciona tu país';

  @override
  String get profilePublic => 'Perfil público';

  @override
  String get profilePublicDescription =>
      'Permite que otros usuarios vean tu perfil';

  @override
  String get profileSaveChanges => 'Guardar Cambios';

  @override
  String get profileUpdated => 'Perfil actualizado exitosamente';

  @override
  String get profileUpdateError => 'Error al actualizar el perfil';

  @override
  String get settings => 'Configuración';

  @override
  String get languageTitle => 'Idioma';

  @override
  String get languageSpanish => 'Español';

  @override
  String get languageEnglish => 'English';

  @override
  String get languagePortuguese => 'Português';

  @override
  String get languageItalian => 'Italiano';

  @override
  String get languageSystem => 'Idioma del sistema';

  @override
  String get appVersion => 'Versión';

  @override
  String get whatsNew => 'Novedades';

  @override
  String get themeTitle => 'Tema';

  @override
  String get themeLight => 'Claro';

  @override
  String get themeDark => 'Oscuro';

  @override
  String get themeSystem => 'Automático';

  @override
  String collaboratingOrganizations(Object count) {
    return '$count organizaciones colaboradoras';
  }

  @override
  String myObservations(Object count) {
    return 'Mis Observaciones ($count)';
  }

  @override
  String myOrganizations(Object count) {
    return 'Mis Organizaciones ($count)';
  }

  @override
  String get timeAgoMoment => 'Hace un momento';

  @override
  String timeAgoMinutes(Object minutes) {
    return 'Hace $minutes min';
  }

  @override
  String timeAgoHours(Object hours) {
    return 'Hace ${hours}h';
  }

  @override
  String timeAgoDays(Object days) {
    return 'Hace ${days}d';
  }

  @override
  String timeAgoWeeks(Object weeks) {
    return 'Hace $weeks sem';
  }

  @override
  String timeAgoMonths(Object months) {
    return 'Hace $months mes';
  }

  @override
  String timeAgoMonthsPlural(Object months) {
    return 'Hace $months meses';
  }

  @override
  String timeAgoYears(Object years) {
    return 'Hace $years año';
  }

  @override
  String timeAgoYearsPlural(Object years) {
    return 'Hace $years años';
  }

  @override
  String get roleMember => 'Miembro';

  @override
  String get roleAdministrator => 'Administrador';

  @override
  String get leave => 'Abandonar';

  @override
  String get leaveOrganization => 'Abandonar organización';

  @override
  String get leaveOrganizationConfirm =>
      '¿Estás seguro de que quieres abandonar esta organización?';

  @override
  String get leftOrganization => 'Has abandonado la organización';

  @override
  String get leaveOrganizationError => 'Error al abandonar la organización';

  @override
  String get inviteMember => 'Invitar miembro';

  @override
  String get sendInvitation => 'Enviar invitación';

  @override
  String get enterValidEmail => 'Por favor ingresa un email válido';

  @override
  String get deleteOrganizationQuestion => '¿Borrar organización?';

  @override
  String get deleteOrganizationConfirm => 'Esta acción no se puede deshacer.';

  @override
  String get deleteOrganizationError => 'Error al eliminar la organización';

  @override
  String get errorLoadingOrganization => 'No se pudo cargar la organización';

  @override
  String get errorLoadingProfile => 'Error al cargar el perfil';

  @override
  String get gettingLocation => 'Obteniendo ubicación...';

  @override
  String get locationServicesDisabled =>
      'Los servicios de ubicación están desactivados';

  @override
  String get locationPermissionDenied => 'Permisos de ubicación denegados';

  @override
  String get locationPermissionDeniedPermanently =>
      'Los permisos de ubicación están permanentemente denegados';

  @override
  String errorGettingLocation(Object error) {
    return 'Error al obtener la ubicación: $error';
  }

  @override
  String get centerOnMap => 'Centrar en el mapa';

  @override
  String get selectImage => 'Seleccionar imagen';

  @override
  String get takePhoto => 'Tomar foto';

  @override
  String get chooseFromGallery => 'Elegir de galería';

  @override
  String get addImage => 'Agregar imagen';

  @override
  String get tapToChangeImage => 'Toca para cambiar imagen';

  @override
  String get tapToAddCoverImage => 'Toca para agregar imagen de portada';

  @override
  String selectLowercase(Object label) {
    return 'Selecciona $label';
  }

  @override
  String get selectTopics => 'Seleccionar Temas';

  @override
  String get privateProject => 'Proyecto privado';

  @override
  String get privateProjectSubtitle => 'Requiere contraseña para unirse';

  @override
  String get privateDatabase => 'Base de datos privada';

  @override
  String get privateDatabaseSubtitle => 'Los datos no se pueden descargar';

  @override
  String get privateProjectsRequirePassword =>
      'Los proyectos privados requieren contraseña';

  @override
  String get saveBasicInfo => 'Guardar información básica';

  @override
  String get saveBasicInfoSubtitle => 'Nombre, descripción, privacidad, etc.';

  @override
  String get editFormFields => 'Editar campos del formulario';

  @override
  String get editFormFieldsSubtitle => 'Añadir, editar o eliminar campos';

  @override
  String projectHasObservations(Object count) {
    return '⚠️ Este proyecto tiene $count observaciones';
  }

  @override
  String get addOption => 'Añadir opción';

  @override
  String get cannotDeleteFieldWithObservations =>
      'No se puede eliminar un campo que tiene observaciones';

  @override
  String get noFieldTypesAvailable => 'No hay tipos de campo disponibles';

  @override
  String get cannotChangeFieldTypeWithObservations =>
      'No se puede cambiar el tipo de un campo que tiene observaciones';

  @override
  String get selectFieldType => 'Seleccionar tipo de campo';

  @override
  String fieldMustHaveOptions(Object fieldName) {
    return 'El campo \"$fieldName\" de tipo CHOICE debe tener al menos una opción';
  }

  @override
  String get jsonToSend => 'JSON a enviar';

  @override
  String get noChanges => 'Sin cambios';

  @override
  String get noChangesDetected =>
      'No se detectaron cambios en los campos del formulario.\\n\\nNo se enviará field_form al backend.';

  @override
  String get cannotChangeRequiredWithObservations =>
      'No se puede cambiar el estado obligatorio de un campo que tiene observaciones';

  @override
  String get newFieldsCannotBeRequiredWithObservations =>
      'Los campos nuevos no pueden ser obligatorios cuando ya hay observaciones';

  @override
  String get enterEmail => 'Por favor, introduce un correo electrónico';

  @override
  String get enterValidEmailFormat =>
      'Por favor, introduce un correo electrónico válido';

  @override
  String get updateInstitutionsError => 'Error al actualizar las instituciones';

  @override
  String get institutionsUpdated => 'Instituciones actualizadas correctamente';

  @override
  String get confirmationMessageTitle => 'Mensaje de confirmación';

  @override
  String get showPostMessageLabel => 'Mostrar mensaje tras la observación';

  @override
  String get insertLinkTitle => 'Insertar enlace';

  @override
  String get linkTextLabel => 'Texto del enlace';

  @override
  String get linkUrlLabel => 'URL';

  @override
  String get editTab => 'Editar';

  @override
  String get previewTab => 'Previsualizar';

  @override
  String get messageHint => 'Escribe el mensaje aquí...';

  @override
  String get messageEmptyPreview => 'Sin contenido para previsualizar';

  @override
  String get messageInfo =>
      'Este mensaje aparecerá al usuario tras añadir una observación';

  @override
  String get tooltipBold => 'Negrita';

  @override
  String get tooltipItalic => 'Cursiva';

  @override
  String get tooltipLink => 'Enlace';

  @override
  String get tooltipList => 'Lista';

  @override
  String get addLanguageTitle => 'Añadir idioma';

  @override
  String get translationLanguageLabel => 'Idioma de traducción';

  @override
  String get translationSelectLanguage => 'Selecciona un idioma';

  @override
  String get translationSelectLanguageHint =>
      'Selecciona un idioma para ver los campos a traducir';

  @override
  String get translationDescriptionLabel => 'Descripción';

  @override
  String get translationPostMessageLabel => 'Mensaje post-observación';

  @override
  String translationOptionLabel(Object key) {
    return 'Opción: \"$key\"';
  }

  @override
  String translationHint(Object lang) {
    return 'Traducción en $lang...';
  }

  @override
  String get translationSectionProject => 'Proyecto';

  @override
  String get translationNameLabel => 'Nombre';

  @override
  String get translationSectionQuestions => 'Preguntas del formulario';

  @override
  String translationQuestionHeader(int number) {
    return 'Pregunta $number';
  }

  @override
  String get translationQuestionTextLabel => 'Texto de la pregunta';

  @override
  String get translationHelpTextLabel => 'Texto de ayuda';

  @override
  String get translationSectionOptions => 'OPCIONES';

  @override
  String get skip => 'Omitir';

  @override
  String get update => 'Actualizar';

  @override
  String get create => 'Crear';

  @override
  String get projectNameLabel => 'Nombre del proyecto *';

  @override
  String get projectNameRequired => 'Por favor ingresa un nombre';

  @override
  String get searchHint => 'Buscar...';

  @override
  String get selectOrganizationsDialog => 'Seleccionar Organizaciones';

  @override
  String get topicsLabel => 'Temas';

  @override
  String get organizationsLabel => 'Organizaciones';

  @override
  String get globalLabel => 'Global';

  @override
  String get noTopicsAvailable => 'No hay temas disponibles';

  @override
  String get selectTopicsAction => 'Seleccionar temas';

  @override
  String get noOrganizationsAvailable => 'No hay organizaciones disponibles';

  @override
  String get selectOrganizationsAction => 'Seleccionar organizaciones';

  @override
  String get fuzzyGeoposition => 'Geoposición aproximada';

  @override
  String get fuzzyGeopositionSubtitle =>
      'Las observaciones se muestran como zonas aproximadas, no como puntos exactos';

  @override
  String get publicMap => 'Mapa público';

  @override
  String get publicMapSubtitle =>
      'Activa una página de mapa pública accesible sin inicio de sesión';

  @override
  String get projectPublished => 'Publicado';

  @override
  String get projectDraftSubtitle =>
      'El proyecto está en borrador. Necesita al menos 10 observaciones para publicarse.';

  @override
  String projectDraftSubtitleWithCount(int count) {
    return 'El proyecto está en borrador. Necesita al menos 10 observaciones para publicarse (actualmente tiene $count).';
  }

  @override
  String get projectPublishedSubtitle =>
      'El proyecto está publicado y visible para todos.';

  @override
  String get projectEnded => 'Finalizado';

  @override
  String get projectEndedSubtitle =>
      'El proyecto ya no acepta nuevas observaciones';

  @override
  String get emailOnObservation => 'Email al recibir observación';

  @override
  String get emailOnObservationSubtitle =>
      'Recibe un email cada vez que llegue una observación';

  @override
  String get coverImageRequired => 'La imagen de portada es obligatoria';

  @override
  String get organizationType => 'Tipo de organización';

  @override
  String get continueLabel => 'Continuar';

  @override
  String get optionLabelRequired => 'Texto *';

  @override
  String get optionLabelHint => 'Ej: Preocupación menor';

  @override
  String get optionValueLabel => 'Valor (opcional)';

  @override
  String get optionValueHint => 'Ej: lc';

  @override
  String get optionsLabel => 'Opciones';

  @override
  String get soonExpiry => 'Pronto';

  @override
  String get userFallback => 'Usuario';

  @override
  String get retry => 'Reintentar';

  @override
  String get viewMap => 'Ver mapa';

  @override
  String get adminBadge => 'Admin';

  @override
  String get badgeFinished => 'Finalizado';

  @override
  String get badgePrivate => 'Privado';

  @override
  String get badgeFuzzy => 'Fuzzy';

  @override
  String get badgeGlobal => 'Global';

  @override
  String get downloadCsv => 'Descargar CSV';

  @override
  String get projectObservationsShare => 'Observaciones del proyecto';

  @override
  String downloadErrorCode(Object code) {
    return 'Error al descargar: $code';
  }

  @override
  String get csvDownloadError => 'Error al descargar el CSV';

  @override
  String get noFieldFormError => 'Este proyecto no tiene formulario de campo';

  @override
  String get offlineDataDeleted => 'Datos offline eliminados';

  @override
  String offlineDownloadError(Object error) {
    return 'Error al descargar: $error';
  }

  @override
  String get removeOfflineTooltip => 'Eliminar offline';

  @override
  String get makeOfflineTooltip => 'Hacer disponible offline';

  @override
  String get deleteAccountError => 'Error al eliminar la cuenta';

  @override
  String get myProfile => 'Mi Perfil';

  @override
  String get profileObservations => 'Observaciones';

  @override
  String get profileProjects => 'Proyectos';

  @override
  String get profileOrganizationsLabel => 'Organizaciones';

  @override
  String createdProjectsCount(Object count) {
    return 'Proyectos Creados ($count)';
  }

  @override
  String participatedProjectsCount(Object count) {
    return 'Proyectos en los que Participo ($count)';
  }

  @override
  String likedProjectsCount(Object count) {
    return 'Proyectos que me Gustan ($count)';
  }

  @override
  String get additionalData => 'Datos adicionales';

  @override
  String fieldLabelFallback(Object key) {
    return 'Campo $key';
  }

  @override
  String get boolYes => 'Sí';

  @override
  String get boolNo => 'No';

  @override
  String get other => 'Otro';

  @override
  String get specify => 'Especifica...';

  @override
  String get noOptionsDefined => 'Sin opciones definidas';

  @override
  String get backendDown => 'Servidor caído';

  @override
  String get noConnectionTitle => 'Sin conexión';

  @override
  String get backendDownMessage =>
      'El servidor no responde.\nPor favor contacte con la Fundación Ibercivis.';

  @override
  String get noConnectionMessage =>
      'Por favor comprueba tu conexión a internet\ne inténtalo de nuevo.';

  @override
  String get emailFieldLabel => 'Email';

  @override
  String get roleLabel => 'Rol';

  @override
  String get inviteMemberHint => 'usuario@ejemplo.com';

  @override
  String get membersLabel => 'Miembros';

  @override
  String get projectsLabel => 'Proyectos';

  @override
  String get observationsInZone => 'Observaciones en esta zona';

  @override
  String get selectType => 'Seleccionar tipo';

  @override
  String get more => 'Más...';

  @override
  String get profileImageLabel => 'Imagen del perfil';

  @override
  String get coverImageLabel => 'Imagen de portada';

  @override
  String get noName => 'Sin nombre';

  @override
  String get fieldNameHint => 'Nombre del campo';

  @override
  String get noObservationMap => 'Este proyecto no tiene mapa de observaciones';

  @override
  String get observationZone => 'Zona de observaciones';

  @override
  String get helpTextHint => 'Texto de ayuda (opcional)';

  @override
  String get noOptionsAdded => 'No hay opciones. Añade al menos una opción.';

  @override
  String get projectPasswordWrong => 'Contraseña incorrecta.';

  @override
  String get privacyPolicy => 'Política de privacidad';

  @override
  String get deleteAccountWeb => 'Eliminar cuenta';
}
