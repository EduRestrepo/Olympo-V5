import React, { useState, useEffect } from 'react';
import analyticsApi from '../../services/analyticsApi';
import { EmptyState, ErrorState } from '../shared/EmptyStates';
import { LoadingSpinner } from '../shared/LoadingStates';
import './BenchmarksTab.css';

const BenchmarksTab = () => {
    const [activeView, setActiveView] = useState('departments');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [data, setData] = useState({
        departments: [],
        rankings: []
    });

    const views = [
        { id: 'departments', label: 'Por Departamento', icon: '🏢' },
        { id: 'rankings', label: 'Rankings', icon: '🏆' }
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
                case 'departments':
                    result = await analyticsApi.benchmarks.getDepartments();
                    // Auto-calculate if no data
                    if (!result || result.length === 0) {
                        await analyticsApi.benchmarks.calculate();
                        result = await analyticsApi.benchmarks.getDepartments();
                    }
                    setData(prev => ({ ...prev, departments: result }));
                    break;
                case 'rankings':
                    result = await analyticsApi.benchmarks.getRankings();
                    if (!result || result.length === 0) {
                        await analyticsApi.benchmarks.calculate();
                        result = await analyticsApi.benchmarks.getRankings();
                    }
                    setData(prev => ({ ...prev, rankings: result }));
                    break;
            }
        } catch (err) {
            console.error('Error fetching benchmarks data:', err);
            setError(err.message || 'Error al cargar los datos');
        } finally {
            setLoading(false);
        }
    };

    const renderContent = () => {
        if (loading) return <LoadingSpinner message="Cargando benchmarks..." />;
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
