import { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Crown, Trophy, Activity, Medal } from 'lucide-react';

export default function TopInfluencers({ onSelectActor, isAnonymous }) {
    const [data, setData] = useState([]);

    useEffect(() => {
        api.getTopInfluencers().then(res => {
            if (res) setData(res);
        });
    }, []);

    return (
        <div className="card animate-in" style={{ animationDelay: '0ms' }}>
            <div className="card-header">
                <div className="card-title">
                    <Trophy className="w-5 h-5 text-yellow-500" />
                    Top Influyentes
                </div>
            </div>
            <div style={{ overflowX: 'auto' }}>
                <table>
                    <thead>
                        <tr>
                            <th>Rank</th>
                            <th>Nombre</th>
                            <th>Unified Score</th>
                            <th>Badge</th>
                            <th>Volumen</th>
                            <th>Respuesta Avg</th>
                            <th>Canal</th>
                        </tr>
                    </thead>
                    <tbody>
                        {data.map((actor) => {
                            const displayName = isAnonymous ? `Actor ${actor.id}` : actor.name;
                            return (
                                <tr
                                    key={actor.id}
                                    onClick={() => onSelectActor(actor)}
                                    style={{ cursor: 'pointer', transition: 'background 0.2s' }}
                                    className="hover-row"
                                >
                                    <td style={{ fontWeight: 'bold', color: actor.rank <= 3 ? '#ecbdfc' : 'inherit' }}>
                                        #{actor.rank}
                                    </td>
                                    <td style={{ fontWeight: 500 }}>{displayName}</td>
                                    <td>
                                        <span style={{
                                            display: 'inline-block',
                                            padding: '2px 10px',
                                            borderRadius: '12px',
                                            background: `rgba(88, 166, 255, ${actor.unified_score / 100 * 0.4})`,
                                            border: '1px solid rgba(88, 166, 255, 0.3)',
                                            color: '#fff',
                                            fontWeight: 600
                                        }}>
                                            {actor.unified_score || 0}
                                        </span>
                                    </td>
                                    <td style={{ fontSize: '1.2em' }}>{actor.badge}</td>
                                    <td>{Math.round(actor.total_volume)}</td>
                                    <td>{actor.avg_response_formatted}</td>
                                    <td>
                                        <span style={{
                                            textTransform: 'capitalize',
                                            color: actor.dominant_channel === 'Teams' ? 'var(--accent-secondary)' : 'var(--accent-primary)',
                                            fontSize: '0.8rem'
                                        }}>
                                            {actor.dominant_channel || '-'}
                                        </span>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
