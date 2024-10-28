// Paths to your CSV files
const armsDataUrl = '/Users/neena./Downloads/ArmsSales.csv';
const stabilityDataUrl = '/Users/neena./Downloads/stabilityestimate.csv';

let armsData = {};
let stabilityData = {};
let selectedCountry = null;
let selectedMetric = 'stability';

// Load data and initialize the map
Promise.all([
  d3.csv(armsDataUrl).then(data => {
    data.forEach(d => {
      if (!armsData[d.Country]) armsData[d.Country] = [];
      armsData[d.Country].push({ year: +d.Year, value: +d['Arms Deliveries (USD)'] });
    });
  }),
  d3.csv(stabilityDataUrl).then(data => {
    data.forEach(d => {
      const country = d['Country Name'];
      stabilityData[country] = [];
      for (let year = 2002; year <= 2022; year++) {
        if (d[`${year} [YR${year}]`] !== '..') {
          stabilityData[country].push({ year: year, value: +d[`${year} [YR${year}]`] });
        }
      }
    });
  })
]).then(initMap);

// Initialize map with D3
function initMap() {
  const width = 800, height = 400;

  const projection = d3.geoMercator().scale(120).translate([width / 2, height / 1.5]);
  const path = d3.geoPath().projection(projection);

  const svg = d3.select('#map').append('svg')
    .attr('width', width)
    .attr('height', height);

  d3.json('https://d3js.org/world-110m.v1.json').then(world => {
    svg.append('g')
      .selectAll('path')
      .data(topojson.feature(world, world.objects.countries).features)
      .enter().append('path')
      .attr('d', path)
      .attr('fill', '#ccc')
      .attr('stroke', '#333')
      .attr('stroke-width', 0.5)
      .on('click', d => {
        selectedCountry = d.properties.name;
        updateChart();
      });
  });
}

// Update chart based on selected metric and country
function updateChart() {
  if (!selectedCountry) return;

  const data = selectedMetric === 'stability' ? stabilityData : armsData;
  const countryData = data[selectedCountry];

  if (!countryData) {
    alert(`No data available for ${selectedCountry}`);
    return;
  }

  const trace = {
    x: countryData.map(d => d.year),
    y: countryData.map(d => d.value),
    type: 'scatter',
    mode: 'lines+markers',
    marker: { color: selectedMetric === 'stability' ? 'blue' : 'red' },
    name: selectedCountry
  };

  const layout = {
    title: `${selectedCountry} - ${selectedMetric === 'stability' ? 'Political Stability' : 'Arms Export'} over Time`,
    xaxis: { title: 'Year' },
    yaxis: { title: selectedMetric === 'stability' ? 'Stability Score' : 'Arms Export (USD)' }
  };

  Plotly.newPlot('chart', [trace], layout);
}

// Set data metric to display
function showData(metric) {
  selectedMetric = metric;
  updateChart();
}
