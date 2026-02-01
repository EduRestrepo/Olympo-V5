import React from 'react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer } from 'recharts';
import { Target, Users, Zap, Briefcase } from 'lucide-react';

const DiversityStats = ({ diversity }) => {
    // Top 5 most diverse individuals
    const topDiversity = [...diversity].sort((a, b) => b.diversity_score - a.diversity_score).slice(0, 5);

    // Aggregate averages
    const avgDiversity = diversity.reduce((acc, curr) => acc + curr.diversity_score, 0) / diversity.length;
    const avgDepts = diversity.reduce((acc, curr) => acc + curr.unique_departments_connected, 0) / diversity.length;

    // Data for a summary radar chart (mocking some dimensions to enrich it)
    const radarData = [
        { subject: 'Alcance Dptos', A: avgDepts * 20, fullMark: 100 },
        { subject: 'Diversidad', A: avgDiversity, fullMark: 100 },
        { subject: 'Colaboración', A: 85, fullMark: 100 },
        { subject: 'Apertura', A: 70, fullMark: 100 },
        { subject: 'Velocidad', A: 65, fullMark: 100 },
    ];

    return (
        <div className="diversity-stats-container" style={{ marginTop: '1rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                {/* Left: Global Stats */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1.5rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', color: 'var(--accent-secondary)', marginBottom: '1rem' }}>
                            <Target size={20} />
                            <span style={{ fontSize: '0.9rem', fontWeight: 'bold' }}>SALUD DE RED</span>
                        </div>
                        <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#fff' }}>{Math.round(avgDiversity)}%</div>
                        <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.8rem', color: '#8b949e' }}>Puntuación media de diversidad inter-departamental</p>
                    </div>

                    <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1.5rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', color: 'var(--accent-tertiary)', marginBottom: '1rem' }}>
                            <Zap size={20} />
                            <span style={{ fontSize: '0.9rem', fontWeight: 'bold' }}>AGILIDAD</span>
                        </div>
                        <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#fff' }}>{avgDepts.toFixed(1)}</div>
                        <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.8rem', color: '#8b949e' }}>Promedio de departamentos por conexión individual</p>
                    </div>

                    <div className="top-contributors" style={{ gridColumn: 'span 2', background: 'rgba(0,0,0,0.1)', padding: '1rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                        <h4 style={{ margin: '0 0 1rem 0', fontSize: '0.85rem', color: '#8b949e', textTransform: 'uppercase' }}>Líderes de Diversidad</h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            {topDiversity.map((user, i) => (
                                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.02)', padding: '0.5rem 1rem', borderRadius: '6px' }}>
                                    <span style={{ fontSize: '0.9rem' }}>{user.name}</span>
                                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                                        <span style={{ fontSize: '0.75rem', color: '#8b949e' }}>{user.department}</span>
                                        <span style={{ fontSize: '0.85rem', fontWeight: 'bold', color: 'var(--accent-secondary)', width: '40px', textAlign: 'right' }}>{Math.round(user.diversity_score)}%</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Right: Radar Chart */}
                <div style={{ background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '12px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <h4 style={{ margin: '0 0 1rem 0', fontSize: '0.85rem', color: '#8b949e', textTransform: 'uppercase' }}>Perfil de Colaboración Global</h4>
                    <div style={{ width: '100%', height: '300px' }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                                <PolarGrid stroke="rgba(255,255,255,0.1)" />
                                <PolarAngleAxis dataKey="subject" tick={{ fill: '#8b949e', fontSize: 10 }} />
                                <Radar
                                    name="Actual"
                                    dataKey="A"
                                    stroke="var(--accent-secondary)"
                                    fill="var(--accent-secondary)"
                                    fillOpacity={0.5}
                                />
                            </RadarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DiversityStats;
