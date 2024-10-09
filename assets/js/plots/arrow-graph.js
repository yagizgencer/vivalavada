function linkArc(d) {
    if (d.source === d.target) {
        // Self-linking node: create a loop.
        const x = d.source.x;
        const y = d.source.y;
        const dx = 50; // Offset and size of the loop.
        const dy = 50;
        return `M${x},${y} C${x - dx},${y - dy} ${x + dx},${y - dy} ${x},${y}`;
    } else {
        const r = Math.hypot(d.target.x - d.source.x, d.target.y - d.source.y);
        return `
            M${d.source.x},${d.source.y}
            A${r},${r} 0 0,1 ${d.target.x},${d.target.y}
        `;
    }
}

function drag(simulation) {
    function dragstarted(event, d) {
        if (!event.active) simulation.alphaTarget(0.3).restart();
        d.fx = d.x;
        d.fy = d.y;
    }

    function dragged(event, d) {
        d.fx = event.x;
        d.fy = event.y;
    }

    function dragended(event, d) {
        if (!event.active) simulation.alphaTarget(0);
        d.fx = null;
        d.fy = null;
    }

    return d3.drag()
        .on('start', dragstarted)
        .on('drag', dragged)
        .on('end', dragended);
}

async function createChart(metric, year) {

    let fileName;
    if (metric === 'ratings-brewery') {
        fileName = 'data/bc_ratings_by_year.csv';
    } else  {
        fileName = 'data/bc_popularities_by_year.csv';
    }

    const data = await d3.csv(fileName).then(data => {
        const transformedData = {};
        const years = Object.keys(data[0]).slice(0, 12);
        years.forEach(year => {
            transformedData[year] = [];
            data.forEach(row => {
                transformedData[year].push({
                    source: row[year].replace('United States', 'USA'),
                    target: row.location.replace('United States', 'USA'),
                    type: 'most_rated'
                });
            });
        });

        return transformedData;
    });

    function zoomed(event) {
        // Calculate the bounds of the SVG content dynamically
        const bounds = svg.node().getBBox();
        const dx = Math.min(0, Math.max(event.transform.x, svg.attr('width') - bounds.width * event.transform.k));
        const dy = Math.min(0, Math.max(event.transform.y, svg.attr('height') - bounds.height * event.transform.k));

        // Apply the transform with the constrained translation
        link.attr('transform', `translate(${dx},${dy})`);
        node.attr('transform', d => `translate(${d.x * event.transform.k + dx},${d.y * event.transform.k + dy})`);

        // Keep text size constant
        node.selectAll('text')
            .style('font-size', `${12 / event.transform.k}px`);
    }

    function zoom() {
        return d3.zoom()
            .scaleExtent([0.5, 4]) // Set the scale extent
            .on('zoom', zoomed);
    }

    const data_year = data[year];
    const width = 928;
    const height = 600;
    const types = Array.from(new Set(data_year.map(d => d.type)));
    const nodes = Array.from(new Set(data_year.flatMap(l => [l.source, l.target])), id => ({id}));
    const links = data_year.map(d => Object.create(d))

    //const color = d3.scaleOrdinal(types, d3.schemePaired);
    const color = d3.scaleOrdinal(types, ['#1f78b4']);

    const simulation = d3.forceSimulation(nodes)
        .force('link', d3.forceLink(links).id(d => d.id))
        .force('charge', d3.forceManyBody().strength(-200))
        .force('x', d3.forceX())
        .force('y', d3.forceY());

    const svg = d3.create('svg')
        .attr('viewBox', [-width / 2, -height / 2, width, height])
        .attr('width', width)
        .attr('height', height)
        .attr('style', 'max-width: 100%; height: auto; font: 12px sans-serif; border: 1px solid black;');

    svg.append('defs').selectAll('marker')
        .data(types)
        .join('marker')
        .attr('id', d => `arrow-${d}`)
        .attr('viewBox', '0 -5 10 10')
        .attr('refX', 15)
        .attr('refY', -0.5)
        .attr('markerWidth', 6)
        .attr('markerHeight', 6)
        .attr('orient', 'auto')
        .append('path')
        .attr('fill', color)
        .attr('d', 'M0,-5L10,0L0,5');

    const everything = svg.append('g');

    const link = everything.append('g')
        .attr('fill', 'none')
        .attr('stroke-width', 1.5)
        .selectAll('path')
        .data(links)
        .join('path')
        .attr('stroke', d => color(d.type))
        .attr('marker-end', d => `url(${new URL(`#arrow-${d.type}`, location)})`);

    const node = everything.append('g')
        .attr('fill', 'currentColor')
        .attr('stroke-linecap', 'round')
        .attr('stroke-linejoin', 'round')
        .selectAll('g')
        .data(nodes)
        .join('g')
        .call(drag(simulation));

    node.append('circle')
        .attr('stroke', 'white')
        .attr('stroke-width', 1.5)
        .attr('r', 4);

    node.append('text')
        .attr('x', 20)
        .attr('y', '0.31em')
        .text(d => d.id)
        .style('font-size', '12px')
        .clone(true).lower()
        .attr('fill', 'none')
        .attr('stroke', 'white')
        .attr('stroke-width', 3)

    simulation.on('tick', () => {
        link.attr('d', linkArc);
        node.attr('transform', d => `translate(${d.x},${d.y})`);
    });

    const zoomBehavior = d3.zoom()
        .scaleExtent([1 / 2, 8])
        .on('zoom', (event) => {
            // Apply the zoom transformation to the 'everything' group
            everything.attr('transform', event.transform);

            // Keep the text size constant by inversely scaling it relative to the zoom level
            everything.selectAll('text')
                .attr('transform', d => `scale(${1 / event.transform.k})`)
                .attr('stroke-width', 3 / event.transform.k);  // Adjust stroke-width to keep it visually consistent
        });

    svg.call(zoomBehavior);

    return svg.node();
}

let metric = 'ratings-brewery';
let year = 2006;

document.addEventListener('DOMContentLoaded', async () => {
    // Render the chart
    const svg = await createChart(metric, year);
    document.querySelector('#arrow-graph').appendChild(svg);

    // Add an event listener to the slider to update the chart
    const slider = document.getElementById('arrow-graph-year-slider');
    slider.addEventListener('input', async () => {
        year = slider.value;
        const svg = await createChart(metric, year);
        // Remove the old chart
        document.querySelector('#arrow-graph svg').remove();
        // Render the new chart
        document.querySelector('#arrow-graph').appendChild(svg);
        // Update the year label
        document.querySelector('#arrow-graph-year').innerHTML = year;
    });

    // Add an event listener to select input to update the chart
    const select = document.getElementById('arrow-graph-select');
    select.addEventListener('change', async () => {
        metric = select.value;
        const svg = await createChart(metric, year);
        // Remove the old chart
        document.querySelector('#arrow-graph svg').remove();
        // Render the new chart
        document.querySelector('#arrow-graph').appendChild(svg);
    });
});
