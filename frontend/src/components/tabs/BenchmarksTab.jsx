import React, { useState, useEffect } from 'react';
import analyticsApi from '../../services/analyticsApi';
import { EmptyState, ErrorState } from '../shared/EmptyStates';
import { LoadingSpinner } from '../shared/LoadingStates';
import { BarChart2, Info } from 'lucide-react';
import {
    ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend
} from 'recharts';
import './BenchmarksTab.css';

const BenchmarksTab = () => {
    const [activeView, setActiveView] = useState('departments');
    const [loading, setLoading] = useState(false);
    const [calculating, setCalculating] = useState(false);
    const [error, setError] = useState(null);
    const [dataLoaded, setDataLoaded] = useState(false);
    const [data, setData] = useState({
        departments: []
    });

    const views = [
        { id: 'departments', label: 'Por Departamento', icon: <BarChart2 size={18} /> }
    ];

    // Load ALL data once on mount
    useEffect(() => {
        loadAllData();
    }, []);

    const processBenchmarkData = (rawData) => {
        if (!rawData || !Array.isArray(rawData)) return [];

        const pivoted = {};

        rawData.forEach(row => {
            if (!pivoted[row.department]) {
                pivoted[row.department] = {
                    department: row.department,
                    // Initialize metrics to 0
                    meeting_hours: 0,
                    email_volume: 0,
                    collaboration_score: 0,
                    avg_response_time: 0,
                    network_size: 0
                };
            }

            // Map backend metric names to frontend data keys if needed, 
            // or just use the metric_name directly if they match.
            // Based on backend: 'meeting_hours', 'email_volume', etc. match.
            if (row.metric_name) {
                pivoted[row.department][row.metric_name] = parseFloat(row.metric_value) || 0;
            }
        });

        return Object.values(pivoted);
    };

    const loadAllData = async () => {
        if (dataLoaded) return;

        setLoading(true);
        setError(null);

        try {
            const [departments] = await Promise.all([
                analyticsApi.benchmarks.getDepartments()
            ]);

            const needsCalculation = !departments || departments.length === 0;

            if (needsCalculation) {
                setCalculating(true);
                setLoading(false);
                await analyticsApi.benchmarks.calculate();
                setCalculating(false);
                setLoading(true);

                const [newDepartments] = await Promise.all([
                    analyticsApi.benchmarks.getDepartments()
                ]);

                // Transform the flat data into pivoted data for the chart
                const pivotedData = processBenchmarkData(newDepartments || []);
                setData({
                    departments: pivotedData
                });
            } else {
                // Transform the flat data into pivoted data for the chart
                const pivotedData = processBenchmarkData(departments || []);
                setData({
                    departments: pivotedData
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
            <div className="view-render-container animate-in">
                {/* --- DEPARTMENTS VIEW --- */}
                {activeView === 'departments' && (
                    <div className="departments-dashboard">
                        {(!currentData || currentData.length === 0) ? (
                            <EmptyState message="No hay datos de departamentos aún" />
                        ) : (
                            <div className="charts-grid" style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '20px' }}>
                                <div className="chart-card" style={{ background: '#1c1c1e', padding: '20px', borderRadius: '12px' }}>
                                    <h4>Comparativa de Colaboración vs Email</h4>
                                    <div style={{ height: 400, width: '100%' }}>
                                        <ResponsiveContainer>
                                            <BarChart data={currentData} layout="vertical" margin={{ left: 40 }}>
                                                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                                                <XAxis type="number" stroke="#888" />
                                                <YAxis type="category" dataKey="department" stroke="#888" width={120} style={{ fontSize: '11px' }} />
                                                <Tooltip contentStyle={{ backgroundColor: '#2c2c2e', borderColor: '#444' }} />
                                                <Legend />
                                                <Bar dataKey="meeting_hours" name="Horas Reuniones" fill="#0a84ff" stackId="a" />
                                                <Bar dataKey="email_volume" name="Volumen Email" fill="#30d158" stackId="a" />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                <div className="view-disclaimer" style={{ marginTop: '24px', padding: '16px', background: 'rgba(10, 132, 255, 0.1)', border: '1px solid rgba(10, 132, 255, 0.2)', borderRadius: '8px', fontSize: '0.9rem', color: '#c9d1d9' }}>
                    <div style={{ display: 'flex', gap: '12px' }}>
                        <Info size={20} style={{ color: '#0a84ff', flexShrink: 0, marginTop: '2px' }} />
                        <div>
                            {activeView === 'departments' && (
                                <p style={{ margin: '0 0 8px 0' }}><strong>💡 Comparativa Departamental:</strong> Analiza indicadores clave entre áreas para identificar brechas de desempeño y oportunidades de nivelación.</p>
                            )}
                            <div style={{ fontSize: '0.85rem', opacity: 0.8, borderTop: '1px solid rgba(10, 132, 255, 0.1)', paddingTop: '8px', marginTop: '8px' }}>
                                <strong>Privacidad y Datos:</strong> Análisis basado exclusivamente en metadatos de Microsoft 365 (sin acceso a contenido). Datos de los últimos 30 días.
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="benchmarks-tab">
            <div className="tab-intro">
                <h2>📊 Benchmarking</h2>
                <p>Compara el desempeño entre departamentos</p>
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
