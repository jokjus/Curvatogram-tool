// Initialize variables
var position;
var lineCount = 30;
var resolution = 20;
var darkness = 7;
var minDarkness = 0.2;
var gridWidth = 3;
var gridHeight = 3;
var count = 0;
var segLength;
var sequence = []
var blockSize;

// Initialize default image & layers
var raster = new Raster('defaultImage');
raster.visible = false;
project.activeLayer.position = view.center;
var arcs = new Layer({position: view.center});

resetArt();

// Build mouse usable interface elements
function generateUI() {
	var count = 0;
	for (i = 0; i < gridHeight; i++){
		for (j = 0; j < gridWidth; j++){
			var uib = document.createElement('div');
			
			uib.classList.add('ui-block');
			uib.style.top = raster.bounds.top + i*blockSize + 'px';
			uib.style.left = raster.bounds.left + j*blockSize + 'px';
			uib.style.width = blockSize + 'px';
			uib.style.height = blockSize + 'px';

			for (b=0; b<6; b++) {
				var clickT = document.createElement('div');
				clickT.classList.add('ui-target-' + b);					
				clickT.setAttribute('data-blocktype', b);
				clickT.setAttribute('data-order', count);				
				clickT.addEventListener("click", function(e) {adjustBlockType(e)}, false);

				uib.appendChild(clickT);
			}

			var element = document.getElementById("ui");
			element.appendChild(uib);
			count++;

		}
	}
}

function adjustBlockType(e) {
	var thisEl = e.target;
	var thisData = thisEl.dataset;
	var uiBlock = thisEl.parentElement; // get parent
	sequence[thisData.order] = []; //reset
	
	// remove all other lines if shift is pressed
	if (e.shiftKey) {
		[].forEach.call(uiBlock.childNodes, function(el) {
			el.classList.remove("active");
		});

		sequence[thisData.order].push(thisData.blocktype);
		thisEl.classList.toggle('active');  // toggle activity
	}
	
	else {
		thisEl.classList.toggle('active');  // toggle activity
		for (o = 0; o < 6; o++) {			// loop through all buttons
			var node = uiBlock.childNodes[o];
			
			if (node.classList.contains('active')) { // if button has active class, add to list	
				sequence[thisData.order].push(node.dataset.blocktype);
			}
		}
	}

	render();
}


function resetArt() {
	// Remove UI-components
	var uielems = document.getElementById("ui");
	uielems.innerHTML = '';

	// Position raster to the middle
	raster.position = view.center;

	// Reset blocksize variable
	blockSize = raster.width / gridWidth;

	// Create new UI
	generateUI();

	// Initialize grid with random line blocks
	sequence = [];
	var element = document.getElementById("ui");
	for (i=0; i<gridWidth*gridHeight; i++) {
		var rnd = getRandomInt(6);
		sequence.push([rnd]);
		element.childNodes[i].childNodes[rnd].classList.add('active');
	}
 
	// Render art
	render();	
}

// Draw the art based on variables / sequence
function render() {
	arcs.removeChildren();
	position = raster.bounds.bottomRight;
	var counter = 0;

	for (h = 1; h < gridHeight+1; h++) {
		for (n = 1; n < gridWidth+1; n++) {
			var blockPosition = raster.bounds.topLeft + new Point(blockSize * n, blockSize * h);
			position = blockPosition;

			var layerAmount = sequence[counter].length;
			
			for (l = 0; l < layerAmount; l++) {
				var toss = sequence[counter][l];

				for (i = 1; i < lineCount; i++) {

					var path = new Path({
						fillColor: 'black',
						closed: true
					});

					// horizontal lines
					if (toss == 4) {
						var refElem = new Path.Line({
							from: position - new Point(0, blockSize / lineCount * i),
							to: position - new Point(blockSize, blockSize / lineCount * i),
							closed: false
						});
					}

					// vertical lines
					if (toss == 5) {
						var refElem = new Path.Line({
							from: position - new Point(blockSize / lineCount * i, 0),
							to: position - new Point(blockSize / lineCount * i, blockSize),
							closed: false
						});
					}

					// curved lines
					if ([0,1,2,3].indexOf(parseInt(toss)) > -1 ) {
						var refElem = new Path.Circle({
							center: position,
							radius: blockSize / lineCount * i,
							closed: false
						});

						if (toss == 1) {
							refElem.rotate(270);
							refElem.translate(new Point(0, -blockSize))
						}
						if (toss == 0) {
							refElem.rotate(180);
							refElem.translate(new Point(-blockSize, -blockSize))
						}
						if (toss == 3) {
							refElem.rotate(90);
							refElem.translate(new Point(-blockSize, 0))
						}

						refElem.lastSegment.remove();
						refElem.lastSegment.remove();
					}	

					//initialize first points of the path 
					path.add(refElem.segments[0].point);
					path.add(refElem.segments[0].point);

					for (k = 0; k < resolution+1; k++) {
						var resLength = refElem.length/resolution*k;
						resLength = resLength / 1.00001; //hack to overcome rounding problem
						var resPoint = refElem.getLocationAt(resLength);
						resPoint = resPoint.point;

						var color = raster.getAverageColor(resPoint);
						var value = color ? (1 - color.gray) * darkness : 0;
						
						var normal = refElem.getNormalAt(resLength) * Math.max(value, minDarkness);

						path.add(resPoint - normal);
						path.insert(0, resPoint + normal);					
					}

					refElem.remove();
					
					// path.smooth();

				}
			}
			counter++;

		}
	}
}

// UI listeners
var UIDarkness = document.getElementById('darkness');
UIDarkness.onchange = function() {
		darkness = this.value;
		render();
}

var UIMinDarkness = document.getElementById('minDarkness');
UIMinDarkness.onchange = function() {
		minDarkness = this.value/10;
		render();
}

var UIGridSize = document.getElementById('gridSize');
UIGridSize.onchange = function() {
	gridWidth = parseInt(this.value);
	gridHeight = parseInt(this.value);
	resetArt();
}

var UILineCount = document.getElementById('lineCount');
UILineCount.onchange = function() {
		lineCount = this.value;
		render();
}

var UIResolution = document.getElementById('resolution');
UIResolution.onchange = function() {
		resolution = parseInt(this.value);
		render();
}


// Reposition the paths whenever the window is resized:
function onResize(event) {
    project.activeLayer.position = view.center;
    arcs.position = view.center;
}

function downloadDataUri(options) {
    if (!options.url)
        options.url = "http://download-data-uri.appspot.com/";
    $('<form method="post" action="' + options.url
        + '" style="display:none"><input type="hidden" name="filename" value="'
        + options.filename + '"/><input type="hidden" name="data" value="'
        + options.data + '"/></form>').appendTo('body').submit().remove();
}

function getRandomInt(max) {
  return Math.floor(Math.random() * Math.floor(max));
}

$('#export-button').click(function() {
    var svg = project.exportSVG({ asString: true });
    downloadDataUri({
        data: 'data:image/svg+xml;base64,' + btoa(svg),
        filename: 'export.svg'
    });
});


function onDocumentDrag(event) {
	document.getElementById('imageTarget').display = 'block';
	// $('#imageTarget').show();
	event.preventDefault();
}

function onDocumentDrop(event) {
	event.preventDefault();

	if (event.target.id == 'imageTarget') {
		var file = event.dataTransfer.files[0];
		var reader = new FileReader();

		reader.onload = function (event) {
			var image = document.createElement('img');
			image.onload = function () {
				raster = new Raster(image);
				raster.visible = false;
				resetArt();
			};
			image.src = event.target.result;
		};
		reader.readAsDataURL(file);
		document.getElementById('imageTarget').display = 'none';
	}

	
}

document.addEventListener('drop', onDocumentDrop, false);
document.addEventListener('dragover', onDocumentDrag, false);
document.addEventListener('dragleave', onDocumentDrag, false);