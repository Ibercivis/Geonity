from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from field_forms.models import FieldForm, Question
from .serializers import FieldFormSerializer, QuestionSerializer

class FieldFormListCreate(generics.ListCreateAPIView):
    queryset = FieldForm.objects.all()
    serializer_class = FieldFormSerializer
    permission_classes = [IsAuthenticated]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class FieldFormRetrieveDestroy(generics.RetrieveDestroyAPIView):
    queryset = FieldForm.objects.all()
    serializer_class = FieldFormSerializer
    permission_classes = [IsAuthenticated]

    def delete(self, request, *args, **kwargs):
        instance = self.get_object()
        instance.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

class QuestionListCreate(generics.ListCreateAPIView):
    queryset = Question.objects.all()
    serializer_class = QuestionSerializer
    permission_classes = [IsAuthenticated]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class QuestionRetrieveUpdateDestroy(generics.RetrieveUpdateDestroyAPIView):
    queryset = Question.objects.all()
    serializer_class = QuestionSerializer
    permission_classes = [IsAuthenticated]

    def update(self, request, *args, **kwargs):
        instance = self.get_object()
        new_answer_type = request.data.get('answer_type')
        if new_answer_type and new_answer_type != instance.answer_type:
            if instance.field_form.observations.exists():
                return Response(
                    {'answer_type': f'No se puede cambiar el tipo de la pregunta "{instance.question_text}" porque el formulario ya tiene observaciones.'},
                    status=status.HTTP_400_BAD_REQUEST
                )
        serializer = self.get_serializer(instance, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class QuestionTypesView(APIView):
    def get(self, request):
        question_types = [
            {"value": code, "label": label}
            for code, label in Question.QUESTION_TYPES
        ]
        return Response(question_types)
