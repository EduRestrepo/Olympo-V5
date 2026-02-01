import React, { useState, useEffect } from 'react';
import analyticsApi from '../../services/analyticsApi';
import { EmptyState, ErrorState } from '../shared/EmptyStates';
import { LoadingSpinner } from '../shared/LoadingStates';
import './MeetingsTab.css';

const MeetingsTab = () => {
    const [activeView, setActiveView] = useState('efficiency');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [data, setData] = useState({
        efficiency: [],
        costs: [],
        recommendations: []
    });

    const views = [
        { id: 'efficiency', label: 'Eficiencia', icon: '⚡' },
        { id: 'costs', label: 'Costos', icon: '💰' },
        { id: 'recommendations', label: 'Recomendaciones', icon: '💡' }
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
                case 'efficiency':
                    result = await analyticsApi.meetings.getEfficiency();
                    // Auto-calculate if no data
                    if (!result || result.length === 0) {
                        await analyticsApi.meetings.calculate();
                        result = await analyticsApi.meetings.getEfficiency();
                    }
                    setData(prev => ({ ...prev, efficiency: result }));
                    break;
                case 'costs':
                    result = await analyticsApi.meetings.getCosts();
                    if (!result || result.length === 0) {
                        await analyticsApi.meetings.calculate();
                        result = await analyticsApi.meetings.getCosts();
                    }
                    setData(prev => ({ ...prev, costs: result }));
                    break;
                case 'recommendations':
                    result = await analyticsApi.meetings.getRecommendations();
                    if (!result || result.length === 0) {
                        await analyticsApi.meetings.calculate();
                        result = await analyticsApi.meetings.getRecommendations();
                    }
                    setData(prev => ({ ...prev, recommendations: result }));
                    break;
            }
        } catch (err) {
            console.error('Error fetching meetings data:', err);
            setError(err.message || 'Error al cargar los datos');
        } finally {
            setLoading(false);
        }
    };

    const renderContent = () => {
        if (loading) return <LoadingSpinner message="Cargando datos de reuniones..." />;
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
        <div className="meetings-tab">
            <div className="tab-intro">
                <h2>📅 Análisis de Reuniones</h2>
                <p>Optimiza el tiempo y los costos de las reuniones en tu organización</p>
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

export default MeetingsTab;
