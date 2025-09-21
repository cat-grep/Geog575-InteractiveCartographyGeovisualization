/* Polar map with GIBS tiles + graticule + year labels + time-series line */

// declare map var in global scope
var map;

// Try to extract a 4-digit year from common property names or any field
function getYear(props) {
    if (!props) return null;

    const candidates = ['Year'];
    for (const key of candidates) {
        if (key in props) {
            const y = String(props[key]).trim();
            const m = y.match(/^(\d{4})/);   // accepts "1996", "1996-01-01", etc.
            if (m) {
                const n = parseInt(m[1], 10);
                if (Number.isFinite(n)) return n;
            }
        }
    }
    return null;
}

function createMap() {
    // 1) Define EPSG:3413 in proj4
    proj4.defs("EPSG:3413",
        "+proj=stere +lat_0=90 +lat_ts=70 +lon_0=-45 +k=1 " +
        "+x_0=0 +y_0=0 +datum=WGS84 +units=m +no_defs"
    );

    // 2) Use GIBS' 3413 tile matrix params (250m set)
    var gibs3413Resolutions = [16384, 8192, 4096, 2048, 1024, 512, 256, 128, 64];
    var gibs3413Bounds = L.bounds(
        L.point(-4194304, -4194304),
        L.point(4194304, 4194304)
    );

    var crs3413 = new L.Proj.CRS('EPSG:3413', proj4.defs('EPSG:3413'), {
        origin: [-4194304, 4194304],     // top-left corner in projected meters
        resolutions: gibs3413Resolutions,
        bounds: gibs3413Bounds
    });

    // 3) Create map
    map = L.map('map', {
        crs: crs3413,
        center: [90, 10],
        zoom: 2,
        minZoom: 0,
        maxZoom: 8
    });

    // 4) NASA GIBS VIIRS true-color in EPSG:3413 (250m)
    var viirsTrueColor = L.tileLayer(
        'https://gibs.earthdata.nasa.gov/wmts/epsg3413/best/' +
        'VIIRS_SNPP_CorrectedReflectance_TrueColor/default/{time}/250m/{z}/{y}/{x}.jpg',
        {
            time: 'default',
            tileSize: 256,
            attribution: 'Imagery: NASA GIBS',
            noWrap: true,
            continuousWorld: false,
            maxZoom: 8,
            bounds: L.latLngBounds(L.latLng(40, -180), L.latLng(90, 180)) // north polar cap
        }
    ).addTo(map);

    // 5) Graticule overlay
    var graticule = createGraticuleLayer({ minLat: 50, maxLat: 90, latStep: 5, lonStep: 10 }).addTo(map);

    // Placeholder for time-series line so it shows in the control
    var timeSeriesLayer = L.layerGroup().addTo(map);

    // 6) Layer control (base + overlays)
    L.control.layers(
        { 'VIIRS True Color (GIBS)': viirsTrueColor },
        { 'Graticule': graticule, 'Time series (chronological)': timeSeriesLayer },
        { collapsed: false }
    ).addTo(map);

    // 7) Load data (and populate labels + time series)
    getData(timeSeriesLayer);
}

// generate a GeoJSON FeatureCollection of graticule lines (lat/lon in degrees)
function generateGraticuleGeoJSON(options) {
    var minLat = options.minLat || -80;
    var maxLat = options.maxLat || 80;
    var latStep = options.latStep || 10;
    var lonStep = options.lonStep || 10;
    var lonResolution = options.lonResolution || 5;

    var features = [];

    // Parallels
    for (var lat = minLat; lat <= maxLat; lat += latStep) {
        var coords = [];
        for (var lon = -180; lon <= 180; lon += lonResolution) {
            coords.push([+lon.toFixed(6), +lat.toFixed(6)]);
        }
        features.push({
            type: 'Feature',
            properties: { type: 'parallel', value: lat },
            geometry: { type: 'LineString', coordinates: coords }
        });
    }

    // Meridians
    for (var lon2 = -180; lon2 <= 180; lon2 += lonStep) {
        var coords2 = [];
        for (var lat2 = Math.max(minLat, -89.9); lat2 <= Math.min(maxLat, 89.9); lat2 += 1) {
            coords2.push([+lon2.toFixed(6), +lat2.toFixed(6)]);
        }
        features.push({
            type: 'Feature',
            properties: { type: 'meridian', value: lon2 },
            geometry: { type: 'LineString', coordinates: coords2 }
        });
    }

    return { type: 'FeatureCollection', features: features };
}

// create a Leaflet GeoJSON layer styled for graticules
function createGraticuleLayer(opts) {
    opts = opts || {};
    var minLat = opts.minLat || -60;
    var maxLat = opts.maxLat || 90;
    var latStep = opts.latStep || 10;
    var lonStep = opts.lonStep || 10;

    var geojson = generateGraticuleGeoJSON({
        minLat: minLat,
        maxLat: maxLat,
        latStep: latStep,
        lonStep: lonStep,
        lonResolution: 4
    });

    var style = function (feature) {
        var isParallel = feature.properties && feature.properties.type === 'parallel';
        return {
            color: isParallel ? '#333' : '#666',
            weight: 1,
            opacity: 0.6,
            dashArray: '4,6'
        };
    };

    return L.geoJson(geojson, { style, interactive: false });
}

// bind popups + year labels
function onEachFeature(feature, layer) {
    // permanent year label
    var year = getYear(feature.properties);
    if (year !== null) {
        layer.bindTooltip(String(year), {
            permanent: true,
            direction: 'right',
            offset: [8, 0],
            className: 'year-label'
        });
    }

    // popup with all props
    if (!feature.properties) return;
    var html = '';
    for (var key in feature.properties) {
        if (!Object.prototype.hasOwnProperty.call(feature.properties, key)) continue;
        var val = feature.properties[key];
        if (val && typeof val === 'object') {
            val = '<pre style="margin:0;">' + JSON.stringify(val, null, 2) + '</pre>';
        }
        html += '<p><strong>' + key + '</strong>: ' + val + '</p>';
    }
    if (html) layer.bindPopup(html);
}

// load and add your GeoJSON; also draw chronological time-series line
function getData(timeSeriesLayer) {
    fetch('data/NorthMagneticPole.geojson')
        .then(function (response) {
            if (!response.ok) throw new Error('HTTP ' + response.status + ' when fetching GeoJSON');
            return response.json();
        })
        .then(function (json) {
            var markerOpts = {
                radius: 8,
                fillColor: '#ff7800',
                color: '#000',
                weight: 1,
                opacity: 1,
                fillOpacity: 0.8
            };

            // points + labels
            var pointLayer = L.geoJson(json, {
                pointToLayer: function (feature, latlng) {
                    return L.circleMarker(latlng, markerOpts);
                },
                onEachFeature: onEachFeature
            }).addTo(map);

            // build chronological polyline (only Point features with a valid year)
            var featuresWithYear = (json.features || [])
                .filter(f => f && f.geometry && f.geometry.type === 'Point')
                .map(f => ({ f, y: getYear(f.properties) }))
                .filter(obj => obj.y !== null);

            // sort oldest -> newest
            featuresWithYear.sort((a, b) => a.y - b.y);

            var lineLatLngs = featuresWithYear.map(obj => {
                var coords = obj.f.geometry.coordinates; // [lon, lat]
                return [coords[1], coords[0]];
            });

            timeSeriesLayer.clearLayers();
            if (lineLatLngs.length >= 2) {
                var line = L.polyline(lineLatLngs, {
                    color: '#fff',
                    weight: 3,
                    opacity: 0.9
                }).addTo(timeSeriesLayer);
            }
        })
        .catch(function (err) {
            console.error('Failed to load GeoJSON:', err);
        });
}

document.addEventListener('DOMContentLoaded', createMap);
