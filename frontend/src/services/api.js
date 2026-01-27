export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export async function fetchJson(endpoint, options = {}) {
    try {
        const res = await fetch(`${API_URL}${endpoint}`, {
            ...options,
            headers: {
                'Content-Type': 'application/json',
                ...options.headers,
            },
        });
        if (!res.ok) {
            throw new Error(`API Error: ${res.statusText}`);
        }
        return await res.json();
    } catch (error) {
        console.error(`Failed to fetch ${endpoint}:`, error);
        return null;
    }
}

export const api = {
    get: (endpoint) => fetchJson(endpoint),
    post: (endpoint, data) => fetchJson(endpoint, {
        method: 'POST',
        body: JSON.stringify(data)
    }),
    getTopInfluencers: () => fetchJson('/api/top-influencers'),
    getBalancePower: () => fetchJson('/api/balance-power'),
    getChannelTotals: () => fetchJson('/api/channel-totals'),
    getNetworkPulse: () => fetchJson('/api/network-pulse'),
    getToneIndex: () => fetchJson('/api/tone-index'),
    getAbout: () => fetchJson('/api/about'),
    // Settings
    getSettings: () => fetchJson('/api/settings'),
    saveSettings: (data) => api.post('/api/settings', data),
    testConnection: () => api.post('/api/settings/test-connection', {}),
    extractData: () => api.post('/api/settings/extract-data', {}),
    wipeDatabase: () => api.post('/api/settings/wipe-database', {}),
    seedDatabase: () => api.post('/api/settings/seed-database', {}),
    getLogs: () => fetchJson('/api/settings/logs'),
};
