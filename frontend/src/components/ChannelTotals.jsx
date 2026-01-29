import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { api } from '../services/api';
import { BarChart3 } from 'lucide-react';

export default function ChannelTotals() {
    const [data, setData] = useState([]);

    useEffect(() => {
        api.getChannelTotals().then(res => {
            if (res) setData(res);
        });
    }, []);

    return (
        <div className="card animate-in" style={{ animationDelay: '250ms' }}>
            <div className="card-header">
                <div className="card-title">
                    <BarChart3 size={20} />
                    Totales por Canal
                </div>
            </div>
            <div style={{ height: 300, minWidth: 0, width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {data.length > 0 && data.some(d => d.total_count > 0) ? (
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={data} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#30363d" horizontal={false} />
                            <XAxis type="number" stroke="#8b949e" />
                            <YAxis dataKey="channel" type="category" stroke="#e6edf3" width={80} />
                            <Tooltip
                                cursor={{ fill: '#1f2530' }}
                                contentStyle={{ backgroundColor: '#161b22', borderColor: '#30363d' }}
                                itemStyle={{ color: '#e6edf3' }}
                            />
                            <Bar dataKey="total_count" name="Interacciones" radius={[0, 4, 4, 0]}>
                                {data.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={['#58a6ff', '#a371f7', '#3fb950', '#f0883e'][index % 4]} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                ) : (
                    <div style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                        <p>No hay interacciones registradas en este periodo.</p>
                        <p style={{ fontSize: '0.8rem' }}>Inicie una extracción en Configuración para actualizar.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
