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
    var radius = 1.0083 * Math.pow(attValue / minValue, 0.5715) * minRadius

    return radius;
};

//function to bind popups to each feature
function onEachFeature(feature, layer) {

    //no property named popupContent; instead, create html string with all properties
    var popupContent = "";
    if (feature.properties) {

        //loop to add feature property names and values to html string
        for (var property in feature.properties) {
            popupContent += "<p>" + property + ": " + feature.properties[property] + "</p>";
        }
        layer.bindPopup(popupContent);
    };
};


function createPropSymbols(data) {
    //create marker options
    var geojsonMarkerOptions = {
        radius: 8,
        fillColor: "#006400",
        color: "#000",
        weight: 1,
        opacity: 1,
        fillOpacity: 0.8
    };

    //create a Leaflet GeoJSON layer and add it to the map
    L.geoJson(data, {
        pointToLayer: function (feature, latlng) {

            //for each feature, determine its value for the selected attribute
            var attValue = Number(feature.properties["Diameter__in__"]);

            //give each feature's circle marker a radius based on its attribute value
            geojsonMarkerOptions.radius = calcPropRadius(attValue);

            //create circle markers
            return L.circleMarker(latlng, geojsonMarkerOptions);
        },
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