// ignore: unused_import
import 'package:intl/intl.dart' as intl;
import 'app_localizations.dart';

// ignore_for_file: type=lint

/// The translations for Italian (`it`).
class AppLocalizationsIt extends AppLocalizations {
  AppLocalizationsIt([String locale = 'it']) : super(locale);

  @override
  String get cancel => 'Annulla';

  @override
  String get confirm => 'Conferma';

  @override
  String get save => 'Salva';

  @override
  String get delete => 'Elimina';

  @override
  String get edit => 'Modifica';

  @override
  String get close => 'Chiudi';

  @override
  String get back => 'Indietro';

  @override
  String get finish => 'Fine';

  @override
  String get accept => 'Accetta';

  @override
  String get reject => 'Rifiuta';

  @override
  String get send => 'Invia';

  @override
  String get invite => 'Invita';

  @override
  String get yes => 'Sì';

  @override
  String get no => 'No';

  @override
  String get error => 'Errore';

  @override
  String get success => 'Successo';

  @override
  String get next => 'Avanti';

  @override
  String get insert => 'Inserisci';

  @override
  String get qrScannerTitle => 'Scansiona codice';

  @override
  String get qrScannerCodeDetected => 'Codice rilevato';

  @override
  String get qrScannerConfirmCode => 'È questo il codice corretto?';

  @override
  String get qrScannerInstructions => 'Punta al codice QR o al codice a barre';

  @override
  String get appTitle => 'Geonity';

  @override
  String get appSubtitle => 'Osservazioni geolocalizzate';

  @override
  String get loginTitle => 'Accedi';

  @override
  String get loginEmailLabel => 'Email';

  @override
  String get loginEmailHint => 'tua@email.com';

  @override
  String get loginEmailRequired => 'Inserisci la tua email';

  @override
  String get loginUsernameLabel => 'Nome utente/Email';

  @override
  String get loginUsernameHint => 'nome utente o email';

  @override
  String get loginPasswordLabel => 'Password';

  @override
  String get loginErrorMessage =>
      'Errore di accesso. Verifica le tue credenziali.';

  @override
  String get loginUsernameRequired => 'Inserisci il tuo nome utente o email';

  @override
  String get loginPasswordRequired => 'Inserisci la tua password';

  @override
  String get loginPasswordMinLength =>
      'La password deve avere almeno 6 caratteri';

  @override
  String get loginNoAccount => 'Non hai un account? ';

  @override
  String get loginRegister => 'Registrati';

  @override
  String get registerTitle => 'Crea account';

  @override
  String get registerEmailHint => 'tua@email.com';

  @override
  String get registerEmailInvalid => 'Email non valida';

  @override
  String get registerPasswordLabel => 'Password';

  @override
  String get registerPasswordRequired => 'Inserisci una password';

  @override
  String get registerPasswordMinLength => 'Minimo 8 caratteri';

  @override
  String get registerPasswordRepeatLabel => 'Ripeti la password';

  @override
  String get registerPasswordRepeatRequired => 'Ripeti la password';

  @override
  String get registerPasswordMismatch => 'Le password non corrispondono';

  @override
  String get registerCheckEmail =>
      'Controlla la tua email per confermare l\'account';

  @override
  String get registerCreateAccount => 'Crea account';

  @override
  String get registerAlreadyHaveAccount => 'Hai già un account? ';

  @override
  String get registerSignIn => 'Accedi';

  @override
  String get navProjects => 'Progetti';

  @override
  String get navOrganizations => 'Organizzazioni';

  @override
  String get navProfile => 'Profilo';

  @override
  String get createNewTitle => 'Crea nuovo';

  @override
  String get createNewProject => 'Nuovo Progetto';

  @override
  String get createNewOrganization => 'Nuova Organizzazione';

  @override
  String get logout => 'Disconnetti';

  @override
  String get dangerZone => 'Zona di pericolo';

  @override
  String get deleteAccount => 'Elimina account';

  @override
  String get deleteAccountTitle => 'Elimina account';

  @override
  String get deleteAccountMessage =>
      'Questa azione è irreversibile. Il tuo account verrà eliminato definitivamente.';

  @override
  String get deleteAccountKeepObservations => 'Mantieni le mie osservazioni';

  @override
  String get deleteAccountObservationsWarning =>
      'Se disabiliti questa opzione, tutte le tue osservazioni verranno eliminate.';

  @override
  String get invitationsTitle => 'Inviti';

  @override
  String invitationsCount(Object count) {
    return 'Inviti ($count)';
  }

  @override
  String get invitationsEmpty => 'Non hai inviti in sospeso';

  @override
  String get invitationAccepted => 'Invito accettato!';

  @override
  String get invitationRejected => 'Invito rifiutato';

  @override
  String get invitationToProject => 'progetto';

  @override
  String get invitationToOrganization => 'istituzione';

  @override
  String get searchProjects => 'Cerca progetti';

  @override
  String get searchResults => 'RISULTATI DELLA RICERCA';

  @override
  String searchResultsCount(Object query, Object count) {
    return '\"$query\" - $count risultato';
  }

  @override
  String searchResultsCountPlural(Object query, Object count) {
    return '\"$query\" - $count risultati';
  }

  @override
  String get myProjects => 'I miei progetti';

  @override
  String get exploreProjects => 'Esplora';

  @override
  String get drafts => 'Bozze';

  @override
  String get noDraftsTitle => 'Nessuna bozza';

  @override
  String get noDraftsSubtitle =>
      'I progetti salvati come bozza appariranno qui';

  @override
  String get continueDraft => 'Continua a modificare';

  @override
  String get noMyProjectsTitle => 'Nessun progetto';

  @override
  String get noMyProjectsSubtitle => 'Unisciti a un progetto o creane uno';

  @override
  String get filterByCategory => 'Filtra per categoria';

  @override
  String get category => 'Categoria';

  @override
  String projectCreatedBy(Object creator) {
    return 'Creato da: $creator';
  }

  @override
  String get projectInstitutions => 'Istituzioni';

  @override
  String get projectLoadError => 'Impossibile caricare il progetto';

  @override
  String get projectDeleteConfirmTitle => 'Eliminare il progetto?';

  @override
  String get projectDeleteConfirmMessage =>
      'Questa azione non può essere annullata.';

  @override
  String get projectDeleted => 'Progetto eliminato';

  @override
  String get projectDeleteError => 'Errore nell\'eliminazione del progetto';

  @override
  String get projectAvailableOffline => 'Progetto disponibile offline';

  @override
  String get projectOfflineDeleteTitle => 'Elimina dati offline';

  @override
  String get projectOfflineDeleteMessage =>
      'I dati e la mappa scaricata verranno eliminati. Le osservazioni in attesa di sincronizzazione non andranno perse.';

  @override
  String get projectUpdated => 'Progetto aggiornato con successo';

  @override
  String get projectCreated => 'Progetto creato con successo';

  @override
  String get projectUpdateError => 'Errore nell\'aggiornamento del progetto';

  @override
  String get projectCreateError => 'Errore nella creazione del progetto';

  @override
  String get editProjectTitle => 'Modifica Progetto';

  @override
  String get newProjectTitle => 'Nuovo Progetto';

  @override
  String get whatToEdit => 'Cosa vuoi modificare?';

  @override
  String get addCoverImage => 'Aggiungi immagine di copertina';

  @override
  String get projectDescriptionLabel => 'Descrizione *';

  @override
  String get projectDescriptionRequired => 'Inserisci una descrizione';

  @override
  String get globalProjectSubtitle => 'Il progetto è aperto a tutti';

  @override
  String get addCountry => 'Aggiungi paese';

  @override
  String get projectPasswordLabel => 'Password del progetto *';

  @override
  String get projectPasswordRequired =>
      'La password è obbligatoria per i progetti privati';

  @override
  String get offlineProjectsShown =>
      'Nessuna connessione — visualizzazione dei progetti salvati offline';

  @override
  String get organizationsTitle => 'Organizzazioni';

  @override
  String get organizationLoadError => 'Impossibile caricare l\'organizzazione';

  @override
  String get organizationDeleteConfirmTitle => 'Eliminare l\'organizzazione?';

  @override
  String get organizationDeleteConfirmMessage =>
      'Questa azione non può essere annullata.';

  @override
  String get organizationDeleted => 'Organizzazione eliminata';

  @override
  String get organizationDeleteError =>
      'Errore nell\'eliminazione dell\'organizzazione';

  @override
  String get organizationLeaveConfirmTitle => 'Lascia l\'organizzazione';

  @override
  String get organizationLeaveConfirmMessage =>
      'Sei sicuro di voler lasciare questa organizzazione?';

  @override
  String get organizationLeft => 'Hai lasciato l\'organizzazione';

  @override
  String get organizationLeaveError =>
      'Errore nell\'uscita dall\'organizzazione';

  @override
  String get organizationProjects => 'Progetti';

  @override
  String get organizationMembers => 'Membri';

  @override
  String get organizationRoleCreator => 'Creatore';

  @override
  String get organizationRoleAdministrator => 'Amministratore';

  @override
  String get organizationRoleMember => 'Membro';

  @override
  String get createOrganizationTitle => 'Crea organizzazione';

  @override
  String get editOrganizationTitle => 'Modifica organizzazione';

  @override
  String get organizationNameLabel => 'Nome dell\'organizzazione';

  @override
  String get organizationNameHint => 'Scrivi il nome dell\'organizzazione...';

  @override
  String get organizationNameRequired =>
      'Inserisci il nome dell\'organizzazione';

  @override
  String get organizationBiographyLabel => 'Biografia';

  @override
  String get organizationBiographyHint =>
      'Presenta la tua organizzazione nella biografia';

  @override
  String get organizationProfileImage => 'Immagine del profilo';

  @override
  String get organizationCoverImage => 'Immagine di copertina';

  @override
  String get organizationCreated => 'Organizzazione creata con successo';

  @override
  String get organizationUpdated => 'Organizzazione aggiornata con successo';

  @override
  String get organizationCreateError =>
      'Errore nella creazione dell\'organizzazione';

  @override
  String get organizationUpdateError =>
      'Errore nell\'aggiornamento dell\'organizzazione';

  @override
  String get adminAndInvitationsTitle => 'Amministratori e Inviti';

  @override
  String get administrators => 'Amministratori';

  @override
  String get inviteAsAdminInstruction =>
      'Invita altri utenti come amministratori del progetto';

  @override
  String get emailExampleHint => 'email@esempio.com';

  @override
  String get creator => 'Creatore';

  @override
  String get administrator => 'Amministratore';

  @override
  String get inviteMemberTitle => 'Invita membro';

  @override
  String get inviteMemberEmailLabel => 'Email';

  @override
  String get inviteMemberEmailHint => 'utente@esempio.com';

  @override
  String get inviteMemberRoleLabel => 'Ruolo';

  @override
  String get inviteMemberEmailInvalid => 'Inserisci un\'email valida';

  @override
  String get invitationSent => 'Invito inviato con successo';

  @override
  String get invitationSendError => 'Errore nell\'invio dell\'invito';

  @override
  String get invitationSendInstruction =>
      'Invita altri utenti nell\'organizzazione';

  @override
  String get invitationsSentLabel => 'Inviti inviati:';

  @override
  String get invitationsExpireInfo => 'Gli inviti scadono in 7 giorni';

  @override
  String get manageMembersTitle => 'Gestione Membri';

  @override
  String get currentManagement => 'Gestione attuale';

  @override
  String get pendingInvitations => 'Inviti in sospeso';

  @override
  String invitedBy(Object name) {
    return 'Invitato da $name';
  }

  @override
  String expires(Object date) {
    return 'Scade: $date';
  }

  @override
  String get statusPending => 'In sospeso';

  @override
  String get emailRequired => 'Inserisci un indirizzo email';

  @override
  String get emailValidRequired => 'Inserisci un indirizzo email valido';

  @override
  String get emailAlreadyInvited => 'Questa email è già stata invitata';

  @override
  String get mapTitle => 'Mappa';

  @override
  String get mapInteractive => 'Interactive map will appear here';

  @override
  String get mapNoObservations =>
      'Questo progetto non ha una mappa delle osservazioni';

  @override
  String get mapNoFieldForm =>
      'Il progetto non dispone di un modulo di campo configurato per registrare le osservazioni.';

  @override
  String get mapGettingLocation => 'Recupero posizione...';

  @override
  String get mapLocationServicesDisabled =>
      'I servizi di localizzazione sono disabilitati';

  @override
  String get mapLocationPermissionDenied =>
      'Autorizzazioni di localizzazione negate';

  @override
  String get mapLocationPermissionPermanentlyDenied =>
      'Le autorizzazioni di localizzazione sono negate definitivamente';

  @override
  String mapLocationError(Object error) {
    return 'Errore nel recupero della posizione: $error';
  }

  @override
  String get fuzzyPrivacyNote =>
      'Per motivi di privacy, viene mostrata l\'area approssimativa dell\'osservazione.';

  @override
  String get observationAdminValues => 'Valori di amministrazione';

  @override
  String offlinePendingBadge(Object count) {
    return '$count oss. in attesa di invio';
  }

  @override
  String get offlineModeBadge => 'Modalità offline';

  @override
  String observationTitle(Object id) {
    return 'Osservazione #$id';
  }

  @override
  String get observationDate => 'Data';

  @override
  String get observationCoordinates => 'Coordinate';

  @override
  String get observationUser => 'Utente';

  @override
  String get observationDescription => 'Descrizione';

  @override
  String get observationAdditionalData => 'Dati aggiuntivi';

  @override
  String observationImages(Object count) {
    return 'Immagini ($count)';
  }

  @override
  String get observationCenterOnMap => 'Centra sulla mappa';

  @override
  String get observationImageLoadError =>
      'Errore nel caricamento dell\'immagine';

  @override
  String get profileObservationDefault => 'Osservazione';

  @override
  String get addObservationTitle => 'Nuova osservazione';

  @override
  String get addObservationSubmit => 'Invia osservazione';

  @override
  String addObservationLocationError(Object error) {
    return 'Errore nel recupero della posizione: $error';
  }

  @override
  String get observationCreated => 'Osservazione creata con successo';

  @override
  String get observationCreateError =>
      'Errore nella creazione dell\'osservazione';

  @override
  String get offlineObservationSaved =>
      'Nessuna connessione — Osservazione salvata, verrà inviata al recupero del segnale';

  @override
  String get selectAtLeastOneOption => 'Seleziona almeno un\'opzione';

  @override
  String get fieldRequired => 'Campo obbligatorio';

  @override
  String fieldEnter(Object label) {
    return 'Inserisci $label';
  }

  @override
  String fieldSelect(Object label) {
    return 'Seleziona $label';
  }

  @override
  String get fieldSelectDate => 'Seleziona data';

  @override
  String get fieldAddImage => 'Aggiungi immagine';

  @override
  String get fieldScanCode => 'Scansiona un codice';

  @override
  String get imagePickerTitle => 'Seleziona immagine';

  @override
  String get imagePickerTakePhoto => 'Scatta foto';

  @override
  String get imagePickerChooseGallery => 'Scegli dalla galleria';

  @override
  String get profileEditTitle => 'Modifica Profilo';

  @override
  String get profileCoverImage => 'Immagine di copertina';

  @override
  String get profileCoverImageChange => 'Tocca per cambiare immagine';

  @override
  String get profileCoverImageAdd =>
      'Tocca per aggiungere immagine di copertina';

  @override
  String get profileFirstName => 'Nome';

  @override
  String get profileFirstNameRequired => 'Inserisci il tuo nome';

  @override
  String get profileLastName => 'Cognome';

  @override
  String get profileLastNameRequired => 'Inserisci il tuo cognome';

  @override
  String get profileBiography => 'Biografia';

  @override
  String get profileBiographyHint => 'Raccontaci di te...';

  @override
  String get profileCountry => 'Paese';

  @override
  String get profileCountrySearch => 'Cerca paese';

  @override
  String get profileCountrySearchHint => 'Inizia a scrivere...';

  @override
  String get profileCountrySelect => 'Seleziona il tuo paese';

  @override
  String get profilePublic => 'Profilo pubblico';

  @override
  String get profilePublicDescription =>
      'Consenti ad altri utenti di vedere il tuo profilo';

  @override
  String get profileSaveChanges => 'Salva Modifiche';

  @override
  String get profileUpdated => 'Profilo aggiornato con successo';

  @override
  String get profileUpdateError => 'Errore nell\'aggiornamento del profilo';

  @override
  String get settings => 'Impostazioni';

  @override
  String get languageTitle => 'Lingua';

  @override
  String get languageSpanish => 'Español';

  @override
  String get languageEnglish => 'English';

  @override
  String get languagePortuguese => 'Português';

  @override
  String get languageItalian => 'Italiano';

  @override
  String get languageSystem => 'Lingua di sistema';

  @override
  String get appVersion => 'Versione';

  @override
  String get whatsNew => 'Novità';

  @override
  String get themeTitle => 'Tema';

  @override
  String get themeLight => 'Chiaro';

  @override
  String get themeDark => 'Scuro';

  @override
  String get themeSystem => 'Automatico';

  @override
  String collaboratingOrganizations(Object count) {
    return '$count organizzazioni collaboratrici';
  }

  @override
  String myObservations(Object count) {
    return 'Le mie Osservazioni ($count)';
  }

  @override
  String myOrganizations(Object count) {
    return 'Le mie Organizzazioni ($count)';
  }

  @override
  String get timeAgoMoment => 'Poco fa';

  @override
  String timeAgoMinutes(Object minutes) {
    return '$minutes min fa';
  }

  @override
  String timeAgoHours(Object hours) {
    return '${hours}h fa';
  }

  @override
  String timeAgoDays(Object days) {
    return '${days}g fa';
  }

  @override
  String timeAgoWeeks(Object weeks) {
    return '$weeks sett fa';
  }

  @override
  String timeAgoMonths(Object months) {
    return '$months mese fa';
  }

  @override
  String timeAgoMonthsPlural(Object months) {
    return '$months mesi fa';
  }

  @override
  String timeAgoYears(Object years) {
    return '$years anno fa';
  }

  @override
  String timeAgoYearsPlural(Object years) {
    return '$years anni fa';
  }

  @override
  String get roleMember => 'Membro';

  @override
  String get roleAdministrator => 'Amministratore';

  @override
  String get leave => 'Lascia';

  @override
  String get leaveOrganization => 'Lascia l\'organizzazione';

  @override
  String get leaveOrganizationConfirm =>
      'Sei sicuro di voler lasciare questa organizzazione?';

  @override
  String get leftOrganization => 'Hai lasciato l\'organizzazione';

  @override
  String get leaveOrganizationError =>
      'Errore nell\'uscita dall\'organizzazione';

  @override
  String get inviteMember => 'Invita membro';

  @override
  String get sendInvitation => 'Invia invito';

  @override
  String get enterValidEmail => 'Inserisci un\'email valida';

  @override
  String get deleteOrganizationQuestion => 'Eliminare l\'organizzazione?';

  @override
  String get deleteOrganizationConfirm =>
      'Questa azione non può essere annullata.';

  @override
  String get deleteOrganizationError =>
      'Errore nell\'eliminazione dell\'organizzazione';

  @override
  String get errorLoadingOrganization =>
      'Impossibile caricare l\'organizzazione';

  @override
  String get errorLoadingProfile => 'Errore nel caricamento del profilo';

  @override
  String get gettingLocation => 'Recupero posizione...';

  @override
  String get locationServicesDisabled =>
      'I servizi di localizzazione sono disabilitati';

  @override
  String get locationPermissionDenied =>
      'Autorizzazione di localizzazione negata';

  @override
  String get locationPermissionDeniedPermanently =>
      'Le autorizzazioni di localizzazione sono negate definitivamente';

  @override
  String errorGettingLocation(Object error) {
    return 'Errore nel recupero della posizione: $error';
  }

  @override
  String get centerOnMap => 'Centra sulla mappa';

  @override
  String get selectImage => 'Seleziona immagine';

  @override
  String get takePhoto => 'Scatta foto';

  @override
  String get chooseFromGallery => 'Scegli dalla galleria';

  @override
  String get addImage => 'Aggiungi immagine';

  @override
  String get tapToChangeImage => 'Tocca per cambiare immagine';

  @override
  String get tapToAddCoverImage => 'Tocca per aggiungere immagine di copertina';

  @override
  String selectLowercase(Object label) {
    return 'Seleziona $label';
  }

  @override
  String get selectTopics => 'Seleziona Argomenti';

  @override
  String get privateProject => 'Progetto privato';

  @override
  String get privateProjectSubtitle => 'Richiede password per aderire';

  @override
  String get privateDatabase => 'Database privato';

  @override
  String get privateDatabaseSubtitle => 'I dati non possono essere scaricati';

  @override
  String get privateProjectsRequirePassword =>
      'I progetti privati richiedono una password';

  @override
  String get saveBasicInfo => 'Salva informazioni di base';

  @override
  String get saveBasicInfoSubtitle => 'Nome, descrizione, privacy, ecc.';

  @override
  String get editFormFields => 'Modifica campi del modulo';

  @override
  String get editFormFieldsSubtitle => 'Aggiungi, modifica o elimina campi';

  @override
  String projectHasObservations(Object count) {
    return '⚠️ Questo progetto ha $count osservazioni';
  }

  @override
  String get addOption => 'Aggiungi opzione';

  @override
  String get cannotDeleteFieldWithObservations =>
      'Impossibile eliminare un campo che ha osservazioni';

  @override
  String get noFieldTypesAvailable => 'Nessun tipo di campo disponibile';

  @override
  String get cannotChangeFieldTypeWithObservations =>
      'Impossibile cambiare il tipo di un campo che ha osservazioni';

  @override
  String get selectFieldType => 'Seleziona tipo di campo';

  @override
  String fieldMustHaveOptions(Object fieldName) {
    return 'Il campo \"$fieldName\" di tipo CHOICE deve avere almeno un\'opzione';
  }

  @override
  String get jsonToSend => 'JSON da inviare';

  @override
  String get noChanges => 'Nessuna modifica';

  @override
  String get noChangesDetected =>
      'Nessuna modifica rilevata nei campi del modulo.\\n\\nfield_form non verrà inviato al backend.';

  @override
  String get cannotChangeRequiredWithObservations =>
      'Impossibile modificare lo stato obbligatorio di un campo che ha osservazioni';

  @override
  String get newFieldsCannotBeRequiredWithObservations =>
      'I nuovi campi non possono essere obbligatori quando ci sono già osservazioni';

  @override
  String get enterEmail => 'Inserisci un indirizzo email';

  @override
  String get enterValidEmailFormat => 'Inserisci un indirizzo email valido';

  @override
  String get updateInstitutionsError =>
      'Errore nell\'aggiornamento delle istituzioni';

  @override
  String get institutionsUpdated => 'Istituzioni aggiornate con successo';

  @override
  String get confirmationMessageTitle => 'Messaggio di conferma';

  @override
  String get showPostMessageLabel => 'Mostra messaggio dopo l\'osservazione';

  @override
  String get insertLinkTitle => 'Inserisci collegamento';

  @override
  String get linkTextLabel => 'Testo del collegamento';

  @override
  String get linkUrlLabel => 'URL';

  @override
  String get editTab => 'Modifica';

  @override
  String get previewTab => 'Anteprima';

  @override
  String get messageHint => 'Scrivi il messaggio qui...';

  @override
  String get messageEmptyPreview =>
      'Nessun contenuto da visualizzare in anteprima';

  @override
  String get messageInfo =>
      'Questo messaggio apparirà all\'utente dopo aver aggiunto un\'osservazione';

  @override
  String get tooltipBold => 'Grassetto';

  @override
  String get tooltipItalic => 'Corsivo';

  @override
  String get tooltipLink => 'Collegamento';

  @override
  String get tooltipList => 'Elenco';

  @override
  String get addLanguageTitle => 'Aggiungi lingua';

  @override
  String get translationLanguageLabel => 'Lingua di traduzione';

  @override
  String get translationSelectLanguage => 'Seleziona una lingua';

  @override
  String get translationSelectLanguageHint =>
      'Seleziona una lingua per vedere i campi da tradurre';

  @override
  String get translationDescriptionLabel => 'Descrizione';

  @override
  String get translationPostMessageLabel => 'Messaggio post-osservazione';

  @override
  String translationOptionLabel(Object key) {
    return 'Opzione: \"$key\"';
  }

  @override
  String translationHint(Object lang) {
    return 'Traduzione in $lang...';
  }

  @override
  String get translationSectionProject => 'Progetto';

  @override
  String get translationNameLabel => 'Nome';

  @override
  String get translationSectionQuestions => 'Domande del modulo';

  @override
  String translationQuestionHeader(int number) {
    return 'Domanda $number';
  }

  @override
  String get translationQuestionTextLabel => 'Testo della domanda';

  @override
  String get translationHelpTextLabel => 'Testo di aiuto';

  @override
  String get translationSectionOptions => 'OPZIONI';

  @override
  String get skip => 'Salta';

  @override
  String get update => 'Aggiorna';

  @override
  String get create => 'Crea';

  @override
  String get projectNameLabel => 'Nome del progetto *';

  @override
  String get projectNameRequired => 'Inserisci un nome';

  @override
  String get searchHint => 'Cerca...';

  @override
  String get selectOrganizationsDialog => 'Seleziona Organizzazioni';

  @override
  String get topicsLabel => 'Argomenti';

  @override
  String get organizationsLabel => 'Organizzazioni';

  @override
  String get globalLabel => 'Globale';

  @override
  String get noTopicsAvailable => 'Nessun argomento disponibile';

  @override
  String get selectTopicsAction => 'Seleziona argomenti';

  @override
  String get noOrganizationsAvailable => 'Nessuna organizzazione disponibile';

  @override
  String get selectOrganizationsAction => 'Seleziona organizzazioni';

  @override
  String get fuzzyGeoposition => 'Geoposizione approssimativa';

  @override
  String get fuzzyGeopositionSubtitle =>
      'Le osservazioni vengono mostrate come aree approssimative, non come punti esatti';

  @override
  String get publicMap => 'Mappa pubblica';

  @override
  String get publicMapSubtitle =>
      'Abilita una pagina mappa pubblica accessibile senza accesso';

  @override
  String get projectPublished => 'Pubblicato';

  @override
  String get projectDraftSubtitle =>
      'Il progetto è in bozza. Necessita di almeno 10 osservazioni per essere pubblicato.';

  @override
  String projectDraftSubtitleWithCount(int count) {
    return 'Il progetto è in bozza. Necessita di almeno 10 osservazioni per essere pubblicato (attualmente ne ha $count).';
  }

  @override
  String get projectPublishedSubtitle =>
      'Il progetto è pubblicato e visibile a tutti.';

  @override
  String get projectEnded => 'Concluso';

  @override
  String get projectEndedSubtitle =>
      'Il progetto non accetta più nuove osservazioni';

  @override
  String get emailOnObservation => 'Email all\'osservazione';

  @override
  String get emailOnObservationSubtitle =>
      'Ricevi un\'email ogni volta che viene inviata un\'osservazione';

  @override
  String get coverImageRequired => 'L\'immagine di copertina è obbligatoria';

  @override
  String get organizationType => 'Tipo di organizzazione';

  @override
  String get continueLabel => 'Continua';

  @override
  String get optionLabelRequired => 'Testo *';

  @override
  String get optionLabelHint => 'Es: Preoccupazione minore';

  @override
  String get optionValueLabel => 'Valore (opzionale)';

  @override
  String get optionValueHint => 'Es: lc';

  @override
  String get optionsLabel => 'Opzioni';

  @override
  String get soonExpiry => 'A breve';

  @override
  String get userFallback => 'Utente';

  @override
  String get retry => 'Riprova';

  @override
  String get viewMap => 'Vedi mappa';

  @override
  String get adminBadge => 'Admin';

  @override
  String get badgeFinished => 'Terminato';

  @override
  String get badgePrivate => 'Privato';

  @override
  String get badgeFuzzy => 'Fuzzy';

  @override
  String get badgeGlobal => 'Globale';

  @override
  String get downloadCsv => 'Scarica CSV';

  @override
  String get projectObservationsShare => 'Osservazioni del progetto';

  @override
  String downloadErrorCode(Object code) {
    return 'Errore di download: $code';
  }

  @override
  String get csvDownloadError => 'Errore nel download del CSV';

  @override
  String get noFieldFormError => 'Questo progetto non ha un modulo di campo';

  @override
  String get offlineDataDeleted => 'Dati offline eliminati';

  @override
  String offlineDownloadError(Object error) {
    return 'Errore di download: $error';
  }

  @override
  String get removeOfflineTooltip => 'Rimuovi offline';

  @override
  String get makeOfflineTooltip => 'Rendi disponibile offline';

  @override
  String get deleteAccountError => 'Errore nell\'eliminazione dell\'account';

  @override
  String get myProfile => 'Il mio Profilo';

  @override
  String get profileObservations => 'Osservazioni';

  @override
  String get profileProjects => 'Progetti';

  @override
  String get profileOrganizationsLabel => 'Organizzazioni';

  @override
  String createdProjectsCount(Object count) {
    return 'Progetti Creati ($count)';
  }

  @override
  String participatedProjectsCount(Object count) {
    return 'Progetti a cui Partecipo ($count)';
  }

  @override
  String likedProjectsCount(Object count) {
    return 'Progetti che mi Piacciono ($count)';
  }

  @override
  String get additionalData => 'Dati aggiuntivi';

  @override
  String fieldLabelFallback(Object key) {
    return 'Campo $key';
  }

  @override
  String get boolYes => 'Sì';

  @override
  String get boolNo => 'No';

  @override
  String get other => 'Altro';

  @override
  String get specify => 'Specifica...';

  @override
  String get noOptionsDefined => 'Nessuna opzione definita';

  @override
  String get backendDown => 'Server non disponibile';

  @override
  String get noConnectionTitle => 'Nessuna connessione';

  @override
  String get backendDownMessage =>
      'Il server non risponde.\nPer favore contatta la Fondazione Ibercivis.';

  @override
  String get noConnectionMessage =>
      'Controlla la tua connessione internet\ne riprova.';

  @override
  String get emailFieldLabel => 'Email';

  @override
  String get roleLabel => 'Ruolo';

  @override
  String get inviteMemberHint => 'utente@esempio.com';

  @override
  String get membersLabel => 'Membri';

  @override
  String get projectsLabel => 'Progetti';

  @override
  String get observationsInZone => 'Osservazioni in questa zona';

  @override
  String get selectType => 'Seleziona tipo';

  @override
  String get more => 'Altro...';

  @override
  String get profileImageLabel => 'Immagine del profilo';

  @override
  String get coverImageLabel => 'Immagine di copertina';

  @override
  String get noName => 'Senza nome';

  @override
  String get fieldNameHint => 'Nome del campo';

  @override
  String get noObservationMap =>
      'Questo progetto non ha una mappa delle osservazioni';

  @override
  String get observationZone => 'Zona di osservazioni';

  @override
  String get helpTextHint => 'Testo di aiuto (opzionale)';

  @override
  String get noOptionsAdded => 'Nessuna opzione. Aggiungi almeno un opzione.';

  @override
  String get projectPasswordWrong => 'Password errata.';

  @override
  String get privacyPolicy => 'Informativa sulla privacy';

  @override
  String get deleteAccountWeb => 'Elimina account';

  @override
  String get consentTitle => 'Termini e privacy';

  @override
  String get consentSubtitle =>
      'Per continuare, devi accettare i nostri Termini di utilizzo e l\'Informativa sulla privacy.';

  @override
  String get consentTermsLabel => 'Termini di utilizzo';

  @override
  String get consentAcceptButton => 'Accetta e continua';

  @override
  String get consentError => 'Errore nel salvataggio del consenso. Riprova.';

  @override
  String get registerTermsAccept =>
      'Accetto i Termini di utilizzo e l\'Informativa sulla privacy';

  @override
  String get registerTermsRequired =>
      'Devi accettare i termini per registrarti';
}
