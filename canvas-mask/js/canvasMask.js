/*
Canvas Mask Utility v0.2
Use HTML5 Canvas to apply an alpha mask to an image element.
---
http://github.com/benbarnett/canvas-mask
http://benbarnett.net
@benpbarnett
---
Copyright (c) 2011 Ben Barnett

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
---

*/



/**
	@private
	@name applyCanvasMask
	@function
	@description Use Canvas to apply an Alpha Mask to an <img>. Preload images first.
	@param {object} [image] The <img> to apply the mask
	@param {object} [mask] The <img> containing the PNG-24 mask image
	@param {int} [width] The width of the image (should be the same as the mask)
	@param {int} [height] The height of the image (should be the same as the mask)
	@param {boolean} [asBase64] Option to return the image as Base64
*/
function applyCanvasMask(image, mask, width, height, asBase64) {
	// check we have Canvas, and return the unmasked image if not
	if (!document.createElement('canvas').getContext && !asBase64) {
		return image;
	}
	else if (!document.createElement('canvas').getContext && asBase64) {
		return image.src;
	}
	
	var bufferCanvas = document.createElement('canvas'),
		buffer = bufferCanvas.getContext('2d'),
		outputCanvas = document.createElement('canvas'),
		output = outputCanvas.getContext('2d'),
		
		contents = null,
		imageData = null,
		alphaData = null;
		
	// set sizes to ensure all pixels are drawn to Canvas
	bufferCanvas.width = width;
	bufferCanvas.height = height * 2;
	outputCanvas.width = width;
	outputCanvas.height = height;
		
	// draw the base image
	buffer.drawImage(image, 0, 0);
	
	// draw the mask directly below
	buffer.drawImage(mask, 0, height);

	// grab the pixel data for base image
	contents = buffer.getImageData(0, 0, width, height);
	
	// store pixel data array seperately so we can manipulate
	imageData = contents.data;
	
	// store mask data
	alphaData = buffer.getImageData(0, height, width, height).data;
	
	// loop through alpha mask and apply alpha values to base image
	for (var i = 3, len = imageData.length; i < len; i = i + 4) {

		if (imageData[i] > alphaData[i]) {
			imageData[i] = alphaData[i]
		}
			
	}

	// return the pixel data with alpha values applied
	if (asBase64) {
		output.clearRect(0, 0, width, height);
		output.putImageData(contents, 0, 0);
		
		return outputCanvas.toDataURL();
	}
	else {
		return contents;	
	}
}