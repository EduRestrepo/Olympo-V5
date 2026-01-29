import { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { api } from '../services/api';
import { Activity } from 'lucide-react';

export default function ToneIndex() {
    const [data, setData] = useState([]);

    useEffect(() => {
        api.getToneIndex().then(res => {
            if (res) setData(res);
        });
    }, []);

    return (
        <div className="card animate-in" style={{ animationDelay: '350ms' }}>
            <div className="card-header">
                <div className="card-title">
                    <div className="animate-pulse-heart">
                        <Activity size={20} className="text-red-500" />
                    </div>
                    Índice de Tono Organizacional
                </div>
            </div>
            <div className="split-cols">
                <div style={{ height: 250, minWidth: 0, width: '100%' }}>
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={data}>
                            <defs>
                                <linearGradient id="colorTone" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#f85149" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#f85149" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#30363d" vertical={false} />
                            <XAxis dataKey="date" hide />
                            <YAxis domain={[0, 100]} stroke="#8b949e" />
                            <Tooltip
                                contentStyle={{ backgroundColor: '#161b22', borderColor: '#30363d', borderRadius: '8px', border: '1px solid #30363d' }}
                                itemStyle={{ color: '#f85149' }}
                            />
                            <ReferenceLine y={50} stroke="#30363d" strokeDasharray="3 3" />
                            <Line
                                type="monotone"
                                dataKey="value"
                                stroke="#f85149"
                                strokeWidth={4}
                                dot={false}
                                activeDot={{ r: 6, fill: '#f85149', stroke: '#fff', strokeWidth: 2 }}
                                isAnimationActive={true}
                                animationDuration={2500}
                                animationEasing="ease-in-out"
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                    <p style={{ color: 'var(--text-muted)', lineHeight: '1.6' }}>
                        Representa el <strong>clima organizacional</strong> de las interacciones.
                        Se calcula a partir de patrones como la urgencia, la consistencia en las respuestas
                        y los horarios de interacción, permitiendo inferir niveles de compromiso
                        o presión sin leer el contenido.
                    </p>
                </div>
            </div>
        </div>
    );
}
