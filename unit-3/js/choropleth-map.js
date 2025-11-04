//begin script when window loads
window.onload = setMap();

//set up choropleth map
function setMap(){

    //map frame dimensions
    var width = 800,
        height = 500;

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
    var promises = [d3.json("data/crypto_loss_by_state.topojson")];    
    Promise.all(promises).then(callback);

    function callback(data) {

        //create graticule generator
        var graticule = d3.geoGraticule()
            .step([5, 5]); //place graticule lines every 5 degrees of longitude and latitude
        
        //create graticule lines
        var gratLines = map.selectAll(".gratLines") //select graticule elements that will be created
            .data(graticule.lines()) //bind graticule lines to each element to be created
            .enter() //create an element for each datum
            .append("path") //append each element to the svg as a path element
            .attr("class", "gratLines") //assign class for styling
            .attr("d", path); //project graticule lines

        var us_states_topojson = data[0];
        console.log(us_states_topojson);

        console.log(Object.keys(us_states_topojson.objects));

        //translate europe TopoJSON
        var us_states_geojson = topojson.feature(us_states_topojson, us_states_topojson.objects.crypto_loss_by_state);

        //examine the results
        console.log(us_states_geojson);

        var states = map.append("path")
            .datum(us_states_geojson)
            .attr("class", "states")
            .attr("d", path);

    }
};