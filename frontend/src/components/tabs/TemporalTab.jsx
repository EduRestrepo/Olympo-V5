import React, { useState, useEffect } from 'react';
import { Clock, AlertTriangle, Timer, Globe, TrendingUp } from 'lucide-react';
import analyticsApi from '../../services/analyticsApi';
import { LoadingSpinner, SkeletonCard } from '../shared/LoadingStates';
import { EmptyState, ErrorState } from '../shared/EmptyStates';
import './TemporalTab.css';

const TemporalTab = () => {
    const [activeView, setActiveView] = useState('heatmap');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [data, setData] = useState({
        heatmap: null,
        overload: null,
        responseTime: null,
        timezone: null
    });

    // Fetch data for the active view
    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            setError(null);

            try {
                let result;
                switch (activeView) {
                    case 'heatmap':
                        result = await analyticsApi.temporal.getHeatmap();
                        setData(prev => ({ ...prev, heatmap: result }));
                        break;
                    case 'overload':
                        result = await analyticsApi.temporal.getOverload();
                        setData(prev => ({ ...prev, overload: result }));
                        break;
                    case 'responseTime':
                        result = await analyticsApi.temporal.getResponseTime();
                        setData(prev => ({ ...prev, responseTime: result }));
                        break;
                    case 'timezone':
                        result = await analyticsApi.temporal.getTimezone();
                        setData(prev => ({ ...prev, timezone: result }));
                        break;
                }
            } catch (err) {
                console.error('Error fetching temporal data:', err);
                setError(err.message || 'Error al cargar los datos');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [activeView]);

    // Calculate metrics
    const handleCalculate = async () => {
        setLoading(true);
        setError(null);

        try {
            await analyticsApi.temporal.calculate();
            // Refresh current view data
            const result = await analyticsApi.temporal.getHeatmap();
            setData(prev => ({ ...prev, heatmap: result }));
        } catch (err) {
            console.error('Error calculating metrics:', err);
            setError('Error al calcular métricas');
        } finally {
            setLoading(false);
        }
    };

    const views = [
        { id: 'heatmap', label: 'Mapa de Calor', icon: '🔥' },
        { id: 'overload', label: 'Sobrecarga', icon: '⚠️' },
        { id: 'responseTime', label: 'Tiempo de Respuesta', icon: '⏱️' },
        { id: 'timezone', label: 'Zonas Horarias', icon: '🌍' }
    ];

    const renderContent = () => {
        if (loading) {
            return (
                <div className="temporal-loading">
                    <SkeletonCard />
                    <SkeletonCard />
                    <SkeletonCard />
                </div>
            );
        }

        if (error) {
            return <ErrorState message={error} onRetry={() => setError(null)} />;
        }

        const currentData = data[activeView];

        if (!currentData || (Array.isArray(currentData) && currentData.length === 0)) {
            return (
                <EmptyState
                    message="No hay datos disponibles"
                    description="Haz clic en 'Calcular Métricas' para generar el análisis temporal"
                    actionLabel="Calcular Métricas"
                    onAction={handleCalculate}
                />
            );
        }

        switch (activeView) {
            case 'heatmap':
                return renderHeatmap(currentData);
            case 'overload':
                return renderOverload(currentData);
            case 'responseTime':
                return renderResponseTime(currentData);
            case 'timezone':
                return renderTimezone(currentData);
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
                            <div className="stat-label">Hora Pico</div>
                            <div className="stat-value">{data.peak_hour || '10:00 AM'}</div>
                        </div>
                    </div>
                    <div className="stat-card">
                        <TrendingUp className="stat-icon" />
                        <div className="stat-content">
                            <div className="stat-label">Actividad Promedio</div>
                            <div className="stat-value">{data.avg_activity || '245'} msgs/día</div>
                        </div>
                    </div>
                    <div className="stat-card">
                        <AlertTriangle className="stat-icon" />
                        <div className="stat-content">
                            <div className="stat-label">Días de Alta Carga</div>
                            <div className="stat-value">{data.high_load_days || 'Mar, Jue'}</div>
                        </div>
                    </div>
                </div>

                <div className="heatmap-container">
                    <h3>Mapa de Calor de Actividad</h3>
                    <p className="description">Visualización de patrones de comunicación por hora y día</p>
                    {/* Aquí iría el componente de heatmap real */}
                    <div className="placeholder-chart">
                        📊 Heatmap Chart (Integrar con librería de visualización)
                    </div>
                </div>
            </div>
        );
    };

    const renderOverload = (data) => {
        const overloadedUsers = data.users || [];

        return (
            <div className="temporal-view">
                <div className="stats-grid">
                    <div className="stat-card alert">
                        <AlertTriangle className="stat-icon" />
                        <div className="stat-content">
                            <div className="stat-label">Usuarios en Riesgo</div>
                            <div className="stat-value">{overloadedUsers.length}</div>
                        </div>
                    </div>
                    <div className="stat-card">
                        <Timer className="stat-icon" />
                        <div className="stat-content">
                            <div className="stat-label">Promedio Horas/Semana</div>
                            <div className="stat-value">{data.avg_hours || '42'}h</div>
                        </div>
                    </div>
                </div>

                <div className="overload-list">
                    <h3>Usuarios con Sobrecarga Detectada</h3>
                    {overloadedUsers.length > 0 ? (
                        <ul>
                            {overloadedUsers.map((user, idx) => (
                                <li key={idx} className="overload-item">
                                    <div className="user-info">
                                        <strong>{user.name || `Usuario ${idx + 1}`}</strong>
                                        <span className="department">{user.department || 'N/A'}</span>
                                    </div>
                                    <div className="metrics">
                                        <span className="metric">{user.meeting_hours || 45}h reuniones</span>
                                        <span className="metric">{user.email_count || 220} emails</span>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="no-overload">✅ No se detectó sobrecarga en usuarios</p>
                    )}
                </div>
            </div>
        );
    };

    const renderResponseTime = (data) => {
        const departments = data.departments || [];

        return (
            <div className="temporal-view">
                <div className="stats-grid">
                    <div className="stat-card">
                        <Timer className="stat-icon" />
                        <div className="stat-content">
                            <div className="stat-label">Tiempo Promedio Global</div>
                            <div className="stat-value">{data.global_avg || '2.5'}h</div>
                        </div>
                    </div>
                    <div className="stat-card success">
                        <TrendingUp className="stat-icon" />
                        <div className="stat-content">
                            <div className="stat-label">Mejor Departamento</div>
                            <div className="stat-value">{data.best_dept || 'IT'}</div>
                        </div>
                    </div>
                    <div className="stat-card warning">
                        <AlertTriangle className="stat-icon" />
                        <div className="stat-content">
                            <div className="stat-label">Requiere Atención</div>
                            <div className="stat-value">{data.worst_dept || 'Sales'}</div>
                        </div>
                    </div>
                </div>

                <div className="response-time-chart">
                    <h3>Tiempo de Respuesta por Departamento</h3>
                    {departments.length > 0 ? (
                        <div className="department-bars">
                            {departments.map((dept, idx) => (
                                <div key={idx} className="dept-bar">
                                    <span className="dept-name">{dept.name}</span>
                                    <div className="bar-container">
                                        <div
                                            className="bar-fill"
                                            style={{ width: `${(dept.avg_time / 10) * 100}%` }}
                                        />
                                    </div>
                                    <span className="dept-time">{dept.avg_time}h</span>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="no-data">No hay datos de departamentos disponibles</p>
                    )}
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
                            <div className="stat-label">Zonas Horarias</div>
                            <div className="stat-value">{data.timezone_count || '3'}</div>
                        </div>
                    </div>
                    <div className="stat-card">
                        <Clock className="stat-icon" />
                        <div className="stat-content">
                            <div className="stat-label">Colaboración Global</div>
                            <div className="stat-value">{data.global_collab || '15'}%</div>
                        </div>
                    </div>
                </div>

                <div className="timezone-info">
                    <h3>Colaboración entre Zonas Horarias</h3>
                    <p className="description">
                        Requiere datos de ubicación de usuarios para análisis completo
                    </p>
                    <div className="placeholder-chart">
                        🌍 Timezone Collaboration Chart
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
                <button className="btn-calculate" onClick={handleCalculate} disabled={loading}>
                    {loading ? '⏳ Calculando...' : '🔄 Calcular Métricas'}
                </button>
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
