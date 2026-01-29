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
                <div style={{ height: 250, minWidth: 0, width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {data.length > 0 ? (
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
                                    dot={data.length < 5}
                                    activeDot={{ r: 6, fill: '#f85149', stroke: '#fff', strokeWidth: 2 }}
                                    isAnimationActive={true}
                                    animationDuration={2500}
                                    animationEasing="ease-in-out"
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    ) : (
                        <div style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                            <p>Esperando datos de clima organizacional...</p>
                        </div>
                    )}
                </div>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                    <p style={{ color: 'var(--text-muted)', lineHeight: '1.6' }}>
                        Representa el <strong>clima y bienestar digital</strong> de las interacciones. Analiza patrones como la urgencia, horarios de respuesta y consistencia, permitiendo inferir el estado de la red sin leer el contenido.
                        <br /><br />
                        <strong>Índice Alto (Cercano a 100):</strong> Refleja un entorno de respeto, respuestas ágiles y equilibrio; una cultura colaborativa sana.
                        <br />
                        <strong>Índice Bajo:</strong> Alerta sobre posibles focos de estrés, "cultura de la urgencia" o fricciones que impactan la armonía del equipo.
                    </p>
                </div>
            </div>
        </div>
    );
}
