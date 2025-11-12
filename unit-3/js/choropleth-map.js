(function () {

    //variables for data join
    var attrArray = ["rank", "state", "loss_usd"];
    var expressed = attrArray[2]; //initial attribute

    //begin script when window loads
    window.onload = setMap();

    //set up choropleth map
    function setMap() {

        //map frame dimensions
        var width = window.innerWidth * 0.5,
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
            .scale(600)
            .translate([width / 2, height / 2]);

        var path = d3.geoPath()
            .projection(projection);

        //use Promise.all to parallelize asynchronous data loading
        // var promises = [d3.json("data/crypto_loss_by_state.topojson")];
        var promises = [
            d3.json("data/ne_110m_admin_0_countries.topojson"),
            d3.json("data/ne_110m_admin_1_states_provinces_simplified.topojson"),
            d3.csv("data/crypto_loss_by_state_with_adm1_code.csv")
        ];
        Promise.all(promises).then(callback);

        function callback(data) {

            var countries_topojson = data[0],
                us_states_topojson = data[1],
                csvData = data[2];
            // console.log(countries_topojson);
            // console.log(us_states_topojson);

            // console.log(Object.keys(countries_topojson.objects));
            // console.log(Object.keys(us_states_topojson.objects));

            //place graticule on the map
            setGraticule(map, path);

            //translate TopoJSON
            var countries_geojson = topojson.feature(countries_topojson, countries_topojson.objects.ne_110m_admin_0_countries),
                us_states_geojson = topojson.feature(us_states_topojson, us_states_topojson.objects.ne_110m_admin_1_states_provinces).features;

            //examine the results
            // console.log(countries_geojson);
            // console.log(us_states_geojson);

            //add countries to map
            var countries = map.append("path")
                .datum(countries_geojson)
                .attr("class", "countries")
                .attr("d", path);
            // var states = map.append("path")
            //     .datum(us_states_geojson)
            //     .attr("class", "states")
            //     .attr("d", path);

            //join csv data to GeoJSON enumeration units
            us_states_geojson = joinData(us_states_geojson, csvData);

            //create the color scale
            var colorScale = makeColorScale(csvData);

            //add enumeration units to the map
            setEnumerationUnits(us_states_geojson, map, path, colorScale);

            //add coordinated visualization to the map
            setChart(csvData, colorScale);

        }
    };

    function setGraticule(map, path) {
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
    };

    function joinData(us_states_geojson, csvData) {
        //loop through csv to assign each set of csv attribute values to geojson region
        for (var i = 0; i < csvData.length; i++) {
            var csvRegion = csvData[i]; //the current region
            var csvKey = csvRegion.adm1_code; //the CSV primary key

            //loop through geojson regions to find correct region
            for (var a = 0; a < us_states_geojson.length; a++) {

                var geojsonProps = us_states_geojson[a].properties; //the current region geojson properties
                var geojsonKey = geojsonProps.adm1_code; //the geojson primary key

                //where primary keys match, transfer csv data to geojson properties object
                if (geojsonKey == csvKey) {

                    //assign all attributes and values
                    attrArray.forEach(function (attr) {
                        var val = parseFloat(csvRegion[attr]); //get csv attribute value
                        geojsonProps[attr] = val; //assign attribute and value to geojson properties
                    });
                };
            };
        };
        // console.log(us_states_geojson);
        return us_states_geojson;
    };

    //function to create color scale generator
    function makeColorScale(data) {
        var colorClasses = [
            "#f2f0f7",
            "#cbc9e2",
            "#9e9ac8",
            "#756bb1",
            "#54278f"
        ];

        //create color scale generator
        var colorScale = d3.scaleQuantile()
            .range(colorClasses);

        //build array of all values of the expressed attribute
        var domainArray = [];
        for (var i = 0; i < data.length; i++) {
            var val = parseFloat(data[i][expressed]);
            domainArray.push(val);
        };
        //assign array of expressed values as scale domain
        colorScale.domain(domainArray);

        // console.log(colorScale.quantiles())

        // //build two-value array of minimum and maximum expressed attribute values
        // var minmax = [
        //     d3.min(data, function (d) { return parseFloat(d[expressed]); }),
        //     d3.max(data, function (d) { return parseFloat(d[expressed]); })
        // ];
        // //assign two-value array as scale domain
        // colorScale.domain(minmax);

        // console.log(colorScale.quantiles())

        //cluster data using ckmeans clustering algorithm to create natural breaks
        var clusters = ss.ckmeans(domainArray, 5);
        //reset domain array to cluster minimums
        domainArray = clusters.map(function (d) {
            return d3.min(d);
        });
        //remove first value from domain array to create class breakpoints
        domainArray.shift();


        return colorScale;
    };

    function setEnumerationUnits(us_states_geojson, map, path, colorScale) {
        var regions = map.selectAll(".states")
            .data(us_states_geojson)
            .enter()
            .append("path")
            .attr("class", function (d) {
                return "states " + d.properties.adm1_code;
            })
            .attr("d", path)
            .style("fill", function (d) {
                var value = d.properties[expressed];
                if (value) {
                    return colorScale(d.properties[expressed]);
                } else {
                    return "#ccc";
                }
            });
    };

    //function to create coordinated bar chart
    function setChart(csvData, colorScale) {
        //chart frame dimensions
        const chartWidth = window.innerWidth * 0.43;
        const chartHeight = 500;
        const leftPadding = 80;   // leave room for Y axis
        const rightPadding = 20;
        const topPadding = 20;
        const bottomPadding = 60; // leave room for rotated X labels
        const chartInnerWidth = chartWidth - leftPadding - rightPadding;
        const chartInnerHeight = chartHeight - topPadding - bottomPadding;
        const translate = "translate(" + leftPadding + "," + topPadding + ")";

        //create a second svg element to hold the bar chart
        var chart = d3.select("body")
            .append("svg")
            .attr("width", chartWidth)
            .attr("height", chartHeight)
            .attr("class", "chart");

        //create a rectangle for chart background fill
        var chartBackground = chart.append("rect")
            .attr("class", "chartBackground")
            .attr("width", chartInnerWidth)
            .attr("height", chartInnerHeight)
            .attr("transform", translate);

        // find the maximum data value
        // var maxVal = d3.max(csvData, function (d) {
        //     return parseFloat(d[expressed]);
        // });
        const maxM = d3.max(csvData, d => (+d[expressed] || 0) / 1e6) || 0;

        // X: states as band
        const NAME_FIELD = "state";
        const xScale = d3.scaleBand()
            .domain(csvData.map(d => d[NAME_FIELD]))
            .range([0, chartInnerWidth])
            .padding(0.1);

        //create a scale to size bars proportionally to frame
        var yScale = d3.scaleLinear()
            .domain([0, maxM * 1.1])
            .range([chartInnerHeight, 0])
            .nice();

        //set bars for each province
        var bars = chart.selectAll(".bars")
            .data(csvData)
            .enter()
            .append("rect")
            .sort(function (a, b) {
                return a[expressed] - b[expressed];
            })
            .attr("class", function (d) {
                return "bars " + (d.adm1_code || "na");
            })
            .attr("width", xScale.bandwidth())
            .attr("height", function (d) {
                return chartInnerHeight - yScale((+d[expressed] || 0) / 1e6);
            })
            .attr("x", function (d, i) {
                return leftPadding + xScale(d[NAME_FIELD]);
            })
            .attr("y", function (d) {
                return topPadding + yScale((+d[expressed] || 0) / 1e6);
            })
            .style("fill", function (d) {
                return colorScale(+d[expressed] || 0);
            });

        // helper function to format numbers
        function formatNumber(num) {
            if (num >= 1000000) {
                return (num / 1000000).toFixed(1) + 'M';
            } else if (num >= 1000) {
                return (num / 1000).toFixed(1) + 'K';
            }
            return num.toFixed(0);
        }

        //annotate bars with attribute value text
        var numbers = chart.selectAll(".numbers")
            .data(csvData)
            .enter()
            .append("text")
            .attr("class", function (d) {
                return "numbers " + (d.adm1_code || "na");
            })
            .sort(function (a, b) {
                return a[expressed] - b[expressed]
            })
            .attr("text-anchor", "end")
            .attr("x", function (d, i) {
                return leftPadding + xScale(d[NAME_FIELD]) + xScale.bandwidth() / 2;  // center of each bar
            })
            .attr("y", function (d) {
                return topPadding + yScale((+d[expressed] || 0) / 1e6) - 4; // position above the bar
            })
            .text(function (d) {
                return formatNumber(parseFloat(d[expressed]));
            })
            .each(function (d, i) {
                    const bw = xScale.bandwidth();
                    const vM = (+d[expressed] || 0) / 1e6;
                    const x = leftPadding + xScale(d[NAME_FIELD]) + bw / 2;
                    const y = topPadding + yScale(vM) - 4;

                    d3.select(this)
                        .attr("x", x + 20)
                        .attr("y", y + 3)
                        .attr("transform", `rotate(-90,${x},${y})`)
                        .text(formatNumber(+d[expressed] || 0));
                });

        //create vertical axis generator
        const yAxis = d3.axisLeft(yScale)
            .ticks(8)
            .tickFormat(d => d3.format(".1f")(d) + "M");

        //place axis
        var y_axis = chart.append("g")
            .attr("class", "axis y-axis")
            .attr("transform", translate)
            .call(yAxis);

        const xAxis = d3.axisBottom(xScale)
            .tickSizeOuter(0);

        const x_axis = chart.append("g")
            .attr("class", "axis x-axis")
            .attr("transform", `translate(${leftPadding},${topPadding + chartInnerHeight})`)
            .call(xAxis)
            .selectAll("text")
            .attr("text-anchor", "end")
            .attr("transform", "rotate(-45)")
            .attr("dx", "-0.5em")
            .attr("dy", "0.25em");

        //create frame for chart border
        var chartFrame = chart.append("rect")
            .attr("class", "chartFrame")
            .attr("width", chartInnerWidth)
            .attr("height", chartInnerHeight)
            .attr("transform", translate)
            .attr("fill", "none");

        //create a text element for the chart title
        var chartTitle = chart.append("text")
            .attr("x", leftPadding)
            .attr("y", 16)
            .attr("class", "chartTitle")
            .text("Amount of crypto loss in each state");
    };

})(); 