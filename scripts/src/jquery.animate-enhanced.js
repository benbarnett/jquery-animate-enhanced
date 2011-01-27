/*
jquery.animate-enhanced plugin v0.64
---
http://github.com/benbarnett/jQuery-Animate-Enhanced
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
Extends jQuery.animate() to automatically use CSS3 transformations where applicable.
Tested with jQuery 1.3.2+

Supports -moz-transition, -webkit-transition, -o-transition, transition
	
Targetted properties (for now):
	- left
	- top
	- opacity
	- width
	- height
	
Usage (exactly the same as it would be normally):
	
	jQuery(element).animate({left: 200},  500, function() {
		// callback
	});
	
Changelog:
	0.64 (27/01/2010):
		- BUGFIX #13: .slideUp(), .slideToggle(), .slideDown() bugfixes in Webkit
		
	0.63 (12/01/2010):
		- BUGFIX #11: callbacks not firing when new value == old value
		
	0.62 (10/01/2010):
		- BUGFIX #11: queue is not a function issue fixed
		
	0.61 (10/01/2010):
		- BUGFIX #10: Negative positions converting to positive
	
	0.60 (06/01/2010):
		- Animate function rewrite in accordance with new queue system
		- BUGFIX #8: Left/top position values always assumed relative rather than absolute
		- BUGFIX #9: animation as last item in a chain — the chain is ignored?
		- BUGFIX: width/height CSS3 transformation with left/top working
		
	0.55 (22/12/2010):
		- isEmptyObject function for <jQuery 1.4 (requires 1.3.2)

	0.54a (22/12/2010):
		- License changed to MIT (http://www.opensource.org/licenses/mit-license.php)

	0.54 (22/12/2010):
		- Removed silly check for 'jQuery UI' bailouts. Sorry.
		- Scoping issues fixed - Issue #4: $(this) should give you a reference to the selector being animated.. per jquery's core animation funciton.

	0.53 (17/11/2010):
		- New $.translate() method to easily calculate current transformed translation
		- Repeater callback bug fix for leaveTransforms:true (was constantly appending properties)
		
	0.52 (16/11/2010):
		- leaveTransforms: true bug fixes
		- 'Applying' user callback function to retain 'this' context

	0.51 (08/11/2010):
		- Bailing out with jQuery UI. This is only so the plugin plays nice with others and is TEMPORARY.
	
	0.50 (08/11/2010):
		- Support for $.fn.stop()
		- Fewer jQuery.fn entries to preserve namespace
		- All references $ converted to jQuery
		- jsDoc Toolkit style commenting for docs (coming soon)

	0.49 (19/10/2010):
		- Handling of 'undefined' errors for secondary CSS objects
		- Support to enhance 'width' and 'height' properties (except shortcuts involving jQuery.fx.step, e.g slideToggle)
		- Bugfix: Positioning when using avoidTransforms: true (thanks Ralf Santbergen reports)
		- Bugfix: Callbacks and Scope issues

	0.48 (13/10/2010):
		- Checks for 3d support before applying

	0.47 (12/10/2010);
		- Compatible with .fadeIn(), .fadeOut()
		- Use shortcuts, no duration for jQuery default or "fast" and "slow"
		- Clean up callback event listeners on complete (preventing multiple callbacks)

	0.46 (07/10/2010);
		- Compatible with .slideUp(), .slideDown(), .slideToggle()

	0.45 (06/10/2010):
		- 'Zero' position bug fix (was originally translating by 0 zero pixels, i.e. no movement)

	0.4 (05/10/2010):
		- Iterate over multiple elements and store transforms in jQuery.data per element
		- Include support for relative values (+= / -=)
		- Better unit sanitization
		- Performance tweaks
		- Fix for optional callback function (was required)
		- Applies data[translateX] and data[translateY] to elements for easy access
		- Added 'easeInOutQuint' easing function for CSS transitions (requires jQuery UI for JS anims)
		- Less need for leaveTransforms = true due to better position detections
*/

(function($, originalAnimateMethod, originalStopMethod) {
	// ----------
	// Plugin variables
	// ----------
	var	cssTransitionProperties = ["top", "left", "opacity", "height", "width"],
		cssPrefixes = ["", "-webkit-", "-moz-", "-o-"],
		pluginOptions = ["avoidTransforms", "useTranslate3d", "leaveTransforms"],
		rfxnum = /^([+-]=)?([\d+-.]+)(.*)$/,
		rupper = /([A-Z])/g,
		defaultEnhanceData = { 
			secondary: {}, 
			meta: { 
				left: 0, 
				top: 0 
			} 
		};
		
	
	// ----------
	// Check if this browser supports CSS3 transitions
	// ----------
	var thisBody = document.body || document.documentElement,
   		thisStyle = thisBody.style,
		transitionEndEvent = (thisStyle.WebkitTransition !== undefined) ? "webkitTransitionEnd" : (thisStyle.OTransition !== undefined) ? "oTransitionEnd" : "transitionend",
		cssTransitionsSupported = thisStyle.WebkitTransition !== undefined || thisStyle.MozTransition !== undefined || thisStyle.OTransition !== undefined || thisStyle.transition !== undefined,
		has3D = ('WebKitCSSMatrix' in window && 'm11' in new WebKitCSSMatrix());
	
	
	/**
		@private
		@name _interpretValue
		@function
		@description Interpret value ("px", "+=" and "-=" sanitisation)
		@param {object} [element] The Element for current CSS analysis
		@param {variant} [val] Target value
		@param {string} [prop] The property we're looking at
		@param {boolean} [isTransform] Is this a CSS3 transform?
	*/
	function _interpretValue(e, val, prop, isTransform) {	
		var parts = rfxnum.exec(val),
			start = e.css(prop) === "auto" ? 0 : e.css(prop),
			cleanCSSStart = typeof start == "string" ? _cleanValue(start) : start,
			cleanTarget = typeof val == "string" ? _cleanValue(val) : val,
			cleanStart = isTransform === true ? 0 : cleanCSSStart,
			hidden = e.is(":hidden"),
			translation = e.translation();
			
		if (prop == "left") cleanStart = parseInt(cleanCSSStart, 10) + translation.x;
		if (prop == "top") cleanStart = parseInt(cleanCSSStart, 10) + translation.y;
		
		// deal with shortcuts
		if (!parts && val == "show") {
			cleanStart = 1;
			if (hidden) e.css({'display':'block', 'opacity': 0});
		}

		if (parts) {
			var end = parseFloat(parts[2]);

			// If a +=/-= token was provided, we're doing a relative animation
			if (parts[1]) end = ((parts[1] === "-=" ? -1 : 1) * end) + parseInt(cleanStart, 10);
			return end;
		} else {
			return cleanStart;
		}
	};
	
	/**
		@private
		@name _getTranslation
		@function
		@description Make a translate or translate3d string
		@param {integer} [x] 
		@param {integer} [y] 
		@param {boolean} [use3D] Use translate3d if available?
	*/
	function _getTranslation(x, y, use3D) {
		return (use3D === true && has3D) ? "translate3d("+x+"px,"+y+"px,0)" : "translate("+x+"px,"+y+"px)";
	};
	
	
	/**
		@private
		@name _applyCSSTransition
		@function
		@description Build up the CSS object
		@param {object} [e] Element
		@param {string} [property] Property we're dealing with
		@param {integer} [duration] Duration
		@param {string} [easing] Easing function
		@param {variant} [value] String/integer for target value
		@param {boolean} [isTransform] Is this a CSS transformation?
		@param {boolean} [use3D] Use translate3d if available?
	*/
	function _applyCSSTransition(e, property, duration, easing, value, isTransform, use3D) {
		var enhanceData = e.data('cssEnhanced') || jQuery.extend(true, {}, defaultEnhanceData),
			offsetPosition = value;

		if (property == "left" || property == "top") {
			var meta = enhanceData.meta,
				cleanPropertyValue = _cleanValue(e.css(property)) || 0;
			
			offsetPosition = isTransform ? value - cleanPropertyValue : value;
				
			meta[property] = offsetPosition;
			meta[property+'_o'] = e.css(property) == "auto" ? 0 + offsetPosition : cleanPropertyValue + offsetPosition || 0;
			enhanceData.meta = meta;
			
			// fix 0 issue (transition by 0 = nothing)
			if (isTransform && offsetPosition === 0) {
				offsetPosition = 0 - meta[property+'_o'];
				meta[property] = offsetPosition;
				meta[property+'_o'] = 0;
			}
		}
		
		// reapply data and return
		return e.data('cssEnhanced', _applyCSSWithPrefix(enhanceData, property, duration, easing, offsetPosition, isTransform, use3D));
	};
	
	/**
		@private
		@name _applyCSSWithPrefix
		@function
		@description Helper function to build up CSS properties using the various prefixes
		@param {object} [cssProperties] Current CSS object to merge with
		@param {string} [property]
		@param {integer} [duration]
		@param {string} [easing]
		@param {variant} [value]
		@param {boolean} [isTransform] Is this a CSS transformation?
		@param {boolean} [use3D] Use translate3d if available?
	*/
	function _applyCSSWithPrefix(cssProperties, property, duration, easing, value, isTransform, use3D) {
		cssProperties = typeof cssProperties === 'undefined' ? {} : cssProperties;
		cssProperties.secondary = typeof cssProperties.secondary === 'undefined' ? {} : cssProperties.secondary;
		
		for (var i = cssPrefixes.length - 1; i >= 0; i--){			
			if (typeof cssProperties[cssPrefixes[i] + 'transition-property'] === 'undefined') cssProperties[cssPrefixes[i] + 'transition-property'] = '';
			cssProperties[cssPrefixes[i]+'transition-property'] += ', ' + ((isTransform === true) ? cssPrefixes[i] + 'transform' : property);
			cssProperties[cssPrefixes[i]+'transition-duration'] = duration + 'ms';
			cssProperties[cssPrefixes[i]+'transition-timing-function'] = easing;
			cssProperties.secondary[((isTransform === true) ? cssPrefixes[i]+'transform' : property)] = (isTransform === true) ? _getTranslation(cssProperties.meta.left, cssProperties.meta.top, use3D) : value;
		};
		
		return cssProperties;
	};
	
	/**
		@private
		@name _isBoxShortcut
		@function
		@description Shortcut to detect if we need to step away from slideToggle, CSS accelerated transitions (to come later with fx.step support)
		@param {object} [prop]
	*/
	function _isBoxShortcut(prop) {
		for (var property in prop) {
			if ((property == "width" || property == "height") && (prop[property] == "show" || prop[property] == "hide" || prop[property] == "toggle")) {
				return true;
			}
		}
		return false;
	};
	
	
	/**
		@private
		@name _isEmptyObject
		@function
		@description Check if object is empty (<1.4 compatibility)
		@param {object} [obj]
	*/
	function _isEmptyObject(obj) {
		for (var i in obj) return false;
		return true;
	};
	
	
	/**
		@private
		@name _cleanValue
		@function
		@description Remove 'px' and other artifacts
		@param {variant} [val]
	*/
	function _cleanValue(val) {
		return parseFloat(val.replace(/px/i, ''));
	};
	
	
	/**
		@public
		@name translation
		@function
		@description Get current X and Y translations
	*/
	jQuery.fn.translation = function() {
		if (!this[0]) {
			return null;
		}

		var	elem = this[0],
			cStyle = window.getComputedStyle(elem, null),
			translation = {
				x: 0,
				y: 0
			};
			
		for (var i = cssPrefixes.length - 1; i >= 0; i--){
			var transform = cStyle.getPropertyValue(cssPrefixes[i] + "transform");
			if (transform && (/matrix/i).test(transform)) {
				var explodedMatrix = transform.replace(/^matrix\(/i, '').split(/, |\)$/g);
				translation = {
					x: explodedMatrix[4],
					y: explodedMatrix[5]
				};
				
				break;
			}
		}
		
		return translation;
	};
	
	
	/**
		@public
		@name jQuery.fn.animate
		@function
		@description The enhanced jQuery.animate function
		@param {string} [property]
		@param {string} [speed]
		@param {string} [easing]
		@param {function} [callback]
	*/
	jQuery.fn.animate = function(prop, speed, easing, callback) {
		var optall = jQuery.speed(speed, easing, callback),
			callbackQueue = 0;
		
		if (!cssTransitionsSupported || _isEmptyObject(prop) || _isBoxShortcut(prop)) {
			return originalAnimateMethod.apply(this, arguments);
		} 
		
		return this[ optall.queue === false ? "each" : "queue" ](function() {
			var self = jQuery(this),
				opt = jQuery.extend({}, optall),
				elem = this || window,
				propertyCallback = function() {	
					callbackQueue--;
					if (callbackQueue == 0) {
						// we're done, trigger the user callback					
						if (typeof opt.complete === 'function') return opt.complete.apply(elem, arguments);
					}
				},
				cssCallback = function() {
					var reset = {};
				
					for (var i = cssPrefixes.length - 1; i >= 0; i--){
						reset[cssPrefixes[i]+'transition-property'] = 'none';
						reset[cssPrefixes[i]+'transition-duration'] = '';
						reset[cssPrefixes[i]+'transition-timing-function'] = '';
					};
			
					// unbind
					self.unbind(transitionEndEvent);
		
					// convert translations to left & top for layout
					if (!prop.leaveTransforms === true) {
						var props = self.data('cssEnhanced') || {},
							restore = {};
							
						for (i = cssPrefixes.length - 1; i >= 0; i--){
							restore[cssPrefixes[i]+'transform'] = '';
						}

						if (typeof props.meta !== 'undefined') {
							restore['left'] = props.meta.left_o + 'px';
							restore['top'] = props.meta.top_o + 'px';
						}
				
						self.css(reset).css(restore);
					}
			
					// reset
					self.data('cssEnhanced', null);

					// run the main callback function
					propertyCallback();
				},
				easings = {
					bounce: 'cubic-bezier(0.0, 0.35, .5, 1.3)', 
					linear: 'linear',
					swing: 'ease-in-out',
					easeInOutQuint: 'cubic-bezier(0.5, 0, 0, 0.8)'
				},
				domProperties = null, 
				cssEasing = easings[opt.easing || "swing"] ? easings[opt.easing || "swing"] : opt.easing || "swing";
				

			// seperate out the properties for the relevant animation functions
			for (var p in prop) {
				if (jQuery.inArray(p, pluginOptions) === -1) {
					var cleanVal = _interpretValue(self, prop[p], p, (((p == "left" || p == "top") && prop.avoidTransforms !== true) ? true : false));
					
					if (jQuery.inArray(p, cssTransitionProperties) > -1) {
						_applyCSSTransition(
							self,
							p, 
							opt.duration, 
							cssEasing, 
							((p == "left" || p == "top") && prop.avoidTransforms === true) ? cleanVal + "px" : cleanVal, 
							((p == "left" || p == "top") && prop.avoidTransforms !== true) ? true : false, 
							(prop.useTranslate3d === true) ? true : false);
					}
					else {
						domProperties = (!domProperties) ? {} : domProperties;
						domProperties[p] = prop[p];
					}
				}
			}
		
			// clean up
			var cssProperties = self.data('cssEnhanced') || {};
			for (var i = cssPrefixes.length - 1; i >= 0; i--){
				if (typeof cssProperties[cssPrefixes[i]+'transition-property'] !== 'undefined') cssProperties[cssPrefixes[i]+'transition-property'] = cssProperties[cssPrefixes[i]+'transition-property'].substr(2);
			}
		
			self.data('cssEnhanced', cssProperties);
		
			// apply the CSS transitions
			self.unbind(transitionEndEvent);
			
			if (!_isEmptyObject(self.data('cssEnhanced')) && !_isEmptyObject(self.data('cssEnhanced').secondary)) {
				callbackQueue++;

				self.css(self.data('cssEnhanced'));
			
				// has to be done in a timeout to ensure transition properties are set
				setTimeout(function() { 
					self.bind(transitionEndEvent, cssCallback).css(self.data('cssEnhanced').secondary);
				});
			}

			// fire up DOM based animations
			if (!_isEmptyObject(domProperties)) {
				callbackQueue++;

				originalAnimateMethod.apply(self, [domProperties, {
					duration: opt.duration, 
					easing: opt.easing, 
					complete: propertyCallback,
					queue: opt.queue
				}]);
			}

			// strict JS compliance
			return true;
		});
	};	
	
	
	/**
		@public
		@name jQuery.fn.stop
		@function
		@description The enhanced jQuery.stop function (resets transforms to left/top)
		@param {boolean} [clearQueue]
		@param {boolean} [gotoEnd]
		@param {boolean} [leaveTransforms] Leave transforms/translations as they are? Default: false (reset translations to calculated explicit left/top props)
	*/
	jQuery.fn.stop = function(clearQueue, gotoEnd, leaveTransforms) {
		if (!cssTransitionsSupported) return originalStopMethod.apply(this, [clearQueue, gotoEnd]);
		
		// clear the queue?
		if (clearQueue) this.queue([]);
		
		// reset CSS variable
		var reset = {};
		for (var i = cssPrefixes.length - 1; i >= 0; i--){
			reset[cssPrefixes[i]+'transition-property'] = 'none';
			reset[cssPrefixes[i]+'transition-duration'] = '';
			reset[cssPrefixes[i]+'transition-timing-function'] = '';
		};
		
		// route to appropriate stop methods
		this.each(function() {
			var self = jQuery(this),
				cStyle = window.getComputedStyle(this, null),
				restore = {},
				i;
			
			// is this a CSS transition?
			if (!_isEmptyObject(self.data('cssEnhanced')) && !_isEmptyObject(self.data('cssEnhanced').secondary)) {
				var selfCSSData = self.data('cssEnhanced');

				if (gotoEnd) {
				    // grab end state properties
					restore = selfCSSData.secondary;
					
					if (!leaveTransforms && typeof selfCSSData.meta['left_o'] !== undefined || typeof selfCSSData.meta['top_o'] !== undefined) {						
						restore['left'] = typeof selfCSSData.meta['left_o'] !== undefined ? selfCSSData.meta['left_o'] : 'auto';
						restore['top'] = typeof selfCSSData.meta['top_o'] !== undefined ? selfCSSData.meta['top_o'] : 'auto';
						
						// remove the transformations
						for (i = cssPrefixes.length - 1; i >= 0; i--){
							restore[cssPrefixes[i]+'transform'] = '';
						}
					}
				}
				else {
					// grab current properties
					for (var prop in self.data('cssEnhanced').secondary){
						prop = prop.replace( rupper, "-$1" ).toLowerCase();
						restore[prop] = cStyle.getPropertyValue(prop);
						
						// is this a matrix property? extract left and top and apply
						if (!leaveTransforms && (/matrix/i).test(restore[prop])) {
							var explodedMatrix = restore[prop].replace(/^matrix\(/i, '').split(/, |\)$/g);	
							
							// apply the explicit left/top props						
							restore['left'] = explodedMatrix[4]+'px' || 'auto';
							restore['top'] = explodedMatrix[5]+'px' || 'auto';
							
							// remove the transformations
							for (i = cssPrefixes.length - 1; i >= 0; i--){
								restore[cssPrefixes[i]+'transform'] = '';
							}
						}
				    }
				}
				
				// remove transition timing functions
				self.
					unbind(transitionEndEvent).
					css(reset).
					css(restore).
					data('cssEnhanced', null);
			}
			else {
				// dom transition
				originalStopMethod.apply(self, [clearQueue, gotoEnd]);
			}
		});
		
		return this;
	};
})(jQuery, jQuery.fn.animate, jQuery.fn.stop);