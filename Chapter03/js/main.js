//initialize function called when the script loads
function initialize() {

	//define an array of objects for cities and population
	var cityPop = [
		{
			city: 'Madison',
			population: 233209
		},
		{
			city: 'Milwaukee',
			population: 594833
		},
		{
			city: 'Green Bay',
			population: 104057
		},
		{
			city: 'Superior',
			population: 27244
		}
	];

	//create the table element
	var table = document.createElement("table");

	//create a header row
	var headerRow = document.createElement("tr");

	//add the "City" and "Population" columns to the header row
	headerRow.insertAdjacentHTML("beforeend", "<th>City</th><th>Population</th>")

	//add the row to the table
	table.appendChild(headerRow);

	//loop to add a new row for each city
	for (var i = 0; i < cityPop.length; i++) {
		//assign longer html strings to a variable
		var rowHtml = "<tr><td>" + cityPop[i].city + "</td><td>" + cityPop[i].population + "</td></tr>";
		//add the row's html string to the table
		table.insertAdjacentHTML('beforeend', rowHtml);
	}

	//add the table to the div in index.html
	document.querySelector("#mydiv").appendChild(table);

	//add City Size column
	addColumns(cityPop);

	//add event listeners
	addEvents();
};

//add City Size column
//condition 1: header row and content row
//condition 2: read population and assign small, medium or large
function addColumns(cityPop) {
	//loop through the table rows
	document.querySelectorAll("tr").forEach(function (row, i) {
		if (i == 0) { // header row
			row.insertAdjacentHTML('beforeend', '<th>City Size</th>');
		}
		else { // content row
			var citySize;
			//assign small, medium or large based on city size
			if (cityPop[i - 1].population < 100000) {
				citySize = 'Small';
			} 
			else if (cityPop[i - 1].population < 500000) {
				citySize = 'Medium';
			} 
			else {
				citySize = 'Large';
			};
			row.insertAdjacentHTML('beforeend', '<td>' + citySize + '</td>');
		};
	});
};

//add events function
function addEvents() {
	//change color of text when mouse is over the table
	document.querySelector("table").addEventListener("mouseover", function () {
		//create random color
		var color = "rgb(";
		// color has three numbers, so loop 3 times
		for (var i = 0; i < 3; i++) {
			// color is an int number from 0 to 255
			var random = Math.round(Math.random() * 255);
			color += random;
			// add comma if not the last number
			if (i < 2) {
				color += ",";

			} else {
				color += ")";
			};
		};
		document.querySelector("table").style.color = color;
	});

	//when table is clicked, pop up alert 
	function clickme() {
		// pop up alert
		alert('Hey, you clicked me!');
	};
	// add event listener to table, call clickme function when clicked
	document.querySelector("table").addEventListener("click", clickme)
};

//define callback for ajax function
function debugCallback(response){
	// bug fix: changed myData to response
	document.querySelector("#mydiv").insertAdjacentHTML('beforeend', '<br>GeoJSON data:<br>' + JSON.stringify(response))
};

//define ajax function for retrieving GeoJSON data
function debugAjax(){
	//define a variable to hold the data
	var myData;
	
	fetch("data/MegaCities.geojson")
		// bug fix: add conversion step
		.then(function(response){
            return response.json();
        }) 
		.then(function(response){
			// bug fix: assign value to myData
			myData = response;
			debugCallback(response);
		})
};

// bug fix: merge initialize and debugAjax into DOMContentLoaded event listener
//initialize function when the window has loaded
document.addEventListener('DOMContentLoaded', function() {
    initialize();
    debugAjax();
});