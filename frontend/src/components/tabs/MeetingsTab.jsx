import React, { useState, useEffect } from 'react';
import analyticsApi from '../../services/analyticsApi';
import { EmptyState, ErrorState } from '../shared/EmptyStates';
import { LoadingSpinner } from '../shared/LoadingStates';
import './MeetingsTab.css';

const MeetingsTab = () => {
    const [activeView, setActiveView] = useState('efficiency');
    const [loading, setLoading] = useState(false);
    const [calculating, setCalculating] = useState(false);
    const [error, setError] = useState(null);
    const [dataLoaded, setDataLoaded] = useState(false);
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

    // Load ALL data once on mount
    useEffect(() => {
        loadAllData();
    }, []);

    const loadAllData = async () => {
        if (dataLoaded) return;

        setLoading(true);
        setError(null);

        try {
            const [efficiency, costs, recommendations] = await Promise.all([
                analyticsApi.meetings.getEfficiency(),
                analyticsApi.meetings.getCosts(),
                analyticsApi.meetings.getRecommendations()
            ]);

            const needsCalculation =
                !efficiency || efficiency.length === 0 ||
                !costs || costs.length === 0 ||
                !recommendations || recommendations.length === 0;

            if (needsCalculation) {
                setCalculating(true);
                setLoading(false);
                await analyticsApi.meetings.calculate();
                setCalculating(false);
                setLoading(true);

                const [newEfficiency, newCosts, newRecommendations] = await Promise.all([
                    analyticsApi.meetings.getEfficiency(),
                    analyticsApi.meetings.getCosts(),
                    analyticsApi.meetings.getRecommendations()
                ]);

                setData({
                    efficiency: newEfficiency || [],
                    costs: newCosts || [],
                    recommendations: newRecommendations || []
                });
            } else {
                setData({
                    efficiency: efficiency || [],
                    costs: costs || [],
                    recommendations: recommendations || []
                });
            }

            setDataLoaded(true);
        } catch (err) {
            console.error('Error loading meetings data:', err);
            setError(err.message || 'Error al cargar los datos');
        } finally {
            setLoading(false);
            setCalculating(false);
        }
    };

    const renderContent = () => {
        if (calculating) {
            return (
                <div className="calculating-state">
                    <LoadingSpinner message="🔄 Calculando métricas de reuniones..." />
                    <p className="calculating-info">
                        Esto puede tardar unos segundos. Los datos se están generando automáticamente.
                    </p>
                </div>
            );
        }

        if (loading) return <LoadingSpinner message="Cargando datos de reuniones..." />;
        if (error) return <ErrorState message={error} onRetry={loadAllData} />;

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

                <div className="view-disclaimer" style={{ marginTop: '24px', padding: '16px', background: 'rgba(10, 132, 255, 0.1)', border: '1px solid rgba(10, 132, 255, 0.2)', borderRadius: '8px', fontSize: '0.9rem', color: '#c9d1d9' }}>
                    <p style={{ margin: 0 }}><strong>💡 Eficiencia de Reuniones:</strong> Analizamos la duración, número de asistentes y frecuencia de las reuniones. Un alto costo o baja eficiencia sugiere la necesidad de optimizar la agenda y reducir reuniones innecesarias.</p>
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
