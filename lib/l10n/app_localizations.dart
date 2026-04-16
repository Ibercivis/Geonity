import 'dart:async';

import 'package:flutter/foundation.dart';
import 'package:flutter/widgets.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:intl/intl.dart' as intl;

import 'app_localizations_en.dart';
import 'app_localizations_es.dart';
import 'app_localizations_it.dart';
import 'app_localizations_pt.dart';

// ignore_for_file: type=lint

/// Callers can lookup localized strings with an instance of AppLocalizations
/// returned by `AppLocalizations.of(context)`.
///
/// Applications need to include `AppLocalizations.delegate()` in their app's
/// `localizationDelegates` list, and the locales they support in the app's
/// `supportedLocales` list. For example:
///
/// ```dart
/// import 'l10n/app_localizations.dart';
///
/// return MaterialApp(
///   localizationsDelegates: AppLocalizations.localizationsDelegates,
///   supportedLocales: AppLocalizations.supportedLocales,
///   home: MyApplicationHome(),
/// );
/// ```
///
/// ## Update pubspec.yaml
///
/// Please make sure to update your pubspec.yaml to include the following
/// packages:
///
/// ```yaml
/// dependencies:
///   # Internationalization support.
///   flutter_localizations:
///     sdk: flutter
///   intl: any # Use the pinned version from flutter_localizations
///
///   # Rest of dependencies
/// ```
///
/// ## iOS Applications
///
/// iOS applications define key application metadata, including supported
/// locales, in an Info.plist file that is built into the application bundle.
/// To configure the locales supported by your app, you’ll need to edit this
/// file.
///
/// First, open your project’s ios/Runner.xcworkspace Xcode workspace file.
/// Then, in the Project Navigator, open the Info.plist file under the Runner
/// project’s Runner folder.
///
/// Next, select the Information Property List item, select Add Item from the
/// Editor menu, then select Localizations from the pop-up menu.
///
/// Select and expand the newly-created Localizations item then, for each
/// locale your application supports, add a new item and select the locale
/// you wish to add from the pop-up menu in the Value field. This list should
/// be consistent with the languages listed in the AppLocalizations.supportedLocales
/// property.
abstract class AppLocalizations {
  AppLocalizations(String locale)
    : localeName = intl.Intl.canonicalizedLocale(locale.toString());

  final String localeName;

  static AppLocalizations? of(BuildContext context) {
    return Localizations.of<AppLocalizations>(context, AppLocalizations);
  }

  static const LocalizationsDelegate<AppLocalizations> delegate =
      _AppLocalizationsDelegate();

  /// A list of this localizations delegate along with the default localizations
  /// delegates.
  ///
  /// Returns a list of localizations delegates containing this delegate along with
  /// GlobalMaterialLocalizations.delegate, GlobalCupertinoLocalizations.delegate,
  /// and GlobalWidgetsLocalizations.delegate.
  ///
  /// Additional delegates can be added by appending to this list in
  /// MaterialApp. This list does not have to be used at all if a custom list
  /// of delegates is preferred or required.
  static const List<LocalizationsDelegate<dynamic>> localizationsDelegates =
      <LocalizationsDelegate<dynamic>>[
        delegate,
        GlobalMaterialLocalizations.delegate,
        GlobalCupertinoLocalizations.delegate,
        GlobalWidgetsLocalizations.delegate,
      ];

  /// A list of this localizations delegate's supported locales.
  static const List<Locale> supportedLocales = <Locale>[
    Locale('en'),
    Locale('es'),
    Locale('it'),
    Locale('pt'),
  ];

  /// No description provided for @cancel.
  ///
  /// In es, this message translates to:
  /// **'Cancelar'**
  String get cancel;

  /// No description provided for @confirm.
  ///
  /// In es, this message translates to:
  /// **'Confirmar'**
  String get confirm;

  /// No description provided for @save.
  ///
  /// In es, this message translates to:
  /// **'Guardar'**
  String get save;

  /// No description provided for @delete.
  ///
  /// In es, this message translates to:
  /// **'Borrar'**
  String get delete;

  /// No description provided for @edit.
  ///
  /// In es, this message translates to:
  /// **'Editar'**
  String get edit;

  /// No description provided for @close.
  ///
  /// In es, this message translates to:
  /// **'Cerrar'**
  String get close;

  /// No description provided for @back.
  ///
  /// In es, this message translates to:
  /// **'Volver'**
  String get back;

  /// No description provided for @finish.
  ///
  /// In es, this message translates to:
  /// **'Finalizar'**
  String get finish;

  /// No description provided for @accept.
  ///
  /// In es, this message translates to:
  /// **'Aceptar'**
  String get accept;

  /// No description provided for @reject.
  ///
  /// In es, this message translates to:
  /// **'Rechazar'**
  String get reject;

  /// No description provided for @send.
  ///
  /// In es, this message translates to:
  /// **'Enviar'**
  String get send;

  /// No description provided for @invite.
  ///
  /// In es, this message translates to:
  /// **'Invitar'**
  String get invite;

  /// No description provided for @yes.
  ///
  /// In es, this message translates to:
  /// **'Sí'**
  String get yes;

  /// No description provided for @no.
  ///
  /// In es, this message translates to:
  /// **'No'**
  String get no;

  /// No description provided for @error.
  ///
  /// In es, this message translates to:
  /// **'Error'**
  String get error;

  /// No description provided for @success.
  ///
  /// In es, this message translates to:
  /// **'Éxito'**
  String get success;

  /// No description provided for @next.
  ///
  /// In es, this message translates to:
  /// **'Siguiente'**
  String get next;

  /// No description provided for @insert.
  ///
  /// In es, this message translates to:
  /// **'Insertar'**
  String get insert;

  /// No description provided for @qrScannerTitle.
  ///
  /// In es, this message translates to:
  /// **'Escanear código'**
  String get qrScannerTitle;

  /// No description provided for @qrScannerCodeDetected.
  ///
  /// In es, this message translates to:
  /// **'Código detectado'**
  String get qrScannerCodeDetected;

  /// No description provided for @qrScannerConfirmCode.
  ///
  /// In es, this message translates to:
  /// **'¿Es este el código correcto?'**
  String get qrScannerConfirmCode;

  /// No description provided for @qrScannerInstructions.
  ///
  /// In es, this message translates to:
  /// **'Apunta al código QR o código de barras'**
  String get qrScannerInstructions;

  /// No description provided for @appTitle.
  ///
  /// In es, this message translates to:
  /// **'Geonity'**
  String get appTitle;

  /// No description provided for @appSubtitle.
  ///
  /// In es, this message translates to:
  /// **'Observaciones geolocalizadas'**
  String get appSubtitle;

  /// No description provided for @loginTitle.
  ///
  /// In es, this message translates to:
  /// **'Iniciar sesión'**
  String get loginTitle;

  /// No description provided for @loginEmailLabel.
  ///
  /// In es, this message translates to:
  /// **'Email'**
  String get loginEmailLabel;

  /// No description provided for @loginEmailHint.
  ///
  /// In es, this message translates to:
  /// **'tu@email.com'**
  String get loginEmailHint;

  /// No description provided for @loginEmailRequired.
  ///
  /// In es, this message translates to:
  /// **'Introduce tu email'**
  String get loginEmailRequired;

  /// No description provided for @loginUsernameLabel.
  ///
  /// In es, this message translates to:
  /// **'Username/Email'**
  String get loginUsernameLabel;

  /// No description provided for @loginUsernameHint.
  ///
  /// In es, this message translates to:
  /// **'usuario o email'**
  String get loginUsernameHint;

  /// No description provided for @loginPasswordLabel.
  ///
  /// In es, this message translates to:
  /// **'Contraseña'**
  String get loginPasswordLabel;

  /// No description provided for @loginErrorMessage.
  ///
  /// In es, this message translates to:
  /// **'Error al iniciar sesión. Verifica tus credenciales.'**
  String get loginErrorMessage;

  /// No description provided for @loginUsernameRequired.
  ///
  /// In es, this message translates to:
  /// **'Por favor ingresa tu usuario o email'**
  String get loginUsernameRequired;

  /// No description provided for @loginPasswordRequired.
  ///
  /// In es, this message translates to:
  /// **'Por favor ingresa tu contraseña'**
  String get loginPasswordRequired;

  /// No description provided for @loginPasswordMinLength.
  ///
  /// In es, this message translates to:
  /// **'La contraseña debe tener al menos 6 caracteres'**
  String get loginPasswordMinLength;

  /// No description provided for @loginNoAccount.
  ///
  /// In es, this message translates to:
  /// **'¿No tienes cuenta? '**
  String get loginNoAccount;

  /// No description provided for @loginRegister.
  ///
  /// In es, this message translates to:
  /// **'Regístrate'**
  String get loginRegister;

  /// No description provided for @registerTitle.
  ///
  /// In es, this message translates to:
  /// **'Crear cuenta'**
  String get registerTitle;

  /// No description provided for @registerEmailHint.
  ///
  /// In es, this message translates to:
  /// **'tu@email.com'**
  String get registerEmailHint;

  /// No description provided for @registerEmailInvalid.
  ///
  /// In es, this message translates to:
  /// **'Email no válido'**
  String get registerEmailInvalid;

  /// No description provided for @registerPasswordLabel.
  ///
  /// In es, this message translates to:
  /// **'Contraseña'**
  String get registerPasswordLabel;

  /// No description provided for @registerPasswordRequired.
  ///
  /// In es, this message translates to:
  /// **'Introduce una contraseña'**
  String get registerPasswordRequired;

  /// No description provided for @registerPasswordMinLength.
  ///
  /// In es, this message translates to:
  /// **'Mínimo 8 caracteres'**
  String get registerPasswordMinLength;

  /// No description provided for @registerPasswordRepeatLabel.
  ///
  /// In es, this message translates to:
  /// **'Repetir contraseña'**
  String get registerPasswordRepeatLabel;

  /// No description provided for @registerPasswordRepeatRequired.
  ///
  /// In es, this message translates to:
  /// **'Repite la contraseña'**
  String get registerPasswordRepeatRequired;

  /// No description provided for @registerPasswordMismatch.
  ///
  /// In es, this message translates to:
  /// **'Las contraseñas no coinciden'**
  String get registerPasswordMismatch;

  /// No description provided for @registerCheckEmail.
  ///
  /// In es, this message translates to:
  /// **'Revisa tu email para confirmar tu cuenta'**
  String get registerCheckEmail;

  /// No description provided for @registerCreateAccount.
  ///
  /// In es, this message translates to:
  /// **'Crear cuenta'**
  String get registerCreateAccount;

  /// No description provided for @registerAlreadyHaveAccount.
  ///
  /// In es, this message translates to:
  /// **'¿Ya tienes cuenta? '**
  String get registerAlreadyHaveAccount;

  /// No description provided for @registerSignIn.
  ///
  /// In es, this message translates to:
  /// **'Inicia sesión'**
  String get registerSignIn;

  /// No description provided for @navProjects.
  ///
  /// In es, this message translates to:
  /// **'Proyectos'**
  String get navProjects;

  /// No description provided for @navOrganizations.
  ///
  /// In es, this message translates to:
  /// **'Organizaciones'**
  String get navOrganizations;

  /// No description provided for @navProfile.
  ///
  /// In es, this message translates to:
  /// **'Perfil'**
  String get navProfile;

  /// No description provided for @createNewTitle.
  ///
  /// In es, this message translates to:
  /// **'Crear nuevo'**
  String get createNewTitle;

  /// No description provided for @createNewProject.
  ///
  /// In es, this message translates to:
  /// **'Nuevo Proyecto'**
  String get createNewProject;

  /// No description provided for @createNewOrganization.
  ///
  /// In es, this message translates to:
  /// **'Nueva Organización'**
  String get createNewOrganization;

  /// No description provided for @logout.
  ///
  /// In es, this message translates to:
  /// **'Cerrar sesión'**
  String get logout;

  /// No description provided for @dangerZone.
  ///
  /// In es, this message translates to:
  /// **'Zona de peligro'**
  String get dangerZone;

  /// No description provided for @deleteAccount.
  ///
  /// In es, this message translates to:
  /// **'Eliminar cuenta'**
  String get deleteAccount;

  /// No description provided for @deleteAccountTitle.
  ///
  /// In es, this message translates to:
  /// **'Eliminar cuenta'**
  String get deleteAccountTitle;

  /// No description provided for @deleteAccountMessage.
  ///
  /// In es, this message translates to:
  /// **'Esta acción es irreversible. Tu cuenta será eliminada permanentemente.'**
  String get deleteAccountMessage;

  /// No description provided for @deleteAccountKeepObservations.
  ///
  /// In es, this message translates to:
  /// **'Mantener mis observaciones'**
  String get deleteAccountKeepObservations;

  /// No description provided for @deleteAccountObservationsWarning.
  ///
  /// In es, this message translates to:
  /// **'Si desactivas esta opción, todas tus observaciones serán eliminadas.'**
  String get deleteAccountObservationsWarning;

  /// No description provided for @invitationsTitle.
  ///
  /// In es, this message translates to:
  /// **'Invitaciones'**
  String get invitationsTitle;

  /// No description provided for @invitationsCount.
  ///
  /// In es, this message translates to:
  /// **'Invitaciones ({count})'**
  String invitationsCount(Object count);

  /// No description provided for @invitationsEmpty.
  ///
  /// In es, this message translates to:
  /// **'No tienes invitaciones pendientes'**
  String get invitationsEmpty;

  /// No description provided for @invitationAccepted.
  ///
  /// In es, this message translates to:
  /// **'¡Invitación aceptada!'**
  String get invitationAccepted;

  /// No description provided for @invitationRejected.
  ///
  /// In es, this message translates to:
  /// **'Invitación rechazada'**
  String get invitationRejected;

  /// No description provided for @invitationToProject.
  ///
  /// In es, this message translates to:
  /// **'proyecto'**
  String get invitationToProject;

  /// No description provided for @invitationToOrganization.
  ///
  /// In es, this message translates to:
  /// **'institución'**
  String get invitationToOrganization;

  /// No description provided for @searchProjects.
  ///
  /// In es, this message translates to:
  /// **'Buscar proyectos'**
  String get searchProjects;

  /// No description provided for @searchResults.
  ///
  /// In es, this message translates to:
  /// **'RESULTADOS DE BÚSQUEDA'**
  String get searchResults;

  /// No description provided for @searchResultsCount.
  ///
  /// In es, this message translates to:
  /// **'\"{query}\" - {count} resultado'**
  String searchResultsCount(Object query, Object count);

  /// No description provided for @searchResultsCountPlural.
  ///
  /// In es, this message translates to:
  /// **'\"{query}\" - {count} resultados'**
  String searchResultsCountPlural(Object query, Object count);

  /// No description provided for @myProjects.
  ///
  /// In es, this message translates to:
  /// **'Mis proyectos'**
  String get myProjects;

  /// No description provided for @exploreProjects.
  ///
  /// In es, this message translates to:
  /// **'Explorar'**
  String get exploreProjects;

  /// No description provided for @drafts.
  ///
  /// In es, this message translates to:
  /// **'Borradores'**
  String get drafts;

  /// No description provided for @noDraftsTitle.
  ///
  /// In es, this message translates to:
  /// **'Sin borradores'**
  String get noDraftsTitle;

  /// No description provided for @noDraftsSubtitle.
  ///
  /// In es, this message translates to:
  /// **'Los proyectos que guardes como borrador aparecerán aquí'**
  String get noDraftsSubtitle;

  /// No description provided for @continueDraft.
  ///
  /// In es, this message translates to:
  /// **'Continuar editando'**
  String get continueDraft;

  /// No description provided for @noMyProjectsTitle.
  ///
  /// In es, this message translates to:
  /// **'Sin proyectos'**
  String get noMyProjectsTitle;

  /// No description provided for @noMyProjectsSubtitle.
  ///
  /// In es, this message translates to:
  /// **'Únete a un proyecto o crea el tuyo'**
  String get noMyProjectsSubtitle;

  /// No description provided for @filterByCategory.
  ///
  /// In es, this message translates to:
  /// **'Filtrar por categoría'**
  String get filterByCategory;

  /// No description provided for @category.
  ///
  /// In es, this message translates to:
  /// **'Categoría'**
  String get category;

  /// No description provided for @projectCreatedBy.
  ///
  /// In es, this message translates to:
  /// **'Creado por: {creator}'**
  String projectCreatedBy(Object creator);

  /// No description provided for @projectInstitutions.
  ///
  /// In es, this message translates to:
  /// **'Instituciones'**
  String get projectInstitutions;

  /// No description provided for @projectLoadError.
  ///
  /// In es, this message translates to:
  /// **'No se pudo cargar el proyecto'**
  String get projectLoadError;

  /// No description provided for @projectDeleteConfirmTitle.
  ///
  /// In es, this message translates to:
  /// **'¿Borrar proyecto?'**
  String get projectDeleteConfirmTitle;

  /// No description provided for @projectDeleteConfirmMessage.
  ///
  /// In es, this message translates to:
  /// **'Esta acción no se puede deshacer.'**
  String get projectDeleteConfirmMessage;

  /// No description provided for @projectDeleted.
  ///
  /// In es, this message translates to:
  /// **'Proyecto eliminado'**
  String get projectDeleted;

  /// No description provided for @projectDeleteError.
  ///
  /// In es, this message translates to:
  /// **'Error al eliminar el proyecto'**
  String get projectDeleteError;

  /// No description provided for @projectAvailableOffline.
  ///
  /// In es, this message translates to:
  /// **'Proyecto disponible sin conexión'**
  String get projectAvailableOffline;

  /// No description provided for @projectOfflineDeleteTitle.
  ///
  /// In es, this message translates to:
  /// **'Eliminar datos offline'**
  String get projectOfflineDeleteTitle;

  /// No description provided for @projectOfflineDeleteMessage.
  ///
  /// In es, this message translates to:
  /// **'Se eliminarán los datos y el mapa descargado. Las observaciones pendientes de sincronizar no se perderán.'**
  String get projectOfflineDeleteMessage;

  /// No description provided for @projectUpdated.
  ///
  /// In es, this message translates to:
  /// **'Proyecto actualizado exitosamente'**
  String get projectUpdated;

  /// No description provided for @projectCreated.
  ///
  /// In es, this message translates to:
  /// **'Proyecto creado exitosamente'**
  String get projectCreated;

  /// No description provided for @projectUpdateError.
  ///
  /// In es, this message translates to:
  /// **'Error al actualizar el proyecto'**
  String get projectUpdateError;

  /// No description provided for @projectCreateError.
  ///
  /// In es, this message translates to:
  /// **'Error al crear el proyecto'**
  String get projectCreateError;

  /// No description provided for @editProjectTitle.
  ///
  /// In es, this message translates to:
  /// **'Editar Proyecto'**
  String get editProjectTitle;

  /// No description provided for @newProjectTitle.
  ///
  /// In es, this message translates to:
  /// **'Nuevo Proyecto'**
  String get newProjectTitle;

  /// No description provided for @whatToEdit.
  ///
  /// In es, this message translates to:
  /// **'¿Qué deseas editar?'**
  String get whatToEdit;

  /// No description provided for @addCoverImage.
  ///
  /// In es, this message translates to:
  /// **'Añadir imagen de portada'**
  String get addCoverImage;

  /// No description provided for @projectDescriptionLabel.
  ///
  /// In es, this message translates to:
  /// **'Descripción *'**
  String get projectDescriptionLabel;

  /// No description provided for @projectDescriptionRequired.
  ///
  /// In es, this message translates to:
  /// **'Por favor ingresa una descripción'**
  String get projectDescriptionRequired;

  /// No description provided for @globalProjectSubtitle.
  ///
  /// In es, this message translates to:
  /// **'El proyecto está abierto a todo el mundo'**
  String get globalProjectSubtitle;

  /// No description provided for @addCountry.
  ///
  /// In es, this message translates to:
  /// **'Añadir país'**
  String get addCountry;

  /// No description provided for @projectPasswordLabel.
  ///
  /// In es, this message translates to:
  /// **'Contraseña del proyecto *'**
  String get projectPasswordLabel;

  /// No description provided for @projectPasswordRequired.
  ///
  /// In es, this message translates to:
  /// **'La contraseña es obligatoria para proyectos privados'**
  String get projectPasswordRequired;

  /// No description provided for @offlineProjectsShown.
  ///
  /// In es, this message translates to:
  /// **'Sin conexión — mostrando proyectos guardados offline'**
  String get offlineProjectsShown;

  /// No description provided for @organizationsTitle.
  ///
  /// In es, this message translates to:
  /// **'Organizaciones'**
  String get organizationsTitle;

  /// No description provided for @organizationLoadError.
  ///
  /// In es, this message translates to:
  /// **'No se pudo cargar la organización'**
  String get organizationLoadError;

  /// No description provided for @organizationDeleteConfirmTitle.
  ///
  /// In es, this message translates to:
  /// **'¿Borrar organización?'**
  String get organizationDeleteConfirmTitle;

  /// No description provided for @organizationDeleteConfirmMessage.
  ///
  /// In es, this message translates to:
  /// **'Esta acción no se puede deshacer.'**
  String get organizationDeleteConfirmMessage;

  /// No description provided for @organizationDeleted.
  ///
  /// In es, this message translates to:
  /// **'Organización eliminada'**
  String get organizationDeleted;

  /// No description provided for @organizationDeleteError.
  ///
  /// In es, this message translates to:
  /// **'Error al eliminar la organización'**
  String get organizationDeleteError;

  /// No description provided for @organizationLeaveConfirmTitle.
  ///
  /// In es, this message translates to:
  /// **'Abandonar organización'**
  String get organizationLeaveConfirmTitle;

  /// No description provided for @organizationLeaveConfirmMessage.
  ///
  /// In es, this message translates to:
  /// **'¿Estás seguro de que quieres abandonar esta organización?'**
  String get organizationLeaveConfirmMessage;

  /// No description provided for @organizationLeft.
  ///
  /// In es, this message translates to:
  /// **'Has abandonado la organización'**
  String get organizationLeft;

  /// No description provided for @organizationLeaveError.
  ///
  /// In es, this message translates to:
  /// **'Error al abandonar la organización'**
  String get organizationLeaveError;

  /// No description provided for @organizationProjects.
  ///
  /// In es, this message translates to:
  /// **'Proyectos'**
  String get organizationProjects;

  /// No description provided for @organizationMembers.
  ///
  /// In es, this message translates to:
  /// **'Miembros'**
  String get organizationMembers;

  /// No description provided for @organizationRoleCreator.
  ///
  /// In es, this message translates to:
  /// **'Creador'**
  String get organizationRoleCreator;

  /// No description provided for @organizationRoleAdministrator.
  ///
  /// In es, this message translates to:
  /// **'Administrador'**
  String get organizationRoleAdministrator;

  /// No description provided for @organizationRoleMember.
  ///
  /// In es, this message translates to:
  /// **'Miembro'**
  String get organizationRoleMember;

  /// No description provided for @createOrganizationTitle.
  ///
  /// In es, this message translates to:
  /// **'Crear organización'**
  String get createOrganizationTitle;

  /// No description provided for @editOrganizationTitle.
  ///
  /// In es, this message translates to:
  /// **'Editar organización'**
  String get editOrganizationTitle;

  /// No description provided for @organizationNameLabel.
  ///
  /// In es, this message translates to:
  /// **'Nombre de la organización'**
  String get organizationNameLabel;

  /// No description provided for @organizationNameHint.
  ///
  /// In es, this message translates to:
  /// **'Escribe el nombre de la organización...'**
  String get organizationNameHint;

  /// No description provided for @organizationNameRequired.
  ///
  /// In es, this message translates to:
  /// **'Por favor ingresa el nombre de la organización'**
  String get organizationNameRequired;

  /// No description provided for @organizationBiographyLabel.
  ///
  /// In es, this message translates to:
  /// **'Biografía'**
  String get organizationBiographyLabel;

  /// No description provided for @organizationBiographyHint.
  ///
  /// In es, this message translates to:
  /// **'Presenta tu organización en la biografía'**
  String get organizationBiographyHint;

  /// No description provided for @organizationProfileImage.
  ///
  /// In es, this message translates to:
  /// **'Imagen del perfil'**
  String get organizationProfileImage;

  /// No description provided for @organizationCoverImage.
  ///
  /// In es, this message translates to:
  /// **'Imagen de portada'**
  String get organizationCoverImage;

  /// No description provided for @organizationCreated.
  ///
  /// In es, this message translates to:
  /// **'Organización creada exitosamente'**
  String get organizationCreated;

  /// No description provided for @organizationUpdated.
  ///
  /// In es, this message translates to:
  /// **'Organización actualizada exitosamente'**
  String get organizationUpdated;

  /// No description provided for @organizationCreateError.
  ///
  /// In es, this message translates to:
  /// **'Error al crear la organización'**
  String get organizationCreateError;

  /// No description provided for @organizationUpdateError.
  ///
  /// In es, this message translates to:
  /// **'Error al actualizar la organización'**
  String get organizationUpdateError;

  /// No description provided for @adminAndInvitationsTitle.
  ///
  /// In es, this message translates to:
  /// **'Administradores e Invitaciones'**
  String get adminAndInvitationsTitle;

  /// No description provided for @administrators.
  ///
  /// In es, this message translates to:
  /// **'Administradores'**
  String get administrators;

  /// No description provided for @inviteAsAdminInstruction.
  ///
  /// In es, this message translates to:
  /// **'Invita a otros usuarios como administradores del proyecto'**
  String get inviteAsAdminInstruction;

  /// No description provided for @emailExampleHint.
  ///
  /// In es, this message translates to:
  /// **'correo@ejemplo.com'**
  String get emailExampleHint;

  /// No description provided for @creator.
  ///
  /// In es, this message translates to:
  /// **'Creador'**
  String get creator;

  /// No description provided for @administrator.
  ///
  /// In es, this message translates to:
  /// **'Administrador'**
  String get administrator;

  /// No description provided for @inviteMemberTitle.
  ///
  /// In es, this message translates to:
  /// **'Invitar miembro'**
  String get inviteMemberTitle;

  /// No description provided for @inviteMemberEmailLabel.
  ///
  /// In es, this message translates to:
  /// **'Email'**
  String get inviteMemberEmailLabel;

  /// No description provided for @inviteMemberEmailHint.
  ///
  /// In es, this message translates to:
  /// **'usuario@ejemplo.com'**
  String get inviteMemberEmailHint;

  /// No description provided for @inviteMemberRoleLabel.
  ///
  /// In es, this message translates to:
  /// **'Rol'**
  String get inviteMemberRoleLabel;

  /// No description provided for @inviteMemberEmailInvalid.
  ///
  /// In es, this message translates to:
  /// **'Por favor ingresa un email válido'**
  String get inviteMemberEmailInvalid;

  /// No description provided for @invitationSent.
  ///
  /// In es, this message translates to:
  /// **'Invitación enviada correctamente'**
  String get invitationSent;

  /// No description provided for @invitationSendError.
  ///
  /// In es, this message translates to:
  /// **'Error al enviar la invitación'**
  String get invitationSendError;

  /// No description provided for @invitationSendInstruction.
  ///
  /// In es, this message translates to:
  /// **'Invita a otros usuarios a la organización'**
  String get invitationSendInstruction;

  /// No description provided for @invitationsSentLabel.
  ///
  /// In es, this message translates to:
  /// **'Invitaciones enviadas:'**
  String get invitationsSentLabel;

  /// No description provided for @invitationsExpireInfo.
  ///
  /// In es, this message translates to:
  /// **'Las invitaciones expiran en 7 días'**
  String get invitationsExpireInfo;

  /// No description provided for @manageMembersTitle.
  ///
  /// In es, this message translates to:
  /// **'Gestión de Miembros'**
  String get manageMembersTitle;

  /// No description provided for @currentManagement.
  ///
  /// In es, this message translates to:
  /// **'Gestión actual'**
  String get currentManagement;

  /// No description provided for @pendingInvitations.
  ///
  /// In es, this message translates to:
  /// **'Invitaciones pendientes'**
  String get pendingInvitations;

  /// No description provided for @invitedBy.
  ///
  /// In es, this message translates to:
  /// **'Invitado por {name}'**
  String invitedBy(Object name);

  /// No description provided for @expires.
  ///
  /// In es, this message translates to:
  /// **'Expira: {date}'**
  String expires(Object date);

  /// No description provided for @statusPending.
  ///
  /// In es, this message translates to:
  /// **'Pendiente'**
  String get statusPending;

  /// No description provided for @emailRequired.
  ///
  /// In es, this message translates to:
  /// **'Por favor, introduce un correo electrónico'**
  String get emailRequired;

  /// No description provided for @emailValidRequired.
  ///
  /// In es, this message translates to:
  /// **'Por favor, introduce un correo electrónico válido'**
  String get emailValidRequired;

  /// No description provided for @emailAlreadyInvited.
  ///
  /// In es, this message translates to:
  /// **'Este correo ya ha sido invitado'**
  String get emailAlreadyInvited;

  /// No description provided for @mapTitle.
  ///
  /// In es, this message translates to:
  /// **'Mapa'**
  String get mapTitle;

  /// No description provided for @mapInteractive.
  ///
  /// In es, this message translates to:
  /// **'Interactive map will appear here'**
  String get mapInteractive;

  /// No description provided for @mapNoObservations.
  ///
  /// In es, this message translates to:
  /// **'Este proyecto no tiene mapa de observaciones'**
  String get mapNoObservations;

  /// No description provided for @mapNoFieldForm.
  ///
  /// In es, this message translates to:
  /// **'El proyecto no cuenta con un formulario de campo configurado para registrar observaciones.'**
  String get mapNoFieldForm;

  /// No description provided for @mapGettingLocation.
  ///
  /// In es, this message translates to:
  /// **'Obteniendo ubicación...'**
  String get mapGettingLocation;

  /// No description provided for @mapLocationServicesDisabled.
  ///
  /// In es, this message translates to:
  /// **'Los servicios de ubicación están desactivados'**
  String get mapLocationServicesDisabled;

  /// No description provided for @mapLocationPermissionDenied.
  ///
  /// In es, this message translates to:
  /// **'Permisos de ubicación denegados'**
  String get mapLocationPermissionDenied;

  /// No description provided for @mapLocationPermissionPermanentlyDenied.
  ///
  /// In es, this message translates to:
  /// **'Los permisos de ubicación están permanentemente denegados'**
  String get mapLocationPermissionPermanentlyDenied;

  /// No description provided for @mapLocationError.
  ///
  /// In es, this message translates to:
  /// **'Error al obtener la ubicación: {error}'**
  String mapLocationError(Object error);

  /// No description provided for @fuzzyPrivacyNote.
  ///
  /// In es, this message translates to:
  /// **'Por razones de privacidad, se muestra la zona aproximada de observación.'**
  String get fuzzyPrivacyNote;

  /// No description provided for @observationAdminValues.
  ///
  /// In es, this message translates to:
  /// **'Valores de administración'**
  String get observationAdminValues;

  /// No description provided for @offlinePendingBadge.
  ///
  /// In es, this message translates to:
  /// **'{count} obs. pendientes de envío'**
  String offlinePendingBadge(Object count);

  /// No description provided for @offlineModeBadge.
  ///
  /// In es, this message translates to:
  /// **'Modo sin conexión'**
  String get offlineModeBadge;

  /// No description provided for @observationTitle.
  ///
  /// In es, this message translates to:
  /// **'Observación #{id}'**
  String observationTitle(Object id);

  /// No description provided for @observationDate.
  ///
  /// In es, this message translates to:
  /// **'Fecha'**
  String get observationDate;

  /// No description provided for @observationCoordinates.
  ///
  /// In es, this message translates to:
  /// **'Coordenadas'**
  String get observationCoordinates;

  /// No description provided for @observationUser.
  ///
  /// In es, this message translates to:
  /// **'Usuario'**
  String get observationUser;

  /// No description provided for @observationDescription.
  ///
  /// In es, this message translates to:
  /// **'Descripción'**
  String get observationDescription;

  /// No description provided for @observationAdditionalData.
  ///
  /// In es, this message translates to:
  /// **'Datos adicionales'**
  String get observationAdditionalData;

  /// No description provided for @observationImages.
  ///
  /// In es, this message translates to:
  /// **'Imágenes ({count})'**
  String observationImages(Object count);

  /// No description provided for @observationCenterOnMap.
  ///
  /// In es, this message translates to:
  /// **'Centrar en el mapa'**
  String get observationCenterOnMap;

  /// No description provided for @observationImageLoadError.
  ///
  /// In es, this message translates to:
  /// **'Error al cargar la imagen'**
  String get observationImageLoadError;

  /// No description provided for @profileObservationDefault.
  ///
  /// In es, this message translates to:
  /// **'Observación'**
  String get profileObservationDefault;

  /// No description provided for @addObservationTitle.
  ///
  /// In es, this message translates to:
  /// **'Nueva observación'**
  String get addObservationTitle;

  /// No description provided for @addObservationSubmit.
  ///
  /// In es, this message translates to:
  /// **'Enviar observación'**
  String get addObservationSubmit;

  /// No description provided for @addObservationLocationError.
  ///
  /// In es, this message translates to:
  /// **'Error al obtener ubicación: {error}'**
  String addObservationLocationError(Object error);

  /// No description provided for @observationCreated.
  ///
  /// In es, this message translates to:
  /// **'Observación creada exitosamente'**
  String get observationCreated;

  /// No description provided for @observationCreateError.
  ///
  /// In es, this message translates to:
  /// **'Error al crear la observación'**
  String get observationCreateError;

  /// No description provided for @offlineObservationSaved.
  ///
  /// In es, this message translates to:
  /// **'Sin conexión — Observación guardada, se enviará al recuperar señal'**
  String get offlineObservationSaved;

  /// No description provided for @selectAtLeastOneOption.
  ///
  /// In es, this message translates to:
  /// **'Selecciona al menos una opción'**
  String get selectAtLeastOneOption;

  /// No description provided for @fieldRequired.
  ///
  /// In es, this message translates to:
  /// **'Campo requerido'**
  String get fieldRequired;

  /// No description provided for @fieldEnter.
  ///
  /// In es, this message translates to:
  /// **'Ingresa {label}'**
  String fieldEnter(Object label);

  /// No description provided for @fieldSelect.
  ///
  /// In es, this message translates to:
  /// **'Selecciona {label}'**
  String fieldSelect(Object label);

  /// No description provided for @fieldSelectDate.
  ///
  /// In es, this message translates to:
  /// **'Selecciona fecha'**
  String get fieldSelectDate;

  /// No description provided for @fieldAddImage.
  ///
  /// In es, this message translates to:
  /// **'Agregar imagen'**
  String get fieldAddImage;

  /// No description provided for @fieldScanCode.
  ///
  /// In es, this message translates to:
  /// **'Escanea un código'**
  String get fieldScanCode;

  /// No description provided for @imagePickerTitle.
  ///
  /// In es, this message translates to:
  /// **'Seleccionar imagen'**
  String get imagePickerTitle;

  /// No description provided for @imagePickerTakePhoto.
  ///
  /// In es, this message translates to:
  /// **'Tomar foto'**
  String get imagePickerTakePhoto;

  /// No description provided for @imagePickerChooseGallery.
  ///
  /// In es, this message translates to:
  /// **'Elegir de galería'**
  String get imagePickerChooseGallery;

  /// No description provided for @profileEditTitle.
  ///
  /// In es, this message translates to:
  /// **'Editar Perfil'**
  String get profileEditTitle;

  /// No description provided for @profileCoverImage.
  ///
  /// In es, this message translates to:
  /// **'Imagen de portada'**
  String get profileCoverImage;

  /// No description provided for @profileCoverImageChange.
  ///
  /// In es, this message translates to:
  /// **'Toca para cambiar imagen'**
  String get profileCoverImageChange;

  /// No description provided for @profileCoverImageAdd.
  ///
  /// In es, this message translates to:
  /// **'Toca para agregar imagen de portada'**
  String get profileCoverImageAdd;

  /// No description provided for @profileFirstName.
  ///
  /// In es, this message translates to:
  /// **'Nombre'**
  String get profileFirstName;

  /// No description provided for @profileFirstNameRequired.
  ///
  /// In es, this message translates to:
  /// **'Por favor ingresa tu nombre'**
  String get profileFirstNameRequired;

  /// No description provided for @profileLastName.
  ///
  /// In es, this message translates to:
  /// **'Apellido'**
  String get profileLastName;

  /// No description provided for @profileLastNameRequired.
  ///
  /// In es, this message translates to:
  /// **'Por favor ingresa tu apellido'**
  String get profileLastNameRequired;

  /// No description provided for @profileBiography.
  ///
  /// In es, this message translates to:
  /// **'Biografía'**
  String get profileBiography;

  /// No description provided for @profileBiographyHint.
  ///
  /// In es, this message translates to:
  /// **'Cuéntanos sobre ti...'**
  String get profileBiographyHint;

  /// No description provided for @profileCountry.
  ///
  /// In es, this message translates to:
  /// **'País'**
  String get profileCountry;

  /// No description provided for @profileCountrySearch.
  ///
  /// In es, this message translates to:
  /// **'Buscar país'**
  String get profileCountrySearch;

  /// No description provided for @profileCountrySearchHint.
  ///
  /// In es, this message translates to:
  /// **'Empieza a escribir...'**
  String get profileCountrySearchHint;

  /// No description provided for @profileCountrySelect.
  ///
  /// In es, this message translates to:
  /// **'Selecciona tu país'**
  String get profileCountrySelect;

  /// No description provided for @profilePublic.
  ///
  /// In es, this message translates to:
  /// **'Perfil público'**
  String get profilePublic;

  /// No description provided for @profilePublicDescription.
  ///
  /// In es, this message translates to:
  /// **'Permite que otros usuarios vean tu perfil'**
  String get profilePublicDescription;

  /// No description provided for @profileSaveChanges.
  ///
  /// In es, this message translates to:
  /// **'Guardar Cambios'**
  String get profileSaveChanges;

  /// No description provided for @profileUpdated.
  ///
  /// In es, this message translates to:
  /// **'Perfil actualizado exitosamente'**
  String get profileUpdated;

  /// No description provided for @profileUpdateError.
  ///
  /// In es, this message translates to:
  /// **'Error al actualizar el perfil'**
  String get profileUpdateError;

  /// No description provided for @settings.
  ///
  /// In es, this message translates to:
  /// **'Configuración'**
  String get settings;

  /// No description provided for @languageTitle.
  ///
  /// In es, this message translates to:
  /// **'Idioma'**
  String get languageTitle;

  /// No description provided for @languageSpanish.
  ///
  /// In es, this message translates to:
  /// **'Español'**
  String get languageSpanish;

  /// No description provided for @languageEnglish.
  ///
  /// In es, this message translates to:
  /// **'English'**
  String get languageEnglish;

  /// No description provided for @languagePortuguese.
  ///
  /// In es, this message translates to:
  /// **'Português'**
  String get languagePortuguese;

  /// No description provided for @languageItalian.
  ///
  /// In es, this message translates to:
  /// **'Italiano'**
  String get languageItalian;

  /// No description provided for @languageSystem.
  ///
  /// In es, this message translates to:
  /// **'Idioma del sistema'**
  String get languageSystem;

  /// No description provided for @appVersion.
  ///
  /// In es, this message translates to:
  /// **'Versión'**
  String get appVersion;

  /// No description provided for @whatsNew.
  ///
  /// In es, this message translates to:
  /// **'Novedades'**
  String get whatsNew;

  /// No description provided for @themeTitle.
  ///
  /// In es, this message translates to:
  /// **'Tema'**
  String get themeTitle;

  /// No description provided for @themeLight.
  ///
  /// In es, this message translates to:
  /// **'Claro'**
  String get themeLight;

  /// No description provided for @themeDark.
  ///
  /// In es, this message translates to:
  /// **'Oscuro'**
  String get themeDark;

  /// No description provided for @themeSystem.
  ///
  /// In es, this message translates to:
  /// **'Automático'**
  String get themeSystem;

  /// No description provided for @collaboratingOrganizations.
  ///
  /// In es, this message translates to:
  /// **'{count} organizaciones colaboradoras'**
  String collaboratingOrganizations(Object count);

  /// No description provided for @myObservations.
  ///
  /// In es, this message translates to:
  /// **'Mis Observaciones ({count})'**
  String myObservations(Object count);

  /// No description provided for @myOrganizations.
  ///
  /// In es, this message translates to:
  /// **'Mis Organizaciones ({count})'**
  String myOrganizations(Object count);

  /// No description provided for @timeAgoMoment.
  ///
  /// In es, this message translates to:
  /// **'Hace un momento'**
  String get timeAgoMoment;

  /// No description provided for @timeAgoMinutes.
  ///
  /// In es, this message translates to:
  /// **'Hace {minutes} min'**
  String timeAgoMinutes(Object minutes);

  /// No description provided for @timeAgoHours.
  ///
  /// In es, this message translates to:
  /// **'Hace {hours}h'**
  String timeAgoHours(Object hours);

  /// No description provided for @timeAgoDays.
  ///
  /// In es, this message translates to:
  /// **'Hace {days}d'**
  String timeAgoDays(Object days);

  /// No description provided for @timeAgoWeeks.
  ///
  /// In es, this message translates to:
  /// **'Hace {weeks} sem'**
  String timeAgoWeeks(Object weeks);

  /// No description provided for @timeAgoMonths.
  ///
  /// In es, this message translates to:
  /// **'Hace {months} mes'**
  String timeAgoMonths(Object months);

  /// No description provided for @timeAgoMonthsPlural.
  ///
  /// In es, this message translates to:
  /// **'Hace {months} meses'**
  String timeAgoMonthsPlural(Object months);

  /// No description provided for @timeAgoYears.
  ///
  /// In es, this message translates to:
  /// **'Hace {years} año'**
  String timeAgoYears(Object years);

  /// No description provided for @timeAgoYearsPlural.
  ///
  /// In es, this message translates to:
  /// **'Hace {years} años'**
  String timeAgoYearsPlural(Object years);

  /// No description provided for @roleMember.
  ///
  /// In es, this message translates to:
  /// **'Miembro'**
  String get roleMember;

  /// No description provided for @roleAdministrator.
  ///
  /// In es, this message translates to:
  /// **'Administrador'**
  String get roleAdministrator;

  /// No description provided for @leave.
  ///
  /// In es, this message translates to:
  /// **'Abandonar'**
  String get leave;

  /// No description provided for @leaveOrganization.
  ///
  /// In es, this message translates to:
  /// **'Abandonar organización'**
  String get leaveOrganization;

  /// No description provided for @leaveOrganizationConfirm.
  ///
  /// In es, this message translates to:
  /// **'¿Estás seguro de que quieres abandonar esta organización?'**
  String get leaveOrganizationConfirm;

  /// No description provided for @leftOrganization.
  ///
  /// In es, this message translates to:
  /// **'Has abandonado la organización'**
  String get leftOrganization;

  /// No description provided for @leaveOrganizationError.
  ///
  /// In es, this message translates to:
  /// **'Error al abandonar la organización'**
  String get leaveOrganizationError;

  /// No description provided for @inviteMember.
  ///
  /// In es, this message translates to:
  /// **'Invitar miembro'**
  String get inviteMember;

  /// No description provided for @sendInvitation.
  ///
  /// In es, this message translates to:
  /// **'Enviar invitación'**
  String get sendInvitation;

  /// No description provided for @enterValidEmail.
  ///
  /// In es, this message translates to:
  /// **'Por favor ingresa un email válido'**
  String get enterValidEmail;

  /// No description provided for @deleteOrganizationQuestion.
  ///
  /// In es, this message translates to:
  /// **'¿Borrar organización?'**
  String get deleteOrganizationQuestion;

  /// No description provided for @deleteOrganizationConfirm.
  ///
  /// In es, this message translates to:
  /// **'Esta acción no se puede deshacer.'**
  String get deleteOrganizationConfirm;

  /// No description provided for @deleteOrganizationError.
  ///
  /// In es, this message translates to:
  /// **'Error al eliminar la organización'**
  String get deleteOrganizationError;

  /// No description provided for @errorLoadingOrganization.
  ///
  /// In es, this message translates to:
  /// **'No se pudo cargar la organización'**
  String get errorLoadingOrganization;

  /// No description provided for @errorLoadingProfile.
  ///
  /// In es, this message translates to:
  /// **'Error al cargar el perfil'**
  String get errorLoadingProfile;

  /// No description provided for @gettingLocation.
  ///
  /// In es, this message translates to:
  /// **'Obteniendo ubicación...'**
  String get gettingLocation;

  /// No description provided for @locationServicesDisabled.
  ///
  /// In es, this message translates to:
  /// **'Los servicios de ubicación están desactivados'**
  String get locationServicesDisabled;

  /// No description provided for @locationPermissionDenied.
  ///
  /// In es, this message translates to:
  /// **'Permisos de ubicación denegados'**
  String get locationPermissionDenied;

  /// No description provided for @locationPermissionDeniedPermanently.
  ///
  /// In es, this message translates to:
  /// **'Los permisos de ubicación están permanentemente denegados'**
  String get locationPermissionDeniedPermanently;

  /// No description provided for @errorGettingLocation.
  ///
  /// In es, this message translates to:
  /// **'Error al obtener la ubicación: {error}'**
  String errorGettingLocation(Object error);

  /// No description provided for @centerOnMap.
  ///
  /// In es, this message translates to:
  /// **'Centrar en el mapa'**
  String get centerOnMap;

  /// No description provided for @selectImage.
  ///
  /// In es, this message translates to:
  /// **'Seleccionar imagen'**
  String get selectImage;

  /// No description provided for @takePhoto.
  ///
  /// In es, this message translates to:
  /// **'Tomar foto'**
  String get takePhoto;

  /// No description provided for @chooseFromGallery.
  ///
  /// In es, this message translates to:
  /// **'Elegir de galería'**
  String get chooseFromGallery;

  /// No description provided for @addImage.
  ///
  /// In es, this message translates to:
  /// **'Agregar imagen'**
  String get addImage;

  /// No description provided for @tapToChangeImage.
  ///
  /// In es, this message translates to:
  /// **'Toca para cambiar imagen'**
  String get tapToChangeImage;

  /// No description provided for @tapToAddCoverImage.
  ///
  /// In es, this message translates to:
  /// **'Toca para agregar imagen de portada'**
  String get tapToAddCoverImage;

  /// No description provided for @selectLowercase.
  ///
  /// In es, this message translates to:
  /// **'Selecciona {label}'**
  String selectLowercase(Object label);

  /// No description provided for @selectTopics.
  ///
  /// In es, this message translates to:
  /// **'Seleccionar Temas'**
  String get selectTopics;

  /// No description provided for @privateProject.
  ///
  /// In es, this message translates to:
  /// **'Proyecto privado'**
  String get privateProject;

  /// No description provided for @privateProjectSubtitle.
  ///
  /// In es, this message translates to:
  /// **'Requiere contraseña para unirse'**
  String get privateProjectSubtitle;

  /// No description provided for @privateDatabase.
  ///
  /// In es, this message translates to:
  /// **'Base de datos privada'**
  String get privateDatabase;

  /// No description provided for @privateDatabaseSubtitle.
  ///
  /// In es, this message translates to:
  /// **'Los datos no se pueden descargar'**
  String get privateDatabaseSubtitle;

  /// No description provided for @privateProjectsRequirePassword.
  ///
  /// In es, this message translates to:
  /// **'Los proyectos privados requieren contraseña'**
  String get privateProjectsRequirePassword;

  /// No description provided for @saveBasicInfo.
  ///
  /// In es, this message translates to:
  /// **'Guardar información básica'**
  String get saveBasicInfo;

  /// No description provided for @saveBasicInfoSubtitle.
  ///
  /// In es, this message translates to:
  /// **'Nombre, descripción, privacidad, etc.'**
  String get saveBasicInfoSubtitle;

  /// No description provided for @editFormFields.
  ///
  /// In es, this message translates to:
  /// **'Editar campos del formulario'**
  String get editFormFields;

  /// No description provided for @editFormFieldsSubtitle.
  ///
  /// In es, this message translates to:
  /// **'Añadir, editar o eliminar campos'**
  String get editFormFieldsSubtitle;

  /// No description provided for @projectHasObservations.
  ///
  /// In es, this message translates to:
  /// **'⚠️ Este proyecto tiene {count} observaciones'**
  String projectHasObservations(Object count);

  /// No description provided for @addOption.
  ///
  /// In es, this message translates to:
  /// **'Añadir opción'**
  String get addOption;

  /// No description provided for @cannotDeleteFieldWithObservations.
  ///
  /// In es, this message translates to:
  /// **'No se puede eliminar un campo que tiene observaciones'**
  String get cannotDeleteFieldWithObservations;

  /// No description provided for @noFieldTypesAvailable.
  ///
  /// In es, this message translates to:
  /// **'No hay tipos de campo disponibles'**
  String get noFieldTypesAvailable;

  /// No description provided for @cannotChangeFieldTypeWithObservations.
  ///
  /// In es, this message translates to:
  /// **'No se puede cambiar el tipo de un campo que tiene observaciones'**
  String get cannotChangeFieldTypeWithObservations;

  /// No description provided for @selectFieldType.
  ///
  /// In es, this message translates to:
  /// **'Seleccionar tipo de campo'**
  String get selectFieldType;

  /// No description provided for @fieldMustHaveOptions.
  ///
  /// In es, this message translates to:
  /// **'El campo \"{fieldName}\" de tipo CHOICE debe tener al menos una opción'**
  String fieldMustHaveOptions(Object fieldName);

  /// No description provided for @jsonToSend.
  ///
  /// In es, this message translates to:
  /// **'JSON a enviar'**
  String get jsonToSend;

  /// No description provided for @noChanges.
  ///
  /// In es, this message translates to:
  /// **'Sin cambios'**
  String get noChanges;

  /// No description provided for @noChangesDetected.
  ///
  /// In es, this message translates to:
  /// **'No se detectaron cambios en los campos del formulario.\\n\\nNo se enviará field_form al backend.'**
  String get noChangesDetected;

  /// No description provided for @cannotChangeRequiredWithObservations.
  ///
  /// In es, this message translates to:
  /// **'No se puede cambiar el estado obligatorio de un campo que tiene observaciones'**
  String get cannotChangeRequiredWithObservations;

  /// No description provided for @newFieldsCannotBeRequiredWithObservations.
  ///
  /// In es, this message translates to:
  /// **'Los campos nuevos no pueden ser obligatorios cuando ya hay observaciones'**
  String get newFieldsCannotBeRequiredWithObservations;

  /// No description provided for @enterEmail.
  ///
  /// In es, this message translates to:
  /// **'Por favor, introduce un correo electrónico'**
  String get enterEmail;

  /// No description provided for @enterValidEmailFormat.
  ///
  /// In es, this message translates to:
  /// **'Por favor, introduce un correo electrónico válido'**
  String get enterValidEmailFormat;

  /// No description provided for @updateInstitutionsError.
  ///
  /// In es, this message translates to:
  /// **'Error al actualizar las instituciones'**
  String get updateInstitutionsError;

  /// No description provided for @institutionsUpdated.
  ///
  /// In es, this message translates to:
  /// **'Instituciones actualizadas correctamente'**
  String get institutionsUpdated;

  /// No description provided for @confirmationMessageTitle.
  ///
  /// In es, this message translates to:
  /// **'Mensaje de confirmación'**
  String get confirmationMessageTitle;

  /// No description provided for @showPostMessageLabel.
  ///
  /// In es, this message translates to:
  /// **'Mostrar mensaje tras la observación'**
  String get showPostMessageLabel;

  /// No description provided for @insertLinkTitle.
  ///
  /// In es, this message translates to:
  /// **'Insertar enlace'**
  String get insertLinkTitle;

  /// No description provided for @linkTextLabel.
  ///
  /// In es, this message translates to:
  /// **'Texto del enlace'**
  String get linkTextLabel;

  /// No description provided for @linkUrlLabel.
  ///
  /// In es, this message translates to:
  /// **'URL'**
  String get linkUrlLabel;

  /// No description provided for @editTab.
  ///
  /// In es, this message translates to:
  /// **'Editar'**
  String get editTab;

  /// No description provided for @previewTab.
  ///
  /// In es, this message translates to:
  /// **'Previsualizar'**
  String get previewTab;

  /// No description provided for @messageHint.
  ///
  /// In es, this message translates to:
  /// **'Escribe el mensaje aquí...'**
  String get messageHint;

  /// No description provided for @messageEmptyPreview.
  ///
  /// In es, this message translates to:
  /// **'Sin contenido para previsualizar'**
  String get messageEmptyPreview;

  /// No description provided for @messageInfo.
  ///
  /// In es, this message translates to:
  /// **'Este mensaje aparecerá al usuario tras añadir una observación'**
  String get messageInfo;

  /// No description provided for @tooltipBold.
  ///
  /// In es, this message translates to:
  /// **'Negrita'**
  String get tooltipBold;

  /// No description provided for @tooltipItalic.
  ///
  /// In es, this message translates to:
  /// **'Cursiva'**
  String get tooltipItalic;

  /// No description provided for @tooltipLink.
  ///
  /// In es, this message translates to:
  /// **'Enlace'**
  String get tooltipLink;

  /// No description provided for @tooltipList.
  ///
  /// In es, this message translates to:
  /// **'Lista'**
  String get tooltipList;

  /// No description provided for @addLanguageTitle.
  ///
  /// In es, this message translates to:
  /// **'Añadir idioma'**
  String get addLanguageTitle;

  /// No description provided for @translationLanguageLabel.
  ///
  /// In es, this message translates to:
  /// **'Idioma de traducción'**
  String get translationLanguageLabel;

  /// No description provided for @translationSelectLanguage.
  ///
  /// In es, this message translates to:
  /// **'Selecciona un idioma'**
  String get translationSelectLanguage;

  /// No description provided for @translationSelectLanguageHint.
  ///
  /// In es, this message translates to:
  /// **'Selecciona un idioma para ver los campos a traducir'**
  String get translationSelectLanguageHint;

  /// No description provided for @translationDescriptionLabel.
  ///
  /// In es, this message translates to:
  /// **'Descripción'**
  String get translationDescriptionLabel;

  /// No description provided for @translationPostMessageLabel.
  ///
  /// In es, this message translates to:
  /// **'Mensaje post-observación'**
  String get translationPostMessageLabel;

  /// No description provided for @translationOptionLabel.
  ///
  /// In es, this message translates to:
  /// **'Opción: \"{key}\"'**
  String translationOptionLabel(Object key);

  /// No description provided for @translationHint.
  ///
  /// In es, this message translates to:
  /// **'Traducción en {lang}...'**
  String translationHint(Object lang);

  /// No description provided for @translationSectionProject.
  ///
  /// In es, this message translates to:
  /// **'Proyecto'**
  String get translationSectionProject;

  /// No description provided for @translationNameLabel.
  ///
  /// In es, this message translates to:
  /// **'Nombre'**
  String get translationNameLabel;

  /// No description provided for @translationSectionQuestions.
  ///
  /// In es, this message translates to:
  /// **'Preguntas del formulario'**
  String get translationSectionQuestions;

  /// No description provided for @translationQuestionHeader.
  ///
  /// In es, this message translates to:
  /// **'Pregunta {number}'**
  String translationQuestionHeader(int number);

  /// No description provided for @translationQuestionTextLabel.
  ///
  /// In es, this message translates to:
  /// **'Texto de la pregunta'**
  String get translationQuestionTextLabel;

  /// No description provided for @translationHelpTextLabel.
  ///
  /// In es, this message translates to:
  /// **'Texto de ayuda'**
  String get translationHelpTextLabel;

  /// No description provided for @translationSectionOptions.
  ///
  /// In es, this message translates to:
  /// **'OPCIONES'**
  String get translationSectionOptions;

  /// No description provided for @skip.
  ///
  /// In es, this message translates to:
  /// **'Omitir'**
  String get skip;

  /// No description provided for @update.
  ///
  /// In es, this message translates to:
  /// **'Actualizar'**
  String get update;

  /// No description provided for @create.
  ///
  /// In es, this message translates to:
  /// **'Crear'**
  String get create;

  /// No description provided for @projectNameLabel.
  ///
  /// In es, this message translates to:
  /// **'Nombre del proyecto *'**
  String get projectNameLabel;

  /// No description provided for @projectNameRequired.
  ///
  /// In es, this message translates to:
  /// **'Por favor ingresa un nombre'**
  String get projectNameRequired;

  /// No description provided for @searchHint.
  ///
  /// In es, this message translates to:
  /// **'Buscar...'**
  String get searchHint;

  /// No description provided for @selectOrganizationsDialog.
  ///
  /// In es, this message translates to:
  /// **'Seleccionar Organizaciones'**
  String get selectOrganizationsDialog;

  /// No description provided for @topicsLabel.
  ///
  /// In es, this message translates to:
  /// **'Temas'**
  String get topicsLabel;

  /// No description provided for @organizationsLabel.
  ///
  /// In es, this message translates to:
  /// **'Organizaciones'**
  String get organizationsLabel;

  /// No description provided for @globalLabel.
  ///
  /// In es, this message translates to:
  /// **'Global'**
  String get globalLabel;

  /// No description provided for @noTopicsAvailable.
  ///
  /// In es, this message translates to:
  /// **'No hay temas disponibles'**
  String get noTopicsAvailable;

  /// No description provided for @selectTopicsAction.
  ///
  /// In es, this message translates to:
  /// **'Seleccionar temas'**
  String get selectTopicsAction;

  /// No description provided for @noOrganizationsAvailable.
  ///
  /// In es, this message translates to:
  /// **'No hay organizaciones disponibles'**
  String get noOrganizationsAvailable;

  /// No description provided for @selectOrganizationsAction.
  ///
  /// In es, this message translates to:
  /// **'Seleccionar organizaciones'**
  String get selectOrganizationsAction;

  /// No description provided for @fuzzyGeoposition.
  ///
  /// In es, this message translates to:
  /// **'Geoposición aproximada'**
  String get fuzzyGeoposition;

  /// No description provided for @fuzzyGeopositionSubtitle.
  ///
  /// In es, this message translates to:
  /// **'Las observaciones se muestran como zonas aproximadas, no como puntos exactos'**
  String get fuzzyGeopositionSubtitle;

  /// No description provided for @publicMap.
  ///
  /// In es, this message translates to:
  /// **'Mapa público'**
  String get publicMap;

  /// No description provided for @publicMapSubtitle.
  ///
  /// In es, this message translates to:
  /// **'Activa una página de mapa pública accesible sin inicio de sesión'**
  String get publicMapSubtitle;

  /// No description provided for @projectPublished.
  ///
  /// In es, this message translates to:
  /// **'Publicado'**
  String get projectPublished;

  /// No description provided for @projectDraftSubtitle.
  ///
  /// In es, this message translates to:
  /// **'El proyecto está en borrador. Necesita al menos 10 observaciones para publicarse.'**
  String get projectDraftSubtitle;

  /// No description provided for @projectDraftSubtitleWithCount.
  ///
  /// In es, this message translates to:
  /// **'El proyecto está en borrador. Necesita al menos 10 observaciones para publicarse (actualmente tiene {count}).'**
  String projectDraftSubtitleWithCount(int count);

  /// No description provided for @projectPublishedSubtitle.
  ///
  /// In es, this message translates to:
  /// **'El proyecto está publicado y visible para todos.'**
  String get projectPublishedSubtitle;

  /// No description provided for @projectEnded.
  ///
  /// In es, this message translates to:
  /// **'Finalizado'**
  String get projectEnded;

  /// No description provided for @projectEndedSubtitle.
  ///
  /// In es, this message translates to:
  /// **'El proyecto ya no acepta nuevas observaciones'**
  String get projectEndedSubtitle;

  /// No description provided for @emailOnObservation.
  ///
  /// In es, this message translates to:
  /// **'Email al recibir observación'**
  String get emailOnObservation;

  /// No description provided for @emailOnObservationSubtitle.
  ///
  /// In es, this message translates to:
  /// **'Recibe un email cada vez que llegue una observación'**
  String get emailOnObservationSubtitle;

  /// No description provided for @coverImageRequired.
  ///
  /// In es, this message translates to:
  /// **'La imagen de portada es obligatoria'**
  String get coverImageRequired;

  /// No description provided for @organizationType.
  ///
  /// In es, this message translates to:
  /// **'Tipo de organización'**
  String get organizationType;

  /// No description provided for @continueLabel.
  ///
  /// In es, this message translates to:
  /// **'Continuar'**
  String get continueLabel;

  /// No description provided for @optionLabelRequired.
  ///
  /// In es, this message translates to:
  /// **'Texto *'**
  String get optionLabelRequired;

  /// No description provided for @optionLabelHint.
  ///
  /// In es, this message translates to:
  /// **'Ej: Preocupación menor'**
  String get optionLabelHint;

  /// No description provided for @optionValueLabel.
  ///
  /// In es, this message translates to:
  /// **'Valor (opcional)'**
  String get optionValueLabel;

  /// No description provided for @optionValueHint.
  ///
  /// In es, this message translates to:
  /// **'Ej: lc'**
  String get optionValueHint;

  /// No description provided for @optionsLabel.
  ///
  /// In es, this message translates to:
  /// **'Opciones'**
  String get optionsLabel;

  /// No description provided for @soonExpiry.
  ///
  /// In es, this message translates to:
  /// **'Pronto'**
  String get soonExpiry;

  /// No description provided for @userFallback.
  ///
  /// In es, this message translates to:
  /// **'Usuario'**
  String get userFallback;

  /// No description provided for @retry.
  ///
  /// In es, this message translates to:
  /// **'Reintentar'**
  String get retry;

  /// No description provided for @viewMap.
  ///
  /// In es, this message translates to:
  /// **'Ver mapa'**
  String get viewMap;

  /// No description provided for @adminBadge.
  ///
  /// In es, this message translates to:
  /// **'Admin'**
  String get adminBadge;

  /// No description provided for @badgeFinished.
  ///
  /// In es, this message translates to:
  /// **'Finalizado'**
  String get badgeFinished;

  /// No description provided for @badgePrivate.
  ///
  /// In es, this message translates to:
  /// **'Privado'**
  String get badgePrivate;

  /// No description provided for @badgeFuzzy.
  ///
  /// In es, this message translates to:
  /// **'Fuzzy'**
  String get badgeFuzzy;

  /// No description provided for @badgeGlobal.
  ///
  /// In es, this message translates to:
  /// **'Global'**
  String get badgeGlobal;

  /// No description provided for @downloadCsv.
  ///
  /// In es, this message translates to:
  /// **'Descargar CSV'**
  String get downloadCsv;

  /// No description provided for @projectObservationsShare.
  ///
  /// In es, this message translates to:
  /// **'Observaciones del proyecto'**
  String get projectObservationsShare;

  /// No description provided for @downloadErrorCode.
  ///
  /// In es, this message translates to:
  /// **'Error al descargar: {code}'**
  String downloadErrorCode(Object code);

  /// No description provided for @csvDownloadError.
  ///
  /// In es, this message translates to:
  /// **'Error al descargar el CSV'**
  String get csvDownloadError;

  /// No description provided for @noFieldFormError.
  ///
  /// In es, this message translates to:
  /// **'Este proyecto no tiene formulario de campo'**
  String get noFieldFormError;

  /// No description provided for @offlineDataDeleted.
  ///
  /// In es, this message translates to:
  /// **'Datos offline eliminados'**
  String get offlineDataDeleted;

  /// No description provided for @offlineDownloadError.
  ///
  /// In es, this message translates to:
  /// **'Error al descargar: {error}'**
  String offlineDownloadError(Object error);

  /// No description provided for @removeOfflineTooltip.
  ///
  /// In es, this message translates to:
  /// **'Eliminar offline'**
  String get removeOfflineTooltip;

  /// No description provided for @makeOfflineTooltip.
  ///
  /// In es, this message translates to:
  /// **'Hacer disponible offline'**
  String get makeOfflineTooltip;

  /// No description provided for @deleteAccountError.
  ///
  /// In es, this message translates to:
  /// **'Error al eliminar la cuenta'**
  String get deleteAccountError;

  /// No description provided for @myProfile.
  ///
  /// In es, this message translates to:
  /// **'Mi Perfil'**
  String get myProfile;

  /// No description provided for @profileObservations.
  ///
  /// In es, this message translates to:
  /// **'Observaciones'**
  String get profileObservations;

  /// No description provided for @profileProjects.
  ///
  /// In es, this message translates to:
  /// **'Proyectos'**
  String get profileProjects;

  /// No description provided for @profileOrganizationsLabel.
  ///
  /// In es, this message translates to:
  /// **'Organizaciones'**
  String get profileOrganizationsLabel;

  /// No description provided for @createdProjectsCount.
  ///
  /// In es, this message translates to:
  /// **'Proyectos Creados ({count})'**
  String createdProjectsCount(Object count);

  /// No description provided for @participatedProjectsCount.
  ///
  /// In es, this message translates to:
  /// **'Proyectos en los que Participo ({count})'**
  String participatedProjectsCount(Object count);

  /// No description provided for @likedProjectsCount.
  ///
  /// In es, this message translates to:
  /// **'Proyectos que me Gustan ({count})'**
  String likedProjectsCount(Object count);

  /// No description provided for @additionalData.
  ///
  /// In es, this message translates to:
  /// **'Datos adicionales'**
  String get additionalData;

  /// No description provided for @fieldLabelFallback.
  ///
  /// In es, this message translates to:
  /// **'Campo {key}'**
  String fieldLabelFallback(Object key);

  /// No description provided for @boolYes.
  ///
  /// In es, this message translates to:
  /// **'Sí'**
  String get boolYes;

  /// No description provided for @boolNo.
  ///
  /// In es, this message translates to:
  /// **'No'**
  String get boolNo;

  /// No description provided for @other.
  ///
  /// In es, this message translates to:
  /// **'Otro'**
  String get other;

  /// No description provided for @specify.
  ///
  /// In es, this message translates to:
  /// **'Especifica...'**
  String get specify;

  /// No description provided for @noOptionsDefined.
  ///
  /// In es, this message translates to:
  /// **'Sin opciones definidas'**
  String get noOptionsDefined;

  /// No description provided for @backendDown.
  ///
  /// In es, this message translates to:
  /// **'Servidor caído'**
  String get backendDown;

  /// No description provided for @noConnectionTitle.
  ///
  /// In es, this message translates to:
  /// **'Sin conexión'**
  String get noConnectionTitle;

  /// No description provided for @backendDownMessage.
  ///
  /// In es, this message translates to:
  /// **'El servidor no responde.\nPor favor contacte con la Fundación Ibercivis.'**
  String get backendDownMessage;

  /// No description provided for @noConnectionMessage.
  ///
  /// In es, this message translates to:
  /// **'Por favor comprueba tu conexión a internet\ne inténtalo de nuevo.'**
  String get noConnectionMessage;

  /// No description provided for @emailFieldLabel.
  ///
  /// In es, this message translates to:
  /// **'Email'**
  String get emailFieldLabel;

  /// No description provided for @roleLabel.
  ///
  /// In es, this message translates to:
  /// **'Rol'**
  String get roleLabel;

  /// No description provided for @inviteMemberHint.
  ///
  /// In es, this message translates to:
  /// **'usuario@ejemplo.com'**
  String get inviteMemberHint;

  /// No description provided for @membersLabel.
  ///
  /// In es, this message translates to:
  /// **'Miembros'**
  String get membersLabel;

  /// No description provided for @projectsLabel.
  ///
  /// In es, this message translates to:
  /// **'Proyectos'**
  String get projectsLabel;

  /// No description provided for @observationsInZone.
  ///
  /// In es, this message translates to:
  /// **'Observaciones en esta zona'**
  String get observationsInZone;

  /// No description provided for @selectType.
  ///
  /// In es, this message translates to:
  /// **'Seleccionar tipo'**
  String get selectType;

  /// No description provided for @more.
  ///
  /// In es, this message translates to:
  /// **'Más...'**
  String get more;

  /// No description provided for @profileImageLabel.
  ///
  /// In es, this message translates to:
  /// **'Imagen del perfil'**
  String get profileImageLabel;

  /// No description provided for @coverImageLabel.
  ///
  /// In es, this message translates to:
  /// **'Imagen de portada'**
  String get coverImageLabel;

  /// No description provided for @noName.
  ///
  /// In es, this message translates to:
  /// **'Sin nombre'**
  String get noName;

  /// No description provided for @fieldNameHint.
  ///
  /// In es, this message translates to:
  /// **'Nombre del campo'**
  String get fieldNameHint;

  /// No description provided for @noObservationMap.
  ///
  /// In es, this message translates to:
  /// **'Este proyecto no tiene mapa de observaciones'**
  String get noObservationMap;

  /// No description provided for @observationZone.
  ///
  /// In es, this message translates to:
  /// **'Zona de observaciones'**
  String get observationZone;

  /// No description provided for @helpTextHint.
  ///
  /// In es, this message translates to:
  /// **'Texto de ayuda (opcional)'**
  String get helpTextHint;

  /// No description provided for @noOptionsAdded.
  ///
  /// In es, this message translates to:
  /// **'No hay opciones. Añade al menos una opción.'**
  String get noOptionsAdded;

  /// No description provided for @projectPasswordWrong.
  ///
  /// In es, this message translates to:
  /// **'Contraseña incorrecta.'**
  String get projectPasswordWrong;

  /// No description provided for @privacyPolicy.
  ///
  /// In es, this message translates to:
  /// **'Política de privacidad'**
  String get privacyPolicy;

  /// No description provided for @deleteAccountWeb.
  ///
  /// In es, this message translates to:
  /// **'Eliminar cuenta'**
  String get deleteAccountWeb;

  /// No description provided for @consentTitle.
  ///
  /// In es, this message translates to:
  /// **'Términos y privacidad'**
  String get consentTitle;

  /// No description provided for @consentSubtitle.
  ///
  /// In es, this message translates to:
  /// **'Para continuar, debes aceptar nuestros Términos de uso y Política de privacidad.'**
  String get consentSubtitle;

  /// No description provided for @consentTermsLabel.
  ///
  /// In es, this message translates to:
  /// **'Términos de uso'**
  String get consentTermsLabel;

  /// No description provided for @consentAcceptButton.
  ///
  /// In es, this message translates to:
  /// **'Acepto y continuar'**
  String get consentAcceptButton;

  /// No description provided for @consentError.
  ///
  /// In es, this message translates to:
  /// **'Error al guardar el consentimiento. Inténtalo de nuevo.'**
  String get consentError;

  /// No description provided for @registerTermsAccept.
  ///
  /// In es, this message translates to:
  /// **'Acepto los Términos de uso y la Política de privacidad'**
  String get registerTermsAccept;

  /// No description provided for @registerTermsRequired.
  ///
  /// In es, this message translates to:
  /// **'Debes aceptar los términos para registrarte'**
  String get registerTermsRequired;
}

class _AppLocalizationsDelegate
    extends LocalizationsDelegate<AppLocalizations> {
  const _AppLocalizationsDelegate();

  @override
  Future<AppLocalizations> load(Locale locale) {
    return SynchronousFuture<AppLocalizations>(lookupAppLocalizations(locale));
  }

  @override
  bool isSupported(Locale locale) =>
      <String>['en', 'es', 'it', 'pt'].contains(locale.languageCode);

  @override
  bool shouldReload(_AppLocalizationsDelegate old) => false;
}

AppLocalizations lookupAppLocalizations(Locale locale) {
  // Lookup logic when only language code is specified.
  switch (locale.languageCode) {
    case 'en':
      return AppLocalizationsEn();
    case 'es':
      return AppLocalizationsEs();
    case 'it':
      return AppLocalizationsIt();
    case 'pt':
      return AppLocalizationsPt();
  }

  throw FlutterError(
    'AppLocalizations.delegate failed to load unsupported locale "$locale". This is likely '
    'an issue with the localizations generation tool. Please file an issue '
    'on GitHub with a reproducible sample app and the gen-l10n configuration '
    'that was used.',
  );
}
