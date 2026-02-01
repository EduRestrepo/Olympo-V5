import React, { useState, useEffect } from 'react';
import { Clock, AlertTriangle, Timer, Globe, TrendingUp } from 'lucide-react';
import analyticsApi from '../../services/analyticsApi';
import { LoadingSpinner, SkeletonCard } from '../shared/LoadingStates';
import { EmptyState, ErrorState } from '../shared/EmptyStates';
import './TemporalTab.css';

const TemporalTab = () => {
    const [activeView, setActiveView] = useState('heatmap');
    const [loading, setLoading] = useState(false);
    const [calculating, setCalculating] = useState(false);
    const [error, setError] = useState(null);
    const [dataLoaded, setDataLoaded] = useState(false);
    const [data, setData] = useState({
        heatmap: [],
        overload: [],
        responseTime: [],
        timezone: []
    });

    const views = [
        { id: 'heatmap', label: 'Mapa de Calor', icon: '🔥' },
        { id: 'overload', label: 'Sobrecarga', icon: '⚠️' },
        { id: 'responseTime', label: 'Tiempo de Respuesta', icon: '⏱️' },
        { id: 'timezone', label: 'Zonas Horarias', icon: '🌍' }
    ];

    // Load ALL data once on mount
    useEffect(() => {
        loadAllData();
    }, []);

    const loadAllData = async () => {
        if (dataLoaded) return; // Skip if already loaded

        setLoading(true);
        setError(null);

        try {
            // Fetch all data in parallel
            const [heatmap, overload, responseTime, timezone] = await Promise.all([
                analyticsApi.temporal.getHeatmap(),
                analyticsApi.temporal.getOverload(),
                analyticsApi.temporal.getResponseTime(),
                analyticsApi.temporal.getTimezone()
            ]);

            // Check if ANY data is missing
            const needsCalculation =
                !heatmap || heatmap.length === 0 ||
                !overload || overload.length === 0 ||
                !responseTime || responseTime.length === 0 ||
                !timezone || timezone.length === 0;

            if (needsCalculation) {
                // Calculate once for ALL metrics
                setCalculating(true);
                setLoading(false);
                await analyticsApi.temporal.calculate();
                setCalculating(false);
                setLoading(true);

                // Re-fetch all data after calculation
                const [newHeatmap, newOverload, newResponseTime, newTimezone] = await Promise.all([
                    analyticsApi.temporal.getHeatmap(),
                    analyticsApi.temporal.getOverload(),
                    analyticsApi.temporal.getResponseTime(),
                    analyticsApi.temporal.getTimezone()
                ]);

                setData({
                    heatmap: newHeatmap || [],
                    overload: newOverload || [],
                    responseTime: newResponseTime || [],
                    timezone: newTimezone || []
                });
            } else {
                // Use fetched data
                setData({
                    heatmap: heatmap || [],
                    overload: overload || [],
                    responseTime: responseTime || [],
                    timezone: timezone || []
                });
            }

            setDataLoaded(true);
        } catch (err) {
            console.error('Error loading temporal data:', err);
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
                    <LoadingSpinner message="🔄 Calculando métricas por primera vez..." />
                    <p className="calculating-info">
                        Esto puede tardar unos segundos. Los datos se están generando automáticamente.
                    </p>
                </div>
            );
        }

        if (loading) return <LoadingSpinner message="Cargando datos temporales..." />;
        if (error) return <ErrorState message={error} onRetry={fetchData} />;

        switch (activeView) {
            case 'heatmap':
                return data.heatmap?.length > 0
                    ? renderHeatmap(data.heatmap)
                    : <EmptyState icon="📊" title="Mapa de Calor" message="No hay datos de actividad disponibles" />;

            case 'overload':
                return data.overload?.length > 0
                    ? renderOverload(data.overload)
                    : <EmptyState icon="⚠️" title="Sobrecarga" message="No hay usuarios con sobrecarga detectada" />;

            case 'responseTime':
                return data.responseTime?.length > 0
                    ? renderResponseTime(data.responseTime)
                    : <EmptyState icon="⏱️" title="Tiempo de Respuesta" message="No hay datos de tiempo de respuesta" />;

            case 'timezone':
                return data.timezone?.length > 0
                    ? renderTimezone(data.timezone)
                    : <EmptyState icon="🌍" title="Zonas Horarias" message="No hay datos de colaboración entre zonas horarias" />;

            default:
                return null;
        }
    };

    const renderHeatmap = (data) => {
        return (
            <div className="temporal-view">
                <div className="stats-grid">
                    <div className="stat-card">
                        <Clock className="stat-icon" />
                        <div className="stat-content">
                            <div className="stat-label">Registros</div>
                            <div className="stat-value">{data.length}</div>
                        </div>
                    </div>
                </div>
                <div className="data-display">
                    <h3>Datos del Mapa de Calor</h3>
                    <div className="data-grid">
                        {data.slice(0, 10).map((item, index) => (
                            <div key={index} className="data-card">
                                <pre>{JSON.stringify(item, null, 2)}</pre>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    };

    const renderOverload = (data) => {
        return (
            <div className="temporal-view">
                <div className="stats-grid">
                    <div className="stat-card alert">
                        <AlertTriangle className="stat-icon" />
                        <div className="stat-content">
                            <div className="stat-label">Usuarios en Riesgo</div>
                            <div className="stat-value">{data.length}</div>
                        </div>
                    </div>
                </div>
                <div className="data-display">
                    <h3>Usuarios con Sobrecarga</h3>
                    <div className="data-grid">
                        {data.slice(0, 10).map((item, index) => (
                            <div key={index} className="data-card">
                                <pre>{JSON.stringify(item, null, 2)}</pre>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    };

    const renderResponseTime = (data) => {
        return (
            <div className="temporal-view">
                <div className="stats-grid">
                    <div className="stat-card">
                        <Timer className="stat-icon" />
                        <div className="stat-content">
                            <div className="stat-label">Departamentos</div>
                            <div className="stat-value">{data.length}</div>
                        </div>
                    </div>
                </div>
                <div className="data-display">
                    <h3>Tiempo de Respuesta por Departamento</h3>
                    <div className="data-grid">
                        {data.slice(0, 10).map((item, index) => (
                            <div key={index} className="data-card">
                                <pre>{JSON.stringify(item, null, 2)}</pre>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    };

    const renderTimezone = (data) => {
        return (
            <div className="temporal-view">
                <div className="stats-grid">
                    <div className="stat-card">
                        <Globe className="stat-icon" />
                        <div className="stat-content">
                            <div className="stat-label">Registros</div>
                            <div className="stat-value">{data.length}</div>
                        </div>
                    </div>
                </div>
                <div className="data-display">
                    <h3>Colaboración entre Zonas Horarias</h3>
                    <div className="data-grid">
                        {data.slice(0, 10).map((item, index) => (
                            <div key={index} className="data-card">
                                <pre>{JSON.stringify(item, null, 2)}</pre>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="temporal-tab">
            <div className="temporal-header">
                <div className="header-content">
                    <h2>⏰ Análisis Temporal</h2>
                    <p>Patrones de actividad y sobrecarga organizacional</p>
                </div>
            </div>

            <div className="view-selector">
                {views.map(view => (
                    <button
                        key={view.id}
                        className={`view-btn ${activeView === view.id ? 'active' : ''}`}
                        onClick={() => setActiveView(view.id)}
                    >
                        <span className="view-icon">{view.icon}</span>
                        <span className="view-label">{view.label}</span>
                    </button>
                ))}
            </div>

            <div className="temporal-content">
                {renderContent()}
            </div>
        </div>
    );
};

export default TemporalTab;
