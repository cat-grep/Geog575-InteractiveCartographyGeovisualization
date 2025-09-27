/* Map of GeoJSON data from WiDNR_Community_Trees_Madison_Ginkgo.geojson */
//https://data-wi-dnr.opendata.arcgis.com/datasets/wi-dnr::fd-wisconsin-community-trees-layer/explore

//declare map var in global scope
var map;
var minValue;

//function to instantiate the Leaflet map
function createMap() {

    //create the map
    map = L.map('map', {
        center: [43.08, -89.4],
        zoom: 13
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

function calculateMinValue(data) {

    //create empty array to store all data values
    var allValues = [];

    //loop through each tree
    for (var feature of data.features) {
        var diameter = Number(feature.properties["Diameter__in__"]);
        allValues.push(diameter);
    }

    //get minimum value of our array
    var minValue = Math.min(...allValues);

    return minValue;
};

//calculate the radius of each proportional symbol
function calcPropRadius(attValue) {

    //constant factor adjusts symbol sizes evenly
    var minRadius = 3;

    //Flannery Apperance Compensation formula
    var radius = 1 * Math.pow(attValue / minValue, 0.5) * minRadius

    return radius;
};

//function to bind popups to each feature
function onEachFeature(feature, layer) {
    if (!feature.properties) return;

    const FIELD_ORDER = [
        // "Primary_ID",
        // "Code",
        "Latin_Name",
        "Common_Name",
        // "Cultivar",
        "Diameter__in__",
        // "Diameter__in___Range",
        // "Diameter_height__if_not_4_5___",
        // "Height__ft__",
        // "Height__ft___Range",
        // "Growing_Space",
        "Inventory_Year",
        // "Land_Use",
        // "Planting_Strip_Width__ft___Rang",
        "Address",
        "Latitude",
        "Longitude",
        // "Community",
        // "Year_Planted",
        // "ObjectId"
    ];

    const FIELD_LABELS = {
        // Primary_ID: "Primary ID",
        // Code: "Code",
        Latin_Name: "Latin Name",
        Common_Name: "Common Name",
        // Cultivar: "Cultivar",
        Diameter__in__: "DBH (in)",
        // Diameter__in___Range: "DBH Range (in)",
        // Diameter_height__if_not_4_5___: "Diameter Height (if not 4.5')",
        // Height__ft__: "Height (ft)",
        // Height__ft___Range: "Height Range (ft)",
        // Growing_Space: "Growing Space",
        Inventory_Year: "Inventory Year",
        // Land_Use: "Land Use",
        // Planting_Strip_Width__ft___Rang: "Planting Strip Width (ft) Range",
        Address: "Address",
        Latitude: "Latitude",
        Longitude: "Longitude",
        // Community: "Community",
        // Year_Planted: "Year Planted",
        // ObjectId: "Object ID"
    };

    // minimal helpers (scoped inside, no globals)
    const esc = (s) => String(s)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");

    const fmt = (v, key) => {
        if (v === null || v === undefined || v === "") return "&lt;NULL&gt;";
        if ((key === "Latitude" || key === "Longitude") && !Number.isNaN(Number(v))) {
            return Number(v).toFixed(6);
        }
        return esc(v);
    };

    const keys = (FIELD_ORDER && FIELD_ORDER.length)
        ? FIELD_ORDER.filter(k => k in feature.properties)
        : Object.keys(feature.properties);

    const rows = keys.map((key) => {
        const label = esc(FIELD_LABELS[key] || key);
        const val = fmt(feature.properties[key], key);
        return `<tr>
                    <th style="text-align:right;padding:6px 8px;border:1px solid #ddd;background:#f6f7f9;">${label}</th>
                    <td style="padding:6px 8px;border:1px solid #ddd;background:#fff;">${val}</td>
                </tr>`;
        }).join("");

    const table = `<table style="border-collapse:collapse;width:100%;font-size:13px;line-height:1.35;">
                        <tbody>${rows}</tbody>
                    </table>`;

    layer.bindPopup(table);
};

function pointToLayer(feature, latlng) {
    //Determine which attribute to visualize with proportional symbols
    var attribute = "Diameter__in__";

    //create marker options
    var options = {
        fillColor: "#006400",
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

function createPropSymbols(data) {
    //create a Leaflet GeoJSON layer and add it to the map
    L.geoJson(data, {
        pointToLayer: pointToLayer,
        onEachFeature: onEachFeature
    }).addTo(map);
};

//function to retrieve the data and place it on the map
function getData() {

    //load the data
    fetch("data/WiDNR_Community_Trees_Madison_Ginkgo.geojson")
        .then(function (response) {
            return response.json();
        })
        .then(function (json) {

            //calculate minimum data value
            minValue = calculateMinValue(json);

            //call function to create proportional symbols
            const layer = createPropSymbols(json);
        });
};

document.addEventListener('DOMContentLoaded', createMap);