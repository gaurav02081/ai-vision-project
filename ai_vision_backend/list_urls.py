"""List all URL patterns (recursively) for the Django project.
Run this from the project root inside the virtualenv: python list_urls.py
"""
import os
import django
from django.urls import get_resolver

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'ai_vision_backend.settings')
django.setup()

resolver = get_resolver()

seen = set()

def walk(patterns, prefix=''):
    for p in patterns:
        try:
            pattern = p.pattern
            if hasattr(pattern, 'describe'):
                pat = prefix + str(pattern)
            else:
                pat = prefix + str(pattern)
        except Exception:
            pat = prefix + repr(p)
        # view name
        try:
            name = getattr(p, 'name', '')
        except Exception:
            name = ''
        print(pat, ' -> ', name)
        # recurse
        try:
            sub = getattr(p, 'url_patterns', None) or getattr(p, 'patterns', None)
            if sub:
                walk(sub, prefix=prefix)
        except Exception:
            pass

walk(resolver.url_patterns)
print('\nFinished')
