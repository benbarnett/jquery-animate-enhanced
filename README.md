jquery.animate-enhanced plugin
===============

Extend $.animate() to detect CSS transitions for Webkit, Mozilla and Opera and convert animations automatically. Compatible with IE6+

Properties supported: (more to come)
-----------------

* left : using translate(x, y) or translate3d(x, y, z)
* top : using translate(x, y) or translate3d(x, y, z)
* opacity

Note that any properties not mentioned above will simply be handled by the standard jQuery $.animate() method. This plugin adds new functionality without taking any away.


OCTOBER 2010 - Changelog
-----------------
* Iterate over multiple elements and store transforms in $.data per element
* Include support for relative values (+= / -=)
* Better unit sanitization (string, integer, 'px') etc
* Several Performance tweaks
* Bug fix: for optional callback function (was required)
* Applies data[translateX] and data[translateY] to elements for easy access
* Added 'easeInOutQuint' easing function for CSS transitions (requires jQuery UI for JS anims)
* Less need for leaveTransforms = true due to better position detections


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
By default the plugin will use 2d translations due to wider browser support. Set this to true to use translate3d instead. Recommended for iPhone/iPad development (here's why).
* leaveTransforms: (Boolean)
By default if the plugin is animating a left or a top property, the translate (2d or 3d depending on setting above) CSS3 transformation will be used. To preserve other layout dependencies, once the transition is complete, these transitions are removed and converted back to the real left and top values. Set this to true to skip this functionality.

Credits
-----------------

* Author: Ben Barnett - http://www.benbarnett.net - @benpbarnett
* HeyDanno! for his tips on detecting CSS3 support (http://gist.github.com/435054)
* Aza for his gist on CSS Animation wtih jQuery (http://gist.github.com/373874)