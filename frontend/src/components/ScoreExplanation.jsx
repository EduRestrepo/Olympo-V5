import React, { useState, useEffect } from 'react';
import { Calculator } from 'lucide-react';
import { api } from '../services/api';

export default function ScoreExplanation() {
    const [settings, setSettings] = useState({
        threshold_email_vol: 500,
        threshold_teams_freq: 50,
        influence_weight_email: 0.6,
        influence_weight_teams: 0.4
    });

    useEffect(() => {
        api.get('/api/settings').then(res => {
            if (res) {
                setSettings(prev => ({
                    ...prev,
                    threshold_email_vol: parseInt(res.threshold_email_vol) || 50,
                    threshold_teams_freq: parseInt(res.threshold_teams_freq) || 5,
                    influence_weight_email: parseFloat(res.influence_weight_email || 0.6),
                    influence_weight_teams: parseFloat(res.influence_weight_teams || 0.4)
                }));
            }
        });
    }, []);

    // Helper to calculate score for demo purposes (linear rule)
    const calcScore = (val, max) => Math.min(Math.round((val / max) * 100), 100);

    const emailExample = Math.round(settings.threshold_email_vol * 0.85); // 85% of target
    const meetingExample = Math.round(settings.threshold_teams_freq * 0.5); // 50% of target
    const emailScore = calcScore(emailExample, settings.threshold_email_vol);
    const meetingScore = calcScore(meetingExample, settings.threshold_teams_freq);
    const finalScore = ((settings.influence_weight_email * emailScore) + (settings.influence_weight_teams * meetingScore)).toFixed(1);

    return (
        <div className="card animate-in" style={{ animationDelay: '100ms' }}>
            <div className="card-header">
                <div className="card-title">
                    <Calculator size={20} />
                    Cómo se calcula el Score
                </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: '2rem' }}>
                <div>
                    <h3 style={{ marginBottom: '1rem', color: 'var(--accent-primary)' }}>Fórmula Maestra de Influencia</h3>
                    <div style={{
                        background: '#0d1117',
                        padding: '1rem',
                        borderRadius: '6px',
                        fontFamily: 'monospace',
                        marginBottom: '1rem',
                        border: '1px solid #30363d',
                        fontSize: '0.85rem'
                    }}>
                        Unified_Score = ({settings.influence_weight_email} × Email_Score) + ({settings.influence_weight_teams} × Teams_Score)
                    </div>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1rem' }}>
                        El <strong>Unified Score</strong> (0-100) mide tu impacto organizacional real combinando dos dimensiones clave:
                    </p>
                    <ul style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.5rem', paddingLeft: '1.2rem' }}>
                        <li style={{ marginBottom: '0.5rem' }}>
                            <strong>📧 Email (Peso {Math.round(settings.influence_weight_email * 100)}%):</strong> Mide tu <em>Centralidad</em>. Un alto volumen de correos enviados y recibidos, sumado a una respuesta rápida, indica que eres un nodo crítico de información.
                        </li>
                        <li>
                            <strong>📅 Teams (Peso {Math.round(settings.influence_weight_teams * 100)}%):</strong> Mide tu <em>Liderazgo</em>. Organizar reuniones, convocar a muchas personas y usar video demuestra capacidad de movilización y presencia.
                        </li>
                    </ul>

                    <h4 style={{ fontSize: '0.9rem', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>Ejemplo de Cálculo:</h4>
                    <div style={{ fontSize: '0.8rem', color: '#8b949e', background: 'rgba(255,255,255,0.03)', padding: '0.8rem', borderRadius: '4px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', borderBottom: '1px solid #30363d', paddingBottom: '0.5rem' }}>
                            <span>Actividad (vs Meta Mensual)</span>
                            <span>Cálculo</span>
                        </div>
                        <ul style={{ listStyle: 'none', padding: 0, marginBottom: '0.8rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            <li>
                                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#e6edf3' }}>
                                    <span>📧 {emailExample} Emails</span>
                                    <strong>{emailScore} pts</strong>
                                </div>
                                <div style={{ fontSize: '0.7rem', color: '#8b949e' }}>
                                    ({emailExample} / {settings.threshold_email_vol} Umbral) × 100 = {emailScore}
                                </div>
                            </li>
                            <li>
                                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#e6edf3' }}>
                                    <span>📅 {meetingExample} Reuniones</span>
                                    <strong>{meetingScore} pts</strong>
                                </div>
                                <div style={{ fontSize: '0.7rem', color: '#8b949e' }}>
                                    ({meetingExample} / {settings.threshold_teams_freq} Umbral) × 100 = {meetingScore}
                                </div>
                            </li>
                        </ul>
                        <div style={{ background: 'rgba(56, 139, 253, 0.1)', padding: '0.5rem', borderRadius: '4px', marginBottom: '0.5rem', fontSize: '0.75rem' }}>
                            ℹ️ <strong>Fórmula:</strong> La puntuación se normaliza sobre un <strong>Umbral de Referencia</strong> ({settings.threshold_email_vol} emails = 100 pts).
                        </div>
                        <p style={{ margin: '0.5rem 0 0 0', borderTop: '1px solid #30363d', paddingTop: '0.5rem', textAlign: 'right' }}>
                            ({settings.influence_weight_email} × {emailScore}) + ({settings.influence_weight_teams} × {meetingScore}) = <strong style={{ color: 'var(--accent-primary)' }}>{finalScore}</strong>
                        </p>
                    </div>
                </div>
                <div>
                    <h3 style={{ marginBottom: '1rem', color: 'var(--accent-secondary)' }}>Asignación de Badges</h3>
                    <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                        Los badges no son estáticos; se asignan dinámicamente cada día según tu posición en el <strong>Ranking Global de Influencia</strong>. Es una competencia viva.
                    </p>
                    <ul style={{ listStyle: 'none', padding: 0, display: 'grid', gap: '0.8rem', fontSize: '0.9rem' }}>
                        <li style={{ display: 'flex', gap: '0.8rem', alignItems: 'center', background: 'rgba(255,255,255,0.02)', padding: '0.5rem', borderRadius: '4px' }}>
                            <span className="badge-icon" style={{ fontSize: '1.5rem' }}>♚</span>
                            <div>
                                <strong style={{ color: '#e6edf3' }}>King (Formales)</strong>
                                <div style={{ fontSize: '0.8rem', color: '#8b949e' }}>El #1 absoluto de la organización. El nodo más central.</div>
                            </div>
                        </li>
                        <li style={{ display: 'flex', gap: '0.8rem', alignItems: 'center', background: 'rgba(255,255,255,0.02)', padding: '0.5rem', borderRadius: '4px' }}>
                            <span className="badge-icon" style={{ fontSize: '1.5rem' }}>♛</span>
                            <div>
                                <strong style={{ color: '#e6edf3' }}>Queen (Estratega)</strong>
                                <div style={{ fontSize: '0.8rem', color: '#8b949e' }}>Puestos #2 y #3. Alta influencia estratégica y alcance.</div>
                            </div>
                        </li>
                        <li style={{ display: 'flex', gap: '0.8rem', alignItems: 'center', background: 'rgba(255,255,255,0.02)', padding: '0.5rem', borderRadius: '4px' }}>
                            <span className="badge-icon" style={{ fontSize: '1.5rem' }}>♜</span>
                            <div>
                                <strong style={{ color: '#e6edf3' }}>Torre (Conector)</strong>
                                <div style={{ fontSize: '0.8rem', color: '#8b949e' }}>Top 10 (Puestos #4 - #10). Hubs clave que unen departamentos.</div>
                            </div>
                        </li>
                        <li style={{ display: 'flex', gap: '0.8rem', alignItems: 'center' }}>
                            <span className="badge-icon" style={{ fontSize: '1.2rem', width: '24px', textAlign: 'center' }}>♗</span>
                            <div>
                                <strong>Alfil (Guía)</strong>
                                <div style={{ fontSize: '0.8rem', color: '#8b949e' }}>Top 15% superior. Referentes técnicos y de conocimiento.</div>
                            </div>
                        </li>
                        <li style={{ display: 'flex', gap: '0.8rem', alignItems: 'center' }}>
                            <span className="badge-icon" style={{ fontSize: '1.2rem', width: '24px', textAlign: 'center' }}>♞</span>
                            <div>
                                <strong>Knight (Explorador)</strong>
                                <div style={{ fontSize: '0.8rem', color: '#8b949e' }}>Top 30%. Agentes de cambio y alta movilidad.</div>
                            </div>
                        </li>
                        <li style={{ display: 'flex', gap: '0.8rem', alignItems: 'center' }}>
                            <span className="badge-icon" style={{ fontSize: '1.2rem', width: '24px', textAlign: 'center' }}>♙</span>
                            <div>
                                <strong>Pawn (Colaborador)</strong>
                                <div style={{ fontSize: '0.8rem', color: '#8b949e' }}>Resto de la organización. La fuerza operativa esencial.</div>
                            </div>
                        </li>
                    </ul>
                </div>
            </div>
        </div>
    );
}
