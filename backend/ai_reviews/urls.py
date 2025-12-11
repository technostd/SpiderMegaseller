from django.urls import path
from .views import (
    AnalyzeReviewView,
    AnalysisHistoryView,
    AnalysisDetailView,
    TestConnectionView,
    DirectApiTestView
)
from .views_ozon import (
    OzonTestConnectionView,
    OzonGetReviewsView,
    OzonCommentReviewView,
    OzonBatchCommentView
)
urlpatterns = [
    # Yandex GPT endpoints
    path('test/', TestConnectionView.as_view(), name='test-connection'),
    path('direct-test/', DirectApiTestView.as_view(), name='direct-api-test'),
    path('analyze/', AnalyzeReviewView.as_view(), name='analyze-review'),
    path('history/', AnalysisHistoryView.as_view(), name='analysis-history'),
    path('history/<int:analysis_id>/', AnalysisDetailView.as_view(), name='analysis-detail'),

    # Ozon endpoints
    path('ozon/test/', OzonTestConnectionView.as_view(), name='ozon-test'),
    path('ozon/reviews/', OzonGetReviewsView.as_view(), name='ozon-reviews'),
    path('ozon/comment/', OzonCommentReviewView.as_view(), name='ozon-comment'),
    path('ozon/batch-comment/', OzonBatchCommentView.as_view(), name='ozon-batch-comment'),
]

