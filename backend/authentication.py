from rest_framework import authentication, exceptions
from django.core import signing
from django.contrib.auth.models import User

def create_user_token(user) -> str:
    """
    Generates a cryptographically signed token containing user identifiers.
    """
    return signing.dumps({'user_id': user.id, 'username': user.username})

def get_user_from_token(token: str):
    """
    Decodes and validates a signed token, returning the corresponding active User.
    Accepts raw token strings or tokens prefixed with 'Bearer ' or 'Token '.
    """
    if not token:
        return None
    try:
        clean_token = token.strip()
        if clean_token.lower().startswith('bearer '):
            clean_token = clean_token[7:].strip()
        elif clean_token.lower().startswith('token '):
            clean_token = clean_token[6:].strip()

        data = signing.loads(clean_token, max_age=60 * 60 * 24 * 30)  # 30 days validity
        user_id = data.get('user_id')
        if not user_id:
            return None
        return User.objects.filter(id=user_id, is_active=True).first()
    except Exception:
        return None

class SignedTokenAuthentication(authentication.BaseAuthentication):
    """
    Native Django REST Framework authentication scheme verifying signed tokens
    passed via the standard HTTP Authorization header:
    Authorization: Bearer <signed-token>
    """
    def authenticate(self, request):
        auth_header = request.headers.get('Authorization', '')
        if not auth_header:
            return None

        clean_header = auth_header.strip()
        if not (clean_header.lower().startswith('bearer ') or clean_header.lower().startswith('token ')):
            return None

        parts = clean_header.split()
        if len(parts) != 2:
            raise exceptions.AuthenticationFailed('Formato de cabecera Authorization inválido. Debe ser: Bearer <token>')

        token = parts[1]

        try:
            data = signing.loads(token, max_age=60 * 60 * 24 * 30)
        except signing.SignatureExpired:
            raise exceptions.AuthenticationFailed('El token ha expirado. Por favor inicie sesión nuevamente.')
        except signing.BadSignature:
            raise exceptions.AuthenticationFailed('Firma de token inválida o alterada.')
        except Exception:
            raise exceptions.AuthenticationFailed('Error al verificar las credenciales del token.')

        user_id = data.get('user_id')
        if not user_id:
            raise exceptions.AuthenticationFailed('Token inválido: payload sin identificador de usuario.')

        user = User.objects.filter(id=user_id, is_active=True).first()
        if not user:
            raise exceptions.AuthenticationFailed('El usuario asociado a este token no existe o está inactivo.')

        return (user, token)

    def authenticate_header(self, request):
        return 'Bearer realm="api"'
