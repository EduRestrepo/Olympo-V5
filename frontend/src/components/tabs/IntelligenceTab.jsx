import React, { useState, useEffect } from 'react';
import analyticsApi from '../../services/analyticsApi';
import { EmptyState, ErrorState } from '../shared/EmptyStates';
import { LoadingSpinner } from '../shared/LoadingStates';
import './IntelligenceTab.css';

const IntelligenceTab = () => {
    const [activeView, setActiveView] = useState('churn');
    const [loading, setLoading] = useState(false);
    const [calculating, setCalculating] = useState(false);
    const [error, setError] = useState(null);
    const [dataLoaded, setDataLoaded] = useState(false);
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

    // Load ALL data once on mount
    useEffect(() => {
        loadAllData();
    }, []);

    const loadAllData = async () => {
        if (dataLoaded) return;

        setLoading(true);
        setError(null);

        try {
            const [churn, burnout, isolation] = await Promise.all([
                analyticsApi.predictions.getChurnRisk(),
                analyticsApi.predictions.getBurnout(),
                analyticsApi.predictions.getIsolation()
            ]);

            const needsCalculation =
                !churn || churn.length === 0 ||
                !burnout || burnout.length === 0 ||
                !isolation || isolation.length === 0;

            if (needsCalculation) {
                setCalculating(true);
                setLoading(false);
                await analyticsApi.predictions.calculate();
                setCalculating(false);
                setLoading(true);

                const [newChurn, newBurnout, newIsolation] = await Promise.all([
                    analyticsApi.predictions.getChurnRisk(),
                    analyticsApi.predictions.getBurnout(),
                    analyticsApi.predictions.getIsolation()
                ]);

                setData({
                    churn: newChurn || [],
                    burnout: newBurnout || [],
                    isolation: newIsolation || []
                });
            } else {
                setData({
                    churn: churn || [],
                    burnout: burnout || [],
                    isolation: isolation || []
                });
            }

            setDataLoaded(true);
        } catch (err) {
            console.error('Error loading intelligence data:', err);
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
                    <LoadingSpinner message="🔄 Calculando análisis predictivo..." />
                    <p className="calculating-info">
                        Esto puede tardar unos segundos. Los datos se están generando automáticamente.
                    </p>
                </div>
            );
        }

        if (loading) return <LoadingSpinner message="Cargando análisis predictivo..." />;
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
