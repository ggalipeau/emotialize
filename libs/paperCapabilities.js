window.paper = window.paper || (window.paper = {});

(function(scope) {
	
	var b = document.body || document.documentElement,
		style = b.style,
		property,
		prefix;
	
	//	Test for CSS transforms
    var transform = false;
	var transforms = {
		'transform'			: '',
		'-webkit-transform'	: '-webkit-',
		'-moz-transform'	: '-moz-',
		'-ms-transform'		: '-ms-',
		'-o-transform'		: '-o-'
	}
	
	for (property in transforms){
		
		if (typeof style[property] === 'string') {
			transform = property;
			prefix = style[property];
			break;
		}
	}
	
	//	Test for CSS transitions
    var transition = false;
	var transitions = {
		'transition'			: '',
		'-webkit-transition'	: '-webkit-',
		'-moz-transition'		: '-moz-',
		'-ms-transition'		: '-ms-',
		'-o-transition'			: '-o-'
	}
	
	for (property in transitions){
		
		if (typeof style[property] === 'string') {
			transition = property;
			break;
		}
	}
	
	//	Test for CSS Transition Event
	var transitionEnd = false;
	if ('ontransitionend' in window) {
		transitionEnd = 'transitionend';
	} else if ('onwebkittransitionend' in window) {
		transitionEnd = 'webkitTransitionEnd';
	} else {
		
		if (transition) {
			if (prefix === '') {
				transitionEnd = 'transitionend';
			} else if (prefix === '-moz-') {
				transitionEnd = 'transitionend';
			} else if (prefix === '-o-') {
				transitionEnd = 'oTransitionEnd';
			}
		}
	}
	
//	transition = '-webkit-transition'
//	prefix = '-webkit-'
	
	//	Test for 3d transforms
	var transform3d = false;
	if ('perspective' in style || '-webkit-perspective' in style || '-moz-perspective' in style) {
		transform3d = true;
	}
	
	//	Test for Native Animations
	var nativeAnimations = false;
	if (typeof b.animate === 'function') {
		nativeAnimations = true;
	}
	
	//	Detect old browsers: IE8
	var oldBrowser = false;
	if (typeof document.createElement('SVG').getAttributeNS === 'undefined') {
		oldBrowser = true;
	}
	
	//	Detect touch support
	var hasTouch = false;
	if ('ontouchstart' in window || navigator.msMaxTouchPoints) {
		hasTouch = true;
	}
	
	scope.capabilities = {
		transition			: transition,
		transitionEnd		: transitionEnd,
		transform			: transform,
		transform3d			: transform3d,
		prefix				: prefix,
		nativeAnimations	: nativeAnimations,
		oldBrowser			: oldBrowser,
		hasTouch			: hasTouch
	}
	
//	alert( JSON.stringify(scope.capabilities))
	
}(paper))