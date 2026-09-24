from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.core.cache import cache
from django.http import Http404
from django.db.models import Q
from .models import ElementoAura
from .serializers import ElementoAuraSerializer
from .authentication import create_user_token, get_user_from_token


class ElementoAuraListAPI(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        # Capa de Rendimiento: Caché vía memoria local / Redis (con claves dinámicas por filtro)
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
                elementos = elementos.filter(
                    Q(fecha_limite__gte=start_date) |
                    (Q(fecha_limite__isnull=True) & Q(fecha_inicio__gte=start_date))
                )
        if end_date_str:
            end_date = parse_datetime(end_date_str)
            if end_date:
                elementos = elementos.filter(
                    Q(fecha_inicio__lte=end_date) |
                    (Q(fecha_inicio__isnull=True) & Q(fecha_limite__lte=end_date))
                )
                
        serializer = ElementoAuraSerializer(elementos, many=True)
        cache.set(cache_key, serializer.data, timeout=60)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request):
        serializer = ElementoAuraSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            cache.clear()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class ElementoAuraDetailAPI(APIView):
    permission_classes = [AllowAny]

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
            cache.clear()
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def patch(self, request, pk):
        elemento = self.get_object(pk)
        serializer = ElementoAuraSerializer(elemento, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            cache.clear()
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        elemento = self.get_object(pk)
        elemento.delete()
        cache.clear()
        return Response(status=status.HTTP_204_NO_CONTENT)


# --- User Profile API ---

class UserProfileAPI(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        from .models import UserProfile
        from .serializers import UserProfileSerializer
        profile, _ = UserProfile.objects.get_or_create(
            user=request.user,
            defaults={'theme_preference': 'dark'}
        )
        serializer = UserProfileSerializer(profile)
        return Response(serializer.data, status=status.HTTP_200_OK)


# --- Notification APIs ---

class NotificationUnreadCountAPI(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        from .models import Notification
        unread_count = Notification.objects.filter(user=request.user, is_read=False).count()
        return Response({"unread_count": unread_count}, status=status.HTTP_200_OK)


class NotificationListAPI(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        from .models import Notification
        from .serializers import NotificationSerializer
        qs = Notification.objects.filter(user=request.user)[:20]
        serializer = NotificationSerializer(qs, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


class NotificationMarkReadAPI(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        from .models import Notification
        try:
            notif = Notification.objects.get(pk=pk, user=request.user)
            notif.is_read = True
            notif.save(update_fields=['is_read'])
            return Response({"id": str(notif.id), "is_read": True}, status=status.HTTP_200_OK)
        except Notification.DoesNotExist:
            return Response({"detail": "Notification not found."}, status=status.HTTP_404_NOT_FOUND)


# --- Web Push Subscriptions & Alerts APIs ---

class VapidPublicKeyAPI(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        from django.conf import settings
        public_key = getattr(settings, 'VAPID_PUBLIC_KEY', '')
        return Response({"public_key": public_key}, status=status.HTTP_200_OK)


class PushSubscribeAPI(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        from .serializers import PushSubscriptionSerializer
        serializer = PushSubscriptionSerializer(data=request.data)
        if serializer.is_valid():
            sub = serializer.save(user=request.user)
            return Response(PushSubscriptionSerializer(sub).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class PushUnsubscribeAPI(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        from .models import PushSubscription
        endpoint = request.data.get('endpoint')
        if not endpoint:
            return Response({"error": "endpoint is required."}, status=status.HTTP_400_BAD_REQUEST)

        qs = PushSubscription.objects.filter(endpoint=endpoint, user=request.user)
        deleted_count, _ = qs.delete()
        return Response({"detail": "Subscription removed successfully.", "deleted_count": deleted_count}, status=status.HTTP_200_OK)


class PushTestDispatchAPI(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        from .services import send_web_push
        title = request.data.get('title', 'Aura: Notificación de prueba')
        message = request.data.get('message', 'Las notificaciones Web Push están funcionando correctamente.')
        url = request.data.get('url', '/#eventos')

        result = send_web_push(user=request.user, title=title, message=message, url=url)
        return Response(result, status=status.HTTP_200_OK)


# --- Goal & Milestone APIs ---

class GoalListCreateAPI(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        from .models import Goal
        from .serializers import GoalSerializer
        qs = Goal.objects.filter(user=request.user).prefetch_related('milestones')
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
            goal = serializer.save(user=request.user)
            if goal.progress_mode == 'MILESTONES':
                calculate_goal_progress(goal)
            return Response(GoalSerializer(goal).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class GoalDetailAPI(APIView):
    permission_classes = [IsAuthenticated]

    def get_object(self, pk, user):
        from .models import Goal
        try:
            return Goal.objects.prefetch_related('milestones').get(pk=pk, user=user)
        except Goal.DoesNotExist:
            raise Http404

    def get(self, request, pk):
        from .serializers import GoalSerializer
        goal = self.get_object(pk, request.user)
        return Response(GoalSerializer(goal).data, status=status.HTTP_200_OK)

    def put(self, request, pk):
        from .serializers import GoalSerializer
        from .services import calculate_goal_progress
        goal = self.get_object(pk, request.user)
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
        goal = self.get_object(pk, request.user)
        serializer = GoalSerializer(goal, data=request.data, partial=True)
        if serializer.is_valid():
            updated_goal = serializer.save()
            if updated_goal.progress_mode == 'MILESTONES':
                calculate_goal_progress(updated_goal)
            return Response(GoalSerializer(updated_goal).data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        goal = self.get_object(pk, request.user)
        goal.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class GoalMilestoneToggleAPI(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, goal_id, milestone_id):
        from .models import GoalMilestone
        from .services import toggle_milestone_completion
        try:
            milestone = GoalMilestone.objects.select_related('goal').get(
                id=milestone_id,
                goal_id=goal_id,
                goal__user=request.user
            )
        except GoalMilestone.DoesNotExist:
            raise Http404

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
    permission_classes = [IsAuthenticated]

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
    permission_classes = [IsAuthenticated]

    def get(self, request):
        from .models import Project
        from .serializers import ProjectSerializer
        from django.db.models import Count, Q

        projects = Project.objects.filter(user=request.user).annotate(
            annotated_total_tasks=Count('tasks', distinct=True),
            annotated_completed_tasks=Count('tasks', filter=Q(tasks__status='DONE'), distinct=True)
        ).select_related('goal').prefetch_related('tasks__subtasks')

        status_param = request.query_params.get('status')
        if status_param and status_param != 'ALL':
            projects = projects.filter(status=status_param)

        search_query = request.query_params.get('search')
        if search_query:
            projects = projects.filter(Q(title__icontains=search_query) | Q(description__icontains=search_query))

        serializer = ProjectSerializer(projects, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request):
        from .serializers import ProjectSerializer
        data = request.data.copy()
        serializer = ProjectSerializer(data=data)
        if serializer.is_valid():
            project = serializer.save(user=request.user)
            return Response(ProjectSerializer(project).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class ProjectDetailAPI(APIView):
    permission_classes = [IsAuthenticated]

    def get_object(self, pk, user):
        from .models import Project
        from django.db.models import Count, Q
        try:
            return Project.objects.filter(pk=pk, user=user).annotate(
                annotated_total_tasks=Count('tasks', distinct=True),
                annotated_completed_tasks=Count('tasks', filter=Q(tasks__status='DONE'), distinct=True)
            ).select_related('goal').prefetch_related('tasks__subtasks').get()
        except Project.DoesNotExist:
            raise Http404

    def get(self, request, pk):
        from .serializers import ProjectSerializer
        project = self.get_object(pk, request.user)
        serializer = ProjectSerializer(project)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def put(self, request, pk):
        from .serializers import ProjectSerializer
        project = self.get_object(pk, request.user)
        serializer = ProjectSerializer(project, data=request.data)
        if serializer.is_valid():
            updated = serializer.save()
            return Response(ProjectSerializer(updated).data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def patch(self, request, pk):
        from .serializers import ProjectSerializer
        project = self.get_object(pk, request.user)
        serializer = ProjectSerializer(project, data=request.data, partial=True)
        if serializer.is_valid():
            updated = serializer.save()
            return Response(ProjectSerializer(updated).data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        project = self.get_object(pk, request.user)
        project.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class ProjectTaskListCreateAPI(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, project_id):
        from .models import Project, ProjectTask
        from .serializers import ProjectTaskSerializer
        try:
            project = Project.objects.get(pk=project_id, user=request.user)
        except Project.DoesNotExist:
            raise Http404

        tasks = ProjectTask.objects.filter(project=project)
        serializer = ProjectTaskSerializer(tasks, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request, project_id):
        from .models import Project
        from .serializers import ProjectTaskSerializer
        from .services import calculate_project_progress
        try:
            project = Project.objects.get(pk=project_id, user=request.user)
        except Project.DoesNotExist:
            raise Http404

        data = request.data.copy()
        data['project'] = str(project.id)
        serializer = ProjectTaskSerializer(data=data)
        if serializer.is_valid():
            task = serializer.save(project=project)
            calculate_project_progress(project)
            return Response(ProjectTaskSerializer(task).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class ProjectTaskDetailAPI(APIView):
    permission_classes = [IsAuthenticated]

    def get_object(self, pk, user):
        from .models import ProjectTask
        try:
            return ProjectTask.objects.select_related('project').get(pk=pk, project__user=user)
        except ProjectTask.DoesNotExist:
            raise Http404

    def get(self, request, pk):
        from .serializers import ProjectTaskSerializer
        task = self.get_object(pk, request.user)
        serializer = ProjectTaskSerializer(task)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def patch(self, request, pk):
        from .serializers import ProjectTaskSerializer
        from .services import calculate_project_progress
        task = self.get_object(pk, request.user)
        serializer = ProjectTaskSerializer(task, data=request.data, partial=True)
        if serializer.is_valid():
            updated = serializer.save()
            calculate_project_progress(updated.project)
            return Response(ProjectTaskSerializer(updated).data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        from .services import calculate_project_progress
        task = self.get_object(pk, request.user)
        project = task.project
        task.delete()
        calculate_project_progress(project)
        return Response(status=status.HTTP_204_NO_CONTENT)


class ProjectTaskStatusAPI(APIView):
    permission_classes = [IsAuthenticated]

    def patch(self, request, pk):
        from .models import ProjectTask
        from .services import update_project_task_status
        from .serializers import ProjectTaskSerializer
        new_status = request.data.get('status')
        if not new_status or new_status not in ['TODO', 'IN_PROGRESS', 'DONE']:
            return Response({'error': 'Invalid status. Must be TODO, IN_PROGRESS, or DONE.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            ProjectTask.objects.select_related('project').get(pk=pk, project__user=request.user)
        except ProjectTask.DoesNotExist:
            raise Http404

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
    permission_classes = [IsAuthenticated]

    def patch(self, request, pk):
        from .models import TaskSubtask
        from .serializers import TaskSubtaskSerializer
        try:
            subtask = TaskSubtask.objects.select_related('task__project').get(pk=pk, task__project__user=request.user)
            subtask.is_completed = not subtask.is_completed
            subtask.save(update_fields=['is_completed'])
            return Response(TaskSubtaskSerializer(subtask).data, status=status.HTTP_200_OK)
        except TaskSubtask.DoesNotExist:
            raise Http404


# --- Events API ---

class EventListCreateAPI(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        from .models import EventItem
        from .serializers import EventItemSerializer
        from .services import check_approaching_event_reminders

        check_approaching_event_reminders(user=request.user)

        events = EventItem.objects.filter(user=request.user)

        status_param = request.query_params.get('status')
        if status_param and status_param != 'ALL':
            events = events.filter(status=status_param)

        category_param = request.query_params.get('category')
        if category_param and category_param != 'ALL':
            events = events.filter(category__iexact=category_param)

        search_query = request.query_params.get('search')
        if search_query:
            events = events.filter(
                Q(title__icontains=search_query) |
                Q(description__icontains=search_query) |
                Q(location__icontains=search_query)
            )

        serializer = EventItemSerializer(events, many=True)
        data = serializer.data

        time_block_param = request.query_params.get('time_block')
        if time_block_param and time_block_param != 'ALL':
            data = [item for item in data if item.get('time_block') == time_block_param]

        return Response(data, status=status.HTTP_200_OK)

    def post(self, request):
        from .serializers import EventItemSerializer
        serializer = EventItemSerializer(data=request.data)
        if serializer.is_valid():
            event = serializer.save(user=request.user)
            return Response(EventItemSerializer(event).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class EventDetailAPI(APIView):
    permission_classes = [IsAuthenticated]

    def get_object(self, pk, user):
        from .models import EventItem
        try:
            return EventItem.objects.get(pk=pk, user=user)
        except EventItem.DoesNotExist:
            raise Http404

    def get(self, request, pk):
        from .serializers import EventItemSerializer
        event = self.get_object(pk, request.user)
        return Response(EventItemSerializer(event).data, status=status.HTTP_200_OK)

    def put(self, request, pk):
        from .serializers import EventItemSerializer
        event = self.get_object(pk, request.user)
        serializer = EventItemSerializer(event, data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def patch(self, request, pk):
        from .serializers import EventItemSerializer
        event = self.get_object(pk, request.user)
        serializer = EventItemSerializer(event, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        event = self.get_object(pk, request.user)
        event.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class EventStatusAPI(APIView):
    permission_classes = [IsAuthenticated]

    def patch(self, request, pk):
        from .models import EventItem
        from .serializers import EventItemSerializer
        new_status = request.data.get('status')
        if not new_status or new_status not in ['PROGRAMMED', 'COMPLETED', 'CANCELED']:
            return Response({'error': 'Invalid status. Must be PROGRAMMED, COMPLETED, or CANCELED.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            event = EventItem.objects.get(pk=pk, user=request.user)
            event.status = new_status
            event.save(update_fields=['status', 'updated_at'])
            return Response(EventItemSerializer(event).data, status=status.HTTP_200_OK)
        except EventItem.DoesNotExist:
            raise Http404


# --- Authentication & Session APIs ---
from .serializers import UserRegisterSerializer, UserLoginSerializer, UserSessionSerializer
from .services import authenticate_user


class RegisterAPI(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = UserRegisterSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            token = create_user_token(user)
            return Response({
                'token': token,
                'user': UserSessionSerializer(user).data,
                'message': 'Cuenta creada con éxito.'
            }, status=status.HTTP_201_CREATED)
        # Format errors cleanly
        error_msg = "Error al registrar la cuenta."
        if serializer.errors:
            first_key = next(iter(serializer.errors))
            first_err = serializer.errors[first_key]
            error_msg = first_err[0] if isinstance(first_err, list) else str(first_err)
        return Response({'error': error_msg, 'details': serializer.errors}, status=status.HTTP_400_BAD_REQUEST)


class LoginAPI(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = UserLoginSerializer(data=request.data)
        if not serializer.is_valid():
            return Response({'error': 'Debe proporcionar identificador y contraseña.'}, status=status.HTTP_400_BAD_REQUEST)

        identifier = serializer.validated_data['identifier']
        password = serializer.validated_data['password']

        user = authenticate_user(identifier, password)
        if not user:
            return Response({
                'error': 'Credenciales inválidas. Por favor verifique sus datos.'
            }, status=status.HTTP_401_UNAUTHORIZED)

        token = create_user_token(user)
        return Response({
            'token': token,
            'user': UserSessionSerializer(user).data
        }, status=status.HTTP_200_OK)


class LogoutAPI(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        return Response({'detail': 'Sesión cerrada correctamente.'}, status=status.HTTP_200_OK)


class SessionAPI(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        user = request.user if request.user.is_authenticated else None
        if not user:
            auth_header = request.headers.get('Authorization', '')
            user = get_user_from_token(auth_header)

        if user:
            return Response({
                'is_authenticated': True,
                'user': UserSessionSerializer(user).data
            }, status=status.HTTP_200_OK)

        return Response({
            'is_authenticated': False,
            'user': None
        }, status=status.HTTP_200_OK)
