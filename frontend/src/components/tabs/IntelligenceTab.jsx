import React, { useState, useEffect } from 'react';
import analyticsApi from '../../services/analyticsApi';
import { EmptyState, ErrorState } from '../shared/EmptyStates';
import { LoadingSpinner } from '../shared/LoadingStates';
import './IntelligenceTab.css';

const IntelligenceTab = () => {
    const [activeView, setActiveView] = useState('churn');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [data, setData] = useState({
        churn: [],
        burnout: [],
        isolation: []
    });

    const views = [
        { id: 'churn', label: 'Riesgo de Fuga', icon: '🚪' },
        { id: 'burnout', label: 'Burnout', icon: '🔥' },
        { id: 'isolation', label: 'Aislamiento', icon: '🏝️' }
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
                case 'churn':
                    result = await analyticsApi.predictions.getChurnRisk();
                    // Auto-calculate if no data
                    if (!result || result.length === 0) {
                        await analyticsApi.predictions.calculate();
                        result = await analyticsApi.predictions.getChurnRisk();
                    }
                    setData(prev => ({ ...prev, churn: result }));
                    break;
                case 'burnout':
                    result = await analyticsApi.predictions.getBurnout();
                    if (!result || result.length === 0) {
                        await analyticsApi.predictions.calculate();
                        result = await analyticsApi.predictions.getBurnout();
                    }
                    setData(prev => ({ ...prev, burnout: result }));
                    break;
                case 'isolation':
                    result = await analyticsApi.predictions.getIsolation();
                    if (!result || result.length === 0) {
                        await analyticsApi.predictions.calculate();
                        result = await analyticsApi.predictions.getIsolation();
                    }
                    setData(prev => ({ ...prev, isolation: result }));
                    break;
            }
        } catch (err) {
            console.error('Error fetching intelligence data:', err);
            setError(err.message || 'Error al cargar los datos');
        } finally {
            setLoading(false);
        }
    };

    const renderContent = () => {
        if (loading) return <LoadingSpinner message="Cargando análisis predictivo..." />;
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
        <div className="intelligence-tab">
            <div className="tab-intro">
                <h2>🧠 Inteligencia Predictiva</h2>
                <p>Anticipa riesgos y problemas antes de que ocurran</p>
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

export default IntelligenceTab;
