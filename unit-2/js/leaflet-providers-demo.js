var map = L.map('map', {
    center: [48, -3],
    zoom: 5,
    zoomControl: false
});

var defaultLayer = L.tileLayer.provider('OpenStreetMap.Mapnik').addTo(map);

var baseLayers = {
    'OpenStreetMap Default': defaultLayer,
    'OpenStreetMap German Style': L.tileLayer.provider('OpenStreetMap.DE'),
    'OpenStreetMap H.O.T.': L.tileLayer.provider('OpenStreetMap.HOT'),
    'MapTilesAPI OpenStreetMap in English': L.tileLayer.provider('MapTilesAPI.OSMEnglish'),
    'MapTilesAPI OpenStreetMap en Français': L.tileLayer.provider('MapTilesAPI.OSMFrancais'),
    'MapTilesAPI OpenStreetMap en Español': L.tileLayer.provider('MapTilesAPI.OSMEspagnol'),
    'Thunderforest OpenCycleMap': L.tileLayer.provider('Thunderforest.OpenCycleMap'),
    'Thunderforest Transport': L.tileLayer.provider('Thunderforest.Transport'),
    'Thunderforest Landscape': L.tileLayer.provider('Thunderforest.Landscape'),
    'Stamen Toner': L.tileLayer.provider('Stadia.StamenToner'),
    'Stamen Toner Lite': L.tileLayer.provider('Stadia.StamenTonerLite'),
    'Stamen Terrain': L.tileLayer.provider('Stadia.StamenTerrain'),
    'Stamen Watercolor': L.tileLayer.provider('Stadia.StamenWatercolor'),
    'Stadia Alidade Smooth': L.tileLayer.provider('Stadia.AlidadeSmooth'),
    'Stadia Alidade Smooth Dark': L.tileLayer.provider('Stadia.AlidadeSmoothDark'),
    'Stadia Alidade Satellite': L.tileLayer.provider('Stadia.AlidadeSatellite'),
    'Stadia Outdoors': L.tileLayer.provider('Stadia.Outdoors'),
    'Jawg Streets': L.tileLayer.provider('Jawg.Streets'),
    'Jawg Terrain': L.tileLayer.provider('Jawg.Terrain'),
    'Jawg Lagoon': L.tileLayer.provider('Jawg.Lagoon'),
    'Jawg Sunny': L.tileLayer.provider('Jawg.Sunny'),
    'Jawg Dark': L.tileLayer.provider('Jawg.Dark'),
    'Jawg Light': L.tileLayer.provider('Jawg.Light'),
    'Esri WorldStreetMap': L.tileLayer.provider('Esri.WorldStreetMap'),
    'Esri WorldTopoMap': L.tileLayer.provider('Esri.WorldTopoMap'),
    'Esri WorldImagery': L.tileLayer.provider('Esri.WorldImagery'),
    'Esri WorldTerrain': L.tileLayer.provider('Esri.WorldTerrain'),
    'Esri WorldShadedRelief': L.tileLayer.provider('Esri.WorldShadedRelief'),
    'Esri WorldPhysical': L.tileLayer.provider('Esri.WorldPhysical'),
    'Esri OceanBasemap': L.tileLayer.provider('Esri.OceanBasemap'),
    'Esri NatGeoWorldMap': L.tileLayer.provider('Esri.NatGeoWorldMap'),
    'Esri WorldGrayCanvas': L.tileLayer.provider('Esri.WorldGrayCanvas'),
    'Geoportail France Maps': L.tileLayer.provider('GeoportailFrance'),
    'Geoportail France Orthos': L.tileLayer.provider('GeoportailFrance.orthos'),
    'USGS USTopo': L.tileLayer.provider('USGS.USTopo'),
    'USGS USImagery': L.tileLayer.provider('USGS.USImagery'),
    'USGS USImageryTopo': L.tileLayer.provider('USGS.USImageryTopo'),
};

var overlayLayers = {
    'OpenSeaMap': L.tileLayer.provider('OpenSeaMap'),
    'OpenWeatherMap Clouds': L.tileLayer.provider('OpenWeatherMap.Clouds'),
    'OpenWeatherMap CloudsClassic': L.tileLayer.provider('OpenWeatherMap.CloudsClassic'),
    'OpenWeatherMap Precipitation': L.tileLayer.provider('OpenWeatherMap.Precipitation'),
    'OpenWeatherMap PrecipitationClassic': L.tileLayer.provider('OpenWeatherMap.PrecipitationClassic'),
    'OpenWeatherMap Rain': L.tileLayer.provider('OpenWeatherMap.Rain'),
    'OpenWeatherMap RainClassic': L.tileLayer.provider('OpenWeatherMap.RainClassic'),
    'OpenWeatherMap Pressure': L.tileLayer.provider('OpenWeatherMap.Pressure'),
    'OpenWeatherMap PressureContour': L.tileLayer.provider('OpenWeatherMap.PressureContour'),
    'OpenWeatherMap Wind': L.tileLayer.provider('OpenWeatherMap.Wind'),
    'OpenWeatherMap Temperature': L.tileLayer.provider('OpenWeatherMap.Temperature'),
    'OpenWeatherMap Snow': L.tileLayer.provider('OpenWeatherMap.Snow'),
    'Geoportail France Parcels': L.tileLayer.provider('GeoportailFrance.parcels'),
    'Waymarked Trails Hiking': L.tileLayer.provider('WaymarkedTrails.hiking'),
    'Waymarked Trails Cycling': L.tileLayer.provider('WaymarkedTrails.cycling'),
    'Waymarked Trails MTB': L.tileLayer.provider('WaymarkedTrails.mtb'),
    'Waymarked Trails Ski Slopes': L.tileLayer.provider('WaymarkedTrails.slopes'),
    'Waymarked Trails Riding': L.tileLayer.provider('WaymarkedTrails.riding'),
    'Waymarked Trails Skating': L.tileLayer.provider('WaymarkedTrails.skating')
};

L.control.layers(baseLayers, overlayLayers, { collapsed: false }).addTo(map);

// resize layers control to fit into view.
function resizeLayerControl() {
    var layerControlHeight = document.body.clientHeight - (10 + 50);
    var layerControl = document.getElementsByClassName('leaflet-control-layers-expanded')[0];

    layerControl.style.overflowY = 'auto';
    layerControl.style.maxHeight = layerControlHeight + 'px';
}
map.on('resize', resizeLayerControl);
resizeLayerControl();