/*
 * MapBBCode Loader
 *
 * A single script that loads Leaflet and MapBBCode libraries (if needed),
 * and then replaces all [map] bbcode with maps.
 */

window.mapBBCodeLoaderOptions = {
	path: 'mapbbcode/', // relative or absolute path to leaflet and mapbbcode libraries
	language: '', // put actual lang file name (without .js)
	addons: [], // array of strings for addons (paths to js files relative to mapbbcode path)
	proprietary: [], // array of proprietary layer names (without js)
	plain: false, // if true, converts plain bbcode to maps, otherwise only processes divs
	force: false, // load libraries regardless of presence of bbcode
	draw: false, // load Leaflet.draw library

	mapBBCodeOptions: {},
	processorOptions: {}
};

window.mapBBCodeLoaderOptions.set = function( options ) {
	for( var opt in options ) {
		if( opt === 'mapBBCodeOptions' ) {
			var mapOpt = options[opt], opt1;
			for( opt1 in mapOpt )
				if( mapOpt.hasOwnProperty(opt1) )
					this[opt][opt1] = mapOpt[opt1];
		} else if( options.hasOwnProperty(opt) )
			this[opt] = options[opt];
	}
};

(function(window, document) {
	// 1. add leaflet scripts and wait for their loading
	// 2. add mapbbcode scripts (with options.addons) and wait for their loading
	// 3. create mapbbcode object (with options.mapbbcodeOptions)
	// 4. scan page for <div class="mapbbcode" /> and replace them with mapbbcode
	// 5. the same for <div class="mapbbcode_shared" />
	// 6. if options.plain, scan and replace [map] and [mapid]
	// 7. add onclick handler to <input type="button" class="mapbbcode_edit"> or <button>,
	//    which opens mapbbcode editor for a textarea identified with "target_id" attribute
	
	// find sub-elements of root with given class name and tag names
	function findByClass( root, className, tagNames ) {
		var result = [], i, j, node = root || document, elements,
			pattern = new RegExp('(?:^|\\s)' + className + '(?:\\s|$)');
		if( root.className && pattern.test(root.className) )
			return [root];
		if( node.getElementsByClassName ) {
			elements = node.getElementsByClassName(className);
			for( i = 0; i < elements.length; i++ ) {
				for( j = 0; j < tagNames.length; j++ )
					if( elements[i].nodeName == tagNames[j] )
						result.push(elements[i]);
			}
		} else {
			elements = [];
			for( i = 0; i < tagNames.length; i++ )
				elements = elements.concat(node.getElementsByTagName(tagNames[i]));
			for( i = 0; i < elements.length; i++ ) {
				if( pattern.test(elements[i].className) )
					result.push(elements[i]);
			}
		}
		return result;
	}

	// finds all text nodes that look like mapbbcode
	function findTextWithMapBBCode(root) {
		var result = [];
		(function scanSubTree(node) {
			if( node.childNodes.length ) {
				for( var i = 0; i < node.childNodes.length; i++ )
					if( (!('tagName' in node) || node.tagName != 'TEXTAREA') && (!('className' in node) || node.className.indexOf('mapbbcode') < 0) )
						scanSubTree(node.childNodes[i]);
			} else if( node.nodeType == Node.TEXT_NODE ) {
				if( node.nodeValue.indexOf('[/map]') >= 0 || node.nodeValue.indexOf('[mapid]') >= 0 )
					result.push(node);
			}
		})(root || document);
		return result;
	}

	// encloses part of a text node in a div with given class name
	function encloseInDiv( textNode, pos, length, className ) {
		var el = document.createElement('div'),
			secondPart = textNode.splitText(pos),
			thirdPart = secondPart.splitText(length);
		el.className = className;
		secondPart.parentNode.insertBefore(el, secondPart);
		el.appendChild(secondPart);
		return thirdPart;
	}

	// processes [non-empty!] array of text nodes, enclosing all valid non-empty bbcodes in a div
	function wrapBBCodeInDivs(nodes) {
		var re = new RegExp(window.MapBBCodeProcessor.getBBCodeRegExp().source, 'gi'),
			reShared = new RegExp('\\[mapid\\]\\s*[a-z]+\\s*\\[/mapid\\]', 'gi');
		for( var j = 0; j < nodes.length; j++ ) {
			var node = nodes[j], m, ms;
			while( true ) {
				m = re.exec(node.nodeValue);
				ms = reShared.exec(node.nodeValue);
				if( m && m.length > 0 ) {
					if( !window.MapBBCodeProcessor.isEmpty(m[0]) ) { // do not process [map][/map]
						node = encloseInDiv(node, m.index, m[0].length, 'mapbbcode');
						re.lastIndex = 0;
						reShared.lastIndex = 0;
					}
				} else if( ms && ms.length > 0 ) {
					node = encloseInDiv(node, ms.index, ms[0].length, 'mapbbcode_shared');
					re.lastIndex = 0;
					reShared.lastIndex = 0;
				} else
					break;
			}
		}
	}

	// iterates over every instance of mapbbcode*, calling callback function with an object { button?, shared?, element, ... }
	function eachMap( root, callback ) {
		if( window.mapBBCodeLoaderOptions.plain ) {
			// first wrap all not already enclosed bbcode in divs
			var nodes = findTextWithMapBBCode(root);
			if( nodes.length > 0 ) {
				if( 'MapBBCodeProcessor' in window ) {
					wrapBBCodeInDivs(nodes);
				} else {
					// no need to wrap anything: just ping callback if we found something
					callback.call(this, {});
				}
			}
		}

		// <div class="mapbbcode">...</div>
		var mapbbcodes = findByClass(root, 'mapbbcode', ['DIV']), i, cn, r;
		for( i = 0; i < mapbbcodes.length; i++ ) {
			cn = mapbbcodes[i].childNodes;
			if( cn && cn.length > 0 && (cn[0].tagName == 'DIV' || (cn.length > 1 && cn[1].tagName == 'DIV')) )
				continue;
			r = callback.call(this, {
				shared: false,
				element: mapbbcodes[i]
			});
			if( r ) return;
		}

		// <div class="mapbbcode_shared">abcde</div>
		mapbbcodes = findByClass(root, 'mapbbcode_shared', ['DIV']);
		for( i = 0; i < mapbbcodes.length; i++ ) {
			cn = mapbbcodes[i].childNodes;
			if( cn && cn.length > 0 && (cn[0].tagName == 'DIV' || (cn.length > 1 && cn[1].tagName == 'DIV')) )
				continue;
			var id = /^\s*(?:\[mapid\]\s*)?([a-z]+)(?:\s*\[\/mapid\])?\s*$/.exec(mapbbcodes[i].innerHTML);
			if( id && id.length > 1 ) {
				r = callback.call(this, {
					shared: true,
					id: id[1],
					element: mapbbcodes[i]
				});
				if( r ) return;
			}
		}

		// <input type="button" class="mapbbcode_edit" target_id="..." />
		buttons = findByClass(root, 'mapbbcode_edit', ['INPUT', 'BUTTON', 'A']);
		for( i = 0; i < buttons.length; i++ ) {
			var targetEl;
			if( buttons[i].getAttribute('target_id') )
				targetEl = document.getElementsById(buttons[i].getAttribute('target_id'));
			if( !targetEl ) {
				var textArea = document.getElementsByTagName('TEXTAREA');
				if( textArea && textArea.length > 0 )
					targetEl = textArea[0];
			}
			r = callback.call(this, {
				button: true,
				target: targetEl,
				element: buttons[i]
			});
			if( r ) return;
		}
	}

	// fixes script case to "Ulower", also expands language name
	function normalizeName( name ) {
		if( !name || !name.length )
			return name;
		name = name.replace(/^\s+|\s+$/g, '').replace(/\.js$/, '');
		if( name.length <= 1 )
			return name.toUpperCase();
		return name.substring(0, 1).toUpperCase() + name.substring(1).toLowerCase();
	}

	var loadingCount = 0, // number of scripts currently loading
		timeoutId, // id of a timeout that waits for scripts
		timeoutCount = 60; // number of step2() calls after which it should give up
	
	// appends a script of a css file. Calls callback after script was loaded
	function appendFile( url, callback ) {
		var el, head = document.head || document.getElementsByTagName('head')[0];
		if( url.substring(url.length - 3) == 'css' ) {
			el = document.createElement('link');
			el.rel = 'stylesheet';
			el.type = 'text/css';
			el.href = url;
		} else {
			el = document.createElement('script');
			el.type = 'text/javascript';
			el.async = true;
			el.src = url;
			var already = false;
			el.onload = el.onreadystatechange = el.onerror = function() {
				if( !already && (!el.readyState || /loaded|complete/.test(el.readyState)) ) {
					already = true;
					el.onload = el.onreadystatechange = null;
					loadingCount--;
					if( callback ) callback();
				}
			};
			loadingCount++;
		}
		head.appendChild(el);
	}

	var initialized = false;

	function init() {
		// prevent double initialization
		if( initialized || 'MapBBCode' in window ) {
			if( 'updateMapBBCode' in window )
				window.updateMapBBCode(); // just in case
			return;
		}
		initialized = true;

		var options = window.mapBBCodeLoaderOptions;
		if( !options.force ) {
			// if there are no maps on page, do not do anything
			var found = false;
			eachMap(document, function() { found = true; return true; }); // find the first map
			if( !found ) return;
		}

		// add css and scripts
		var path = options.path || '.';
		if( path.substring(path.length - 1) !== '/' )
			path += '/';
		if( !('windowPath' in options.mapBBCodeOptions) )
			options.mapBBCodeOptions.windowPath = path;

		appendFile(path + 'leaflet.css');
		appendFile(path + 'leaflet.js', function() {
			if( options.draw ) {
				appendFile(path + 'leaflet.draw.css');
				appendFile(path + 'leaflet.draw.js');
			}
			appendFile(path + 'mapbbcode.js', function() {
				var i, lang = options.language.substring(0, 2).toLowerCase();
				if( lang && lang.length > 1 )
					appendFile(path + 'lang/' + lang + '.js');
				if( options.proprietary.length > 0 || options.mapBBCodeOptions.layers ) {
					appendFile(path + 'LayerList.js');
					for( i = 0; i < options.proprietary.length; i++ )
						appendFile(path + 'proprietary/' + normalizeName(options.proprietary[i]) + '.js');
				}
				for( i = 0; i < options.addons.length; i++ )
					appendFile(path + options.addons[i]);

				// now wait
				timeoutId = window.setInterval(step2, 50);
			});
		});
	}

	// actually replace bbcodes with maps. Can be called with a root element
	function update( root ) {
		eachMap(root || document, function(c) {
			var mapBBCode = window._mapBBCode;
			if( c.button ) {
				window.L.DomEvent.on(c.element, 'click', function(e) {
					mapBBCode.editorWindow(c.target);
					return window.L.DomEvent.stop(e);
				});
			} else if( !c.shared ) {
				mapBBCode.show(c.element);
			} else {
				mapBBCode.showExternal(c.element, c.id);
			}
		});
	}

	// checks that all scripts have finished loading and initializes MapBBCode object, then calling update()
	function step2() {
		if( loadingCount > 0 && --timeoutCount > 0 ) return;
		window.clearInterval(timeoutId);

		var options = window.mapBBCodeLoaderOptions;
		window.MapBBCodeProcessor.setOptions(options.processorOptions);
		window._mapBBCode = new window.MapBBCode(options.mapBBCodeOptions);
		window.updateMapBBCode = update;
		update();

		if( options.onload )
			options.onload(window._mapBBCode);
	}

	// process the page only after it has finished loading
	if( document.readyState == 'interactive' || document.readyState == 'complete' )
		init();
	else if( document.addEventListener )
		document.addEventListener('DOMContentLoaded', init, false);
	else {
		// IE 8
		var checkLoad = function() {
			if( document.readyState != 'interactive' && document.readyState != 'complete' )
				setTimeout(checkLoad, 50);
			else
				init();
		};
		checkLoad();
	}

})(window, document);
