<?php

namespace App\Services;

use PDO;

class PredictiveAnalyticsService
{
    private PDO $db;

    public function __construct(PDO $db)
    {
        $this->db = $db;
    }

    /**
     * Calculate churn risk scores for all actors
     * @return int Number of scores calculated
     */
    public function calculateChurnRisk(): int
    {
        $analysisDate = date('Y-m-d');

        $sql = "WITH current_metrics AS (
                    SELECT 
                        a.id as actor_id,
                        COUNT(DISTINCT i.id) as current_interactions,
                        COUNT(DISTINCT il.target_id) as current_network_size,
                        MAX(i.interaction_date) as last_interaction_date
                    FROM actors a
                    LEFT JOIN interactions i ON a.id = i.source_id 
                        AND i.interaction_date >= CURRENT_DATE - INTERVAL '30 days'
                    LEFT JOIN influence_links il ON a.id = il.source_id
                    GROUP BY a.id
                ),
                previous_metrics AS (
                    SELECT 
                        a.id as actor_id,
                        COUNT(DISTINCT i.id) as previous_interactions,
                        COUNT(DISTINCT il.target_id) as previous_network_size
                    FROM actors a
                    LEFT JOIN interactions i ON a.id = i.source_id 
                        AND i.interaction_date >= CURRENT_DATE - INTERVAL '60 days'
                        AND i.interaction_date < CURRENT_DATE - INTERVAL '30 days'
                    LEFT JOIN influence_links il ON a.id = il.source_id
                    GROUP BY a.id
                )
                INSERT INTO churn_risk_scores (
                    actor_id, risk_score, risk_level, communication_decline_pct, 
                    network_shrinkage_pct, engagement_drop, last_activity_days, analysis_date
                )
                SELECT 
                    cm.actor_id,
                    LEAST(100, GREATEST(0, 
                        (CASE WHEN pm.previous_interactions > 0 
                            THEN ((pm.previous_interactions - cm.current_interactions)::float / pm.previous_interactions * 100)
                            ELSE 0 END) * 0.4 +
                        (CASE WHEN pm.previous_network_size > 0
                            THEN ((pm.previous_network_size - cm.current_network_size)::float / pm.previous_network_size * 100)
                            ELSE 0 END) * 0.3 +
                        (CURRENT_DATE - COALESCE(cm.last_interaction_date, CURRENT_DATE - INTERVAL '90 days'))::int * 0.5
                    )) as risk_score,
                    CASE 
                        WHEN (CURRENT_DATE - COALESCE(cm.last_interaction_date, CURRENT_DATE - INTERVAL '90 days'))::int > 30 THEN 'high'
                        WHEN (CURRENT_DATE - COALESCE(cm.last_interaction_date, CURRENT_DATE - INTERVAL '90 days'))::int > 14 THEN 'medium'
                        ELSE 'low'
                    END as risk_level,
                    CASE WHEN pm.previous_interactions > 0 
                        THEN ((pm.previous_interactions - cm.current_interactions)::float / pm.previous_interactions * 100)
                        ELSE 0 END as communication_decline_pct,
                    CASE WHEN pm.previous_network_size > 0
                        THEN ((pm.previous_network_size - cm.current_network_size)::float / pm.previous_network_size * 100)
                        ELSE 0 END as network_shrinkage_pct,
                    (cm.current_interactions < pm.previous_interactions * 0.5) as engagement_drop,
                    (CURRENT_DATE - COALESCE(cm.last_interaction_date, CURRENT_DATE - INTERVAL '90 days'))::int as last_activity_days,
                    :analysis_date
                FROM current_metrics cm
                JOIN previous_metrics pm ON cm.actor_id = pm.actor_id
                ON CONFLICT (actor_id, analysis_date) DO UPDATE SET
                    risk_score = EXCLUDED.risk_score,
                    risk_level = EXCLUDED.risk_level,
                    communication_decline_pct = EXCLUDED.communication_decline_pct,
                    network_shrinkage_pct = EXCLUDED.network_shrinkage_pct,
                    engagement_drop = EXCLUDED.engagement_drop,
                    last_activity_days = EXCLUDED.last_activity_days";

        $stmt = $this->db->prepare($sql);
        $stmt->bindParam(':analysis_date', $analysisDate);
        $stmt->execute();

        return $stmt->rowCount();
    }

    /**
     * Get churn risk scores
     * @param string|null $riskLevel Filter by risk level
     * @return array Churn risk data
     */
    public function getChurnRisk(?string $riskLevel = null): array
    {
        $sql = "SELECT 
                    crs.actor_id,
                    a.name,
                    a.email,
                    a.department,
                    crs.risk_score,
                    crs.risk_level,
                    crs.communication_decline_pct,
                    crs.network_shrinkage_pct,
                    crs.engagement_drop,
                    crs.last_activity_days,
                    crs.analysis_date
                FROM churn_risk_scores crs
                JOIN actors a ON crs.actor_id = a.id
                WHERE crs.analysis_date = (SELECT MAX(analysis_date) FROM churn_risk_scores)";

        if ($riskLevel) {
            $sql .= " AND crs.risk_level = :risk_level";
        }

        $sql .= " ORDER BY crs.risk_score DESC";

        $stmt = $this->db->prepare($sql);
        if ($riskLevel) {
            $stmt->bindParam(':risk_level', $riskLevel);
        }
        $stmt->execute();

        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    /**
     * Calculate burnout indicators
     * @return int Number of indicators calculated
     */
    public function calculateBurnoutIndicators(): int
    {
        $analysisDate = date('Y-m-d');

        $sql = "WITH overload_history AS (
                    SELECT 
                        actor_id,
                        COUNT(CASE WHEN risk_level IN ('warning', 'critical') THEN 1 END) as overload_weeks,
                        AVG(total_meeting_hours) as avg_meeting_hours,
                        AVG(emails_sent + emails_received) as avg_emails
                    FROM overload_metrics
                    WHERE week_start_date >= CURRENT_DATE - INTERVAL '8 weeks'
                    GROUP BY actor_id
                )
                INSERT INTO burnout_indicators (
                    actor_id, burnout_score, risk_level, sustained_overload_weeks, 
                    off_hours_work_pct, response_time_increase_pct, analysis_date
                )
                SELECT 
                    oh.actor_id,
                    LEAST(100, 
                        (oh.overload_weeks * 15) +
                        (CASE WHEN oh.avg_meeting_hours > 20 THEN 30 ELSE 0 END) +
                        (CASE WHEN oh.avg_emails > 150 THEN 25 ELSE 0 END)
                    ) as burnout_score,
                    CASE 
                        WHEN oh.overload_weeks >= 4 THEN 'high'
                        WHEN oh.overload_weeks >= 2 THEN 'medium'
                        ELSE 'low'
                    END as risk_level,
                    oh.overload_weeks as sustained_overload_weeks,
                    0.0 as off_hours_work_pct, -- Placeholder
                    0.0 as response_time_increase_pct, -- Placeholder
                    :analysis_date
                FROM overload_history oh
                ON CONFLICT (actor_id, analysis_date) DO UPDATE SET
                    burnout_score = EXCLUDED.burnout_score,
                    risk_level = EXCLUDED.risk_level,
                    sustained_overload_weeks = EXCLUDED.sustained_overload_weeks";

        $stmt = $this->db->prepare($sql);
        $stmt->bindParam(':analysis_date', $analysisDate);
        $stmt->execute();

        return $stmt->rowCount();
    }

    /**
     * Get burnout indicators
     * @param string|null $riskLevel Filter by risk level
     * @return array Burnout data
     */
    public function getBurnoutIndicators(?string $riskLevel = null): array
    {
        $sql = "SELECT 
                    bi.actor_id,
                    a.name,
                    a.email,
                    a.department,
                    bi.burnout_score,
                    bi.risk_level,
                    bi.sustained_overload_weeks,
                    bi.off_hours_work_pct,
                    bi.weekend_activity_pct,
                    bi.response_time_increase_pct,
                    bi.analysis_date
                FROM burnout_indicators bi
                JOIN actors a ON bi.actor_id = a.id
                WHERE bi.analysis_date = (SELECT MAX(analysis_date) FROM burnout_indicators)";

        if ($riskLevel) {
            $sql .= " AND bi.risk_level = :risk_level";
        }

        $sql .= " ORDER BY bi.burnout_score DESC";

        $stmt = $this->db->prepare($sql);
        if ($riskLevel) {
            $stmt->bindParam(':risk_level', $riskLevel);
        }
        $stmt->execute();

        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    /**
     * Calculate isolation alerts
     * @return int Number of alerts calculated
     */
    public function calculateIsolationAlerts(): int
    {
        $analysisDate = date('Y-m-d');

        $sql = "WITH connection_metrics AS (
                    SELECT 
                        a.id as actor_id,
                        COUNT(DISTINCT il.target_id) as active_connections,
                        MAX(i.interaction_date) as last_interaction_date
                    FROM actors a
                    LEFT JOIN influence_links il ON a.id = il.source_id AND il.weight > 0.1
                    LEFT JOIN interactions i ON a.id = i.source_id
                    GROUP BY a.id
                )
                INSERT INTO isolation_alerts (
                    actor_id, isolation_score, alert_level, active_connections_count, 
                    days_since_last_interaction, analysis_date
                )
                SELECT 
                    cm.actor_id,
                    LEAST(100, GREATEST(0, 
                        100 - (cm.active_connections * 5) +
                        (CURRENT_DATE - COALESCE(cm.last_interaction_date, CURRENT_DATE - INTERVAL '60 days'))::int
                    )) as isolation_score,
                    CASE 
                        WHEN cm.active_connections <= 2 THEN 'critical'
                        WHEN cm.active_connections <= 5 THEN 'warning'
                        ELSE 'none'
                    END as alert_level,
                    cm.active_connections,
                    (CURRENT_DATE - COALESCE(cm.last_interaction_date, CURRENT_DATE - INTERVAL '60 days'))::int as days_since_last_interaction,
                    :analysis_date
                FROM connection_metrics cm
                ON CONFLICT (actor_id, analysis_date) DO UPDATE SET
                    isolation_score = EXCLUDED.isolation_score,
                    alert_level = EXCLUDED.alert_level,
                    active_connections_count = EXCLUDED.active_connections_count,
                    days_since_last_interaction = EXCLUDED.days_since_last_interaction";

        $stmt = $this->db->prepare($sql);
        $stmt->bindParam(':analysis_date', $analysisDate);
        $stmt->execute();

        return $stmt->rowCount();
    }

    /**
     * Get isolation alerts
     * @param string|null $alertLevel Filter by alert level
     * @return array Isolation data
     */
    public function getIsolationAlerts(?string $alertLevel = null): array
    {
        $sql = "SELECT 
                    ia.actor_id,
                    a.name,
                    a.email,
                    a.department,
                    ia.isolation_score,
                    ia.alert_level,
                    ia.active_connections_count,
                    ia.connection_decline_pct,
                    ia.days_since_last_interaction,
                    ia.analysis_date
                FROM isolation_alerts ia
                JOIN actors a ON ia.actor_id = a.id
                WHERE ia.analysis_date = (SELECT MAX(analysis_date) FROM isolation_alerts)";

        if ($alertLevel) {
            $sql .= " AND ia.alert_level = :alert_level";
        }

        $sql .= " ORDER BY ia.isolation_score DESC";

        $stmt = $this->db->prepare($sql);
        if ($alertLevel) {
            $stmt->bindParam(':alert_level', $alertLevel);
        }
        $stmt->execute();

        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    /**
     * Generate collaboration forecasts by department
     * @return int Number of forecasts generated
     */
    public function generateCollaborationForecasts(): int
    {
        $forecastMonth = date('Y-m-01', strtotime('+1 month'));

        $sql = "WITH dept_trends AS (
                    SELECT 
                        a.department,
                        DATE_TRUNC('month', i.interaction_date) as month,
                        COUNT(*) as volume
                    FROM interactions i
                    JOIN actors a ON i.source_id = a.id
                    WHERE i.interaction_date >= CURRENT_DATE - INTERVAL '6 months'
                        AND a.department IS NOT NULL
                    GROUP BY a.department, DATE_TRUNC('month', i.interaction_date)
                )
                INSERT INTO collaboration_forecasts (
                    department, forecast_month, predicted_volume, 
                    predicted_growth_pct, confidence_level
                )
                SELECT 
                    department,
                    :forecast_month,
                    AVG(volume)::int as predicted_volume,
                    ((MAX(volume) - MIN(volume))::float / NULLIF(MIN(volume), 0) * 100) as predicted_growth_pct,
                    0.75 as confidence_level
                FROM dept_trends
                GROUP BY department
                ON CONFLICT (department, forecast_month) DO UPDATE SET
                    predicted_volume = EXCLUDED.predicted_volume,
                    predicted_growth_pct = EXCLUDED.predicted_growth_pct";

        $stmt = $this->db->prepare($sql);
        $stmt->bindParam(':forecast_month', $forecastMonth);
        $stmt->execute();

        return $stmt->rowCount();
    }

    /**
     * Get collaboration forecasts
     * @param string|null $department Filter by department
     * @return array Forecast data
     */
    public function getCollaborationForecasts(?string $department = null): array
    {
        $sql = "SELECT 
                    department,
                    forecast_month,
                    predicted_volume,
                    predicted_growth_pct,
                    confidence_level,
                    resource_recommendation
                FROM collaboration_forecasts
                WHERE forecast_month >= CURRENT_DATE";

        if ($department) {
            $sql .= " AND department = :department";
        }

        $sql .= " ORDER BY forecast_month, department";

        $stmt = $this->db->prepare($sql);
        if ($department) {
            $stmt->bindParam(':department', $department);
        }
        $stmt->execute();

        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    /**
     * Get predictive analytics summary
     * @return array Summary statistics
     */
    public function getSummary(): array
    {
        $summary = [];

        // Churn risk summary
        $sql = "SELECT risk_level, COUNT(*) as count
                FROM churn_risk_scores
                WHERE analysis_date = (SELECT MAX(analysis_date) FROM churn_risk_scores)
                GROUP BY risk_level";
        $stmt = $this->db->query($sql);
        $summary['churn_risk_summary'] = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // Burnout summary
        $sql = "SELECT risk_level, COUNT(*) as count
                FROM burnout_indicators
                WHERE analysis_date = (SELECT MAX(analysis_date) FROM burnout_indicators)
                GROUP BY risk_level";
        $stmt = $this->db->query($sql);
        $summary['burnout_summary'] = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // Isolation summary
        $sql = "SELECT alert_level, COUNT(*) as count
                FROM isolation_alerts
                WHERE analysis_date = (SELECT MAX(analysis_date) FROM isolation_alerts)
                GROUP BY alert_level";
        $stmt = $this->db->query($sql);
        $summary['isolation_summary'] = $stmt->fetchAll(PDO::FETCH_ASSOC);

        return $summary;
    }
}
