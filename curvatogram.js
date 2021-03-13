// INITIALIZE ===============================================
// Initialize variables
var position;
var c = {
	lineCount: 25,
	resolution: 20,
	darkness: 7,
	lineWidth: 0.2,
	gridWidth: 3,
	gridHeight: 3,
	sequence: [],
	bgColor: new Color(1,1,1),
	colorMode: false,
	animEasing: 'sine'
}

var count = 0;
var segLength;
var blockSize;
var animValue = 0;

// Initialize default image & layers
var raster = new Raster('defaultImage');
raster.visible = false;
project.activeLayer.position = view.center;
// Create background
var drawingBg = new Path.Rectangle({
    point: [0, 0],
    size: [view.size.width, view.size.height],
	fillColor: c.bgColor	
});

var arcs = new Layer({position: view.center});



resetArt();

// Build mouse usable interface elements
function generateUI() {
	var count = 0;
	for (i = 0; i < c.gridHeight; i++){
		for (j = 0; j < c.gridWidth; j++){
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
	c.sequence[thisData.order] = []; //reset
	
	// remove all other lines if shift is pressed
	if (e.shiftKey) {
		[].forEach.call(uiBlock.childNodes, function(el) {
			el.classList.remove("active");
		});

		c.sequence[thisData.order].push(thisData.blocktype);
		thisEl.classList.toggle('active');  // toggle activity
	}
	
	else {
		thisEl.classList.toggle('active');  // toggle activity
		for (o = 0; o < 6; o++) {			// loop through all buttons
			var node = uiBlock.childNodes[o];
			
			if (node.classList.contains('active')) { // if button has active class, add to list	
				c.sequence[thisData.order].push(node.dataset.blocktype);
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
	blockSize = raster.width / c.gridWidth;

	// Create new UI
	generateUI();

	// Initialize grid with random line blocks
	c.sequence = [];
	var element = document.getElementById("ui");
	for (i=0; i<c.gridWidth*c.gridHeight; i++) {
		var rnd = getRandomInt(6);
		c.sequence.push([rnd]);
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

	for (h = 1; h < c.gridHeight+1; h++) {
		for (n = 1; n < c.gridWidth+1; n++) {
			var blockPosition = raster.bounds.topLeft + new Point(blockSize * n, blockSize * h);
			position = blockPosition;

			var layerAmount = c.sequence[counter].length;
			
			for (l = 0; l < layerAmount; l++) {
				var toss = c.sequence[counter][l];

				for (i = 1; i < c.lineCount; i++) {

					var path = new Path({
						fillColor: 'black',
						closed: true
					});

					// horizontal lines
					if (toss == 4) {
						var refElem = new Path.Line({
							from: position - new Point(0, blockSize / c.lineCount * i),
							to: position - new Point(blockSize, blockSize / c.lineCount * i),
							closed: false
						});
					}

					// vertical lines
					if (toss == 5) {
						var refElem = new Path.Line({
							from: position - new Point(blockSize / c.lineCount * i, 0),
							to: position - new Point(blockSize / c.lineCount * i, blockSize),
							closed: false
						});
					}

					// curved lines
					if ([0,1,2,3].indexOf(parseInt(toss)) > -1 ) {
						var refElem = new Path.Circle({
							center: position,
							radius: blockSize / c.lineCount * i,
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

					for (k = 0; k < c.resolution+1; k++) {
						var resLength = refElem.length/c.resolution*k;
						resLength = resLength / 1.00001; //hack to overcome rounding problem
						var resPoint = refElem.getLocationAt(resLength);
						resPoint = resPoint.point;

						var color = raster.getAverageColor(resPoint);
						var value = color ? (1 - color.gray) * c.darkness : 0;
						if (runAnimation) {
							var a = eval(c.animEasing + '(animValue)');
							value = color ? (1 - color.gray) * c.darkness * a : 0;
						}
						
						var normal = refElem.getNormalAt(resLength) * Math.max(value, c.lineWidth);

						path.add(resPoint - normal);
						path.insert(0, resPoint + normal);	
						if(c.colorMode) { path.fillColor = color }				
						
					}

					refElem.remove();
					
					// path.smooth();

				}
			}
			counter++;

		}
	}

	animValue += 0.03;

	if( typeof capturer !== 'undefined') {
        if( capturer) capturer.capture( canvas );
    } 
}


// Reposition the paths whenever the window is resized:
function onResize(event) {
    project.activeLayer.position = view.center;
    arcs.position = view.center;
}

// HELPERS ====================================================
function getRandomInt(max) {
  return Math.floor(Math.random() * Math.floor(max));
}

// UI listeners ================================================
var UIDarkness = document.getElementById('darkness');
UIDarkness.onchange = function() {
		c.darkness = this.value;
		render();
}

var UILineWidth = document.getElementById('lineWidth');
UILineWidth.onchange = function() {
		c.lineWidth = this.value/10;
		render();
}

var UIGridSize = document.getElementById('gridSize');
UIGridSize.onchange = function() {
	c.gridWidth = parseInt(this.value);
	c.gridHeight = parseInt(this.value);
	resetArt();
}

var UILineCount = document.getElementById('lineCount');
UILineCount.onchange = function() {
		c.lineCount = this.value;
		render();
}

var UIResolution = document.getElementById('resolution');
UIResolution.onchange = function() {
		c.resolution = parseInt(this.value);
		render();
}


document.getElementById('anim-easing').onchange = function() {
		c.animEasing = this.value;
		render();
}

document.getElementById('colorMode').onchange = function() {
	c.colorMode = this.checked;
	console.log(c.colorMode);
	render();
}




// Export SVG ========================================================

function htmlToElement(html) {
    var template = document.createElement('template');
    html = html.trim(); // Never return a text node of whitespace as the result
    template.innerHTML = html;
    return template.content.firstChild;
}

function downloadDataUri(options) {
    if (!options.url)
        options.url = "http://download-data-uri.appspot.com/";
	var form = htmlToElement('<form method="post" action="' + options.url
	+ '" style="display:none"><input type="hidden" name="filename" value="'
	+ options.filename + '"/><input type="hidden" name="data" value="'
	+ options.data + '"/></form>');

	document.getElementsByTagName('body')[0].appendChild(form);
	form.submit();
	form.remove();
}

var  exportButton = document.getElementById('export-button');

exportButton.addEventListener("click", function(e) {
	var svg = project.exportSVG({ asString: true });
    downloadDataUri({
        data: "data:image/svg+xml;base64," + btoa(svg),
        filename: "export.svg"
    });
}, false);


// DRAG'N DROP custom images =========================================
function onDocumentDrag(event) {
	// console.log('draggin');
	console.log(document.getElementById('imageTarget'));
	document.getElementById('imageTarget').style.display = 'block';
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
		document.getElementById('imageTarget').style.display = 'none';
	}
}

document.addEventListener('drop', onDocumentDrop, false);
document.addEventListener('dragover', onDocumentDrag, false);
document.addEventListener('dragleave', onDocumentDrag, false);


// ANIMATION =============================================================================
// =======================================================================================
// Captures animation with CCapture https://github.com/spite/ccapture.js

// Initialize main animation and capturer variables
var runAnimation = false // are we running?
var animFrame = 0;  // animation frame
var animMasterFrame = 0;
var animDir = 1;    // animation direction
var capturer;       // capture object

// Add these buttons to the html
var startCaptureBtn = document.getElementById( 'start-capture' ),
    stopCaptureBtn = document.getElementById( 'stop-capture' ),
    startAnimationBtn = document.getElementById( 'start-animation' ),
    stopAnimationBtn = document.getElementById( 'stop-animation' );
	

initializeAnimAndCapture();

function initializeAnimAndCapture() {
    stopAnimationBtn.style.display = 'none';
    startCaptureBtn.style.display = 'none';
    stopCaptureBtn.style.display = 'none';

    startAnimationBtn.addEventListener( 'click', function( e ) {
        runAnimation = true;
        animFrame = 0;
        this.style.display = 'none';
        stopAnimationBtn.style.display = 'inline-block';
        startCaptureBtn.style.display = 'inline-block';
        animate();
    }, false );

    stopAnimationBtn.addEventListener( 'click', function( e ) {
        runAnimation = false;
        this.style.display = 'none';
        startCaptureBtn.style.display = 'none';
        startAnimationBtn.style.display = 'inline-block';
    }, false );

    startCaptureBtn.addEventListener( 'click', function( e ) {
        // Create a capturer that exports a WebM video
        capturer = new CCapture( { 
            format: document.getElementById('anim-format').value,
            framerate: 60,
            quality: 100,
            verbose: true } );  

        capturer.start();
        this.style.display = 'none';
        stopCaptureBtn.style.display = 'inline-block';
        e.preventDefault();
    }, false );

    stopCaptureBtn.addEventListener( 'click', function( e ) {
        capturer.stop();
        this.style.display = 'none';
        capturer.save();
        animFrame = 0;
    }, false );
}

function animate() {
    if (runAnimation) {
        requestAnimationFrame( animate );
        render();
    }
}

// Animation easing functions --------------------------------------

function sine(x) {
    return ((1 - 0) * Math.sin(x) + 1 + 0) / 2.
}


function easeInOutCirc(x) {
    return x < 0.5
        ? (1 - Math.sqrt(1 - Math.pow(2 * x, 2))) / 2
        : (Math.sqrt(1 - Math.pow(-2 * x + 2, 2)) + 1) / 2;
}

function easeInOutElastic(x) {
    var c5 = (2 * Math.PI) / 4.5;
    return x === 0
        ? 0
        : x === 1
            ? 1
            : x < 0.5
                ? -(Math.pow(2, 20 * x - 10) * Math.sin((20 * x - 11.125) * c5)) / 2
                : (Math.pow(2, -20 * x + 10) * Math.sin((20 * x - 11.125) * c5)) / 2 + 1;
}

function easeOutElastic(x) {
    var c4 = (2 * Math.PI) / 3;
    return x === 0
        ? 0
        : x === 1
            ? 1
            : Math.pow(2, -10 * x) * Math.sin((x * 10 - 0.75) * c4) + 1;
}

function easeOutBounce(x) {
    var n1 = 7.5625;
    var d1 = 2.75;
    if (x < 1 / d1) {
        return n1 * x * x;
    }
    else if (x < 2 / d1) {
        return n1 * (x -= 1.5 / d1) * x + 0.75;
    }
    else if (x < 2.5 / d1) {
        return n1 * (x -= 2.25 / d1) * x + 0.9375;
    }
    else {
        return n1 * (x -= 2.625 / d1) * x + 0.984375;
    }
}

function easeInOutExpo(x) {
    return x === 0
        ? 0
        : x === 1
            ? 1
            : x < 0.5 ? Math.pow(2, 20 * x - 10) / 2
                : (2 - Math.pow(2, -20 * x + 10)) / 2;
}

function easeInBack(x) {
    var c1 = 1.70158;
    var c3 = c1 + 1;
    return c3 * x * x * x - c1 * x * x;
}

function easeInExpo(x) {
    return x === 0 ? 0 : Math.pow(2, 10 * x - 10);
}

function easeInOutBack(x) {
    var c1 = 1.70158;
    var c2 = c1 * 1.525;
    return x < 0.5
        ? (Math.pow(2 * x, 2) * ((c2 + 1) * 2 * x - c2)) / 2
        : (Math.pow(2 * x - 2, 2) * ((c2 + 1) * (x * 2 - 2) + c2) + 2) / 2;
}

function easeInQuart(x) {
    return x * x * x * x;
}