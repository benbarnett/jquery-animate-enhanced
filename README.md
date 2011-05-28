jquery.animate-enhanced plugin
===============

Extend $.animate() to detect CSS transitions for Webkit, Mozilla and Opera and convert animations automatically. Compatible with IE6+

Tested with jQuery 1.3.2 to 1.6.1

Properties supported: (more to come)
-----------------

* left : using translate(x, y) or translate3d(x, y, z)
* top : using translate(x, y) or translate3d(x, y, z)
* right
* bottom
* opacity
* width
* height

Note that any properties not mentioned above will simply be handled by the standard jQuery $.animate() method. This plugin adds new functionality without taking any away.

The idea is to simply enhance existing animations with a lightweight 'drop-in' plugin. Those looking for features such as IE transformations & translate() functionality should consider http://plugins.jquery.com/project/2d-transform


Demo
-----------------
Simple animation demo and documentation found here: http://playground.benbarnett.net/jquery-animate-enhanced/


What it does
-----------------

The plugin will analyse the properties you're animating on, and select the most appropriate method for the browser in use. This means your transitions on left, top and opacity will convert to a CSS3 transition on Webkit & Mozilla agents that support it, and Opera 10.50+. If the user is on a browser that has no CSS3 transitions, this plugin knows about it and won't get involved. Silent degradation :)

Multiple callback mechanisms are created internally to monitor for DOM manipulation and for all 'transitionend' CSS3 events to be picked up. This means you have one neat callback() for the whole animation regardless on whether the plugin is using CSS3, DOM, or both for its animations.

Progressively enhanced CSS3 animations without having to do any browser detection or special CSS, therefore using the same Javascript across your applications and websites.

As this plugin uses CSS3 translate where available, there is an internal callback mechanism to reset the 'left' and/or 'top' properties so that your layout is unaffected.

Usage
-----------------

Usage is identical to the jQuery animate() function, but it comes with 3 new paramaters, which are totally optional and safe to leave untouched for general use:

* avoidTransforms: (Boolean)
By default the plugin will convert left and top animations to the CSS3 style -webkit-transform (or equivalent) to aid hardware acceleration. This functionality can be disabled by setting this to true.
* useTranslate3d: (Boolean)
By default the plugin will use 2d translations due to wider browser support. Set this to true to use translate3d instead. Recommended for iPhone/iPad development ([here's why](http://www.benbarnett.net/2010/08/30/writing-html-and-css-for-mobile-safari-just-the-same-old-code/)).
* leaveTransforms: (Boolean)
By default if the plugin is animating a left or a top property, the translate (2d or 3d depending on setting above) CSS3 transformation will be used. To preserve other layout dependencies, once the transition is complete, these transitions are removed and converted back to the real left and top values. Set this to true to skip this functionality.


Changelog
-----------------

0.74 (28/05/2011):

* Fixing issue #29 to play nice with 1.6

0.73 (05/03/2011):

* Merged Pull Request #26: Fixed issue with fadeOut() / "hide" shortcut

0.72 (05/03/2011):

* Merged Pull Request #23: Added Penner equation approximations from Matthew Lein's Ceaser, and added failsafe fallbacks

0.71 (05/03/2011):

* Merged Pull Request #24: Changes translation object to integers instead of strings to fix relative values bug with leaveTransforms = true

0.70 (17/03/2011):

* Merged Pull Request from amlw-nyt to add bottom/right handling

0.68 (15/02/2011):

* Width/height fixes & queue issues resolved.

0.67 (15/02/2011):

* Code cleanups & file size improvements for compression.

0.66 (15/02/2011):

* Zero second fadeOut(), fadeIn() fixes

0.65 (01/02/2011):

* Callbacks with queue() support refactored to support element arrays

0.64 (27/01/2011):

* BUGFIX #13: .slideUp(), .slideToggle(), .slideDown() bugfixes in Webkit
        
0.63 (12/01/2011):

* BUGFIX #11: callbacks not firing when new value == old value

0.62 (10/01/2011):

* BUGFIX #11: queue is not a function issue fixed

0.61 (10/01/2011):

* BUGFIX #10: Negative positions converting to positive

0.60 (06/01/2011):

* Animate function rewrite in accordance with new queue system
* BUGFIX #8: Left/top position values always assumed relative rather than absolute
* BUGFIX #9: animation as last item in a chain — the chain is ignored?
* BUGFIX: width/height CSS3 transformation with left/top working

0.55 (22/12/2010):

* isEmptyObject function for <jQuery 1.4 (plugin still requires 1.3.2)

0.54a (22/12/2010):

* License changed to MIT (http://www.opensource.org/licenses/mit-license.php)

0.54 (22/12/2010):

* Removed silly check for 'jQuery UI' bailouts. Sorry.
* Scoping issues fixed - Issue #4: $(this) should give you a reference to the selector being animated.. per jquery's core animation funciton.

0.53 (17/11/2010):

* New $.translate() method to easily calculate current transformed translation
* Repeater callback bug fix for leaveTransforms:true (was constantly appending properties)
	
0.52 (16/11/2010):

* leaveTransforms: true bug fixes
* 'Applying' user callback function to retain 'this' context

0.51 (08/11/2010):
* Bailing out with jQuery UI. This is only so the plugin plays nice with others and is TEMPORARY.

0.50 (08/11/2010):

* Support for $.fn.stop()
* Fewer jQuery.fn entries to preserve namespace
* All references $ converted to jQuery
* jsDoc Toolkit style commenting for docs (coming soon)

0.49 (19/10/2010):

* Handling of 'undefined' errors for secondary CSS objects
* Support to enhance 'width' and 'height' properties (except shortcuts involving jQuery.fx.step, e.g slideToggle)
* Bugfix: Positioning when using avoidTransforms: true (thanks Ralf Santbergen reports)
* Bugfix: Callbacks and Scope issues

0.48 (13/10/2010):

* Checks for 3d support before applying

0.47 (12/10/2010);

* Compatible with .fadeIn(), .fadeOut()
* Use shortcuts, no duration for jQuery default or "fast" and "slow"
* Clean up callback event listeners on complete (preventing multiple callbacks)

0.46 (07/10/2010);

* Compatible with .slideUp(), .slideDown(), .slideToggle()

0.45 (06/10/2010):

* 'Zero' position bug fix (was originally translating by 0 zero pixels, i.e. no movement)

0.4 (05/10/2010):

* Iterate over multiple elements and store transforms in jQuery.data per element
* Include support for relative values (+= / -=)
* Better unit sanitization
* Performance tweaks
* Fix for optional callback function (was required)
* Applies data[translateX] and data[translateY] to elements for easy access
* Added 'easeInOutQuint' easing function for CSS transitions (requires jQuery UI for JS anims)
* Less need for leaveTransforms = true due to better position detections


Credits
-----------------

* Author: Ben Barnett - http://www.benbarnett.net - @benpbarnett
* HeyDanno! for his tips on detecting CSS3 support (http://gist.github.com/435054)
* Aza for his gist on CSS Animation wtih jQuery (http://gist.github.com/373874)