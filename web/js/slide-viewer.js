var SlideViewer = (function (Zepto, jQuery) {
	var defaultOpts = {
		// Should we allow scrolling in scrollable
		// regions inside or outside of the slideviewer?
		// If set to true, we will ignore all gestures
		// which start off moving more in the y
		// direction than in the x direction.
		allowScroll: true,
		// If your source function is bounded by some
		// known limit, you can set it here.
		length: 10,
		// If you want to start somewhere other than
		// on the first slide, setting this (rather
		// than calling .setPage()) will prevent your
		// source function being called more times
		// than necessary.
		startAt: 0,
	}

	// Wrapper is an element which will contain the
	// slideviewer. It should have an explict height
	// (and width, if not display: block) set.
	// Source is a generator function. Given a page
	// index, it should return an element to use
	// as the slide for that page index.
	function SlideViewer (wrapper, source, opts) {
		var self = this;
		var slider;
		var masters = [];
		var activeMaster = 0;
		var xPos = 0;
		var minX = 0;
		var snapThreshold = 0;
		var pageWidth = 0;
		var inputhandler = new InputHandler(vendor);

		if (typeof source !== 'function') {
			throw "SlideViewer second argument should be a generator function!";
		}

		if (opts === undefined) opts = {};
		for (var opt in defaultOpts) {
			if (opts[opt] === undefined) {
				opts[opt] = defaultOpts[opt];
			}
		}

		var len = opts.length;
		var page = opts.startAt;

		function init () {
			wrapper.style.postition = 'relative';

			slider = document.createElement('div');
			var s = slider.style;
			s.position = 'relative';
			s.top = '0';
			s.height = '100%';
			s.width = '100%';
			s[prefixStyle('transitionTimingFunction')] = 'ease-out';
			wrapper.appendChild(slider);

			for (var i = -1; i < 2; i++) {
				var page = document.createElement('div');
				var s = page.style;
				s.position = 'absolute';
				s.top = '0';
				s.height = '100%';
				s.width = '100%';
				s.left = i * 100 + '%';

				slider.appendChild(page);
				masters.push({elm: page});
			}

			inputhandler.attach(wrapper, slider);
			inputhandler.on('start', onStart);
			inputhandler.on('resize', self.refreshSize);
			dispatcher.on('destroy', function () {
				inputhandler.detach();
			});

			self.refreshSize();
			self.setPage(opts.startAt);
		}

		var dispatcher = new Dispatcher();
		self.on = dispatcher.on;
		self.off = dispatcher.off;

		self.refreshSize = function () {
			pageWidth = wrapper.clientWidth;
			minX = (1 - len) * pageWidth;
			snapThreshold = Math.round(pageWidth * 0.15);
			setTransitionDuration(0);
			setPos(-page * pageWidth);
			return self;
		}

		self.setLen = function (n) {
			len = n;
			self.refreshSize();
			return self;
		}

		self.page = function () {
			return page;
		}

		var prevPage = -1;
		self.setPage = function (newPage) {
			if (typeof newPage !== 'number') {
				throw "SlideViewer.setPage() requires a number! ('" + newPage + "' given)";
			}
			function positionMasters(a, b, c) {
				var m = masters;
				var sa = m[a].elm.style;
				var sb = m[b].elm.style;
				var sc = m[c].elm.style;

				sa.left = (page - 1) * 100 + '%';
				if (page === 0) sa.visibility = 'hidden';
				else sa.visibility = 'visible';

				sb.left = page * 100 + '%';
				sb.visibility = 'visible';

				sc.left = (page + 1) * 100 + '%';
				if (page === len - 1) sc.visibility = 'hidden';
				else sc.visibility = 'visible';

				m[a].newPage = page === 0 ? len - 1 : page - 1;
				m[b].newPage = page;
				m[c].newPage = page === len - 1 ? 0 : page + 1;
			}
			page = clamp(newPage, 0, len - 1);
			setTransitionDuration(0);
			setPos(-page * pageWidth);

			activeMaster = mod(page + 1, 3);

			if (activeMaster === 0) {
				positionMasters(2, 0, 1);
			} else if (activeMaster == 1) {
				positionMasters(0, 1, 2);
			} else {
				positionMasters(1, 2, 0);
			}

			for (var i = 0; i < 3; i++) {
				var m = masters[i];
				if (m.newPage == m.page) continue;

				m.elm.innerHTML = '';
				m.elm.appendChild(getElement(m.newPage));

				m.page = m.newPage;
			}

			if (prevPage !== newPage) {
				dispatcher.fire('flip', newPage, masters[activeMaster].elm);
				prevPage = newPage;
			}

			return self;
		}

		self.curMaster = function () {
			for (var i = 0; i < 3; i++) {
				if (masters[i].page == page) return masters[i].elm;
			}
			throw "No master is displaying our current page. This is a bug! Current page: " + i + ", masters: " + JSON.serialize(masters);
		}

		self.eachMaster = function (cb) {
			for (var i = 0; i < 3; i++) {
				cb(masters[i].elm, masters[i].page);
			}
		}

		self.invalidate = function () {
			for (var i = 0; i < 3; i++) masters[i].page = -1;
			self.setPage(page);
			return self;
		}

		self.destroy = function () {
			dispatcher.fire('destroy');
			return self;
		}

		self.disable = function () {
			inputhandler.disableTouch();
		}

		self.enable = function () {
			inputhandler.enableTouch();
		}

		// Are we actually moving the slideviewer in response
		// to a user's touch currently? Useful for determining
		// what component should handle a touch interaction.
		self.moving = function () {
			return directionLocked;
		}

		// Although this typically makes things slower, it can
		// reduce the occurance of rare bugs, especially bugs
		// relating to the manipulation of the slideviewer
		// element (such as fading it in and out).
		var use3dAcceleration = true;
		self.disable3d = function () {
			use3dAcceleration = false;
			setPos(xPos);
		}

		self.enable3d = function () {
			use3dAcceleration = true;
			setPos(xPos);
		}

		function setPos (x) {
			var transform = prefixStyle('transform');
			xPos = x;
			// translateZ(0) does not affect our appearance, but hints to the
			// renderer that it should hardware accelerate us, and thus makes
			// things much faster and smoother (usually). For reference, see:
			//     http://www.html5rocks.com/en/tutorials/speed/html5/
			if (use3dAcceleration) {
				slider.style[transform] = 'translateX(' + x + 'px) translateZ(0)';
				slider.style.left = '';
			} else {
				slider.style[transform] = '';
				slider.style.left = x + 'px';
			}
		}

		function setTransitionDuration(t) {
			slider.style[prefixStyle('transitionDuration')] = t + 'ms';
		}

		var startedMoving = false;
		var directionLocked = false;
		function onStart (point) {
			inputhandler.off('start');
			inputhandler.on('end', onEndNoMove);

			var startX = point.pageX;
			var startY = point.pageY;
			var prevX = startX;
			var prevY = startY;
			startedMoving = false;
			directionLocked = false;

			setTransitionDuration(0);
			inputhandler.on('move', onMove);

			function onMove (e, point) {
				var dx = point.pageX - prevX;
				prevX = point.pageX;
				prevY = point.pageY;

				var absX = Math.abs(prevX - startX);
				var absY = Math.abs(prevY - startY);

				// We take a buffer to figure out if the swipe
				// was most likely intended for our consumption.
				// (and not just the start of a zoom operation
				// or other gesture).
				if (absX < 50 && absY < 50 && !startedMoving) {
					return;
				}
				startedMoving = true;

				// We are scrolling vertically, so skip SlideViewer and give the control back to the browser
				if (absY > absX && !directionLocked && opts.allowScroll) {
					inputhandler.off('move');
					inputhandler.off('end');
					inputhandler.on('start', onStart);
					return;
				}
				directionLocked = true;

				var newX = xPos + dx;
				if (newX > 0 || newX < minX) {
					newX = xPos + (dx / 2);
				}

				e.preventDefault();
				inputhandler.off('end').on('end', onEnd);
				setPos(newX);
				dispatcher.fire('move', newX);
			}

			function onEnd (point) {
				inputhandler.off('move');
				inputhandler.off('end');
				inputhandler.on('transitionEnd', onTransitionEnd);

				prevX = point.pageX;
				var deltaX = prevX - startX;
				var dist = Math.abs(deltaX);
				var newX;

				if (xPos > 0 || xPos < minX) dist *= 0.15;

				if (dist < snapThreshold) {
					var time = Math.floor(300 * dist / snapThreshold);
					setTransitionDuration(time);

					newX = -page * pageWidth;
					if (newX == xPos) {
						// Many browsers don't give us the transitionEnd event if the
						// start and end states of the transition are the same. Thus,
						// we just fire it immediately.
						onTransitionEnd();
					} else {
						setPos(newX);
					}
					return;
				}

				if (deltaX > 0) {
					page = Math.floor(-xPos / pageWidth);
				} else {
					page = Math.ceil(-xPos / pageWidth);
				}

				newX = -page * pageWidth;

				var time = Math.floor(500 * Math.abs(xPos - newX) / pageWidth);
				setTransitionDuration(time);

				setPos(newX);
			}

			function onEndNoMove () {
				inputhandler.off('move');
				inputhandler.off('end');
				inputhandler.on('start', onStart);
			}

			function onTransitionEnd (e) {
				inputhandler.off('transitionEnd');
				self.setPage(page);
				inputhandler.on('start', onStart);
			}
		}

		function getElement (i) {
			function errorPage(customMessage) {
				var err = document.createElement('p');
				err.innerHTML = "There was an error creating this page! Contact the developer for more information..." + "<br><br>" + customMessage;
				return err;
			}

			var element = null;
			try {
				element = source(i);
			} catch (e) {
				return errorPage("Exception returned from source() function with input " + i + ". Message: " + e);
			}

			if (isElement(element)) {
				return element;
			} else {
				return errorPage("Invalid type returned from source() function. Got type " + typeof element + " (with value " + element + "), expected string or node. Input was " + i);
			}
		}

		init();
	};
	function Touch(domTouch) {
		var self = this;
		self.x = domTouch.pageX;
		self.y = domTouch.pageY;
		self.id = domTouch.identifier;
	}

	function Touchable(elm, opts) {
		var self = this;

		var listeners = [];
		function attach(elm, ev, cb) {
			listeners.push({elm: elm, ev: ev, cb: cb});
			elm.addEventListener(ev, cb, false);
		}

		attach(elm, 'touchstart', onTouchStart);
		attach(elm, 'touchmove', onTouchMove);
		attach(elm, 'touchend', onTouchEnd);
		attach(elm, 'touchcancel', onTouchEnd);

		var fingers = [];
		var numTouches = 0;
		var currentHand;

		function onTouchStart(ev) {
			currentHand.fire('end');
			numTouches++;
			currentHand = new Hand(numTouches);
		}

		self.destroy = function () {
			for (var i = 0; i < listeners.length; i++) {
				var l = listeners[i];
				l.elm.removeEventListener(l.ev, l.cb, false);
			}
		}

		var dispatcher = new Dispatcher();
		self.on = dispatcher.on;
		self.off = dispatcher.off;
	}


	function InputHandler (vendor) {
		var self = this;
		var hasTouch = 'ontouchstart' in window;
		var resizeEvent = 'onorientationchange' in window ? 'orientationchange' : 'resize';
		var startEvent = hasTouch ? 'touchstart' : 'mousedown';
		var moveEvent = hasTouch ? 'touchmove' : 'mousemove';
		var endEvent = hasTouch ? 'touchend' : 'mouseup';
		var cancelEvent = hasTouch ? 'touchcancel' : 'mouseout';
		var transitionEndEvent = (function () {
			if ( vendor === false ) return false;

								  var transitionEnd = {
									  ''			: 'transitionend',
							'webkit'	: 'webkitTransitionEnd',
							'Moz'		: 'transitionend',
							'O'			: 'oTransitionEnd',
							'ms'		: 'MSTransitionEnd'
								  };

								  return transitionEnd[vendor];
		})();
		var lastTouch;
		var touchDisabled = false;

		function findTouch(touches, touchID) {
			for (var i = 0; i < touches.length; i++) {
				if (touches[i].identifier == touchID) return touches[i];
			}
			return null;
		}

		function handleEvent (e) {
			var t = e.type;
			if (t == resizeEvent) {
				dispatcher.fire('resize', e);
			} else if (t == transitionEndEvent) {
				dispatcher.fire('transitionEnd', e);
			}

			if (touchDisabled) {
				if (hasTouch && t == startEvent) {
					lastTouch = e.changedTouches[0];
				}
				return;
			}

			var touchID = lastTouch ? lastTouch.identifier : '';
			if (t == startEvent) {
				if (hasTouch) {
					if (lastTouch) return;
				   lastTouch = e.changedTouches[0];
				}
				dispatcher.fire('start', hasTouch ? e.changedTouches[0] : e);
			} else if (t == moveEvent) {
				if (!hasTouch) {
					dispatcher.fire('move', e, e);
					return
				}

				var touch = findTouch(e.touches, touchID);
				lastTouch = touch;
				dispatcher.fire('move', e, touch);
			} else if (t == cancelEvent || t == endEvent) {
				if (!hasTouch) {
					dispatcher.fire('end', e);
					return;
				}

				if (!lastTouch) return;

				   var touch = findTouch(e.changedTouches, touchID);
				if (!touch) touch = findTouch(e.touches, touchID);

				   dispatcher.fire('end', touch);
				lastTouch = null;
			}
		}

		var dispatcher = new Dispatcher();
		self.on = dispatcher.on;
		self.off = dispatcher.off;

		var wrapper;
		var slider;
		self.attach = function (newWrapper, newSlider) {
			if (wrapper || slider) self.detach();
			wrapper = newWrapper;
			slider = newSlider;
			window.addEventListener(resizeEvent, handleEvent, false);
			wrapper.addEventListener(startEvent, handleEvent, false);
			wrapper.addEventListener(moveEvent, handleEvent, false);
			wrapper.addEventListener(endEvent, handleEvent, false);
			wrapper.addEventListener(cancelEvent, handleEvent, false);
			slider.addEventListener(transitionEndEvent, handleEvent, false);
			return self;
		}

		self.detach = function () {
			window.removeEventListener(resizeEvent, handleEvent, false);
			wrapper.removeEventListener(startEvent, handleEvent, false);
			wrapper.removeEventListener(moveEvent, handleEvent, false);
			wrapper.removeEventListener(endEvent, handleEvent, false);
			wrapper.removeEventListener(cancelEvent, handleEvent, false);
			slider.removeEventListener(transitionEndEvent, handleEvent, false);
			return self;
		}

		// If a touch is currently happening, simulates
		// touchcancel. Prevents further touch events from
		// being processed.
		self.disableTouch = function () {
			if (lastTouch) {
				dispatcher.fire('end', lastTouch);
				lastTouch = null;
			}
			touchDisabled = true;
		}

		// Simulates a touchstart if a touch is currently
		// in progress.
		self.enableTouch = function () {
			if (lastTouch) {
				dispatcher.fire('start', lastTouch);
			}
			touchDisabled = false;
		}
	}

	var vendor = (function () {
		var dummyStyle = document.createElement('div').style;
		var vendors = 't,webkitT,MozT,msT,OT'.split(',');

		for (var i = 0; i < vendors.length; i++) {
			var t = vendors[i] + 'ransform';
			if (t in dummyStyle) {
				return vendors[i].substr(0, vendors[i].length - 1);
			}
		}

		return false;
	})();

	function prefixStyle (style) {
		if (vendor === '') return style;
		style = style.charAt(0).toUpperCase() + style.substr(1);
		return vendor + style;
	}

	// Mod in javascript is messed up for negative numbers.
	function mod (a, b) {
		return ((a % b) + b) % b;
	}

	function clamp (n, min, max) {
		return Math.max(min, Math.min(max, n));
	}

	function isElement (o) {
		if (typeof HTMLElement === "object") {
			return o instanceof HTMLElement
		} else {
			return o && typeof o === "object" && o.nodeType === 1 && typeof o.nodeName === "string"
		}
	}

	return SlideViewer;
})(window.Zepto, window.jQuery);
