	/**
	 * Array containing dates
	 * @type {Array}
	 */
	var xColumns = ["x"];
	/**
	 * Fix data
	 * @type {Array}
	 */
	var chartData = ['Fix'];

	var objData = [];
	/**
	 * Vue.js app container
	 * @type {Vue}
	 */
	var app = new Vue({
		el: '#app',
		data: {
			fix: [],
			errorObj: {
				errorContClass: "hide",
				errorMessage : ""
			},
			siFormDisabled: false,
			emptyRange: [],
			rangeSelection: "",
			inputclass: "form-control",
			coins: [ {value: "MXN", text: "MXN"}, {value: "GBP", text: "GBP"}, {value: "USD", text: "USD"} ],
			toFixCoin: "MXN",
			baseCoin: "USD",
			local: {
				dow: 0, // Sunday is the first day of the week
				hourTip: 'Select Hour', // tip of select hour
				minuteTip: 'Select Minute', // tip of select minute
				secondTip: 'Select Second', // tip of select second
				yearSuffix: '', // suffix of head
				monthsHead: 'January_February_March_April_May_June_July_August_September_October_November_December'.split('_'), // months of head
				months: 'Jan_Feb_Mar_Apr_May_Jun_Jul_Aug_Sep_Oct_Nov_Dec'.split('_'), // months of panel
				weeks: 'Su_Mo_Tu_We_Th_Fr_Sa'.split('_'), // weeks
				cancelTip: 'cancel',
				submitTip: 'confirm'
			  }
		},
		methods: {
			disabledDate: function (time) {
				var day = time.getDay();
				return day === 0 || day === 6;
			},
			onSubmit: function (event) {
				var self = this;
				
				if ( self.baseCoin == self.toFixCoin) {
					self.errorObj.errorContClass = "";
					self.errorObj.errorMessage = "Las monedas base y destino deben ser diferentes";
					self.siFormDisabled = true;
					return;
				}
				if ( self.emptyRange.length == 0 ) 
				{
					self.errorObj.errorContClass = "";
					self.errorObj.errorMessage = "Selecciona un periodo";
					return;
				}
				//event.target.dataset.amount;
				var start = moment(self.emptyRange[0]);
				var end  = moment(self.emptyRange[1]);
				var now  = moment();
				
				if ( now < end ) 
				{
					self.errorObj.errorContClass = "";
					self.errorObj.errorMessage = "La fecha de fin no puede ser mayor al día de hoy";
					self.siFormDisabled = true;
					return
				}
				//Returns 
				else {	
					self.errorObj.errorContClass = "hide";
					self.errorObj.errorMessage = "";
					self.siFormDisabled = true;
				}
				//Because of the API we allow anly 50 days of historical fix
				if ( end.diff(start, 'days') > 50 ) 
				{
					self.errorObj.errorContClass = "";
					self.errorObj.errorMessage = "No puedes seleccionar un periodo de más de 50 días";
					return
				}
				self.rangeSelection = "Periodo consultado del " + start.format("DD-MM-YYYY") + " hasta " + end.format("DD-MM-YYYY");
				//Fetch data and draw graphic
				initC3(start, end);
				
			}
		},
		mounted: function() {

		}
	});


	/**
	 * Resset default values
	 * You should call this function after subtmit the form
	 * @return void
	 */
	function initC3 (start, end) {
		count = 0;
		xColumns = ["x"];
		chartData = ['Fix'];	
		createC3(start, end);
	}
	/**
	 * Creates the array of the dates
	 * @author Emmanuel Romero 
	 * @param  moment start start data
	 * @param  moment end   end date
	 * @return void
	 */
	function createC3(start, end )
	{
		for (var m = moment(start); m.isBefore(end); m.add(1, 'days')) {
			xColumns.push(m.format('YYYY-MM-DD'));
		}
		//Call fetchData function to populate chardData object
		fetchData(start, end, 0);
	}

	/**
	 * Fetch the data from fixer.io and populates de chartData object
	 * @author Emmanuel Romero
	 * @return void
	 */
	function fetchData( start, end, count )
	{	
		if (start < end )
		{	
			var nextDay = start.format("YYYY-MM-DD");
			var baseCoin = document.getElementById("baseCoin").options[document.getElementById("baseCoin").selectedIndex].value;
			var toFixCoin = document.getElementById("toFixCoin").options[document.getElementById("toFixCoin").selectedIndex].value
			axios.get('https://api.fixer.io/'+nextDay+"?base="+baseCoin+"&symbols="+toFixCoin)
			.then(function (response) {
				if (response.status == "200") {
					
					//app.fix.push({value: rate});
					//console.log(Math.round(num * 100) / 100);
					chartData.push(response.data.rates[toFixCoin]);
					count++;
					if ( count % 2 == 0 ) {
						draw();
					}
					
					fetchData(start.add(1, 'days'), end, count);
				}
			})
			.catch(function(){
				count++;
				fetchData(start.add(1, 'days'), end, count);
			} )
		}
		else {	//Generates the graphic after complete the cicle
			draw();
		}
	}

	/**
	 * Generates the graphic
	 * @author Emmanuel Romero
	 * @return void
	 */
	function draw() {
		c3.generate({
				bindto: '#chart',
				legend: {
					position: 'right'
				},
				data: {
					x: 'x',
					columns: [
						xColumns,
						chartData
					]
				},
				axis: {
					x: {
						type: 'timeseries',
						tick: {
							format: '%d-%m-%Y',
						}
					},
					y1: {
						show: true,
						tick: {
							format: function (x) {
								return x.toFix(5);
							}
						}
					}
				},
				tooltip: {
					format: {
						title: function (d) { return 'Data ' + moment(d).format("DD-MMM-YYYY"); },
						value: function (value, ratio, id) {
							var format = id === 'data1' ? d3.format(',') : d3.format('$');
							return format(value);
						}
					}
				}
			});
	}