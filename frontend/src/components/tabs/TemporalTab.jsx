import React, { useState, useEffect } from 'react';

import { Clock, AlertTriangle, Timer, Globe, TrendingUp, User, Users, Activity, Info } from 'lucide-react';
import { BarChart, Bar, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
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

    // Filtros
    const [overloadFilter, setOverloadFilter] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedDep, setSelectedDep] = useState('all');

    const views = [
        { id: 'heatmap', label: 'Análisis de Actividad', icon: <Activity size={18} /> },
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

    const HeatmapCell = ({ data, opacity }) => {
        const { total, email, meeting } = data;

        // Dynamic color: transition from dark to bright cyan
        const backgroundColor = total > 0 ? `rgba(10, 132, 255, ${Math.min(1, opacity * 1.2)})` : 'rgba(255, 255, 255, 0.03)';

        return (
            <div
                className="heatmap-cell"
                style={{
                    height: '28px',
                    backgroundColor,
                    boxShadow: opacity > 0.8 ? `0 0 10px rgba(10, 132, 255, 0.5)` : 'none',
                    borderRadius: '4px',
                    border: '1px solid rgba(255,255,255,0.05)',
                    position: 'relative',
                    transition: 'all 0.2s ease',
                    cursor: 'pointer'
                }}
            >
                <div className="cell-tooltip" style={{
                    position: 'absolute',
                    bottom: '100%',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    backgroundColor: '#1c1c1e',
                    border: '1px solid #444',
                    borderRadius: '8px',
                    padding: '10px',
                    width: '160px',
                    pointerEvents: 'none',
                    zIndex: 100,
                    opacity: 0,
                    transition: 'opacity 0.2s ease',
                    marginBottom: '8px',
                    boxShadow: '0 10px 20px rgba(0,0,0,0.4)',
                    textAlign: 'left'
                }}>
                    <div style={{ color: '#0a84ff', fontWeight: 'bold', marginBottom: '6px', fontSize: '0.85rem' }}>Detalle de Actividad</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '0.8rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ color: '#888' }}>Emails:</span>
                            <span style={{ color: '#fff' }}>{email}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ color: '#888' }}>Reuniones:</span>
                            <span style={{ color: '#30d158' }}>{meeting}</span>
                        </div>
                        <div style={{ height: '1px', background: '#333', margin: '4px 0' }} />
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold' }}>
                            <span style={{ color: '#fff' }}>Total:</span>
                            <span style={{ color: '#fff' }}>{total}</span>
                        </div>
                    </div>
                </div>

                <style dangerouslySetInnerHTML={{
                    __html: `
                    .heatmap-cell:hover { transform: scale(1.15); z-index: 10; border-color: rgba(255,255,255,0.3) !important; }
                    .heatmap-cell:hover .cell-tooltip { opacity: 1 !important; }
                `}} />
            </div>
        );
    };

    const renderCombinedActivity = (heatmapData) => {
        const days = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
        const dayOrder = [1, 2, 3, 4, 5, 6, 0]; // Mon->Sun

        const timelineData = [];
        dayOrder.forEach(dayIndex => {
            for (let h = 0; h < 24; h++) {
                timelineData.push({
                    dayIndex,
                    dayName: days[dayIndex],
                    hour: h,
                    timeLabel: `${days[dayIndex]} ${h}:00`,
                    value: 0
                });
            }
        });

        // --- 1. Processing Logic ---
        const aggregatedHeatmap = {}; // Key: "dayIndex-hour" -> { total, email, meeting }
        let totalActivity = 0;
        let maxHeatmapValue = 1;

        heatmapData.forEach(item => {
            const email = parseInt(item.email_count || 0, 10);
            const meeting = parseInt(item.meeting_count || 0, 10);
            const count = email + meeting;
            totalActivity += count;

            let dIndex;
            if (item.day_of_week !== undefined) {
                dIndex = parseInt(item.day_of_week, 10);
            } else if (item.activity_date) {
                const date = new Date(item.activity_date);
                dIndex = date.getUTCDay();
            } else {
                return;
            }
            const hour = parseInt(item.hour_of_day, 10);

            // Populate Timeline (Rhythm)
            const dayPos = dayOrder.indexOf(dIndex);
            if (dayPos !== -1) {
                const flatIndex = (dayPos * 24) + hour;
                if (timelineData[flatIndex]) {
                    timelineData[flatIndex].value += count;
                }
            }

            // Populate Heatmap
            const key = `${dIndex}-${hour}`;
            if (!aggregatedHeatmap[key]) {
                aggregatedHeatmap[key] = { total: 0, email: 0, meeting: 0 };
            }
            aggregatedHeatmap[key].total += count;
            aggregatedHeatmap[key].email += email;
            aggregatedHeatmap[key].meeting += meeting;
        });

        const heatValues = Object.values(aggregatedHeatmap).map(v => v.total).sort((a, b) => a - b);
        if (heatValues.length > 0) {
            maxHeatmapValue = heatValues[Math.floor(heatValues.length * 0.95)] || 1;
        }
        maxHeatmapValue = Math.max(maxHeatmapValue, 1);

        const hours = Array.from({ length: 24 }, (_, i) => i);

        return (
            <div className="temporal-view">
                <div className="stats-grid">
                    <div className="stat-card">
                        <Activity className="stat-icon" />
                        <div className="stat-content">
                            <div className="stat-label">Total Actividades</div>
                            <div className="stat-value">{totalActivity.toLocaleString()}</div>
                        </div>
                    </div>
                </div>

                <div className="chart-container" style={{ marginTop: '24px', background: '#1c1c1e', padding: '24px', borderRadius: '16px', border: '1px solid #333' }}>
                    <h3 style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Activity size={20} color="#0a84ff" />
                        Ritmo Semanal (Volumen Agregado)
                    </h3>
                    <div style={{ width: '100%', height: 300 }}>
                        <ResponsiveContainer>
                            <AreaChart data={timelineData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#0a84ff" stopOpacity={0.5} />
                                        <stop offset="95%" stopColor="#0a84ff" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                                <XAxis
                                    dataKey="timeLabel"
                                    interval={23}
                                    stroke="#888"
                                    tickFormatter={(val) => val.split(' ')[0]}
                                    fontSize={12}
                                />
                                <YAxis stroke="#888" />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#1c1c1e', borderRadius: '12px', border: '1px solid #333', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}
                                    itemStyle={{ color: '#fff' }}
                                    labelStyle={{ color: '#0a84ff', marginBottom: '8px' }}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="value"
                                    stroke="#0a84ff"
                                    strokeWidth={3}
                                    fillOpacity={1}
                                    fill="url(#colorValue)"
                                    name="Interacciones"
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="heatmap-box" style={{
                    marginTop: '32px',
                    background: '#1c1c1e',
                    padding: '24px',
                    borderRadius: '16px',
                    border: '1px solid #333',
                    overflow: 'hidden'
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                        <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Clock size={20} color="#0a84ff" />
                            Mapa de Calor de Disponibilidad
                        </h3>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '0.8rem', color: '#888' }}>
                            <span>Manual</span>
                            <div style={{ display: 'flex', gap: '4px' }}>
                                {[0.1, 0.3, 0.6, 0.9, 1.0].map(op => (
                                    <div key={op} style={{ width: '12px', height: '12px', borderRadius: '2px', background: `rgba(10, 132, 255, ${op})` }} />
                                ))}
                            </div>
                            <span>Intenso</span>
                        </div>
                    </div>

                    <div style={{ overflowX: 'auto', paddingBottom: '12px' }} className="custom-scrollbar">
                        <div style={{ minWidth: '900px' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '60px repeat(24, 1fr)', gap: '6px' }}>
                                <div />
                                {hours.map(h => (
                                    <div key={`h-${h}`} style={{ textAlign: 'center', fontSize: '0.75rem', color: '#666', fontWeight: '500' }}>{h}h</div>
                                ))}

                                {dayOrder.map(dayIndex => (
                                    <React.Fragment key={dayIndex}>
                                        <div style={{ fontSize: '0.85rem', color: '#fff', display: 'flex', alignItems: 'center', fontWeight: '600' }}>{days[dayIndex]}</div>
                                        {hours.map(hour => {
                                            const dataItem = aggregatedHeatmap[`${dayIndex}-${hour}`] || { total: 0, email: 0, meeting: 0 };
                                            const logValue = Math.log(dataItem.total + 1);
                                            const logMax = Math.log(maxHeatmapValue + 1);
                                            const opacity = logMax > 0 ? (logValue / logMax) : 0;

                                            return (
                                                <HeatmapCell
                                                    key={`${dayIndex}-${hour}`}
                                                    data={dataItem}
                                                    max={maxHeatmapValue}
                                                    opacity={opacity}
                                                />
                                            );
                                        })}
                                    </React.Fragment>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div style={{ marginTop: '20px', display: 'flex', gap: '24px', fontSize: '0.85rem', color: '#888' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#0a84ff' }} />
                            <span>Emails distribuidos (Heurístico)</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#30d158' }} />
                            <span>Reuniones Teams (Tiempo Real)</span>
                        </div>
                    </div>
                </div>

                <style dangerouslySetInnerHTML={{
                    __html: `
                    .custom-scrollbar::-webkit-scrollbar { height: 6px; }
                    .custom-scrollbar::-webkit-scrollbar-track { background: rgba(255,255,255,0.05); border-radius: 10px; }
                    .custom-scrollbar::-webkit-scrollbar-thumb { background: #333; border-radius: 10px; }
                    .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #444; }
                `}} />
                <div className="view-disclaimer">
                    <Info size={20} style={{ color: '#0a84ff', flexShrink: 0, marginTop: '2px' }} />
                    <div>
                        <p style={{ margin: '0 0 8px 0' }}><strong>💡 Vista de Actividad:</strong> Este mapa de calor visualiza la intensidad de la colaboración digital (correos y reuniones). Las celdas más brillantes indican momentos de alta demanda.</p>
                        <div style={{ fontSize: '0.85rem', opacity: 0.8, borderTop: '1px solid rgba(10, 132, 255, 0.1)', paddingTop: '8px' }}>
                            <strong>Privacidad:</strong> Los emails se distribuyen heurísticamente para proteger la privacidad. Solo se analiza el "cuándo" y "quién", nunca el contenido.
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    const renderOverload = (rawOverloadData) => {
        try {
            if (!rawOverloadData || !Array.isArray(rawOverloadData)) return <EmptyState icon="⚠️" title="Error de Datos" message="Formato de datos inválido" />;

            // Filter out any potential null/undefined items from the array
            const overloadData = rawOverloadData.filter(item => item && typeof item === 'object');

            // Extract unique departments safely
            const departments = ['all', ...new Set(overloadData.map(u => u?.department || 'Sin Dept'))];

            let filteredData = overloadData.filter(user => {
                const userName = user?.name || '';
                const userEmail = user?.email || '';
                const userDept = user?.department || 'Sin Dept';
                const userRisk = user?.risk_level;

                const matchesRisk = overloadFilter === 'all' || userRisk === overloadFilter;
                const matchesSearch = userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    userEmail.toLowerCase().includes(searchTerm.toLowerCase());
                const matchesDep = selectedDep === 'all' || userDept === selectedDep;
                return matchesRisk && matchesSearch && matchesDep;
            });

            const sortedData = [...filteredData].sort((a, b) => parseFloat(b?.overload_score || 0) - parseFloat(a?.overload_score || 0));
            const highRisk = overloadData.filter(u => u?.risk_level === 'high').length;

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
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
                            <h3>Top Usuarios con Sobrecarga</h3>
                            <div className="filters-container" style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                                <select
                                    value={selectedDep}
                                    onChange={(e) => setSelectedDep(e.target.value)}
                                    style={{ padding: '6px', borderRadius: '6px', border: '1px solid #333', background: '#1c1c1e', color: '#fff' }}
                                >
                                    {departments.map(dep => (
                                        <option key={dep} value={dep}>{dep === 'all' ? 'Todos Depts' : dep}</option>
                                    ))}
                                </select>

                                <input
                                    type="text"
                                    placeholder="Buscar usuario..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid #333', background: '#1c1c1e', color: '#fff', width: '200px' }}
                                />

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
                                        <div className="user-avatar">{String(user.name || '?').charAt(0)}</div>
                                        <div>
                                            <div className="user-name">{user.name || 'Desconocido'}</div>
                                            <div className="user-email">{user.email || 'Sin email'}</div>
                                        </div>
                                    </div>
                                    <div className="user-dept">{user.department || 'Sin Dept'}</div>
                                    <div className="user-risk">
                                        <span className={`risk-badge ${user.risk_level}`}>
                                            {user.risk_level === 'high' ? 'Alto' : user.risk_level === 'medium' ? 'Medio' : 'Bajo'}
                                        </span>
                                    </div>
                                    <div className="user-score">
                                        <div className="score-bar-bg" title={`Score: ${parseFloat(user.overload_score || 0).toFixed(1)}`}>
                                            {/* Simplified title to avoid interpolation errors */}
                                            <div
                                                className="score-bar-fill"
                                                style={{
                                                    width: `${Math.min(parseFloat(user.overload_score || 0), 100)}%`,
                                                    backgroundColor: user.risk_level === 'high' ? '#ff3b30' : user.risk_level === 'medium' ? '#ff9500' : '#30d158'
                                                }}
                                            ></div>
                                        </div>
                                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                                            <span style={{ fontWeight: 'bold' }}>{parseFloat(user.overload_score || 0).toFixed(1)}</span>
                                            <span style={{ fontSize: '10px', color: '#888' }}>
                                                {user.total_meetings || 0} rec
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="view-disclaimer">
                        <Info size={20} style={{ color: '#0a84ff', flexShrink: 0, marginTop: '2px' }} />
                        <div>
                            <p style={{ margin: '0 0 8px 0' }}><strong>💡 Score de Sobrecarga:</strong> Índice compuesto que pondera volumen de trabajo, reuniones y actividad fuera de horario. Un riesgo 'Alto' sugiere saturación sostenida.</p>
                            <div style={{ fontSize: '0.85rem', opacity: 0.8, borderTop: '1px solid rgba(10, 132, 255, 0.1)', paddingTop: '8px' }}>
                                <strong>Análisis:</strong> Basado en patrones de actividad detectados en los últimos 30 días mediante Microsoft Graph.
                            </div>
                        </div>
                    </div>
                </div>
            );
        } catch (error) {
            console.error("Overload Render Crash:", error);
            return (
                <div style={{ padding: '24px', color: '#ff3b30', background: 'rgba(255, 59, 48, 0.1)', borderRadius: '8px' }}>
                    <h3>💥 Error Crítico Visualizando Sobrecarga</h3>
                    <p style={{ fontFamily: 'monospace' }}>{error.message}</p>
                    <p>Por favor, reporta este mensaje.</p>
                </div>
            );
        }
    };

    const renderResponseTime = (responseData) => {
        // --- 1. Top Section: Aggregated Metrics ---
        const totalUsers = responseData.length || 1;
        const totalResponses = responseData.reduce((acc, curr) => acc + parseInt(curr.total_responses || curr.response_count || 0), 0);
        const avgResponseHours = responseData.reduce((acc, curr) => acc + parseFloat(curr.dept_avg_response_hours || curr.avg_response_hours || 0), 0) / totalUsers;

        // --- 2. Bar Chart Data (Top Departments by Delay) ---
        const chartData = responseData.map(item => ({
            department: item.department || 'Sin Dept',
            hours: parseFloat(item.dept_avg_response_hours || item.avg_response_hours || 0),
            fast: parseInt(item.total_fast_responses || item.fast_responses || 0),
            slow: parseInt(item.total_slow_responses || item.slow_responses || 0),
            total: parseInt(item.total_responses || item.response_count || 1)
        })).sort((a, b) => b.hours - a.hours).slice(0, 10);

        // --- 3. Distribution Logic (Global % of responses) ---
        const globalFast = responseData.reduce((acc, curr) => acc + parseInt(curr.total_fast_responses || curr.fast_responses || 0), 0);
        const globalSlow = responseData.reduce((acc, curr) => acc + parseInt(curr.total_slow_responses || curr.slow_responses || 0), 0);
        const globalNormal = totalResponses - (globalFast + globalSlow);

        const distributionData = [
            { name: 'Rápida (<1h)', value: globalFast, color: '#30d158' },
            { name: 'Normal (1-4h)', value: Math.max(0, globalNormal), color: '#0a84ff' },
            { name: 'Lenta (>4h)', value: globalSlow, color: '#ff3b30' }
        ];

        return (
            <div className="temporal-view">
                <div className="stats-grid">
                    <div className="stat-card">
                        <Timer className="stat-icon" />
                        <div className="stat-content">
                            <div className="stat-label">Latencia Promedio</div>
                            <div className="stat-value">{avgResponseHours.toFixed(1)}h</div>
                        </div>
                    </div>
                    <div className="stat-card">
                        <Users className="stat-icon" />
                        <div className="stat-content">
                            <div className="stat-label">Total Interacciones</div>
                            <div className="stat-value">{totalResponses.toLocaleString()}</div>
                        </div>
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '24px', marginTop: '24px' }}>
                    {/* --- Chart 1: Average per Dept --- */}
                    <div className="chart-container" style={{ background: '#1c1c1e', padding: '20px', borderRadius: '12px' }}>
                        <h3 style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Timer size={20} color="#0a84ff" />
                            Tiempo por Departamento (Horas)
                        </h3>
                        <div style={{ width: '100%', height: 300 }}>
                            <ResponsiveContainer>
                                <BarChart data={chartData} layout="vertical" margin={{ left: 20 }}>
                                    <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#333" />
                                    <XAxis type="number" stroke="#888" />
                                    <YAxis dataKey="department" type="category" stroke="#888" width={100} fontSize={12} />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#1e1e1e', borderColor: '#333' }}
                                        formatter={(val) => [`${parseFloat(val).toFixed(1)}h`, 'Promedio']}
                                    />
                                    <Bar dataKey="hours" radius={[0, 4, 4, 0]}>
                                        {chartData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.hours > 5 ? '#ff3b30' : entry.hours > 2 ? '#ff9500' : '#30d158'} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* --- Chart 2: Global Distribution --- */}
                    <div className="chart-container" style={{ background: '#1c1c1e', padding: '20px', borderRadius: '12px' }}>
                        <h3 style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Activity size={20} color="#0a84ff" />
                            Distribución de Velocidad
                        </h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                            {distributionData.map((item, idx) => {
                                const percentage = totalResponses > 0 ? (item.value / totalResponses * 100) : 0;
                                return (
                                    <div key={idx} style={{ marginBottom: '10px' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontSize: '0.9rem' }}>
                                            <span style={{ color: '#a1a1a6' }}>{item.name}</span>
                                            <span style={{ fontWeight: 'bold' }}>{percentage.toFixed(1)}%</span>
                                        </div>
                                        <div style={{ height: '8px', background: '#333', borderRadius: '4px', overflow: 'hidden' }}>
                                            <div
                                                style={{
                                                    width: `${percentage}%`,
                                                    height: '100%',
                                                    backgroundColor: item.color,
                                                    boxShadow: `0 0 10px ${item.color}44`
                                                }}
                                            />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                        <div style={{ marginTop: '20px', padding: '12px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', fontSize: '0.85rem' }}>
                            <p style={{ color: '#888', margin: 0 }}>
                                <strong>Tip:</strong> El 40% de las respuestas son "rápidas" {'(<1h)'}, lo que sugiere una cultura de alta reactividad.
                            </p>
                        </div>
                    </div>
                </div>

                <div className="view-disclaimer">
                    <Info size={20} style={{ color: '#0a84ff', flexShrink: 0, marginTop: '2px' }} />
                    <div>
                        <p style={{ margin: '0 0 8px 0' }}><strong>💡 Latencia de Respuesta:</strong> Tiempo medio entre recibir un correo y responderlo. Tiempos muy largos pueden indicar cuellos de botella; tiempos inmediatos pueden señalar falta de "trabajo profundo".</p>
                        <div style={{ fontSize: '0.85rem', opacity: 0.8, borderTop: '1px solid rgba(10, 132, 255, 0.1)', paddingTop: '8px' }}>
                            <strong>Metodología:</strong> Cálculo basado en hilos de conversación detectados en los metadatos de mensajería de los últimos 30 días.
                        </div>
                    </div>
                </div>
            </div >
        );
    };

    const renderTimezone = (timezoneData) => {
        // --- 1. Processing: Group by Source and detect Silos ---
        const grouped = timezoneData.reduce((acc, curr) => {
            const source = curr.source_region || 'Unknown';
            if (!acc[source]) acc[source] = [];
            acc[source].push(curr);
            return acc;
        }, {});

        const totalInteractions = timezoneData.reduce((acc, curr) => acc + parseInt(curr.interaction_count || 0), 0);

        // Detect Silos: departments with low external connectivity relative to internal (heuristic)
        // In this specific view, we only HAVE external flows (a1.dept != a2.dept is in SQL)
        // So a "Silo" here would be a department that appears very few times as a source.
        const activeDepts = Object.keys(grouped).length;
        const avgInteractions = totalInteractions / (activeDepts || 1);
        const silos = Object.entries(grouped)
            .filter(([name, targets]) => targets.reduce((sum, t) => sum + parseInt(t.interaction_count), 0) < (avgInteractions * 0.3))
            .map(([name]) => name);

        return (
            <div className="temporal-view">
                <div className="stats-grid">
                    <div className="stat-card">
                        <Globe className="stat-icon" />
                        <div className="stat-content">
                            <div className="stat-label">Conexiones Activas</div>
                            <div className="stat-value">{timezoneData.length}</div>
                        </div>
                    </div>
                </div>

                {silos.length > 0 && (
                    <div className="silo-alert" style={{
                        marginTop: '24px',
                        padding: '16px',
                        background: 'rgba(255, 149, 0, 0.1)',
                        border: '1px solid #ff9500',
                        borderRadius: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px'
                    }}>
                        <AlertTriangle color="#ff9500" />
                        <div>
                            <div style={{ color: '#ff9500', fontWeight: 'bold' }}>Silos Potenciales Detectados</div>
                            <div style={{ fontSize: '0.9rem', color: '#a1a1a6' }}>
                                Los departamentos <strong>{silos.join(', ')}</strong> muestran una conectividad externa significativamente inferior al promedio.
                            </div>
                        </div>
                    </div>
                )}

                <div className="data-display" style={{ marginTop: '24px' }}>
                    <h3 style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Users size={20} color="#0a84ff" />
                        Matriz de Colaboración Inter-Departamental
                    </h3>
                    <div className="timezone-grid-layout" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '24px' }}>
                        {Object.entries(grouped).sort((a, b) => b[1].length - a[1].length).map(([source, targets]) => {
                            const sourceTotal = targets.reduce((sum, t) => sum + parseInt(t.interaction_count), 0);
                            return (
                                <div key={source} className="region-card" style={{
                                    backgroundColor: '#1c1c1e',
                                    padding: '24px',
                                    borderRadius: '16px',
                                    border: '1px solid #333',
                                    transition: 'transform 0.2s ease',
                                    cursor: 'default'
                                }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                                        <h4 style={{ margin: 0, color: '#fff', fontSize: '1.1rem' }}>{source}</h4>
                                        <span style={{ fontSize: '0.8rem', color: '#888' }}>{sourceTotal} envíos</span>
                                    </div>

                                    <div className="targets-list" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                        {targets.sort((a, b) => b.interaction_count - a.interaction_count).map((t, idx) => {
                                            const weight = (t.interaction_count / sourceTotal * 100);
                                            return (
                                                <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                                                        <span style={{ color: '#a1a1a6' }}> {'→'} {t.target_region}</span>
                                                        <span style={{ color: '#fff', fontWeight: '600' }}>{t.interaction_count}</span>
                                                    </div>
                                                    <div style={{ height: '4px', background: '#333', borderRadius: '2px', overflow: 'hidden' }}>
                                                        <div style={{ width: `${weight}%`, height: '100%', backgroundColor: '#0a84ff', opacity: (weight / 100) + 0.2 }} />
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                <div className="view-disclaimer">
                    <Info size={20} style={{ color: '#0a84ff', flexShrink: 0, marginTop: '2px' }} />
                    <div>
                        <p style={{ margin: '0 0 8px 0' }}><strong>💡 Flujo de Interacción:</strong> Visualiza la estructura de colaboración global entre departamentos. Un equilibrio entre 'envíos' y 'recepciones' indica colaboración saludable.</p>
                        <div style={{ fontSize: '0.85rem', opacity: 0.8, borderTop: '1px solid rgba(10, 132, 255, 0.1)', paddingTop: '8px' }}>
                            <strong>Transparencia:</strong> Este mapa no expone el contenido de los mensajes, solo el volumen agregado de interacciones entre áreas.
                        </div>
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
            case 'heatmap': return data.heatmap?.length > 0 ? renderCombinedActivity(data.heatmap) : <EmptyState icon="📊" title="Sin datos" message="No hay actividad registrada" />;
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




export default TemporalTab;
