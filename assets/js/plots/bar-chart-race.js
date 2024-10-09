import {beerStyleCluster} from '../../../data/clusters.js';

let animationStarted = false;
let isPaused = false;
let metric = 'ratings-style';

async function barChartsAnimation(metric) {
    // Number of bars
    const n = 12;

    // Number of frames
    const k = 15;

    // Duration of the animation
    const duration = 200;

    // Charts dimensions and margins
    const barSize = 48;
    const marginTop = 16;
    const marginRight = 6;
    const marginBottom = 6;
    const marginLeft = 0;
    const width = 928;
    const height = marginTop + barSize * n + marginBottom;

    // Data file name
    const fileNameData = () => {
        switch (metric) {
            case 'ratings-style':
                return 'global_style_rating_points_by_year.csv';
            case 'number-ratings-style':
                return 'global_style_popularity_points_by_year.csv';
            case 'ratings-brewery':
                return 'global_brewery_rating_points_by_year.csv';
            case 'number-ratings-brewery':
                return 'global_brewery_popularity_points_by_year.csv';
        }
    }

    const fileName = 'data/' + fileNameData();

    // Open the csv file
    const rawData = await d3.csv(fileName);

    // Reshape the data
    function reshapeData(data) {
        const reshapedData = [];

        data.forEach(row => {
            const name = row.style;
            Object.keys(row).forEach(year => {
                // Add the category
                if (year !== 'style') {
                    const category = Object.keys(beerStyleCluster).find(key => beerStyleCluster[key].includes(name));
                    reshapedData.push({
                        date: `${year}-01-01`,
                        name: name,
                        value: row[year],
                        category: category
                    });
                }
            });
        });

        return reshapedData;
    }

    const data = reshapeData(rawData);

    // x axis
    const x = d3.scaleLinear([0, 1], [marginLeft, width - marginRight]);

    // y axis
    const y = d3.scaleBand()
        .domain(d3.range(n + 1))
        .rangeRound([marginTop, marginTop + barSize * (n + 1 + 0.1)])
        .padding(0.1);

    // Color scale
    const colorScale = () => {
        const scale = d3.scaleOrdinal(d3.schemePaired.concat(d3.schemeTableau10));
        if (data.some(d => d.category !== undefined)) {
            const categoryByName = new Map(data.map(d => [d.name, d.category]))
            scale.domain(categoryByName.values());
            return d => scale(categoryByName.get(d.name));
        }
        return d => scale(d.name);
    }
    const color = colorScale();

    // Format date
    const formatDate = d3.utcFormat('%Y');

    // Format number
    const formatNumber = d3.format(',d');

    // Ticker
    function ticker(svg) {
        const now = svg.append('text')
            .style('font', `bold ${barSize}px "Open Sans"`)
            .style('font-variant-numeric', 'tabular-nums')
            .attr('text-anchor', 'end')
            .attr('x', width - 6)
            .attr('y', marginTop + barSize * (n - 0.45))
            .attr('dy', '0.32em')
            .text(formatDate(keyframes[0][0]));

        return ([date], transition) => {
            transition.end().then(() => now.text(formatDate(date)));
        };
    }

    // Axis
    function axis(svg) {
        const g = svg.append('g')
            .attr('transform', `translate(0,${marginTop})`);

        const axis = d3.axisTop(x)
            .ticks(width / 160)
            .tickSizeOuter(0)
            .tickSizeInner(-barSize * (n + y.padding()));

        return (_, transition) => {
            g.transition(transition).call(axis);
            g.select('.tick:first-of-type text').remove();
            g.selectAll('.tick:not(:first-of-type) line').attr('stroke', 'white');
            g.select('.domain').remove();
        };
    }

    // Text tween
    function textTween(a, b) {
        const i = d3.interpolateNumber(a, b);
        return function (t) {
            this.textContent = formatNumber(i(t));
        };
    }

    // Labels
    function labels(svg) {
        let label = svg.append('g')
            .style('font', 'bold 12px "Open Sans"')
            .style('font-variant-numeric', 'tabular-nums')
            .attr('text-anchor', 'end')
            .selectAll('text');

        return ([date, data], transition) => label = label
            .data(data.slice(0, n), d => d.name)
            .join(
                enter => enter.append('text')
                    .attr('transform', d => `translate(${x((prev.get(d) || d).value)},${y((prev.get(d) || d).rank)})`)
                    .attr('y', y.bandwidth() / 2)
                    .attr('x', -6)
                    .attr('dy', '-0.25em')
                    .text(d => d.name)
                    .call(text => text.append('tspan')
                        .attr('fill-opacity', 0.7)
                        .attr('font-weight', 'normal')
                        .attr('x', -6)
                        .attr('dy', '1.15em')),
                update => update,
                exit => exit.transition(transition).remove()
                    .attr('transform', d => `translate(${x((next.get(d) || d).value)},${y((next.get(d) || d).rank)})`)
                    .call(g => g.select('tspan').tween('text', d => textTween(d.value, (next.get(d) || d).value)))
            )
            .call(bar => bar.transition(transition)
                .attr('transform', d => `translate(${x(d.value)},${y(d.rank)})`)
                .call(g => g.select('tspan').tween('text', d => textTween((prev.get(d) || d).value, d.value))));
    }

    // Bars
    function bars(svg) {
        let bar = svg.append('g')
            .attr('fill-opacity', 0.6)
            .selectAll('rect');

        return ([date, data], transition) => bar = bar
            .data(data.slice(0, n), d => d.name)
            .join(
                enter => enter.append('rect')
                    .attr('fill', color)
                    .attr('height', y.bandwidth())
                    .attr('x', x(0))
                    .attr('y', d => y((prev.get(d) || d).rank))
                    .attr('width', d => x((prev.get(d) || d).value) - x(0)),
                update => update,
                exit => exit.transition(transition).remove()
                    .attr('y', d => y((next.get(d) || d).rank))
                    .attr('width', d => x((next.get(d) || d).value) - x(0))
            )
            .call(bar => bar.transition(transition)
                .attr('y', d => y(d.rank))
                .attr('width', d => x(d.value) - x(0)));
    }

    // Names
    const names = new Set(data.map(d => d.name));

    // Datevalues
    const datevalues = Array.from(d3.rollup(data, ([d]) => d.value, d => d.date, d => d.name))
        .map(([date, data]) => [new Date(date), data])
        .sort(([a], [b]) => d3.ascending(a, b));

    // Rank
    function rank(value) {
        const data = Array.from(names, name => ({name, value: parseFloat(value(name))}));
        data.sort((a, b) => d3.descending(a.value, b.value));
        for (let i = 0; i < data.length; ++i) data[i].rank = Math.min(n, i);
        return data;
    }

    // Keyframes
    function getKeyframes() {
        const keyframes = [];
        let ka, a, kb, b;
        for ([[ka, a], [kb, b]] of d3.pairs(datevalues)) {
            for (let i = 0; i < k; ++i) {
                const t = i / k;
                keyframes.push([
                    new Date(ka * (1 - t) + kb * t),
                    rank(name => (a.get(name) || 0) * (1 - t) + (b.get(name) || 0) * t)
                ]);
            }
        }
        keyframes.push([new Date(kb), rank(name => b.get(name) || 0)]);
        return keyframes;
    }

    const keyframes = getKeyframes();

    // Nameframes
    const nameFrames = d3.groups(keyframes.flatMap(([, data]) => data), d => d.name);
    const prev = new Map(nameFrames.flatMap(([, data]) => d3.pairs(data, (a, b) => [b, a])));
    const next = new Map(nameFrames.flatMap(([, data]) => d3.pairs(data)));

    // Create a d3 svg
    const svg = d3.create('svg')
        .attr('viewBox', [0, 0, width, height])
        .attr('width', width)
        .attr('height', height)
        .attr('style', 'max-width: 100%; height: auto;');

    // Add the svg to the div
    const container = document.getElementById('bar-race');
    container.appendChild(svg.node());

    // Update functions
    const updateBars = bars(svg);
    const updateAxis = axis(svg);
    const updateLabels = labels(svg);
    const updateTicker = ticker(svg);

    // Show the first frame
    function showFirstFrame() {
        const firstKeyframe = keyframes[0];
        const noTransition = svg.transition().duration(0);

        x.domain([0, firstKeyframe[1][0].value]); // Assuming this sets the scale based on the first keyframe

        updateAxis(firstKeyframe, noTransition);
        updateBars(firstKeyframe, noTransition);
        updateLabels(firstKeyframe, noTransition);
        updateTicker(firstKeyframe, noTransition);
    }

    // Call the function to show the first frame
    showFirstFrame();

    // Run the animation
    async function runAnimation() {
        for (const keyframe of keyframes) {
            if (isPaused) {
                await new Promise(resolve => {
                    const resume = () => {
                        isPaused = false;
                        window.removeEventListener('resume', resume);
                        resolve();
                    };
                    window.addEventListener('resume', resume);
                });
            }

            const transition = svg.transition()
                .duration(duration)
                .ease(d3.easeLinear);

            // Extract the top bar’s value.
            x.domain([0, keyframe[1][0].value]);

            updateAxis(keyframe, transition);
            updateBars(keyframe, transition);
            updateLabels(keyframe, transition);
            updateTicker(keyframe, transition);

            //invalidation.then(() => svg.interrupt());
            await transition.end();
        }
    }

    return runAnimation;
}

function runHandler(runAnimation) {
    const observer = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting && !animationStarted) {
                animationStarted = true; // Prevent the animation from restarting if it's already started
                runAnimation(); // Function to start the animation
            }
        });
    }, {
        threshold: 0.5 // Adjust as needed. 0.5 means 50% of the element is visible
    });

    // Observe the element
    const targetDiv = document.getElementById('bar-race');
    observer.observe(targetDiv);

    // Add a restart button
    const restartButton = document.getElementById('bar-race-restart-button');
    restartButton.addEventListener('click', () => {
        animationStarted = true; // Prevent the animation from restarting if it's already started
        isPaused = false;
        runAnimation();
    });
}

// Run the animation
document.addEventListener('DOMContentLoaded', () => {
    barChartsAnimation(metric).then(runAnimation => runHandler(runAnimation));

    // Add an event listener to the select to update the chart
    const select = document.querySelector('#bar-race-select');
    select.addEventListener('input', async () => {
        metric = select.value;
        // Remove the old chart
        document.querySelector('#bar-race svg').remove();
        // Render the new chart
        animationStarted = false;
        isPaused = false;
        document.getElementById('bar-race-pause-button').textContent = '⏸️ Pause the race';
        barChartsAnimation(metric).then(runAnimation => runHandler(runAnimation));
    });

    // Add a pause button
    const pauseButton = document.getElementById('bar-race-pause-button');
    pauseButton.addEventListener('click', () => {
        isPaused = !isPaused;
        if (!isPaused) {
            pauseButton.textContent = '⏸️ Pause the race';
            window.dispatchEvent(new Event('resume'));
        } else {
            pauseButton.textContent = '▶️ Play the race'
        }
    });
});
