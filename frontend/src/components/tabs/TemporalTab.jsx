import React, { useState, useEffect } from 'react';
import { Clock, AlertTriangle, Timer, Globe, TrendingUp, User, Users } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import analyticsApi from '../../services/analyticsApi';
import { LoadingSpinner } from '../shared/LoadingStates';
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
        { id: 'heatmap', label: 'Mapa de Calor', icon: <Clock size={18} /> },
        { id: 'overload', label: 'Sobrecarga', icon: <AlertTriangle size={18} /> },
        { id: 'responseTime', label: 'Tiempo de Respuesta', icon: <Timer size={18} /> },
        { id: 'timezone', label: 'Zonas Horarias', icon: <Globe size={18} /> }
    ];

    useEffect(() => {
        loadAllData();
    }, []);

    const loadAllData = async () => {
        if (dataLoaded) return;

        setLoading(true);
        setError(null);

        try {
            const [heatmap, overload, responseTime, timezone] = await Promise.all([
                analyticsApi.temporal.getHeatmap(),
                analyticsApi.temporal.getOverload(),
                analyticsApi.temporal.getResponseTime(),
                analyticsApi.temporal.getTimezone()
            ]);

            const needsCalculation =
                !heatmap || heatmap.length === 0 ||
                !overload || overload.length === 0 ||
                !responseTime || responseTime.length === 0 ||
                !timezone || timezone.length === 0;

            if (needsCalculation) {
                setCalculating(true);
                setLoading(false);
                await analyticsApi.temporal.calculate();
                setCalculating(false);
                setLoading(true);

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

    const renderHeatmap = (heatmapData) => {
        // Prepare grid data 24h x 7days
        // Assuming heatmapData has day_of_week (0-6) and hour_of_day (0-23) and activity_count

        const days = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
        const hours = Array.from({ length: 24 }, (_, i) => i);

        // Normalize data for grid
        const getIntensity = (day, hour) => {
            const point = heatmapData.find(d => d.day_of_week === day && d.hour_of_day === hour);
            return point ? point.activity_count : 0;
        };

        const maxActivity = Math.max(...heatmapData.map(d => d.activity_count), 1);

        return (
            <div className="temporal-view">
                <div className="stats-grid">
                    <div className="stat-card">
                        <Clock className="stat-icon" />
                        <div className="stat-content">
                            <div className="stat-label">Total Actividades</div>
                            <div className="stat-value">{heatmapData.reduce((acc, curr) => acc + curr.activity_count, 0).toLocaleString()}</div>
                        </div>
                    </div>
                </div>

                <div className="heatmap-container">
                    <h3>Intensidad de Actividad Semanal</h3>
                    <div className="heatmap-grid">
                        <div className="heatmap-header"></div>
                        {hours.map(h => (
                            <div key={`header-${h}`} className="heatmap-header-cell">{h}h</div>
                        ))}

                        {days.map((dayName, dayIndex) => (
                            <React.Fragment key={dayIndex}>
                                <div className="heatmap-row-label">{dayName}</div>
                                {hours.map(hour => {
                                    const value = getIntensity(dayIndex, hour); // 0 = Sun, 1 = Mon... check DB usually 0=Sun or 1=Sun
                                    const opacity = value / maxActivity;
                                    return (
                                        <div
                                            key={`${dayIndex}-${hour}`}
                                            className="heatmap-cell"
                                            style={{ backgroundColor: `rgba(0, 122, 255, ${opacity || 0.05})` }}
                                            title={`${dayName} ${hour}:00 - ${value} actividades`}
                                        >
                                            {value > 0 && <span className="cell-tooltip">{value}</span>}
                                        </div>
                                    );
                                })}
                            </React.Fragment>
                        ))}
                    </div>
                    <div className="heatmap-legend">
                        <span>Menos Actividad</span>
                        <div className="legend-gradient"></div>
                        <span>Más Actividad</span>
                    </div>
                </div>
            </div>
        );
    };

    const renderOverload = (overloadData) => {
        const sortedData = [...overloadData].sort((a, b) => parseFloat(b.overload_score) - parseFloat(a.overload_score));
        const highRisk = sortedData.filter(u => u.risk_level === 'high').length;

        return (
            <div className="temporal-view">
                <div className="stats-grid">
                    <div className="stat-card danger">
                        <AlertTriangle className="stat-icon" />
                        <div className="stat-content">
                            <div className="stat-label">Usuarios en Riesgo Alto</div>
                            <div className="stat-value">{highRisk}</div>
                        </div>
                    </div>
                    <div className="stat-card">
                        <Users className="stat-icon" />
                        <div className="stat-content">
                            <div className="stat-label">Usuarios Analizados</div>
                            <div className="stat-value">{overloadData.length}</div>
                        </div>
                    </div>
                </div>

                <div className="overload-list">
                    <h3>Top Usuarios con Sobrecarga</h3>
                    <div className="users-list-header">
                        <span>Usuario</span>
                        <span>Departamento</span>
                        <span>Nivel de Riesgo</span>
                        <span>Score de Sobrecarga</span>
                    </div>
                    <div className="users-scroll-container">
                        {sortedData.map((user, index) => (
                            <div key={index} className={`user-card-row risk-${user.risk_level}`}>
                                <div className="user-info">
                                    <div className="user-avatar">{user.name.charAt(0)}</div>
                                    <div>
                                        <div className="user-name">{user.name}</div>
                                        <div className="user-email">{user.email}</div>
                                    </div>
                                </div>
                                <div className="user-dept">{user.department}</div>
                                <div className="user-risk">
                                    <span className={`risk-badge ${user.risk_level}`}>
                                        {user.risk_level === 'high' ? 'Alto' : user.risk_level === 'medium' ? 'Medio' : 'Bajo'}
                                    </span>
                                </div>
                                <div className="user-score">
                                    <div className="score-bar-bg">
                                        <div
                                            className="score-bar-fill"
                                            style={{
                                                width: `${Math.min(parseFloat(user.overload_score) * 10, 100)}%`,
                                                backgroundColor: user.risk_level === 'high' ? '#ff3b30' : '#ff9500'
                                            }}
                                        ></div>
                                    </div>
                                    <span>{user.overload_score}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    };

    const renderResponseTime = (responseData) => {
        // Transform data for chart if needed
        const chartData = responseData.map(item => ({
            department: item.department,
            hours: parseFloat(item.avg_response_hours)
        })).sort((a, b) => b.hours - a.hours).slice(0, 12); // Top 12 slowest

        return (
            <div className="temporal-view">
                <div className="stats-grid">
                    <div className="stat-card">
                        <Timer className="stat-icon" />
                        <div className="stat-content">
                            <div className="stat-label">Promedio General</div>
                            <div className="stat-value">
                                {(responseData.reduce((acc, curr) => acc + parseFloat(curr.avg_response_hours), 0) / (responseData.length || 1)).toFixed(1)}h
                            </div>
                        </div>
                    </div>
                </div>

                <div className="chart-container">
                    <h3>Tiempos de Respuesta Promedio por Departamento</h3>
                    <div style={{ width: '100%', height: 400 }}>
                        <ResponsiveContainer>
                            <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 50 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#333" />
                                <XAxis
                                    dataKey="department"
                                    angle={-45}
                                    textAnchor="end"
                                    height={100}
                                    stroke="#888"
                                    fontSize={12}
                                />
                                <YAxis stroke="#888" label={{ value: 'Horas', angle: -90, position: 'insideLeft', fill: '#888' }} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#1e1e1e', borderColor: '#333', color: '#fff' }}
                                    cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                                />
                                <Bar dataKey="hours" name="Horas Promedio" radius={[4, 4, 0, 0]}>
                                    {chartData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.hours > 24 ? '#ff3b30' : '#007aff'} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        );
    };

    const renderTimezone = (timezoneData) => {
        return (
            <div className="temporal-view">
                <div className="stats-grid">
                    <div className="stat-card">
                        <Globe className="stat-icon" />
                        <div className="stat-content">
                            <div className="stat-label">Total Conexiones Cross-Border</div>
                            <div className="stat-value">{timezoneData.reduce((acc, curr) => acc + parseInt(curr.interaction_count || 0), 0)}</div>
                        </div>
                    </div>
                </div>

                <div className="data-display">
                    <h3>Colaboración entre Regiones/Zonas</h3>
                    <div className="timezone-list">
                        {timezoneData.map((item, index) => (
                            <div key={index} className="timezone-card">
                                <div className="tz-route">
                                    <div className="tz-badge">{item.source_region || 'N/A'}</div>
                                    <div className="tz-line"></div>
                                    <div className="tz-badge">{item.target_region || 'N/A'}</div>
                                </div>
                                <div className="tz-stats">
                                    <span className="tz-count">{item.interaction_count}</span>
                                    <span className="tz-label">interacciones</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    };

    const renderContent = () => {
        if (calculating) {
            return (
                <div className="calculating-state">
                    <LoadingSpinner message="🔄 Calculando métricas por primera vez..." />
                    <p className="calculating-info">
                        Esto puede tardar unos segundos. Los datos se están generando automáticamente con IA.
                    </p>
                </div>
            );
        }

        if (loading) return <LoadingSpinner message="Cargando análisis visual..." />;
        if (error) return <ErrorState message={error} onRetry={loadAllData} />;

        switch (activeView) {
            case 'heatmap': return data.heatmap?.length > 0 ? renderHeatmap(data.heatmap) : <EmptyState icon="📊" title="Sin datos" message="No hay actividad registrada" />;
            case 'overload': return data.overload?.length > 0 ? renderOverload(data.overload) : <EmptyState icon="✅" title="Todo bien" message="No se detectaron usuarios con sobrecarga" />;
            case 'responseTime': return data.responseTime?.length > 0 ? renderResponseTime(data.responseTime) : <EmptyState icon="⏱️" title="Sin datos" message="Faltan datos de respuesta" />;
            case 'timezone': return data.timezone?.length > 0 ? renderTimezone(data.timezone) : <EmptyState icon="🌍" title="Sin datos" message="No hay colaboraciones internacionales" />;
            default: return null;
        }
    };

    return (
        <div className="temporal-tab">
            <div className="temporal-header">
                <div>
                    <h2>⏰ Análisis Temporal</h2>
                    <p>Patrones de actividad y sobrecarga organizacional</p>
                </div>
            </div>

            <div className="view-selector">
                {views.map(view => (
                    <button
                        key={view.id}
                        className={`view-button ${activeView === view.id ? 'active' : ''}`}
                        onClick={() => setActiveView(view.id)}
                    >
                        <span className="view-icon-wrapper">{view.icon}</span>
                        {view.label}
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
