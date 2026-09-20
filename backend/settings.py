import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent

SECRET_KEY = 'django-insecure-aura-secret-key-dev-only'

DEBUG = True

ALLOWED_HOSTS = ['*']

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'rest_framework',
    'corsheaders',
    'backend',
]

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'backend.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'backend.wsgi.application'

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': BASE_DIR / 'db.sqlite3',
    }
}

# Local Memory Cache for rapid development; can be switched to django-redis in production
CACHES = {
    'default': {
        'BACKEND': 'django.core.cache.backends.locmem.LocMemCache',
        'LOCATION': 'aura-local-cache',
    }
}

AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
]

LANGUAGE_CODE = 'es-es'
TIME_ZONE = 'UTC'
USE_I18N = True
USE_TZ = True

STATIC_URL = 'static/'

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

CORS_ALLOW_ALL_ORIGINS = True  # For dev purposes
OPENAI_API_KEY = os.environ.get('OPENAI_API_KEY', 'mock-key-if-not-set')

REST_FRAMEWORK = {
    'DEFAULT_RENDERER_CLASSES': [
        'rest_framework.renderers.JSONRenderer',
        'rest_framework.renderers.BrowsableAPIRenderer',
    ],
    'DEFAULT_PARSER_CLASSES': [
        'rest_framework.parsers.JSONParser',
    ],
}

# VAPID Web Push Configuration (RFC 8291 / RFC 8292)
VAPID_DIR = BASE_DIR / '.vapid'
VAPID_PRIVATE_KEY_PATH = VAPID_DIR / 'private_key.pem'
VAPID_PUBLIC_KEY_PATH = VAPID_DIR / 'public_key.txt'

if not VAPID_PRIVATE_KEY_PATH.exists() or not VAPID_PUBLIC_KEY_PATH.exists():
    try:
        import base64
        from py_vapid import Vapid
        from cryptography.hazmat.primitives import serialization
        VAPID_DIR.mkdir(parents=True, exist_ok=True)
        _v = Vapid()
        _v.generate_keys()
        _pub_bytes = _v.public_key.public_bytes(serialization.Encoding.X962, serialization.PublicFormat.UncompressedPoint)
        _pub_b64 = base64.urlsafe_b64encode(_pub_bytes).decode('utf-8').rstrip('=')
        _priv_pem = _v.private_key.private_bytes(serialization.Encoding.PEM, serialization.PrivateFormat.PKCS8, serialization.NoEncryption()).decode('utf-8')
        VAPID_PUBLIC_KEY_PATH.write_text(_pub_b64, encoding='utf-8')
        VAPID_PRIVATE_KEY_PATH.write_text(_priv_pem, encoding='utf-8')
    except Exception as e:
        # Fallback for environments where py_vapid might not be immediately available during migrations
        pass

if VAPID_PUBLIC_KEY_PATH.exists() and VAPID_PRIVATE_KEY_PATH.exists():
    VAPID_PUBLIC_KEY = VAPID_PUBLIC_KEY_PATH.read_text(encoding='utf-8').strip()
    VAPID_PRIVATE_KEY = str(VAPID_PRIVATE_KEY_PATH)
else:
    VAPID_PUBLIC_KEY = os.environ.get('VAPID_PUBLIC_KEY', 'mock-public-key')
    VAPID_PRIVATE_KEY = os.environ.get('VAPID_PRIVATE_KEY', 'mock-private-key')

VAPID_ADMIN_EMAIL = os.environ.get('VAPID_ADMIN_EMAIL', 'mailto:admin@aura.app')


