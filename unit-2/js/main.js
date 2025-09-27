/* Map of GeoJSON data from NBA_Arenas_Annual_Attendance.geojson */
//https://www.espn.com/nba/attendance/

//declare map var in global scope
var map;
var minValue;

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
function calculateMinValue(data) {

    //create empty array to store all data values
    var allValues = [];

    //loop through each tree
    for (var feature of data.features) {
        var attendance = Number(feature.properties["TOTAL_2016"]);
        allValues.push(attendance);
    }

    //get minimum value of our array
    var minValue = Math.min(...allValues);

    return minValue;
};

//calculate the radius of each proportional symbol
function calcPropRadius(attValue) {

    //constant factor adjusts symbol sizes evenly
    var minRadius = 16;

    //Flannery Apperance Compensation formula
    var radius = 1 * Math.pow(attValue / minValue, 0.5) * minRadius

    return radius;
};

//convert markers to circle markers
function pointToLayer(feature, latlng, attributes) {
    //Determine which attribute to visualize with proportional symbols
    var attribute = attributes[0];
    //check
    console.log(attribute);

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
function buildPopup(feature, attribute) {
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

//create proportional symbols
function createPropSymbols(data, attributes) {
    //create a Leaflet GeoJSON layer and add it to the map
    L.geoJson(data, {
    pointToLayer: function (feature, latlng) {
      return pointToLayer(feature, latlng, attributes);
    },
    onEachFeature: function(feature, layer) {
      // bind popup using the first attribute
      layer.bindPopup(buildPopup(feature, attributes[0]));
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
        popup.setContent(buildPopup(layer.feature, attribute)).update();
      }
    }
  });
};

//create sequence controls
function createSequenceControls(attributes) {
    const maxIndex = attributes.length - 1;

    const html = `
    <div id="controls-row" class="controls-row">
      <button class="step" id="reverse" title="Previous">
        <img src="img/reverse.png" alt="" />
      </button>

      <div class="slider-wrap" aria-hidden="false">
        <input id="year-slider" class="range-slider" type="range"
               min="0" max="${maxIndex}" step="1" value="0">
        <div id="ticks" class="ticks" role="presentation">
          ${attributes.map((attr, i) => {
                const pct = maxIndex > 0 ? (i / maxIndex) : 0;
                const label = attr.split("_")[1];
                return `<span class="tick" style="--pct:${pct}">
                            <i></i><em>${label}</em>
                            </span>`;
            }).join("")}
        </div>
      </div>

      <button class="step" id="forward" title="Next">
        <img src="img/forward.png" alt="" />
      </button>
    </div>
  `;

    const panel = document.querySelector("#panel");
    panel.insertAdjacentHTML('beforeend', html);

    // set up events
    const slider = document.getElementById('year-slider');

    document.querySelectorAll('.step').forEach(btn => {
        btn.addEventListener('click', () => {
            let index = Number(slider.value);
            if (btn.id === 'forward') index = (index + 1) > maxIndex ? 0 : index + 1;
            else index = (index - 1) < 0 ? maxIndex : index - 1;
            slider.value = index;
            updatePropSymbols(attributes[index]);
        });
    });

    slider.addEventListener('input', function () {
        updatePropSymbols(attributes[Number(this.value)]);
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
            minValue = calculateMinValue(json);

            //call function to create proportional symbols
            createPropSymbols(json, attributes);

            //call function to create sequence controls
            createSequenceControls(attributes);
        });
};

document.addEventListener('DOMContentLoaded', createMap);