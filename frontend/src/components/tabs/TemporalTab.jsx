import React, { useState, useEffect } from 'react';
import { Clock, AlertTriangle, Timer, Globe, TrendingUp, User, Users } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import analyticsApi from '../../services/analyticsApi';
import { LoadingSpinner } from '../shared/LoadingStates';
import { EmptyState, ErrorState } from '../shared/EmptyStates';
import './TemporalTab.css';

// Add styles for disclaimer
const disclaimerStyle = `
.view-disclaimer {
    margin-top: 32px;
    padding: 24px;
    background-color: rgba(10, 132, 255, 0.1);
    border: 1px solid rgba(10, 132, 255, 0.2);
    border-radius: 8px;
    font-size: 0.95rem;
    color: #e0e0e0;
    line-height: 1.6;
    display: flex;
    align-items: flex-start;
    gap: 12px;
}
.view-disclaimer strong {
    color: #4da3ff;
    font-weight: 600;
}`;

// Inject styles
if (!document.getElementById('temporal-disclaimer-styles')) {
    const style = document.createElement('style');
    style.id = 'temporal-disclaimer-styles';
    style.innerHTML = disclaimerStyle;
    document.head.appendChild(style);
}

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
    const [overloadFilter, setOverloadFilter] = useState('all');

    const views = [
        { id: 'heatmap', label: 'Mapa de Calor', icon: <Clock size={18} /> },
        { id: 'overload', label: 'Sobrecarga', icon: <AlertTriangle size={18} /> },
        { id: 'responseTime', label: 'Tiempo de Respuesta', icon: <Timer size={18} /> },
        { id: 'timezone', label: 'Interacción ', icon: <Globe size={18} /> }
    ];

    useEffect(() => {
        console.log('Temporal Tab Visuals v2 Loaded');
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

    const handleRecalculate = async () => {
        setCalculating(true);
        setError(null);
        try {
            await analyticsApi.temporal.calculate();

            // Force re-fetch of all data
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
        } catch (err) {
            console.error('Error recalculating:', err);
            setError('Error al recalcular las métricas');
        } finally {
            setCalculating(false);
        }
    };

    const renderHeatmap = (heatmapData) => {
        // Pre-process and aggregate data
        // Backend returns: { activity_date, hour_of_day, total_activity }
        const aggregatedData = {}; // Key: "dayIndex-hour", Value: count
        let totalActivity = 0;

        heatmapData.forEach(item => {
            // Support both old and new field names for robustness
            const count = parseInt(item.total_activity || item.activity_count || 0, 10);

            let dayIndex;
            if (item.day_of_week !== undefined) {
                dayIndex = parseInt(item.day_of_week, 10);
            } else if (item.activity_date) {
                // Parse "YYYY-MM-DD" to get day of week (0=Sunday)
                // Note: new Date("YYYY-MM-DD") is UTC, which is generally what we want here
                const date = new Date(item.activity_date);
                dayIndex = date.getUTCDay();
            } else {
                return; // Skip invalid
            }

            const hour = parseInt(item.hour_of_day, 10);
            const key = `${dayIndex}-${hour}`;

            aggregatedData[key] = (aggregatedData[key] || 0) + count;
            totalActivity += count;
        });

        const days = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
        const hours = Array.from({ length: 24 }, (_, i) => i);

        // Max for normalization
        const maxActivity = Math.max(...Object.values(aggregatedData), 1);

        const getIntensity = (day, hour) => {
            return aggregatedData[`${day}-${hour}`] || 0;
        };

        return (
            <div className="temporal-view">
                <div className="stats-grid">
                    <div className="stat-card">
                        <Clock className="stat-icon" />
                        <div className="stat-content">
                            <div className="stat-label">Total Actividades</div>
                            <div className="stat-value">{totalActivity.toLocaleString()}</div>
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
                                        <HeatmapCell
                                            key={`${dayIndex}-${hour}`}
                                            value={value}
                                            max={maxActivity}
                                        />
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
                <div className="view-disclaimer">
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <p><strong>💡 Interpretación:</strong> Este mapa muestra la intensidad de actividad acumulada por hora. Los colores más intensos indican mayor volumen de trabajo.</p>
                        <p style={{ fontSize: '0.85em', color: '#a1a1a6', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '8px' }}>
                            <strong>ℹ️ Nota Técnica:</strong> Las <em>Reuniones</em> se visualizan en su horario real exacto. Los <em>Emails y Chats</em> (origen Office 365) se distribuyen estimativamente a lo largo de la jornada laboral estándar (08:00-18:00) al no disponer de hora exacta en el origen de datos.
                        </p>
                    </div>
                </div>
            </div >
        );
    };

    const renderOverload = (overloadData) => {
        let filteredData = overloadData;
        if (overloadFilter !== 'all') {
            filteredData = overloadData.filter(u => u.risk_level === overloadFilter);
        }

        const sortedData = [...filteredData].sort((a, b) => parseFloat(b.overload_score) - parseFloat(a.overload_score));
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
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                        <h3>Top Usuarios con Sobrecarga</h3>
                        <div className="risk-filters" style={{ display: 'flex', gap: '8px' }}>
                            <button
                                className={`filter-btn ${overloadFilter === 'all' ? 'active' : ''}`}
                                onClick={() => setOverloadFilter('all')}
                                style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid #333', background: overloadFilter === 'all' ? '#0a84ff' : 'transparent', color: '#fff', cursor: 'pointer' }}
                            >
                                Todos
                            </button>
                            <button
                                className={`filter-btn ${overloadFilter === 'high' ? 'active' : ''}`}
                                onClick={() => setOverloadFilter('high')}
                                style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid #ff3b30', background: overloadFilter === 'high' ? 'rgba(255, 59, 48, 0.2)' : 'transparent', color: '#ff3b30', cursor: 'pointer' }}
                            >
                                Riesgo Alto
                            </button>
                            <button
                                className={`filter-btn ${overloadFilter === 'medium' ? 'active' : ''}`}
                                onClick={() => setOverloadFilter('medium')}
                                style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid #ff9500', background: overloadFilter === 'medium' ? 'rgba(255, 149, 0, 0.2)' : 'transparent', color: '#ff9500', cursor: 'pointer' }}
                            >
                                Medio
                            </button>
                        </div>
                    </div>
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
                <div className="view-disclaimer">
                    <p><strong>💡 Interpretación:</strong> Usuarios con indicadores de riesgo de burnout basados en reuniones excesivas y actividad fuera de horario. Un score alto sugiere necesidad de intervención o redistribución de carga.</p>
                </div>
            </div>
        );
    };

    const renderResponseTime = (responseData) => {
        // Transform data for chart if needed
        const chartData = responseData.map(item => ({
            department: item.department,
            hours: parseFloat(item.dept_avg_response_hours || item.avg_response_hours || 0)
        })).sort((a, b) => b.hours - a.hours).slice(0, 12); // Top 12 slowest

        return (
            <div className="temporal-view">
                <div className="stats-grid">
                    <div className="stat-card">
                        <Timer className="stat-icon" />
                        <div className="stat-content">
                            <div className="stat-label">Promedio General</div>
                            <div className="stat-value">
                                {(responseData.reduce((acc, curr) => acc + parseFloat(curr.dept_avg_response_hours || curr.avg_response_hours || 0), 0) / (responseData.length || 1)).toFixed(1)}h
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
                <div className="view-disclaimer">
                    <p><strong>💡 Interpretación:</strong> Promedio de tiempo que tarda cada departamento en responder. Tiempos muy altos pueden indicar cuellos de botella; tiempos cercanos a cero pueden sugerir interrupciones constantes y falta de tiempo de enfoque.</p>
                </div>
            </div>
        );
    };

    const renderTimezone = (timezoneData) => {
        // Group by Source Region
        const grouped = timezoneData.reduce((acc, curr) => {
            const source = curr.source_region || 'Unknown';
            if (!acc[source]) acc[source] = [];
            acc[source].push(curr);
            return acc;
        }, {});

        return (
            <div className="temporal-view">
                <div className="stats-grid">
                    <div className="stat-card">
                        <Globe className="stat-icon" />
                        <div className="stat-content">
                            <div className="stat-label">Total Conexiones Inter-Departamentales</div>
                            <div className="stat-value">{timezoneData.reduce((acc, curr) => acc + parseInt(curr.interaction_count || 0), 0)}</div>
                        </div>
                    </div>
                </div>

                <div className="data-display" style={{ marginTop: '24px' }}>
                    <h3 style={{ marginBottom: '20px' }}>Flujos de Trabajo entre Departamentos</h3>
                    <div className="timezone-grid-layout" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
                        {Object.entries(grouped).map(([source, targets]) => (
                            <div key={source} className="region-card" style={{ backgroundColor: '#1c1c1e', padding: '20px', borderRadius: '12px', border: '1px solid #333' }}>
                                <h4 style={{ color: '#fff', borderBottom: '1px solid #333', paddingBottom: '10px', marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#0a84ff' }}></span>
                                    {source}
                                </h4>
                                <div className="targets-list" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                    {targets.sort((a, b) => b.interaction_count - a.interaction_count).map((t, idx) => (
                                        <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.9rem' }}>
                                            <span style={{ color: '#a1a1a6' }}>→ {t.target_region}</span>
                                            <span style={{ color: '#fff', fontWeight: 'bold', backgroundColor: 'rgba(255,255,255,0.1)', padding: '2px 8px', borderRadius: '4px' }}>
                                                {t.interaction_count}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
                <div className="view-disclaimer">
                    <p><strong>💡 Interpretación:</strong> Visualiza el flujo de colaboración entre distintas "regiones" o departamentos. Ayuda a entender si los equipos distribuidos están conectados o si existen silos geográficos.</p>
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
                <button
                    className="recalculate-button"
                    onClick={handleRecalculate}
                    disabled={calculating || loading}
                    style={{
                        padding: '8px 16px',
                        backgroundColor: '#2c2c2e',
                        border: '1px solid #3a3a3c',
                        borderRadius: '6px',
                        color: '#fff',
                        cursor: calculating ? 'not-allowed' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        transition: 'all 0.2s ease'
                    }}
                >
                    <TrendingUp size={16} />
                    {calculating ? 'Calculando...' : 'Recalcular Métricas'}
                </button>
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


const HeatmapCell = ({ value, max }) => {
    const intensity = value / (max || 1);
    const opacity = 0.1 + (intensity * 0.9); // Min 0.1 opacity

    // Original Blue Grid Style
    const color = `rgba(10, 132, 255, ${opacity})`;

    return (
        <div
            className="heatmap-cell"
            style={{
                backgroundColor: color,
                // Add a subtle glow for high intensity cells
                boxShadow: intensity > 0.7 ? `0 0 10px rgba(10, 132, 255, 0.5)` : 'none',
                borderRadius: '4px' // Slightly rounded corners for the square
            }}
        >
            <div className="cell-tooltip">
                {value} actividades
            </div>
        </div>
    );
};

export default TemporalTab;
