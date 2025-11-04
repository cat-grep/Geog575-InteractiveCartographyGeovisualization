//begin script when window loads
window.onload = setMap();

//set up choropleth map
function setMap(){

    //map frame dimensions
    var width = 960,
        height = 460;

    //create new svg container for the map
    var map = d3.select("body")
        .append("svg")
        .attr("class", "map")
        .attr("width", width)
        .attr("height", height);

    //create Albers equal area conic projection centered on France
    var projection = d3.geoAlbers()
        .center([-90, 35])
        .rotate([50, 40, 20])
        .parallels([30, 45])
        .scale(1000)
        .translate([width / 2, height / 2]);

    var path = d3.geoPath()
        .projection(projection);

    //use Promise.all to parallelize asynchronous data loading
    var promises = [//d3.csv("data/unitsData.csv"),                    
                    d3.json("data/ne_110m_admin_1_states_provinces_simplified.topojson"),                    
                    //d3.json("data/FranceRegions.topojson")                   
                    ];    
    Promise.all(promises).then(callback);

    function callback(data) {

        //create graticule generator
        var graticule = d3.geoGraticule()
            .step([5, 5]); //place graticule lines every 5 degrees of longitude and latitude

        //create graticule background
        var gratBackground = map.append("path")
            .datum(graticule.outline()) //bind graticule background
            .attr("class", "gratBackground") //assign class for styling
            .attr("d", path) //project graticule
        
        //create graticule lines
        var gratLines = map.selectAll(".gratLines") //select graticule elements that will be created
            .data(graticule.lines()) //bind graticule lines to each element to be created
            .enter() //create an element for each datum
            .append("path") //append each element to the svg as a path element
            .attr("class", "gratLines") //assign class for styling
            .attr("d", path); //project graticule lines

        var us_states_topojson = data[0];
            // europe = data[1],
            // france = data[2];
        console.log(us_states_topojson);
        // console.log(europe);
        // console.log(france);

        console.log(Object.keys(us_states_topojson.objects));

        //translate europe TopoJSON
        var us_states_geojson = topojson.feature(us_states_topojson, us_states_topojson.objects.ne_110m_admin_1_states_provinces);
        // var europeCountries = topojson.feature(europe, europe.objects.EuropeCountries),
        //     franceRegions = topojson.feature(france, france.objects.FranceRegions);

        //examine the results
        console.log(us_states_geojson);
        // console.log(europeCountries);
        // console.log(franceRegions);

        var states = map.append("path")
            .datum(us_states_geojson)
            .attr("class", "states")
            .attr("d", path);

        //add Europe countries to map
        // var countries = map.append("path")
        //     .datum(europeCountries)
        //     .attr("class", "countries")
        //     .attr("d", path);

        //add France regions to map
        // var regions = map.selectAll(".regions")
        //     .data(franceRegions)
        //     .enter()
        //     .append("path")
        //     .attr("class", function(d){
        //         return "regions " + d.properties.adm1_code;
        //     })
        //     .attr("d", path);

        
    }
};