/* Map of GeoJSON data from NBA_Arenas_Annual_Attendance.geojson */
// https://www.espn.com/nba/attendance

// declare map variables in global scope
var map;

// for cross-year comparison
var globalStats = {};
// for within-year comparison
var perYearStats = {};
// The default scale
var currentScale = 'global';

// var minValue;
// var dataStats = {};

// define the visual range for symbol radii in pixels
const MIN_RADIUS = 4;
const MAX_RADIUS = 30;

// store the currently highlighted layer
var highlightedLayer = null;
// store the chart instance
var teamChartInstance = null;
// store the currently selected layer
var selectedLayer = null;

// instantiate the Leaflet map
function createMap() {

  // create the map
  map = L.map('map', {
    center: [37, -95],
    zoom: 4
  });

  // add Esri World Gray Canvas (light gray) base tilelayer
  // uses ArcGIS Online Light Gray Base tiles
  L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}', {
    attribution: 'Tiles © Esri — Esri, HERE, Garmin, FAO, USGS, EPA, NPS',
    maxZoom: 16
  }).addTo(map);

  // add click listener to the map to clear any selected layer
  map.on('click', function () {
    if (selectedLayer) {
      selectedLayer.setStyle(selectedLayer.defaultOptions); // revert style
      selectedLayer = null; // clear the selection
      resetSummaryPanel(); // clear the panel
    }
  });

  //call getData function
  getData();
};

//calculate the minimum data value for the attendance in the dataset
function calculateAllStats(data) {

  //create empty array to store all data values
  var allValues = [];

  // loop through each year to calculate per-year stats
  for (var year = 2016; year <= 2025; year++) {
    const yearAttribute = "TOTAL_" + year;
    const yearValues = [];
    for (const feature of data.features) {
      const value = Number(feature.properties[yearAttribute]);
      if (value > 0) {
        yearValues.push(value);
        allValues.push(value); // add to the global values array
      }
    }
    // calculate and store stats for the current year
    if (yearValues.length > 0) {
      perYearStats[year] = {
        min: Math.min(...yearValues),
        max: Math.max(...yearValues),
        mean: yearValues.reduce((a, b) => a + b) / yearValues.length
      };
    }
  }

  // calculate and store global stats from all years combined
  if (allValues.length > 0) {
    globalStats.min = Math.min(...allValues);
    globalStats.max = Math.max(...allValues);
    globalStats.mean = allValues.reduce((a, b) => a + b) / allValues.length;
  }

};

// calculate the radius of each proportional symbol
function calcPropRadius(attValue, attribute) {

  const year = attribute.split("_")[1];

  // select stats based on the current scale
  const stats = (currentScale === 'global') ? globalStats : perYearStats[year];

  // ensure we have valid data to prevent errors
  if (!attValue || attValue <= 0 || !stats || stats.min <= 0) {
    return 0; // return 0 for invalid or missing data
  }

  // handle cases where max and min are the same to avoid division by zero
  if (stats.max === stats.min) {
    return MIN_RADIUS;
  }

  // 1. Normalize the attribute value (from 0 to 1)
  const range = stats.max - stats.min;
  const normalizedValue = (attValue - stats.min) / range;

  // 2. Scale the radius, using Math.sqrt for better perceptual scaling of area
  const radius = MIN_RADIUS + (Math.sqrt(normalizedValue) * (MAX_RADIUS - MIN_RADIUS));

  return radius;
};

// convert markers to circle markers
function pointToLayer(feature, latlng, attributes) {
  // determine which attribute to visualize with proportional symbols
  var attribute = attributes[0];

  // check
  // console.log(attribute);

  // create marker options
  var options = {
    fillColor: "#016ecd",
    color: "#fff",
    weight: 1,
    opacity: 0.8,
    fillOpacity: 0.8
  };

  // for each feature, determine its value for the selected attribute
  var attValue = Number(feature.properties[attribute]);

  // give each feature's circle marker a radius based on its attribute value
  options.radius = calcPropRadius(attValue, attribute);

  // create circle marker layer
  var layer = L.circleMarker(latlng, options);

  // store default options to revert to on deselect
  layer.defaultOptions = { ...options };

  // return the circle marker to the L.geoJson pointToLayer option
  return layer;
};

// convert number to string and add commas
function formatNumber(n) {
  if (n === null || n === undefined || n === "") return "—";
  return Number(n).toLocaleString();
}

// build popup content using a class for better structure
function PopupContent(properties, attribute) {
  this.properties = properties;
  this.attribute = attribute;
  this.year = attribute.split("_")[1];
  this.attendance = this.properties[attribute];
  this.formatted = `
    <div style="font:13px/1.35 Cambria, Georgia, 'Times New Roman', serif">
      <table style="border-collapse:collapse;width:100%">
        <tbody>
          <tr>
            <th style="text-align:right;padding:6px 8px;border:1px solid #ddd;background:#f6f7f9;">Team</th>
            <td style="padding:6px 8px;border:1px solid #ddd;background:#fff;">${this.properties.TEAM ?? "—"}</td>
          </tr>
          <tr>
            <th style="text-align:right;padding:6px 8px;border:1px solid #ddd;background:#f6f7f9;">Arena</th>
            <td style="padding:6px 8px;border:1px solid #ddd;background:#fff;">${this.properties.ARENA ?? "—"}</td>
          </tr>
          <tr>
            <th style="text-align:right;padding:6px 8px;border:1px solid #ddd;background:#f6f7f9;">Address</th>
            <td style="padding:6px 8px;border:1px solid #ddd;background:#fff;">${this.properties.ADDRESS ?? "—"}</td>
          </tr>
          <tr>
            <th style="text-align:right;padding:6px 8px;border:1px solid #ddd;background:#f6f7f9;">Attendance ${this.year}</th>
            <td style="padding:6px 8px;border:1px solid #ddd;background:#fff;">${formatNumber(this.attendance)} Attendance</td>
          </tr>
        </tbody>
      </table>
    </div>`;
};

// create proportional symbols
function createPropSymbols(data, attributes) {
  // create a Leaflet GeoJSON layer and add it to the map
  const geojsonLayer = L.geoJson(data, {
    pointToLayer: (feature, latlng) => pointToLayer(feature, latlng, attributes),
    onEachFeature: (feature, layer) => {
      // define the highlight style for reuse on click
      const highlightStyle = {
        weight: 3,
        color: '#fff',
        fillColor: '#FFA500'
      };

      // create popup content
      const popupContent = new PopupContent(feature.properties, attributes[0]);
      layer.bindPopup(popupContent.formatted);

      // add event listeners for hover and click
      layer.on({
        // on hover, just open the popup
        mouseover: function () {
          this.openPopup();
          this.setStyle(highlightStyle);
        },
        // on mouseout, just close it
        mouseout: function () {
          if (this != selectedLayer) {
            this.setStyle(this.defaultOptions);
          }
        },
        // on click, handle the selection and summary panel
        click: function (e) {
          // Stop the click from reaching the map and clearing the selection
          L.DomEvent.stopPropagation(e);

          // If a different layer is already selected, reset it
          if (selectedLayer && selectedLayer !== this) {
            selectedLayer.setStyle(selectedLayer.defaultOptions);
          }

          // Apply highlight style to the clicked layer
          this.setStyle(highlightStyle);
          // Update the summary panel with the chart
          updateSummaryPanel(feature.properties, attributes[document.getElementById('year-slider').value]);

          // Set the clicked layer as the currently selected one
          selectedLayer = this;
        }
      });
    }
  });
  geojsonLayer.addTo(map);
  return geojsonLayer;
};

// resize proportional symbols and update popups when the year or scale changes
function updatePropSymbols(attribute) {

  // clear any selection when the year or scale changes
  if (selectedLayer) {
    selectedLayer.setStyle(selectedLayer.defaultOptions);
    selectedLayer = null;
    resetSummaryPanel();
  }

  map.eachLayer(function (layer) {
    if (layer.feature && layer.feature.properties[attribute]) {
      const props = layer.feature.properties;
      const attValue = props[attribute];

      // resize symbol
      const radius = calcPropRadius(attValue, attribute);
      layer.setRadius(radius);

      // update the default options so deselecting works correctly
      layer.defaultOptions.radius = radius;
      layer.setStyle(layer.defaultOptions);

      // refresh popup content for the new year
      const popupContent = new PopupContent(props, attribute);
      layer.bindPopup(popupContent.formatted);
    }
  });
  // also update the legend to match
  updateLegend(attribute);
};

// create new sequence controls
function createSequenceControls(attributes) {

  const maxIndex = attributes.length - 1;

  var SequenceControl = L.Control.extend({
    options: {
      position: 'topright'
    },

    onAdd: function () {
      // create the control container div with a particular class name
      var container = L.DomUtil.create('div', 'sequence-control-container');

      //add skip buttons
      container.insertAdjacentHTML('beforeend', '<button class="step" id="reverse" title="Reverse"><img src="img/reverse.png"></button>');

      //create year input element (slider)
      container.insertAdjacentHTML('beforeend', `<input class="range-slider" id="year-slider" type="range" min="0" max="${maxIndex}" step="1" value="0">`)

      //add skip buttons
      container.insertAdjacentHTML('beforeend', '<button class="step" id="forward" title="Forward"><img src="img/forward.png"></button>');

      //disable any mouse event listeners for the container
      L.DomEvent.disableClickPropagation(container);

      return container;
    }
  });

  map.addControl(new SequenceControl());    // add listeners after adding control

  // bind events AFTER adding to DOM
  const slider = document.getElementById('year-slider');
  const forward = document.getElementById('forward');
  const reverse = document.getElementById('reverse');

  function updateMapForYearChange(newIndex) {
    slider.value = newIndex;
    const attribute = attributes[newIndex];
    updatePropSymbols(attribute);
  }

  forward.addEventListener('click', () => {
    let index = parseInt(slider.value);
    index = (index + 1) > maxIndex ? 0 : index + 1;
    updateMapForYearChange(index);
  });

  reverse.addEventListener('click', () => {
    let index = parseInt(slider.value);
    index = (index - 1) < 0 ? maxIndex : index - 1;
    updateMapForYearChange(index);
  });

  slider.addEventListener('input', () => {
    updateMapForYearChange(parseInt(slider.value));
  });
}

// create the control to toggle between global and relative scales
function createScaleControls(attributes) {
  const ScaleControl = L.Control.extend({
    options: { position: 'topright' },
    onAdd: function () {
      const container = L.DomUtil.create('div', 'scale-control-container');
      container.innerHTML = `
        <div class="scale-title">Symbol Scale</div>
        <label><input type="radio" name="scale" value="global" checked> Global</label>
        <label><input type="radio" name="scale" value="relative"> Year-Relative</label>
      `;
      L.DomEvent.disableClickPropagation(container);
      return container;
    }
  });

  map.addControl(new ScaleControl());

  // add event listeners to the radio buttons
  document.querySelectorAll('input[name="scale"]').forEach(radio => {
    radio.addEventListener('change', function () {
      currentScale = this.value; // Update the global scale variable
      const slider = document.getElementById('year-slider');
      const currentAttribute = attributes[slider.value];
      updatePropSymbols(currentAttribute); // Redraw symbols with the new scale
    });
  });
}

// build an attributes array from the data properties
function processData(data) {
  // empty array to hold attributes
  var attributes = [];

  // properties of the first feature in the dataset
  var properties = data.features[0].properties;

  // push each attribute name into attributes array
  for (var attribute in properties) {
    // only take attributes with population values
    if (attribute.indexOf("TOTAL") > -1) {
      attributes.push(attribute);
    };
  };

  attributes.sort();

  // check result
  // console.log(attributes);

  return attributes;
};

// create the legend control
function createLegend(attributes) {
  const LegendControl = L.Control.extend({
    options: { position: 'bottomright' },
    onAdd: function () {
      const container = L.DomUtil.create('div', 'legend-control-container');
      container.innerHTML = `<div class="legend-title">Attendance in <span id="legend-year"></span></div>
                             <svg id="attribute-legend" width="160px" height="80px"></svg>`;
      L.DomEvent.disableClickPropagation(container);
      return container;
    }
  });

  map.addControl(new LegendControl());
  updateLegend(attributes[0]); // initial population of the legend
}

// update the legend content based on the current year and scale
function updateLegend(attribute) {

  const year = attribute.split("_")[1];
  document.getElementById("legend-year").textContent = year;

  const legendYearSpan = document.getElementById("legend-year");
  const url = `https://www.espn.com/nba/attendance/_/year/${year}`;
  legendYearSpan.innerHTML = `<a href="${url}" target="_blank">${year}</a>`;

  // select the correct stats based on the current scale
  const stats = (currentScale === 'global') ? globalStats : perYearStats[year];
  if (!stats) return; // Exit if no stats for this year/scale

  const svg = document.getElementById("attribute-legend");
  svg.innerHTML = ""; // clear previous legend content

  // define which circles to draw in the legend
  const circles = [
    { label: "Max", value: stats.max },
    { label: "Mean", value: stats.mean },
    { label: "Min", value: stats.min }
  ];

  for (let i = 0; i < circles.length; i++) {
    const radius = calcPropRadius(circles[i].value, attribute);
    // position circles vertically, anchored to the bottom
    const cy = 75 - radius;
    // position text labels evenly
    const textY = i * 20 + 25;

    // add circle to SVG
    svg.innerHTML += `<circle class="legend-circle" r="${radius}" cy="${cy}" cx="40" fill="#016ecd" fill-opacity="0.8" stroke="#fff"></circle>`;
    // add text label to SVG
    svg.innerHTML += `<text class="legend-text" x="85" y="${textY}">${formatNumber(Math.round(circles[i].value))}</text>`;
  }
}

// update the summary panel with the chart
function updateSummaryPanel(properties, attribute) {
  const chartCanvas = document.getElementById('team-chart');
  const prompt = document.getElementById('summary-prompt');
  const currentYear = attribute.split("_")[1];

  // show chart, hide prompt
  chartCanvas.style.display = 'block';
  prompt.style.display = 'none';

  // prepare data for the chart
  const years = [];
  const attendanceData = [];
  for (let year = 2016; year <= 2025; year++) {
    years.push(String(year));
    attendanceData.push(properties["TOTAL_" + year] || null); // Use null for missing data
  }

  // create arrays to style the current year's point
  const pointRadii = years.map(year => (year === currentYear ? 6 : 3));
  const pointBackgroundColors = years.map(year => (year === currentYear ? '#FFA500' : '#016ecd'));

  // destroy previous chart instance if it exists
  if (teamChartInstance) {
    teamChartInstance.destroy();
  }

  // create new chart
  const ctx = chartCanvas.getContext('2d');
  teamChartInstance = new Chart(ctx, {
    type: 'line',
    data: {
      labels: years,
      datasets: [{
        label: `${properties.TEAM} Attendance`,
        data: attendanceData,
        borderColor: '#016ecd',
        backgroundColor: 'rgba(1, 110, 205, 0.1)',
        fill: true,
        tension: 0.1,
        pointRadius: pointRadii,
        pointBackgroundColor: pointBackgroundColors,
        pointHoverRadius: 8,
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: context => `${context.dataset.label}: ${formatNumber(context.raw)}`
          }
        }
      },
      scales: {
        y: {
          beginAtZero: false,
          ticks: {
            callback: value => formatNumber(value)
          }
        }
      }
    }
  });
}

// reset the summary panel (destroy chart)
function resetSummaryPanel() {
  const chartCanvas = document.getElementById('team-chart');
  const prompt = document.getElementById('summary-prompt');

  // destroy chart instance if it exists
  if (teamChartInstance) {
    teamChartInstance.destroy();
    teamChartInstance = null;
  }

  // hide chart, show prompt
  chartCanvas.style.display = 'none';
  prompt.style.display = 'block';
}

// create the summary panel as a Leaflet control
function createSummaryPanel() {
  const SummaryControl = L.Control.extend({
    options: {
      position: 'bottomright'
    },
    onAdd: function () {
      // create a container with a specific class name
      const container = L.DomUtil.create('div', 'summary-panel');
      // add the panel's inner HTML
      container.innerHTML = `
                <div class="summary-title">Team Attendance Trend</div>
                <div id="summary-content">
                    <canvas id="team-chart" style="display: none;"></canvas>
                    <p id="summary-prompt">Click a team to see its attendance trend.</p>
                </div>
            `;
      // prevent map interactions when interacting with the panel
      L.DomEvent.disableClickPropagation(container);
      return container;
    }
  });

  map.addControl(new SummaryControl());
}

function updateSummaryPanel(properties, attribute) {
  const chartCanvas = document.getElementById('team-chart');
  const prompt = document.getElementById('summary-prompt');
  const currentYear = attribute.split("_")[1];

  chartCanvas.style.display = 'block';
  prompt.style.display = 'none';

  const years = [];
  const attendanceData = [];
  for (let year = 2016; year <= 2025; year++) {
    years.push(String(year));
    attendanceData.push(properties["TOTAL_" + year] || null);
  }

  const pointRadii = years.map(year => (year === currentYear ? 6 : 3));
  const pointBackgroundColors = years.map(year => (year === currentYear ? '#FFA500' : '#016ecd'));

  if (teamChartInstance) teamChartInstance.destroy();

  const ctx = chartCanvas.getContext('2d');
  teamChartInstance = new Chart(ctx, {
    type: 'line',
    data: {
      labels: years,
      datasets: [{
        label: `${properties.TEAM} Attendance`,
        data: attendanceData,
        borderColor: '#016ecd',
        backgroundColor: 'rgba(1, 110, 205, 0.1)',
        fill: true,
        tension: 0.1,
        pointRadius: pointRadii,
        pointBackgroundColor: pointBackgroundColors,
        pointHoverRadius: 8,
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false }, tooltip: { callbacks: { label: context => `${context.dataset.label}: ${formatNumber(context.raw)}` } } },
      scales: { y: { beginAtZero: false, ticks: { callback: value => formatNumber(value) } } }
    }
  });
}

function resetSummaryPanel() {
  const chartCanvas = document.getElementById('team-chart');
  const prompt = document.getElementById('summary-prompt');
  if (teamChartInstance) {
    teamChartInstance.destroy();
    teamChartInstance = null;
  }
  if (chartCanvas) chartCanvas.style.display = 'none';
  if (prompt) prompt.style.display = 'block';
}

// create the search control
function createSearchControl(layer) {
  const searchControl = new L.Control.Search({
    layer: layer,
    propertyName: 'TEAM', // the GeoJSON property to search
    initial: false,        // don't search on initial page load
    marker: false,         // highlight the existing arena circle
    textPlaceholder: 'Search teams...',
    collapsed: false,
  });

  // listen for the 'search:locationfound' event
  searchControl.on('search:locationfound', function (e) {
    // e.layer is the actual circle marker that was found
    // e.latlng is the coordinates of the found marker

    // 1. Manually zoom and pan the map to the location
    map.setView(e.latlng, 7); // closer zoom

    // 2. Programmatically fire a 'click' event on the found layer
    e.layer.fire('click');
  });

  map.addControl(searchControl);
}

// retrieve the data and initialize the map
function getData() {
  fetch("data/NBA_Arenas_Annual_Attendance.geojson")
    .then(function (response) {
      return response.json();
    })
    .then(function (json) {
      const attributes = processData(json);
      // calculate all stats upfront
      calculateAllStats(json);

      // call function to create proportional symbols
      const geojsonLayer = createPropSymbols(json, attributes);

      createSequenceControls(attributes);
      // add the new scale toggle
      createScaleControls(attributes);

      createSummaryPanel();
      // initialize summary panel
      resetSummaryPanel();

      createLegend(attributes);

      // create the search control and pass the layer to it
      createSearchControl(geojsonLayer);

      map.attributionControl.addAttribution('Data Source: <a href="https://www.espn.com/nba/attendance" target="_blank">ESPN NBA Attendance</a>');
    });
};

// start the application
document.addEventListener('DOMContentLoaded', createMap);

