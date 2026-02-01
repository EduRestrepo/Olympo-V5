<?php

namespace App\Services;

use PDO;

class MeetingAnalysisService
{
    private PDO $db;

    public function __construct(PDO $db)
    {
        $this->db = $db;
    }

    /**
     * Calculate meeting efficiency scores
     * @return int Number of meetings analyzed
     */
    public function calculateMeetingEfficiency(): int
    {
        // Analyze Teams call records and calculate efficiency
        $sql = "INSERT INTO meeting_efficiency_scores (
                    meeting_id, organizer_id, participant_count, duration_minutes, 
                    efficiency_score, cost_hours, meeting_date
                )
                SELECT 
                    tcr.id::text as meeting_id,
                    tcr.user_id as organizer_id,
                    tcr.participant_count,
                    (tcr.duration_seconds / 60)::int as duration_minutes,
                    LEAST(100, GREATEST(0, 100 - (
                        CASE WHEN tcr.duration_seconds > 3600 THEN 20 ELSE 0 END +
                        CASE WHEN tcr.participant_count > 10 THEN 15 ELSE 0 END +
                        CASE WHEN NOT tcr.used_video THEN 10 ELSE 0 END
                    ))) as efficiency_score,
                    (tcr.participant_count * tcr.duration_seconds / 3600.0) as cost_hours,
                    tcr.call_timestamp as meeting_date
                FROM teams_call_records tcr
                WHERE tcr.call_timestamp >= CURRENT_DATE - INTERVAL '30 days'
                    AND tcr.is_organizer = TRUE
                ON CONFLICT (meeting_id) DO UPDATE SET
                    efficiency_score = EXCLUDED.efficiency_score,
                    cost_hours = EXCLUDED.cost_hours";

        $stmt = $this->db->prepare($sql);
        $stmt->execute();

        return $stmt->rowCount();
    }

    /**
     * Get meeting efficiency scores
     * @param int|null $organizerId Filter by organizer
     * @param float|null $minScore Minimum efficiency score
     * @return array Meeting efficiency data
     */
    public function getMeetingEfficiency(?int $organizerId = null, ?float $minScore = null): array
    {
        $sql = "SELECT 
                    mes.meeting_id,
                    mes.organizer_id,
                    a.name as organizer_name,
                    a.department,
                    mes.participant_count,
                    mes.duration_minutes,
                    mes.efficiency_score,
                    mes.cost_hours,
                    mes.meeting_date
                FROM meeting_efficiency_scores mes
                JOIN actors a ON mes.organizer_id = a.id
                WHERE mes.meeting_date >= CURRENT_DATE - INTERVAL '30 days'";

        if ($organizerId) {
            $sql .= " AND mes.organizer_id = :organizer_id";
        }

        if ($minScore !== null) {
            $sql .= " AND mes.efficiency_score >= :min_score";
        }

        $sql .= " ORDER BY mes.meeting_date DESC";

        $stmt = $this->db->prepare($sql);
        if ($organizerId) {
            $stmt->bindParam(':organizer_id', $organizerId, PDO::PARAM_INT);
        }
        if ($minScore !== null) {
            $stmt->bindParam(':min_score', $minScore);
        }
        $stmt->execute();

        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    /**
     * Calculate attendance patterns
     * @return int Number of records created
     */
    public function calculateAttendancePatterns(): int
    {
        $analysisMonth = date('Y-m-01'); // First day of current month

        $sql = "INSERT INTO attendance_patterns (
                    actor_id, total_meetings_invited, meetings_attended, 
                    meetings_declined, attendance_rate, analysis_month
                )
                SELECT 
                    tcr.user_id as actor_id,
                    COUNT(*) as total_meetings_invited,
                    COUNT(*) as meetings_attended, -- Simplified: all records are attended
                    0 as meetings_declined,
                    100.0 as attendance_rate,
                    :analysis_month
                FROM teams_call_records tcr
                WHERE tcr.call_timestamp >= :analysis_month::date
                    AND tcr.call_timestamp < :analysis_month::date + INTERVAL '1 month'
                GROUP BY tcr.user_id
                ON CONFLICT (actor_id, analysis_month) DO UPDATE SET
                    total_meetings_invited = EXCLUDED.total_meetings_invited,
                    meetings_attended = EXCLUDED.meetings_attended,
                    attendance_rate = EXCLUDED.attendance_rate";

        $stmt = $this->db->prepare($sql);
        $stmt->bindParam(':analysis_month', $analysisMonth);
        $stmt->execute();

        return $stmt->rowCount();
    }

    /**
     * Get attendance patterns
     * @param int|null $actorId Filter by actor
     * @return array Attendance data
     */
    public function getAttendancePatterns(?int $actorId = null): array
    {
        $sql = "SELECT 
                    ap.actor_id,
                    a.name,
                    a.department,
                    ap.total_meetings_invited,
                    ap.meetings_attended,
                    ap.meetings_declined,
                    ap.late_arrivals,
                    ap.early_departures,
                    ap.attendance_rate,
                    ap.analysis_month
                FROM attendance_patterns ap
                JOIN actors a ON ap.actor_id = a.id
                WHERE ap.analysis_month >= DATE_TRUNC('month', CURRENT_DATE - INTERVAL '3 months')";

        if ($actorId) {
            $sql .= " AND ap.actor_id = :actor_id";
        }

        $sql .= " ORDER BY ap.analysis_month DESC, ap.attendance_rate DESC";

        $stmt = $this->db->prepare($sql);
        if ($actorId) {
            $stmt->bindParam(':actor_id', $actorId, PDO::PARAM_INT);
        }
        $stmt->execute();

        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    /**
     * Get meeting cost analysis
     * @param string $groupBy Group by: 'organizer', 'department', 'month'
     * @return array Cost analysis
     */
    public function getMeetingCosts(string $groupBy = 'organizer'): array
    {
        $groupByClause = match($groupBy) {
            'department' => 'a.department',
            'month' => "DATE_TRUNC('month', mes.meeting_date)",
            default => 'mes.organizer_id, a.name'
        };

        $selectClause = match($groupBy) {
            'department' => 'a.department as group_name',
            'month' => "TO_CHAR(DATE_TRUNC('month', mes.meeting_date), 'YYYY-MM') as group_name",
            default => 'a.name as group_name, mes.organizer_id'
        };

        $sql = "SELECT 
                    $selectClause,
                    COUNT(*) as total_meetings,
                    SUM(mes.cost_hours) as total_cost_hours,
                    AVG(mes.cost_hours) as avg_cost_per_meeting,
                    SUM(mes.participant_count) as total_participants,
                    AVG(mes.efficiency_score) as avg_efficiency
                FROM meeting_efficiency_scores mes
                JOIN actors a ON mes.organizer_id = a.id
                WHERE mes.meeting_date >= CURRENT_DATE - INTERVAL '30 days'
                GROUP BY $groupByClause
                ORDER BY total_cost_hours DESC";

        $stmt = $this->db->query($sql);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    /**
     * Generate meeting recommendations
     * @return int Number of recommendations generated
     */
    public function generateRecommendations(): int
    {
        // Clear old recommendations
        $this->db->exec("DELETE FROM meeting_recommendations WHERE created_at < CURRENT_DATE - INTERVAL '7 days'");

        // Recommendation 1: Long meetings
        $sql = "INSERT INTO meeting_recommendations (meeting_id, recommendation_type, recommendation_text, potential_savings_hours, priority)
                SELECT 
                    meeting_id,
                    'reduce_duration',
                    'Esta reunión de ' || duration_minutes || ' minutos podría reducirse a 30-45 minutos',
                    (duration_minutes - 45) / 60.0 * participant_count as potential_savings_hours,
                    'high'
                FROM meeting_efficiency_scores
                WHERE duration_minutes > 60
                    AND meeting_date >= CURRENT_DATE - INTERVAL '7 days'
                ON CONFLICT DO NOTHING";
        $this->db->exec($sql);

        // Recommendation 2: Too many participants
        $sql = "INSERT INTO meeting_recommendations (meeting_id, recommendation_type, recommendation_text, potential_savings_hours, priority)
                SELECT 
                    meeting_id,
                    'reduce_participants',
                    'Esta reunión tiene ' || participant_count || ' participantes. Considera reducir a los esenciales.',
                    duration_minutes / 60.0 * (participant_count - 5) as potential_savings_hours,
                    'medium'
                FROM meeting_efficiency_scores
                WHERE participant_count > 8
                    AND meeting_date >= CURRENT_DATE - INTERVAL '7 days'
                ON CONFLICT DO NOTHING";
        $this->db->exec($sql);

        // Recommendation 3: Could be email
        $sql = "INSERT INTO meeting_recommendations (meeting_id, recommendation_type, recommendation_text, potential_savings_hours, priority)
                SELECT 
                    meeting_id,
                    'could_be_email',
                    'Reunión corta con pocos participantes. ¿Podría ser un email?',
                    cost_hours as potential_savings_hours,
                    'low'
                FROM meeting_efficiency_scores
                WHERE duration_minutes <= 15
                    AND participant_count <= 3
                    AND meeting_date >= CURRENT_DATE - INTERVAL '7 days'
                ON CONFLICT DO NOTHING";
        $this->db->exec($sql);

        // Get count of recommendations
        $stmt = $this->db->query("SELECT COUNT(*) FROM meeting_recommendations WHERE created_at >= CURRENT_DATE");
        return $stmt->fetchColumn();
    }

    /**
     * Get meeting recommendations
     * @param string|null $type Filter by recommendation type
     * @return array Recommendations
     */
    public function getRecommendations(?string $type = null): array
    {
        $sql = "SELECT 
                    mr.meeting_id,
                    mr.recommendation_type,
                    mr.recommendation_text,
                    mr.potential_savings_hours,
                    mr.priority,
                    mes.organizer_id,
                    a.name as organizer_name,
                    mes.meeting_date
                FROM meeting_recommendations mr
                JOIN meeting_efficiency_scores mes ON mr.meeting_id = mes.meeting_id
                JOIN actors a ON mes.organizer_id = a.id
                WHERE mr.created_at >= CURRENT_DATE - INTERVAL '7 days'";

        if ($type) {
            $sql .= " AND mr.recommendation_type = :type";
        }

        $sql .= " ORDER BY mr.potential_savings_hours DESC";

        $stmt = $this->db->prepare($sql);
        if ($type) {
            $stmt->bindParam(':type', $type);
        }
        $stmt->execute();

        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    /**
     * Get meeting analysis summary
     * @return array Summary statistics
     */
    public function getSummary(): array
    {
        $summary = [];

        // Total meetings and costs
        $sql = "SELECT 
                    COUNT(*) as total_meetings,
                    SUM(cost_hours) as total_cost_hours,
                    AVG(efficiency_score) as avg_efficiency,
                    AVG(participant_count) as avg_participants,
                    AVG(duration_minutes) as avg_duration_minutes
                FROM meeting_efficiency_scores
                WHERE meeting_date >= CURRENT_DATE - INTERVAL '30 days'";
        $stmt = $this->db->query($sql);
        $summary['overall'] = $stmt->fetch(PDO::FETCH_ASSOC);

        // Recommendations count by type
        $sql = "SELECT recommendation_type, COUNT(*) as count
                FROM meeting_recommendations
                WHERE created_at >= CURRENT_DATE - INTERVAL '7 days'
                GROUP BY recommendation_type";
        $stmt = $this->db->query($sql);
        $summary['recommendations_by_type'] = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // Top costly meetings
        $sql = "SELECT 
                    mes.meeting_id,
                    a.name as organizer_name,
                    mes.cost_hours,
                    mes.participant_count,
                    mes.duration_minutes,
                    mes.meeting_date
                FROM meeting_efficiency_scores mes
                JOIN actors a ON mes.organizer_id = a.id
                WHERE mes.meeting_date >= CURRENT_DATE - INTERVAL '30 days'
                ORDER BY mes.cost_hours DESC
                LIMIT 10";
        $stmt = $this->db->query($sql);
        $summary['top_costly_meetings'] = $stmt->fetchAll(PDO::FETCH_ASSOC);

        return $summary;
    }
}
