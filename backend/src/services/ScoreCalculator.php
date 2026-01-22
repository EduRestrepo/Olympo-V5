<?php

namespace Olympus\Services;

class ScoreCalculator
{
    // Email scoring weights
    private float $wEmailVol;
    private float $wEmailResp;

    // Teams scoring weights
    private float $wTeamsFreq;
    private float $wTeamsAudience;
    private float $wTeamsDuration;
    private float $wTeamsOrganizer;
    private float $wTeamsVideo;

    // Unified scoring weights (Email vs Teams)
    private float $emailWeight;
    private float $teamsWeight;

    public function __construct()
    {
        $repo = new \Olympus\Db\SettingRepository();

        // Unified Weights
        $this->emailWeight = (float) $repo->getByKey('influence_weight_email', 0.6);
        $this->teamsWeight = (float) $repo->getByKey('influence_weight_teams', 0.4);

        // Email Sub-weights
        $this->wEmailVol = (float) $repo->getByKey('w_email_vol', 0.6);
        $this->wEmailResp = (float) $repo->getByKey('w_email_resp', 0.4);

        // Teams Sub-weights
        $this->wTeamsFreq = (float) $repo->getByKey('w_teams_freq', 0.30);
        $this->wTeamsAudience = (float) $repo->getByKey('w_teams_audience', 0.25);
        $this->wTeamsDuration = (float) $repo->getByKey('w_teams_duration', 0.20);
        $this->wTeamsOrganizer = (float) $repo->getByKey('w_teams_organizer', 0.15);
        $this->wTeamsVideo = (float) $repo->getByKey('w_teams_video', 0.10);
    }

    /**
     * Calculate unified influence score combining Email and Teams metrics
     * @param array $actor Actor data with email and teams metrics
     * @return array Enhanced actor data with all scores
     */
    public function calculateUnifiedInfluence(array $actor): array
    {
        $emailScore = $this->calculateEmailInfluence($actor);
        $teamsScore = $this->calculateTeamsInfluence($actor);

        // Unified score
        $unifiedScore = ($this->emailWeight * $emailScore) + ($this->teamsWeight * $teamsScore);

        $actor['email_score'] = round($emailScore, 1);
        $actor['teams_score'] = round($teamsScore, 1);
        $actor['unified_score'] = round($unifiedScore, 1);

        // Determine dominant channel
        $actor['dominant_channel'] = $emailScore > $teamsScore ? 'Email' : 'Teams';

        return $actor;
    }

    /**
     * Calculate Email influence score (0-100)
     * @param array $metrics Email metrics: total_volume, avg_response_time
     * @return float Score 0-100
     */
    public function calculateEmailInfluence(array $metrics): float
    {
        $volume = $metrics['total_volume'] ?? 0;
        $responseTime = $metrics['avg_response_time'] ?? 0;

        if ($volume == 0 && $responseTime == 0) {
            return 0;
        }

        // Normalize volume (cap at 500 messages)
        $volNorm = min($volume / 500, 1);

        // Normalize response time (cap at 2 hours = 7200 seconds, inverted)
        $rtNorm = $responseTime > 0 ? (1 - min($responseTime / 7200, 1)) : 0;

        $score = 0;
        if ($volume > 0 && $responseTime > 0) {
            $score = ($this->wEmailVol * $volNorm) + ($this->wEmailResp * $rtNorm);
        } elseif ($volume > 0) {
            $score = $volNorm;
        } elseif ($responseTime > 0) {
            $score = $rtNorm;
        }

        return $score * 100;
    }

    /**
     * Calculate Teams influence score (0-100)
     * @param array $metrics Teams metrics: total_meetings, avg_participants, etc.
     * @return float Score 0-100
     */
    public function calculateTeamsInfluence(array $metrics): float
    {
        $totalMeetings = $metrics['total_meetings'] ?? 0;
        $avgParticipants = $metrics['avg_participants'] ?? 0;
        $totalDurationHours = $metrics['total_duration_hours'] ?? 0;
        $meetingsOrganized = $metrics['meetings_organized'] ?? 0;
        $videoCalls = $metrics['video_calls'] ?? 0;

        if ($totalMeetings == 0) {
            return 0;
        }

        // Normalize metrics
        $freqNorm = min($totalMeetings / 50, 1); // Cap at 50 meetings/month
        $audienceNorm = min($avgParticipants / 20, 1); // Cap at 20 avg participants
        $durationNorm = min($totalDurationHours / 40, 1); // Cap at 40 hours/month
        $organizerRatio = $meetingsOrganized / max($totalMeetings, 1);
        $videoRatio = $videoCalls / max($totalMeetings, 1);

        $score = (
            $this->wTeamsFreq * $freqNorm +
            $this->wTeamsAudience * $audienceNorm +
            $this->wTeamsDuration * $durationNorm +
            $this->wTeamsOrganizer * $organizerRatio +
            $this->wTeamsVideo * $videoRatio
        );

        return $score * 100;
    }

    /**
     * Legacy method for backward compatibility
     * @deprecated Use calculateUnifiedInfluence instead
     */
    public function calculateScores(array $actorsData): array
    {
        if (empty($actorsData)) {
            return [];
        }

        // Extract metrics for normalization
        $volumes = array_column($actorsData, 'total_volume');
        $responseTimes = array_column($actorsData, 'avg_response_time');

        // Handle outliers (95th percentile cap)
        $volCap = $this->getPercentile($volumes, 95);
        $rtCap = $this->getPercentile($responseTimes, 95);

        // Cap values
        $cappedVolumes = array_map(fn($v) => min($v, $volCap), $volumes);
        $cappedRTs = array_map(fn($v) => min($v, $rtCap), $responseTimes);

        $minVol = min($cappedVolumes);
        $maxVol = max($cappedVolumes);
        $minRT = min($cappedRTs);
        $maxRT = max($cappedRTs);

        // Avoid division by zero
        $volRange = ($maxVol - $minVol) ?: 1;
        $rtRange = ($maxRT - $minRT) ?: 1;

        foreach ($actorsData as &$actor) {
            $vol = min($actor['total_volume'], $volCap);
            $rt = min($actor['avg_response_time'], $rtCap);

            // Normalize [0, 1]
            $volNorm = ($vol - $minVol) / $volRange;
            $rtNorm = ($rt - $minRT) / $rtRange;

            $score = 0;
            $hasVol = $actor['total_volume'] > 0;
            $hasRT = $actor['avg_response_time'] > 0;

            if ($hasVol && $hasRT) {
                $score = ($this->wEmailVol * $volNorm) + ($this->wEmailResp * (1 - $rtNorm));
            } elseif ($hasVol) {
                $score = $volNorm;
            } elseif ($hasRT) {
                $score = 1 - $rtNorm;
            }

            $actor['score'] = round($score * 100, 1);
            $actor['vol_norm'] = $volNorm;
            $actor['rt_norm'] = $rtNorm;
        }

        usort($actorsData, fn($a, $b) => $b['score'] <=> $a['score']);

        return $actorsData;
    }

    private function getPercentile(array $data, int $percentile): float
    {
        if (empty($data))
            return 0;
        sort($data);
        $index = ($percentile / 100) * (count($data) - 1);
        $floor = floor($index);
        $ceil = ceil($index);

        if ($floor == $ceil) {
            return $data[$index];
        }

        $d0 = $data[$floor];
        $d1 = $data[$ceil];
        return $d0 + ($d1 - $d0) * ($index - $floor);
    }
}
