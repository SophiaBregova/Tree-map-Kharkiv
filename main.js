window.onload = init;

function init(){
	//init map
	const map = new ol.Map({
		view: new ol.View({
			center: [4047628.838682284, 6445159.346193792],//[4036565.3473956822,6444244.5018453095],
			zoom: 18,//12,
			maxZoom:19,
			minZoom:12
		}),
		layers: [
			new ol.layer.Tile({
				source: new ol.source.OSM()
			})
		],
		target: 'treeMap'
	})

	//vector layers
	//styles
	//data array style for different tree state
	var goodStyle = [new ol.style.Fill({color:[174,237,99,1]}),new ol.style.Stroke({color:[37, 112, 39, 1],width: 1})];
	var problemStyle = [new ol.style.Fill({color:[235,219,61,1]}),new ol.style.Stroke({color:[222, 135, 101, 1],width: 1})];
	var badStyle = [new ol.style.Fill({color:[255,113,32,1]}),new ol.style.Stroke({color:[148, 65, 33, 1],width: 1})];
	var youngStyle = [new ol.style.Fill({color:[61,184,235,1]}),new ol.style.Stroke({color:[29, 85, 134, 1],width: 1})];
	var dryStyle = [new ol.style.Fill({color:[171,171,171,1]}),new ol.style.Stroke({color:[64, 64, 64, 1],width: 1})];

	//ratio for tree diameter
	var ratio = 0.25;

	var btnTrunk = {
		'btn': document.getElementById("btnTrunk"),
		'state': 'enabled'
	}

	var	btnIcon = {
		 'btn': document.getElementById("btnIcon"),
		 'state': 'enabled'
		}

	//set different style for different tree
	function getStyleFeature(feature){
		let diameter = feature.get('diameter');
		if (!diameter){
			diameter = 30;
		}
		let radius = diameter*ratio;

		const stateGood = new ol.style.Style({
				image: new ol.style.Circle({
					radius:radius,
					fill: goodStyle[0],
					stroke: goodStyle[1]
						})
					});
		const stateProblem = new ol.style.Style({
			image: new ol.style.Circle({
				radius:radius,
				fill: problemStyle[0],
				stroke: problemStyle[1]
					})
				});
		const stateBad = new ol.style.Style({
			image: new ol.style.Circle({
				radius:radius,
				fill: badStyle[0],
				stroke: badStyle[1]
					})
				});
		const stateYoung = new ol.style.Style({
			image: new ol.style.Circle({
				radius:radius,
				fill: youngStyle[0],
				stroke: youngStyle[1]
					})
				});
		const stateDry = new ol.style.Style({
			image: new ol.style.Circle({
				radius:radius,
				fill: dryStyle[0],
				stroke: dryStyle[1]
					})
				});

		let currentStyle;
		switch(feature.get('state')){
			case 'добрий':
				currentStyle = stateGood;
				break;
			case 'проблемне':
				currentStyle = stateProblem;
				break;
			case 'поганий':
				currentStyle = stateBad;
				break;
			case 'молоде':
				currentStyle = stateYoung;
				break;
			case 'засохле':
				currentStyle = stateDry;
				break;
		}
		return currentStyle;
	}

	//set icon for different tree kind
	function getIconFeature(feature){
		let currentIcon;
		switch(feature.get('kind')){
			case 'Клен':
				currentIcon = 'icons/maple.svg';
				break;
			case 'Гіркокаштан':
				currentIcon = 'chestnut.svg';
				break;
			case 'Тополя':
				currentIcon = 'icons/populus.svg';
				break;
			case 'Береза':
				currentIcon = 'icons/birch.svg';
				break;
			case 'Липа':
				currentIcon = 'icons/linden.svg';
				break;
			case 'Ясен':
				currentIcon = 'icons/ash.svg';
				break;
			default:
				return false;
				//currentIcon = 'icons/chestnut.svg';
		}
		let treeIcon = new ol.style.Style({
			image: new ol.style.Icon({
				src: currentIcon,
				scale:1,
				opacity: 0.8
			})
		});
		return treeIcon;
	}

	//set sourse to vector layer with tree point
	var vectorSource = new ol.source.Vector({
			url:'map-data.geojson',
			format: new ol.format.GeoJSON()
		});
	//set vector layer with tree point
	var treeData = new ol.layer.VectorImage({
		source: vectorSource,
		visible: true,
		title: 'Tree map',
		minZoom: 16,

		style: function(feature){
			return getStyleFeature(feature);
			}
	});

	//set vector layer with tree icon
	//var srcIcon = 'icons/chestnut.svg'
	var treeIcon = new ol.layer.VectorImage({
		source:vectorSource,
		visible:true,
		minZoom:16,
		style: function(feature){
			return getIconFeature(feature);
				}
	})
	//grouping tree layer with icon
	const treeLayerGroup = new ol.layer.Group({
		layers:[treeData,treeIcon]
	});
	//add group to map
	map.addLayer(treeLayerGroup);

	//create one active feature object
	var activeFeature = new ol.Feature();
	//set data feature at sourse for layer
	var activeSource = new ol.source.Vector({
		features: [activeFeature]
	});
	//create layer for display active feature
	var activeTree = new ol.layer.VectorImage({
		source: activeSource,
		minZoom: 16,
		visible: false
	});
	//add layer with active feature to map
	map.addLayer(activeTree);

	//mouse click listener
	map.on('click',function(e){
		map.forEachFeatureAtPixel(e.pixel, function(feature, layer){
			//prevent double click on tree, tree composed of circle and icon
			if(activeFeature.getGeometry()==feature.get('geometry')){
				return;
			}
			//function to take data from json and put it in aside panel
			displayTreeData(feature);
			//set geometry to active feature
			let diameter = feature.get('diameter');
				if (!diameter){
					diameter = 30;
				}
			let radius = diameter*ratio;
			activeFeature.setStyle(new ol.style.Style({
							image: new ol.style.Circle({
								radius:radius,
								fill: new ol.style.Fill({
									color:[0,0,0,0]
								}),
								stroke: new ol.style.Stroke({
										color:[255,57,16,1],width: 2
								})
							})
					}));

			activeFeature.setGeometry(feature.get('geometry'));

			activeTree.setVisible(true);

		})
		//print map coordinates
		console.log(e.coordinate);

	});
	//function to take data from json and put it in aside panel
	function displayTreeData(feature){
		let lines = document.getElementsByClassName('line');
		for (var i = lines.length - 1; i >= 0; i--) {
			lines[i].style.visibility = 'visible';
			console.log('line');
		}



		let treeSpecies = document.getElementsByTagName('H1')[0];

		let species = feature.get('species');
		treeSpecies.textContent = species;
		console.log(species);

		let treeLatin = document.getElementsByTagName('H2')[0];
		if(feature.get('latin')){
			let latin = feature.get('latin');
			treeLatin.textContent = latin;
		}else {
			treeLatin.textContent = '';
		}

		let nameId = document.getElementsByClassName('key-name')[0];
		nameId.textContent = "ID номер дерева";
		let treeId = document.getElementsByClassName('parameter')[0];
		let idNumber = feature.get('id');
		treeId.textContent = idNumber;
		let nameDiameter = document.getElementsByClassName('key-name')[1];
		nameDiameter.textContent = 'Діаметер ствола';
		let treeDiameter = document.getElementsByClassName('parameter')[1];
			if(feature.get('diameter')){
				treeDiameter.textContent = feature.get('diameter') + " см";
			}else{
				treeDiameter.textContent = 'невизначено';
			}
		let nameState = document.getElementsByClassName('key-name')[2];
		nameState.textContent = 'Стан';
		let treeState = document.getElementsByClassName('parameter')[2];
		treeState.textContent = feature.get('state');
		let treeDetails = document.getElementsByClassName('details')[0];
		if (feature.get('details')) {
			treeDetails.textContent = "Подробиці: " + feature.get('details');
		}else{
			treeDetails.textContent = '';
		}


	}
	//mouse move listener for change cursor to point
	map.on('pointermove', (e) => {
	  const pixel = map.getEventPixel(e.originalEvent);
	  const hit = map.hasFeatureAtPixel(pixel);
	  document.getElementById('treeMap').style.cursor = hit ? 'pointer' : '';
	});

	btnTrunk.btn.addEventListener('click', function(e){
		if(btnTrunk.state == 'enabled'){
			btnTrunk.state = 'disabled';
			btnTrunk.btn.setAttribute("class","btn-switch disabled");
			treeData.setVisible(false);
		}else{
			btnTrunk.state = 'enabled';
			btnTrunk.btn.setAttribute("class","btn-switch");
			treeData.setVisible(true);
		}
	}, false);

	btnIcon.btn.addEventListener('click', function(e){
		if(btnIcon.state == 'enabled'){
			btnIcon.state = 'disabled';
			btnIcon.btn.setAttribute("class","btn-switch disabled");
			treeIcon.setVisible(false);
		}else{
			btnIcon.state = 'enabled';
			btnIcon.btn.setAttribute("class","btn-switch");
			treeIcon.setVisible(true);
		}
	}, false);

}
