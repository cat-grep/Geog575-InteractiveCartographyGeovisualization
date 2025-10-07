/* Map of GeoJSON data from NBA_Arenas_Annual_Attendance.geojson */
//https://www.espn.com/nba/attendance/

//declare map var in global scope
var map;
// var minValue;
var dataStats = {};

//instantiate the Leaflet map
function createMap() {

  //create the map
  map = L.map('map', {
    center: [37, -95],
    zoom: 4
  });

  //add Esri World Gray Canvas (light gray) base tilelayer
  //Uses ArcGIS Online Light Gray Base tiles
  L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}', {
    attribution: 'Tiles &copy; Esri &mdash; Esri, HERE, Garmin, FAO, USGS, EPA, NPS',
    maxZoom: 16
  }).addTo(map);

  //call getData function
  getData();
};

//calculate the minimum data value for the attendance in the dataset
function calcStats(data) {

  //create empty array to store all data values
  var allValues = [];

  //loop through each tree
  for (var feature of data.features) {
    // var attendance = Number(feature.properties["TOTAL_2016"]);
    // allValues.push(attendance);
    //loop through each year
    for (var year = 2016; year <= 2025; year++) {
      //get population for current year
      var value = Number(feature.properties["TOTAL_" + String(year)]);
      //add value to array
      allValues.push(value);
    }
  }

  //get minimum value of our array
  // var minValue = Math.min(...allValues);
  // return minValue;

  //get min, max, mean stats for our array
  dataStats.min = Math.min(...allValues.filter(v => v > 0));
  dataStats.max = Math.max(...allValues);
  //calculate meanValue
  var sum = allValues.reduce(function (a, b) { return a + b; });
  dataStats.mean = Math.round(sum / allValues.length);
};

//calculate the radius of each proportional symbol
function calcPropRadius(attValue) {

  //constant factor adjusts symbol sizes evenly
  var minRadius = 3;

  //Flannery Apperance Compensation formula
  var radius = 1 * Math.pow(attValue / dataStats.min, 0.5) * minRadius

  return radius;
};

//convert markers to circle markers
function pointToLayer(feature, latlng, attributes) {
  //Determine which attribute to visualize with proportional symbols
  var attribute = attributes[0];
  //check
  // console.log(attribute);

  //create marker options
  var options = {
    fillColor: "#016ecd",
    color: "#fff",
    weight: 1,
    opacity: 0.8,
    fillOpacity: 0.8
  };

  //For each feature, determine its value for the selected attribute
  var attValue = Number(feature.properties[attribute]);

  //Give each feature's circle marker a radius based on its attribute value
  options.radius = calcPropRadius(attValue);

  //create circle marker layer
  var layer = L.circleMarker(latlng, options);

  //return the circle marker to the L.geoJson pointToLayer option
  return layer;
};

//convert number to string and add commas
function formatNumber(n) {
  if (n === null || n === undefined || n === "") return "—";
  return Number(n).toLocaleString();
}

//build popup content
function createPopupContent(feature, attribute) {
  const p = feature.properties || {};
  const year = attribute.split("_")[1];
  const val = p[attribute];

  return `
    <div style="font:13px/1.35 Cambria, Georgia, 'Times New Roman', serif">
      <table style="border-collapse:collapse;width:100%">
        <tbody>
          <tr>
            <th style="text-align:right;padding:6px 8px;border:1px solid #ddd;background:#f6f7f9;">Team</th>
            <td style="padding:6px 8px;border:1px solid #ddd;background:#fff;">${p.TEAM ?? "—"}</td>
          </tr>
          <tr>
            <th style="text-align:right;padding:6px 8px;border:1px solid #ddd;background:#f6f7f9;">Arena</th>
            <td style="padding:6px 8px;border:1px solid #ddd;background:#fff;">${p.ARENA ?? "—"}</td>
          </tr>
          <tr>
            <th style="text-align:right;padding:6px 8px;border:1px solid #ddd;background:#f6f7f9;">Address</th>
            <td style="padding:6px 8px;border:1px solid #ddd;background:#fff;">${p.ADDRESS ?? "—"}</td>
          </tr>
          <tr>
            <th style="text-align:right;padding:6px 8px;border:1px solid #ddd;background:#f6f7f9;">Attendance ${year}</th>
            <td style="padding:6px 8px;border:1px solid #ddd;background:#fff;">${formatNumber(val)}</td>
          </tr>
        </tbody>
      </table>
    </div>`;
}

function PopupContent(properties, attribute) {
  this.properties = properties;
  this.attribute = attribute;
  this.year = attribute.split("_")[1];
  this.val = properties[attribute];
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
            <td style="padding:6px 8px;border:1px solid #ddd;background:#fff;">${formatNumber(this.val)}</td>
          </tr>
        </tbody>
      </table>
    </div>`;
  // "<p><b>City:</b> " + this.properties.City + "</p><p><b>Population in " + this.year + ":</b> " + this.population + " million</p>";
};

//create proportional symbols
function createPropSymbols(data, attributes) {
  //create a Leaflet GeoJSON layer and add it to the map
  L.geoJson(data, {
    pointToLayer: function (feature, latlng) {
      return pointToLayer(feature, latlng, attributes);
    },
    onEachFeature: function (feature, layer) {
      // bind popup using the first attribute
      // layer.bindPopup(createPopupContent(feature, attributes[0]));
      var popupContent = new PopupContent(feature.properties, attributes[0]);
      layer.bindPopup(popupContent.formatted);
    }
  }).addTo(map);
};

//resize proportional symbols according to new attribute values
function updatePropSymbols(attribute) {
  
  map.eachLayer(function (layer) {
    if (layer.feature && layer.feature.properties[attribute]) {
      const props = layer.feature.properties;

      // resize symbol
      const radius = calcPropRadius(props[attribute]);
      layer.setRadius(radius);

      // refresh popup content for the new year
      const popup = layer.getPopup();
      if (popup) {
        // popup.setContent(createPopupContent(layer.feature, attribute)).update();
        var popupContent = new PopupContent(layer.feature.properties, attribute);
        // popup.setContent(popupContent.formatted).update();
        layer.bindPopup(popupContent.formatted);
      }
    }
  });
  updateLegend(attribute);
};

//create sequence controls
// function createSequenceControls(attributes) {
//     const maxIndex = attributes.length - 1;

//     const html = `
//     <div id="controls-row" class="controls-row">
//       <button class="step" id="reverse" title="Previous">
//         <img src="img/reverse.png" alt="" />
//       </button>

//       <div class="slider-wrap" aria-hidden="false">
//         <input id="year-slider" class="range-slider" type="range"
//                min="0" max="${maxIndex}" step="1" value="0">
//         <div id="ticks" class="ticks" role="presentation">
//           ${attributes.map((attr, i) => {
//                 const pct = maxIndex > 0 ? (i / maxIndex) : 0;
//                 const label = attr.split("_")[1];
//                 return `<span class="tick" style="--pct:${pct}">
//                             <i></i><em>${label}</em>
//                             </span>`;
//             }).join("")}
//         </div>
//       </div>

//       <button class="step" id="forward" title="Next">
//         <img src="img/forward.png" alt="" />
//       </button>
//     </div>
//   `;

//     const panel = document.querySelector("#panel");
//     panel.insertAdjacentHTML('beforeend', html);

//     // set up events
//     const slider = document.getElementById('year-slider');

//     document.querySelectorAll('.step').forEach(btn => {
//         btn.addEventListener('click', () => {
//             let index = Number(slider.value);
//             if (btn.id === 'forward') index = (index + 1) > maxIndex ? 0 : index + 1;
//             else index = (index - 1) < 0 ? maxIndex : index - 1;
//             slider.value = index;
//             updatePropSymbols(attributes[index]);
//         });
//     });

//     slider.addEventListener('input', function () {
//         updatePropSymbols(attributes[Number(this.value)]);
//     });
// }

//Create new sequence controls
function createSequenceControls(attributes) {

  const maxIndex = attributes.length - 1;

  var SequenceControl = L.Control.extend({
    options: {
      position: 'bottomleft'
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

  forward.addEventListener('click', function () {
    let index = Number(slider.value);
    index = (index + 1) > maxIndex ? 0 : index + 1;
    slider.value = index;
    const attr = attributes[index];
    updatePropSymbols(attr);
  });

  reverse.addEventListener('click', function () {
    let index = Number(slider.value);
    index = (index - 1) < 0 ? maxIndex : index - 1;
    slider.value = index;
    const attr = attributes[index];
    updatePropSymbols(attr);
  });

  slider.addEventListener('input', function () {
    const attr = attributes[Number(this.value)];
    updatePropSymbols(attr);
  });
}

//build an attributes array from the data
function processData(data) {
  //empty array to hold attributes
  var attributes = [];

  //properties of the first feature in the dataset
  var properties = data.features[0].properties;

  //push each attribute name into attributes array
  for (var attribute in properties) {
    //only take attributes with population values
    if (attribute.indexOf("TOTAL") > -1) {
      attributes.push(attribute);
    };
  };

  //check result
  console.log(attributes);

  return attributes;
};

function createLegend(attributes) {
  const LegendControl = L.Control.extend({
    options: {
      position: 'bottomright'
    },

    onAdd: function () {
      // create legend container
      const container = L.DomUtil.create('div', 'legend-control-container');

      // build legend structure
      container.innerHTML = `
              <div class="legend-title">Attendance in <span id="legend-year">${attributes[0].split("_")[1]}</span></div>
            `;

      var svg = '<svg id="attribute-legend" width="160px" height="80px">';

      //array of circle names to base loop on
      var circles = ["max", "mean", "min"];

      //loop to add each circle and text to svg string
      for (var i = 0; i < circles.length; i++) {

        //assign the r and cy attributes  
        var radius = calcPropRadius(dataStats[circles[i]]);
        var cy = 70 - radius;

        //circle string
        svg += '<circle class="legend-circle" id="' + circles[i] + '" r="' + radius + '" cy="' + cy +
          '" fill="#016ecd" fill-opacity="0.8" stroke="#fff" cx="40"/>';

        //evenly space out labels            
        var textY = i * 20 + 20;

        //text string            
        svg += '<text id="' + circles[i] + '-text" x="80" y="' + textY + '">' + Math.round(dataStats[circles[i]] * 100) / 100 + " ppl" + '</text>';
      };

      //close svg string
      svg += "</svg>";

      //add attribute legend svg to container
      container.insertAdjacentHTML('beforeend', svg);

      // prevent map drag on interaction
      L.DomEvent.disableClickPropagation(container);

      return container;
    }
  });

  // add legend to map
  map.addControl(new LegendControl());

  // after adding, populate it
  updateLegend(attributes[0]);
}

function updateLegend(attribute) {
  const year = attribute.split("_")[1];
  document.getElementById("legend-year").textContent = year;
}

//retrieve the data and place it on the map
function getData() {

  //load the data
  fetch("data/NBA_Arenas_Annual_Attendance.geojson")
    .then(function (response) {
      return response.json();
    })
    .then(function (json) {

      //create an attributes array
      var attributes = processData(json);

      //calculate minimum data value
      // minValue = calculateMinValue(json);
      calcStats(json);
      console.log(dataStats);

      //call function to create proportional symbols
      createPropSymbols(json, attributes);

      //call function to create sequence controls
      createSequenceControls(attributes);

      //call function to create the legend
      createLegend(attributes);
    });
};



document.addEventListener('DOMContentLoaded', createMap);

