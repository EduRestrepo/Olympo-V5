import React, { useState, useEffect } from 'react';
import analyticsApi from '../../services/analyticsApi';
import { EmptyState, ErrorState } from '../shared/EmptyStates';
import { LoadingSpinner } from '../shared/LoadingStates';
import './BenchmarksTab.css';

const BenchmarksTab = () => {
    const [activeView, setActiveView] = useState('departments');
    const [loading, setLoading] = useState(false);
    const [calculating, setCalculating] = useState(false);
    const [error, setError] = useState(null);
    const [dataLoaded, setDataLoaded] = useState(false);
    const [data, setData] = useState({
        departments: [],
        rankings: []
    });

    const views = [
        { id: 'departments', label: 'Por Departamento', icon: '🏢' },
        { id: 'rankings', label: 'Rankings', icon: '🏆' }
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
            const [departments, rankings] = await Promise.all([
                analyticsApi.benchmarks.getDepartments(),
                analyticsApi.benchmarks.getRankings()
            ]);

            const needsCalculation =
                !departments || departments.length === 0 ||
                !rankings || rankings.length === 0;

            if (needsCalculation) {
                setCalculating(true);
                setLoading(false);
                await analyticsApi.benchmarks.calculate();
                setCalculating(false);
                setLoading(true);

                const [newDepartments, newRankings] = await Promise.all([
                    analyticsApi.benchmarks.getDepartments(),
                    analyticsApi.benchmarks.getRankings()
                ]);

                setData({
                    departments: newDepartments || [],
                    rankings: newRankings || []
                });
            } else {
                setData({
                    departments: departments || [],
                    rankings: rankings || []
                });
            }

            setDataLoaded(true);
        } catch (err) {
            console.error('Error loading benchmarks data:', err);
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
                    <LoadingSpinner message="🔄 Calculando benchmarks..." />
                    <p className="calculating-info">
                        Esto puede tardar unos segundos. Los datos se están generando automáticamente.
                    </p>
                </div>
            );
        }

        if (loading) return <LoadingSpinner message="Cargando benchmarks..." />;
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
                    <p style={{ margin: 0 }}><strong>💡 Comparativa Sectorial:</strong> Estos benchmarks permiten comparar el desempeño de tu organización o departamento con estándares de la industria, identificando áreas de mejora competitiva.</p>
                </div>
            </div>
        );
    };

    return (
        <div className="benchmarks-tab">
            <div className="tab-intro">
                <h2>📊 Benchmarking</h2>
                <p>Compara el desempeño entre departamentos y usuarios</p>
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

export default BenchmarksTab;
