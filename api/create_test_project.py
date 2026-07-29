"""
Script temporal para crear proyecto de prueba con 10 campos de texto y 40.000 observaciones.
Ejecutar con: python manage.py shell < create_test_project.py
"""
import os, django, random, string
from datetime import datetime, timedelta

# --- Setup ---
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'citsci-api.settings')

from django.contrib.auth.models import User
from django.utils import timezone
from django.contrib.gis.geos import Point
from project.models import Project
from field_forms.models import FieldForm, Question
from markers.models import Observation

# 1. Buscar usuario
email = 'frasanz@ibercivis.es'
try:
    user = User.objects.get(email=email)
    print(f"[OK] Usuario encontrado: {user.username} (id={user.id})")
except User.DoesNotExist:
    print(f"[ERROR] No se encontró ningún usuario con email {email}")
    raise SystemExit(1)

# 2. Crear proyecto
project = Project.objects.create(
    creator=user,
    name="Proyecto de prueba - 40k observaciones",
    description={"es": "Proyecto temporal para pruebas de rendimiento con 40.000 observaciones."},
    is_private=False,
    draft=False,
    is_global=True,
    post_observation_message={"es": "Gracias por tu observación."},
)
project.administrators.add(user)
print(f"[OK] Proyecto creado: id={project.id}, name='{project.name}'")

# 3. Crear FieldForm
field_form = FieldForm.objects.create(project=project)
print(f"[OK] FieldForm creado: id={field_form.id}")

# 4. Crear 10 preguntas de tipo texto
field_names = [
    "Nombre del lugar",
    "Descripción",
    "Observador",
    "Comentarios",
    "Condiciones ambientales",
    "Fuente de información",
    "Notas adicionales",
    "Estado del elemento",
    "Referencia bibliográfica",
    "Código de muestra",
]
questions = []
for i, name in enumerate(field_names):
    q = Question.objects.create(
        field_form=field_form,
        question_text={"es": name, "en": f"Field {i+1}"},
        question_help=None,
        answer_type=Question.STRING,
        mandatory=False,
        order=i,
    )
    questions.append(q)

print(f"[OK] 10 preguntas de tipo texto creadas")

# 5. Crear 40.000 observaciones en batches
def random_text(length=10):
    return ''.join(random.choices(string.ascii_lowercase + ' ', k=length))

BATCH_SIZE = 1000
TOTAL = 40000

# Bounding box: España aproximadamente
LON_MIN, LON_MAX = -9.3, 4.3
LAT_MIN, LAT_MAX = 35.9, 43.8

base_time = timezone.now() - timedelta(days=365)
obs_list = []

print(f"[...] Generando {TOTAL} observaciones en batches de {BATCH_SIZE}...")
for i in range(TOTAL):
    lon = random.uniform(LON_MIN, LON_MAX)
    lat = random.uniform(LAT_MIN, LAT_MAX)
    delta = timedelta(seconds=random.randint(0, 365 * 24 * 3600))
    data = {str(q.id): random_text(random.randint(5, 30)) for q in questions}
    obs_list.append(Observation(
        creator=user,
        field_form=field_form,
        timestamp=base_time + delta,
        geoposition=Point(lon, lat),  # estándar GeoJSON: Point(lon, lat)
        data=data,
        platform='web',
    ))
    if len(obs_list) == BATCH_SIZE:
        Observation.objects.bulk_create(obs_list)
        obs_list = []
        done = i + 1
        print(f"    {done}/{TOTAL} observaciones creadas...")

if obs_list:
    Observation.objects.bulk_create(obs_list)

total_obs = Observation.objects.filter(field_form=field_form).count()
print(f"[OK] Total observaciones en BD: {total_obs}")
print(f"\n=== RESUMEN ===")
print(f"  Proyecto id : {project.id}")
print(f"  FieldForm id: {field_form.id}")
print(f"  Observaciones: {total_obs}")
print(f"\nPara borrar todo: Project.objects.get(id={project.id}).delete()")
