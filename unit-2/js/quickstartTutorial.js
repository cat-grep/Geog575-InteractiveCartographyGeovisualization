// Quickstart tutorial for Leaflet.js
// https://leafletjs.com/examples/quick-start/

// initialize the map 
// set its view to our chosen geographical coordinates and a zoom level
var map = L.map('map').setView([51.505, -0.09], 13);
// the other way to initialize the map
// var map = L.map('map',{
//     center: [51.505, -0.09],
//     zoom: 13
// });

// add a tile layer
// set the URL template for the tile images, the attribution text, and the maximum zoom level of the layer
L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
}).addTo(map);
// adddTo is inherited from the Layer class

// add a marker
var marker = L.marker([51.5, -0.09]).addTo(map);

// add a circle
// specifying the radius in meters
var circle = L.circle([51.508, -0.11], {
    color: 'red',
    fillColor: '#f03',
    fillOpacity: 0.5,
    radius: 500
}).addTo(map);

// add a polygon
var polygon = L.polygon([
    [51.509, -0.08],
    [51.503, -0.06],
    [51.51, -0.047]
]).addTo(map);

// add popups
marker.bindPopup("<b>Hello world!</b><br>I am a popup.").openPopup();
circle.bindPopup("<b>Hello world!</b><br>I am a circle.");
polygon.bindPopup("<b>Hello world!</b><br>I am a polygon.");

// add a standalone popup
var popup = L.popup()
    .setLatLng([51.513, -0.09])
    .setContent("I am a standalone popup.")
    .openOn(map);

// interactive map event handling
// add a click event to the map
// function onMapClick(e) {
//     alert("You clicked the map at " + e.latlng);
// }

// map.on('click', onMapClick);

// instead of an alert, open a popup at the clicked location
var popup = L.popup();

function onMapClick(e) {
    popup.setLatLng(e.latlng)
         .setContent("You clicked the map at " + e.latlng.toString())
         .openOn(map);
}

map.on('click', onMapClick);