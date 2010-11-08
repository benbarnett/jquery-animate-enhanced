/************************************************
	jquery.animate-enhanced plugin v0.51
	Author: www.benbarnett.net || @benpbarnett
*************************************************

Extends jQuery.animate() to automatically use CSS3 transformations where applicable.
Requires jQuery 1.4.2+

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

	
*********/

(function($, originalAnimateMethod, originalStopMethod) {
	// ----------
	// Plugin variables
	// ----------
	var	cssTransitionProperties = ["top", "left", "opacity", "height", "width"],
		cssPrefixes = ["", "-webkit-", "-moz-", "-o-"],
		pluginOptions = ["avoidTransforms", "useTranslate3d", "leaveTransforms"],
		rfxnum = /^([+-]=)?([\d+-.]+)(.*)$/,
		rupper = /([A-Z])/g;
		
	
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
		@name interpretValue
		@function
		@description Interpret value ("px", "+=" and "-=" sanitisation)
		@param {object} [element] The Element for current CSS analysis
		@param {variant} [val] Target value
		@param {string} [prop] The property we're looking at
		@param {boolean} [isTransform] Is this a CSS3 transform?
	*/
	var interpretValue = function(e, val, prop, isTransform) {	
		var parts = rfxnum.exec(val),
			start = e.css(prop) === "auto" ? 0 : e.css(prop),
			cleanCSSStart = typeof start == "string" ? start.replace(/px/g, "") : start,
			cleanTarget = typeof val == "string" ? val.replace(/px/g, "") : val,
			cleanStart = isTransform === true ? 0 : cleanCSSStart,
			hidden = jQuery(e).is(":hidden");

		if (prop == "left" && e.data('translateX')) cleanStart = cleanCSSStart + e.data('translateX');
		if (prop == "top" && e.data('translateY')) cleanStart = cleanCSSStart + e.data('translateY');
		
		// deal with shortcuts
		if (!parts && val == "show") {
			cleanStart = 1;
			if (hidden) e.css({'display':'block', 'opacity': 0});
		}

		if (parts) {
			var end = parseFloat(parts[2]);

			// If a +=/-= token was provided, we're doing a relative animation
			if (parts[1]) {
				end = ((parts[1] === "-=" ? -1 : 1) * end) + parseInt(cleanStart, 10);
			}
			return end;
		} else {
			return cleanStart;
		}
	};
	
	/**
		@private
		@name getTranslation
		@function
		@description Make a translate or translate3d string
		@param {integer} [x] 
		@param {integer} [y] 
		@param {boolean} [use3D] Use translate3d if available?
	*/
	var getTranslation = function(x, y, use3D) {
		return (use3D === true && has3D) ? "translate3d("+x+"px,"+y+"px,0)" : "translate("+x+"px,"+y+"px)";
	};
	
	
	/**
		@private
		@name applyCSSTransition
		@function
		@description Build up the CSS object
		@param {object} [e] 
		@param {string} [property]
		@param {integer} [duration]
		@param {string} [easing]
		@param {variant} [value]
		@param {boolean} [isTransform] Is this a CSS transformation?
		@param {boolean} [use3D] Use translate3d if available?
	*/
	var applyCSSTransition = function(e, property, duration, easing, value, isTransform, use3D) {
		if (!e.data('cssEnhanced')) {
			var setup = { secondary: {}, meta: { left: 0, top: 0 } };
			e.data('cssEnhanced', setup);
		}
		
		if (property == "left" || property == "top") {
			var meta = e.data('cssEnhanced').meta;
			meta[property] = value;
			meta[property+'_o'] = e.css(property) == "auto" ? 0 + value : parseInt(e.css(property).replace(/px/g, ''), 10) + value || 0;
			e.data('cssEnhanced').meta = meta;
			
			// fix 0 issue (transition by 0 = nothing)
			if (isTransform && value === 0) {
				value = 0 - meta[property+'_o'];
				meta[property] = value;
				meta[property+'_o'] = 0;
			}
		}
		
		return e.data('cssEnhanced', applyCSSWithPrefix(e.data('cssEnhanced'), property, duration, easing, value, isTransform, use3D));
	};
	
	/**
		@private
		@name applyCSSWithPrefix
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
	var applyCSSWithPrefix = function(cssProperties, property, duration, easing, value, isTransform, use3D) {
		cssProperties = typeof cssProperties === 'undefined' ? {} : cssProperties;
		cssProperties.secondary = typeof cssProperties.secondary === 'undefined' ? {} : cssProperties.secondary;
		
		for (var i = cssPrefixes.length - 1; i >= 0; i--){			
			if (typeof cssProperties[cssPrefixes[i] + 'transition-property'] === 'undefined') cssProperties[cssPrefixes[i] + 'transition-property'] = '';
			cssProperties[cssPrefixes[i]+'transition-property'] += ', ' + ((isTransform === true) ? cssPrefixes[i] + 'transform' : property);
			cssProperties[cssPrefixes[i]+'transition-duration'] = duration + 'ms';
			cssProperties[cssPrefixes[i]+'transition-timing-function'] = easing;
			cssProperties.secondary[((isTransform === true) ? cssPrefixes[i]+'transform' : property)] = (isTransform === true) ? getTranslation(cssProperties.meta.left, cssProperties.meta.top, use3D) : value;
		};
		
		return cssProperties;
	};
	
	/**
		@private
		@name isBoxShortcut
		@function
		@description Shortcut to detect if we need to step away from slideToggle, CSS accelerated transitions (to come later with fx.step support)
		@param {variant} [value]
		@param {string} [property]
	*/
	var isBoxShortcut = function(value, property) {
		return (property == "width" || property == "height") && (value == "show" || value == "hide" || value == "toggle");
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
		if (typeof jQuery.ui !== 'undefined' || !cssTransitionsSupported || jQuery.isEmptyObject(prop)) return originalAnimateMethod.apply(this, arguments);

		// get default jquery timing from shortcuts
		speed = typeof speed === 'undefined' || speed == 'def' ? "_default" : speed;
		if (typeof jQuery.fx.speeds[speed] !== 'undefined') speed = jQuery.fx.speeds[speed];
		
		var opt = speed && typeof speed === "object" ? speed : {
			complete: callback || !callback && easing || jQuery.isFunction( speed ) && speed,
			duration: speed,
			easing: callback && easing || easing && !jQuery.isFunction(easing) && easing
		}, 	
		callbackQueue = 0,
		propertyCallback = function() {	
			callbackQueue--;
			if (callbackQueue <= 0) { 			
				// we're done, trigger the user callback
				if (typeof opt.complete === 'function') return opt.complete.call();
			}
		},
		cssCallback = function() {
			var reset = {};
			for (var i = cssPrefixes.length - 1; i >= 0; i--){
				reset[cssPrefixes[i]+'transition-property'] = 'none';
				reset[cssPrefixes[i]+'transition-duration'] = '';
				reset[cssPrefixes[i]+'transition-timing-function'] = '';
			};
		
			// convert translations to left & top for layout
			if (!prop.leaveTransforms === true) {
				var self = jQuery(this),
					props = self.data('cssEnhanced') || {},
					restore = {
						'-webkit-transform': '',
						'-moz-transform': '',
						'-o-transform': '',
						'transform': ''
					};

				if (typeof props.meta !== 'undefined') {
					restore['left'] = props.meta.left_o + 'px';
					restore['top'] = props.meta.top_o + 'px';
				}
				
				self.
					unbind(transitionEndEvent).
					css(reset).
					css(restore).
					data('translateX', 0).
					data('translateY', 0).
					data('cssEnhanced', null);
			}
			
			// run the main callback function
			propertyCallback();
		},
		easings = {
			bounce: 'cubic-bezier(0.0, 0.35, .5, 1.3)', 
			linear: 'linear',
			swing: 'ease-in-out',
			easeInOutQuint: 'cubic-bezier(0.5, 0, 0, 0.8)'
		},
		domProperties = null, cssEasing = "";
		
		// make easing css friendly
		cssEasing = opt.easing || "swing";
		cssEasing = easings[cssEasing] ? easings[cssEasing] : cssEasing;

		// seperate out the properties for the relevant animation functions
		for (p in prop) {
			if (jQuery.inArray(p, pluginOptions) === -1) {
				this.each(function() {
					var self = jQuery(this),
						cleanVal = interpretValue(self, prop[p], p, (((p == "left" || p == "top") && prop.avoidTransforms !== true) ? true : false));
						
					if (jQuery.inArray(p, cssTransitionProperties) > -1 && 
						self.css(p).replace(/px/g, "") !== cleanVal &&
						!isBoxShortcut(prop[p], p)
						) {						
						applyCSSTransition(
							self,
							p, 
							opt.duration, 
							cssEasing, 
							((p == "left" || p == "top") && prop.avoidTransforms === true) ? cleanVal + "px" : cleanVal, 
							(((p == "left" || p == "top") && prop.avoidTransforms !== true) ? true : false), 
							(prop.useTranslate3d === true) ? true : false);
					}
					else {
						domProperties = (!domProperties) ? {} : domProperties;
						domProperties[p] = prop[p];
					}
				});
			}
		}
		
		// clean up
		this.each(function() {
			var self = jQuery(this),
				cssProperties = self.data('cssEnhanced') || {};
				
			for (var i = cssPrefixes.length - 1; i >= 0; i--){
				if (typeof cssProperties[cssPrefixes[i]+'transition-property'] !== 'undefined') cssProperties[cssPrefixes[i]+'transition-property'] = cssProperties[cssPrefixes[i]+'transition-property'].substr(2);
			}
			
			self.data('cssEnhanced', cssProperties);
		});
		

		// fire up DOM based animations
		if (domProperties) {
			callbackQueue++;
			originalAnimateMethod.apply(this, [domProperties, opt.duration, opt.easing, propertyCallback]);
		}
		
		
		// apply the CSS transitions
		this.each(function() {
			var self = jQuery(this).unbind(transitionEndEvent);
			if (!jQuery.isEmptyObject(self.data('cssEnhanced')) && !jQuery.isEmptyObject(self.data('cssEnhanced').secondary)) {
				callbackQueue++;
				var secondary = self.data('cssEnhanced').secondary || {};
				self.css(self.data('cssEnhanced'));
				setTimeout(function(){ 
					self.bind(transitionEndEvent, cssCallback).css(secondary);
				});
			}
		});
	
		// over and out
		return this;
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
		if (typeof jQuery.ui !== undefined || !cssTransitionsSupported) return originalStopMethod.apply(this, [clearQueue, gotoEnd]);
		
		// clear the queue?
		if (clearQueue) {
			this.queue([]);
		}
		
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
				restore = {};
			
			// is this a CSS transition?
			if (!jQuery.isEmptyObject(self.data('cssEnhanced')) && !jQuery.isEmptyObject(self.data('cssEnhanced').secondary)) {
				var selfCSSData = self.data('cssEnhanced');

				if (gotoEnd) {
				    // grab end state properties
					restore = selfCSSData.secondary;
					
					if (!leaveTransforms && typeof selfCSSData.meta['left_o'] !== undefined || typeof selfCSSData.meta['top_o'] !== undefined) {						
						restore['left'] = typeof selfCSSData.meta['left_o'] !== undefined ? selfCSSData.meta['left_o'] : 'auto';
						restore['top'] = typeof selfCSSData.meta['top_o'] !== undefined ? selfCSSData.meta['top_o'] : 'auto';
						
						// remove the transformations
						restore['-webkit-transform'] = '';
						restore['-moz-transform'] = '';
						restore['-o-transform'] = '';
						restore['transform'] = '';
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
							restore['-webkit-transform'] = '';
							restore['-moz-transform'] = '';
							restore['-o-transform'] = '';
							restore['transform'] = '';
						}
				    }
				}
				
				// remove transition timing functions
				self.
					unbind(transitionEndEvent).
					css(reset).
					css(restore).
					data('translateX', 0).
					data('translateY', 0).
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