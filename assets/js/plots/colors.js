import {beerStyleCluster, locationCluster} from '../../../data/clusters.js';

// Create an array with the key of each cluster
const styles = Object.keys(beerStyleCluster);
const locations = Object.keys(locationCluster);

const stylesColorScale = d3.scaleOrdinal()
    .domain(styles)
    .range(d3.schemePaired.concat(d3.schemeTableau10));

const locationsColorScale = d3.scaleOrdinal()
    .domain(locations)
    .range(d3.schemePaired.concat(d3.schemeTableau10));


export {stylesColorScale, locationsColorScale};