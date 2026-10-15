from django.contrib.auth import authenticate
from django.contrib.auth.models import User
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError
from django.utils import timezone
from rest_framework.authtoken.models import Token
from rest_framework.decorators import api_view, authentication_classes, permission_classes, throttle_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.throttling import AnonRateThrottle

from .models import Profile
from .permissions import IsAdminRole, is_admin


class LoginThrottle(AnonRateThrottle):
    scope = "login"


def user_payload(u):
    p = getattr(u, "profile", None)
    name = f"{u.first_name} {u.last_name}".strip() or u.username
    return {
        "id": u.id, "username": u.username, "first_name": u.first_name, "last_name": u.last_name,
        "name": name, "email": u.email, "active": u.is_active,
        "role": "ADMIN" if is_admin(u) else "AGENT",
        "agent": p.agent_id if p else None,
    }


@api_view(["POST"])
@authentication_classes([])
@permission_classes([AllowAny])
@throttle_classes([LoginThrottle])
def login(request):
    u = authenticate(username=str(request.data.get("username", "")).strip(), password=request.data.get("password", ""))
    if not u:
        return Response({"detail": "Identifiant ou mot de passe incorrect."}, status=401)
    token, _ = Token.objects.get_or_create(user=u)
    Token.objects.filter(pk=token.pk).update(created=timezone.now())
    return Response({"token": token.key, "user": user_payload(u)})


@api_view(["POST"])
def logout(request):
    Token.objects.filter(user=request.user).delete()
    return Response({"ok": True})


@api_view(["GET"])
def meta(request):
    """Sert aussi de « battement » pour prolonger la session."""
    return Response({"user": user_payload(request.user)})


def _apply(u, data, creating=False):
    errors = {}
    for k in ("first_name", "last_name", "email"):
        if k in data:
            setattr(u, k, str(data[k] or "").strip())
    pw = data.get("password")
    if pw:
        try:
            validate_password(pw, u)
            u.set_password(pw)
        except ValidationError as e:
            errors["password"] = " ".join(e.messages)
    elif creating:
        errors["password"] = "Mot de passe requis."
    return errors


@api_view(["GET", "POST"])
@permission_classes([IsAdminRole])
def users(request):
    if request.method == "POST":
        d = request.data
        name = str(d.get("username", "")).strip()
        role = d.get("role", "AGENT")
        if not name:
            return Response({"detail": "Identifiant requis."}, status=400)
        if role not in ("ADMIN", "AGENT"):
            return Response({"detail": "Rôle invalide."}, status=400)
        if User.objects.filter(username__iexact=name).exists():
            return Response({"detail": "Cet identifiant existe déjà."}, status=400)
        u = User(username=name)
        errs = _apply(u, d, creating=True)
        if errs:
            return Response({"detail": errs["password"]}, status=400)
        u.save()
        Profile.objects.create(user=u, role=role, agent_id=d.get("agent") or None)
    qs = User.objects.select_related("profile").order_by("username")
    return Response([user_payload(u) for u in qs])


@api_view(["PATCH", "DELETE"])
@permission_classes([IsAdminRole])
def user_detail(request, pk):
    try:
        u = User.objects.select_related("profile").get(pk=pk)
    except User.DoesNotExist:
        return Response({"detail": "Introuvable."}, status=404)
    if u.pk == request.user.pk:
        if request.method == "DELETE":
            return Response({"detail": "Vous ne pouvez pas supprimer votre propre compte."}, status=400)
        if request.data.get("active") is False or request.data.get("role") == "AGENT":
            return Response({"detail": "Vous ne pouvez pas retirer vos propres droits."}, status=400)
    if request.method == "DELETE":
        u.delete()
        return Response({"ok": True})
    d = request.data
    errs = _apply(u, d)
    if errs:
        return Response({"detail": errs["password"]}, status=400)
    if "active" in d:
        u.is_active = bool(d["active"])
    u.save()
    p, _ = Profile.objects.get_or_create(user=u)
    if d.get("role") in ("ADMIN", "AGENT"):
        p.role = d["role"]
    if "agent" in d:
        p.agent_id = d["agent"] or None
    p.save()
    if not u.is_active or d.get("password"):
        Token.objects.filter(user=u).delete()  # coupe les sessions ouvertes
    return Response(user_payload(User.objects.select_related("profile").get(pk=pk)))
