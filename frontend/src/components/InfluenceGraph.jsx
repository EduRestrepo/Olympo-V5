import { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { api } from '../services/api';
import { Share2, Layers } from 'lucide-react';

export default function InfluenceGraph({ onSelectActor, isAnonymous }) {
    const svgRef = useRef(null);
    const [data, setData] = useState({ nodes: [], links: [] });
    const [depth, setDepth] = useState(4);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedGraphActor, setSelectedGraphActor] = useState(null);
    const [removedNodes, setRemovedNodes] = useState(new Set());
    const [isSimulationMode, setIsSimulationMode] = useState(false);

    const [isSiloMode, setIsSiloMode] = useState(false);
    const [pathNodes, setPathNodes] = useState(new Set());
    const [pathLinks, setPathLinks] = useState(new Set());
    const [pathSelection, setPathSelection] = useState([]); // [source, target]

    useEffect(() => {
        api.getInfluenceGraph().then(res => {
            if (res) {
                // Pre-calculate clusters for Silo Mode
                const nodesWithClusters = detectCommunities(res.nodes, res.links);
                setData({ ...res, nodes: nodesWithClusters });
            }
        });
    }, []);

    useEffect(() => {
        if (!data.nodes.length) return;

        let filteredNodes = data.nodes.map(d => ({ ...d }));
        let filteredLinks = data.links.map(d => ({ ...d }));

        // ... existing filters ...
        const weightThreshold = [0.9, 0.7, 0.5, 0.0][depth - 1];
        filteredLinks = filteredLinks.filter(l => l.weight >= weightThreshold);

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

        const width = svgRef.current.clientWidth;
        const height = 500;

        d3.select(svgRef.current).selectAll("*").remove();
        const svg = d3.select(svgRef.current)
            .attr("viewBox", [0, 0, width, height])
            .style("background", "#0d1117");

        const container = svg.append("g");

        const zoom = d3.zoom()
            .scaleExtent([0.5, 3])
            .on("zoom", (event) => {
                container.attr("transform", event.transform);
            });
        svg.call(zoom);

        const defs = svg.append("defs");
        const filter = defs.append("filter").attr("id", "glow");
        filter.append("feGaussianBlur").attr("stdDeviation", "3.5").attr("result", "coloredBlur");
        const feMerge = filter.append("feMerge");
        feMerge.append("feMergeNode").attr("in", "coloredBlur");
        feMerge.append("feMergeNode").attr("in", "SourceGraphic");

        const simulation = d3.forceSimulation(filteredNodes)
            .force("link", d3.forceLink(filteredLinks).id(d => d.id).distance(180))
            .force("charge", d3.forceManyBody().strength(-400))
            .force("center", d3.forceCenter(width / 2, height / 2))
            .force("collision", d3.forceCollide().radius(60));

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
            .attr("stroke-width", d => Math.sqrt(d.weight * 15))
            .attr("marker-end", "url(#arrowhead)");

        const node = container.append("g")
            .selectAll("g")
            .data(filteredNodes)
            .join("g")
            .attr("class", d => `${removedNodes.has(d.id) ? 'node-sim-removed' : ''} ${pathNodes.has(d.id) ? 'node-path-active' : ''}`)
            .style("cursor", "pointer")
            .call(drag(simulation));

        node.append("circle")
            .attr("r", 25)
            .attr("fill", d => {
                if (isSiloMode) {
                    const clusterColors = ['#f85149', '#a371f7', '#2da44e', '#d29922', '#58a6ff', '#8b949e', '#db61a2'];
                    return clusterColors[d.cluster % clusterColors.length];
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
            .text(d => d.badge)
            .attr("text-anchor", "middle")
            .attr("dy", 8)
            .attr("fill", "white")
            .style("font-size", "20px")
            .style("font-weight", "bold")
            .style("pointer-events", "none");

        const labels = node.append("g").attr("transform", "translate(0, 42)");
        labels.append("text").attr("text-anchor", "middle").attr("fill", "white").style("font-size", "12px").style("font-weight", "600").text(d => isAnonymous ? `Actor ${d.id}` : d.name);
        labels.append("text").attr("text-anchor", "middle").attr("dy", 14).attr("fill", "var(--text-muted)").style("font-size", "10px").text(d => d.role);

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
    }, [data, depth, selectedGraphActor, removedNodes, isSimulationMode, isAnonymous, isSiloMode, pathNodes, pathLinks, pathSelection]);

    const toggleNode = (id) => {
        setRemovedNodes(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id); else next.add(id);
            return next;
        });
    };

    const togglePathSelection = (id) => {
        setPathSelection(prev => {
            const next = [...prev];
            if (next.includes(id)) {
                return next.filter(i => i !== id);
            } else {
                if (next.length >= 2) next.shift();
                next.push(id);
                return next;
            }
        });
    };

    useEffect(() => {
        if (pathSelection.length === 2) {
            const path = findShortestPath(pathSelection[0], pathSelection[1], data.links);
            if (path) {
                setPathNodes(new Set(path.nodes));
                setPathLinks(new Set(path.links));
            } else {
                setPathNodes(new Set());
                setPathLinks(new Set());
            }
        } else {
            setPathNodes(new Set());
            setPathLinks(new Set());
        }
    }, [pathSelection, data]);

    const handleSearch = () => {
        const found = data.nodes.find(n => n.name.toLowerCase().includes(searchTerm.toLowerCase()));
        if (found) setSelectedGraphActor(found);
        else if (searchTerm === '') setSelectedGraphActor(null);
    };

    return (
        <div className={`card animate-in ${isSimulationMode ? 'simulation-active' : ''}`} style={{ animationDelay: '400ms', position: 'relative' }}>
            {isSimulationMode && <div className="simulation-active-overlay" />}

            <div className="card-header">
                <div className="card-title">
                    <Share2 size={20} className={isSimulationMode ? 'text-accent-tertiary' : ''} />
                    Analizador de Red {isSimulationMode ? '(Simulación)' : isSiloMode ? '(Silos)' : ''}
                </div>

                <div style={{ display: 'flex', gap: '0.8rem', alignItems: 'center' }}>
                    <button
                        onClick={() => setIsSiloMode(!isSiloMode)}
                        className={`btn-toggle ${isSiloMode ? 'active' : ''}`}
                        title="Agrupar por comunidades"
                    >
                        {isSiloMode ? 'Ver Roles' : 'Ver Silos'}
                    </button>

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
                <svg ref={svgRef} style={{ width: '100%', height: '100%' }}></svg>
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
