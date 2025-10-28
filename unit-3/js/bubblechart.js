//execute script when window is loaded
window.onload = function () {

    d3.json('../data/crypto_loss_by_state.json').then((data) => {
        //SVG dimension variables
        const w = 1800, h = 600;
        const margin = { top: 50, right: 40, bottom: 40, left: 70 };

        //Example 1.2 line 1...container block
        var container = d3.select("body") //get the <body> element from the DOM
            .append("svg") //put a new svg in the body
            .attr("width", w) //assign the width
            .attr("height", h) //assign the height
            .attr("class", "container") //always assign a class (as the block name) for styling and future selection
            .style("background-color", "rgba(0, 0, 0, 0.6)"); //only put a semicolon at the end of the block!

        var innerRect = container.append("rect")
            .datum(500) //a single value is a DATUM
            .attr("width", d => d * 4 - 350)
            .attr("height", d => d)
            .attr("class", "innerRect") //class name
            .attr("x", 80) //position from left on the x (horizontal) axis
            .attr("y", 50) //position from top on the y (vertical) axis
            .style("fill", "rgba(0, 0, 0, 0.3)"); //fill color

        //create a text element and add the title
        var title = container.append("text")
            .attr("class", "title")
            .attr("text-anchor", "middle")
            .attr("x", w / 2)
            .attr("y", 30)
            .text("CRYPTOCURRENCY LOSSES BY STATE")
            .style("fill", "#fff");

        //data accessors
        const loss = d => d.loss_usd;
        const name = d => d.region;

        //scales
        const minLoss = d3.min(data, loss);
        const maxLoss = d3.max(data, loss);

        var x = d3.scaleLinear() //create the scale
            .domain([0, data.length - 1]) //output min and max
            .range([margin.left + 20, w - margin.right - 200]); //input min and max

        //scale for circles center y coordinate
        var y = d3.scaleLinear()
            .domain([0, maxLoss]).nice()
            .range([h - margin.bottom, margin.top]);

        //color scale generator 
        var color = d3.scaleLinear()
            .range([
                "#FDBE85",
                "#D94701"
            ])
            .domain([
                minLoss,
                maxLoss
            ]);

        //create y axis generator
        var yAxis = d3.axisLeft(y)
            .ticks(8).tickFormat(d3.format("$.2s"));

        //create axis g element and add axis
        var axis = container.append("g")
            .attr("class", "axis")
            .attr("transform", `translate(${margin.left},0)`)
            .call(yAxis)
            .style("color", "#fff");

        var circles = container.selectAll(".circles") //create an empty selection
            .data(data) //here we feed in an array
            .enter() //one of the great mysteries of the universe
            .append("circle") //inspect the HTML--holy crap, there's some circles there
            .attr("class", "circles")
            .attr("id", d => name(d))
            .attr("r", d => {
                // scale area by dollars
                const area = loss(d) * 0.0000002; // tweak factor as needed
                return Math.sqrt(area / Math.PI);
            })
            .attr("cx", (d, i) => x(i))
            .attr("cy", d => y(loss(d)))
            .style("fill", d => color(loss(d)))
            .style("stroke", "#fff");

        //create circle labels
        var labels = container.selectAll(".labels")
            .data(data)
            .enter()
            .append("text")
            .attr("class", "labels")
            .attr("text-anchor", "start")
            .attr("y", d => y(loss(d)) + 5)
            .style("fill", "#fff");

        //first line of label
        var nameLine = labels.append("tspan")
            .attr("class", "nameLine")
            .attr("x", (d, i) => x(i) + Math.sqrt((loss(d) * 0.0000002) / Math.PI) + 6)
            .text(d => name(d));

        //create format generator
        var format = d3.format(",");

        //second line of label
        var moneyLine = labels.append("tspan")
            .attr("class", "popLine")
            .attr("x", (d, i) => x(i) + Math.sqrt((loss(d) * 0.0000002) / Math.PI) + 6)
            .attr("dy", "15")
            .text(d => `Loss $${format(loss(d))}`);
    }).catch(err => console.error('Failed to load JSON:', err));
};