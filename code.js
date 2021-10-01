const urlBase = 'https://health.data.ny.gov/resource/gnzp-ekau.json?';
const SPACE = '%20';
const APOSTROPHE = '%27';
const PERCENT = '%25';
const COMMA = '%2C';

//takes in array of parameters, generates API call and returns results in JSON format
function callAPI(params) {
	
	let url = urlBase;

	//loop through all parameters to build query
	params.forEach(param =>
		url += param + '&'
	);

	//apply token needed for authentication
	let apiHeaders = new Headers({
		'X-App-Token': 'GxQGl6JCPJ5dUoXdnJXDE1ZTN'
	});

	const request = new Request(url, {
		method: 'GET',
		headers: apiHeaders,
	});

	//make call and return results, else show errors on console
	return fetch(request)
		.then((response) => response.json())
		.catch(error =>
			console.log(error)
		);
}

//takes in a DOM element, builds the appropriate query, then passes results to function that populates DOM element with graph
function findCancerByAgeGroup(element) {
	const params = [];

	//create each piece of query
	const count = generateCountClause(['age_group']);
	const select = generateSelectClause(['age_group', count]);
	const where = generateWhereClause([['ccs_diagnosis_description', 'CANCER']]);
	const group = generateGroupClause('age_group');

	//push each piece of query to array
	params.push(select);
	params.push(where);
	params.push(group);

	//pass array to chart generating function after Promise is fulfilled
	callAPI(params)
		.then(data => {
			generatePieChart(data, element);
		});
}

// takes in DOM element, calls function to populate datasets for males and females, then passes results to function that populates DOM element with graph
async function findAverageMortalityByRaceAndGender(element) {

	//need to wait for getRaceAndGenderData() because function returns Promise
	let dataMale = await getRaceAndGenderData('M');
	let dataFemale = await getRaceAndGenderData('F');
	
	generateRadarChart(dataMale, dataFemale, element);
	
}

//builds appropriate query based on gender and returns API JSON results
function getRaceAndGenderData(gender) {

	const params = [];

	//create query elements
	const avg = generateAvgClause(['apr_severity_of_illness_code']);
	const select = generateSelectClause(['race', avg]);
	const where = generateWhereClause([['ccs_diagnosis_description', 'CANCER'], ['gender', gender]]);
	const group = generateGroupClause('race');

	//push query elements to array
	params.push(select);
	params.push(where);
	params.push(group);

	//pass array to API function and return results
	return callAPI(params);
}

//loop through array of [field, value] pairings to create valid WHERE clause
function generateWhereClause(fields) {

	let stringReturn = '$where=';
	
	for(let i = 0; i < fields.length; i++) {

		stringReturn += 'UPPER(' + fields[i][0] + ')' + SPACE + 'like' + SPACE + APOSTROPHE + PERCENT + fields[i][1] + PERCENT + APOSTROPHE;

		//only add " AND " to clause string if we aren't on the last element of "fields" array
		if(i != fields.length - 1) {
			stringReturn += SPACE + 'AND' + SPACE;
		}
	}

	return stringReturn;
}

//returns valid GROUP clause given a field name
function generateGroupClause(field) {
	return '$group=' + field;
}

//returns valid SELECT clause given array of fields
function generateSelectClause(fields) {
	let stringReturn = '$select=';

	//loop through all elements of "fields"
	for(let i = 0; i < fields.length; i++) {

		stringReturn += fields[i]

		//only add comma field element if we aren't on the last element of "fields" array
		if(i != fields.length - 1) {
			stringReturn += COMMA;
		}
	}

	return stringReturn;
}

//returns valid COUNT clause given field array
function generateCountClause(field) {
	return 'COUNT(' + field[0] + ')';
}

//returns valid AVG clause given field array
function generateAvgClause(field) {
	return 'AVG(' + field[0] + ')';
}

//generates and returns a random RGB color value
function generateRandomColor() {

	//using 256 because Math.random() will return a value between (0-1)
	//0 is inclusive but 1 is not
	//since we are calling floor, max value of ((Math.random()) * 256) will be 255 (max RGB value)
	const r = Math.floor(Math.random() * 256);
	const g = Math.floor(Math.random() * 256);
	const b = Math.floor(Math.random() * 256);
	const rgb = `rgb(${r},${g},${b})`;

	return rgb;
}

//take in one dataset and DOM element name, creates graph and updates DOM
function generatePieChart(raw_data, dom_element) {
	
	var ctx = document.getElementById(dom_element).getContext('2d');

	let label_values = [];
	let data_values = [];
	let color_values = []
	
	//loop through dataset, set our labels, data values, and apply a random color
	raw_data.forEach(element => {

		object_element = Object.values(element);
		label_values.push(object_element[0]);
		data_values.push(object_element[1]);
		color_values.push(generateRandomColor());

	})

	//set data values for chart
	const data = {
	  labels: label_values,
	  datasets: [{
	    data: data_values,
	    backgroundColor: color_values,
	    hoverOffset: 4
	  }]
	};

	//initialize chart
	var myChart = new Chart(ctx, {
	    type: 'doughnut',
	    data: data,
	    options: {
		    responsive: true,
		    legend: {
		    	position: 'bottom'
		    },
		    title: {
            	display: true,
            	text: 'Cancer by Age Group'
        	},
	        animation: {
	            animateScale: true,
	            animateRotate: true
	        }
  		}
	    
	});
}

//takes in two datasets contains labels and values as well as name of DOM element, creates graph and updates DOM
function generateRadarChart(raw_data_1, raw_data_2, dom_element) {

	var ctx = document.getElementById(dom_element).getContext('2d');

	let label_values = [];
	let data_values1 = [];
	let data_values2 = [];

	//loop through dataset 1, set our labels and data values
	raw_data_1.forEach(element => {

		object_element = Object.values(element);
		label_values.push(object_element[0]);
		data_values1.push(object_element[1]);
	})

	//only need to set data values for dataset 2 as labels are the same as dataset 1
	raw_data_2.forEach(element => {

		object_element = Object.values(element);
		data_values2.push(object_element[1]);
	})

	//configure data for chart
	const data = {
	  	labels: label_values,
	  	datasets: [
	  	{
		    label: 'Males',
		    data: data_values1,
		    fill: true,
		    backgroundColor: 'rgba(255, 99, 132, 0.2)',
		    borderColor: 'rgb(255, 99, 132)',
		    pointBackgroundColor: 'rgb(255, 99, 132)',
		    pointBorderColor: '#fff',
		    pointHoverBackgroundColor: '#fff',
		    pointHoverBorderColor: 'rgb(255, 99, 132)'
	  	}, 
	  	{
		    label: 'Females',
		    data: data_values2,
		    fill: true,
		    backgroundColor: 'rgba(54, 162, 235, 0.2)',
		    borderColor: 'rgb(54, 162, 235)',
		    pointBackgroundColor: 'rgb(54, 162, 235)',
		    pointBorderColor: '#fff',
		    pointHoverBackgroundColor: '#fff',
		    pointHoverBorderColor: 'rgb(54, 162, 235)'
	  	}]
	};

	//initialize chart
	var myRadar = new Chart(ctx, {
  		type: 'radar',
  		data: data,
  		options: {
    		elements: {
      			line: {
        			borderWidth: 3
      			}
    		},
    		legend: {
		    	position: 'bottom'
		    },
		    title: {
            	display: true,
            	text: 'Average Mortality Code by Race and Gender'
        	},
  		},
	});

}

//driver function to generate all of our charts
function generateGraphs() {
	findCancerByAgeGroup('pie');
	findAverageMortalityByRaceAndGender('radar');
}