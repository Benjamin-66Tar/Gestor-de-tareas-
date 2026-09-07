from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.core.cache import cache
from django.http import Http404
from .models import ElementoAura
from .serializers import ElementoAuraSerializer

class ElementoAuraListAPI(APIView):
    def get(self, request):
        # Capa de Rendimiento Ultra Rápido: Caché vía Redis (con claves dinámicas por filtro)
        start_date_str = request.query_params.get('start_date')
        end_date_str = request.query_params.get('end_date')
        
        if start_date_str or end_date_str:
            cache_key = f"elementos_aura_{start_date_str}_{end_date_str}"
        else:
            cache_key = "elementos_aura_all"
            
        datos_en_cache = cache.get(cache_key)
        if datos_en_cache:
            return Response(datos_en_cache, status=status.HTTP_200_OK)
            
        elementos = ElementoAura.objects.all()
        
        from django.utils.dateparse import parse_datetime
        if start_date_str:
            start_date = parse_datetime(start_date_str)
            if start_date:
                elementos = elementos.filter(fecha_limite__gte=start_date)
        if end_date_str:
            end_date = parse_datetime(end_date_str)
            if end_date:
                elementos = elementos.filter(fecha_limite__lte=end_date)
                
        serializer = ElementoAuraSerializer(elementos, many=True)
        
        # Guardar en caché por 60 segundos
        cache.set(cache_key, serializer.data, timeout=60)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request):
        serializer = ElementoAuraSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            cache.clear() # Invalida toda la caché ante cambios
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class ElementoAuraDetailAPI(APIView):
    def get_object(self, pk):
        try:
            return ElementoAura.objects.get(pk=pk)
        except ElementoAura.DoesNotExist:
            raise Http404

    def get(self, request, pk):
        elemento = self.get_object(pk)
        serializer = ElementoAuraSerializer(elemento)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def put(self, request, pk):
        elemento = self.get_object(pk)
        serializer = ElementoAuraSerializer(elemento, data=request.data)
        if serializer.is_valid():
            serializer.save()
            cache.clear() # Invalida toda la caché ante cambios
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def patch(self, request, pk):
        elemento = self.get_object(pk)
        serializer = ElementoAuraSerializer(elemento, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            cache.clear() # Invalida toda la caché ante cambios
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        elemento = self.get_object(pk)
        elemento.delete()
        cache.clear() # Invalida toda la caché ante cambios
        return Response(status=status.HTTP_204_NO_CONTENT)


# --- User Profile API ---

class UserProfileAPI(APIView):
    def get(self, request):
        user = request.user if request.user.is_authenticated else None
        profile = None
        if user:
            from .models import UserProfile
            profile = UserProfile.objects.filter(user=user).first()
        if not profile:
            from .models import UserProfile
            profile = UserProfile.objects.first()
            if not profile:
                profile = UserProfile.objects.create(theme_preference='dark')
        from .serializers import UserProfileSerializer
        serializer = UserProfileSerializer(profile)
        return Response(serializer.data, status=status.HTTP_200_OK)


# --- Notification APIs ---

class NotificationUnreadCountAPI(APIView):
    def get(self, request):
        from .models import Notification
        qs = Notification.objects.all()
        if request.user.is_authenticated:
            qs = qs.filter(user=request.user)
        unread_count = qs.filter(is_read=False).count()
        return Response({"unread_count": unread_count}, status=status.HTTP_200_OK)


class NotificationListAPI(APIView):
    def get(self, request):
        from .models import Notification
        from .serializers import NotificationSerializer
        qs = Notification.objects.all()
        if request.user.is_authenticated:
            qs = qs.filter(user=request.user)
        serializer = NotificationSerializer(qs[:20], many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


class NotificationMarkReadAPI(APIView):
    def post(self, request, pk):
        from .models import Notification
        try:
            notif = Notification.objects.get(pk=pk)
            notif.is_read = True
            notif.save(update_fields=['is_read'])
            return Response({"id": str(notif.id), "is_read": True}, status=status.HTTP_200_OK)
        except Notification.DoesNotExist:
            return Response({"detail": "Notification not found."}, status=status.HTTP_404_NOT_FOUND)


# --- Goal & Milestone APIs ---

class GoalListCreateAPI(APIView):
    def get(self, request):
        from .models import Goal
        from .serializers import GoalSerializer
        qs = Goal.objects.prefetch_related('milestones').all()
        if request.user.is_authenticated:
            qs = qs.filter(user=request.user)
        status_param = request.query_params.get('status')
        if status_param and status_param != 'ALL':
            qs = qs.filter(status=status_param)
        category_param = request.query_params.get('category')
        if category_param and category_param != 'ALL':
            qs = qs.filter(category=category_param)
        search_param = request.query_params.get('search')
        if search_param:
            qs = qs.filter(title__icontains=search_param)

        serializer = GoalSerializer(qs, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request):
        from .serializers import GoalSerializer
        from .services import calculate_goal_progress
        serializer = GoalSerializer(data=request.data)
        if serializer.is_valid():
            user = request.user if request.user.is_authenticated else None
            goal = serializer.save(user=user)
            if goal.progress_mode == 'MILESTONES':
                calculate_goal_progress(goal)
            return Response(GoalSerializer(goal).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class GoalDetailAPI(APIView):
    def get_object(self, pk):
        from .models import Goal
        try:
            return Goal.objects.prefetch_related('milestones').get(pk=pk)
        except Goal.DoesNotExist:
            raise Http404

    def get(self, request, pk):
        from .serializers import GoalSerializer
        goal = self.get_object(pk)
        return Response(GoalSerializer(goal).data, status=status.HTTP_200_OK)

    def put(self, request, pk):
        from .serializers import GoalSerializer
        from .services import calculate_goal_progress
        goal = self.get_object(pk)
        serializer = GoalSerializer(goal, data=request.data)
        if serializer.is_valid():
            updated_goal = serializer.save()
            if updated_goal.progress_mode == 'MILESTONES':
                calculate_goal_progress(updated_goal)
            return Response(GoalSerializer(updated_goal).data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def patch(self, request, pk):
        from .serializers import GoalSerializer
        from .services import calculate_goal_progress
        goal = self.get_object(pk)
        serializer = GoalSerializer(goal, data=request.data, partial=True)
        if serializer.is_valid():
            updated_goal = serializer.save()
            if updated_goal.progress_mode == 'MILESTONES':
                calculate_goal_progress(updated_goal)
            return Response(GoalSerializer(updated_goal).data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        goal = self.get_object(pk)
        goal.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class GoalMilestoneToggleAPI(APIView):
    def post(self, request, goal_id, milestone_id):
        from .services import toggle_milestone_completion
        try:
            milestone, goal = toggle_milestone_completion(milestone_id)
            return Response({
                "milestone_id": str(milestone.id),
                "is_completed": milestone.is_completed,
                "goal_progress_percentage": goal.progress_percentage,
                "goal_status": goal.status,
            }, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)


# --- Calendar Sync API ---

class CalendarEventsAPI(APIView):
    def get(self, request):
        from .services import sync_all_to_calendar
        from django.utils.dateparse import parse_datetime
        start_date_str = request.query_params.get('start_date')
        end_date_str = request.query_params.get('end_date')
        start_date = parse_datetime(start_date_str) if start_date_str else None
        end_date = parse_datetime(end_date_str) if end_date_str else None

        events = sync_all_to_calendar(user=request.user, start_date=start_date, end_date=end_date)
        return Response(events, status=status.HTTP_200_OK)


# --- Projects & Tasks API ---

class ProjectListCreateAPI(APIView):
    def get(self, request):
        from .models import Project
        from .serializers import ProjectSerializer

        projects = Project.objects.all()
        if request.user.is_authenticated:
            projects = projects.filter(user=request.user)

        status_param = request.query_params.get('status')
        if status_param and status_param != 'ALL':
            projects = projects.filter(status=status_param)

        search_query = request.query_params.get('search')
        if search_query:
            from django.db.models import Q
            projects = projects.filter(Q(title__icontains=search_query) | Q(description__icontains=search_query))

        serializer = ProjectSerializer(projects, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request):
        from .serializers import ProjectSerializer
        data = request.data.copy()
        if request.user.is_authenticated and 'user' not in data:
            data['user'] = request.user.id
        serializer = ProjectSerializer(data=data)
        if serializer.is_valid():
            project = serializer.save()
            return Response(ProjectSerializer(project).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class ProjectDetailAPI(APIView):
    def get_object(self, pk):
        from .models import Project
        try:
            return Project.objects.get(pk=pk)
        except Project.DoesNotExist:
            raise Http404

    def get(self, request, pk):
        from .serializers import ProjectSerializer
        project = self.get_object(pk)
        serializer = ProjectSerializer(project)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def put(self, request, pk):
        from .serializers import ProjectSerializer
        project = self.get_object(pk)
        serializer = ProjectSerializer(project, data=request.data)
        if serializer.is_valid():
            updated = serializer.save()
            return Response(ProjectSerializer(updated).data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def patch(self, request, pk):
        from .serializers import ProjectSerializer
        project = self.get_object(pk)
        serializer = ProjectSerializer(project, data=request.data, partial=True)
        if serializer.is_valid():
            updated = serializer.save()
            return Response(ProjectSerializer(updated).data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        project = self.get_object(pk)
        project.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class ProjectTaskListCreateAPI(APIView):
    def get(self, request, project_id):
        from .models import ProjectTask
        from .serializers import ProjectTaskSerializer
        tasks = ProjectTask.objects.filter(project_id=project_id)
        serializer = ProjectTaskSerializer(tasks, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request, project_id):
        from .models import Project
        from .serializers import ProjectTaskSerializer
        from .services import calculate_project_progress
        try:
            project = Project.objects.get(pk=project_id)
        except Project.DoesNotExist:
            raise Http404

        data = request.data.copy()
        data['project'] = str(project.id)
        serializer = ProjectTaskSerializer(data=data)
        if serializer.is_valid():
            task = serializer.save()
            calculate_project_progress(project)
            return Response(ProjectTaskSerializer(task).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class ProjectTaskDetailAPI(APIView):
    def get_object(self, pk):
        from .models import ProjectTask
        try:
            return ProjectTask.objects.get(pk=pk)
        except ProjectTask.DoesNotExist:
            raise Http404

    def get(self, request, pk):
        from .serializers import ProjectTaskSerializer
        task = self.get_object(pk)
        serializer = ProjectTaskSerializer(task)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def patch(self, request, pk):
        from .serializers import ProjectTaskSerializer
        from .services import calculate_project_progress
        task = self.get_object(pk)
        serializer = ProjectTaskSerializer(task, data=request.data, partial=True)
        if serializer.is_valid():
            updated = serializer.save()
            calculate_project_progress(updated.project)
            return Response(ProjectTaskSerializer(updated).data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        from .services import calculate_project_progress
        task = self.get_object(pk)
        project = task.project
        task.delete()
        calculate_project_progress(project)
        return Response(status=status.HTTP_204_NO_CONTENT)


class ProjectTaskStatusAPI(APIView):
    def patch(self, request, pk):
        from .services import update_project_task_status
        from .serializers import ProjectTaskSerializer
        new_status = request.data.get('status')
        if not new_status or new_status not in ['TODO', 'IN_PROGRESS', 'DONE']:
            return Response({'error': 'Invalid status. Must be TODO, IN_PROGRESS, or DONE.'}, status=status.HTTP_400_BAD_REQUEST)
        try:
            task = update_project_task_status(pk, new_status)
            return Response({
                'task': ProjectTaskSerializer(task).data,
                'project_progress_percentage': task.project.progress_percentage,
                'project_status': task.project.status
            }, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


class TaskSubtaskToggleAPI(APIView):
    def patch(self, request, pk):
        from .models import TaskSubtask
        from .serializers import TaskSubtaskSerializer
        try:
            subtask = TaskSubtask.objects.get(pk=pk)
            subtask.is_completed = not subtask.is_completed
            subtask.save(update_fields=['is_completed'])
            return Response(TaskSubtaskSerializer(subtask).data, status=status.HTTP_200_OK)
        except TaskSubtask.DoesNotExist:
            raise Http404


