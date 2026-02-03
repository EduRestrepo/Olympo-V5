<?php

namespace Olympus\Controllers;

use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpFoundation\Request;
use Olympus\Services\TemporalAnalysisService;
use Olympus\Services\CommunityDetectionService;
use Olympus\Services\MeetingAnalysisService;
use Olympus\Services\PredictiveAnalyticsService;
use Olympus\Services\BenchmarkingService;
use Olympus\Services\BatchProcessingService;
use Olympus\Services\ADGroupService;
use Olympus\Services\ExportService;
use Olympus\Services\GamificationService;
use Olympus\Services\MetricService;

class AnalyticsController
{
    private $db;

    public function __construct($db)
    {
        $this->db = $db;
    }

    public function getSystemStatus(Request $request)
    {
        $repo = new \Olympus\Db\SettingRepository();
        $status = [
            'status' => $repo->getByKey('ingestion_status', 'Idle'),
            'progress' => (int)$repo->getByKey('ingestion_progress', 0),
            'message' => $repo->getByKey('ingestion_message', ''),
            'last_run' => $repo->getByKey('ingestion_last_run', null)
        ];
        return new \Symfony\Component\HttpFoundation\JsonResponse($status);
    }

    // ========================================================================
    // TEMPORAL ANALYSIS ENDPOINTS
    // ========================================================================

    public function getActivityHeatmap(Request $request)
    {
        $service = new TemporalAnalysisService($this->db);
        $params = $request->query->all();
        
        $data = $service->getActivityHeatmap(
            $params['actor_id'] ?? null,
            $params['start_date'] ?? null,
            $params['end_date'] ?? null
        );

        return new \Symfony\Component\HttpFoundation\JsonResponse($data);
    }

    public function getOverloadedUsers(Request $request)
    {
        $service = new TemporalAnalysisService($this->db);
        $params = $request->query->all();
        
        $data = $service->getOverloadedUsers($params['risk_level'] ?? null);

        return new \Symfony\Component\HttpFoundation\JsonResponse($data);
    }

    public function getResponseTimeAnalysis(Request $request)
    {
        $service = new TemporalAnalysisService($this->db);
        $params = $request->query->all();
        
        $data = $service->getResponseTimeAnalysis($params['department'] ?? null);

        return new \Symfony\Component\HttpFoundation\JsonResponse($data);
    }

    public function getTimezoneCollaboration(Request $request)
    {
        $service = new TemporalAnalysisService($this->db);
        $data = $service->getTimezoneCollaboration();

        return new \Symfony\Component\HttpFoundation\JsonResponse($data);
    }

    public function calculateTemporalMetrics(Request $request)
    {
        $service = new TemporalAnalysisService($this->db);
        $metricService = new MetricService();
        
        try {
            // Updated: Use MetricService for Heatmap (Activity Breakdown)
            $metricService->calculateActivityHeatmap();
            $heatmapCount = 1; // Service returns void, assume success

            $overloadCount = $service->calculateOverloadMetrics();
            $responseTimeCount = $service->calculateResponseTimeMetrics();
            $timezoneCount = $service->calculateTimezoneMetrics();

            $result = [
                'success' => true,
                'heatmap_records' => $heatmapCount,
                'overload_records' => $overloadCount,
                'response_time_records' => $responseTimeCount,
                'timezone_records' => $timezoneCount
            ];
        } catch (\Exception $e) {
            error_log("Error in calculateTemporalMetrics: " . $e->getMessage());
            error_log("Trace: " . $e->getTraceAsString());
            $result = [
                'success' => false,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ];
            return new \Symfony\Component\HttpFoundation\JsonResponse($result, 500);
        }

        return new \Symfony\Component\HttpFoundation\JsonResponse($result);
    }

    // ========================================================================
    // COMMUNITY DETECTION ENDPOINTS
    // ========================================================================

    public function detectCommunities(Request $request)
    {
        $service = new CommunityDetectionService($this->db);
        $communities = $service->detectCommunities();

        return new \Symfony\Component\HttpFoundation\JsonResponse($communities);
    }

    public function getCommunities(Request $request)
    {
        $service = new CommunityDetectionService($this->db);
        $communities = $service->getCommunities();

        return new \Symfony\Component\HttpFoundation\JsonResponse($communities);
    }

    public function getSilos(Request $request)
    {
        $service = new CommunityDetectionService($this->db);
        $params = $request->query->all();
        
        $silos = $service->getSilos($params['risk_level'] ?? null);

        return new \Symfony\Component\HttpFoundation\JsonResponse($silos);
    }

    public function detectSilos(Request $request)
    {
        $service = new CommunityDetectionService($this->db);
        $silos = $service->detectSilos();

        return new \Symfony\Component\HttpFoundation\JsonResponse($silos);
    }

    public function getBridges(Request $request)
    {
        $service = new CommunityDetectionService($this->db);
        $params = $request->query->all();
        
        $bridges = $service->getBridges($params['limit'] ?? 20);

        return new \Symfony\Component\HttpFoundation\JsonResponse($bridges);
    }

    public function detectBridges(Request $request)
    {
        $service = new CommunityDetectionService($this->db);
        $bridges = $service->detectBridges();

        return new \Symfony\Component\HttpFoundation\JsonResponse($bridges);
    }

    public function getNetworkDiversity(Request $request)
    {
        $service = new CommunityDetectionService($this->db);
        $diversity = $service->getNetworkDiversity();

        return new \Symfony\Component\HttpFoundation\JsonResponse($diversity);
    }

    public function calculateCommunityMetrics(Request $request)
    {
        $service = new CommunityDetectionService($this->db);
        $metricService = new MetricService();
        
        // Refresh influence links from interactions before detection
        $metricService->refreshInfluenceLinks();
        
        $communitiesCount = count($service->detectCommunities());
        $silosCount = count($service->detectSilos());
        $bridgesCount = count($service->detectBridges());

        $result = [
            'success' => true,
            'communities_found' => $communitiesCount,
            'silos_detected' => $silosCount,
            'bridges_detected' => $bridgesCount
        ];

        return new \Symfony\Component\HttpFoundation\JsonResponse($result);
    }

    // ========================================================================
    // MEETING ANALYSIS ENDPOINTS
    // ========================================================================

    public function getMeetingEfficiency(Request $request)
    {
        $service = new MeetingAnalysisService($this->db);
        $params = $request->query->all();
        
        $data = $service->getMeetingEfficiency(
            $params['organizer_id'] ?? null,
            $params['min_score'] ?? null
        );

        return new \Symfony\Component\HttpFoundation\JsonResponse($data);
    }

    public function getMeetingCosts(Request $request)
    {
        $service = new MeetingAnalysisService($this->db);
        $params = $request->query->all();
        
        $data = $service->getMeetingCosts($params['group_by'] ?? 'organizer');

        return new \Symfony\Component\HttpFoundation\JsonResponse($data);
    }

    public function getMeetingRecommendations(Request $request)
    {
        $service = new MeetingAnalysisService($this->db);
        $params = $request->query->all();
        
        $data = $service->getRecommendations($params['type'] ?? null);

        return new \Symfony\Component\HttpFoundation\JsonResponse($data);
    }

    public function calculateMeetingMetrics(Request $request)
    {
        $service = new MeetingAnalysisService($this->db);
        
        try {
            $efficiencyCount = $service->calculateMeetingEfficiency();
            $attendanceCount = $service->calculateAttendancePatterns();
            $recommendationsCount = $service->generateRecommendations();

            $result = [
                'success' => true,
                'efficiency_records' => $efficiencyCount,
                'attendance_records' => $attendanceCount,
                'recommendations' => $recommendationsCount
            ];
        } catch (\Exception $e) {
            error_log("Error in calculateMeetingMetrics: " . $e->getMessage());
            $result = [
                'success' => false,
                'error' => $e->getMessage()
            ];
            return new \Symfony\Component\HttpFoundation\JsonResponse($result, 500);
        }

        return new \Symfony\Component\HttpFoundation\JsonResponse($result);
    }

    // ========================================================================
    // PREDICTIVE ANALYTICS ENDPOINTS
    // ========================================================================

    public function getChurnRisk(Request $request)
    {
        try {
            $service = new PredictiveAnalyticsService($this->db);
            $params = $request->query->all();
            
            $data = $service->getChurnRisk($params['risk_level'] ?? null); // Method call
    
            return new \Symfony\Component\HttpFoundation\JsonResponse($data);
        } catch (\Exception $e) {
            error_log("Error in getChurnRisk: " . $e->getMessage());
            return new \Symfony\Component\HttpFoundation\JsonResponse(['error' => $e->getMessage()], 500);
        }
    }

    public function getBurnoutIndicators(Request $request)
    {
        try {
            $service = new PredictiveAnalyticsService($this->db);
            $params = $request->query->all();
            
            $data = $service->getBurnoutIndicators($params['risk_level'] ?? null);
    
            return new \Symfony\Component\HttpFoundation\JsonResponse($data);
        } catch (\Exception $e) {
            error_log("Error in getBurnoutIndicators: " . $e->getMessage());
            return new \Symfony\Component\HttpFoundation\JsonResponse(['error' => $e->getMessage()], 500);
        }
    }

    public function getIsolationAlerts(Request $request)
    {
        try {
            $service = new PredictiveAnalyticsService($this->db);
            $params = $request->query->all();
            
            $data = $service->getIsolationAlerts($params['alert_level'] ?? null);
    
            return new \Symfony\Component\HttpFoundation\JsonResponse($data);
        } catch (\Exception $e) {
            error_log("Error in getIsolationAlerts: " . $e->getMessage());
            return new \Symfony\Component\HttpFoundation\JsonResponse(['error' => $e->getMessage()], 500);
        }
    }

    public function calculatePredictiveMetrics(Request $request)
    {
        $service = new PredictiveAnalyticsService($this->db);
        
        try {
            $churnCount = $service->calculateChurnRisk();
            $burnoutCount = $service->calculateBurnoutIndicators();
            $isolationCount = $service->calculateIsolationAlerts();

            $result = [
                'success' => true,
                'churn_records' => $churnCount,
                'burnout_records' => $burnoutCount,
                'isolation_records' => $isolationCount
            ];
        } catch (\Exception $e) {
            error_log("Error in calculatePredictiveMetrics: " . $e->getMessage());
            $result = [
                'success' => false,
                'error' => $e->getMessage()
            ];
            return new \Symfony\Component\HttpFoundation\JsonResponse($result, 500);
        }

        return new \Symfony\Component\HttpFoundation\JsonResponse($result);
    }

    // ========================================================================
    // BENCHMARKING ENDPOINTS
    // ========================================================================

    public function getDepartmentBenchmarks(Request $request)
    {
        $service = new BenchmarkingService($this->db);
        $params = $request->query->all();
        
        $data = $service->getDepartmentBenchmarks(
            $params['department'] ?? null,
            $params['metric_name'] ?? null
        );

        return new \Symfony\Component\HttpFoundation\JsonResponse($data);
    }

    public function getRankings(Request $request)
    {
        $service = new BenchmarkingService($this->db);
        $params = $request->query->all();
        
        $data = $service->getRankings(
            $params['ranking_type'] ?? 'top_collaborators',
            $params['limit'] ?? 20
        );

        return new \Symfony\Component\HttpFoundation\JsonResponse($data);
    }

    public function calculateBenchmarks(Request $request)
    {
        $service = new BenchmarkingService($this->db);
        
        try {
            $benchmarkCount = $service->calculateDepartmentBenchmarks();
            $service->createTemporalSnapshot();
            $rankingCount = $service->calculateRankings();

            $result = [
                'success' => true,
                'benchmark_records' => $benchmarkCount,
                'ranking_records' => $rankingCount
            ];
        } catch (\Exception $e) {
            error_log("Error in calculateBenchmarks: " . $e->getMessage());
            $result = [
                'success' => false,
                'error' => $e->getMessage()
            ];
            return new \Symfony\Component\HttpFoundation\JsonResponse($result, 500);
        }

        return new \Symfony\Component\HttpFoundation\JsonResponse($result);
    }

    // ========================================================================
    // EXPORT ENDPOINTS
    // ========================================================================

    public function exportData(Request $request)
    {
        $service = new ExportService($this->db);
        $params = $request->query->all();
        
        $exportType = $params['type'] ?? 'actors';
        $filters = $params['filters'] ?? [];

        $result = $service->exportToCSV($exportType, $filters);

        $response = new Response($result['data']);
        $response->headers->set('Content-Type', 'text/csv');
        $response->headers->set('Content-Disposition', 'attachment; filename="' . $result['filename'] . '"');
        
        return $response;
    }

    // ========================================================================
    // GAMIFICATION ENDPOINTS
    // ========================================================================

    public function getUserBadges(Request $request, Response $response, array $args): Response
    {
        $service = new GamificationService($this->db);
        $actorId = (int) $args['actor_id'];
        
        $badges = $service->getUserBadges($actorId);

        return new \Symfony\Component\HttpFoundation\JsonResponse($badges);
    }

    public function getConnectionSuggestions(Request $request, Response $response, array $args): Response
    {
        $service = new GamificationService($this->db);
        $actorId = (int) $args['actor_id'];
        $params = $request->query->all();
        
        $suggestions = $service->getConnectionSuggestions($actorId, $params['status'] ?? 'pending');

        return new \Symfony\Component\HttpFoundation\JsonResponse($suggestions);
    }

    public function getUserGoals(Request $request, Response $response, array $args): Response
    {
        $service = new GamificationService($this->db);
        $actorId = (int) $args['actor_id'];
        $params = $request->query->all();
        
        $goals = $service->getUserGoals($actorId, $params['status'] ?? 'active');

        return new \Symfony\Component\HttpFoundation\JsonResponse($goals);
    }

    // ========================================================================
    // BATCH PROCESSING & AD GROUPS ENDPOINTS
    // ========================================================================

    public function getBatchJobs(Request $request)
    {
        $service = new BatchProcessingService($this->db);
        $params = $request->query->all();
        
        $jobs = $service->getBatchJobs($params['status'] ?? null);

        return new \Symfony\Component\HttpFoundation\JsonResponse($jobs);
    }

    public function getADGroups(Request $request)
    {
        $service = new ADGroupService($this->db);
        $params = $request->query->all();
        
        $groups = $service->getADGroups($params['is_enabled'] ?? null);

        return new \Symfony\Component\HttpFoundation\JsonResponse($groups);
    }

    public function getExtractionScopes(Request $request)
    {
        $service = new ADGroupService($this->db);
        $params = $request->query->all();
        
        $scopes = $service->getExtractionScopes($params['is_active'] ?? null);

        return new \Symfony\Component\HttpFoundation\JsonResponse($scopes);
    }

    public function createExtractionScope(Request $request)
    {
        $service = new ADGroupService($this->db);
        $body = json_decode($request->getBody()->getContents(), true);
        
        $scopeId = $service->createExtractionScope($body);

        $result = ['success' => true, 'scope_id' => $scopeId];
        return new \Symfony\Component\HttpFoundation\JsonResponse($result);
    }
}
