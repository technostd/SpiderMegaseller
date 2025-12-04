from django.urls import path
from .views import AnalyzeReviewView, AnalysisHistoryView, AnalysisDetailView, TestConnectionView, DirectApiTestView

urlpatterns = [
    path('test/', TestConnectionView.as_view(), name='test-connection'),
    path('direct-test/', DirectApiTestView.as_view(), name='direct-api-test'),
    path('analyze/', AnalyzeReviewView.as_view(), name='analyze-review'),
    path('history/', AnalysisHistoryView.as_view(), name='analysis-history'),
    path('history/<int:analysis_id>/', AnalysisDetailView.as_view(), name='analysis-detail'),
]