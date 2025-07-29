from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

from core.views import CustomAuthToken
from core.views import CustomAuthToken, RegisterView, VerifyOTPView, ValidateTokenView


urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('core.urls')),
    path('api/auth/token/', CustomAuthToken.as_view(), name='auth-token'),
    path('api/auth/register/', RegisterView.as_view(), name='auth-register'),
    path('api/auth/verify-otp/', VerifyOTPView.as_view(), name='auth-verify-otp'),
    path('api/auth/validate-token/', ValidateTokenView.as_view(), name='auth-validate-token'),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)