import React, { useState, useEffect } from 'react';
import analyticsApi from '../../services/analyticsApi';
import { EmptyState, ErrorState } from '../shared/EmptyStates';
import { LoadingSpinner } from '../shared/LoadingStates';
import './CommunitiesTab.css';

const CommunitiesTab = () => {
    const [activeView, setActiveView] = useState('communities');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [data, setData] = useState({
        communities: [],
        silos: [],
        bridges: [],
        diversity: []
    });

    const views = [
        { id: 'communities', label: 'Mapa de Comunidades', icon: '🗺️' },
        { id: 'silos', label: 'Detector de Silos', icon: '🚧' },
        { id: 'bridges', label: 'Conectores', icon: '🌉' },
        { id: 'diversity', label: 'Diversidad', icon: '🌈' }
    ];

    useEffect(() => {
        fetchData();
    }, [activeView]);

    const fetchData = async () => {
        setLoading(true);
        setError(null);

        try {
            let result;
            switch (activeView) {
                case 'communities':
                    result = await analyticsApi.communities.getAll();
                    // Auto-calculate if no data
                    if (!result || result.length === 0) {
                        await analyticsApi.communities.detect();
                        result = await analyticsApi.communities.getAll();
                    }
                    setData(prev => ({ ...prev, communities: result }));
                    break;
                case 'silos':
                    result = await analyticsApi.communities.getSilos();
                    if (!result || result.length === 0) {
                        await analyticsApi.communities.detectSilos();
                        result = await analyticsApi.communities.getSilos();
                    }
                    setData(prev => ({ ...prev, silos: result }));
                    break;
                case 'bridges':
                    result = await analyticsApi.communities.getBridges();
                    if (!result || result.length === 0) {
                        await analyticsApi.communities.detectBridges();
                        result = await analyticsApi.communities.getBridges();
                    }
                    setData(prev => ({ ...prev, bridges: result }));
                    break;
                case 'diversity':
                    result = await analyticsApi.communities.getDiversity();
                    setData(prev => ({ ...prev, diversity: result }));
                    break;
            }
        } catch (err) {
            console.error('Error fetching communities data:', err);
            setError(err.message || 'Error al cargar los datos');
        } finally {
            setLoading(false);
        }
    };

    const renderContent = () => {
        if (loading) return <LoadingSpinner message="Cargando datos de comunidades..." />;
        if (error) return <ErrorState message={error} onRetry={fetchData} />;

        const currentData = data[activeView];
        if (!currentData || currentData.length === 0) {
            return (
                <EmptyState
                    icon={views.find(v => v.id === activeView)?.icon}
                    title={views.find(v => v.id === activeView)?.label}
                    message="No hay datos disponibles para esta vista"
                />
            );
        }

        return (
            <div className="data-display">
                <div className="data-grid">
                    {currentData.map((item, index) => (
                        <div key={index} className="data-card">
                            <pre>{JSON.stringify(item, null, 2)}</pre>
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    return (
        <div className="communities-tab">
            <div className="tab-intro">
                <h2>👥 Detección de Comunidades</h2>
                <p>Identifica grupos, silos organizacionales y conectores clave en la red</p>
            </div>

            <div className="view-selector">
                {views.map(view => (
                    <button
                        key={view.id}
                        className={`view-button ${activeView === view.id ? 'active' : ''}`}
                        onClick={() => setActiveView(view.id)}
                    >
                        <span className="view-icon">{view.icon}</span>
                        <span className="view-label">{view.label}</span>
                    </button>
                ))}
            </div>

            <div className="view-content">
                {renderContent()}
            </div>
        </div>
    );
};

export default CommunitiesTab;
