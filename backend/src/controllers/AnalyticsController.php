<?php

namespace App\Controllers;

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use App\Services\TemporalAnalysisService;
use App\Services\CommunityDetectionService;
use App\Services\MeetingAnalysisService;
use App\Services\PredictiveAnalyticsService;
use App\Services\BenchmarkingService;
use App\Services\BatchProcessingService;
use App\Services\ADGroupService;
use App\Services\ExportService;
use App\Services\GamificationService;

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

    public function getActivityHeatmap(Request $request, Response $response): Response
    {
        $service = new TemporalAnalysisService($this->db);
        $params = $request->getQueryParams();
        
        $data = $service->getActivityHeatmap(
            $params['actor_id'] ?? null,
            $params['start_date'] ?? null,
            $params['end_date'] ?? null
        );

        $response->getBody()->write(json_encode($data));
        return $response->withHeader('Content-Type', 'application/json');
    }

    public function getOverloadedUsers(Request $request, Response $response): Response
    {
        $service = new TemporalAnalysisService($this->db);
        $params = $request->getQueryParams();
        
        $data = $service->getOverloadedUsers($params['risk_level'] ?? null);

        $response->getBody()->write(json_encode($data));
        return $response->withHeader('Content-Type', 'application/json');
    }

    public function getResponseTimeAnalysis(Request $request, Response $response): Response
    {
        $service = new TemporalAnalysisService($this->db);
        $params = $request->getQueryParams();
        
        $data = $service->getResponseTimeAnalysis($params['department'] ?? null);

        $response->getBody()->write(json_encode($data));
        return $response->withHeader('Content-Type', 'application/json');
    }

    public function getTimezoneCollaboration(Request $request, Response $response): Response
    {
        $service = new TemporalAnalysisService($this->db);
        $data = $service->getTimezoneCollaboration();

        $response->getBody()->write(json_encode($data));
        return $response->withHeader('Content-Type', 'application/json');
    }

    public function calculateTemporalMetrics(Request $request, Response $response): Response
    {
        $service = new TemporalAnalysisService($this->db);
        
        $heatmapCount = $service->calculateActivityHeatmap();
        $overloadCount = $service->calculateOverloadMetrics();

        $result = [
            'success' => true,
            'heatmap_records' => $heatmapCount,
            'overload_records' => $overloadCount
        ];

        $response->getBody()->write(json_encode($result));
        return $response->withHeader('Content-Type', 'application/json');
    }

    // ========================================================================
    // COMMUNITY DETECTION ENDPOINTS
    // ========================================================================

    public function detectCommunities(Request $request, Response $response): Response
    {
        $service = new CommunityDetectionService($this->db);
        $communities = $service->detectCommunities();

        $response->getBody()->write(json_encode($communities));
        return $response->withHeader('Content-Type', 'application/json');
    }

    public function getCommunities(Request $request, Response $response): Response
    {
        $service = new CommunityDetectionService($this->db);
        $communities = $service->getCommunities();

        $response->getBody()->write(json_encode($communities));
        return $response->withHeader('Content-Type', 'application/json');
    }

    public function getSilos(Request $request, Response $response): Response
    {
        $service = new CommunityDetectionService($this->db);
        $params = $request->getQueryParams();
        
        $silos = $service->getSilos($params['risk_level'] ?? null);

        $response->getBody()->write(json_encode($silos));
        return $response->withHeader('Content-Type', 'application/json');
    }

    public function detectSilos(Request $request, Response $response): Response
    {
        $service = new CommunityDetectionService($this->db);
        $silos = $service->detectSilos();

        $response->getBody()->write(json_encode($silos));
        return $response->withHeader('Content-Type', 'application/json');
    }

    public function getBridges(Request $request, Response $response): Response
    {
        $service = new CommunityDetectionService($this->db);
        $params = $request->getQueryParams();
        
        $bridges = $service->getBridges($params['limit'] ?? 20);

        $response->getBody()->write(json_encode($bridges));
        return $response->withHeader('Content-Type', 'application/json');
    }

    public function detectBridges(Request $request, Response $response): Response
    {
        $service = new CommunityDetectionService($this->db);
        $bridges = $service->detectBridges();

        $response->getBody()->write(json_encode($bridges));
        return $response->withHeader('Content-Type', 'application/json');
    }

    public function getNetworkDiversity(Request $request, Response $response): Response
    {
        $service = new CommunityDetectionService($this->db);
        $diversity = $service->getNetworkDiversity();

        $response->getBody()->write(json_encode($diversity));
        return $response->withHeader('Content-Type', 'application/json');
    }

    // ========================================================================
    // MEETING ANALYSIS ENDPOINTS
    // ========================================================================

    public function getMeetingEfficiency(Request $request, Response $response): Response
    {
        $service = new MeetingAnalysisService($this->db);
        $params = $request->getQueryParams();
        
        $data = $service->getMeetingEfficiency(
            $params['organizer_id'] ?? null,
            $params['min_score'] ?? null
        );

        $response->getBody()->write(json_encode($data));
        return $response->withHeader('Content-Type', 'application/json');
    }

    public function getMeetingCosts(Request $request, Response $response): Response
    {
        $service = new MeetingAnalysisService($this->db);
        $params = $request->getQueryParams();
        
        $data = $service->getMeetingCosts($params['group_by'] ?? 'organizer');

        $response->getBody()->write(json_encode($data));
        return $response->withHeader('Content-Type', 'application/json');
    }

    public function getMeetingRecommendations(Request $request, Response $response): Response
    {
        $service = new MeetingAnalysisService($this->db);
        $params = $request->getQueryParams();
        
        $data = $service->getRecommendations($params['type'] ?? null);

        $response->getBody()->write(json_encode($data));
        return $response->withHeader('Content-Type', 'application/json');
    }

    public function calculateMeetingMetrics(Request $request, Response $response): Response
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

        $response->getBody()->write(json_encode($result));
        return $response->withHeader('Content-Type', 'application/json');
    }

    // ========================================================================
    // PREDICTIVE ANALYTICS ENDPOINTS
    // ========================================================================

    public function getChurnRisk(Request $request, Response $response): Response
    {
        $service = new PredictiveAnalyticsService($this->db);
        $params = $request->getQueryParams();
        
        $data = $service->getChurnRisk($params['risk_level'] ?? null);

        $response->getBody()->write(json_encode($data));
        return $response->withHeader('Content-Type', 'application/json');
    }

    public function getBurnoutIndicators(Request $request, Response $response): Response
    {
        $service = new PredictiveAnalyticsService($this->db);
        $params = $request->getQueryParams();
        
        $data = $service->getBurnoutIndicators($params['risk_level'] ?? null);

        $response->getBody()->write(json_encode($data));
        return $response->withHeader('Content-Type', 'application/json');
    }

    public function getIsolationAlerts(Request $request, Response $response): Response
    {
        $service = new PredictiveAnalyticsService($this->db);
        $params = $request->getQueryParams();
        
        $data = $service->getIsolationAlerts($params['alert_level'] ?? null);

        $response->getBody()->write(json_encode($data));
        return $response->withHeader('Content-Type', 'application/json');
    }

    public function calculatePredictiveMetrics(Request $request, Response $response): Response
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

        $response->getBody()->write(json_encode($result));
        return $response->withHeader('Content-Type', 'application/json');
    }

    // ========================================================================
    // BENCHMARKING ENDPOINTS
    // ========================================================================

    public function getDepartmentBenchmarks(Request $request, Response $response): Response
    {
        $service = new BenchmarkingService($this->db);
        $params = $request->getQueryParams();
        
        $data = $service->getDepartmentBenchmarks(
            $params['department'] ?? null,
            $params['metric_name'] ?? null
        );

        $response->getBody()->write(json_encode($data));
        return $response->withHeader('Content-Type', 'application/json');
    }

    public function getRankings(Request $request, Response $response): Response
    {
        $service = new BenchmarkingService($this->db);
        $params = $request->getQueryParams();
        
        $data = $service->getRankings(
            $params['ranking_type'] ?? 'top_collaborators',
            $params['limit'] ?? 20
        );

        $response->getBody()->write(json_encode($data));
        return $response->withHeader('Content-Type', 'application/json');
    }

    public function calculateBenchmarks(Request $request, Response $response): Response
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

        $response->getBody()->write(json_encode($result));
        return $response->withHeader('Content-Type', 'application/json');
    }

    // ========================================================================
    // EXPORT ENDPOINTS
    // ========================================================================

    public function exportData(Request $request, Response $response): Response
    {
        $service = new ExportService($this->db);
        $params = $request->getQueryParams();
        
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

        $response->getBody()->write(json_encode($badges));
        return $response->withHeader('Content-Type', 'application/json');
    }

    public function getConnectionSuggestions(Request $request, Response $response, array $args): Response
    {
        $service = new GamificationService($this->db);
        $actorId = (int) $args['actor_id'];
        $params = $request->getQueryParams();
        
        $suggestions = $service->getConnectionSuggestions($actorId, $params['status'] ?? 'pending');

        $response->getBody()->write(json_encode($suggestions));
        return $response->withHeader('Content-Type', 'application/json');
    }

    public function getUserGoals(Request $request, Response $response, array $args): Response
    {
        $service = new GamificationService($this->db);
        $actorId = (int) $args['actor_id'];
        $params = $request->getQueryParams();
        
        $goals = $service->getUserGoals($actorId, $params['status'] ?? 'active');

        $response->getBody()->write(json_encode($goals));
        return $response->withHeader('Content-Type', 'application/json');
    }

    // ========================================================================
    // BATCH PROCESSING & AD GROUPS ENDPOINTS
    // ========================================================================

    public function getBatchJobs(Request $request, Response $response): Response
    {
        $service = new BatchProcessingService($this->db);
        $params = $request->getQueryParams();
        
        $jobs = $service->getBatchJobs($params['status'] ?? null);

        $response->getBody()->write(json_encode($jobs));
        return $response->withHeader('Content-Type', 'application/json');
    }

    public function getADGroups(Request $request, Response $response): Response
    {
        $service = new ADGroupService($this->db);
        $params = $request->getQueryParams();
        
        $groups = $service->getADGroups($params['is_enabled'] ?? null);

        $response->getBody()->write(json_encode($groups));
        return $response->withHeader('Content-Type', 'application/json');
    }

    public function getExtractionScopes(Request $request, Response $response): Response
    {
        $service = new ADGroupService($this->db);
        $params = $request->getQueryParams();
        
        $scopes = $service->getExtractionScopes($params['is_active'] ?? null);

        $response->getBody()->write(json_encode($scopes));
        return $response->withHeader('Content-Type', 'application/json');
    }

    public function createExtractionScope(Request $request, Response $response): Response
    {
        $service = new ADGroupService($this->db);
        $body = json_decode($request->getBody()->getContents(), true);
        
        $scopeId = $service->createExtractionScope($body);

        $result = ['success' => true, 'scope_id' => $scopeId];
        $response->getBody()->write(json_encode($result));
        return $response->withHeader('Content-Type', 'application/json');
    }
}
