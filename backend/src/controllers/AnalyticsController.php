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

class AnalyticsController
{
    private $db;

    public function __construct($db)
    {
        $this->db = $db;
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
        
        $heatmapCount = $service->calculateActivityHeatmap();
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
        
        $efficiencyCount = $service->calculateMeetingEfficiency();
        $attendanceCount = $service->calculateAttendancePatterns();
        $recommendationsCount = $service->generateRecommendations();

        $result = [
            'success' => true,
            'efficiency_records' => $efficiencyCount,
            'attendance_records' => $attendanceCount,
            'recommendations' => $recommendationsCount
        ];

        return new \Symfony\Component\HttpFoundation\JsonResponse($result);
    }

    // ========================================================================
    // PREDICTIVE ANALYTICS ENDPOINTS
    // ========================================================================

    public function getChurnRisk(Request $request)
    {
        $service = new PredictiveAnalyticsService($this->db);
        $params = $request->query->all();
        
        $data = $service->getChurnRisk($params['risk_level'] ?? null);

        return new \Symfony\Component\HttpFoundation\JsonResponse($data);
    }

    public function getBurnoutIndicators(Request $request)
    {
        $service = new PredictiveAnalyticsService($this->db);
        $params = $request->query->all();
        
        $data = $service->getBurnoutIndicators($params['risk_level'] ?? null);

        return new \Symfony\Component\HttpFoundation\JsonResponse($data);
    }

    public function getIsolationAlerts(Request $request)
    {
        $service = new PredictiveAnalyticsService($this->db);
        $params = $request->query->all();
        
        $data = $service->getIsolationAlerts($params['alert_level'] ?? null);

        return new \Symfony\Component\HttpFoundation\JsonResponse($data);
    }

    public function calculatePredictiveMetrics(Request $request)
    {
        $service = new PredictiveAnalyticsService($this->db);
        
        $churnCount = $service->calculateChurnRisk();
        $burnoutCount = $service->calculateBurnoutIndicators();
        $isolationCount = $service->calculateIsolationAlerts();

        $result = [
            'success' => true,
            'churn_records' => $churnCount,
            'burnout_records' => $burnoutCount,
            'isolation_records' => $isolationCount
        ];

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
        
        $benchmarkCount = $service->calculateDepartmentBenchmarks();
        $service->createTemporalSnapshot();
        $rankingCount = $service->calculateRankings();

        $result = [
            'success' => true,
            'benchmark_records' => $benchmarkCount,
            'ranking_records' => $rankingCount
        ];

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

        $response->getBody()->write($result['data']);
        return $response
            ->withHeader('Content-Type', 'text/csv')
            ->withHeader('Content-Disposition', 'attachment; filename="' . $result['filename'] . '"');
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
