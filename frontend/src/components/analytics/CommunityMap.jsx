import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';

const CommunityMap = ({ communities }) => {
    const svgRef = useRef(null);

    useEffect(() => {
        if (!communities || communities.length === 0) return;

        const width = 800;
        const height = 500;

        // Prepare data for D3
        const nodes = [];
        const links = [];
        const communityColors = d3.scaleOrdinal(d3.schemeTableau10);

        communities.forEach((comm, commIdx) => {
            const color = communityColors(commIdx);
            comm.members.forEach((member, memberIdx) => {
                nodes.push({
                    id: member.actor_id,
                    name: member.actor_name,
                    department: member.department,
                    community: comm.name,
                    color: color,
                    isCore: member.is_core_member
                });

                // Link to some other members of the same community to keep them together
                if (memberIdx > 0) {
                    links.push({
                        source: comm.members[0].actor_id,
                        target: member.actor_id,
                        value: 1
                    });
                }
            });
        });

        // Clear previous SVG content
        d3.select(svgRef.current).selectAll("*").remove();

        const svg = d3.select(svgRef.current)
            .attr("viewBox", [0, 0, width, height])
            .style("background", "transparent");

        const container = svg.append("g");

        // Zoom capability
        svg.call(d3.zoom()
            .scaleExtent([0.1, 4])
            .on("zoom", (event) => {
                container.attr("transform", event.transform);
            }));

        const simulation = d3.forceSimulation(nodes)
            .force("link", d3.forceLink(links).id(d => d.id).distance(50))
            .force("charge", d3.forceManyBody().strength(-150))
            .force("center", d3.forceCenter(width / 2, height / 2))
            .force("collision", d3.forceCollide().radius(25));

        const link = container.append("g")
            .attr("stroke", "rgba(255,255,255,0.1)")
            .selectAll("line")
            .data(links)
            .join("line");

        const node = container.append("g")
            .selectAll("g")
            .data(nodes)
            .join("g")
            .call(drag(simulation));

        node.append("circle")
            .attr("r", d => d.isCore ? 12 : 8)
            .attr("fill", d => d.color)
            .attr("stroke", "#fff")
            .attr("stroke-width", 1.5);

        node.append("text")
            .text(d => d.name)
            .attr("x", 12)
            .attr("y", 4)
            .style("fill", "#fff")
            .style("font-size", "10px")
            .style("pointer-events", "none")
            .style("text-shadow", "0 1px 2px rgba(0,0,0,0.8)");

        // Tooltip simple
        node.append("title")
            .text(d => `${d.name}\nDPTO: ${d.department}\n${d.community}`);

        simulation.on("tick", () => {
            link
                .attr("x1", d => d.source.x)
                .attr("y1", d => d.source.y)
                .attr("x2", d => d.target.x)
                .attr("y2", d => d.target.y);

            node.attr("transform", d => `translate(${d.x},${d.y})`);
        });

        function drag(simulation) {
            function dragstarted(event) {
                if (!event.active) simulation.alphaTarget(0.3).restart();
                event.subject.fx = event.subject.x;
                event.subject.fy = event.subject.y;
            }
            function dragged(event) {
                event.subject.fx = event.x;
                event.subject.fy = event.y;
            }
            function dragended(event) {
                if (!event.active) simulation.alphaTarget(0);
                event.subject.fx = null;
                event.subject.fy = null;
            }
            return d3.drag().on("start", dragstarted).on("drag", dragged).on("end", dragended);
        }

        return () => simulation.stop();
    }, [communities]);

    return (
        <div className="community-map-container" style={{ width: '100%', height: '500px', background: 'rgba(0,0,0,0.2)', borderRadius: '12px', overflow: 'hidden' }}>
            <svg ref={svgRef} style={{ width: '100%', height: '100%' }}></svg>
        </div>
    );
};

export default CommunityMap;
