// Analytics API Service for Olympo V5.1
// Handles all API calls to the new analytics endpoints

const API_BASE = 'http://localhost:8000/api';

export const analyticsApi = {
    // ============================================
    // TEMPORAL ANALYSIS
    // ============================================
    temporal: {
        getHeatmap: async (actorId = null, startDate = null, endDate = null) => {
            const params = new URLSearchParams();
            if (actorId) params.append('actor_id', actorId);
            if (startDate) params.append('start_date', startDate);
            if (endDate) params.append('end_date', endDate);

            const response = await fetch(`${API_BASE}/analytics/temporal/heatmap?${params}`);
            return response.json();
        },

        getOverload: async (threshold = 40) => {
            const response = await fetch(`${API_BASE}/analytics/temporal/overload?threshold=${threshold}`);
            return response.json();
        },

        getResponseTime: async (department = null) => {
            const params = department ? `?department=${department}` : '';
            const response = await fetch(`${API_BASE}/analytics/temporal/response-time${params}`);
            return response.json();
        },

        getTimezone: async () => {
            const response = await fetch(`${API_BASE}/analytics/temporal/timezone`);
            return response.json();
        },

        calculate: async () => {
            const response = await fetch(`${API_BASE}/analytics/temporal/calculate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            });
            return response.json();
        }
    },

    // ============================================
    // COMMUNITY DETECTION
    // ============================================
    communities: {
        detect: async () => {
            const response = await fetch(`${API_BASE}/analytics/communities/detect`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            });
            return response.json();
        },

        getAll: async () => {
            const response = await fetch(`${API_BASE}/analytics/communities`);
            return response.json();
        },

        getSilos: async () => {
            const response = await fetch(`${API_BASE}/analytics/communities/silos`);
            return response.json();
        },

        detectSilos: async (threshold = 0.3) => {
            const response = await fetch(`${API_BASE}/analytics/communities/silos/detect`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ threshold })
            });
            return response.json();
        },

        getBridges: async () => {
            const response = await fetch(`${API_BASE}/analytics/communities/bridges`);
            return response.json();
        },

        detectBridges: async (threshold = 0.5) => {
            const response = await fetch(`${API_BASE}/analytics/communities/bridges/detect`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ threshold })
            });
            return response.json();
        },

        getDiversity: async (actorId = null) => {
            const params = actorId ? `?actor_id=${actorId}` : '';
            const response = await fetch(`${API_BASE}/analytics/communities/diversity${params}`);
            return response.json();
        }
    },

    // ============================================
    // MEETING ANALYSIS
    // ============================================
    meetings: {
        getEfficiency: async (actorId = null) => {
            const params = actorId ? `?actor_id=${actorId}` : '';
            const response = await fetch(`${API_BASE}/analytics/meetings/efficiency${params}`);
            return response.json();
        },

        getCosts: async (startDate = null, endDate = null) => {
            const params = new URLSearchParams();
            if (startDate) params.append('start_date', startDate);
            if (endDate) params.append('end_date', endDate);

            const response = await fetch(`${API_BASE}/analytics/meetings/costs?${params}`);
            return response.json();
        },

        getRecommendations: async () => {
            const response = await fetch(`${API_BASE}/analytics/meetings/recommendations`);
            return response.json();
        },

        calculate: async () => {
            const response = await fetch(`${API_BASE}/analytics/meetings/calculate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            });
            return response.json();
        }
    },

    // ============================================
    // PREDICTIVE ANALYTICS
    // ============================================
    predictions: {
        getChurnRisk: async (threshold = 0.7) => {
            const response = await fetch(`${API_BASE}/analytics/predictions/churn?threshold=${threshold}`);
            return response.json();
        },

        getBurnout: async (threshold = 0.7) => {
            const response = await fetch(`${API_BASE}/analytics/predictions/burnout?threshold=${threshold}`);
            return response.json();
        },

        getIsolation: async (threshold = 0.5) => {
            const response = await fetch(`${API_BASE}/analytics/predictions/isolation?threshold=${threshold}`);
            return response.json();
        },

        calculate: async () => {
            const response = await fetch(`${API_BASE}/analytics/predictions/calculate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            });
            return response.json();
        }
    },

    // ============================================
    // BENCHMARKING
    // ============================================
    benchmarks: {
        getDepartments: async () => {
            const response = await fetch(`${API_BASE}/analytics/benchmarks/departments`);
            return response.json();
        },

        getRankings: async (type = 'top_collaborators', limit = 20) => {
            const response = await fetch(`${API_BASE}/analytics/benchmarks/rankings?type=${type}&limit=${limit}`);
            return response.json();
        },

        calculate: async () => {
            const response = await fetch(`${API_BASE}/analytics/benchmarks/calculate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            });
            return response.json();
        }
    },

    // ============================================
    // EXPORT
    // ============================================
    export: {
        getData: async (type = 'actors') => {
            const response = await fetch(`${API_BASE}/analytics/export?type=${type}`);
            return response.blob();
        },

        downloadCSV: async (type, filename) => {
            const blob = await analyticsApi.export.getData(type);
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename || `olympo_${type}_${new Date().toISOString().split('T')[0]}.csv`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        }
    },

    // ============================================
    // GAMIFICATION
    // ============================================
    gamification: {
        getBadges: async (actorId) => {
            const response = await fetch(`${API_BASE}/analytics/gamification/badges/${actorId}`);
            return response.json();
        },

        getSuggestions: async (actorId) => {
            const response = await fetch(`${API_BASE}/analytics/gamification/suggestions/${actorId}`);
            return response.json();
        },

        getGoals: async (actorId) => {
            const response = await fetch(`${API_BASE}/analytics/gamification/goals/${actorId}`);
            return response.json();
        }
    },

    // ============================================
    // BATCH PROCESSING & AD GROUPS
    // ============================================
    batch: {
        getJobs: async (status = null) => {
            const params = status ? `?status=${status}` : '';
            const response = await fetch(`${API_BASE}/analytics/batch/jobs${params}`);
            return response.json();
        },

        createJob: async (jobData) => {
            const response = await fetch(`${API_BASE}/analytics/batch/jobs`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(jobData)
            });
            return response.json();
        }
    },

    adGroups: {
        getAll: async (isEnabled = null) => {
            const params = isEnabled !== null ? `?is_enabled=${isEnabled}` : '';
            const response = await fetch(`${API_BASE}/analytics/ad-groups${params}`);
            return response.json();
        },

        getScopes: async (isActive = null) => {
            const params = isActive !== null ? `?is_active=${isActive}` : '';
            const response = await fetch(`${API_BASE}/analytics/extraction-scopes${params}`);
            return response.json();
        },

        createScope: async (scopeData) => {
            const response = await fetch(`${API_BASE}/analytics/extraction-scopes`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(scopeData)
            });
            return response.json();
        }
    }
};

export default analyticsApi;
