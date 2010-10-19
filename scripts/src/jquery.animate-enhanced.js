/************************************************
	jquery.animate-enhanced plugin v0.49
	Author:  www.benbarnett.net || @benpbarnett
	Credits: Ralf Santbergen for his testing & support
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
	
	$(element).animate({left: 200},  500, function() {
		// callback
	});
	
Changelog:
	0.49 (19/10/2010):
		- Support to enhance 'width' and 'height' properties
		- Bugfix: Positioning when using avoidTransforms: true (thanks Ralf Santbergen)
		- Bugfix: Multiple $.animate calls with variable callbacks fixed (scope issues, thanks Ralf)

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

(function($) {
	// ----------
	// Plugin variables
	// ----------
	var cssTransitionsSupported = false,
		originalAnimateMethod = jQuery.fn.animate,
		has3D = ('WebKitCSSMatrix' in window && 'm11' in new WebKitCSSMatrix()),
		cssTransitionProperties = ["top", "left", "opacity", "height", "width"],
		cssPrefixes = ["", "-webkit-", "-moz-", "-o-"],
		pluginOptions = ["avoidTransforms", "useTranslate3d", "leaveTransforms"],
		rfxnum = /^([+-]=)?([\d+-.]+)(.*)$/;
		
		
	
	// ----------
	// Check if this browser supports CSS3 transitions
	// ----------
	var thisBody = document.body || document.documentElement,
   		thisStyle = thisBody.style,
		transitionEndEvent = (thisStyle.WebkitTransition !== undefined) ? "webkitTransitionEnd" : (thisStyle.OTransition !== undefined) ? "oTransitionEnd" : "transitionend";
	
	cssTransitionsSupported = thisStyle.WebkitTransition !== undefined || thisStyle.MozTransition !== undefined || thisStyle.OTransition !== undefined || thisStyle.transition !== undefined;
	
	
	// ----------
	// Interpret value ("px", "+=" and "-=" sanitisation)
	// ----------
	jQuery.fn.interpretValue = function(e, val, prop, isTransform) {	
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
	
	
	// ----------
	// Make a translate or translate3d string
	// ----------
	jQuery.fn.getTranslation = function(x, y, use3D) {
		return (use3D === true && has3D) ? "translate3d("+x+"px,"+y+"px,0)" : "translate("+x+"px,"+y+"px)";
	};
	
	
	// ----------
	// Build up the CSS object
	// ----------
	jQuery.fn.applyCSSTransition = function(e, property, duration, easing, value, isTransform, use3D) {
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

		return e.data('cssEnhanced', jQuery.fn.applyCSSWithPrefix(e.data('cssEnhanced'), property, duration, easing, value, isTransform, use3D));
	};
	
	
	// ----------
	// Helper function to build up CSS properties using the various prefixes
	// ----------
	jQuery.fn.applyCSSWithPrefix = function(cssProperties, property, duration, easing, value, isTransform, use3D) {
		cssProperties = typeof cssProperties === 'undefined' ? {} : cssProperties;
		cssProperties.secondary = typeof cssProperties.secondary === 'undefined' ? {} : cssProperties.secondary;
		
		for (var i = cssPrefixes.length - 1; i >= 0; i--){			
			if (typeof cssProperties[cssPrefixes[i] + 'transition-property'] === 'undefined') cssProperties[cssPrefixes[i] + 'transition-property'] = '';
			cssProperties[cssPrefixes[i]+'transition-property'] += ', ' + ((isTransform === true) ? cssPrefixes[i] + 'transform' : property);
			cssProperties[cssPrefixes[i]+'transition-duration'] = duration + 'ms';
			cssProperties[cssPrefixes[i]+'transition-timing-function'] = easing;
			cssProperties.secondary[((isTransform === true) ? cssPrefixes[i]+'transform' : property)] = (isTransform === true) ? jQuery.fn.getTranslation(cssProperties.meta.left, cssProperties.meta.top, use3D) : value;
		};
		
		return cssProperties;
	};
	
	
	// ----------
	// The new jQuery.animate() function
	// ----------
	jQuery.fn.animate = function(prop, speed, easing, callback) {
		if (!cssTransitionsSupported || jQuery.isEmptyObject(prop)) return originalAnimateMethod.apply(this, arguments);
		
		// get default jquery timing from shortcuts
		speed = typeof speed === 'undefined' ? "_default" : speed;
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
				var that = $(this),
					props = that.data('cssEnhanced') || {},
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
				
				that.
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
					var that = $(this),
						cleanVal = jQuery.fn.interpretValue(that, prop[p], p, (((p == "left" || p == "top") && prop.avoidTransforms !== true) ? true : false));
						
					if (jQuery.inArray(p, cssTransitionProperties) > -1 && that.css(p).replace(/px/g, "") !== cleanVal) {						
						jQuery.fn.applyCSSTransition(
							that,
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
						that.data('domProperties', domProperties);
					}
				});
			}
		}
		
		// clean up
		this.each(function() {
			var that = $(this),
				cssProperties = that.data('cssEnhanced') || {};
				
			for (var i = cssPrefixes.length - 1; i >= 0; i--){
				if (typeof cssProperties[cssPrefixes[i]+'transition-property'] !== 'undefined') cssProperties[cssPrefixes[i]+'transition-property'] = cssProperties[cssPrefixes[i]+'transition-property'].substr(2);
			}
			
			that.data('cssEnhanced', cssProperties);
		});
		

		
		this.each(function() {
			var that = $(this).unbind(transitionEndEvent);
			
			// apply the DOM properties
			if (!jQuery.isEmptyObject(that.data('domProperties'))) {
				callbackQueue++;
				originalAnimateMethod.apply(this, [that.data('domProperties'), opt.duration, opt.easing, propertyCallback]);
			}
			
			// apply the CSS transitions
			if (!jQuery.isEmptyObject(that.data('cssEnhanced'))) {
				if (!jQuery.isEmptyObject(that.data('cssEnhanced').secondary)) {
					callbackQueue++;
					that.css(that.data('cssEnhanced'));
					setTimeout(function(){ 
						that.bind(transitionEndEvent, cssCallback).css(that.data('cssEnhanced').secondary);
					});
				}
			}
		});
	
		
		// over and out
		return this;
	};	
})(jQuery);