// Simple event dispatcher inspired by jQuery's .on() and .off() methods.
// Useful to expose arbitrary events to a client of your library in a
// simple, fast, and familiar manner. For example, if you are writing
// yet another AJAX library, and you want clients to be able to find out
// when the ajax call has completed, you can do something like the following:
//
//    function AjaxRequest (url) {
//        var self = this;
//        var dispatcher = new Dispatcher();
//        self.on = dispatcher.on;
//        self.off = dispatcher.off;
//        self.send = function () {
//            [...]
//                 dispatcher.fire('load', data);
//        }
//    }
//
// And clients can just use it how they expect to:
//
//    var ajax = new AjaxRequest('http://www.google.com');
//    ajax.on('load', function () {
//        [...]
//    }
//    ajax.send();
//
// With full, complete namespace support, event removal, and everything else
// your users expect - in under 1kb of minified JS code.
function Dispatcher () {
	var self = this;
	function intersection (a, b) {
		var res = [];
		for (var i = 0; i < a.length; i++) {
			for (var j = 0; j < b.length; j++) {
				if (a[i] == b[j]) {
					res = res.concat(a[i]);
				}
			}
		}
		return res;
	}
	// JavaScript does reference equality for arrays by default. See
	// http://stackoverflow.com/questions/3115982/how-to-check-javascript-array-equals
	function arrEqual (a, b) {
		return a.toString() == b.toString();
	}
	var events = {};

	// Attach a handler for the given event(s), and associate the given namespace(s)
	// with the event for easy removal later. Works like jQuery.on(), so
	//    dispatcher.on('click.foobar mouseup.foobar', cb);
	// will attach cb to the click and mouseup events, and additionally associate it
	// with the foobar namespace, so that you can easily remove it later with
	//    dispatcher.off('.foobar');
	self.on = function (name, cb) {
		var eventList = name.split(' ');
		for (var i = 0; i < eventList.length; i++) {
			var namebits = eventList[i].split('.');
			var event = namebits[0];
			var namespaces = namebits.splice(1);
			registerEvent(event, namespaces, cb);
		}

		function registerEvent (event, namespaces, cb) {
			events[event] = (events[event] || []).concat({
				callback: cb,
				namespaces: namespaces,
			});
		}
		return self;
	}

	// Removes handlers for the given event(s) in the given namespace(s). For
	// each event, all of the specified namespaces must exist on the handler
	// or it is not removed (this behaviour is the same as jQuery). If you
	// would like to remove several different namespaces, you can specify them
	// seperately. For example both,
	//    dispatcher.off('.foo.bar');
	//    dispatcher.off('click.foo.bar');
	// will remove only handlers registered with both foo and bar as namespaces.
	// If you want to remove handlers with either namespace, you can seperate them
	// with spaces.
	//    dispatcher.off('.foo .bar');
	//    dispatcher.off('click.foo click.bar');
	self.off = function (name) {
		var eventList = name.split(' ');
		for (var i = 0; i < eventList.length; i++) {
			var namebits = eventList[i].split('.');
			var event = namebits[0];
			var namespaces = namebits.splice(1);

			if (event === '') {
				for (var ev in events) {
					detachEvent(ev, namespaces);
				}
			} else {
				detachEvent(event, namespaces);
			}
		}

		function detachEvent (event, namespaces) {
			for (var i = 0; i < (events[event] || []).length; i++) {
				var ev = events[event][i];
				if (arrEqual(intersection(ev.namespaces, namespaces), namespaces)) {
					events[event].splice(i, 1);
					i--;
				}
			}
		}
		return self;
	}

	// Fire an event with the given name, passing the later arguments as parameters
	// to all registered callbacks.
	self.fire = function (name /*, arguments */) {
		var handlers = events[name] || [];
		var args = Array.prototype.slice.call(arguments, 1);
		for (var i = 0; i < handlers.length; i++) {
			handlers[i].callback.apply(null, args);
		}
		return self;
	}
}
