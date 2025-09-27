/* Map of GeoJSON data from MegaCities.geojson */

//declare map var in global scope
var map;
var minValue;

//step 1 create map
//function to instantiate the Leaflet map
function createMap() {
    //create the map
    map = L.map('map', {
        center: [0, 0],
        zoom: 2
    });

    //add OSM base tilelayer
    L.tileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>'
    }).addTo(map);

    //call getData function
    getData();
};

function calculateMinValue(data) {
    //create empty array to store all data values
    var allValues = [];
    //loop through each city
    for (var city of data.features) {
        //loop through each year
        for (var year = 1985; year <= 2015; year += 5) {
            //get population for current year
            var value = city.properties["Pop_" + String(year)];
            //add value to array
            allValues.push(value);
        }
    }
    //get minimum value of our array
    var minValue = Math.min(...allValues)

    return minValue;
};

//calculate the radius of each proportional symbol
function calcPropRadius(attValue) {
    //constant factor adjusts symbol sizes evenly
    var minRadius = 5;
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

//Step 3: Add circle markers for point features to the map
function createPropSymbols(data) {

    //Step 4. Determine the attribute for scaling the proportional symbols
    var attribute = "Pop_2015";

    //create marker options
    var geojsonMarkerOptions = {
        radius: 8,
        fillColor: "#ff7800",
        color: "#000",
        weight: 1,
        opacity: 1,
        fillOpacity: 0.8
    };

    L.geoJson(data, {
        pointToLayer: function (feature, latlng) {
            //Step 5: For each feature, determine its value for the selected attribute
            var attValue = Number(feature.properties[attribute]);

            //Step 6: Give each feature's circle marker a radius based on its attribute value
            geojsonMarkerOptions.radius = calcPropRadius(attValue);

            //create circle markers
            return L.circleMarker(latlng, geojsonMarkerOptions);
        },
        onEachFeature: onEachFeature
    }).addTo(map);
};

//Step 2: Import GeoJSON data
function getData() {
    //load the data
    fetch("data/MegaCities.geojson")
        .then(function (response) {
            return response.json();
        })
        .then(function (json) {
            //calculate minimum data value
            minValue = calculateMinValue(json);
            //call function to create proportional symbols
            createPropSymbols(json);
        })
};

//function to retrieve the data and place it on the map
// function getData(){
//     //load the data
//     fetch("data/MegaCities.geojson")
//         .then(function(response){
//             return response.json();
//         })
//         .then(function(json){            
//             //create marker options
//             var geojsonMarkerOptions = {
//                 radius: 8,
//                 fillColor: "#ff7800",
//                 color: "#000",
//                 weight: 1,
//                 opacity: 1,
//                 fillOpacity: 0.8
//             };
//             //create a Leaflet GeoJSON layer and add it to the map
//             L.geoJson(json, {
//                 pointToLayer: function (feature, latlng){
//                     return L.circleMarker(latlng, geojsonMarkerOptions);
//                 },
//                 onEachFeature: onEachFeature
//             }).addTo(map);
//         });
// };

document.addEventListener('DOMContentLoaded', createMap);