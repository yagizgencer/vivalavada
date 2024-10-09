import {stylesColorScale, locationsColorScale} from './colors.js';

async function createMap(metric, year= 2006) {

    const fileNameData = () => {
        switch (metric) {
            case 'ratings-style':
                return 'style_ratings_by_year_clustered.csv';
            case 'popularity-style':
                return 'style_popularities_by_year_clustered.csv';
            case 'ratings-brewery':
                return 'bc_ratings_by_year_clustered.csv';
            case 'popularity-brewery':
                return 'bc_popularities_by_year_clustered.csv';
        }
    }

    const fileName = 'data/' + fileNameData();

    // Load the data
    const world = await d3.json('data/countries-50m.json').then(data => {
        // Add a space to Georgia to distinguish it from the US state
        const georgia = data.objects.countries.geometries.find(d => d.properties.name === 'Georgia');
        georgia.properties.name = 'Georgia ';
        return data;
    });
    const usStates = await d3.json('data/us-states.geojson');

    const countries = topojson.feature(world, world.objects.countries)
    const countrymesh = topojson.mesh(world, world.objects.countries, (a, b) => a !== b)

    const stylesRatingsPerYear = await d3.csv(fileName).then(data => {
        const transformedData = {};
        const years = Object.keys(data[0]).slice(0, 12);

        years.forEach(year => {
            transformedData[year] = [];
            data.forEach(row => {
                transformedData[year].push({
                    location: row.location.replace('United States, ', ''),
                    style: row[year]
                });
            });
        });

        return transformedData;
    });

    const data = stylesRatingsPerYear[year];

    // Specify the chart’s dimensions.
    const width = 928;
    const marginTop = 50;
    const height = width / 2 + marginTop;

    // Fit the projection.
    const projection = d3.geoEqualEarth().fitExtent([[2, marginTop + 2], [width - 2, height]], {type: "Sphere"});
    const path = d3.geoPath(projection);


    // Styles by location
    const styleByLocation = new Map(data.map(d => [d.location, d.style]));

    // Color scale
    const colorScale = metric.includes('style') ? stylesColorScale : locationsColorScale;

    // Create a tooltip
    const tooltip = d3.select("#map-tooltip");

    // Create the zoom behavior
    const zoom = d3.zoom()
        .scaleExtent([1, 8]) // Set the scale extent (min and max zoom level)
        //.filter(event => event.type === 'wheel' ? event.ctrlKey : true) // Only zoom on wheel events when Alt key is pressed
        .on("zoom", (event) => {
            // Zoom and pan the map
            svg.selectAll('path') // Select all paths in the SVG and transform them
                .attr('transform', event.transform);
        });

    // Create the SVG container.
    const svg = d3.create("svg")
        .attr("width", width)
        .attr("height", height)
        .attr("viewBox", [0, 0, width, height])
        .attr("style", "max-width: 100%; height: auto; border: 1px solid black;")
        .call(zoom); // Call the zoom behavior on the SVG container

    // Add a path for each country and color it according to this data.
    svg.append("g")
        .selectAll("path")
        .data(countries.features)
        .enter()
        .append("path")
        .attr("fill", d => {
            const style = styleByLocation.get(d.properties.name);
            return style ? colorScale(style) : "#ccc";
        })
        .attr("d", path)

    // Add the US states
    svg.append("g")
        .selectAll("path")
        .data(usStates.features)
        .enter()
        .append("path")
        .attr("fill", d => {
            const style = styleByLocation.get(d.properties.NAME);
            return style ? colorScale(style) : "#ccc";
        })
        .attr("d", path)
        .attr("stroke", "white")

    // Add a white mesh.
    svg.append('path')
        .datum(countrymesh)
        .attr('fill', 'none')
        .attr('stroke', 'white')
        .attr('d', path);

    const legend = svg.append("g")
        .attr("id", "legend")
        .attr("transform", "translate(20,20)"); // Adjust this to position your legend

    // Determine the height of each legend item
    const legendItemHeight = 20;

    // Create one legend item for each color in the color scale
    colorScale.domain().forEach((style, idx) => {
        const legendItem = legend.append("g")
            .attr("transform", `translate(0, ${idx * legendItemHeight})`);

        legendItem.append("rect")
            .attr("width", 18)
            .attr("height", 18)
            .attr("fill", colorScale(style));

        legendItem.append("text")
            .attr("x", 24)
            .attr("y", 9)
            .attr("dy", "0.35em") // to vertically center text
            .text(style); // Assuming 'style' is the label for the legend
    });

    // Add tooltips to the countries and US states paths
    function addTooltip(pathSelection) {
        pathSelection
            .on("mouseover", (event, d) => {
                tooltip.transition()
                    .duration(200)
                    .style("opacity", .9);
                tooltip.html(`<b>${d.properties?.name || d.properties?.NAME}</b><br/>${styleByLocation.get(d.properties?.name || d.properties?.NAME) ? styleByLocation.get(d.properties?.name || d.properties?.NAME) : 'N/A'}`)
                    .style("left", (event.pageX) + "px")
                    .style("top", (event.pageY - 28) + "px");
            })
            .on("mousemove", (event) => {
                tooltip.style("left", (event.pageX) + "px")
                    .style("top", (event.pageY - 28) + "px");
            })
            .on("mouseout", () => {
                tooltip.transition()
                    .duration(500)
                    .style("opacity", 0);
            });
    }

// Apply the tooltip function to the countries and US states paths
    addTooltip(svg.selectAll("path"));

    return svg.node();
}

document.addEventListener('DOMContentLoaded', async () => {
    let metric = 'ratings-style';
    let year = 2006;

    // Create the map
    const map = await createMap(metric, year);

    // Add the map to the DOM
    document.querySelector('#trends-map').appendChild(map);

    // Add an event listener to the select to update the chart
    const select = document.getElementById('trends-map-select');
    select.addEventListener('input', async () => {
        metric = select.value;
        const map = await createMap(metric, year);
        // Remove the old chart
        document.querySelector('#trends-map svg').remove();
        // Render the new chart
        document.querySelector('#trends-map').appendChild(map);
    });

    // Add an event listener to the slider to update the chart
    const slider = document.getElementById('map-year-slider');
    slider.addEventListener('input', async () => {
        year = slider.value;
        const map = await createMap(metric, year);
        // Remove the old chart
        document.querySelector('#trends-map svg').remove();
        // Render the new chart
        document.querySelector('#trends-map').appendChild(map);
        // Update the year label
        document.querySelector('#map-year').innerHTML = year;
    });
});