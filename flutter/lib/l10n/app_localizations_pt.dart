// ignore: unused_import
import 'package:intl/intl.dart' as intl;
import 'app_localizations.dart';

// ignore_for_file: type=lint

/// The translations for Portuguese (`pt`).
class AppLocalizationsPt extends AppLocalizations {
  AppLocalizationsPt([String locale = 'pt']) : super(locale);

  @override
  String get cancel => 'Cancelar';

  @override
  String get confirm => 'Confirmar';

  @override
  String get save => 'Guardar';

  @override
  String get delete => 'Eliminar';

  @override
  String get edit => 'Editar';

  @override
  String get close => 'Fechar';

  @override
  String get back => 'Voltar';

  @override
  String get finish => 'Finalizar';

  @override
  String get accept => 'Aceitar';

  @override
  String get reject => 'Rejeitar';

  @override
  String get send => 'Enviar';

  @override
  String get invite => 'Convidar';

  @override
  String get yes => 'Sim';

  @override
  String get no => 'Não';

  @override
  String get error => 'Erro';

  @override
  String get success => 'Sucesso';

  @override
  String get next => 'Próximo';

  @override
  String get insert => 'Inserir';

  @override
  String get qrScannerTitle => 'Escanear código';

  @override
  String get qrScannerCodeDetected => 'Código detectado';

  @override
  String get qrScannerConfirmCode => 'Este é o código correto?';

  @override
  String get qrScannerInstructions =>
      'Aponte para o código QR ou código de barras';

  @override
  String get appTitle => 'Geonity';

  @override
  String get appSubtitle => 'Observações geolocalizadas';

  @override
  String get loginTitle => 'Entrar';

  @override
  String get loginEmailLabel => 'Email';

  @override
  String get loginEmailHint => 'seu@email.com';

  @override
  String get loginEmailRequired => 'Insira o seu email';

  @override
  String get loginUsernameLabel => 'Utilizador/Email';

  @override
  String get loginUsernameHint => 'utilizador ou email';

  @override
  String get loginPasswordLabel => 'Palavra-passe';

  @override
  String get loginErrorMessage =>
      'Erro ao entrar. Verifique as suas credenciais.';

  @override
  String get loginUsernameRequired =>
      'Por favor insira o seu utilizador ou email';

  @override
  String get loginPasswordRequired => 'Por favor insira a sua palavra-passe';

  @override
  String get loginPasswordMinLength =>
      'A palavra-passe deve ter pelo menos 6 caracteres';

  @override
  String get loginNoAccount => 'Não tem conta? ';

  @override
  String get loginRegister => 'Registar';

  @override
  String get loginForgotPassword => 'Esqueceu-se da palavra-passe?';

  @override
  String get forgotPasswordTitle => 'Recuperar palavra-passe';

  @override
  String get forgotPasswordDescription =>
      'Insira o seu email e enviaremos um link para definir uma nova palavra-passe.';

  @override
  String get forgotPasswordEmailLabel => 'Email';

  @override
  String get forgotPasswordSubmit => 'Enviar link';

  @override
  String get forgotPasswordSuccess =>
      'Se o endereço existir no Geonity, enviámos um email com instruções. Verifique a caixa de entrada e a pasta de spam.';

  @override
  String get forgotPasswordError =>
      'Não foi possível enviar o link. Tente novamente.';

  @override
  String get registerTitle => 'Criar conta';

  @override
  String get registerEmailHint => 'seu@email.com';

  @override
  String get registerEmailInvalid => 'Email inválido';

  @override
  String get registerPasswordLabel => 'Palavra-passe';

  @override
  String get registerPasswordRequired => 'Insira uma palavra-passe';

  @override
  String get registerPasswordMinLength => 'Mínimo 8 caracteres';

  @override
  String get registerPasswordRepeatLabel => 'Repetir palavra-passe';

  @override
  String get registerPasswordRepeatRequired => 'Repita a palavra-passe';

  @override
  String get registerPasswordMismatch => 'As palavras-passe não coincidem';

  @override
  String get registerCheckEmail =>
      'Verifique o seu email para confirmar a conta';

  @override
  String get registerCreateAccount => 'Criar conta';

  @override
  String get registerAlreadyHaveAccount => 'Já tem conta? ';

  @override
  String get registerSignIn => 'Entrar';

  @override
  String get navProjects => 'Projetos';

  @override
  String get navOrganizations => 'Organizações';

  @override
  String get navProfile => 'Perfil';

  @override
  String get createNewTitle => 'Criar novo';

  @override
  String get createNewProject => 'Novo Projeto';

  @override
  String get createNewOrganization => 'Nova Organização';

  @override
  String get logout => 'Terminar sessão';

  @override
  String get dangerZone => 'Zona de perigo';

  @override
  String get deleteAccount => 'Eliminar conta';

  @override
  String get deleteAccountTitle => 'Eliminar conta';

  @override
  String get deleteAccountMessage =>
      'Esta ação é irreversível. A sua conta será eliminada permanentemente.';

  @override
  String get deleteAccountKeepObservations => 'Manter as minhas observações';

  @override
  String get deleteAccountObservationsWarning =>
      'Se desativar esta opção, todas as suas observações serão eliminadas.';

  @override
  String get invitationsTitle => 'Convites';

  @override
  String invitationsCount(Object count) {
    return 'Convites ($count)';
  }

  @override
  String get invitationsEmpty => 'Não tem convites pendentes';

  @override
  String get invitationAccepted => 'Convite aceite!';

  @override
  String get invitationRejected => 'Convite rejeitado';

  @override
  String get invitationToProject => 'projeto';

  @override
  String get invitationToOrganization => 'instituição';

  @override
  String get searchProjects => 'Pesquisar projetos';

  @override
  String get searchResults => 'RESULTADOS DA PESQUISA';

  @override
  String searchResultsCount(Object query, Object count) {
    return '\"$query\" - $count resultado';
  }

  @override
  String searchResultsCountPlural(Object query, Object count) {
    return '\"$query\" - $count resultados';
  }

  @override
  String get myProjects => 'Os meus projetos';

  @override
  String get exploreProjects => 'Explorar';

  @override
  String get drafts => 'Rascunhos';

  @override
  String get noDraftsTitle => 'Sem rascunhos';

  @override
  String get noDraftsSubtitle =>
      'Os projetos guardados como rascunho aparecerão aqui';

  @override
  String get continueDraft => 'Continuar a editar';

  @override
  String get noMyProjectsTitle => 'Sem projetos';

  @override
  String get noMyProjectsSubtitle => 'Junte-se a um projeto ou crie o seu';

  @override
  String get filterByCategory => 'Filtrar por categoria';

  @override
  String get category => 'Categoria';

  @override
  String projectCreatedBy(Object creator) {
    return 'Criado por: $creator';
  }

  @override
  String get projectInstitutions => 'Instituições';

  @override
  String get projectLoadError => 'Não foi possível carregar o projeto';

  @override
  String get projectDeleteConfirmTitle => 'Eliminar projeto?';

  @override
  String get projectDeleteConfirmMessage => 'Esta ação não pode ser desfeita.';

  @override
  String get projectDeleted => 'Projeto eliminado';

  @override
  String get projectDeleteError => 'Erro ao eliminar o projeto';

  @override
  String get projectAvailableOffline => 'Projeto disponível offline';

  @override
  String get projectOfflineDeleteTitle => 'Eliminar dados offline';

  @override
  String get projectOfflineDeleteMessage =>
      'Os dados e o mapa descarregado serão eliminados. As observações pendentes de sincronização não serão perdidas.';

  @override
  String get projectUpdated => 'Projeto atualizado com sucesso';

  @override
  String get projectCreated => 'Projeto criado com sucesso';

  @override
  String get projectUpdateError => 'Erro ao atualizar o projeto';

  @override
  String get projectCreateError => 'Erro ao criar o projeto';

  @override
  String get editProjectTitle => 'Editar Projeto';

  @override
  String get newProjectTitle => 'Novo Projeto';

  @override
  String get whatToEdit => 'O que deseja editar?';

  @override
  String get addCoverImage => 'Adicionar imagem de capa';

  @override
  String get projectDescriptionLabel => 'Descrição *';

  @override
  String get projectDescriptionRequired => 'Por favor insira uma descrição';

  @override
  String get globalProjectSubtitle => 'O projeto está aberto a toda a gente';

  @override
  String get addCountry => 'Adicionar país';

  @override
  String get projectPasswordLabel => 'Palavra-passe do projeto *';

  @override
  String get projectPasswordRequired =>
      'A palavra-passe é obrigatória para projetos privados';

  @override
  String get offlineProjectsShown =>
      'Sem ligação — a mostrar projetos guardados offline';

  @override
  String get organizationsTitle => 'Organizações';

  @override
  String get organizationLoadError => 'Não foi possível carregar a organização';

  @override
  String get organizationDeleteConfirmTitle => 'Eliminar organização?';

  @override
  String get organizationDeleteConfirmMessage =>
      'Esta ação não pode ser desfeita.';

  @override
  String get organizationDeleted => 'Organização eliminada';

  @override
  String get organizationDeleteError => 'Erro ao eliminar a organização';

  @override
  String get organizationLeaveConfirmTitle => 'Sair da organização';

  @override
  String get organizationLeaveConfirmMessage =>
      'Tem a certeza de que quer sair desta organização?';

  @override
  String get organizationLeft => 'Saiu da organização';

  @override
  String get organizationLeaveError => 'Erro ao sair da organização';

  @override
  String get organizationProjects => 'Projetos';

  @override
  String get organizationMembers => 'Membros';

  @override
  String get organizationRoleCreator => 'Criador';

  @override
  String get organizationRoleAdministrator => 'Administrador';

  @override
  String get organizationRoleMember => 'Membro';

  @override
  String get createOrganizationTitle => 'Criar organização';

  @override
  String get editOrganizationTitle => 'Editar organização';

  @override
  String get organizationNameLabel => 'Nome da organização';

  @override
  String get organizationNameHint => 'Escreva o nome da organização...';

  @override
  String get organizationNameRequired =>
      'Por favor insira o nome da organização';

  @override
  String get organizationBiographyLabel => 'Biografia';

  @override
  String get organizationBiographyHint =>
      'Apresente a sua organização na biografia';

  @override
  String get organizationProfileImage => 'Imagem de perfil';

  @override
  String get organizationCoverImage => 'Imagem de capa';

  @override
  String get organizationCreated => 'Organização criada com sucesso';

  @override
  String get organizationUpdated => 'Organização atualizada com sucesso';

  @override
  String get organizationCreateError => 'Erro ao criar a organização';

  @override
  String get organizationUpdateError => 'Erro ao atualizar a organização';

  @override
  String get adminAndInvitationsTitle => 'Administradores e Convites';

  @override
  String get administrators => 'Administradores';

  @override
  String get inviteAsAdminInstruction =>
      'Convide outros utilizadores como administradores do projeto';

  @override
  String get emailExampleHint => 'email@exemplo.com';

  @override
  String get creator => 'Criador';

  @override
  String get administrator => 'Administrador';

  @override
  String get inviteMemberTitle => 'Convidar membro';

  @override
  String get inviteMemberEmailLabel => 'Email';

  @override
  String get inviteMemberEmailHint => 'utilizador@exemplo.com';

  @override
  String get inviteMemberRoleLabel => 'Função';

  @override
  String get inviteMemberEmailInvalid => 'Por favor insira um email válido';

  @override
  String get invitationSent => 'Convite enviado com sucesso';

  @override
  String get invitationSendError => 'Erro ao enviar o convite';

  @override
  String get invitationSendInstruction =>
      'Convide outros utilizadores para a organização';

  @override
  String get invitationsSentLabel => 'Convites enviados:';

  @override
  String get invitationsExpireInfo => 'Os convites expiram em 7 dias';

  @override
  String get manageMembersTitle => 'Gestão de Membros';

  @override
  String get currentManagement => 'Gestão atual';

  @override
  String get pendingInvitations => 'Convites pendentes';

  @override
  String invitedBy(Object name) {
    return 'Convidado por $name';
  }

  @override
  String expires(Object date) {
    return 'Expira: $date';
  }

  @override
  String get statusPending => 'Pendente';

  @override
  String get emailRequired => 'Por favor, insira um endereço de email';

  @override
  String get emailValidRequired =>
      'Por favor, insira um endereço de email válido';

  @override
  String get emailAlreadyInvited => 'Este email já foi convidado';

  @override
  String get mapTitle => 'Mapa';

  @override
  String get mapInteractive => 'Interactive map will appear here';

  @override
  String get mapNoObservations => 'Este projeto não tem mapa de observações';

  @override
  String get mapNoFieldForm =>
      'O projeto não tem um formulário de campo configurado para registar observações.';

  @override
  String get mapGettingLocation => 'A obter localização...';

  @override
  String get mapLocationServicesDisabled =>
      'Os serviços de localização estão desativados';

  @override
  String get mapLocationPermissionDenied => 'Permissões de localização negadas';

  @override
  String get mapLocationPermissionPermanentlyDenied =>
      'As permissões de localização estão permanentemente negadas';

  @override
  String mapLocationError(Object error) {
    return 'Erro ao obter a localização: $error';
  }

  @override
  String get fuzzyPrivacyNote =>
      'Por razões de privacidade, é mostrada a área aproximada de observação.';

  @override
  String get observationAdminValues => 'Valores de administração';

  @override
  String offlinePendingBadge(Object count) {
    return '$count obs. pendentes de envio';
  }

  @override
  String get offlineModeBadge => 'Modo offline';

  @override
  String observationTitle(Object id) {
    return 'Observação #$id';
  }

  @override
  String get observationDate => 'Data';

  @override
  String get observationCoordinates => 'Coordenadas';

  @override
  String get observationUser => 'Utilizador';

  @override
  String get observationDescription => 'Descrição';

  @override
  String get observationAdditionalData => 'Dados adicionais';

  @override
  String observationImages(Object count) {
    return 'Imagens ($count)';
  }

  @override
  String get observationCenterOnMap => 'Centrar no mapa';

  @override
  String get observationImageLoadError => 'Erro ao carregar a imagem';

  @override
  String get profileObservationDefault => 'Observação';

  @override
  String get addObservationTitle => 'Nova observação';

  @override
  String get addObservationSubmit => 'Enviar observação';

  @override
  String addObservationLocationError(Object error) {
    return 'Erro ao obter a localização: $error';
  }

  @override
  String get observationCreated => 'Observação criada com sucesso';

  @override
  String get observationCreateError => 'Erro ao criar a observação';

  @override
  String get offlineObservationSaved =>
      'Sem ligação — Observação guardada, será enviada quando houver sinal';

  @override
  String get selectAtLeastOneOption => 'Selecione pelo menos uma opção';

  @override
  String get fieldRequired => 'Campo obrigatório';

  @override
  String fieldEnter(Object label) {
    return 'Insira $label';
  }

  @override
  String fieldSelect(Object label) {
    return 'Selecione $label';
  }

  @override
  String get fieldSelectDate => 'Selecione data';

  @override
  String get fieldAddImage => 'Adicionar imagem';

  @override
  String get fieldScanCode => 'Escanear um código';

  @override
  String get imagePickerTitle => 'Selecionar imagem';

  @override
  String get imagePickerTakePhoto => 'Tirar foto';

  @override
  String get imagePickerChooseGallery => 'Escolher da galeria';

  @override
  String get profileEditTitle => 'Editar Perfil';

  @override
  String get profileCoverImage => 'Imagem de capa';

  @override
  String get profileCoverImageChange => 'Toque para alterar imagem';

  @override
  String get profileCoverImageAdd => 'Toque para adicionar imagem de capa';

  @override
  String get profileFirstName => 'Nome';

  @override
  String get profileFirstNameRequired => 'Por favor insira o seu nome';

  @override
  String get profileLastName => 'Apelido';

  @override
  String get profileLastNameRequired => 'Por favor insira o seu apelido';

  @override
  String get profileBiography => 'Biografia';

  @override
  String get profileBiographyHint => 'Fale-nos sobre si...';

  @override
  String get profileCountry => 'País';

  @override
  String get profileCountrySearch => 'Pesquisar país';

  @override
  String get profileCountrySearchHint => 'Comece a escrever...';

  @override
  String get profileCountrySelect => 'Selecione o seu país';

  @override
  String get profilePublic => 'Perfil público';

  @override
  String get profilePublicDescription =>
      'Permitir que outros utilizadores vejam o seu perfil';

  @override
  String get profileSaveChanges => 'Guardar Alterações';

  @override
  String get profileUpdated => 'Perfil atualizado com sucesso';

  @override
  String get profileUpdateError => 'Erro ao atualizar o perfil';

  @override
  String get settings => 'Configurações';

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
  String get languageSystem => 'Idioma do sistema';

  @override
  String get appVersion => 'Versão';

  @override
  String get whatsNew => 'Novidades';

  @override
  String get themeTitle => 'Tema';

  @override
  String get themeLight => 'Claro';

  @override
  String get themeDark => 'Escuro';

  @override
  String get themeSystem => 'Automático';

  @override
  String collaboratingOrganizations(Object count) {
    return '$count organizações colaboradoras';
  }

  @override
  String myObservations(Object count) {
    return 'As minhas Observações ($count)';
  }

  @override
  String myOrganizations(Object count) {
    return 'As minhas Organizações ($count)';
  }

  @override
  String get timeAgoMoment => 'Há um momento';

  @override
  String timeAgoMinutes(Object minutes) {
    return 'Há $minutes min';
  }

  @override
  String timeAgoHours(Object hours) {
    return 'Há ${hours}h';
  }

  @override
  String timeAgoDays(Object days) {
    return 'Há ${days}d';
  }

  @override
  String timeAgoWeeks(Object weeks) {
    return 'Há $weeks sem';
  }

  @override
  String timeAgoMonths(Object months) {
    return 'Há $months mês';
  }

  @override
  String timeAgoMonthsPlural(Object months) {
    return 'Há $months meses';
  }

  @override
  String timeAgoYears(Object years) {
    return 'Há $years ano';
  }

  @override
  String timeAgoYearsPlural(Object years) {
    return 'Há $years anos';
  }

  @override
  String get roleMember => 'Membro';

  @override
  String get roleAdministrator => 'Administrador';

  @override
  String get leave => 'Sair';

  @override
  String get leaveOrganization => 'Sair da organização';

  @override
  String get leaveOrganizationConfirm =>
      'Tem a certeza de que quer sair desta organização?';

  @override
  String get leftOrganization => 'Saiu da organização';

  @override
  String get leaveOrganizationError => 'Erro ao sair da organização';

  @override
  String get inviteMember => 'Convidar membro';

  @override
  String get sendInvitation => 'Enviar convite';

  @override
  String get enterValidEmail => 'Por favor insira um email válido';

  @override
  String get deleteOrganizationQuestion => 'Eliminar organização?';

  @override
  String get deleteOrganizationConfirm => 'Esta ação não pode ser desfeita.';

  @override
  String get deleteOrganizationError => 'Erro ao eliminar a organização';

  @override
  String get errorLoadingOrganization =>
      'Não foi possível carregar a organização';

  @override
  String get errorLoadingProfile => 'Erro ao carregar o perfil';

  @override
  String get gettingLocation => 'A obter localização...';

  @override
  String get locationServicesDisabled =>
      'Os serviços de localização estão desativados';

  @override
  String get locationPermissionDenied => 'Permissão de localização negada';

  @override
  String get locationPermissionDeniedPermanently =>
      'As permissões de localização estão permanentemente negadas';

  @override
  String errorGettingLocation(Object error) {
    return 'Erro ao obter a localização: $error';
  }

  @override
  String get centerOnMap => 'Centrar no mapa';

  @override
  String get selectImage => 'Selecionar imagem';

  @override
  String get takePhoto => 'Tirar foto';

  @override
  String get chooseFromGallery => 'Escolher da galeria';

  @override
  String get addImage => 'Adicionar imagem';

  @override
  String get tapToChangeImage => 'Toque para alterar imagem';

  @override
  String get tapToAddCoverImage => 'Toque para adicionar imagem de capa';

  @override
  String selectLowercase(Object label) {
    return 'Selecione $label';
  }

  @override
  String get selectTopics => 'Selecionar Temas';

  @override
  String get privateProject => 'Projeto privado';

  @override
  String get privateProjectSubtitle => 'Requer palavra-passe para aderir';

  @override
  String get privateDatabase => 'Base de dados privada';

  @override
  String get privateDatabaseSubtitle => 'Os dados não podem ser descarregados';

  @override
  String get privateProjectsRequirePassword =>
      'Os projetos privados requerem palavra-passe';

  @override
  String get saveBasicInfo => 'Guardar informação básica';

  @override
  String get saveBasicInfoSubtitle => 'Nome, descrição, privacidade, etc.';

  @override
  String get editFormFields => 'Editar campos do formulário';

  @override
  String get editFormFieldsSubtitle => 'Adicionar, editar ou eliminar campos';

  @override
  String projectHasObservations(Object count) {
    return '⚠️ Este projeto tem $count observações';
  }

  @override
  String get addOption => 'Adicionar opção';

  @override
  String get cannotDeleteFieldWithObservations =>
      'Não é possível eliminar um campo que tem observações';

  @override
  String get noFieldTypesAvailable => 'Não há tipos de campo disponíveis';

  @override
  String get cannotChangeFieldTypeWithObservations =>
      'Não é possível alterar o tipo de um campo que tem observações';

  @override
  String get selectFieldType => 'Selecionar tipo de campo';

  @override
  String fieldMustHaveOptions(Object fieldName) {
    return 'O campo \"$fieldName\" do tipo CHOICE deve ter pelo menos uma opção';
  }

  @override
  String get jsonToSend => 'JSON a enviar';

  @override
  String get noChanges => 'Sem alterações';

  @override
  String get noChangesDetected =>
      'Não foram detetadas alterações nos campos do formulário.\\n\\nNão será enviado field_form ao backend.';

  @override
  String get cannotChangeRequiredWithObservations =>
      'Não é possível alterar o estado obrigatório de um campo que tem observações';

  @override
  String get newFieldsCannotBeRequiredWithObservations =>
      'Os campos novos não podem ser obrigatórios quando já existem observações';

  @override
  String get enterEmail => 'Por favor, insira um endereço de email';

  @override
  String get enterValidEmailFormat =>
      'Por favor, insira um endereço de email válido';

  @override
  String get updateInstitutionsError => 'Erro ao atualizar as instituições';

  @override
  String get institutionsUpdated => 'Instituições atualizadas com sucesso';

  @override
  String get confirmationMessageTitle => 'Mensagem de confirmação';

  @override
  String get showPostMessageLabel => 'Mostrar mensagem após a observação';

  @override
  String get insertLinkTitle => 'Inserir ligação';

  @override
  String get linkTextLabel => 'Texto da ligação';

  @override
  String get linkUrlLabel => 'URL';

  @override
  String get editTab => 'Editar';

  @override
  String get previewTab => 'Pré-visualizar';

  @override
  String get messageHint => 'Escreva a mensagem aqui...';

  @override
  String get messageEmptyPreview => 'Sem conteúdo para pré-visualizar';

  @override
  String get messageInfo =>
      'Esta mensagem aparecerá ao utilizador após adicionar uma observação';

  @override
  String get tooltipBold => 'Negrito';

  @override
  String get tooltipItalic => 'Itálico';

  @override
  String get tooltipLink => 'Ligação';

  @override
  String get tooltipList => 'Lista';

  @override
  String get addLanguageTitle => 'Adicionar idioma';

  @override
  String get translationLanguageLabel => 'Idioma de tradução';

  @override
  String get translationSelectLanguage => 'Selecione um idioma';

  @override
  String get translationSelectLanguageHint =>
      'Selecione um idioma para ver os campos a traduzir';

  @override
  String get translationDescriptionLabel => 'Descrição';

  @override
  String get translationPostMessageLabel => 'Mensagem pós-observação';

  @override
  String translationOptionLabel(Object key) {
    return 'Opção: \"$key\"';
  }

  @override
  String translationHint(Object lang) {
    return 'Tradução em $lang...';
  }

  @override
  String get translationSectionProject => 'Projeto';

  @override
  String get translationNameLabel => 'Nome';

  @override
  String get translationSectionQuestions => 'Perguntas do formulário';

  @override
  String translationQuestionHeader(int number) {
    return 'Pergunta $number';
  }

  @override
  String get translationQuestionTextLabel => 'Texto da pergunta';

  @override
  String get translationHelpTextLabel => 'Texto de ajuda';

  @override
  String get translationSectionOptions => 'OPÇÕES';

  @override
  String get skip => 'Saltar';

  @override
  String get update => 'Atualizar';

  @override
  String get create => 'Criar';

  @override
  String get projectNameLabel => 'Nome do projeto *';

  @override
  String get projectNameRequired => 'Por favor insira um nome';

  @override
  String get searchHint => 'Pesquisar...';

  @override
  String get selectOrganizationsDialog => 'Selecionar Organizações';

  @override
  String get topicsLabel => 'Temas';

  @override
  String get organizationsLabel => 'Organizações';

  @override
  String get globalLabel => 'Global';

  @override
  String get noTopicsAvailable => 'Não há temas disponíveis';

  @override
  String get selectTopicsAction => 'Selecionar temas';

  @override
  String get noOrganizationsAvailable => 'Não há organizações disponíveis';

  @override
  String get selectOrganizationsAction => 'Selecionar organizações';

  @override
  String get fuzzyGeoposition => 'Geoposição aproximada';

  @override
  String get fuzzyGeopositionSubtitle =>
      'As observações são mostradas como áreas aproximadas, não como pontos exatos';

  @override
  String get publicMap => 'Mapa público';

  @override
  String get publicMapSubtitle =>
      'Ativa uma página de mapa pública acessível sem login';

  @override
  String get projectPublished => 'Publicado';

  @override
  String get projectDraftSubtitle =>
      'O projeto está em rascunho. Precisa de pelo menos 10 observações para ser publicado.';

  @override
  String projectDraftSubtitleWithCount(int count) {
    return 'O projeto está em rascunho. Precisa de pelo menos 10 observações para ser publicado (atualmente tem $count).';
  }

  @override
  String get projectPublishedSubtitle =>
      'O projeto está publicado e visível para todos.';

  @override
  String get projectEnded => 'Encerrado';

  @override
  String get projectEndedSubtitle =>
      'O projeto não aceita mais novas observações';

  @override
  String get emailOnObservation => 'Email ao receber observação';

  @override
  String get emailOnObservationSubtitle =>
      'Receba um email cada vez que uma observação for enviada';

  @override
  String get coverImageRequired => 'A imagem de capa é obrigatória';

  @override
  String get organizationType => 'Tipo de organização';

  @override
  String get continueLabel => 'Continuar';

  @override
  String get optionLabelRequired => 'Texto *';

  @override
  String get optionLabelHint => 'Ex: Pouco preocupante';

  @override
  String get optionValueLabel => 'Valor (opcional)';

  @override
  String get optionValueHint => 'Ex: lc';

  @override
  String get optionsLabel => 'Opções';

  @override
  String get soonExpiry => 'Em breve';

  @override
  String get userFallback => 'Utilizador';

  @override
  String get retry => 'Tentar novamente';

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
  String get downloadCsv => 'Descarregar CSV';

  @override
  String get projectObservationsShare => 'Observações do projeto';

  @override
  String downloadErrorCode(Object code) {
    return 'Erro ao descarregar: $code';
  }

  @override
  String get csvDownloadError => 'Erro ao descarregar o CSV';

  @override
  String get noFieldFormError => 'Este projeto não tem formulário de campo';

  @override
  String get offlineDataDeleted => 'Dados offline eliminados';

  @override
  String offlineDownloadError(Object error) {
    return 'Erro ao descarregar: $error';
  }

  @override
  String get removeOfflineTooltip => 'Remover offline';

  @override
  String get makeOfflineTooltip => 'Disponibilizar offline';

  @override
  String get deleteAccountError => 'Erro ao eliminar a conta';

  @override
  String get myProfile => 'O meu Perfil';

  @override
  String get profileObservations => 'Observações';

  @override
  String get profileProjects => 'Projetos';

  @override
  String get profileOrganizationsLabel => 'Organizações';

  @override
  String createdProjectsCount(Object count) {
    return 'Projetos Criados ($count)';
  }

  @override
  String participatedProjectsCount(Object count) {
    return 'Projetos em que Participo ($count)';
  }

  @override
  String likedProjectsCount(Object count) {
    return 'Projetos que Gosto ($count)';
  }

  @override
  String get additionalData => 'Dados adicionais';

  @override
  String fieldLabelFallback(Object key) {
    return 'Campo $key';
  }

  @override
  String get boolYes => 'Sim';

  @override
  String get boolNo => 'Não';

  @override
  String get other => 'Outro';

  @override
  String get specify => 'Especifique...';

  @override
  String get noOptionsDefined => 'Sem opções definidas';

  @override
  String get backendDown => 'Servidor indisponível';

  @override
  String get noConnectionTitle => 'Sem ligação';

  @override
  String get backendDownMessage =>
      'O servidor não está a responder.\nPor favor contacte a Fundação Ibercivis.';

  @override
  String get noConnectionMessage =>
      'Por favor verifique a sua ligação à internet\ne tente novamente.';

  @override
  String get emailFieldLabel => 'Email';

  @override
  String get roleLabel => 'Função';

  @override
  String get inviteMemberHint => 'utilizador@exemplo.com';

  @override
  String get membersLabel => 'Membros';

  @override
  String get projectsLabel => 'Projetos';

  @override
  String get observationsInZone => 'Observações nesta zona';

  @override
  String get selectType => 'Selecionar tipo';

  @override
  String get more => 'Mais...';

  @override
  String get profileImageLabel => 'Imagem de perfil';

  @override
  String get coverImageLabel => 'Imagem de capa';

  @override
  String get noName => 'Sem nome';

  @override
  String get fieldNameHint => 'Nome do campo';

  @override
  String get noObservationMap => 'Este projeto não tem mapa de observações';

  @override
  String get observationZone => 'Zona de observações';

  @override
  String get helpTextHint => 'Texto de ajuda (opcional)';

  @override
  String get noOptionsAdded => 'Não há opções. Adicione pelo menos uma opção.';

  @override
  String get projectPasswordWrong => 'Palavra-passe incorreta.';

  @override
  String get privacyPolicy => 'Política de privacidade';

  @override
  String get deleteAccountWeb => 'Eliminar conta';

  @override
  String get consentTitle => 'Termos e privacidade';

  @override
  String get consentSubtitle =>
      'Para continuar, deves aceitar os nossos Termos de utilização e Política de privacidade.';

  @override
  String get consentTermsLabel => 'Termos de utilização';

  @override
  String get consentAcceptButton => 'Aceitar e continuar';

  @override
  String get consentError =>
      'Erro ao guardar o consentimento. Tenta novamente.';

  @override
  String get registerTermsAccept =>
      'Aceito os Termos de utilização e a Política de privacidade';

  @override
  String get registerTermsRequired =>
      'Deves aceitar os termos para te registares';
}
