import { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { api } from '../services/api';
import { Share2, Layers, ZoomIn, ZoomOut, Maximize, RefreshCw } from 'lucide-react';

export default function InfluenceGraph({ onSelectActor, isAnonymous }) {
    const svgRef = useRef(null);
    const zoomBehavior = useRef(null); // Ref to store D3 zoom behavior
    // ... (keep state)
    const [depth, setDepth] = useState(4);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedGraphActor, setSelectedGraphActor] = useState(null);
    const [removedNodes, setRemovedNodes] = useState(new Set());
    const [isSimulationMode, setIsSimulationMode] = useState(false);
    const [error, setError] = useState(null);

    const [viewMode, setViewMode] = useState('default');
    const [pathNodes, setPathNodes] = useState(new Set());
    const [pathLinks, setPathLinks] = useState(new Set());
    const [pathSelection, setPathSelection] = useState([]);

    // Cache buster for API
    const [cacheBuster] = useState(Date.now());

    const [data, setData] = useState({ nodes: [], links: [] });
    // Filters State
    const [maxNodes, setMaxNodes] = useState(50);
    const [minWeight, setMinWeight] = useState(1);
    const [debouncedFilters, setDebouncedFilters] = useState({ maxNodes: 50, minWeight: 1 });

    // Debounce effect
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedFilters({ maxNodes, minWeight });
        }, 500);
        return () => clearTimeout(timer);
    }, [maxNodes, minWeight]);

    useEffect(() => {
        api.getInfluenceGraph().then(res => {
            // Initial load (or handle via param if API updated)
            // But we want to filter on load too? 
            // Actually influenceGraph() method in api.js might be hardcoded?
            // Let's assume we use raw api.get here for params.
        });

        const params = `?limit=${debouncedFilters.maxNodes}&min_weight=${debouncedFilters.minWeight}&_t=${cacheBuster}`;
        api.get(`/api/influence-graph${params}`).then(res => {
            if (res && res.nodes) {
                // If API returns meta, use it, otherwise fallback
                const nodes = res.nodes || [];
                const links = res.links || [];
                const nodesWithClusters = detectCommunities(nodes, links);
                setData({ nodes: nodesWithClusters, links });
                setError(null);
            }
        });
    }, [debouncedFilters]);

    useEffect(() => {
        if (!data.nodes || data.nodes.length === 0) return;
        if (!svgRef.current) return;

        try {
            // DEEP COPY to prevent D3 from mutating state directly on re-renders
            let filteredNodes = data.nodes.map(d => ({ ...d }));
            let filteredLinks = data.links.map(d => ({ ...d }));

            const weightThreshold = [0.9, 0.7, 0.5, 0.0][(depth - 1) || 3]; // Safety fallback for depth index
            filteredLinks = filteredLinks.filter(l => l.weight >= weightThreshold);

            // CRITICAL FIX: Ensure all links connect to existing nodes
            const initialNodeIds = new Set(filteredNodes.map(n => n.id));
            filteredLinks = filteredLinks.filter(l => {
                const s = typeof l.source === 'object' ? l.source.id : l.source;
                const t = typeof l.target === 'object' ? l.target.id : l.target;
                return initialNodeIds.has(s) && initialNodeIds.has(t);
            });

            // NEW: Filter out isolated nodes (nodes with no visible links)
            const connectedNodeIds = new Set();
            filteredLinks.forEach(l => {
                connectedNodeIds.add(typeof l.source === 'object' ? l.source.id : l.source);
                connectedNodeIds.add(typeof l.target === 'object' ? l.target.id : l.target);
            });
            filteredNodes = filteredNodes.filter(n => connectedNodeIds.has(n.id));

            if (selectedGraphActor) {
                const relevantLinks = filteredLinks.filter(l =>
                    l.source === selectedGraphActor.id || l.target === selectedGraphActor.id ||
                    l.source.id === selectedGraphActor.id || l.target.id === selectedGraphActor.id
                );
                const connectedNodeIds = new Set();
                connectedNodeIds.add(selectedGraphActor.id);
                relevantLinks.forEach(l => {
                    connectedNodeIds.add(typeof l.source === 'object' ? l.source.id : l.source);
                    connectedNodeIds.add(typeof l.target === 'object' ? l.target.id : l.target);
                });
                filteredNodes = filteredNodes.filter(n => connectedNodeIds.has(n.id));
                filteredLinks = relevantLinks;
            }

            const width = svgRef.current.clientWidth || 800; // Fallback width
            const height = 500;

            d3.select(svgRef.current).selectAll("*").remove();
            const svg = d3.select(svgRef.current)
                .attr("viewBox", [0, 0, width, height])
                .style("background", "#0d1117");

            const container = svg.append("g");

            // Define Zoom Behavior
            const zoom = d3.zoom()
                .scaleExtent([0.1, 4]) // Allow wider zoom range (smaller min for far view)
                .on("zoom", (event) => {
                    container.attr("transform", event.transform);
                });

            svg.call(zoom);
            zoomBehavior.current = zoom; // Store for buttons

            const defs = svg.append("defs");
            const filter = defs.append("filter").attr("id", "glow");
            filter.append("feGaussianBlur").attr("stdDeviation", "3.5").attr("result", "coloredBlur");
            const feMerge = filter.append("feMerge");
            feMerge.append("feMergeNode").attr("in", "coloredBlur");
            feMerge.append("feMergeNode").attr("in", "SourceGraphic");

            // Arrowhead marker
            defs.append("marker")
                .attr("id", "arrowhead")
                .attr("viewBox", "0 -5 10 10")
                .attr("refX", 25) // Adjusted for node radius
                .attr("refY", 0)
                .attr("markerWidth", 6)
                .attr("markerHeight", 6)
                .attr("orient", "auto")
                .append("path")
                .attr("d", "M0,-5L10,0L0,5")
                .attr("fill", "#30363d")
                .style("opacity", 0.6);


            const simulation = d3.forceSimulation(filteredNodes)
                .force("link", d3.forceLink(filteredLinks).id(d => d.id).distance(150))
                .force("charge", d3.forceManyBody().strength(-300))
                .force("center", d3.forceCenter(width / 2, height / 2))
                .force("collision", d3.forceCollide().radius(45));

            const link = container.append("g")
                .attr("stroke", "#30363d")
                .attr("stroke-opacity", 0.6)
                .selectAll("line")
                .data(filteredLinks)
                .join("line")
                .attr("class", d => {
                    const sId = typeof d.source === 'object' ? d.source.id : d.source;
                    const tId = typeof d.target === 'object' ? d.target.id : d.target;
                    const isPath = pathLinks.has(`${sId}-${tId}`) || pathLinks.has(`${tId}-${sId}`);
                    const isRemoved = removedNodes.has(sId) || removedNodes.has(tId);
                    return `${isPath ? 'link-path-active' : ''} ${isRemoved ? 'link-sim-removed' : ''}`;
                })
                .attr("stroke", d => {
                    const sId = typeof d.source === 'object' ? d.source.id : d.source;
                    const tId = typeof d.target === 'object' ? d.target.id : d.target;
                    return (pathLinks.has(`${sId}-${tId}`) || pathLinks.has(`${tId}-${sId}`)) ? 'var(--accent-tertiary)' : "#30363d";
                })
                .attr("stroke-width", d => Math.sqrt((d.weight || 0.1) * 10))
                .attr("marker-end", "url(#arrowhead)");

            const node = container.append("g")
                .selectAll("g")
                .data(filteredNodes)
                .join("g")
                .attr("class", d => `${removedNodes.has(d.id) ? 'node-sim-removed' : ''} ${pathNodes.has(d.id) ? 'node-path-active' : ''}`)
                .style("cursor", "pointer")
                .call(drag(simulation));

            node.append("circle")
                .attr("r", 20)
                .attr("fill", d => {
                    if (viewMode === 'department') {
                        const deptHash = d.department ? d.department.split('').reduce((a, b) => a + b.charCodeAt(0), 0) : 0;
                        const clusterColors = ['#f85149', '#a371f7', '#2da44e', '#d29922', '#58a6ff', '#8b949e', '#db61a2'];
                        return clusterColors[deptHash % clusterColors.length];
                    }
                    if (viewMode === 'country') {
                        const countryHash = d.country ? d.country.split('').reduce((a, b) => a + b.charCodeAt(0), 0) : 0;
                        const clusterColors = ['#58a6ff', '#2da44e', '#d29922', '#a371f7', '#f85149', '#8b949e'];
                        return clusterColors[countryHash % clusterColors.length];
                    }
                    if (viewMode === 'oppositional') {
                        const score = d.escalation_score || 0;
                        if (score >= 5) return '#ff0000';
                        if (score >= 3) return '#ff8c00';
                        if (score >= 1) return '#ffd700';
                        return '#21262d';
                    }
                    const colors = { '♚': '#f85149', '♛': '#f85149', '♜': '#a371f7', '♞': '#2da44e', '♗': '#d29922', '♙': '#58a6ff' };
                    return colors[d.badge] || '#58a6ff';
                })
                .style("filter", d => (removedNodes.has(d.id) || pathNodes.has(d.id)) ? "url(#glow)" : "none")
                .attr("stroke", d => {
                    if (pathSelection.includes(d.id)) return 'var(--accent-tertiary)';
                    return removedNodes.has(d.id) ? "#30363d" : "#fff";
                })
                .attr("stroke-width", d => pathSelection.includes(d.id) ? 4 : 2)
                .on("click", (e, d) => {
                    if (isSimulationMode) {
                        toggleNode(d.id);
                    } else if (e.shiftKey) {
                        togglePathSelection(d.id);
                    } else {
                        onSelectActor(d);
                    }
                });

            node.append("text")
                .text(d => d.badge || "?")
                .attr("text-anchor", "middle")
                .attr("dy", 7)
                .attr("fill", "white")
                .style("font-size", "16px")
                .style("font-weight", "bold")
                .style("pointer-events", "none");

            const labels = node.append("g").attr("transform", "translate(0, 35)");
            labels.append("text").attr("text-anchor", "middle").attr("fill", "white").style("font-size", "10px").style("font-weight", "600").text(d => {
                if (isAnonymous) return `Actor ${d.id}`;
                if (viewMode === 'department') return d.department || 'No Dept';
                if (viewMode === 'country') return d.country || 'No Country';
                if (viewMode === 'oppositional') return `${d.name} [${d.escalation_score || 0}]`;
                return d.name || 'Unknown';
            });

            simulation.on("tick", () => {
                link.attr("x1", d => d.source.x).attr("y1", d => d.source.y).attr("x2", d => d.target.x).attr("y2", d => d.target.y);
                node.attr("transform", d => `translate(${d.x},${d.y})`);
            });

            function drag(simulation) {
                function dragstarted(event) { if (!event.active) simulation.alphaTarget(0.3).restart(); event.subject.fx = event.subject.x; event.subject.fy = event.subject.y; }
                function dragged(event) { event.subject.fx = event.x; event.subject.fy = event.y; }
                function dragended(event) { if (!event.active) simulation.alphaTarget(0); event.subject.fx = null; event.subject.fy = null; }
                return d3.drag().on("start", dragstarted).on("drag", dragged).on("end", dragended);
            }

            return () => simulation.stop();

        } catch (err) {
            console.error("Critical D3 Error:", err);
            setError("Error visualizing graph: " + err.message);
        }
    }, [data, depth, selectedGraphActor, removedNodes, isSimulationMode, isAnonymous, viewMode, pathNodes, pathLinks, pathSelection]);

    // Helpers
    const toggleNode = (nodeId) => {
        const newSet = new Set(removedNodes);
        if (newSet.has(nodeId)) newSet.delete(nodeId);
        else newSet.add(nodeId);
        setRemovedNodes(newSet);
    };

    const togglePathSelection = (nodeId) => {
        let newSelection = [...pathSelection];
        if (newSelection.includes(nodeId)) {
            newSelection = newSelection.filter(id => id !== nodeId);
        } else {
            if (newSelection.length >= 2) newSelection.shift();
            newSelection.push(nodeId);
        }
        setPathSelection(newSelection);

        // Calculate path if 2 nodes selected
        if (newSelection.length === 2 && data.links) {
            const pathData = findShortestPath(newSelection[0], newSelection[1], data.links);
            if (pathData) {
                setPathNodes(new Set(pathData.nodes));
                setPathLinks(new Set(pathData.links));
            } else {
                setPathNodes(new Set());
                setPathLinks(new Set());
            }
        } else {
            setPathNodes(new Set());
            setPathLinks(new Set());
        }
    };

    const handleSearch = () => {
        if (!searchTerm) return;
        const found = data.nodes.find(n => n.name.toLowerCase().includes(searchTerm.toLowerCase()));
        if (found) {
            onSelectActor(found);
            setSelectedGraphActor(found);
        } else {
            alert('Actor no encontrado en el grafo actual.');
        }
    };

    // Zoom Handlers
    const handleZoomIn = () => {
        if (svgRef.current && zoomBehavior.current) {
            d3.select(svgRef.current).transition().call(zoomBehavior.current.scaleBy, 1.3);
        }
    };
    const handleZoomOut = () => {
        if (svgRef.current && zoomBehavior.current) {
            d3.select(svgRef.current).transition().call(zoomBehavior.current.scaleBy, 0.7);
        }
    };
    const handleResetZoom = () => {
        if (svgRef.current && zoomBehavior.current) {
            d3.select(svgRef.current).transition().call(zoomBehavior.current.transform, d3.zoomIdentity);
        }
    };

    if (error) {
        return (
            <div className="card" style={{ padding: '2rem', textAlign: 'center', borderColor: 'red' }}>
                <h3 style={{ color: 'red' }}>Error de Visualización</h3>
                <p>{error}</p>
                <button onClick={() => window.location.reload()} className="graph-search-btn" style={{ marginTop: '1rem' }}>Recargar</button>
            </div>
        );
    }

    return (
        <div className={`card animate-in ${isSimulationMode ? 'simulation-active' : ''}`} style={{ animationDelay: '400ms', position: 'relative' }}>
            {/* ... (Overlay) */}
            {isSimulationMode && <div className="simulation-active-overlay" />}

            <div className="card-header">
                {/* ... (Header content: Title, Selects) */}
                <div className="card-title">
                    <Share2 size={20} className={isSimulationMode ? 'text-accent-tertiary' : ''} />
                    Analizador de Red {isSimulationMode ? '(Simulación)' : (viewMode !== 'default' ? `(${viewMode})` : '')}
                </div>

                {/* Visual Filters */}
                <div style={{
                    display: 'flex', gap: '2rem', flex: 1, margin: '0 2rem',
                    background: 'rgba(255,255,255,0.03)', padding: '0.5rem 1rem', borderRadius: '6px',
                    border: '1px solid #30363d', alignItems: 'center'
                }}>
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '2px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <label style={{ fontSize: '0.7rem', color: '#8b949e', textTransform: 'uppercase' }}>Limitar Nodos (Max)</label>
                            <span style={{ fontSize: '0.7rem', color: '#e6edf3', fontWeight: 'bold' }}>{maxNodes}</span>
                        </div>
                        <input
                            type="range" min="10" max="200" step="10"
                            value={maxNodes}
                            onChange={(e) => setMaxNodes(parseInt(e.target.value))}
                            style={{ width: '100%', accentColor: 'var(--accent-primary)', height: '4px' }}
                        />
                    </div>
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '2px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <label style={{ fontSize: '0.7rem', color: '#8b949e', textTransform: 'uppercase' }}>Interacciones Mínimas</label>
                            <span style={{ fontSize: '0.7rem', color: '#e6edf3', fontWeight: 'bold' }}>{minWeight}</span>
                        </div>
                        <input
                            type="range" min="1" max="50" step="1"
                            value={minWeight}
                            onChange={(e) => setMinWeight(parseInt(e.target.value))}
                            style={{ width: '100%', accentColor: 'var(--accent-secondary)', height: '4px' }}
                        />
                    </div>
                </div>

                <div style={{ display: 'flex', gap: '0.8rem', alignItems: 'center' }}>
                    <select
                        value={viewMode}
                        onChange={(e) => setViewMode(e.target.value)}
                        className="btn-toggle"
                        style={{ background: '#0d1117', border: '1px solid var(--border-subtle)', color: 'white', borderRadius: '4px', padding: '4px 8px' }}
                    >
                        <option value="default">Ver Roles</option>
                        <option value="department">Ver Silos (Depts)</option>
                        <option value="country">Ver Países</option>
                        <option value="oppositional">Ver Oposición</option>
                    </select>

                    <button
                        onClick={() => setIsSimulationMode(!isSimulationMode)}
                        style={{
                            background: isSimulationMode ? 'var(--accent-tertiary)' : 'transparent',
                            border: '1px solid var(--border-subtle)',
                            color: isSimulationMode ? 'white' : 'var(--text-main)',
                            padding: '4px 12px',
                            borderRadius: '4px',
                            fontSize: '0.85rem',
                            cursor: 'pointer'
                        }}
                    >
                        {isSimulationMode ? 'Baja OFF' : 'Simular Baja'}
                    </button>

                    <div className="graph-search-container" style={{ position: 'static' }}>
                        <input
                            type="text"
                            placeholder="Buscar persona..."
                            className="graph-search-input"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        <button className="graph-search-btn" onClick={handleSearch}>🔍</button>
                    </div>

                    <select
                        value={depth}
                        onChange={(e) => setDepth(Number(e.target.value))}
                        style={{ background: '#0d1117', border: '1px solid #30363d', color: 'white', padding: '4px', borderRadius: '4px', fontSize: '0.8rem' }}
                    >
                        <option value={1}>Fuerte</option>
                        <option value={4}>Todo</option>
                    </select>
                </div>
            </div>

            <div style={{ width: '100%', height: '500px', overflow: 'hidden', position: 'relative' }}>
                {!data.nodes.length && !error ? (
                    <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', color: 'gray' }}>
                        Cargando grafo o sin datos...
                    </div>
                ) : null}
                <svg ref={svgRef} style={{ width: '100%', height: '100%' }}></svg>

                {/* Zoom Controls Overlay */}
                <div style={{ position: 'absolute', bottom: '20px', right: '20px', display: 'flex', flexDirection: 'column', gap: '5px', background: '#0d1117', padding: '5px', borderRadius: '6px', border: '1px solid #30363d' }}>
                    <button onClick={handleZoomIn} style={{ background: 'transparent', border: 'none', color: '#c9d1d9', cursor: 'pointer', padding: '5px' }} title="Zoom In">
                        <ZoomIn size={20} />
                    </button>
                    <button onClick={handleResetZoom} style={{ background: 'transparent', border: 'none', color: '#c9d1d9', cursor: 'pointer', padding: '5px' }} title="Reset View">
                        <Maximize size={20} />
                    </button>
                    <button onClick={handleZoomOut} style={{ background: 'transparent', border: 'none', color: '#c9d1d9', cursor: 'pointer', padding: '5px' }} title="Zoom Out">
                        <ZoomOut size={20} />
                    </button>
                </div>
            </div>

            <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem' }}>
                <div style={{ color: 'var(--text-muted)' }}>
                    {isSimulationMode ? 'Simula impacto desactivando nodos.' : 'Shift+Clic en 2 nodos para ver camino de influencia.'}
                </div>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    {pathSelection.length > 0 && <span style={{ color: 'var(--accent-tertiary)' }}>Path: {pathSelection.length}/2</span>}
                    {removedNodes.size > 0 && (
                        <button onClick={() => setRemovedNodes(new Set())} style={{ background: 'transparent', border: 'none', color: 'var(--accent-primary)', cursor: 'pointer' }}>
                            Restablecer ({removedNodes.size})
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}



// Simple Community Detection (BFS-based disconnected components)
function detectCommunities(nodes, links) {
    if (!nodes || !links) return []; // Safety check
    let clusterIdx = 0;
    const nodeMap = new Map();
    nodes.forEach(n => nodeMap.set(n.id, { ...n, cluster: -1, neighbors: [] }));
    links.forEach(l => {
        const s = typeof l.source === 'object' ? l.source.id : l.source;
        const t = typeof l.target === 'object' ? l.target.id : l.target;
        if (nodeMap.has(s) && nodeMap.has(t)) {
            nodeMap.get(s).neighbors.push(t);
            nodeMap.get(t).neighbors.push(s);
        }
    });

    const result = [];
    nodeMap.forEach((n, id) => {
        if (n.cluster === -1) {
            const stack = [id];
            n.cluster = clusterIdx;
            while (stack.length > 0) {
                const curr = stack.pop();
                nodeMap.get(curr).neighbors.forEach(neighborId => {
                    const neighbor = nodeMap.get(neighborId);
                    if (neighbor.cluster === -1) {
                        neighbor.cluster = clusterIdx;
                        stack.push(neighborId);
                    }
                });
            }
            clusterIdx++;
        }
        result.push(n);
    });
    return result;
}

// BFS shortest path
function findShortestPath(startId, endId, links) {
    if (!links) return null;
    const adj = new Map();
    links.forEach(l => {
        const s = typeof l.source === 'object' ? l.source.id : l.source;
        const t = typeof l.target === 'object' ? l.target.id : l.target;
        if (!adj.has(s)) adj.set(s, []);
        if (!adj.has(t)) adj.set(t, []);
        adj.get(s).push(t);
        adj.get(t).push(s);
    });

    const queue = [[startId]];
    const visited = new Set([startId]);

    while (queue.length > 0) {
        const path = queue.shift();
        const node = path[path.length - 1];

        if (node === endId) {
            const pathLinks = [];
            for (let i = 0; i < path.length - 1; i++) {
                pathLinks.push(`${path[i]}-${path[i + 1]}`);
            }
            return { nodes: path, links: pathLinks };
        }

        const neighbors = adj.get(node) || [];
        for (const neighbor of neighbors) {
            if (!visited.has(neighbor)) {
                visited.add(neighbor);
                queue.push([...path, neighbor]);
            }
        }
    }
    return null;
}
