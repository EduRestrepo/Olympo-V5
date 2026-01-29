import { Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer } from 'recharts';
import { X, User, Target, ShieldCheck } from 'lucide-react';

export default function RadarProfile({ actor, onClose, isAnonymous }) {
    if (!actor) return null;

    // Mapping metrics to 0-100 radar axes
    const radarData = [
        { subject: 'Conectividad', value: actor.unified_score || 0, fullMark: 100 },
        { subject: 'Velocidad', value: (1 - (actor.avg_response_time / 7200)) * 100 || 0, fullMark: 100 },
        { subject: 'Volumen', value: Math.min((actor.total_volume / 500) * 100, 100), fullMark: 100 },
        { subject: 'Impacto Teams', value: actor.teams_score || 0, fullMark: 100 },
        { subject: 'Liderazgo', value: (actor.meetings_organized / Math.max(actor.total_meetings, 1)) * 100 || 0, fullMark: 100 },
    ];

    const displayName = isAnonymous ? `Actor ${actor.id} (${actor.role})` : actor.name;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content card animate-in" onClick={e => e.stopPropagation()} style={{ maxWidth: '600px', width: '90%' }}>
                <div className="card-header" style={{ justifyContent: 'space-between' }}>
                    <div className="card-title">
                        <User size={20} className="text-accent" />
                        Perfil de Influencia: {displayName}
                    </div>
                    <button onClick={onClose} className="btn-icon">
                        <X size={20} />
                    </button>
                </div>

                <div className="grid-2-cols" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.2fr) 1fr', gap: '1rem', overflow: 'visible' }}>
                    <div style={{ height: '320px', marginLeft: '-20px', marginRight: '-20px' }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData} margin={{ top: 10, right: 30, bottom: 10, left: 30 }}>
                                <PolarGrid stroke="#30363d" />
                                <PolarAngleAxis dataKey="subject" tick={{ fill: '#8b949e', fontSize: 11 }} />
                                <Radar
                                    name={displayName}
                                    dataKey="value"
                                    stroke="var(--accent-primary)"
                                    fill="var(--accent-primary)"
                                    fillOpacity={0.6}
                                />
                            </RadarChart>
                        </ResponsiveContainer>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <div className="stat-item">
                            <span className="stat-label">Email</span>
                            <span className="stat-value" style={{ color: '#e6edf3', fontSize: '0.9rem' }}>{actor.email || 'N/A'}</span>
                        </div>
                        <div className="stat-item">
                            <span className="stat-label">Rol Global</span>
                            <span className="stat-value" style={{ color: 'var(--accent-secondary)' }}>{actor.role}</span>
                        </div>
                        <div className="stat-item">
                            <span className="stat-label">Badge de Influencia</span>
                            <span className="stat-value" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <span className="badge-icon" style={{ fontSize: '1.5rem' }}>{actor.badge}</span>
                                {getBadgeTitle(actor.badge)}
                            </span>
                        </div>
                        <div className="stat-item">
                            <span className="stat-label">Canal Dominante</span>
                            <span className="stat-value">{actor.dominant_channel}</span>
                        </div>

                        <div style={{ marginTop: 'auto', padding: '0.8rem', background: '#0d1117', borderRadius: '6px', border: '1px solid #30363d' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#3fb950', marginBottom: '0.4rem', fontSize: '0.8rem' }}>
                                <ShieldCheck size={14} />
                                Metadata Verified
                            </div>
                            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>
                                Análisis basado en patrones de frecuencia y latencia. No se ha accedido al contenido.
                            </p>
                        </div>
                    </div>
                </div>

                <div className="divider" style={{ margin: '1rem 0', height: '1px', background: 'var(--border-subtle)' }} />

                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                    <MetricPill label="Volumen Email" value={actor.total_volume} />
                    <MetricPill label="Reuniones Teams" value={actor.total_meetings} />
                    <MetricPill label="Aceptación" value={`${Math.round(radarData[1].value)}%`} />
                </div>
            </div>
        </div>
    );
}

function MetricPill({ label, value }) {
    return (
        <div style={{ padding: '0.4rem 0.8rem', background: 'rgba(255,255,255,0.05)', borderRadius: '20px', fontSize: '0.8rem', border: '1px solid var(--border-subtle)' }}>
            <span style={{ color: 'var(--text-muted)', marginRight: '0.5rem' }}>{label}:</span>
            <span style={{ fontWeight: 'bold' }}>{value}</span>
        </div>
    );
}

function getBadgeTitle(badge) {
    const titles = { '♚': 'Formales', '♛': 'Estratega', '♜': 'Conector', '♞': 'Exploradores', '♗': 'Guía', '♙': 'Colaborador' };
    return titles[badge] || 'Actor';
}
