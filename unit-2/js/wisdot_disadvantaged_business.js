/* Map of GeoJSON data from WisDOT_Disadvantaged_Business.geojson */

//declare map var in global scope
var map;

//define the custom projection EPSG:3071
proj4.defs("EPSG:3071", "+proj=tmerc +lat_0=0 +lon_0=-90 +k=0.9996 +x_0=520000 +y_0=-4480000 +datum=NAD83 +units=m +no_defs");

//function to reproject coordinates from EPSG:3071 to EPSG:4326
function reprojectCoords(coord) {
    // coord from GeoJSON, format: [x, y]
    var p = proj4('EPSG:3071', 'EPSG:4326', [coord[0], coord[1]]);
    return [p[0], p[1]];
}

//recursive function to traverse all coordinates in the GeoJSON object and reproject them
function traverse(node) {
    if (!node) return;
    var type = node.type;
    if (type === 'FeatureCollection') {
        node.features.forEach(traverse);
    } else if (type === 'Feature') {
        traverse(node.geometry);
    } else if (type === 'GeometryCollection') {
        node.geometries.forEach(traverse);
    } else if (type === 'Point') {
        node.coordinates = reprojectCoords(node.coordinates);
    } else if (type === 'MultiPoint' || type === 'LineString') {
        node.coordinates = node.coordinates.map(reprojectCoords);
    } else if (type === 'MultiLineString' || type === 'Polygon') {
        node.coordinates = node.coordinates.map(function (ringOrLine) {
            return ringOrLine.map(reprojectCoords);
        });
    } else if (type === 'MultiPolygon') {
        node.coordinates = node.coordinates.map(function (polygon) {
            return polygon.map(function (ring) {
                return ring.map(reprojectCoords);
            });
        });
    }
}

//function to instantiate the Leaflet map
function createMap() {

    //create the map
    map = L.map('map', {
        center: [44.5, -90.5],
        zoom: 9
    });

    //add OSM base tilelayer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution:
            '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

    //call getData function
    getData();
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



//function to retrieve the data and place it on the map
function getData() {
    //load the data
    fetch("data/WisDOT_Disadvantaged_Business.geojson")
        .then(function (response) {
            return response.json();
        })
        .then(function (json) {

            //reproject the coordinates
            traverse(json);

            //create marker options
            var geojsonMarkerOptions = {
                radius: 4,
                fillColor: "#ff7800",
                color: "#000",
                weight: 1,
                opacity: 1,
                fillOpacity: 0.8
            };

            //create a Leaflet GeoJSON layer and add it to the map
            L.geoJson(json, {
                pointToLayer: function (feature, latlng) {
                    return L.circleMarker(latlng, geojsonMarkerOptions);
                },
                onEachFeature: onEachFeature
            }).addTo(map);

            // zoom to data extent
            map.fitBounds(layer.getBounds());
        });
};

document.addEventListener('DOMContentLoaded', createMap);