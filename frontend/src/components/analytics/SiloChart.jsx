import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, ReferenceLine } from 'recharts';

const SiloChart = ({ silos }) => {
    // Sort by isolation score
    const data = [...silos].sort((a, b) => b.isolation_score - a.isolation_score);

    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            const item = payload[0].payload;
            return (
                <div className="custom-tooltip" style={{
                    background: 'rgba(13, 17, 23, 0.95)',
                    padding: '12px',
                    borderRadius: '8px',
                    border: '1px solid #30363d',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.5)'
                }}>
                    <p style={{ margin: 0, fontWeight: 'bold', color: '#fff' }}>{label}</p>
                    <p style={{ margin: '4px 0', color: 'var(--accent-primary)' }}>
                        Puntuación Silo: {item.isolation_score.toFixed(1)}%
                    </p>
                    <div style={{ fontSize: '12px', color: '#8b949e', marginTop: '8px' }}>
                        <p style={{ margin: '2px 0' }}>Conexiones Internas: {item.internal_connections}</p>
                        <p style={{ margin: '2px 0' }}>Conexiones Externas: {item.external_connections}</p>
                        <p style={{
                            margin: '8px 0 0 0',
                            fontWeight: 'bold',
                            color: item.silo_risk === 'high' ? '#f85149' : (item.silo_risk === 'medium' ? '#d29922' : '#2da44e'),
                            textTransform: 'uppercase'
                        }}>
                            Riesgo: {item.silo_risk}
                        </p>
                    </div>
                </div>
            );
        }
        return null;
    };

    return (
        <div className="silo-chart-container" style={{ width: '100%', height: '400px', marginTop: '20px' }}>
            <ResponsiveContainer width="100%" height="100%">
                <BarChart
                    data={data}
                    layout="vertical"
                    margin={{ top: 5, right: 30, left: 100, bottom: 5 }}
                >
                    <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="rgba(255,255,255,0.05)" />
                    <XAxis type="number" domain={[0, 100]} hide />
                    <YAxis
                        dataKey="department"
                        type="category"
                        stroke="#8b949e"
                        fontSize={12}
                        width={120}
                    />
                    <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.05)' }} />
                    <Bar dataKey="isolation_score" radius={[0, 4, 4, 0]} barSize={24}>
                        {data.map((entry, index) => (
                            <Cell
                                key={`cell-${index}`}
                                fill={entry.isolation_score > 70 ? '#f85149' : (entry.isolation_score > 40 ? '#d29922' : '#2da44e')}
                                fillOpacity={0.8}
                            />
                        ))}
                    </Bar>
                    <ReferenceLine x={70} stroke="#f85149" strokeDasharray="3 3" label={{ position: 'top', value: 'Alerta Silo', fill: '#f85149', fontSize: 10 }} />
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
};

export default SiloChart;
