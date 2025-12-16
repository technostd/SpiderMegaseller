from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import (
    AnalyzeReviewView,
    AnalysisHistoryView,
    AnalysisDetailView,
    TestConnectionView,
    DirectApiTestView, ProcessOzonReviewsView, DemoAnalyzeView
)
from .views_ozon import (
    OzonTestConnectionView,
    OzonGetReviewsView,
    OzonCommentReviewView,
    OzonBatchCommentView
)
from .views_reviews import OzonReviewViewSet

router = DefaultRouter()
router.register(r'reviews', OzonReviewViewSet, basename='ozon-review')

urlpatterns = [
    # Yandex GPT endpoints
    path('test/', TestConnectionView.as_view(), name='test-connection'),
    path('direct-test/', DirectApiTestView.as_view(), name='direct-api-test'),
    path('analyze/', AnalyzeReviewView.as_view(), name='analyze-review'),
    path('demo/analyze/', DemoAnalyzeView.as_view(), name='demo-analyze'),
    path('history/', AnalysisHistoryView.as_view(), name='analysis-history'),
    path('history/<int:analysis_id>/', AnalysisDetailView.as_view(), name='analysis-detail'),

    # Ozon endpoints
    path('ozon/test/', OzonTestConnectionView.as_view(), name='ozon-test'),
    path('ozon/reviews/', OzonGetReviewsView.as_view(), name='ozon-reviews'),
    path('ozon/comment/', OzonCommentReviewView.as_view(), name='ozon-comment'),
    path('ozon/batch-comment/', OzonBatchCommentView.as_view(), name='ozon-batch-comment'),

    path('process-ozon/', ProcessOzonReviewsView.as_view(), name='process-ozon'),
    path('', include(router.urls)),
    ]

