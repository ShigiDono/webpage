var THREEx = THREEx || {}

/**
 * Grab camera
 * @constructor
 */
THREEx.ImageGrabbing = function(imagefile){

	var domElement	= document.createElement('img')
	
	domElement.src	= imagefile;

	domElement.style.zIndex = -1;
        domElement.style.position = 'absolute'

	domElement.style.top = '50%'
	domElement.style.left = '50%'
	domElement.style.marginRight = '50%'
	domElement.style.transform = 'translate(-50%, -50%)'

	domElement.style.maxWidth = '100%'
	domElement.style.maxHeight = '100%'

	domElement.style.width = 'auto'
	domElement.style.height = 'auto'


	// domElement.style.top = '0px'
	// domElement.style.left = '0px'
	// domElement.style.width = '100%'
	// domElement.style.height = '100%'

	this.domElement = domElement
}
