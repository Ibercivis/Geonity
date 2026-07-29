from django.db import migrations


TRANSLATIONS = {
    1:  {'es': 'Ecología y Medio Ambiente',                    'en': 'Ecology and Environment',              'fr': 'Écologie et Environnement',                  'pt': 'Ecologia e Meio Ambiente',                   'it': 'Ecologia e Ambiente',                        'de': 'Ökologie und Umwelt'},
    2:  {'es': 'Biodiversidad',                                'en': 'Biodiversity',                         'fr': 'Biodiversité',                               'pt': 'Biodiversidade',                             'it': 'Biodiversità',                               'de': 'Biodiversität'},
    3:  {'es': 'Educación',                                    'en': 'Education',                            'fr': 'Éducation',                                  'pt': 'Educação',                                   'it': 'Educazione',                                 'de': 'Bildung'},
    4:  {'es': 'Biología',                                     'en': 'Biology',                              'fr': 'Biologie',                                   'pt': 'Biologia',                                   'it': 'Biologia',                                   'de': 'Biologie'},
    5:  {'es': 'Ciencias Sociales',                            'en': 'Social Sciences',                      'fr': 'Sciences Sociales',                          'pt': 'Ciências Sociais',                           'it': 'Scienze Sociali',                            'de': 'Sozialwissenschaften'},
    6:  {'es': 'Clima y Meteorología',                         'en': 'Climate and Meteorology',              'fr': 'Climat et Météorologie',                     'pt': 'Clima e Meteorologia',                       'it': 'Clima e Meteorologia',                       'de': 'Klima und Meteorologie'},
    7:  {'es': 'Animales',                                     'en': 'Animals',                              'fr': 'Animaux',                                    'pt': 'Animais',                                    'it': 'Animali',                                    'de': 'Tiere'},
    8:  {'es': 'Salud y Medicina',                             'en': 'Health and Medicine',                  'fr': 'Santé et Médecine',                          'pt': 'Saúde e Medicina',                           'it': 'Salute e Medicina',                          'de': 'Gesundheit und Medizin'},
    9:  {'es': 'Agricultura',                                  'en': 'Agriculture',                          'fr': 'Agriculture',                                'pt': 'Agricultura',                                'it': 'Agricoltura',                                'de': 'Landwirtschaft'},
    10: {'es': 'Alimentación',                                 'en': 'Food',                                 'fr': 'Alimentation',                               'pt': 'Alimentação',                                'it': 'Alimentazione',                              'de': 'Ernährung'},
    11: {'es': 'Arqueología',                                  'en': 'Archaeology',                          'fr': 'Archéologie',                                'pt': 'Arqueologia',                                'it': 'Archeologia',                                'de': 'Archäologie'},
    12: {'es': 'Astronomía y Espacio',                         'en': 'Astronomy and Space',                  'fr': 'Astronomie et Espace',                       'pt': 'Astronomia e Espaço',                        'it': 'Astronomia e Spazio',                        'de': 'Astronomie und Weltraum'},
    13: {'es': 'Aves',                                         'en': 'Birds',                                'fr': 'Oiseaux',                                    'pt': 'Aves',                                       'it': 'Uccelli',                                    'de': 'Vögel'},
    14: {'es': 'Biogeografía',                                 'en': 'Biogeography',                         'fr': 'Biogéographie',                              'pt': 'Biogeografia',                                'it': 'Biogeografia',                               'de': 'Biogeographie'},
    15: {'es': 'Ciencias Políticas',                           'en': 'Political Sciences',                   'fr': 'Sciences Politiques',                        'pt': 'Ciências Políticas',                         'it': 'Scienze Politiche',                          'de': 'Politikwissenschaft'},
    16: {'es': 'Culturas Indígenas',                           'en': 'Indigenous Cultures',                  'fr': 'Cultures Indigènes',                         'pt': 'Culturas Indígenas',                         'it': 'Culture Indigene',                           'de': 'Indigene Kulturen'},
    17: {'es': 'Genética',                                     'en': 'Genetics',                             'fr': 'Génétique',                                  'pt': 'Genética',                                   'it': 'Genetica',                                   'de': 'Genetik'},
    18: {'es': 'Geografía',                                    'en': 'Geography',                            'fr': 'Géographie',                                 'pt': 'Geografia',                                  'it': 'Geografia',                                  'de': 'Geographie'},
    19: {'es': 'Geología y Ciencias de la Tierra',             'en': 'Geology and Earth Sciences',           'fr': 'Géologie et Sciences de la Terre',           'pt': 'Geologia e Ciências da Terra',               'it': 'Geologia e Scienze della Terra',             'de': 'Geologie und Erdwissenschaften'},
    20: {'es': 'Gestión de los Recursos Naturales',            'en': 'Natural Resource Management',          'fr': 'Gestion des Ressources Naturelles',          'pt': 'Gestão de Recursos Naturais',                'it': 'Gestione delle Risorse Naturali',            'de': 'Management natürlicher Ressourcen'},
    21: {'es': 'Información y Ciencias de la Computación',     'en': 'Information and Computer Sciences',    'fr': "Informatique et Sciences de l'Ordinateur",   'pt': 'Informação e Ciências da Computação',        'it': 'Informatica e Scienze del Computer',         'de': 'Informations- und Computerwissenschaften'},
    22: {'es': 'Insectos y Polinizadores',                     'en': 'Insects and Pollinators',              'fr': 'Insectes et Pollinisateurs',                 'pt': 'Insetos e Polinizadores',                    'it': 'Insetti e Impollinatori',                    'de': 'Insekten und Bestäuber'},
    23: {'es': 'Monitorización de Especies a Largo Plazo',     'en': 'Long-term Species Monitoring',         'fr': 'Surveillance des Espèces à Long Terme',      'pt': 'Monitoramento de Espécies a Longo Prazo',    'it': 'Monitoraggio delle Specie a Lungo Termine',  'de': 'Langzeit-Artenmonitoring'},
    24: {'es': 'Naturaleza y Aire Libre',                      'en': 'Nature and Outdoors',                  'fr': 'Nature et Plein Air',                        'pt': 'Natureza e Ar Livre',                        'it': 'Natura e Aria Aperta',                       'de': 'Natur und Outdoor'},
    25: {'es': 'Océano, Agua, Mar y Tierra',                   'en': 'Ocean, Water, Sea and Land',           'fr': 'Océan, Eau, Mer et Terre',                   'pt': 'Oceano, Água, Mar e Terra',                  'it': 'Oceano, Acqua, Mare e Terra',                'de': 'Ozean, Wasser, Meer und Land'},
    26: {'es': 'Física',                                       'en': 'Physics',                              'fr': 'Physique',                                   'pt': 'Física',                                     'it': 'Fisica',                                     'de': 'Physik'},
    27: {'es': 'Química',                                      'en': 'Chemistry',                            'fr': 'Chimie',                                     'pt': 'Química',                                    'it': 'Chimica',                                    'de': 'Chemie'},
    28: {'es': 'Sonido',                                       'en': 'Sound',                                'fr': 'Son',                                        'pt': 'Som',                                        'it': 'Suono',                                      'de': 'Klang'},
    29: {'es': 'Transporte',                                   'en': 'Transport',                            'fr': 'Transport',                                  'pt': 'Transporte',                                 'it': 'Trasporti',                                  'de': 'Transport'},
}


def translate_topics(apps, schema_editor):
    Topic = apps.get_model('project', 'Topic')
    for topic_id, translations in TRANSLATIONS.items():
        Topic.objects.filter(pk=topic_id).update(topic=translations)


def reverse_topics(apps, schema_editor):
    Topic = apps.get_model('project', 'Topic')
    for topic_id, translations in TRANSLATIONS.items():
        Topic.objects.filter(pk=topic_id).update(topic={'es': translations['es']})


class Migration(migrations.Migration):

    dependencies = [
        ('project', '0034_alter_projectinvitation_unique_together'),
    ]

    operations = [
        migrations.RunPython(translate_topics, reverse_topics),
    ]
