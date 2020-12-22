'use strict';

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

/*
 * JQuery URL Parser plugin, v2.2.1
 * Developed and maintanined by Mark Perkins, mark@allmarkedup.com
 * Source repository: https://github.com/allmarkedup/jQuery-URL-Parser
 * Licensed under an MIT-style license. See https://github.com/allmarkedup/jQuery-URL-Parser/blob/master/LICENSE for details.
 */

;(function (factory) {
	if (typeof define === 'function' && define.amd) {
		// AMD available; use anonymous module
		if (typeof jQuery !== 'undefined') {
			define(['jquery'], factory);
		} else {
			define([], factory);
		}
	} else {
		// No AMD available; mutate global vars
		if (typeof jQuery !== 'undefined') {
			factory(jQuery);
		} else {
			factory();
		}
	}
})(function ($, undefined) {

	var tag2attr = {
		a: 'href',
		img: 'src',
		form: 'action',
		base: 'href',
		script: 'src',
		iframe: 'src',
		link: 'href'
	},
	    key = ['source', 'protocol', 'authority', 'userInfo', 'user', 'password', 'host', 'port', 'relative', 'path', 'directory', 'file', 'query', 'fragment'],
	    // keys available to query

	aliases = { 'anchor': 'fragment' },
	    // aliases for backwards compatability

	parser = {
		strict: /^(?:([^:\/?#]+):)?(?:\/\/((?:(([^:@]*):?([^:@]*))?@)?([^:\/?#]*)(?::(\d*))?))?((((?:[^?#\/]*\/)*)([^?#]*))(?:\?([^#]*))?(?:#(.*))?)/, //less intuitive, more accurate to the specs
		loose: /^(?:(?![^:@]+:[^:@\/]*@)([^:\/?#.]+):)?(?:\/\/)?((?:(([^:@]*):?([^:@]*))?@)?([^:\/?#]*)(?::(\d*))?)(((\/(?:[^?#](?![^?#\/]*\.[^?#\/.]+(?:[?#]|$)))*\/?)?([^?#\/]*))(?:\?([^#]*))?(?:#(.*))?)/ // more intuitive, fails on relative paths and deviates from specs
	},
	    toString = Object.prototype.toString,
	    isint = /^[0-9]+$/;

	function parseUri(url, strictMode) {
		var str = decodeURI(url),
		    res = parser[strictMode || false ? 'strict' : 'loose'].exec(str),
		    uri = { attr: {}, param: {}, seg: {} },
		    i = 14;

		while (i--) {
			uri.attr[key[i]] = res[i] || '';
		}

		// build query and fragment parameters		
		uri.param['query'] = parseString(uri.attr['query']);
		uri.param['fragment'] = parseString(uri.attr['fragment']);

		// split path and fragement into segments		
		uri.seg['path'] = uri.attr.path.replace(/^\/+|\/+$/g, '').split('/');
		uri.seg['fragment'] = uri.attr.fragment.replace(/^\/+|\/+$/g, '').split('/');

		// compile a 'base' domain attribute        
		uri.attr['base'] = uri.attr.host ? (uri.attr.protocol ? uri.attr.protocol + '://' + uri.attr.host : uri.attr.host) + (uri.attr.port ? ':' + uri.attr.port : '') : '';

		return uri;
	};

	function getAttrName(elm) {
		var tn = elm.tagName;
		if (typeof tn !== 'undefined') return tag2attr[tn.toLowerCase()];
		return tn;
	}

	function promote(parent, key) {
		if (parent[key].length == 0) return parent[key] = {};
		var t = {};
		for (var i in parent[key]) {
			t[i] = parent[key][i];
		}parent[key] = t;
		return t;
	}

	function parse(parts, parent, key, val) {
		var part = parts.shift();
		if (!part) {
			if (isArray(parent[key])) {
				parent[key].push(val);
			} else if ('object' == _typeof(parent[key])) {
				parent[key] = val;
			} else if ('undefined' == typeof parent[key]) {
				parent[key] = val;
			} else {
				parent[key] = [parent[key], val];
			}
		} else {
			var obj = parent[key] = parent[key] || [];
			if (']' == part) {
				if (isArray(obj)) {
					if ('' != val) obj.push(val);
				} else if ('object' == (typeof obj === 'undefined' ? 'undefined' : _typeof(obj))) {
					obj[keys(obj).length] = val;
				} else {
					obj = parent[key] = [parent[key], val];
				}
			} else if (~part.indexOf(']')) {
				part = part.substr(0, part.length - 1);
				if (!isint.test(part) && isArray(obj)) obj = promote(parent, key);
				parse(parts, obj, part, val);
				// key
			} else {
				if (!isint.test(part) && isArray(obj)) obj = promote(parent, key);
				parse(parts, obj, part, val);
			}
		}
	}

	function merge(parent, key, val) {
		if (~key.indexOf(']')) {
			var parts = key.split('['),
			    len = parts.length,
			    last = len - 1;
			parse(parts, parent, 'base', val);
		} else {
			if (!isint.test(key) && isArray(parent.base)) {
				var t = {};
				for (var k in parent.base) {
					t[k] = parent.base[k];
				}parent.base = t;
			}
			set(parent.base, key, val);
		}
		return parent;
	}

	function parseString(str) {
		return reduce(String(str).split(/&|;/), function (ret, pair) {
			try {
				pair = decodeURIComponent(pair.replace(/\+/g, ' '));
			} catch (e) {
				// ignore
			}
			var eql = pair.indexOf('='),
			    brace = lastBraceInKey(pair),
			    key = pair.substr(0, brace || eql),
			    val = pair.substr(brace || eql, pair.length),
			    val = val.substr(val.indexOf('=') + 1, val.length);

			if ('' == key) key = pair, val = '';

			return merge(ret, key, val);
		}, { base: {} }).base;
	}

	function set(obj, key, val) {
		var v = obj[key];
		if (undefined === v) {
			obj[key] = val;
		} else if (isArray(v)) {
			v.push(val);
		} else {
			obj[key] = [v, val];
		}
	}

	function lastBraceInKey(str) {
		var len = str.length,
		    brace,
		    c;
		for (var i = 0; i < len; ++i) {
			c = str[i];
			if (']' == c) brace = false;
			if ('[' == c) brace = true;
			if ('=' == c && !brace) return i;
		}
	}

	function reduce(obj, accumulator) {
		var i = 0,
		    l = obj.length >> 0,
		    curr = arguments[2];
		while (i < l) {
			if (i in obj) curr = accumulator.call(undefined, curr, obj[i], i, obj);
			++i;
		}
		return curr;
	}

	function isArray(vArg) {
		return Object.prototype.toString.call(vArg) === "[object Array]";
	}

	function keys(obj) {
		var keys = [];
		for (prop in obj) {
			if (obj.hasOwnProperty(prop)) keys.push(prop);
		}
		return keys;
	}

	function purl(url, strictMode) {
		if (arguments.length === 1 && url === true) {
			strictMode = true;
			url = undefined;
		}
		strictMode = strictMode || false;
		url = url || window.location.toString();

		return {

			data: parseUri(url, strictMode),

			// get various attributes from the URI
			attr: function attr(_attr) {
				_attr = aliases[_attr] || _attr;
				return typeof _attr !== 'undefined' ? this.data.attr[_attr] : this.data.attr;
			},

			// return query string parameters
			param: function param(_param) {
				return typeof _param !== 'undefined' ? this.data.param.query[_param] : this.data.param.query;
			},

			// return fragment parameters
			fparam: function fparam(param) {
				return typeof param !== 'undefined' ? this.data.param.fragment[param] : this.data.param.fragment;
			},

			// return path segments
			segment: function segment(seg) {
				if (typeof seg === 'undefined') {
					return this.data.seg.path;
				} else {
					seg = seg < 0 ? this.data.seg.path.length + seg : seg - 1; // negative segments count from the end
					return this.data.seg.path[seg];
				}
			},

			// return fragment segments
			fsegment: function fsegment(seg) {
				if (typeof seg === 'undefined') {
					return this.data.seg.fragment;
				} else {
					seg = seg < 0 ? this.data.seg.fragment.length + seg : seg - 1; // negative segments count from the end
					return this.data.seg.fragment[seg];
				}
			}

		};
	};

	if (typeof $ !== 'undefined') {

		$.fn.url = function (strictMode) {
			var url = '';
			if (this.length) {
				url = $(this).attr(getAttrName(this[0])) || '';
			}
			return purl(url, strictMode);
		};

		$.url = purl;
	} else {
		window.purl = purl;
	}
});
'use strict';

var HT = HT || {};
head.ready(function () {

  // var $status = $("div[role=status]");

  // var lastMessage; var lastTimer;
  // HT.update_status = function(message) {
  //     if ( lastMessage != message ) {
  //       if ( lastTimer ) { clearTimeout(lastTimer); lastTimer = null; }

  //       setTimeout(() => {
  //         $status.text(message);
  //         lastMessage = message;
  //         console.log("-- status:", message);
  //       }, 50);
  //       lastTimer = setTimeout(() => {
  //         $status.get(0).innerText = '';
  //       }, 500);

  //     }
  // }

  HT.renew_auth = function (entityID) {
    var source = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 'image';

    if (HT.__renewing) {
      return;
    }
    HT.__renewing = true;
    setTimeout(function () {
      var reauth_url = 'https://' + HT.service_domain + '/Shibboleth.sso/Login?entityID=' + entityID + '&target=' + encodeURIComponent(window.location.href);
      var retval = window.confirm('We\'re having a problem with your session; select OK to log in again.');
      if (retval) {
        window.location.href = reauth_url;
      }
    }, 100);
  };

  HT.analytics = HT.analytics || {};
  HT.analytics.logAction = function (href, trigger) {
    if (href === undefined) {
      href = location.href;
    }
    var delim = href.indexOf(';') > -1 ? ';' : '&';
    if (trigger == null) {
      trigger = '-';
    }
    href += delim + 'a=' + trigger;
    // $.get(href);
    $.ajax(href, {
      complete: function complete(xhr, status) {
        var entityID = xhr.getResponseHeader('x-hathitrust-renew');
        if (entityID) {
          HT.renew_auth(entityID, 'logAction');
        }
      }
    });
  };

  $("body").on('click', 'a[data-tracking-category="outLinks"]', function (event) {
    // var trigger = $(this).data('tracking-action');
    // var label = $(this).data('tracking-label');
    // if ( label ) { trigger += ':' + label; }
    var trigger = 'out' + $(this).attr('href');
    HT.analytics.logAction(undefined, trigger);
  });

  console.log("AHOY UPDATING SVG");
  document.querySelectorAll('svg.bi').forEach(function (svg) {
    svg.innerHTML = svg.innerHTML;
  });
});
'use strict';

head.ready(function () {

  var MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  var $emergency_access = $("#access-emergency-access");

  var delta = 5 * 60 * 1000;
  var last_seconds;
  var toggle_renew_link = function toggle_renew_link(date) {
    var now = Date.now();
    if (now >= date.getTime()) {
      var $link = $emergency_access.find("a[disabled]");
      $link.attr("disabled", null);
    }
  };

  var observe_expiration_timestamp = function observe_expiration_timestamp() {
    if (!HT || !HT.params || !HT.params.id) {
      return;
    }
    var data = $.cookie('HTexpiration', undefined, { json: true });
    if (!data) {
      return;
    }
    var seconds = data[HT.params.id];
    // console.log("AHOY OBSERVE", seconds, last_seconds);
    if (seconds == -1) {
      var $link = $emergency_access.find("p a").clone();
      $emergency_access.find("p").text("Your access has expired and cannot be renewed. Reload the page or try again later. Access has been provided through the ");
      $emergency_access.find("p").append($link);
      var $action = $emergency_access.find(".alert--emergency-access--options a");
      $action.attr('href', window.location.href);
      $action.text('Reload');
      return;
    }
    if (seconds > last_seconds) {
      var message = time2message(seconds);
      last_seconds = seconds;
      $emergency_access.find(".expires-display").text(message);
    }
  };

  var time2message = function time2message(seconds) {
    var date = new Date(seconds * 1000);
    var hours = date.getHours();
    var ampm = 'AM';
    if (hours > 12) {
      hours -= 12;ampm = 'PM';
    }
    if (hours == 12) {
      ampm = 'PM';
    }
    var minutes = date.getMinutes();
    if (minutes < 10) {
      minutes = '0' + minutes;
    }
    var message = hours + ':' + minutes + ampm + ' ' + MONTHS[date.getMonth()] + ' ' + date.getDate();
    return message;
  };

  if ($emergency_access.length) {
    var expiration = $emergency_access.data('accessExpires');
    var seconds = parseInt($emergency_access.data('accessExpiresSeconds'), 10);
    var granted = $emergency_access.data('accessGranted');

    var now = Date.now() / 1000;
    var message = time2message(seconds);
    $emergency_access.find(".expires-display").text(message);
    $emergency_access.get(0).dataset.initialized = 'true';

    if (granted) {
      // set up a watch for the expiration time
      last_seconds = seconds;
      setInterval(function () {
        // toggle_renew_link(date);
        observe_expiration_timestamp();
      }, 500);
    }
  }

  if ($('#accessBannerID').length > 0) {
    var suppress = $('html').hasClass('supaccban');
    if (suppress) {
      return;
    }
    var debug = $('html').hasClass('htdev');
    var idhash = $.cookie('access.hathitrust.org', undefined, { json: true });
    var url = $.url(); // parse the current page URL
    var currid = url.param('id');
    if (idhash == null) {
      idhash = {};
    }

    var ids = [];
    for (var id in idhash) {
      if (idhash.hasOwnProperty(id)) {
        ids.push(id);
      }
    }

    if (ids.indexOf(currid) < 0 || debug) {
      var showAlert = function showAlert() {
        var html = $('#accessBannerID').html();
        var $alert = bootbox.dialog(html, [{ label: "OK", "class": "btn btn-primary btn-dismiss" }], { header: 'Special access', role: 'alertdialog' });
      };

      idhash[currid] = 1;
      // session cookie
      $.cookie('access.hathitrust.org', idhash, { json: true, path: '/', domain: '.hathitrust.org' });

      window.setTimeout(showAlert, 3000, true);
    }
  }
});
"use strict";

/*
 * classList.js: Cross-browser full element.classList implementation.
 * 1.2.20171210
 *
 * By Eli Grey, http://eligrey.com
 * License: Dedicated to the public domain.
 *   See https://github.com/eligrey/classList.js/blob/master/LICENSE.md
 */

/*global self, document, DOMException */

/*! @source http://purl.eligrey.com/github/classList.js/blob/master/classList.js */

if ("document" in self) {

	// Full polyfill for browsers with no classList support
	// Including IE < Edge missing SVGElement.classList
	if (!("classList" in document.createElement("_")) || document.createElementNS && !("classList" in document.createElementNS("http://www.w3.org/2000/svg", "g"))) {

		(function (view) {

			"use strict";

			if (!('Element' in view)) return;

			var classListProp = "classList",
			    protoProp = "prototype",
			    elemCtrProto = view.Element[protoProp],
			    objCtr = Object,
			    strTrim = String[protoProp].trim || function () {
				return this.replace(/^\s+|\s+$/g, "");
			},
			    arrIndexOf = Array[protoProp].indexOf || function (item) {
				var i = 0,
				    len = this.length;
				for (; i < len; i++) {
					if (i in this && this[i] === item) {
						return i;
					}
				}
				return -1;
			}
			// Vendors: please allow content code to instantiate DOMExceptions
			,
			    DOMEx = function DOMEx(type, message) {
				this.name = type;
				this.code = DOMException[type];
				this.message = message;
			},
			    checkTokenAndGetIndex = function checkTokenAndGetIndex(classList, token) {
				if (token === "") {
					throw new DOMEx("SYNTAX_ERR", "The token must not be empty.");
				}
				if (/\s/.test(token)) {
					throw new DOMEx("INVALID_CHARACTER_ERR", "The token must not contain space characters.");
				}
				return arrIndexOf.call(classList, token);
			},
			    ClassList = function ClassList(elem) {
				var trimmedClasses = strTrim.call(elem.getAttribute("class") || ""),
				    classes = trimmedClasses ? trimmedClasses.split(/\s+/) : [],
				    i = 0,
				    len = classes.length;
				for (; i < len; i++) {
					this.push(classes[i]);
				}
				this._updateClassName = function () {
					elem.setAttribute("class", this.toString());
				};
			},
			    classListProto = ClassList[protoProp] = [],
			    classListGetter = function classListGetter() {
				return new ClassList(this);
			};
			// Most DOMException implementations don't allow calling DOMException's toString()
			// on non-DOMExceptions. Error's toString() is sufficient here.
			DOMEx[protoProp] = Error[protoProp];
			classListProto.item = function (i) {
				return this[i] || null;
			};
			classListProto.contains = function (token) {
				return ~checkTokenAndGetIndex(this, token + "");
			};
			classListProto.add = function () {
				var tokens = arguments,
				    i = 0,
				    l = tokens.length,
				    token,
				    updated = false;
				do {
					token = tokens[i] + "";
					if (!~checkTokenAndGetIndex(this, token)) {
						this.push(token);
						updated = true;
					}
				} while (++i < l);

				if (updated) {
					this._updateClassName();
				}
			};
			classListProto.remove = function () {
				var tokens = arguments,
				    i = 0,
				    l = tokens.length,
				    token,
				    updated = false,
				    index;
				do {
					token = tokens[i] + "";
					index = checkTokenAndGetIndex(this, token);
					while (~index) {
						this.splice(index, 1);
						updated = true;
						index = checkTokenAndGetIndex(this, token);
					}
				} while (++i < l);

				if (updated) {
					this._updateClassName();
				}
			};
			classListProto.toggle = function (token, force) {
				var result = this.contains(token),
				    method = result ? force !== true && "remove" : force !== false && "add";

				if (method) {
					this[method](token);
				}

				if (force === true || force === false) {
					return force;
				} else {
					return !result;
				}
			};
			classListProto.replace = function (token, replacement_token) {
				var index = checkTokenAndGetIndex(token + "");
				if (~index) {
					this.splice(index, 1, replacement_token);
					this._updateClassName();
				}
			};
			classListProto.toString = function () {
				return this.join(" ");
			};

			if (objCtr.defineProperty) {
				var classListPropDesc = {
					get: classListGetter,
					enumerable: true,
					configurable: true
				};
				try {
					objCtr.defineProperty(elemCtrProto, classListProp, classListPropDesc);
				} catch (ex) {
					// IE 8 doesn't support enumerable:true
					// adding undefined to fight this issue https://github.com/eligrey/classList.js/issues/36
					// modernie IE8-MSW7 machine has IE8 8.0.6001.18702 and is affected
					if (ex.number === undefined || ex.number === -0x7FF5EC54) {
						classListPropDesc.enumerable = false;
						objCtr.defineProperty(elemCtrProto, classListProp, classListPropDesc);
					}
				}
			} else if (objCtr[protoProp].__defineGetter__) {
				elemCtrProto.__defineGetter__(classListProp, classListGetter);
			}
		})(self);
	}

	// There is full or partial native classList support, so just check if we need
	// to normalize the add/remove and toggle APIs.

	(function () {
		"use strict";

		var testElement = document.createElement("_");

		testElement.classList.add("c1", "c2");

		// Polyfill for IE 10/11 and Firefox <26, where classList.add and
		// classList.remove exist but support only one argument at a time.
		if (!testElement.classList.contains("c2")) {
			var createMethod = function createMethod(method) {
				var original = DOMTokenList.prototype[method];

				DOMTokenList.prototype[method] = function (token) {
					var i,
					    len = arguments.length;

					for (i = 0; i < len; i++) {
						token = arguments[i];
						original.call(this, token);
					}
				};
			};
			createMethod('add');
			createMethod('remove');
		}

		testElement.classList.toggle("c3", false);

		// Polyfill for IE 10 and Firefox <24, where classList.toggle does not
		// support the second argument.
		if (testElement.classList.contains("c3")) {
			var _toggle = DOMTokenList.prototype.toggle;

			DOMTokenList.prototype.toggle = function (token, force) {
				if (1 in arguments && !this.contains(token) === !force) {
					return force;
				} else {
					return _toggle.call(this, token);
				}
			};
		}

		// replace() polyfill
		if (!("replace" in document.createElement("_").classList)) {
			DOMTokenList.prototype.replace = function (token, replacement_token) {
				var tokens = this.toString().split(" "),
				    index = tokens.indexOf(token + "");
				if (~index) {
					tokens = tokens.slice(index);
					this.remove.apply(this, tokens);
					this.add(replacement_token);
					this.add.apply(this, tokens.slice(1));
				}
			};
		}

		testElement = null;
	})();
}
'use strict';

head.ready(function () {

    var DEFAULT_COLL_MENU_OPTION = "a";
    var NEW_COLL_MENU_OPTION = '__NEW__'; // "b";

    var IN_YOUR_COLLS_LABEL = 'This item is in your collection(s):';

    var $toolbar = $(".collectionLinks .select-collection");
    var $errormsg = $(".errormsg");
    var $infomsg = $(".infomsg");

    function display_error(msg) {
        if (!$errormsg.length) {
            $errormsg = $('<div class="alert alert-error errormsg" style="margin-top: 0.5rem"></div>').insertAfter($toolbar);
        }
        $errormsg.text(msg).show();
        HT.update_status(msg);
    }

    function display_info(msg) {
        if (!$infomsg.length) {
            $infomsg = $('<div class="alert alert-info infomsg" style="margin-top: 0.5rem"></div>').insertAfter($toolbar);
        }
        $infomsg.text(msg).show();
        HT.update_status(msg);
    }

    function hide_error() {
        $errormsg.hide().text();
    }

    function hide_info() {
        $infomsg.hide().text();
    }

    function get_url() {
        var url = "/cgi/mb";
        if (location.pathname.indexOf("/shcgi/") > -1) {
            url = "/shcgi/mb";
        }
        return url;
    }

    function parse_line(data) {
        var retval = {};
        var tmp = data.split("|");
        for (var i = 0; i < tmp.length; i++) {
            var kv = tmp[i].split("=");
            retval[kv[0]] = kv[1];
        }
        return retval;
    }

    function edit_collection_metadata(args) {

        var options = $.extend({ creating: false, label: "Save Changes" }, args);

        var $block = $('<form class="form-horizontal" action="mb">' + '<div class="control-group">' + '<label class="control-label" for="edit-cn">Collection Name</label>' + '<div class="controls">' + '<input type="text" class="input-large" maxlength="100" name="cn" id="edit-cn" value="" placeholder="Your collection name" required />' + '<span class="label counter" id="edit-cn-count">100</span>' + '</div>' + '</div>' + '<div class="control-group">' + '<label class="control-label" for="edit-desc">Description</label>' + '<div class="controls">' + '<textarea id="edit-desc" name="desc" rows="4" maxlength="255" class="input-large" placeholder="Add your collection description."></textarea>' + '<span class="label counter" id="edit-desc-count">255</span>' + '</div>' + '</div>' + '<div class="control-group">' + '<label class="control-label">Is this collection <strong>Public</strong> or <strong>Private</strong>?</label>' + '<div class="controls">' + '<input type="radio" name="shrd" id="edit-shrd-0" value="0" checked="checked" > ' + '<label class="radio inline" for="edit-shrd-0">' + 'Private ' + '</label>' + '<input type="radio" name="shrd" id="edit-shrd-1" value="1" > ' + '<label class="radio inline" for="edit-shrd-1">' + 'Public ' + '</label>' + '</div>' + '</div>' + '</form>');

        if (options.cn) {
            $block.find("input[name=cn]").val(options.cn);
        }

        if (options.desc) {
            $block.find("textarea[name=desc]").val(options.desc);
        }

        if (options.shrd != null) {
            $block.find("input[name=shrd][value=" + options.shrd + ']').attr("checked", "checked");
        } else if (!HT.login_status.logged_in) {
            $block.find("input[name=shrd][value=0]").attr("checked", "checked");
            $('<div class="alert alert-info"><strong>This collection will be temporary</strong>. Log in to create permanent and public collections.</div>').appendTo($block);
            // remove the <label> that wraps the radio button
            $block.find("input[name=shrd][value=1]").remove();
            $block.find("label[for='edit-shrd-1']").remove();
        }

        if (options.$hidden) {
            options.$hidden.clone().appendTo($block);
        } else {
            $("<input type='hidden' name='c' />").appendTo($block).val(options.c);
            $("<input type='hidden' name='a' />").appendTo($block).val(options.a);
        }

        if (options.iid) {
            $("<input type='hidden' name='iid' />").appendTo($block).val(options.iid);
        }

        var $dialog = bootbox.dialog($block, [{
            "label": "Cancel",
            "class": "btn-dismiss"
        }, {
            "label": options.label,
            "class": "btn btn-primary btn-dismiss",
            callback: function callback() {

                var form = $block.get(0);
                if (!form.checkValidity()) {
                    form.reportValidity();
                    return false;
                }

                var cn = $.trim($block.find("input[name=cn]").val());
                var desc = $.trim($block.find("textarea[name=desc]").val());

                if (!cn) {
                    // $('<div class="alert alert-error">You must enter a collection name.</div>').appendTo($block);
                    return false;
                }

                display_info("Submitting; please wait...");
                submit_post({
                    a: 'additsnc',
                    cn: cn,
                    desc: desc,
                    shrd: $block.find("input[name=shrd]:checked").val()
                });
            }
        }]);

        $dialog.find("input[type=text],textarea").each(function () {
            var $this = $(this);
            var $count = $("#" + $this.attr('id') + "-count");
            var limit = $this.attr("maxlength");

            $count.text(limit - $this.val().length);

            $this.bind('keyup', function () {
                $count.text(limit - $this.val().length);
            });
        });
    }

    function submit_post(params) {
        var data = $.extend({}, { page: 'ajax', id: HT.params.id }, params);
        $.ajax({
            url: get_url(),
            data: data
        }).done(function (data) {
            var params = parse_line(data);
            hide_info();
            if (params.result == 'ADD_ITEM_SUCCESS') {
                // do something
                add_item_to_collist(params);
            } else if (params.result == 'ADD_ITEM_FAILURE') {
                display_error("Item could not be added at this time.");
            } else {
                console.log(data);
            }
        }).fail(function (jqXHR, textStatus, errorThrown) {
            console.log(textStatus, errorThrown);
        });
    }

    function add_item_to_collist(params) {
        var $ul = $(".collection-membership");
        var coll_href = get_url() + "?a=listis;c=" + params.coll_id;
        var $a = $("<a>").attr("href", coll_href).text(params.coll_name);
        $("<li></li>").appendTo($ul).append($a);
        $ul.parents("div").removeClass("hide");

        // $(".collection-membership-summary").text(IN_YOUR_COLLS_LABEL);

        // and then filter out the list from the select
        var $option = $toolbar.find("option[value='" + params.coll_id + "']");
        $option.remove();

        HT.update_status('Added collection ' + params.coll_name + ' to your list.');
    }

    function confirm_large(collSize, addNumItems, callback) {

        if (collSize <= 1000 && collSize + addNumItems > 1000) {
            var numStr;
            if (addNumItems > 1) {
                numStr = "these " + addNumItems + " items";
            } else {
                numStr = "this item";
            }
            var msg = "Note: Your collection contains " + collSize + " items.  Adding " + numStr + " to your collection will increase its size to more than 1000 items.  This means your collection will not be searchable until it is indexed, usually within 48 hours.  After that, just newly added items will see this delay before they can be searched. \n\nDo you want to proceed?";

            confirm(msg, function (answer) {
                if (answer) {
                    callback();
                }
            });
        } else {
            // all other cases are okay
            callback();
        }
    }

    // $("#PTaddItemBtn").click(function(e) {
    $("body").on('click', '#PTaddItemBtn', function (e) {
        e.preventDefault();
        var action = 'addI';

        hide_error();

        var selected_collection_id = $toolbar.find("select").val();
        var selected_collection_name = $toolbar.find("select option:selected").text();

        if (selected_collection_id == DEFAULT_COLL_MENU_OPTION) {
            display_error("You must select a collection.");
            return;
        }

        if (selected_collection_id == NEW_COLL_MENU_OPTION) {
            // deal with new collection
            edit_collection_metadata({
                creating: true,
                c: selected_collection_id,
                id: HT.params.id,
                a: action
            });
            return;
        }

        // var add_num_items = 1;
        // var COLL_SIZE_ARRAY = getCollSizeArray();
        // var coll_size = COLL_SIZE_ARRAY[selected_collection_id];
        // confirm_large(coll_size, add_num_items, function() {
        //     $form.submit();
        // })

        display_info("Adding item to your collection; please wait...");
        submit_post({
            c2: selected_collection_id,
            a: 'addits'
        });
    });
});
"use strict";

head.ready(function () {

    if (!$("html").is(".crms")) {
        return;
    }

    // if ( $(".navbar-static-top").data('loggedin') != 'YES' && window.location.protocol == 'https:' ) {
    //     // horrible hack
    //     var target = window.location.href.replace(/\$/g, '%24');
    //     var href = 'https://' + window.location.hostname + '/Shibboleth.sso/Login?entityID=https://shibboleth.umich.edu/idp/shibboleth&target=' + target;
    //     window.location.href = href;
    //     return;
    // }

    // define CRMS state
    HT.crms_state = 'CRMS-US';

    // force CRMS users to a fixed image size
    HT.force_size = 200;

    var i = window.location.href.indexOf('skin=crmsworld');
    if (i + 1 != 0) {
        HT.crms_state = 'CRMS-World';
    }

    // display bib information
    var $div = $(".bibLinks");
    var $p = $div.find("p:first");
    $p.find("span:empty").each(function () {
        // $(this).text($(this).attr("content")).addClass("blocked");
        var fragment = '<span class="blocked"><strong>{label}:</strong> {content}</span>';
        fragment = fragment.replace('{label}', $(this).attr('property').substr(3)).replace('{content}', $(this).attr("content"));
        $p.append(fragment);
    });

    var $link = $("#embedHtml");
    console.log("AHOY EMBED", $link);
    $link.parent().remove();

    $link = $("a[data-toggle='PT Find in a Library']");
    $link.parent().remove();
});
'use strict';

// downloader

var HT = HT || {};
var photocopier_message = 'The copyright law of the United States (Title 17, U.S. Code) governs the making of reproductions of copyrighted material. Under certain conditions specified in the law, libraries and archives are authorized to furnish a reproduction. One of these specific conditions is that the reproduction is not to be “used for any purpose other than private study, scholarship, or research.” If a user makes a request for, or later uses, a reproduction for purposes in excess of “fair use,” that user may be liable for copyright infringement.';

HT.Downloader = {

    init: function init(options) {
        this.options = $.extend({}, this.options, options);
        this.id = this.options.params.id;
        this.pdf = {};
        return this;
    },

    options: {},

    start: function start() {
        var self = this;
        this.bindEvents();
    },

    bindEvents: function bindEvents() {
        var self = this;
    },

    explainPdfAccess: function explainPdfAccess(link) {
        var html = $("#noDownloadAccess").html();
        html = html.replace('{DOWNLOAD_LINK}', $(this).attr("href"));
        this.$dialog = bootbox.alert(html);
    },

    downloadPdf: function downloadPdf(config) {
        var self = this;

        self.src = config.src;
        self.item_title = config.item_title;
        self.$config = config;

        var html = '<div class="initial"><p>Setting up the download...</div>' + '<div class="offscreen" role="status" aria-atomic="true" aria-live="polite"></div>' + '<div class="progress progress-striped active hide" aria-hidden="true">' + '<div class="bar" width="0%"></div>' + '</div>' + '<div><p><a href="https://www.hathitrust.org/help_digital_library#DownloadTime" target="_blank">What affects the download speed?</a></p></div>';

        var header = 'Building your ' + self.item_title;
        var total = self.$config.selection.pages.length;
        if (total > 0) {
            var suffix = total == 1 ? 'page' : 'pages';
            header += ' (' + total + ' ' + suffix + ')';
        }

        self.$dialog = bootbox.dialog(html, [{
            label: 'Cancel',
            'class': 'btn-x-dismiss btn',
            callback: function callback() {
                if (self.$dialog.data('deactivated')) {
                    self.$dialog.closeModal();
                    return;
                }
                $.ajax({
                    url: self.src + ';callback=HT.downloader.cancelDownload;stop=1',
                    dataType: 'script',
                    cache: false,
                    error: function error(req, textStatus, errorThrown) {
                        console.log("DOWNLOAD CANCELLED ERROR");
                        // self.$dialog.closeModal();
                        console.log(req, textStatus, errorThrown);
                        if (req.status == 503) {
                            self.displayWarning(req);
                        } else {
                            self.displayError();
                        }
                    }
                });
            }
        }], {
            header: header,
            id: 'download'
        });
        self.$status = self.$dialog.find("div[role=status]");

        self.requestDownload();
    },

    requestDownload: function requestDownload() {
        var self = this;
        var data = {};

        if (self.$config.selection.pages.length > 0) {
            data['seq'] = self.$config.selection.seq;
        }

        switch (self.$config.downloadFormat) {
            case 'image':
                data['format'] = 'image/jpeg';
                data['target_ppi'] = 300;
                data['bundle_format'] = 'zip';
                break;
            case 'plaintext-zip':
                data['bundle_format'] = 'zip';
                break;
            case 'plaintext':
                data['bundle_format'] = 'text';
                break;
        }

        $.ajax({
            url: self.src.replace(/;/g, '&') + '&callback=HT.downloader.startDownloadMonitor',
            dataType: 'script',
            cache: false,
            data: data,
            error: function error(req, textStatus, errorThrown) {
                console.log("DOWNLOAD STARTUP NOT DETECTED");
                if (self.$dialog) {
                    self.$dialog.closeModal();
                }
                if (req.status == 429) {
                    self.displayWarning(req);
                } else {
                    self.displayError(req);
                }
            }
        });
    },

    cancelDownload: function cancelDownload(progress_url, download_url, total) {
        var self = this;
        self.clearTimer();
        self.$dialog.closeModal();
    },

    startDownloadMonitor: function startDownloadMonitor(progress_url, download_url, total) {
        var self = this;

        if (self.timer) {
            console.log("ALREADY POLLING");
            return;
        }

        self.pdf.progress_url = progress_url;
        self.pdf.download_url = download_url;
        self.pdf.total = total;

        self.is_running = true;
        self.num_processed = 0;
        self.i = 0;

        self.timer = setInterval(function () {
            self.checkStatus();
        }, 2500);
        // do it once the first time
        self.checkStatus();
    },

    checkStatus: function checkStatus() {
        var self = this;
        self.i += 1;
        $.ajax({
            url: self.pdf.progress_url,
            data: { ts: new Date().getTime() },
            cache: false,
            dataType: 'json',
            success: function success(data) {
                var status = self.updateProgress(data);
                self.num_processed += 1;
                if (status.done) {
                    self.clearTimer();
                } else if (status.error && status.num_attempts > 100) {
                    self.$dialog.closeModal();
                    self.displayProcessError();
                    self.clearTimer();
                    self.logError();
                } else if (status.error) {
                    self.$dialog.closeModal();
                    self.displayError();
                    self.clearTimer();
                }
            },
            error: function error(req, textStatus, errorThrown) {
                console.log("FAILED: ", req, "/", textStatus, "/", errorThrown);
                self.$dialog.closeModal();
                self.clearTimer();
                if (req.status == 404 && (self.i > 25 || self.num_processed > 0)) {
                    self.displayError();
                }
            }
        });
    },

    updateProgress: function updateProgress(data) {
        var self = this;
        var status = { done: false, error: false };
        var percent;

        var current = data.status;
        if (current == 'EOT' || current == 'DONE') {
            status.done = true;
            percent = 100;
        } else {
            current = data.current_page;
            percent = 100 * (current / self.pdf.total);
        }

        if (self.last_percent != percent) {
            self.last_percent = percent;
            self.num_attempts = 0;
        } else {
            self.num_attempts += 1;
        }

        // try 100 times, which amounts to ~100 seconds
        if (self.num_attempts > 100) {
            status.error = true;
        }

        if (self.$dialog.find(".initial").is(":visible")) {
            self.$dialog.find(".initial").html('<p>Please wait while we build your ' + self.item_title + '.</p>');
            self.$dialog.find(".progress").removeClass("hide");
            self.updateStatusText('Please wait while we build your ' + self.item_title + '.');
        }

        self.$dialog.find(".bar").css({ width: percent + '%' });

        if (percent == 100) {
            self.$dialog.find(".progress").hide();
            var download_key = navigator.userAgent.indexOf('Mac OS X') != -1 ? 'RETURN' : 'ENTER';
            self.$dialog.find(".initial").html('<p>All done! Your ' + self.item_title + ' is ready for download. <span class="offscreen">Select ' + download_key + ' to download.</span></p>');
            self.updateStatusText('All done! Your ' + self.item_title + ' is ready for download. Select ' + download_key + ' to download.');

            // self.$dialog.find(".done").show();
            var $download_btn = self.$dialog.find('.download-pdf');
            if (!$download_btn.length) {
                $download_btn = $('<a class="download-pdf btn btn-primary" download="download">Download {ITEM_TITLE}</a>'.replace('{ITEM_TITLE}', self.item_title)).attr('href', self.pdf.download_url);
                if ($download_btn.get(0).download == undefined) {
                    $download_btn.attr('target', '_blank');
                }
                $download_btn.appendTo(self.$dialog.find(".modal__footer")).on('click', function (e) {
                    // self.$link.trigger("click.google");

                    HT.analytics.trackEvent({
                        label: '-',
                        category: 'PT',
                        action: 'PT Download - ' + self.$config.downloadFormat.toUpperCase() + ' - ' + self.$config.trackingAction
                    });

                    setTimeout(function () {
                        self.$dialog.closeModal();
                        $download_btn.remove();
                        // HT.reader.controls.selectinator._clearSelection();
                        // HT.reader.emit('downloadDone');
                    }, 1500);
                    e.stopPropagation();
                });
                $download_btn.focus();
            }
            self.$dialog.data('deactivated', true);
            // self.updateStatusText(`Your ${self.item_title} is ready for download. Press return to download.`);
            // still could cancel
        } else {
            self.$dialog.find(".initial").text('Please wait while we build your ' + self.item_title + ' (' + Math.ceil(percent) + '% completed).');
            self.updateStatusText(Math.ceil(percent) + '% completed');
        }

        return status;
    },

    clearTimer: function clearTimer() {
        var self = this;
        if (self.timer) {
            clearInterval(self.timer);
            self.timer = null;
        }
    },

    displayWarning: function displayWarning(req) {
        var self = this;
        var timeout = parseInt(req.getResponseHeader('X-Choke-UntilEpoch'));
        var rate = req.getResponseHeader('X-Choke-Rate');

        if (timeout <= 5) {
            // just punt and wait it out
            setTimeout(function () {
                self.requestDownload();
            }, 5000);
            return;
        }

        timeout *= 1000;
        var now = new Date().getTime();
        var countdown = Math.ceil((timeout - now) / 1000);

        var html = ('<div>' + '<p>You have exceeded the download rate of {rate}. You may proceed in <span id="throttle-timeout">{countdown}</span> seconds.</p>' + '<p>Download limits protect HathiTrust resources from abuse and help ensure a consistent experience for everyone.</p>' + '</div>').replace('{rate}', rate).replace('{countdown}', countdown);

        self.$dialog = bootbox.dialog(html, [{
            label: 'OK',
            'class': 'btn-dismiss btn-primary',
            callback: function callback() {
                clearInterval(self.countdown_timer);
                return true;
            }
        }]);

        self.countdown_timer = setInterval(function () {
            countdown -= 1;
            self.$dialog.find("#throttle-timeout").text(countdown);
            if (countdown == 0) {
                clearInterval(self.countdown_timer);
            }
            console.log("TIC TOC", countdown);
        }, 1000);
    },

    displayProcessError: function displayProcessError(req) {
        var html = '<p>' + 'Unfortunately, the process for creating your PDF has been interrupted. ' + 'Please click "OK" and try again.' + '</p>' + '<p>' + 'If this problem persists and you are unable to download this PDF after repeated attempts, ' + 'please notify us at <a href="/cgi/feedback/?page=form" data=m="pt" data-toggle="feedback tracking-action" data-tracking-action="Show Feedback">feedback@issues.hathitrust.org</a> ' + 'and include the URL of the book you were trying to access when the problem occurred.' + '</p>';

        // bootbox.alert(html);
        bootbox.dialog(html, [{
            label: 'OK',
            'class': 'btn-dismiss btn-inverse'
        }], { classes: 'error' });

        console.log(req);
    },

    displayError: function displayError(req) {
        var html = '<p>' + 'There was a problem building your ' + this.item_title + '; staff have been notified.' + '</p>' + '<p>' + 'Please try again in 24 hours.' + '</p>';

        // bootbox.alert(html);
        bootbox.dialog(html, [{
            label: 'OK',
            'class': 'btn-dismiss btn-inverse'
        }], { classes: 'error' });

        console.log(req);
    },

    logError: function logError() {
        var self = this;
        $.get(self.src + ';num_attempts=' + self.num_attempts);
    },

    updateStatusText: function updateStatusText(message) {
        var self = this;
        if (self._lastMessage != message) {
            if (self._lastTimer) {
                clearTimeout(self._lastTimer);self._lastTimer = null;
            }

            setTimeout(function () {
                self.$status.text(message);
                self._lastMessage = message;
                console.log("-- status:", message);
            }, 50);
            self._lastTimer = setTimeout(function () {
                self.$status.get(0).innerText = '';
            }, 500);
        }
    },

    EOT: true

};

var downloadForm;
var downloadFormatOptions;
var rangeOptions;
var downloadIdx = 0;

head.ready(function () {
    HT.downloader = Object.create(HT.Downloader).init({
        params: HT.params
    });

    HT.downloader.start();

    // non-jquery?
    downloadForm = document.querySelector('#form-download-module');
    downloadFormatOptions = Array.prototype.slice.call(downloadForm.querySelectorAll('input[name="download_format"]'));
    rangeOptions = Array.prototype.slice.call(downloadForm.querySelectorAll('[data-download-format-target]'));

    var downloadSubmit = downloadForm.querySelector('[type="submit"]');

    var hasFullPdfAccess = downloadForm.dataset.fullPdfAccess == 'allow';

    var updateDownloadFormatRangeOptions = function updateDownloadFormatRangeOptions(option) {
        rangeOptions.forEach(function (rangeOption) {
            var input = rangeOption.querySelector('input');
            input.disabled = !rangeOption.matches('[data-download-format-target~="' + option.value + '"]');
        });

        // if ( ! hasFullPdfAccess ) {
        //   var checked = downloadForm.querySelector(`[data-download-format-target][data-view-target~="${HT.reader.view.name}"] input:checked`);
        //   if ( ! checked ) {
        //       // check the first one
        //       var input = downloadForm.querySelector(`[data-download-format-target][data-view-target~="${HT.reader.view.name}"] input`);
        //       input.checked = true;
        //   }
        // }

        var checked = downloadForm.querySelector('[data-download-format-target][data-view-target~="' + HT.reader.view.name + '"] input:checked');
        if (!checked) {
            // check the first one
            var input = downloadForm.querySelector('[data-download-format-target][data-view-target~="' + HT.reader.view.name + '"] input');
            input.checked = true;
        }
    };
    downloadFormatOptions.forEach(function (option) {
        option.addEventListener('change', function (event) {
            updateDownloadFormatRangeOptions(this);
        });
    });

    rangeOptions.forEach(function (div) {
        var input = div.querySelector('input');
        input.addEventListener('change', function (event) {
            downloadFormatOptions.forEach(function (formatOption) {
                formatOption.disabled = !(div.dataset.downloadFormatTarget.indexOf(formatOption.value) > -1);
            });
        });
    });

    HT.downloader.updateDownloadFormatRangeOptions = function () {
        var formatOption = downloadFormatOptions.find(function (input) {
            return input.checked;
        });
        updateDownloadFormatRangeOptions(formatOption);
    };

    // default to PDF
    var pdfFormatOption = downloadFormatOptions.find(function (input) {
        return input.value == 'pdf';
    });
    pdfFormatOption.checked = true;
    updateDownloadFormatRangeOptions(pdfFormatOption);

    var tunnelForm = document.querySelector('#tunnel-download-module');

    downloadForm.addEventListener('submit', function (event) {
        var formatOption = downloadForm.querySelector('input[name="download_format"]:checked');
        var rangeOption = downloadForm.querySelector('input[name="range"]:checked:not(:disabled)');

        var printable;

        event.preventDefault();
        event.stopPropagation();

        if (!rangeOption) {
            // no valid range option was chosen
            alert("Please choose a valid range for this download format.");
            event.preventDefault();
            return false;
        }

        var action = tunnelForm.dataset.actionTemplate + (formatOption.value == 'plaintext-zip' ? 'plaintext' : formatOption.value);

        var selection = { pages: [] };
        if (rangeOption.value == 'selected-pages') {
            selection.pages = HT.reader.controls.selectinator._getPageSelection();
            selection.isSelection = true;
            if (selection.pages.length == 0) {
                var buttons = [];

                var msg = ["<p>You haven't selected any pages to download.</p>"];
                if (HT.reader.view.name == '2up') {
                    msg.push("<p>To select pages, click in the upper left or right corner of the page.");
                    msg.push("<p class=\"centered\"><img src=\"/pt/web/graphics/view-flip.gif\" /></p>");
                } else {
                    msg.push("<p>To select pages, click in the upper right corner of the page.");
                    if (HT.reader.view.name == 'thumb') {
                        msg.push("<p class=\"centered\"><img src=\"/pt/web/graphics/view-thumb.gif\" /></p>");
                    } else {
                        msg.push("<p class=\"centered\"><img src=\"/pt/web/graphics/view-scroll.gif\" /></p>");
                    }
                }
                msg.push("<p><tt>shift + click</tt> to de/select the pages between this page and a previously selected page.");
                msg.push("<p>Pages you select will be listed in the download module.");

                msg = msg.join("\n");

                buttons.push({
                    label: "OK",
                    'class': 'btn-dismiss'
                });
                bootbox.dialog(msg, buttons);

                event.preventDefault();
                return false;
            }
        } else if (rangeOption.value.indexOf('current-page') > -1) {
            var page;
            switch (rangeOption.value) {
                case 'current-page':
                    page = [HT.reader.view.currentLocation()];
                    break;
                case 'current-page-verso':
                    page = [HT.reader.view.currentLocation('VERSO')];
                    break;
                case 'current-page-recto':
                    page = [HT.reader.view.currentLocation('RECTO')];
                    break;
            }
            if (!page) {
                // probably impossible?
            }
            selection.pages = [page];
        }

        if (selection.pages.length > 0) {
            selection.seq = HT.reader.controls.selectinator ? HT.reader.controls.selectinator._getFlattenedSelection(selection.pages) : selection.pages;
        }

        if (rangeOption.dataset.isPartial == 'true' && selection.pages.length <= 10) {

            // delete any existing inputs
            tunnelForm.querySelectorAll('input:not([data-fixed])').forEach(function (input) {
                tunnelForm.removeChild(input);
            });

            if (formatOption.value == 'image') {
                var size_attr = "target_ppi";
                var image_format_attr = 'format';
                var size_value = "300";
                if (selection.pages.length == 1) {
                    // slight difference
                    action = '/cgi/imgsrv/image';
                    size_attr = "size";
                    size_value = "ppi:300";
                }

                var input = document.createElement('input');
                input.setAttribute("type", "hidden");
                input.setAttribute("name", size_attr);
                input.setAttribute("value", size_value);
                tunnelForm.appendChild(input);

                var input = document.createElement('input');
                input.setAttribute("type", "hidden");
                input.setAttribute("name", image_format_attr);
                input.setAttribute("value", 'image/jpeg');
                tunnelForm.appendChild(input);
            } else if (formatOption.value == 'plaintext-zip') {
                var input = document.createElement('input');
                input.setAttribute("type", "hidden");
                input.setAttribute("name", 'bundle_format');
                input.setAttribute("value", "zip");
                tunnelForm.appendChild(input);
            }

            selection.seq.forEach(function (range) {
                var input = document.createElement('input');
                input.setAttribute("type", "hidden");
                input.setAttribute("name", "seq");
                input.setAttribute("value", range);
                tunnelForm.appendChild(input);
            });

            tunnelForm.action = action;
            // HT.disableUnloadTimeout = true;

            // remove old iframes
            document.querySelectorAll('iframe.download-module').forEach(function (iframe) {
                document.body.removeChild(iframe);
            });

            downloadIdx += 1;
            var tracker = 'D' + downloadIdx + ':';
            var tracker_input = document.createElement('input');
            tracker_input.setAttribute('type', 'hidden');
            tracker_input.setAttribute('name', 'tracker');
            tracker_input.setAttribute('value', tracker);
            tunnelForm.appendChild(tracker_input);
            var iframe = document.createElement('iframe');
            iframe.setAttribute('name', 'download-module-' + downloadIdx);
            iframe.setAttribute('aria-hidden', 'true');
            iframe.setAttribute('class', 'download-module');
            iframe.style.opacity = 0;
            document.body.appendChild(iframe);
            tunnelForm.setAttribute('target', iframe.getAttribute('name'));

            downloadSubmit.disabled = true;
            downloadSubmit.classList.add('btn-loading');

            var trackerInterval = setInterval(function () {
                var value = $.cookie('tracker') || '';
                if (HT.is_dev) {
                    console.log("--?", tracker, value);
                }
                if (value.indexOf(tracker) > -1) {
                    $.removeCookie('tracker', { path: '/' });
                    clearInterval(trackerInterval);
                    downloadSubmit.classList.remove('btn-loading');
                    downloadSubmit.disabled = false;
                    HT.disableUnloadTimeout = false;
                }
            }, 100);

            tunnelForm.submit();

            return false;
        }

        var _format_titles = {};
        _format_titles.pdf = 'PDF';
        _format_titles.epub = 'EPUB';
        _format_titles.plaintext = 'Text (.txt)';
        _format_titles['plaintext-zip'] = 'Text (.zip)';
        _format_titles.image = 'Image (JPEG)';

        // invoke the downloader
        HT.downloader.downloadPdf({
            src: action + '?id=' + HT.params.id,
            item_title: _format_titles[formatOption.value],
            selection: selection,
            downloadFormat: formatOption.value,
            trackingAction: rangeOption.value
        });

        return false;
    });
});
"use strict";

// supply method for creating an embeddable URL
head.ready(function () {

    var side_short = "450";
    var side_long = "700";
    var htId = HT.params.id;
    var embedHelpLink = "https://www.hathitrust.org/embed";

    var codeblock_txt;
    var codeblock_txt_a = function codeblock_txt_a(w, h) {
        return '<iframe width="' + w + '" height="' + h + '" ';
    };
    var codeblock_txt_b = 'src="https://hdl.handle.net/2027/' + htId + '?urlappend=%3Bui=embed"></iframe>';

    var $block = $('<div class="embedUrlContainer">' + '<h3>Embed This Book ' + '<a id="embedHelpIcon" default-form="data-default-form" ' + 'href="' + embedHelpLink + '" target="_blank"><i class="icomoon icomoon-help" aria-hidden="true"></i><span class="offscreen">Help: Embedding HathiTrust Books</span></a></h3>' + '<form>' + '    <span class="help-block">Copy the code below and paste it into the HTML of any website or blog.</span>' + '    <label for="codeblock" class="offscreen">Code Block</label>' + '    <textarea class="input-xlarge" id="codeblock" name="codeblock" rows="3">' + codeblock_txt_a(side_short, side_long) + codeblock_txt_b + '</textarea>' + '<div class="controls">' + '<input type="radio" name="view" id="view-scroll" value="0" checked="checked" >' + '<label class="radio inline" for="view-scroll">' + '<span class="icomoon icomoon-scroll"/> Scroll View ' + '</label>' + '<input type="radio" name="view" id="view-flip" value="1" >' + '<label class="radio inline" for="view-flip">' + '<span class="icomoon icomoon-book-alt2"/> Flip View ' + '</label>' + '</div>' + '</form>' + '</div>');

    // $("#embedHtml").click(function(e) {
    $("body").on('click', '#embedHtml', function (e) {
        e.preventDefault();
        bootbox.dialog($block, [{
            "label": "Cancel",
            "class": "btn-dismiss"
        }]);

        // Custom width for bounding '.modal' 
        $block.closest('.modal').addClass("bootboxMediumWidth");

        // Select entirety of codeblock for easy copying
        var textarea = $block.find("textarea[name=codeblock]");
        textarea.on("click", function () {
            $(this).select();
        });

        // Modify codeblock to one of two views 
        $('input:radio[id="view-scroll"]').click(function () {
            codeblock_txt = codeblock_txt_a(side_short, side_long) + codeblock_txt_b;
            textarea.val(codeblock_txt);
        });
        $('input:radio[id="view-flip"]').click(function () {
            codeblock_txt = codeblock_txt_a(side_long, side_short) + codeblock_txt_b;
            textarea.val(codeblock_txt);
        });
    });
});
'use strict';

// supply method for feedback system
var HT = HT || {};
HT.feedback = {};
HT.feedback.dialog = function () {
    var html = '<form>' + '    <fieldset>' + '        <legend>Email Address</legend>' + '        <label for="email" class="offscreen">EMail Address</label>' + '        <input type="text" class="input-xlarge" placeholder="[Your email address]" name="email" id="email" />' + '        <span class="help-block">We will make every effort to address copyright issues by the next business day after notification.</span>' + '    </fieldset>' + '    <fieldset>' + '        <legend>Overall page readability and quality</legend>' + '        <div class="alert alert-help">Select one option that applies</div>' + '        <div class="control">' + '            <input type="radio" name="Quality" id="pt-feedback-quality-1" value="readable" />' + '            <label class="radio" for="pt-feedback-quality-1" >' + '                Few problems, entire page is readable' + '            </label>' + '        </div>' + '        <div class="control">' + '            <input type="radio" name="Quality" id="pt-feedback-quality-2" value="someproblems" />' + '            <label class="radio" for="pt-feedback-quality-2">' + '                Some problems, but still readable' + '            </label>' + '        </div>' + '        <div class="control">' + '            <input type="radio" name="Quality" value="difficult" id="pt-feedback-quality-3" />' + '            <label class="radio" for="pt-feedback-quality-3">' + '                Significant problems, difficult or impossible to read' + '            </label>' + '        </div>' + '        <div class="control">' + '            <input type="radio" name="Quality" value="none" checked="checked" id="pt-feedback-quality-4" />' + '            <label class="radio" for="pt-feedback-quality-4">' + '                (No problems)' + '            </label>' + '        </div>' + '    </fieldset>' + '    <fieldset>' + '        <legend>Specific page image problems?</legend>' + '        <div class="alert alert-help">Select any that apply</div>' + '        <div class="control">' + '            <input type="checkbox" name="blurry" value="1" id="pt-feedback-problems-1" />' + '            <label for="pt-feedback-problems-1">' + '                Missing parts of the page' + '            </label>' + '        </div>' + '        <div class="control">' + '            <input type="checkbox" name="blurry" value="1" id="pt-feedback-problems-2"  />' + '            <label for="pt-feedback-problems-2">' + '                Blurry text' + '            </label>' + '        </div>' + '        <div class="control">' + '            <input type="checkbox" name="curved" value="1" id="pt-feedback-problems-3"  />' + '            <label for="pt-feedback-problems-3">' + '                Curved or distorted text' + '            </label>' + '        </div>' + '        <div class="control">' + '            <label for="pt-feedback-problems-other">Other problem </label><input type="text" class="input-medium" name="other" value="" id="pt-feedback-problems-other"  />' + '        </div>' + '    </fieldset>' + '    <fieldset>' + '        <legend>Problems with access rights?</legend>' + '        <span class="help-block" style="margin-bottom: 1rem;"><strong>' + '            (See also: <a href="http://www.hathitrust.org/take_down_policy" target="_blank">take-down policy</a>)' + '        </strong></span>' + '        <div class="alert alert-help">Select one option that applies</div>' + '        <div class="control">' + '            <input type="radio" name="Rights" value="noaccess" id="pt-feedback-access-1" />' + '            <label for="pt-feedback-access-1">' + '                This item is in the public domain, but I don\'t have access to it.' + '            </label>' + '        </div>' + '        <div class="control">' + '            <input type="radio" name="Rights" value="access" id="pt-feedback-access-2" />' + '            <label for="pt-feedback-access-2">' + '                    I have access to this item, but should not.' + '            </label>' + '        </div>' + '        <div class="control">' + '            <input type="radio" name="Rights" value="none" checked="checked" id="pt-feedback-access-3" />' + '            <label for="pt-feedback-access-3">' + '                (No problems)' + '            </label>' + '        </div>' + '    </fieldset>' + '    <fieldset>' + '        <legend>Other problems or comments?</legend>' + '        <p>' + '            <label class="offscreen" for="comments">Other problems or comments?</label>' + '            <textarea id="comments" name="comments" rows="3"></textarea>' + '        </p>' + '    </fieldset>' + '</form>';

    var $form = $(html);

    // hidden fields
    $("<input type='hidden' name='SysID' />").val(HT.params.id).appendTo($form);
    $("<input type='hidden' name='RecordURL' />").val(HT.params.RecordURL).appendTo($form);

    if (HT.crms_state) {
        $("<input type='hidden' name='CRMS' />").val(HT.crms_state).appendTo($form);
        var $email = $form.find("#email");
        $email.val(HT.crms_state);
        $email.hide();
        $("<span>" + HT.crms_state + "</span><br />").insertAfter($email);
        $form.find(".help-block").hide();
    }

    if (HT.reader) {
        $("<input type='hidden' name='SeqNo' />").val(HT.params.seq).appendTo($form);
    } else if (HT.params.seq) {
        $("<input type='hidden' name='SeqNo' />").val(HT.params.seq).appendTo($form);
    }
    $("<input type='hidden' name='view' />").val(HT.params.view).appendTo($form);

    // if ( HT.crms_state ) {
    //     $form.find("#email").val(HT.crms_state);
    // }


    return $form;
};
"use strict";

head.ready(function () {

    return;

    var inited = false;

    var $form = $("#search-modal form");

    var $input = $form.find("input.search-input-text");
    var $input_label = $form.find("label[for='q1-input']");
    var $select = $form.find(".control-searchtype");
    var $search_target = $form.find(".search-target");
    var $ft = $form.find("span.funky-full-view");

    var $backdrop = null;

    var $action = $("#action-search-hathitrust");
    $action.on('click', function () {
        bootbox.show('search-modal', {
            onShow: function onShow(modal) {
                $input.focus();
            }
        });
    });

    var _setup = {};
    _setup.ls = function () {
        $select.hide();
        $input.attr('placeholder', 'Search words about or within the items');
        $input_label.text('Search full-text index');
        if (inited) {
            HT.update_status("Search will use the full-text index.");
        }
    };

    _setup.catalog = function () {
        $select.show();
        $input.attr('placeholder', 'Search words about the items');
        $input_label.text('Search catalog index');
        if (inited) {
            HT.update_status("Search will use the catalog index; you can limit your search to a selection of fields.");
        }
    };

    var target = $search_target.find("input:checked").val();
    _setup[target]();
    inited = true;

    var prefs = HT.prefs.get();
    if (prefs.search && prefs.search.ft) {
        $("input[name=ft]").attr('checked', 'checked');
    }

    $search_target.on('change', 'input[type="radio"]', function (e) {
        var target = this.value;
        _setup[target]();
        HT.analytics.trackEvent({ label: "-", category: "HT Search", action: target });
    });

    // $form.delegate(':input', 'focus change', function(e) {
    //     console.log("FOCUSING", this);
    //     $form.addClass("focused");
    //     if ( $backdrop == null ) {
    //         $backdrop = $('<div class="modal__overlay invisible"></div>');
    //         $backdrop.on('click', function() {
    //             close_search_form();
    //         });
    //     }
    //     $backdrop.appendTo($("body")).show();
    // })

    // $("body").on('focus', ':input,a', function(e) {
    //     var $this = $(this);
    //     if ( ! $this.closest(".nav-search-form").length ) {
    //         close_search_form();
    //     }
    // });

    // var close_search_form = function() {
    //     $form.removeClass("focused");
    //     if ( $backdrop != null ) {
    //         $backdrop.detach();
    //         $backdrop.hide();
    //     }
    // }

    // add event handler for submit to check for empty query or asterisk
    $form.submit(function (event) {

        if (!this.checkValidity()) {
            this.reportValidity();
            return false;
        }

        //check for blank or single asterisk
        var $input = $(this).find("input[name=q1]");
        var query = $input.val();
        query = $.trim(query);
        if (query === '') {
            alert("Please enter a search term.");
            $input.trigger('blur');
            return false;
        }
        // // *  Bill says go ahead and forward a query with an asterisk   ######
        // else if (query === '*')
        // {
        //   // change q1 to blank
        //   $("#q1-input").val("")
        //   $(".search-form").submit();
        // }
        // ##################################################################*
        else {

                // save last settings
                var searchtype = target == 'ls' ? 'all' : $select.find("select").val();
                HT.prefs.set({ search: { ft: $("input[name=ft]:checked").length > 0, target: target, searchtype: searchtype } });

                return true;
            }
    });
});
"use strict";

var HT = HT || {};
head.ready(function () {

  HT.analytics.getContentGroupData = function () {
    // cheat
    var suffix = '';
    var content_group = 4;
    if ($("#section").data("view") == 'restricted') {
      content_group = 2;
      suffix = '#restricted';
    } else if (window.location.href.indexOf("debug=super") > -1) {
      content_group = 3;
      suffix = '#super';
    }
    return { index: content_group, value: HT.params.id + suffix };
  };

  HT.analytics._simplifyPageHref = function (href) {
    var url = $.url(href);
    var new_href = url.segment();
    new_href.push($("html").data('content-provider'));
    new_href.push(url.param("id"));
    var qs = '';
    if (new_href.indexOf("search") > -1 && url.param('q1')) {
      qs = '?q1=' + url.param('q1');
    }
    new_href = "/" + new_href.join("/") + qs;
    return new_href;
  };

  HT.analytics.getPageHref = function () {
    return HT.analytics._simplifyPageHref();
  };
});
"use strict";

head.ready(function () {
  var $menu;var $trigger;var $header;var $navigator;
  HT = HT || {};

  HT.mobify = function () {

    // if ( $("html").is(".desktop") ) {
    //   $("html").addClass("mobile").removeClass("desktop").removeClass("no-mobile");
    // }

    $header = $("header");
    $navigator = $(".app--reader--navigator");
    if ($navigator.length) {
      document.body.dataset.expanded = true;
      // $navigator.get(0).style.setProperty('--height', `-${$navigator.outerHeight() * 0.90}px`);
      // $navigator.get(0).dataset.originalHeight = `{$navigator.outerHeight()}px`;
      // document.documentElement.style.setProperty('--navigator-height', `${$navigator.outerHeight()}px`);
      // var $expando = $navigator.find(".action-expando");
      var $expando = $("#action-expando");
      $expando.on('click', function () {
        document.body.dataset.expanded = !(document.body.dataset.expanded == 'true');
        this.setAttribute('aria-expanded', document.body.dataset.expanded == 'true');
        // var navigatorHeight = 0;
        // if ( document.documentElement.dataset.expanded == 'true' ) {
        //   navigatorHeight = $navigator.get(0).dataset.originalHeight;
        // }
        // document.documentElement.style.setProperty('--navigator-height', navigatorHeight);
      });

      if (HT.params.ui == 'embed') {
        setTimeout(function () {
          $expando.trigger('click');
        }, 1000);
      }
    }

    HT.$menu = $menu;

    var $sidebar = $("#sidebar");

    $trigger = $sidebar.find("button[aria-expanded]");

    $("#action-mobile-toggle-fullscreen").on('click', function () {
      document.documentElement.requestFullScreen();
    });

    HT.utils = HT.utils || {};

    // $sidebar.on('click', function(event) {
    $("body").on('click', '.sidebar-container', function (event) {
      // hide the sidebar
      var $this = $(event.target);
      if ($this.is("input[type='text'],select")) {
        return;
      }
      if ($this.parents(".form-search-volume").length) {
        return;
      }
      if ($this.is("button,a")) {
        HT.toggle(false);
      }
    });

    if (HT && HT.utils && HT.utils.handleOrientationChange) {
      HT.utils.handleOrientationChange();
    }
    document.documentElement.dataset.expanded = 'true';
  };

  HT.toggle = function (state) {

    // $trigger.attr('aria-expanded', state);
    $(".sidebar-container").find("button[aria-expanded]").attr('aria-expanded', state);
    $("html").get(0).dataset.sidebarExpanded = state;
    $("html").get(0).dataset.view = state ? 'options' : 'viewer';

    // var xlink_href;
    // if ( $trigger.attr('aria-expanded') == 'true' ) {
    //   xlink_href = '#panel-expanded';
    // } else {
    //   xlink_href = '#panel-collapsed';
    // }
    // $trigger.find("svg use").attr("xlink:href", xlink_href);
  };

  setTimeout(HT.mobify, 1000);

  var updateToolbarTopProperty = function updateToolbarTopProperty() {
    var h = $("#sidebar .sidebar-toggle-button").outerHeight() || 40;
    var top = ($("header").height() + h) * 1.05;
    document.documentElement.style.setProperty('--toolbar-horizontal-top', top + 'px');
  };
  $(window).on('resize', updateToolbarTopProperty);
  updateToolbarTopProperty();

  $("html").get(0).setAttribute('data-sidebar-expanded', false);
});
'use strict';

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

if (typeof Object.assign != 'function') {
  // Must be writable: true, enumerable: false, configurable: true
  Object.defineProperty(Object, "assign", {
    value: function assign(target, varArgs) {
      // .length of function is 2
      'use strict';

      if (target == null) {
        // TypeError if undefined or null
        throw new TypeError('Cannot convert undefined or null to object');
      }

      var to = Object(target);

      for (var index = 1; index < arguments.length; index++) {
        var nextSource = arguments[index];

        if (nextSource != null) {
          // Skip over if undefined or null
          for (var nextKey in nextSource) {
            // Avoid bugs when hasOwnProperty is shadowed
            if (Object.prototype.hasOwnProperty.call(nextSource, nextKey)) {
              to[nextKey] = nextSource[nextKey];
            }
          }
        }
      }
      return to;
    },
    writable: true,
    configurable: true
  });
}

// from: https://github.com/jserz/js_piece/blob/master/DOM/ChildNode/after()/after().md
(function (arr) {
  arr.forEach(function (item) {
    if (item.hasOwnProperty('after')) {
      return;
    }
    Object.defineProperty(item, 'after', {
      configurable: true,
      enumerable: true,
      writable: true,
      value: function after() {
        var argArr = Array.prototype.slice.call(arguments),
            docFrag = document.createDocumentFragment();

        argArr.forEach(function (argItem) {
          var isNode = argItem instanceof Node;
          docFrag.appendChild(isNode ? argItem : document.createTextNode(String(argItem)));
        });

        this.parentNode.insertBefore(docFrag, this.nextSibling);
      }
    });
  });
})([Element.prototype, CharacterData.prototype, DocumentType.prototype]);

function ReplaceWithPolyfill() {
  'use-strict'; // For safari, and IE > 10

  var parent = this.parentNode,
      i = arguments.length,
      currentNode;
  if (!parent) return;
  if (!i) // if there are no arguments
    parent.removeChild(this);
  while (i--) {
    // i-- decrements i and returns the value of i before the decrement
    currentNode = arguments[i];
    if ((typeof currentNode === 'undefined' ? 'undefined' : _typeof(currentNode)) !== 'object') {
      currentNode = this.ownerDocument.createTextNode(currentNode);
    } else if (currentNode.parentNode) {
      currentNode.parentNode.removeChild(currentNode);
    }
    // the value of "i" below is after the decrement
    if (!i) // if currentNode is the first argument (currentNode === arguments[0])
      parent.replaceChild(currentNode, this);else // if currentNode isn't the first
      parent.insertBefore(currentNode, this.previousSibling);
  }
}
if (!Element.prototype.replaceWith) Element.prototype.replaceWith = ReplaceWithPolyfill;
if (!CharacterData.prototype.replaceWith) CharacterData.prototype.replaceWith = ReplaceWithPolyfill;
if (!DocumentType.prototype.replaceWith) DocumentType.prototype.replaceWith = ReplaceWithPolyfill;
"use strict";

head.ready(function () {
  var $form = $(".form-search-volume");

  var $body = $("body");

  $(window).on('undo-loading', function () {
    $("button.btn-loading").removeAttr("disabled").removeClass("btn-loading");
  });

  $("body").on('submit', 'form.form-search-volume', function (event) {
    HT.beforeUnloadTimeout = 15000;
    var $form_ = $(this);

    var $submit = $form_.find("button[type=submit]");
    if ($submit.hasClass("btn-loading")) {
      alert("Your search query has been submitted and is currently being processed.");
      return false;
    }
    var $input = $form_.find("input[type=text]");
    if (!$.trim($input.val())) {
      bootbox.alert("Please enter a term in the search box.");
      return false;
    }
    $submit.addClass("btn-loading").attr("disabled", "disabled");

    $(window).on('unload', function () {
      $(window).trigger('undo-loading');
    });

    if (HT.reader && HT.reader.controls.searchinator) {
      event.preventDefault();
      return HT.reader.controls.searchinator.submit($form_.get(0));
    }

    // default processing
  });

  $("#action-start-jump").on('change', function () {
    var sz = parseInt($(this).data('sz'), 10);
    var value = parseInt($(this).val(), 10);
    var start = (value - 1) * sz + 1;
    var $form_ = $("#form-search-volume");
    $form_.append("<input name='start' type=\"hidden\" value=\"" + start + "\" />");
    $form_.append("<input name='sz' type=\"hidden\" value=\"" + sz + "\" />");
    $form_.submit();
  });
});
'use strict';

head.ready(function () {

    $("body").on('click', '#versionIcon', function (e) {
        e.preventDefault();
        bootbox.alert("<p>This is the date when this item was last updated. Version dates are updated when improvements such as higher quality scans or more complete scans have been made. <br /><br /><a href=\"/cgi/feedback?page=form\" data-default-form=\"data-default-form\" data-toggle=\"feedback tracking-action\" data-id=\"\" data-tracking-action=\"Show Feedback\">Contact us</a> for more information.</p>");
    });
});
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInB1cmwuanMiLCJfYmFzZS5qcyIsImFjY2Vzc19iYW5uZXIuanMiLCJjbGFzc0xpc3QuanMiLCJjb2xsZWN0aW9uX3Rvb2xzLmpzIiwiY3Jtcy5qcyIsImRvd25sb2FkZXIuanMiLCJlbWJlZEhUTUxfcG9wdXAuanMiLCJmZWVkYmFjay5qcyIsImdsb2JhbF9zZWFyY2guanMiLCJnb29nbGVfYW5hbHl0aWNzLmpzIiwibW9iaWZ5LmpzIiwicG9seWZpbGxzLmpzIiwic2VhcmNoX2luX2l0ZW0uanMiLCJ2ZXJzaW9uX3BvcHVwLmpzIl0sIm5hbWVzIjpbImZhY3RvcnkiLCJkZWZpbmUiLCJhbWQiLCJqUXVlcnkiLCIkIiwidW5kZWZpbmVkIiwidGFnMmF0dHIiLCJhIiwiaW1nIiwiZm9ybSIsImJhc2UiLCJzY3JpcHQiLCJpZnJhbWUiLCJsaW5rIiwia2V5IiwiYWxpYXNlcyIsInBhcnNlciIsInN0cmljdCIsImxvb3NlIiwidG9TdHJpbmciLCJPYmplY3QiLCJwcm90b3R5cGUiLCJpc2ludCIsInBhcnNlVXJpIiwidXJsIiwic3RyaWN0TW9kZSIsInN0ciIsImRlY29kZVVSSSIsInJlcyIsImV4ZWMiLCJ1cmkiLCJhdHRyIiwicGFyYW0iLCJzZWciLCJpIiwicGFyc2VTdHJpbmciLCJwYXRoIiwicmVwbGFjZSIsInNwbGl0IiwiZnJhZ21lbnQiLCJob3N0IiwicHJvdG9jb2wiLCJwb3J0IiwiZ2V0QXR0ck5hbWUiLCJlbG0iLCJ0biIsInRhZ05hbWUiLCJ0b0xvd2VyQ2FzZSIsInByb21vdGUiLCJwYXJlbnQiLCJsZW5ndGgiLCJ0IiwicGFyc2UiLCJwYXJ0cyIsInZhbCIsInBhcnQiLCJzaGlmdCIsImlzQXJyYXkiLCJwdXNoIiwib2JqIiwia2V5cyIsImluZGV4T2YiLCJzdWJzdHIiLCJ0ZXN0IiwibWVyZ2UiLCJsZW4iLCJsYXN0IiwiayIsInNldCIsInJlZHVjZSIsIlN0cmluZyIsInJldCIsInBhaXIiLCJkZWNvZGVVUklDb21wb25lbnQiLCJlIiwiZXFsIiwiYnJhY2UiLCJsYXN0QnJhY2VJbktleSIsInYiLCJjIiwiYWNjdW11bGF0b3IiLCJsIiwiY3VyciIsImFyZ3VtZW50cyIsImNhbGwiLCJ2QXJnIiwicHJvcCIsImhhc093blByb3BlcnR5IiwicHVybCIsIndpbmRvdyIsImxvY2F0aW9uIiwiZGF0YSIsInF1ZXJ5IiwiZnBhcmFtIiwic2VnbWVudCIsImZzZWdtZW50IiwiZm4iLCJIVCIsImhlYWQiLCJyZWFkeSIsInJlbmV3X2F1dGgiLCJlbnRpdHlJRCIsInNvdXJjZSIsIl9fcmVuZXdpbmciLCJzZXRUaW1lb3V0IiwicmVhdXRoX3VybCIsInNlcnZpY2VfZG9tYWluIiwiZW5jb2RlVVJJQ29tcG9uZW50IiwiaHJlZiIsInJldHZhbCIsImNvbmZpcm0iLCJhbmFseXRpY3MiLCJsb2dBY3Rpb24iLCJ0cmlnZ2VyIiwiZGVsaW0iLCJhamF4IiwiY29tcGxldGUiLCJ4aHIiLCJzdGF0dXMiLCJnZXRSZXNwb25zZUhlYWRlciIsIm9uIiwiZXZlbnQiLCJjb25zb2xlIiwibG9nIiwiZG9jdW1lbnQiLCJxdWVyeVNlbGVjdG9yQWxsIiwiZm9yRWFjaCIsInN2ZyIsImlubmVySFRNTCIsIk1PTlRIUyIsIiRlbWVyZ2VuY3lfYWNjZXNzIiwiZGVsdGEiLCJsYXN0X3NlY29uZHMiLCJ0b2dnbGVfcmVuZXdfbGluayIsImRhdGUiLCJub3ciLCJEYXRlIiwiZ2V0VGltZSIsIiRsaW5rIiwiZmluZCIsIm9ic2VydmVfZXhwaXJhdGlvbl90aW1lc3RhbXAiLCJwYXJhbXMiLCJpZCIsImNvb2tpZSIsImpzb24iLCJzZWNvbmRzIiwiY2xvbmUiLCJ0ZXh0IiwiYXBwZW5kIiwiJGFjdGlvbiIsIm1lc3NhZ2UiLCJ0aW1lMm1lc3NhZ2UiLCJob3VycyIsImdldEhvdXJzIiwiYW1wbSIsIm1pbnV0ZXMiLCJnZXRNaW51dGVzIiwiZ2V0TW9udGgiLCJnZXREYXRlIiwiZXhwaXJhdGlvbiIsInBhcnNlSW50IiwiZ3JhbnRlZCIsImdldCIsImRhdGFzZXQiLCJpbml0aWFsaXplZCIsInNldEludGVydmFsIiwic3VwcHJlc3MiLCJoYXNDbGFzcyIsImRlYnVnIiwiaWRoYXNoIiwiY3VycmlkIiwiaWRzIiwic2hvd0FsZXJ0IiwiaHRtbCIsIiRhbGVydCIsImJvb3Rib3giLCJkaWFsb2ciLCJsYWJlbCIsImhlYWRlciIsInJvbGUiLCJkb21haW4iLCJzZWxmIiwiY3JlYXRlRWxlbWVudCIsImNyZWF0ZUVsZW1lbnROUyIsInZpZXciLCJjbGFzc0xpc3RQcm9wIiwicHJvdG9Qcm9wIiwiZWxlbUN0clByb3RvIiwiRWxlbWVudCIsIm9iakN0ciIsInN0clRyaW0iLCJ0cmltIiwiYXJySW5kZXhPZiIsIkFycmF5IiwiaXRlbSIsIkRPTUV4IiwidHlwZSIsIm5hbWUiLCJjb2RlIiwiRE9NRXhjZXB0aW9uIiwiY2hlY2tUb2tlbkFuZEdldEluZGV4IiwiY2xhc3NMaXN0IiwidG9rZW4iLCJDbGFzc0xpc3QiLCJlbGVtIiwidHJpbW1lZENsYXNzZXMiLCJnZXRBdHRyaWJ1dGUiLCJjbGFzc2VzIiwiX3VwZGF0ZUNsYXNzTmFtZSIsInNldEF0dHJpYnV0ZSIsImNsYXNzTGlzdFByb3RvIiwiY2xhc3NMaXN0R2V0dGVyIiwiRXJyb3IiLCJjb250YWlucyIsImFkZCIsInRva2VucyIsInVwZGF0ZWQiLCJyZW1vdmUiLCJpbmRleCIsInNwbGljZSIsInRvZ2dsZSIsImZvcmNlIiwicmVzdWx0IiwibWV0aG9kIiwicmVwbGFjZW1lbnRfdG9rZW4iLCJqb2luIiwiZGVmaW5lUHJvcGVydHkiLCJjbGFzc0xpc3RQcm9wRGVzYyIsImVudW1lcmFibGUiLCJjb25maWd1cmFibGUiLCJleCIsIm51bWJlciIsIl9fZGVmaW5lR2V0dGVyX18iLCJ0ZXN0RWxlbWVudCIsImNyZWF0ZU1ldGhvZCIsIm9yaWdpbmFsIiwiRE9NVG9rZW5MaXN0IiwiX3RvZ2dsZSIsInNsaWNlIiwiYXBwbHkiLCJERUZBVUxUX0NPTExfTUVOVV9PUFRJT04iLCJORVdfQ09MTF9NRU5VX09QVElPTiIsIklOX1lPVVJfQ09MTFNfTEFCRUwiLCIkdG9vbGJhciIsIiRlcnJvcm1zZyIsIiRpbmZvbXNnIiwiZGlzcGxheV9lcnJvciIsIm1zZyIsImluc2VydEFmdGVyIiwic2hvdyIsInVwZGF0ZV9zdGF0dXMiLCJkaXNwbGF5X2luZm8iLCJoaWRlX2Vycm9yIiwiaGlkZSIsImhpZGVfaW5mbyIsImdldF91cmwiLCJwYXRobmFtZSIsInBhcnNlX2xpbmUiLCJ0bXAiLCJrdiIsImVkaXRfY29sbGVjdGlvbl9tZXRhZGF0YSIsImFyZ3MiLCJvcHRpb25zIiwiZXh0ZW5kIiwiY3JlYXRpbmciLCIkYmxvY2siLCJjbiIsImRlc2MiLCJzaHJkIiwibG9naW5fc3RhdHVzIiwibG9nZ2VkX2luIiwiYXBwZW5kVG8iLCIkaGlkZGVuIiwiaWlkIiwiJGRpYWxvZyIsImNhbGxiYWNrIiwiY2hlY2tWYWxpZGl0eSIsInJlcG9ydFZhbGlkaXR5Iiwic3VibWl0X3Bvc3QiLCJlYWNoIiwiJHRoaXMiLCIkY291bnQiLCJsaW1pdCIsImJpbmQiLCJwYWdlIiwiZG9uZSIsImFkZF9pdGVtX3RvX2NvbGxpc3QiLCJmYWlsIiwianFYSFIiLCJ0ZXh0U3RhdHVzIiwiZXJyb3JUaHJvd24iLCIkdWwiLCJjb2xsX2hyZWYiLCJjb2xsX2lkIiwiJGEiLCJjb2xsX25hbWUiLCJwYXJlbnRzIiwicmVtb3ZlQ2xhc3MiLCIkb3B0aW9uIiwiY29uZmlybV9sYXJnZSIsImNvbGxTaXplIiwiYWRkTnVtSXRlbXMiLCJudW1TdHIiLCJhbnN3ZXIiLCJwcmV2ZW50RGVmYXVsdCIsImFjdGlvbiIsInNlbGVjdGVkX2NvbGxlY3Rpb25faWQiLCJzZWxlY3RlZF9jb2xsZWN0aW9uX25hbWUiLCJjMiIsImlzIiwiY3Jtc19zdGF0ZSIsImZvcmNlX3NpemUiLCIkZGl2IiwiJHAiLCJwaG90b2NvcGllcl9tZXNzYWdlIiwiRG93bmxvYWRlciIsImluaXQiLCJwZGYiLCJzdGFydCIsImJpbmRFdmVudHMiLCJleHBsYWluUGRmQWNjZXNzIiwiYWxlcnQiLCJkb3dubG9hZFBkZiIsImNvbmZpZyIsInNyYyIsIml0ZW1fdGl0bGUiLCIkY29uZmlnIiwidG90YWwiLCJzZWxlY3Rpb24iLCJwYWdlcyIsInN1ZmZpeCIsImNsb3NlTW9kYWwiLCJkYXRhVHlwZSIsImNhY2hlIiwiZXJyb3IiLCJyZXEiLCJkaXNwbGF5V2FybmluZyIsImRpc3BsYXlFcnJvciIsIiRzdGF0dXMiLCJyZXF1ZXN0RG93bmxvYWQiLCJzZXEiLCJkb3dubG9hZEZvcm1hdCIsImNhbmNlbERvd25sb2FkIiwicHJvZ3Jlc3NfdXJsIiwiZG93bmxvYWRfdXJsIiwiY2xlYXJUaW1lciIsInN0YXJ0RG93bmxvYWRNb25pdG9yIiwidGltZXIiLCJpc19ydW5uaW5nIiwibnVtX3Byb2Nlc3NlZCIsImNoZWNrU3RhdHVzIiwidHMiLCJzdWNjZXNzIiwidXBkYXRlUHJvZ3Jlc3MiLCJudW1fYXR0ZW1wdHMiLCJkaXNwbGF5UHJvY2Vzc0Vycm9yIiwibG9nRXJyb3IiLCJwZXJjZW50IiwiY3VycmVudCIsImN1cnJlbnRfcGFnZSIsImxhc3RfcGVyY2VudCIsInVwZGF0ZVN0YXR1c1RleHQiLCJjc3MiLCJ3aWR0aCIsImRvd25sb2FkX2tleSIsIm5hdmlnYXRvciIsInVzZXJBZ2VudCIsIiRkb3dubG9hZF9idG4iLCJkb3dubG9hZCIsInRyYWNrRXZlbnQiLCJjYXRlZ29yeSIsInRvVXBwZXJDYXNlIiwidHJhY2tpbmdBY3Rpb24iLCJzdG9wUHJvcGFnYXRpb24iLCJmb2N1cyIsIk1hdGgiLCJjZWlsIiwiY2xlYXJJbnRlcnZhbCIsInRpbWVvdXQiLCJyYXRlIiwiY291bnRkb3duIiwiY291bnRkb3duX3RpbWVyIiwiX2xhc3RNZXNzYWdlIiwiX2xhc3RUaW1lciIsImNsZWFyVGltZW91dCIsImlubmVyVGV4dCIsIkVPVCIsImRvd25sb2FkRm9ybSIsImRvd25sb2FkRm9ybWF0T3B0aW9ucyIsInJhbmdlT3B0aW9ucyIsImRvd25sb2FkSWR4IiwiZG93bmxvYWRlciIsImNyZWF0ZSIsInF1ZXJ5U2VsZWN0b3IiLCJkb3dubG9hZFN1Ym1pdCIsImhhc0Z1bGxQZGZBY2Nlc3MiLCJmdWxsUGRmQWNjZXNzIiwidXBkYXRlRG93bmxvYWRGb3JtYXRSYW5nZU9wdGlvbnMiLCJvcHRpb24iLCJyYW5nZU9wdGlvbiIsImlucHV0IiwiZGlzYWJsZWQiLCJtYXRjaGVzIiwidmFsdWUiLCJjaGVja2VkIiwicmVhZGVyIiwiYWRkRXZlbnRMaXN0ZW5lciIsImRpdiIsImZvcm1hdE9wdGlvbiIsImRvd25sb2FkRm9ybWF0VGFyZ2V0IiwicGRmRm9ybWF0T3B0aW9uIiwidHVubmVsRm9ybSIsInByaW50YWJsZSIsImFjdGlvblRlbXBsYXRlIiwiY29udHJvbHMiLCJzZWxlY3RpbmF0b3IiLCJfZ2V0UGFnZVNlbGVjdGlvbiIsImlzU2VsZWN0aW9uIiwiYnV0dG9ucyIsImN1cnJlbnRMb2NhdGlvbiIsIl9nZXRGbGF0dGVuZWRTZWxlY3Rpb24iLCJpc1BhcnRpYWwiLCJyZW1vdmVDaGlsZCIsInNpemVfYXR0ciIsImltYWdlX2Zvcm1hdF9hdHRyIiwic2l6ZV92YWx1ZSIsImFwcGVuZENoaWxkIiwicmFuZ2UiLCJib2R5IiwidHJhY2tlciIsInRyYWNrZXJfaW5wdXQiLCJzdHlsZSIsIm9wYWNpdHkiLCJ0cmFja2VySW50ZXJ2YWwiLCJpc19kZXYiLCJyZW1vdmVDb29raWUiLCJkaXNhYmxlVW5sb2FkVGltZW91dCIsInN1Ym1pdCIsIl9mb3JtYXRfdGl0bGVzIiwiZXB1YiIsInBsYWludGV4dCIsImltYWdlIiwic2lkZV9zaG9ydCIsInNpZGVfbG9uZyIsImh0SWQiLCJlbWJlZEhlbHBMaW5rIiwiY29kZWJsb2NrX3R4dCIsImNvZGVibG9ja190eHRfYSIsInciLCJoIiwiY29kZWJsb2NrX3R4dF9iIiwiY2xvc2VzdCIsImFkZENsYXNzIiwidGV4dGFyZWEiLCJzZWxlY3QiLCJjbGljayIsImZlZWRiYWNrIiwiJGZvcm0iLCJSZWNvcmRVUkwiLCIkZW1haWwiLCJpbml0ZWQiLCIkaW5wdXQiLCIkaW5wdXRfbGFiZWwiLCIkc2VsZWN0IiwiJHNlYXJjaF90YXJnZXQiLCIkZnQiLCIkYmFja2Ryb3AiLCJvblNob3ciLCJtb2RhbCIsIl9zZXR1cCIsImxzIiwiY2F0YWxvZyIsInRhcmdldCIsInByZWZzIiwic2VhcmNoIiwiZnQiLCJzZWFyY2h0eXBlIiwiZ2V0Q29udGVudEdyb3VwRGF0YSIsImNvbnRlbnRfZ3JvdXAiLCJfc2ltcGxpZnlQYWdlSHJlZiIsIm5ld19ocmVmIiwicXMiLCJnZXRQYWdlSHJlZiIsIiRtZW51IiwiJHRyaWdnZXIiLCIkaGVhZGVyIiwiJG5hdmlnYXRvciIsIm1vYmlmeSIsImV4cGFuZGVkIiwiJGV4cGFuZG8iLCJ1aSIsIiRzaWRlYmFyIiwiZG9jdW1lbnRFbGVtZW50IiwicmVxdWVzdEZ1bGxTY3JlZW4iLCJ1dGlscyIsImhhbmRsZU9yaWVudGF0aW9uQ2hhbmdlIiwic3RhdGUiLCJzaWRlYmFyRXhwYW5kZWQiLCJ1cGRhdGVUb29sYmFyVG9wUHJvcGVydHkiLCJvdXRlckhlaWdodCIsInRvcCIsImhlaWdodCIsInNldFByb3BlcnR5IiwiYXNzaWduIiwidmFyQXJncyIsIlR5cGVFcnJvciIsInRvIiwibmV4dFNvdXJjZSIsIm5leHRLZXkiLCJ3cml0YWJsZSIsImFyciIsImFmdGVyIiwiYXJnQXJyIiwiZG9jRnJhZyIsImNyZWF0ZURvY3VtZW50RnJhZ21lbnQiLCJhcmdJdGVtIiwiaXNOb2RlIiwiTm9kZSIsImNyZWF0ZVRleHROb2RlIiwicGFyZW50Tm9kZSIsImluc2VydEJlZm9yZSIsIm5leHRTaWJsaW5nIiwiQ2hhcmFjdGVyRGF0YSIsIkRvY3VtZW50VHlwZSIsIlJlcGxhY2VXaXRoUG9seWZpbGwiLCJjdXJyZW50Tm9kZSIsIm93bmVyRG9jdW1lbnQiLCJyZXBsYWNlQ2hpbGQiLCJwcmV2aW91c1NpYmxpbmciLCJyZXBsYWNlV2l0aCIsIiRib2R5IiwicmVtb3ZlQXR0ciIsImJlZm9yZVVubG9hZFRpbWVvdXQiLCIkZm9ybV8iLCIkc3VibWl0Iiwic2VhcmNoaW5hdG9yIiwic3oiXSwibWFwcGluZ3Mi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WSxFQUF2RDtBQUNBSCxXQUFPaEcsTUFBUDtBQUNELEdBUkQ7QUFVRCxDQS9DRDs7O0FDQUFuVixLQUFLQyxLQUFMLENBQVcsWUFBVzs7QUFFbEIvRixNQUFFLE1BQUYsRUFBVW9ILEVBQVYsQ0FBYSxPQUFiLEVBQXNCLGNBQXRCLEVBQXNDLFVBQVM5QyxDQUFULEVBQVk7QUFDOUNBLFVBQUVzTyxjQUFGO0FBQ0FqSSxnQkFBUWtKLEtBQVIsQ0FBYyxvWUFBZDtBQUNILEtBSEQ7QUFLSCxDQVBEIiwiZmlsZSI6InV0aWxzLmpzIiwic291cmNlc0NvbnRlbnQiOlsiLypcbiAqIEpRdWVyeSBVUkwgUGFyc2VyIHBsdWdpbiwgdjIuMi4xXG4gKiBEZXZlbG9wZWQgYW5kIG1haW50YW5pbmVkIGJ5IE1hcmsgUGVya2lucywgbWFya0BhbGxtYXJrZWR1cC5jb21cbiAqIFNvdXJjZSByZXBvc2l0b3J5OiBodHRwczovL2dpdGh1Yi5jb20vYWxsbWFya2VkdXAvalF1ZXJ5LVVSTC1QYXJzZXJcbiAqIExpY2Vuc2VkIHVuZGVyIGFuIE1JVC1zdHlsZSBsaWNlbnNlLiBTZWUgaHR0cHM6Ly9naXRodWIuY29tL2FsbG1hcmtlZHVwL2pRdWVyeS1VUkwtUGFyc2VyL2Jsb2IvbWFzdGVyL0xJQ0VOU0UgZm9yIGRldGFpbHMuXG4gKi8gXG5cbjsoZnVuY3Rpb24oZmFjdG9yeSkge1xuXHRpZiAodHlwZW9mIGRlZmluZSA9PT0gJ2Z1bmN0aW9uJyAmJiBkZWZpbmUuYW1kKSB7XG5cdFx0Ly8gQU1EIGF2YWlsYWJsZTsgdXNlIGFub255bW91cyBtb2R1bGVcblx0XHRpZiAoIHR5cGVvZiBqUXVlcnkgIT09ICd1bmRlZmluZWQnICkge1xuXHRcdFx0ZGVmaW5lKFsnanF1ZXJ5J10sIGZhY3RvcnkpO1x0XG5cdFx0fSBlbHNlIHtcblx0XHRcdGRlZmluZShbXSwgZmFjdG9yeSk7XG5cdFx0fVxuXHR9IGVsc2Uge1xuXHRcdC8vIE5vIEFNRCBhdmFpbGFibGU7IG11dGF0ZSBnbG9iYWwgdmFyc1xuXHRcdGlmICggdHlwZW9mIGpRdWVyeSAhPT0gJ3VuZGVmaW5lZCcgKSB7XG5cdFx0XHRmYWN0b3J5KGpRdWVyeSk7XG5cdFx0fSBlbHNlIHtcblx0XHRcdGZhY3RvcnkoKTtcblx0XHR9XG5cdH1cbn0pKGZ1bmN0aW9uKCQsIHVuZGVmaW5lZCkge1xuXHRcblx0dmFyIHRhZzJhdHRyID0ge1xuXHRcdFx0YSAgICAgICA6ICdocmVmJyxcblx0XHRcdGltZyAgICAgOiAnc3JjJyxcblx0XHRcdGZvcm0gICAgOiAnYWN0aW9uJyxcblx0XHRcdGJhc2UgICAgOiAnaHJlZicsXG5cdFx0XHRzY3JpcHQgIDogJ3NyYycsXG5cdFx0XHRpZnJhbWUgIDogJ3NyYycsXG5cdFx0XHRsaW5rICAgIDogJ2hyZWYnXG5cdFx0fSxcblx0XHRcblx0XHRrZXkgPSBbJ3NvdXJjZScsICdwcm90b2NvbCcsICdhdXRob3JpdHknLCAndXNlckluZm8nLCAndXNlcicsICdwYXNzd29yZCcsICdob3N0JywgJ3BvcnQnLCAncmVsYXRpdmUnLCAncGF0aCcsICdkaXJlY3RvcnknLCAnZmlsZScsICdxdWVyeScsICdmcmFnbWVudCddLCAvLyBrZXlzIGF2YWlsYWJsZSB0byBxdWVyeVxuXHRcdFxuXHRcdGFsaWFzZXMgPSB7ICdhbmNob3InIDogJ2ZyYWdtZW50JyB9LCAvLyBhbGlhc2VzIGZvciBiYWNrd2FyZHMgY29tcGF0YWJpbGl0eVxuXHRcdFxuXHRcdHBhcnNlciA9IHtcblx0XHRcdHN0cmljdCA6IC9eKD86KFteOlxcLz8jXSspOik/KD86XFwvXFwvKCg/OigoW146QF0qKTo/KFteOkBdKikpP0ApPyhbXjpcXC8/I10qKSg/OjooXFxkKikpPykpPygoKCg/OltePyNcXC9dKlxcLykqKShbXj8jXSopKSg/OlxcPyhbXiNdKikpPyg/OiMoLiopKT8pLywgIC8vbGVzcyBpbnR1aXRpdmUsIG1vcmUgYWNjdXJhdGUgdG8gdGhlIHNwZWNzXG5cdFx0XHRsb29zZSA6ICAvXig/Oig/IVteOkBdKzpbXjpAXFwvXSpAKShbXjpcXC8/Iy5dKyk6KT8oPzpcXC9cXC8pPygoPzooKFteOkBdKik6PyhbXjpAXSopKT9AKT8oW146XFwvPyNdKikoPzo6KFxcZCopKT8pKCgoXFwvKD86W14/I10oPyFbXj8jXFwvXSpcXC5bXj8jXFwvLl0rKD86Wz8jXXwkKSkpKlxcLz8pPyhbXj8jXFwvXSopKSg/OlxcPyhbXiNdKikpPyg/OiMoLiopKT8pLyAvLyBtb3JlIGludHVpdGl2ZSwgZmFpbHMgb24gcmVsYXRpdmUgcGF0aHMgYW5kIGRldmlhdGVzIGZyb20gc3BlY3Ncblx0XHR9LFxuXHRcdFxuXHRcdHRvU3RyaW5nID0gT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZyxcblx0XHRcblx0XHRpc2ludCA9IC9eWzAtOV0rJC87XG5cdFxuXHRmdW5jdGlvbiBwYXJzZVVyaSggdXJsLCBzdHJpY3RNb2RlICkge1xuXHRcdHZhciBzdHIgPSBkZWNvZGVVUkkoIHVybCApLFxuXHRcdHJlcyAgID0gcGFyc2VyWyBzdHJpY3RNb2RlIHx8IGZhbHNlID8gJ3N0cmljdCcgOiAnbG9vc2UnIF0uZXhlYyggc3RyICksXG5cdFx0dXJpID0geyBhdHRyIDoge30sIHBhcmFtIDoge30sIHNlZyA6IHt9IH0sXG5cdFx0aSAgID0gMTQ7XG5cdFx0XG5cdFx0d2hpbGUgKCBpLS0gKSB7XG5cdFx0XHR1cmkuYXR0clsga2V5W2ldIF0gPSByZXNbaV0gfHwgJyc7XG5cdFx0fVxuXHRcdFxuXHRcdC8vIGJ1aWxkIHF1ZXJ5IGFuZCBmcmFnbWVudCBwYXJhbWV0ZXJzXHRcdFxuXHRcdHVyaS5wYXJhbVsncXVlcnknXSA9IHBhcnNlU3RyaW5nKHVyaS5hdHRyWydxdWVyeSddKTtcblx0XHR1cmkucGFyYW1bJ2ZyYWdtZW50J10gPSBwYXJzZVN0cmluZyh1cmkuYXR0clsnZnJhZ21lbnQnXSk7XG5cdFx0XG5cdFx0Ly8gc3BsaXQgcGF0aCBhbmQgZnJhZ2VtZW50IGludG8gc2VnbWVudHNcdFx0XG5cdFx0dXJpLnNlZ1sncGF0aCddID0gdXJpLmF0dHIucGF0aC5yZXBsYWNlKC9eXFwvK3xcXC8rJC9nLCcnKS5zcGxpdCgnLycpOyAgICAgXG5cdFx0dXJpLnNlZ1snZnJhZ21lbnQnXSA9IHVyaS5hdHRyLmZyYWdtZW50LnJlcGxhY2UoL15cXC8rfFxcLyskL2csJycpLnNwbGl0KCcvJyk7XG5cdFx0XG5cdFx0Ly8gY29tcGlsZSBhICdiYXNlJyBkb21haW4gYXR0cmlidXRlICAgICAgICBcblx0XHR1cmkuYXR0clsnYmFzZSddID0gdXJpLmF0dHIuaG9zdCA/ICh1cmkuYXR0ci5wcm90b2NvbCA/ICB1cmkuYXR0ci5wcm90b2NvbCsnOi8vJyt1cmkuYXR0ci5ob3N0IDogdXJpLmF0dHIuaG9zdCkgKyAodXJpLmF0dHIucG9ydCA/ICc6Jyt1cmkuYXR0ci5wb3J0IDogJycpIDogJyc7ICAgICAgXG5cdFx0ICBcblx0XHRyZXR1cm4gdXJpO1xuXHR9O1xuXHRcblx0ZnVuY3Rpb24gZ2V0QXR0ck5hbWUoIGVsbSApIHtcblx0XHR2YXIgdG4gPSBlbG0udGFnTmFtZTtcblx0XHRpZiAoIHR5cGVvZiB0biAhPT0gJ3VuZGVmaW5lZCcgKSByZXR1cm4gdGFnMmF0dHJbdG4udG9Mb3dlckNhc2UoKV07XG5cdFx0cmV0dXJuIHRuO1xuXHR9XG5cdFxuXHRmdW5jdGlvbiBwcm9tb3RlKHBhcmVudCwga2V5KSB7XG5cdFx0aWYgKHBhcmVudFtrZXldLmxlbmd0aCA9PSAwKSByZXR1cm4gcGFyZW50W2tleV0gPSB7fTtcblx0XHR2YXIgdCA9IHt9O1xuXHRcdGZvciAodmFyIGkgaW4gcGFyZW50W2tleV0pIHRbaV0gPSBwYXJlbnRba2V5XVtpXTtcblx0XHRwYXJlbnRba2V5XSA9IHQ7XG5cdFx0cmV0dXJuIHQ7XG5cdH1cblxuXHRmdW5jdGlvbiBwYXJzZShwYXJ0cywgcGFyZW50LCBrZXksIHZhbCkge1xuXHRcdHZhciBwYXJ0ID0gcGFydHMuc2hpZnQoKTtcblx0XHRpZiAoIXBhcnQpIHtcblx0XHRcdGlmIChpc0FycmF5KHBhcmVudFtrZXldKSkge1xuXHRcdFx0XHRwYXJlbnRba2V5XS5wdXNoKHZhbCk7XG5cdFx0XHR9IGVsc2UgaWYgKCdvYmplY3QnID09IHR5cGVvZiBwYXJlbnRba2V5XSkge1xuXHRcdFx0XHRwYXJlbnRba2V5XSA9IHZhbDtcblx0XHRcdH0gZWxzZSBpZiAoJ3VuZGVmaW5lZCcgPT0gdHlwZW9mIHBhcmVudFtrZXldKSB7XG5cdFx0XHRcdHBhcmVudFtrZXldID0gdmFsO1xuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0cGFyZW50W2tleV0gPSBbcGFyZW50W2tleV0sIHZhbF07XG5cdFx0XHR9XG5cdFx0fSBlbHNlIHtcblx0XHRcdHZhciBvYmogPSBwYXJlbnRba2V5XSA9IHBhcmVudFtrZXldIHx8IFtdO1xuXHRcdFx0aWYgKCddJyA9PSBwYXJ0KSB7XG5cdFx0XHRcdGlmIChpc0FycmF5KG9iaikpIHtcblx0XHRcdFx0XHRpZiAoJycgIT0gdmFsKSBvYmoucHVzaCh2YWwpO1xuXHRcdFx0XHR9IGVsc2UgaWYgKCdvYmplY3QnID09IHR5cGVvZiBvYmopIHtcblx0XHRcdFx0XHRvYmpba2V5cyhvYmopLmxlbmd0aF0gPSB2YWw7XG5cdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0b2JqID0gcGFyZW50W2tleV0gPSBbcGFyZW50W2tleV0sIHZhbF07XG5cdFx0XHRcdH1cblx0XHRcdH0gZWxzZSBpZiAofnBhcnQuaW5kZXhPZignXScpKSB7XG5cdFx0XHRcdHBhcnQgPSBwYXJ0LnN1YnN0cigwLCBwYXJ0Lmxlbmd0aCAtIDEpO1xuXHRcdFx0XHRpZiAoIWlzaW50LnRlc3QocGFydCkgJiYgaXNBcnJheShvYmopKSBvYmogPSBwcm9tb3RlKHBhcmVudCwga2V5KTtcblx0XHRcdFx0cGFyc2UocGFydHMsIG9iaiwgcGFydCwgdmFsKTtcblx0XHRcdFx0Ly8ga2V5XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRpZiAoIWlzaW50LnRlc3QocGFydCkgJiYgaXNBcnJheShvYmopKSBvYmogPSBwcm9tb3RlKHBhcmVudCwga2V5KTtcblx0XHRcdFx0cGFyc2UocGFydHMsIG9iaiwgcGFydCwgdmFsKTtcblx0XHRcdH1cblx0XHR9XG5cdH1cblxuXHRmdW5jdGlvbiBtZXJnZShwYXJlbnQsIGtleSwgdmFsKSB7XG5cdFx0aWYgKH5rZXkuaW5kZXhPZignXScpKSB7XG5cdFx0XHR2YXIgcGFydHMgPSBrZXkuc3BsaXQoJ1snKSxcblx0XHRcdGxlbiA9IHBhcnRzLmxlbmd0aCxcblx0XHRcdGxhc3QgPSBsZW4gLSAxO1xuXHRcdFx0cGFyc2UocGFydHMsIHBhcmVudCwgJ2Jhc2UnLCB2YWwpO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHRpZiAoIWlzaW50LnRlc3Qoa2V5KSAmJiBpc0FycmF5KHBhcmVudC5iYXNlKSkge1xuXHRcdFx0XHR2YXIgdCA9IHt9O1xuXHRcdFx0XHRmb3IgKHZhciBrIGluIHBhcmVudC5iYXNlKSB0W2tdID0gcGFyZW50LmJhc2Vba107XG5cdFx0XHRcdHBhcmVudC5iYXNlID0gdDtcblx0XHRcdH1cblx0XHRcdHNldChwYXJlbnQuYmFzZSwga2V5LCB2YWwpO1xuXHRcdH1cblx0XHRyZXR1cm4gcGFyZW50O1xuXHR9XG5cblx0ZnVuY3Rpb24gcGFyc2VTdHJpbmcoc3RyKSB7XG5cdFx0cmV0dXJuIHJlZHVjZShTdHJpbmcoc3RyKS5zcGxpdCgvJnw7LyksIGZ1bmN0aW9uKHJldCwgcGFpcikge1xuXHRcdFx0dHJ5IHtcblx0XHRcdFx0cGFpciA9IGRlY29kZVVSSUNvbXBvbmVudChwYWlyLnJlcGxhY2UoL1xcKy9nLCAnICcpKTtcblx0XHRcdH0gY2F0Y2goZSkge1xuXHRcdFx0XHQvLyBpZ25vcmVcblx0XHRcdH1cblx0XHRcdHZhciBlcWwgPSBwYWlyLmluZGV4T2YoJz0nKSxcblx0XHRcdFx0YnJhY2UgPSBsYXN0QnJhY2VJbktleShwYWlyKSxcblx0XHRcdFx0a2V5ID0gcGFpci5zdWJzdHIoMCwgYnJhY2UgfHwgZXFsKSxcblx0XHRcdFx0dmFsID0gcGFpci5zdWJzdHIoYnJhY2UgfHwgZXFsLCBwYWlyLmxlbmd0aCksXG5cdFx0XHRcdHZhbCA9IHZhbC5zdWJzdHIodmFsLmluZGV4T2YoJz0nKSArIDEsIHZhbC5sZW5ndGgpO1xuXG5cdFx0XHRpZiAoJycgPT0ga2V5KSBrZXkgPSBwYWlyLCB2YWwgPSAnJztcblxuXHRcdFx0cmV0dXJuIG1lcmdlKHJldCwga2V5LCB2YWwpO1xuXHRcdH0sIHsgYmFzZToge30gfSkuYmFzZTtcblx0fVxuXHRcblx0ZnVuY3Rpb24gc2V0KG9iaiwga2V5LCB2YWwpIHtcblx0XHR2YXIgdiA9IG9ialtrZXldO1xuXHRcdGlmICh1bmRlZmluZWQgPT09IHYpIHtcblx0XHRcdG9ialtrZXldID0gdmFsO1xuXHRcdH0gZWxzZSBpZiAoaXNBcnJheSh2KSkge1xuXHRcdFx0di5wdXNoKHZhbCk7XG5cdFx0fSBlbHNlIHtcblx0XHRcdG9ialtrZXldID0gW3YsIHZhbF07XG5cdFx0fVxuXHR9XG5cdFxuXHRmdW5jdGlvbiBsYXN0QnJhY2VJbktleShzdHIpIHtcblx0XHR2YXIgbGVuID0gc3RyLmxlbmd0aCxcblx0XHRcdCBicmFjZSwgYztcblx0XHRmb3IgKHZhciBpID0gMDsgaSA8IGxlbjsgKytpKSB7XG5cdFx0XHRjID0gc3RyW2ldO1xuXHRcdFx0aWYgKCddJyA9PSBjKSBicmFjZSA9IGZhbHNlO1xuXHRcdFx0aWYgKCdbJyA9PSBjKSBicmFjZSA9IHRydWU7XG5cdFx0XHRpZiAoJz0nID09IGMgJiYgIWJyYWNlKSByZXR1cm4gaTtcblx0XHR9XG5cdH1cblx0XG5cdGZ1bmN0aW9uIHJlZHVjZShvYmosIGFjY3VtdWxhdG9yKXtcblx0XHR2YXIgaSA9IDAsXG5cdFx0XHRsID0gb2JqLmxlbmd0aCA+PiAwLFxuXHRcdFx0Y3VyciA9IGFyZ3VtZW50c1syXTtcblx0XHR3aGlsZSAoaSA8IGwpIHtcblx0XHRcdGlmIChpIGluIG9iaikgY3VyciA9IGFjY3VtdWxhdG9yLmNhbGwodW5kZWZpbmVkLCBjdXJyLCBvYmpbaV0sIGksIG9iaik7XG5cdFx0XHQrK2k7XG5cdFx0fVxuXHRcdHJldHVybiBjdXJyO1xuXHR9XG5cdFxuXHRmdW5jdGlvbiBpc0FycmF5KHZBcmcpIHtcblx0XHRyZXR1cm4gT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZy5jYWxsKHZBcmcpID09PSBcIltvYmplY3QgQXJyYXldXCI7XG5cdH1cblx0XG5cdGZ1bmN0aW9uIGtleXMob2JqKSB7XG5cdFx0dmFyIGtleXMgPSBbXTtcblx0XHRmb3IgKCBwcm9wIGluIG9iaiApIHtcblx0XHRcdGlmICggb2JqLmhhc093blByb3BlcnR5KHByb3ApICkga2V5cy5wdXNoKHByb3ApO1xuXHRcdH1cblx0XHRyZXR1cm4ga2V5cztcblx0fVxuXHRcdFxuXHRmdW5jdGlvbiBwdXJsKCB1cmwsIHN0cmljdE1vZGUgKSB7XG5cdFx0aWYgKCBhcmd1bWVudHMubGVuZ3RoID09PSAxICYmIHVybCA9PT0gdHJ1ZSApIHtcblx0XHRcdHN0cmljdE1vZGUgPSB0cnVlO1xuXHRcdFx0dXJsID0gdW5kZWZpbmVkO1xuXHRcdH1cblx0XHRzdHJpY3RNb2RlID0gc3RyaWN0TW9kZSB8fCBmYWxzZTtcblx0XHR1cmwgPSB1cmwgfHwgd2luZG93LmxvY2F0aW9uLnRvU3RyaW5nKCk7XG5cdFxuXHRcdHJldHVybiB7XG5cdFx0XHRcblx0XHRcdGRhdGEgOiBwYXJzZVVyaSh1cmwsIHN0cmljdE1vZGUpLFxuXHRcdFx0XG5cdFx0XHQvLyBnZXQgdmFyaW91cyBhdHRyaWJ1dGVzIGZyb20gdGhlIFVSSVxuXHRcdFx0YXR0ciA6IGZ1bmN0aW9uKCBhdHRyICkge1xuXHRcdFx0XHRhdHRyID0gYWxpYXNlc1thdHRyXSB8fCBhdHRyO1xuXHRcdFx0XHRyZXR1cm4gdHlwZW9mIGF0dHIgIT09ICd1bmRlZmluZWQnID8gdGhpcy5kYXRhLmF0dHJbYXR0cl0gOiB0aGlzLmRhdGEuYXR0cjtcblx0XHRcdH0sXG5cdFx0XHRcblx0XHRcdC8vIHJldHVybiBxdWVyeSBzdHJpbmcgcGFyYW1ldGVyc1xuXHRcdFx0cGFyYW0gOiBmdW5jdGlvbiggcGFyYW0gKSB7XG5cdFx0XHRcdHJldHVybiB0eXBlb2YgcGFyYW0gIT09ICd1bmRlZmluZWQnID8gdGhpcy5kYXRhLnBhcmFtLnF1ZXJ5W3BhcmFtXSA6IHRoaXMuZGF0YS5wYXJhbS5xdWVyeTtcblx0XHRcdH0sXG5cdFx0XHRcblx0XHRcdC8vIHJldHVybiBmcmFnbWVudCBwYXJhbWV0ZXJzXG5cdFx0XHRmcGFyYW0gOiBmdW5jdGlvbiggcGFyYW0gKSB7XG5cdFx0XHRcdHJldHVybiB0eXBlb2YgcGFyYW0gIT09ICd1bmRlZmluZWQnID8gdGhpcy5kYXRhLnBhcmFtLmZyYWdtZW50W3BhcmFtXSA6IHRoaXMuZGF0YS5wYXJhbS5mcmFnbWVudDtcblx0XHRcdH0sXG5cdFx0XHRcblx0XHRcdC8vIHJldHVybiBwYXRoIHNlZ21lbnRzXG5cdFx0XHRzZWdtZW50IDogZnVuY3Rpb24oIHNlZyApIHtcblx0XHRcdFx0aWYgKCB0eXBlb2Ygc2VnID09PSAndW5kZWZpbmVkJyApIHtcblx0XHRcdFx0XHRyZXR1cm4gdGhpcy5kYXRhLnNlZy5wYXRoO1xuXHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdHNlZyA9IHNlZyA8IDAgPyB0aGlzLmRhdGEuc2VnLnBhdGgubGVuZ3RoICsgc2VnIDogc2VnIC0gMTsgLy8gbmVnYXRpdmUgc2VnbWVudHMgY291bnQgZnJvbSB0aGUgZW5kXG5cdFx0XHRcdFx0cmV0dXJuIHRoaXMuZGF0YS5zZWcucGF0aFtzZWddOyAgICAgICAgICAgICAgICAgICAgXG5cdFx0XHRcdH1cblx0XHRcdH0sXG5cdFx0XHRcblx0XHRcdC8vIHJldHVybiBmcmFnbWVudCBzZWdtZW50c1xuXHRcdFx0ZnNlZ21lbnQgOiBmdW5jdGlvbiggc2VnICkge1xuXHRcdFx0XHRpZiAoIHR5cGVvZiBzZWcgPT09ICd1bmRlZmluZWQnICkge1xuXHRcdFx0XHRcdHJldHVybiB0aGlzLmRhdGEuc2VnLmZyYWdtZW50OyAgICAgICAgICAgICAgICAgICAgXG5cdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0c2VnID0gc2VnIDwgMCA/IHRoaXMuZGF0YS5zZWcuZnJhZ21lbnQubGVuZ3RoICsgc2VnIDogc2VnIC0gMTsgLy8gbmVnYXRpdmUgc2VnbWVudHMgY291bnQgZnJvbSB0aGUgZW5kXG5cdFx0XHRcdFx0cmV0dXJuIHRoaXMuZGF0YS5zZWcuZnJhZ21lbnRbc2VnXTsgICAgICAgICAgICAgICAgICAgIFxuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdCAgICBcdFxuXHRcdH07XG5cdFxuXHR9O1xuXHRcblx0aWYgKCB0eXBlb2YgJCAhPT0gJ3VuZGVmaW5lZCcgKSB7XG5cdFx0XG5cdFx0JC5mbi51cmwgPSBmdW5jdGlvbiggc3RyaWN0TW9kZSApIHtcblx0XHRcdHZhciB1cmwgPSAnJztcblx0XHRcdGlmICggdGhpcy5sZW5ndGggKSB7XG5cdFx0XHRcdHVybCA9ICQodGhpcykuYXR0ciggZ2V0QXR0ck5hbWUodGhpc1swXSkgKSB8fCAnJztcblx0XHRcdH0gICAgXG5cdFx0XHRyZXR1cm4gcHVybCggdXJsLCBzdHJpY3RNb2RlICk7XG5cdFx0fTtcblx0XHRcblx0XHQkLnVybCA9IHB1cmw7XG5cdFx0XG5cdH0gZWxzZSB7XG5cdFx0d2luZG93LnB1cmwgPSBwdXJsO1xuXHR9XG5cbn0pO1xuXG4iLCJ2YXIgSFQgPSBIVCB8fCB7fTtcbmhlYWQucmVhZHkoZnVuY3Rpb24oKSB7XG5cbiAgLy8gdmFyICRzdGF0dXMgPSAkKFwiZGl2W3JvbGU9c3RhdHVzXVwiKTtcblxuICAvLyB2YXIgbGFzdE1lc3NhZ2U7IHZhciBsYXN0VGltZXI7XG4gIC8vIEhULnVwZGF0ZV9zdGF0dXMgPSBmdW5jdGlvbihtZXNzYWdlKSB7XG4gIC8vICAgICBpZiAoIGxhc3RNZXNzYWdlICE9IG1lc3NhZ2UgKSB7XG4gIC8vICAgICAgIGlmICggbGFzdFRpbWVyICkgeyBjbGVhclRpbWVvdXQobGFzdFRpbWVyKTsgbGFzdFRpbWVyID0gbnVsbDsgfVxuXG4gIC8vICAgICAgIHNldFRpbWVvdXQoKCkgPT4ge1xuICAvLyAgICAgICAgICRzdGF0dXMudGV4dChtZXNzYWdlKTtcbiAgLy8gICAgICAgICBsYXN0TWVzc2FnZSA9IG1lc3NhZ2U7XG4gIC8vICAgICAgICAgY29uc29sZS5sb2coXCItLSBzdGF0dXM6XCIsIG1lc3NhZ2UpO1xuICAvLyAgICAgICB9LCA1MCk7XG4gIC8vICAgICAgIGxhc3RUaW1lciA9IHNldFRpbWVvdXQoKCkgPT4ge1xuICAvLyAgICAgICAgICRzdGF0dXMuZ2V0KDApLmlubmVyVGV4dCA9ICcnO1xuICAvLyAgICAgICB9LCA1MDApO1xuXG4gIC8vICAgICB9XG4gIC8vIH1cblxuICBIVC5yZW5ld19hdXRoID0gZnVuY3Rpb24oZW50aXR5SUQsIHNvdXJjZT0naW1hZ2UnKSB7XG4gICAgaWYgKCBIVC5fX3JlbmV3aW5nICkgeyByZXR1cm4gOyB9XG4gICAgSFQuX19yZW5ld2luZyA9IHRydWU7XG4gICAgc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICB2YXIgcmVhdXRoX3VybCA9IGBodHRwczovLyR7SFQuc2VydmljZV9kb21haW59L1NoaWJib2xldGguc3NvL0xvZ2luP2VudGl0eUlEPSR7ZW50aXR5SUR9JnRhcmdldD0ke2VuY29kZVVSSUNvbXBvbmVudCh3aW5kb3cubG9jYXRpb24uaHJlZil9YDtcbiAgICAgIHZhciByZXR2YWwgPSB3aW5kb3cuY29uZmlybShgV2UncmUgaGF2aW5nIGEgcHJvYmxlbSB3aXRoIHlvdXIgc2Vzc2lvbjsgc2VsZWN0IE9LIHRvIGxvZyBpbiBhZ2Fpbi5gKTtcbiAgICAgIGlmICggcmV0dmFsICkge1xuICAgICAgICB3aW5kb3cubG9jYXRpb24uaHJlZiA9IHJlYXV0aF91cmw7XG4gICAgICB9XG4gICAgfSwgMTAwKTtcbiAgfVxuXG4gIEhULmFuYWx5dGljcyA9IEhULmFuYWx5dGljcyB8fCB7fTtcbiAgSFQuYW5hbHl0aWNzLmxvZ0FjdGlvbiA9IGZ1bmN0aW9uKGhyZWYsIHRyaWdnZXIpIHtcbiAgICBpZiAoIGhyZWYgPT09IHVuZGVmaW5lZCApIHsgaHJlZiA9IGxvY2F0aW9uLmhyZWYgOyB9XG4gICAgdmFyIGRlbGltID0gaHJlZi5pbmRleE9mKCc7JykgPiAtMSA/ICc7JyA6ICcmJztcbiAgICBpZiAoIHRyaWdnZXIgPT0gbnVsbCApIHsgdHJpZ2dlciA9ICctJzsgfVxuICAgIGhyZWYgKz0gZGVsaW0gKyAnYT0nICsgdHJpZ2dlcjtcbiAgICAvLyAkLmdldChocmVmKTtcbiAgICAkLmFqYXgoaHJlZiwgXG4gICAge1xuICAgICAgY29tcGxldGU6IGZ1bmN0aW9uKHhociwgc3RhdHVzKSB7XG4gICAgICAgIHZhciBlbnRpdHlJRCA9IHhoci5nZXRSZXNwb25zZUhlYWRlcigneC1oYXRoaXRydXN0LXJlbmV3Jyk7XG4gICAgICAgIGlmICggZW50aXR5SUQgKSB7XG4gICAgICAgICAgSFQucmVuZXdfYXV0aChlbnRpdHlJRCwgJ2xvZ0FjdGlvbicpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfSlcbiAgfVxuXG5cbiAgJChcImJvZHlcIikub24oJ2NsaWNrJywgJ2FbZGF0YS10cmFja2luZy1jYXRlZ29yeT1cIm91dExpbmtzXCJdJywgZnVuY3Rpb24oZXZlbnQpIHtcbiAgICAvLyB2YXIgdHJpZ2dlciA9ICQodGhpcykuZGF0YSgndHJhY2tpbmctYWN0aW9uJyk7XG4gICAgLy8gdmFyIGxhYmVsID0gJCh0aGlzKS5kYXRhKCd0cmFja2luZy1sYWJlbCcpO1xuICAgIC8vIGlmICggbGFiZWwgKSB7IHRyaWdnZXIgKz0gJzonICsgbGFiZWw7IH1cbiAgICB2YXIgdHJpZ2dlciA9ICdvdXQnICsgJCh0aGlzKS5hdHRyKCdocmVmJyk7XG4gICAgSFQuYW5hbHl0aWNzLmxvZ0FjdGlvbih1bmRlZmluZWQsIHRyaWdnZXIpO1xuICB9KVxuXG4gIGNvbnNvbGUubG9nKFwiQUhPWSBVUERBVElORyBTVkdcIik7XG4gIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoJ3N2Zy5iaScpLmZvckVhY2goZnVuY3Rpb24oc3ZnKSB7XG4gICAgc3ZnLmlubmVySFRNTCA9IHN2Zy5pbm5lckhUTUw7XG4gIH0pXG5cbn0pIiwiaGVhZC5yZWFkeShmdW5jdGlvbigpIHtcblxuICB2YXIgTU9OVEhTID0gWydKYW51YXJ5JywgJ0ZlYnJ1YXJ5JywgJ01hcmNoJywgJ0FwcmlsJywgJ01heScsICdKdW5lJywgJ0p1bHknLFxuICAgICdBdWd1c3QnLCAnU2VwdGVtYmVyJywgJ09jdG9iZXInLCAnTm92ZW1iZXInLCAnRGVjZW1iZXInXTtcblxuICB2YXIgJGVtZXJnZW5jeV9hY2Nlc3MgPSAkKFwiI2FjY2Vzcy1lbWVyZ2VuY3ktYWNjZXNzXCIpO1xuXG4gIHZhciBkZWx0YSA9IDUgKiA2MCAqIDEwMDA7XG4gIHZhciBsYXN0X3NlY29uZHM7XG4gIHZhciB0b2dnbGVfcmVuZXdfbGluayA9IGZ1bmN0aW9uKGRhdGUpIHtcbiAgICB2YXIgbm93ID0gRGF0ZS5ub3coKTtcbiAgICBpZiAoIG5vdyA+PSBkYXRlLmdldFRpbWUoKSApIHtcbiAgICAgIHZhciAkbGluayA9ICRlbWVyZ2VuY3lfYWNjZXNzLmZpbmQoXCJhW2Rpc2FibGVkXVwiKTtcbiAgICAgICRsaW5rLmF0dHIoXCJkaXNhYmxlZFwiLCBudWxsKTtcbiAgICB9XG4gIH1cblxuICB2YXIgb2JzZXJ2ZV9leHBpcmF0aW9uX3RpbWVzdGFtcCA9IGZ1bmN0aW9uKCkge1xuICAgIGlmICggISBIVCB8fCAhIEhULnBhcmFtcyB8fCAhIEhULnBhcmFtcy5pZCApIHsgcmV0dXJuIDsgfVxuICAgIHZhciBkYXRhID0gJC5jb29raWUoJ0hUZXhwaXJhdGlvbicsIHVuZGVmaW5lZCwgeyBqc29uOiB0cnVlIH0pO1xuICAgIGlmICggISBkYXRhICkgeyByZXR1cm4gOyB9XG4gICAgdmFyIHNlY29uZHMgPSBkYXRhW0hULnBhcmFtcy5pZF07XG4gICAgLy8gY29uc29sZS5sb2coXCJBSE9ZIE9CU0VSVkVcIiwgc2Vjb25kcywgbGFzdF9zZWNvbmRzKTtcbiAgICBpZiAoIHNlY29uZHMgPT0gLTEgKSB7XG4gICAgICB2YXIgJGxpbmsgPSAkZW1lcmdlbmN5X2FjY2Vzcy5maW5kKFwicCBhXCIpLmNsb25lKCk7XG4gICAgICAkZW1lcmdlbmN5X2FjY2Vzcy5maW5kKFwicFwiKS50ZXh0KFwiWW91ciBhY2Nlc3MgaGFzIGV4cGlyZWQgYW5kIGNhbm5vdCBiZSByZW5ld2VkLiBSZWxvYWQgdGhlIHBhZ2Ugb3IgdHJ5IGFnYWluIGxhdGVyLiBBY2Nlc3MgaGFzIGJlZW4gcHJvdmlkZWQgdGhyb3VnaCB0aGUgXCIpO1xuICAgICAgJGVtZXJnZW5jeV9hY2Nlc3MuZmluZChcInBcIikuYXBwZW5kKCRsaW5rKTtcbiAgICAgIHZhciAkYWN0aW9uID0gJGVtZXJnZW5jeV9hY2Nlc3MuZmluZChcIi5hbGVydC0tZW1lcmdlbmN5LWFjY2Vzcy0tb3B0aW9ucyBhXCIpO1xuICAgICAgJGFjdGlvbi5hdHRyKCdocmVmJywgd2luZG93LmxvY2F0aW9uLmhyZWYpO1xuICAgICAgJGFjdGlvbi50ZXh0KCdSZWxvYWQnKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgaWYgKCBzZWNvbmRzID4gbGFzdF9zZWNvbmRzICkge1xuICAgICAgdmFyIG1lc3NhZ2UgPSB0aW1lMm1lc3NhZ2Uoc2Vjb25kcyk7XG4gICAgICBsYXN0X3NlY29uZHMgPSBzZWNvbmRzO1xuICAgICAgJGVtZXJnZW5jeV9hY2Nlc3MuZmluZChcIi5leHBpcmVzLWRpc3BsYXlcIikudGV4dChtZXNzYWdlKTtcbiAgICB9XG4gIH1cblxuICB2YXIgdGltZTJtZXNzYWdlID0gZnVuY3Rpb24oc2Vjb25kcykge1xuICAgIHZhciBkYXRlID0gbmV3IERhdGUoc2Vjb25kcyAqIDEwMDApO1xuICAgIHZhciBob3VycyA9IGRhdGUuZ2V0SG91cnMoKTtcbiAgICB2YXIgYW1wbSA9ICdBTSc7XG4gICAgaWYgKCBob3VycyA+IDEyICkgeyBob3VycyAtPSAxMjsgYW1wbSA9ICdQTSc7IH1cbiAgICBpZiAoIGhvdXJzID09IDEyICl7IGFtcG0gPSAnUE0nOyB9XG4gICAgdmFyIG1pbnV0ZXMgPSBkYXRlLmdldE1pbnV0ZXMoKTtcbiAgICBpZiAoIG1pbnV0ZXMgPCAxMCApIHsgbWludXRlcyA9IGAwJHttaW51dGVzfWA7IH1cbiAgICB2YXIgbWVzc2FnZSA9IGAke2hvdXJzfToke21pbnV0ZXN9JHthbXBtfSAke01PTlRIU1tkYXRlLmdldE1vbnRoKCldfSAke2RhdGUuZ2V0RGF0ZSgpfWA7XG4gICAgcmV0dXJuIG1lc3NhZ2U7XG4gIH1cblxuICBpZiAoICRlbWVyZ2VuY3lfYWNjZXNzLmxlbmd0aCApIHtcbiAgICB2YXIgZXhwaXJhdGlvbiA9ICRlbWVyZ2VuY3lfYWNjZXNzLmRhdGEoJ2FjY2Vzc0V4cGlyZXMnKTtcbiAgICB2YXIgc2Vjb25kcyA9IHBhcnNlSW50KCRlbWVyZ2VuY3lfYWNjZXNzLmRhdGEoJ2FjY2Vzc0V4cGlyZXNTZWNvbmRzJyksIDEwKTtcbiAgICB2YXIgZ3JhbnRlZCA9ICRlbWVyZ2VuY3lfYWNjZXNzLmRhdGEoJ2FjY2Vzc0dyYW50ZWQnKTtcblxuICAgIHZhciBub3cgPSBEYXRlLm5vdygpIC8gMTAwMDtcbiAgICB2YXIgbWVzc2FnZSA9IHRpbWUybWVzc2FnZShzZWNvbmRzKTtcbiAgICAkZW1lcmdlbmN5X2FjY2Vzcy5maW5kKFwiLmV4cGlyZXMtZGlzcGxheVwiKS50ZXh0KG1lc3NhZ2UpO1xuICAgICRlbWVyZ2VuY3lfYWNjZXNzLmdldCgwKS5kYXRhc2V0LmluaXRpYWxpemVkID0gJ3RydWUnXG5cbiAgICBpZiAoIGdyYW50ZWQgKSB7XG4gICAgICAvLyBzZXQgdXAgYSB3YXRjaCBmb3IgdGhlIGV4cGlyYXRpb24gdGltZVxuICAgICAgbGFzdF9zZWNvbmRzID0gc2Vjb25kcztcbiAgICAgIHNldEludGVydmFsKGZ1bmN0aW9uKCkge1xuICAgICAgICAvLyB0b2dnbGVfcmVuZXdfbGluayhkYXRlKTtcbiAgICAgICAgb2JzZXJ2ZV9leHBpcmF0aW9uX3RpbWVzdGFtcCgpO1xuICAgICAgfSwgNTAwKTtcbiAgICB9XG4gIH1cblxuICBpZiAoJCgnI2FjY2Vzc0Jhbm5lcklEJykubGVuZ3RoID4gMCkge1xuICAgICAgdmFyIHN1cHByZXNzID0gJCgnaHRtbCcpLmhhc0NsYXNzKCdzdXBhY2NiYW4nKTtcbiAgICAgIGlmIChzdXBwcmVzcykge1xuICAgICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICAgIHZhciBkZWJ1ZyA9ICQoJ2h0bWwnKS5oYXNDbGFzcygnaHRkZXYnKTtcbiAgICAgIHZhciBpZGhhc2ggPSAkLmNvb2tpZSgnYWNjZXNzLmhhdGhpdHJ1c3Qub3JnJywgdW5kZWZpbmVkLCB7anNvbiA6IHRydWV9KTtcbiAgICAgIHZhciB1cmwgPSAkLnVybCgpOyAvLyBwYXJzZSB0aGUgY3VycmVudCBwYWdlIFVSTFxuICAgICAgdmFyIGN1cnJpZCA9IHVybC5wYXJhbSgnaWQnKTtcbiAgICAgIGlmIChpZGhhc2ggPT0gbnVsbCkge1xuICAgICAgICAgIGlkaGFzaCA9IHt9O1xuICAgICAgfVxuXG4gICAgICB2YXIgaWRzID0gW107XG4gICAgICBmb3IgKHZhciBpZCBpbiBpZGhhc2gpIHtcbiAgICAgICAgICBpZiAoaWRoYXNoLmhhc093blByb3BlcnR5KGlkKSkge1xuICAgICAgICAgICAgICBpZHMucHVzaChpZCk7XG4gICAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBpZiAoKGlkcy5pbmRleE9mKGN1cnJpZCkgPCAwKSB8fCBkZWJ1Zykge1xuICAgICAgICAgIGlkaGFzaFtjdXJyaWRdID0gMTtcbiAgICAgICAgICAvLyBzZXNzaW9uIGNvb2tpZVxuICAgICAgICAgICQuY29va2llKCdhY2Nlc3MuaGF0aGl0cnVzdC5vcmcnLCBpZGhhc2gsIHsganNvbiA6IHRydWUsIHBhdGg6ICcvJywgZG9tYWluOiAnLmhhdGhpdHJ1c3Qub3JnJyB9KTtcblxuICAgICAgICAgIGZ1bmN0aW9uIHNob3dBbGVydCgpIHtcbiAgICAgICAgICAgICAgdmFyIGh0bWwgPSAkKCcjYWNjZXNzQmFubmVySUQnKS5odG1sKCk7XG4gICAgICAgICAgICAgIHZhciAkYWxlcnQgPSBib290Ym94LmRpYWxvZyhodG1sLCBbeyBsYWJlbDogXCJPS1wiLCBcImNsYXNzXCIgOiBcImJ0biBidG4tcHJpbWFyeSBidG4tZGlzbWlzc1wiIH1dLCB7IGhlYWRlciA6ICdTcGVjaWFsIGFjY2VzcycsIHJvbGU6ICdhbGVydGRpYWxvZycgfSk7XG4gICAgICAgICAgfVxuICAgICAgICAgIHdpbmRvdy5zZXRUaW1lb3V0KHNob3dBbGVydCwgMzAwMCwgdHJ1ZSk7XG4gICAgICB9XG4gIH1cblxufSkiLCIvKlxuICogY2xhc3NMaXN0LmpzOiBDcm9zcy1icm93c2VyIGZ1bGwgZWxlbWVudC5jbGFzc0xpc3QgaW1wbGVtZW50YXRpb24uXG4gKiAxLjIuMjAxNzEyMTBcbiAqXG4gKiBCeSBFbGkgR3JleSwgaHR0cDovL2VsaWdyZXkuY29tXG4gKiBMaWNlbnNlOiBEZWRpY2F0ZWQgdG8gdGhlIHB1YmxpYyBkb21haW4uXG4gKiAgIFNlZSBodHRwczovL2dpdGh1Yi5jb20vZWxpZ3JleS9jbGFzc0xpc3QuanMvYmxvYi9tYXN0ZXIvTElDRU5TRS5tZFxuICovXG5cbi8qZ2xvYmFsIHNlbGYsIGRvY3VtZW50LCBET01FeGNlcHRpb24gKi9cblxuLyohIEBzb3VyY2UgaHR0cDovL3B1cmwuZWxpZ3JleS5jb20vZ2l0aHViL2NsYXNzTGlzdC5qcy9ibG9iL21hc3Rlci9jbGFzc0xpc3QuanMgKi9cblxuaWYgKFwiZG9jdW1lbnRcIiBpbiBzZWxmKSB7XG5cbi8vIEZ1bGwgcG9seWZpbGwgZm9yIGJyb3dzZXJzIHdpdGggbm8gY2xhc3NMaXN0IHN1cHBvcnRcbi8vIEluY2x1ZGluZyBJRSA8IEVkZ2UgbWlzc2luZyBTVkdFbGVtZW50LmNsYXNzTGlzdFxuaWYgKFxuXHQgICAhKFwiY2xhc3NMaXN0XCIgaW4gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcIl9cIikpIFxuXHR8fCBkb2N1bWVudC5jcmVhdGVFbGVtZW50TlNcblx0JiYgIShcImNsYXNzTGlzdFwiIGluIGRvY3VtZW50LmNyZWF0ZUVsZW1lbnROUyhcImh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnXCIsXCJnXCIpKVxuKSB7XG5cbihmdW5jdGlvbiAodmlldykge1xuXG5cInVzZSBzdHJpY3RcIjtcblxuaWYgKCEoJ0VsZW1lbnQnIGluIHZpZXcpKSByZXR1cm47XG5cbnZhclxuXHQgIGNsYXNzTGlzdFByb3AgPSBcImNsYXNzTGlzdFwiXG5cdCwgcHJvdG9Qcm9wID0gXCJwcm90b3R5cGVcIlxuXHQsIGVsZW1DdHJQcm90byA9IHZpZXcuRWxlbWVudFtwcm90b1Byb3BdXG5cdCwgb2JqQ3RyID0gT2JqZWN0XG5cdCwgc3RyVHJpbSA9IFN0cmluZ1twcm90b1Byb3BdLnRyaW0gfHwgZnVuY3Rpb24gKCkge1xuXHRcdHJldHVybiB0aGlzLnJlcGxhY2UoL15cXHMrfFxccyskL2csIFwiXCIpO1xuXHR9XG5cdCwgYXJySW5kZXhPZiA9IEFycmF5W3Byb3RvUHJvcF0uaW5kZXhPZiB8fCBmdW5jdGlvbiAoaXRlbSkge1xuXHRcdHZhclxuXHRcdFx0ICBpID0gMFxuXHRcdFx0LCBsZW4gPSB0aGlzLmxlbmd0aFxuXHRcdDtcblx0XHRmb3IgKDsgaSA8IGxlbjsgaSsrKSB7XG5cdFx0XHRpZiAoaSBpbiB0aGlzICYmIHRoaXNbaV0gPT09IGl0ZW0pIHtcblx0XHRcdFx0cmV0dXJuIGk7XG5cdFx0XHR9XG5cdFx0fVxuXHRcdHJldHVybiAtMTtcblx0fVxuXHQvLyBWZW5kb3JzOiBwbGVhc2UgYWxsb3cgY29udGVudCBjb2RlIHRvIGluc3RhbnRpYXRlIERPTUV4Y2VwdGlvbnNcblx0LCBET01FeCA9IGZ1bmN0aW9uICh0eXBlLCBtZXNzYWdlKSB7XG5cdFx0dGhpcy5uYW1lID0gdHlwZTtcblx0XHR0aGlzLmNvZGUgPSBET01FeGNlcHRpb25bdHlwZV07XG5cdFx0dGhpcy5tZXNzYWdlID0gbWVzc2FnZTtcblx0fVxuXHQsIGNoZWNrVG9rZW5BbmRHZXRJbmRleCA9IGZ1bmN0aW9uIChjbGFzc0xpc3QsIHRva2VuKSB7XG5cdFx0aWYgKHRva2VuID09PSBcIlwiKSB7XG5cdFx0XHR0aHJvdyBuZXcgRE9NRXgoXG5cdFx0XHRcdCAgXCJTWU5UQVhfRVJSXCJcblx0XHRcdFx0LCBcIlRoZSB0b2tlbiBtdXN0IG5vdCBiZSBlbXB0eS5cIlxuXHRcdFx0KTtcblx0XHR9XG5cdFx0aWYgKC9cXHMvLnRlc3QodG9rZW4pKSB7XG5cdFx0XHR0aHJvdyBuZXcgRE9NRXgoXG5cdFx0XHRcdCAgXCJJTlZBTElEX0NIQVJBQ1RFUl9FUlJcIlxuXHRcdFx0XHQsIFwiVGhlIHRva2VuIG11c3Qgbm90IGNvbnRhaW4gc3BhY2UgY2hhcmFjdGVycy5cIlxuXHRcdFx0KTtcblx0XHR9XG5cdFx0cmV0dXJuIGFyckluZGV4T2YuY2FsbChjbGFzc0xpc3QsIHRva2VuKTtcblx0fVxuXHQsIENsYXNzTGlzdCA9IGZ1bmN0aW9uIChlbGVtKSB7XG5cdFx0dmFyXG5cdFx0XHQgIHRyaW1tZWRDbGFzc2VzID0gc3RyVHJpbS5jYWxsKGVsZW0uZ2V0QXR0cmlidXRlKFwiY2xhc3NcIikgfHwgXCJcIilcblx0XHRcdCwgY2xhc3NlcyA9IHRyaW1tZWRDbGFzc2VzID8gdHJpbW1lZENsYXNzZXMuc3BsaXQoL1xccysvKSA6IFtdXG5cdFx0XHQsIGkgPSAwXG5cdFx0XHQsIGxlbiA9IGNsYXNzZXMubGVuZ3RoXG5cdFx0O1xuXHRcdGZvciAoOyBpIDwgbGVuOyBpKyspIHtcblx0XHRcdHRoaXMucHVzaChjbGFzc2VzW2ldKTtcblx0XHR9XG5cdFx0dGhpcy5fdXBkYXRlQ2xhc3NOYW1lID0gZnVuY3Rpb24gKCkge1xuXHRcdFx0ZWxlbS5zZXRBdHRyaWJ1dGUoXCJjbGFzc1wiLCB0aGlzLnRvU3RyaW5nKCkpO1xuXHRcdH07XG5cdH1cblx0LCBjbGFzc0xpc3RQcm90byA9IENsYXNzTGlzdFtwcm90b1Byb3BdID0gW11cblx0LCBjbGFzc0xpc3RHZXR0ZXIgPSBmdW5jdGlvbiAoKSB7XG5cdFx0cmV0dXJuIG5ldyBDbGFzc0xpc3QodGhpcyk7XG5cdH1cbjtcbi8vIE1vc3QgRE9NRXhjZXB0aW9uIGltcGxlbWVudGF0aW9ucyBkb24ndCBhbGxvdyBjYWxsaW5nIERPTUV4Y2VwdGlvbidzIHRvU3RyaW5nKClcbi8vIG9uIG5vbi1ET01FeGNlcHRpb25zLiBFcnJvcidzIHRvU3RyaW5nKCkgaXMgc3VmZmljaWVudCBoZXJlLlxuRE9NRXhbcHJvdG9Qcm9wXSA9IEVycm9yW3Byb3RvUHJvcF07XG5jbGFzc0xpc3RQcm90by5pdGVtID0gZnVuY3Rpb24gKGkpIHtcblx0cmV0dXJuIHRoaXNbaV0gfHwgbnVsbDtcbn07XG5jbGFzc0xpc3RQcm90by5jb250YWlucyA9IGZ1bmN0aW9uICh0b2tlbikge1xuXHRyZXR1cm4gfmNoZWNrVG9rZW5BbmRHZXRJbmRleCh0aGlzLCB0b2tlbiArIFwiXCIpO1xufTtcbmNsYXNzTGlzdFByb3RvLmFkZCA9IGZ1bmN0aW9uICgpIHtcblx0dmFyXG5cdFx0ICB0b2tlbnMgPSBhcmd1bWVudHNcblx0XHQsIGkgPSAwXG5cdFx0LCBsID0gdG9rZW5zLmxlbmd0aFxuXHRcdCwgdG9rZW5cblx0XHQsIHVwZGF0ZWQgPSBmYWxzZVxuXHQ7XG5cdGRvIHtcblx0XHR0b2tlbiA9IHRva2Vuc1tpXSArIFwiXCI7XG5cdFx0aWYgKCF+Y2hlY2tUb2tlbkFuZEdldEluZGV4KHRoaXMsIHRva2VuKSkge1xuXHRcdFx0dGhpcy5wdXNoKHRva2VuKTtcblx0XHRcdHVwZGF0ZWQgPSB0cnVlO1xuXHRcdH1cblx0fVxuXHR3aGlsZSAoKytpIDwgbCk7XG5cblx0aWYgKHVwZGF0ZWQpIHtcblx0XHR0aGlzLl91cGRhdGVDbGFzc05hbWUoKTtcblx0fVxufTtcbmNsYXNzTGlzdFByb3RvLnJlbW92ZSA9IGZ1bmN0aW9uICgpIHtcblx0dmFyXG5cdFx0ICB0b2tlbnMgPSBhcmd1bWVudHNcblx0XHQsIGkgPSAwXG5cdFx0LCBsID0gdG9rZW5zLmxlbmd0aFxuXHRcdCwgdG9rZW5cblx0XHQsIHVwZGF0ZWQgPSBmYWxzZVxuXHRcdCwgaW5kZXhcblx0O1xuXHRkbyB7XG5cdFx0dG9rZW4gPSB0b2tlbnNbaV0gKyBcIlwiO1xuXHRcdGluZGV4ID0gY2hlY2tUb2tlbkFuZEdldEluZGV4KHRoaXMsIHRva2VuKTtcblx0XHR3aGlsZSAofmluZGV4KSB7XG5cdFx0XHR0aGlzLnNwbGljZShpbmRleCwgMSk7XG5cdFx0XHR1cGRhdGVkID0gdHJ1ZTtcblx0XHRcdGluZGV4ID0gY2hlY2tUb2tlbkFuZEdldEluZGV4KHRoaXMsIHRva2VuKTtcblx0XHR9XG5cdH1cblx0d2hpbGUgKCsraSA8IGwpO1xuXG5cdGlmICh1cGRhdGVkKSB7XG5cdFx0dGhpcy5fdXBkYXRlQ2xhc3NOYW1lKCk7XG5cdH1cbn07XG5jbGFzc0xpc3RQcm90by50b2dnbGUgPSBmdW5jdGlvbiAodG9rZW4sIGZvcmNlKSB7XG5cdHZhclxuXHRcdCAgcmVzdWx0ID0gdGhpcy5jb250YWlucyh0b2tlbilcblx0XHQsIG1ldGhvZCA9IHJlc3VsdCA/XG5cdFx0XHRmb3JjZSAhPT0gdHJ1ZSAmJiBcInJlbW92ZVwiXG5cdFx0OlxuXHRcdFx0Zm9yY2UgIT09IGZhbHNlICYmIFwiYWRkXCJcblx0O1xuXG5cdGlmIChtZXRob2QpIHtcblx0XHR0aGlzW21ldGhvZF0odG9rZW4pO1xuXHR9XG5cblx0aWYgKGZvcmNlID09PSB0cnVlIHx8IGZvcmNlID09PSBmYWxzZSkge1xuXHRcdHJldHVybiBmb3JjZTtcblx0fSBlbHNlIHtcblx0XHRyZXR1cm4gIXJlc3VsdDtcblx0fVxufTtcbmNsYXNzTGlzdFByb3RvLnJlcGxhY2UgPSBmdW5jdGlvbiAodG9rZW4sIHJlcGxhY2VtZW50X3Rva2VuKSB7XG5cdHZhciBpbmRleCA9IGNoZWNrVG9rZW5BbmRHZXRJbmRleCh0b2tlbiArIFwiXCIpO1xuXHRpZiAofmluZGV4KSB7XG5cdFx0dGhpcy5zcGxpY2UoaW5kZXgsIDEsIHJlcGxhY2VtZW50X3Rva2VuKTtcblx0XHR0aGlzLl91cGRhdGVDbGFzc05hbWUoKTtcblx0fVxufVxuY2xhc3NMaXN0UHJvdG8udG9TdHJpbmcgPSBmdW5jdGlvbiAoKSB7XG5cdHJldHVybiB0aGlzLmpvaW4oXCIgXCIpO1xufTtcblxuaWYgKG9iakN0ci5kZWZpbmVQcm9wZXJ0eSkge1xuXHR2YXIgY2xhc3NMaXN0UHJvcERlc2MgPSB7XG5cdFx0ICBnZXQ6IGNsYXNzTGlzdEdldHRlclxuXHRcdCwgZW51bWVyYWJsZTogdHJ1ZVxuXHRcdCwgY29uZmlndXJhYmxlOiB0cnVlXG5cdH07XG5cdHRyeSB7XG5cdFx0b2JqQ3RyLmRlZmluZVByb3BlcnR5KGVsZW1DdHJQcm90bywgY2xhc3NMaXN0UHJvcCwgY2xhc3NMaXN0UHJvcERlc2MpO1xuXHR9IGNhdGNoIChleCkgeyAvLyBJRSA4IGRvZXNuJ3Qgc3VwcG9ydCBlbnVtZXJhYmxlOnRydWVcblx0XHQvLyBhZGRpbmcgdW5kZWZpbmVkIHRvIGZpZ2h0IHRoaXMgaXNzdWUgaHR0cHM6Ly9naXRodWIuY29tL2VsaWdyZXkvY2xhc3NMaXN0LmpzL2lzc3Vlcy8zNlxuXHRcdC8vIG1vZGVybmllIElFOC1NU1c3IG1hY2hpbmUgaGFzIElFOCA4LjAuNjAwMS4xODcwMiBhbmQgaXMgYWZmZWN0ZWRcblx0XHRpZiAoZXgubnVtYmVyID09PSB1bmRlZmluZWQgfHwgZXgubnVtYmVyID09PSAtMHg3RkY1RUM1NCkge1xuXHRcdFx0Y2xhc3NMaXN0UHJvcERlc2MuZW51bWVyYWJsZSA9IGZhbHNlO1xuXHRcdFx0b2JqQ3RyLmRlZmluZVByb3BlcnR5KGVsZW1DdHJQcm90bywgY2xhc3NMaXN0UHJvcCwgY2xhc3NMaXN0UHJvcERlc2MpO1xuXHRcdH1cblx0fVxufSBlbHNlIGlmIChvYmpDdHJbcHJvdG9Qcm9wXS5fX2RlZmluZUdldHRlcl9fKSB7XG5cdGVsZW1DdHJQcm90by5fX2RlZmluZUdldHRlcl9fKGNsYXNzTGlzdFByb3AsIGNsYXNzTGlzdEdldHRlcik7XG59XG5cbn0oc2VsZikpO1xuXG59XG5cbi8vIFRoZXJlIGlzIGZ1bGwgb3IgcGFydGlhbCBuYXRpdmUgY2xhc3NMaXN0IHN1cHBvcnQsIHNvIGp1c3QgY2hlY2sgaWYgd2UgbmVlZFxuLy8gdG8gbm9ybWFsaXplIHRoZSBhZGQvcmVtb3ZlIGFuZCB0b2dnbGUgQVBJcy5cblxuKGZ1bmN0aW9uICgpIHtcblx0XCJ1c2Ugc3RyaWN0XCI7XG5cblx0dmFyIHRlc3RFbGVtZW50ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcIl9cIik7XG5cblx0dGVzdEVsZW1lbnQuY2xhc3NMaXN0LmFkZChcImMxXCIsIFwiYzJcIik7XG5cblx0Ly8gUG9seWZpbGwgZm9yIElFIDEwLzExIGFuZCBGaXJlZm94IDwyNiwgd2hlcmUgY2xhc3NMaXN0LmFkZCBhbmRcblx0Ly8gY2xhc3NMaXN0LnJlbW92ZSBleGlzdCBidXQgc3VwcG9ydCBvbmx5IG9uZSBhcmd1bWVudCBhdCBhIHRpbWUuXG5cdGlmICghdGVzdEVsZW1lbnQuY2xhc3NMaXN0LmNvbnRhaW5zKFwiYzJcIikpIHtcblx0XHR2YXIgY3JlYXRlTWV0aG9kID0gZnVuY3Rpb24obWV0aG9kKSB7XG5cdFx0XHR2YXIgb3JpZ2luYWwgPSBET01Ub2tlbkxpc3QucHJvdG90eXBlW21ldGhvZF07XG5cblx0XHRcdERPTVRva2VuTGlzdC5wcm90b3R5cGVbbWV0aG9kXSA9IGZ1bmN0aW9uKHRva2VuKSB7XG5cdFx0XHRcdHZhciBpLCBsZW4gPSBhcmd1bWVudHMubGVuZ3RoO1xuXG5cdFx0XHRcdGZvciAoaSA9IDA7IGkgPCBsZW47IGkrKykge1xuXHRcdFx0XHRcdHRva2VuID0gYXJndW1lbnRzW2ldO1xuXHRcdFx0XHRcdG9yaWdpbmFsLmNhbGwodGhpcywgdG9rZW4pO1xuXHRcdFx0XHR9XG5cdFx0XHR9O1xuXHRcdH07XG5cdFx0Y3JlYXRlTWV0aG9kKCdhZGQnKTtcblx0XHRjcmVhdGVNZXRob2QoJ3JlbW92ZScpO1xuXHR9XG5cblx0dGVzdEVsZW1lbnQuY2xhc3NMaXN0LnRvZ2dsZShcImMzXCIsIGZhbHNlKTtcblxuXHQvLyBQb2x5ZmlsbCBmb3IgSUUgMTAgYW5kIEZpcmVmb3ggPDI0LCB3aGVyZSBjbGFzc0xpc3QudG9nZ2xlIGRvZXMgbm90XG5cdC8vIHN1cHBvcnQgdGhlIHNlY29uZCBhcmd1bWVudC5cblx0aWYgKHRlc3RFbGVtZW50LmNsYXNzTGlzdC5jb250YWlucyhcImMzXCIpKSB7XG5cdFx0dmFyIF90b2dnbGUgPSBET01Ub2tlbkxpc3QucHJvdG90eXBlLnRvZ2dsZTtcblxuXHRcdERPTVRva2VuTGlzdC5wcm90b3R5cGUudG9nZ2xlID0gZnVuY3Rpb24odG9rZW4sIGZvcmNlKSB7XG5cdFx0XHRpZiAoMSBpbiBhcmd1bWVudHMgJiYgIXRoaXMuY29udGFpbnModG9rZW4pID09PSAhZm9yY2UpIHtcblx0XHRcdFx0cmV0dXJuIGZvcmNlO1xuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0cmV0dXJuIF90b2dnbGUuY2FsbCh0aGlzLCB0b2tlbik7XG5cdFx0XHR9XG5cdFx0fTtcblxuXHR9XG5cblx0Ly8gcmVwbGFjZSgpIHBvbHlmaWxsXG5cdGlmICghKFwicmVwbGFjZVwiIGluIGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJfXCIpLmNsYXNzTGlzdCkpIHtcblx0XHRET01Ub2tlbkxpc3QucHJvdG90eXBlLnJlcGxhY2UgPSBmdW5jdGlvbiAodG9rZW4sIHJlcGxhY2VtZW50X3Rva2VuKSB7XG5cdFx0XHR2YXJcblx0XHRcdFx0ICB0b2tlbnMgPSB0aGlzLnRvU3RyaW5nKCkuc3BsaXQoXCIgXCIpXG5cdFx0XHRcdCwgaW5kZXggPSB0b2tlbnMuaW5kZXhPZih0b2tlbiArIFwiXCIpXG5cdFx0XHQ7XG5cdFx0XHRpZiAofmluZGV4KSB7XG5cdFx0XHRcdHRva2VucyA9IHRva2Vucy5zbGljZShpbmRleCk7XG5cdFx0XHRcdHRoaXMucmVtb3ZlLmFwcGx5KHRoaXMsIHRva2Vucyk7XG5cdFx0XHRcdHRoaXMuYWRkKHJlcGxhY2VtZW50X3Rva2VuKTtcblx0XHRcdFx0dGhpcy5hZGQuYXBwbHkodGhpcywgdG9rZW5zLnNsaWNlKDEpKTtcblx0XHRcdH1cblx0XHR9XG5cdH1cblxuXHR0ZXN0RWxlbWVudCA9IG51bGw7XG59KCkpO1xuXG59IiwiaGVhZC5yZWFkeShmdW5jdGlvbigpIHtcblxuICAgIHZhciBERUZBVUxUX0NPTExfTUVOVV9PUFRJT04gPSBcImFcIjtcbiAgICB2YXIgTkVXX0NPTExfTUVOVV9PUFRJT04gPSAnX19ORVdfXyc7IC8vIFwiYlwiO1xuXG4gICAgdmFyIElOX1lPVVJfQ09MTFNfTEFCRUwgPSAnVGhpcyBpdGVtIGlzIGluIHlvdXIgY29sbGVjdGlvbihzKTonO1xuXG4gICAgdmFyICR0b29sYmFyID0gJChcIi5jb2xsZWN0aW9uTGlua3MgLnNlbGVjdC1jb2xsZWN0aW9uXCIpO1xuICAgIHZhciAkZXJyb3Jtc2cgPSAkKFwiLmVycm9ybXNnXCIpO1xuICAgIHZhciAkaW5mb21zZyA9ICQoXCIuaW5mb21zZ1wiKTtcblxuICAgIGZ1bmN0aW9uIGRpc3BsYXlfZXJyb3IobXNnKSB7XG4gICAgICAgIGlmICggISAkZXJyb3Jtc2cubGVuZ3RoICkge1xuICAgICAgICAgICAgJGVycm9ybXNnID0gJCgnPGRpdiBjbGFzcz1cImFsZXJ0IGFsZXJ0LWVycm9yIGVycm9ybXNnXCIgc3R5bGU9XCJtYXJnaW4tdG9wOiAwLjVyZW1cIj48L2Rpdj4nKS5pbnNlcnRBZnRlcigkdG9vbGJhcik7XG4gICAgICAgIH1cbiAgICAgICAgJGVycm9ybXNnLnRleHQobXNnKS5zaG93KCk7XG4gICAgICAgIEhULnVwZGF0ZV9zdGF0dXMobXNnKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBkaXNwbGF5X2luZm8obXNnKSB7XG4gICAgICAgIGlmICggISAkaW5mb21zZy5sZW5ndGggKSB7XG4gICAgICAgICAgICAkaW5mb21zZyA9ICQoJzxkaXYgY2xhc3M9XCJhbGVydCBhbGVydC1pbmZvIGluZm9tc2dcIiBzdHlsZT1cIm1hcmdpbi10b3A6IDAuNXJlbVwiPjwvZGl2PicpLmluc2VydEFmdGVyKCR0b29sYmFyKTtcbiAgICAgICAgfVxuICAgICAgICAkaW5mb21zZy50ZXh0KG1zZykuc2hvdygpO1xuICAgICAgICBIVC51cGRhdGVfc3RhdHVzKG1zZyk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gaGlkZV9lcnJvcigpIHtcbiAgICAgICAgJGVycm9ybXNnLmhpZGUoKS50ZXh0KCk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gaGlkZV9pbmZvKCkge1xuICAgICAgICAkaW5mb21zZy5oaWRlKCkudGV4dCgpO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGdldF91cmwoKSB7XG4gICAgICAgIHZhciB1cmwgPSBcIi9jZ2kvbWJcIjtcbiAgICAgICAgaWYgKCBsb2NhdGlvbi5wYXRobmFtZS5pbmRleE9mKFwiL3NoY2dpL1wiKSA+IC0xICkge1xuICAgICAgICAgICAgdXJsID0gXCIvc2hjZ2kvbWJcIjtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdXJsO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIHBhcnNlX2xpbmUoZGF0YSkge1xuICAgICAgICB2YXIgcmV0dmFsID0ge307XG4gICAgICAgIHZhciB0bXAgPSBkYXRhLnNwbGl0KFwifFwiKTtcbiAgICAgICAgZm9yKHZhciBpID0gMDsgaSA8IHRtcC5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgdmFyIGt2ID0gdG1wW2ldLnNwbGl0KFwiPVwiKTtcbiAgICAgICAgICAgIHJldHZhbFtrdlswXV0gPSBrdlsxXTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gcmV0dmFsO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGVkaXRfY29sbGVjdGlvbl9tZXRhZGF0YShhcmdzKSB7XG5cbiAgICAgICAgdmFyIG9wdGlvbnMgPSAkLmV4dGVuZCh7IGNyZWF0aW5nIDogZmFsc2UsIGxhYmVsIDogXCJTYXZlIENoYW5nZXNcIiB9LCBhcmdzKTtcblxuICAgICAgICB2YXIgJGJsb2NrID0gJChcbiAgICAgICAgICAgICc8Zm9ybSBjbGFzcz1cImZvcm0taG9yaXpvbnRhbFwiIGFjdGlvbj1cIm1iXCI+JyArXG4gICAgICAgICAgICAgICAgJzxkaXYgY2xhc3M9XCJjb250cm9sLWdyb3VwXCI+JyArXG4gICAgICAgICAgICAgICAgICAgICc8bGFiZWwgY2xhc3M9XCJjb250cm9sLWxhYmVsXCIgZm9yPVwiZWRpdC1jblwiPkNvbGxlY3Rpb24gTmFtZTwvbGFiZWw+JyArXG4gICAgICAgICAgICAgICAgICAgICc8ZGl2IGNsYXNzPVwiY29udHJvbHNcIj4nICtcbiAgICAgICAgICAgICAgICAgICAgICAgICc8aW5wdXQgdHlwZT1cInRleHRcIiBjbGFzcz1cImlucHV0LWxhcmdlXCIgbWF4bGVuZ3RoPVwiMTAwXCIgbmFtZT1cImNuXCIgaWQ9XCJlZGl0LWNuXCIgdmFsdWU9XCJcIiBwbGFjZWhvbGRlcj1cIllvdXIgY29sbGVjdGlvbiBuYW1lXCIgcmVxdWlyZWQgLz4nICtcbiAgICAgICAgICAgICAgICAgICAgICAgICc8c3BhbiBjbGFzcz1cImxhYmVsIGNvdW50ZXJcIiBpZD1cImVkaXQtY24tY291bnRcIj4xMDA8L3NwYW4+JyArXG4gICAgICAgICAgICAgICAgICAgICc8L2Rpdj4nICtcbiAgICAgICAgICAgICAgICAnPC9kaXY+JyArXG4gICAgICAgICAgICAgICAgJzxkaXYgY2xhc3M9XCJjb250cm9sLWdyb3VwXCI+JyArXG4gICAgICAgICAgICAgICAgICAgICc8bGFiZWwgY2xhc3M9XCJjb250cm9sLWxhYmVsXCIgZm9yPVwiZWRpdC1kZXNjXCI+RGVzY3JpcHRpb248L2xhYmVsPicgK1xuICAgICAgICAgICAgICAgICAgICAnPGRpdiBjbGFzcz1cImNvbnRyb2xzXCI+JyArXG4gICAgICAgICAgICAgICAgICAgICAgICAnPHRleHRhcmVhIGlkPVwiZWRpdC1kZXNjXCIgbmFtZT1cImRlc2NcIiByb3dzPVwiNFwiIG1heGxlbmd0aD1cIjI1NVwiIGNsYXNzPVwiaW5wdXQtbGFyZ2VcIiBwbGFjZWhvbGRlcj1cIkFkZCB5b3VyIGNvbGxlY3Rpb24gZGVzY3JpcHRpb24uXCI+PC90ZXh0YXJlYT4nICtcbiAgICAgICAgICAgICAgICAgICAgICAgICc8c3BhbiBjbGFzcz1cImxhYmVsIGNvdW50ZXJcIiBpZD1cImVkaXQtZGVzYy1jb3VudFwiPjI1NTwvc3Bhbj4nICtcbiAgICAgICAgICAgICAgICAgICAgJzwvZGl2PicgK1xuICAgICAgICAgICAgICAgICc8L2Rpdj4nICtcbiAgICAgICAgICAgICAgICAnPGRpdiBjbGFzcz1cImNvbnRyb2wtZ3JvdXBcIj4nICtcbiAgICAgICAgICAgICAgICAgICAgJzxsYWJlbCBjbGFzcz1cImNvbnRyb2wtbGFiZWxcIj5JcyB0aGlzIGNvbGxlY3Rpb24gPHN0cm9uZz5QdWJsaWM8L3N0cm9uZz4gb3IgPHN0cm9uZz5Qcml2YXRlPC9zdHJvbmc+PzwvbGFiZWw+JyArXG4gICAgICAgICAgICAgICAgICAgICc8ZGl2IGNsYXNzPVwiY29udHJvbHNcIj4nICtcbiAgICAgICAgICAgICAgICAgICAgICAgICc8aW5wdXQgdHlwZT1cInJhZGlvXCIgbmFtZT1cInNocmRcIiBpZD1cImVkaXQtc2hyZC0wXCIgdmFsdWU9XCIwXCIgY2hlY2tlZD1cImNoZWNrZWRcIiA+ICcgK1xuICAgICAgICAgICAgICAgICAgICAgICAgJzxsYWJlbCBjbGFzcz1cInJhZGlvIGlubGluZVwiIGZvcj1cImVkaXQtc2hyZC0wXCI+JyArXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgJ1ByaXZhdGUgJyArXG4gICAgICAgICAgICAgICAgICAgICAgICAnPC9sYWJlbD4nICtcbiAgICAgICAgICAgICAgICAgICAgICAgICc8aW5wdXQgdHlwZT1cInJhZGlvXCIgbmFtZT1cInNocmRcIiBpZD1cImVkaXQtc2hyZC0xXCIgdmFsdWU9XCIxXCIgPiAnICtcbiAgICAgICAgICAgICAgICAgICAgICAgICc8bGFiZWwgY2xhc3M9XCJyYWRpbyBpbmxpbmVcIiBmb3I9XCJlZGl0LXNocmQtMVwiPicgK1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICdQdWJsaWMgJyArXG4gICAgICAgICAgICAgICAgICAgICAgICAnPC9sYWJlbD4nICtcbiAgICAgICAgICAgICAgICAgICAgJzwvZGl2PicgK1xuICAgICAgICAgICAgICAgICc8L2Rpdj4nICtcbiAgICAgICAgICAgICc8L2Zvcm0+J1xuICAgICAgICApO1xuXG4gICAgICAgIGlmICggb3B0aW9ucy5jbiApIHtcbiAgICAgICAgICAgICRibG9jay5maW5kKFwiaW5wdXRbbmFtZT1jbl1cIikudmFsKG9wdGlvbnMuY24pO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKCBvcHRpb25zLmRlc2MgKSB7XG4gICAgICAgICAgICAkYmxvY2suZmluZChcInRleHRhcmVhW25hbWU9ZGVzY11cIikudmFsKG9wdGlvbnMuZGVzYyk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoIG9wdGlvbnMuc2hyZCAhPSBudWxsICkge1xuICAgICAgICAgICAgJGJsb2NrLmZpbmQoXCJpbnB1dFtuYW1lPXNocmRdW3ZhbHVlPVwiICsgb3B0aW9ucy5zaHJkICsgJ10nKS5hdHRyKFwiY2hlY2tlZFwiLCBcImNoZWNrZWRcIik7XG4gICAgICAgIH0gZWxzZSBpZiAoICEgSFQubG9naW5fc3RhdHVzLmxvZ2dlZF9pbiApIHtcbiAgICAgICAgICAgICRibG9jay5maW5kKFwiaW5wdXRbbmFtZT1zaHJkXVt2YWx1ZT0wXVwiKS5hdHRyKFwiY2hlY2tlZFwiLCBcImNoZWNrZWRcIik7XG4gICAgICAgICAgICAkKCc8ZGl2IGNsYXNzPVwiYWxlcnQgYWxlcnQtaW5mb1wiPjxzdHJvbmc+VGhpcyBjb2xsZWN0aW9uIHdpbGwgYmUgdGVtcG9yYXJ5PC9zdHJvbmc+LiBMb2cgaW4gdG8gY3JlYXRlIHBlcm1hbmVudCBhbmQgcHVibGljIGNvbGxlY3Rpb25zLjwvZGl2PicpLmFwcGVuZFRvKCRibG9jayk7XG4gICAgICAgICAgICAvLyByZW1vdmUgdGhlIDxsYWJlbD4gdGhhdCB3cmFwcyB0aGUgcmFkaW8gYnV0dG9uXG4gICAgICAgICAgICAkYmxvY2suZmluZChcImlucHV0W25hbWU9c2hyZF1bdmFsdWU9MV1cIikucmVtb3ZlKCk7XG4gICAgICAgICAgICAkYmxvY2suZmluZChcImxhYmVsW2Zvcj0nZWRpdC1zaHJkLTEnXVwiKS5yZW1vdmUoKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICggb3B0aW9ucy4kaGlkZGVuICkge1xuICAgICAgICAgICAgb3B0aW9ucy4kaGlkZGVuLmNsb25lKCkuYXBwZW5kVG8oJGJsb2NrKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICQoXCI8aW5wdXQgdHlwZT0naGlkZGVuJyBuYW1lPSdjJyAvPlwiKS5hcHBlbmRUbygkYmxvY2spLnZhbChvcHRpb25zLmMpO1xuICAgICAgICAgICAgJChcIjxpbnB1dCB0eXBlPSdoaWRkZW4nIG5hbWU9J2EnIC8+XCIpLmFwcGVuZFRvKCRibG9jaykudmFsKG9wdGlvbnMuYSk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoIG9wdGlvbnMuaWlkICkge1xuICAgICAgICAgICAgJChcIjxpbnB1dCB0eXBlPSdoaWRkZW4nIG5hbWU9J2lpZCcgLz5cIikuYXBwZW5kVG8oJGJsb2NrKS52YWwob3B0aW9ucy5paWQpO1xuICAgICAgICB9XG5cbiAgICAgICAgdmFyICRkaWFsb2cgPSBib290Ym94LmRpYWxvZygkYmxvY2ssIFtcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBcImxhYmVsXCIgOiBcIkNhbmNlbFwiLFxuICAgICAgICAgICAgICAgIFwiY2xhc3NcIiA6IFwiYnRuLWRpc21pc3NcIlxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBcImxhYmVsXCIgOiBvcHRpb25zLmxhYmVsLFxuICAgICAgICAgICAgICAgIFwiY2xhc3NcIiA6IFwiYnRuIGJ0bi1wcmltYXJ5IGJ0bi1kaXNtaXNzXCIsXG4gICAgICAgICAgICAgICAgY2FsbGJhY2sgOiBmdW5jdGlvbigpIHtcblxuICAgICAgICAgICAgICAgICAgICB2YXIgZm9ybSA9ICRibG9jay5nZXQoMCk7XG4gICAgICAgICAgICAgICAgICAgIGlmICggISBmb3JtLmNoZWNrVmFsaWRpdHkoKSApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGZvcm0ucmVwb3J0VmFsaWRpdHkoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIHZhciBjbiA9ICQudHJpbSgkYmxvY2suZmluZChcImlucHV0W25hbWU9Y25dXCIpLnZhbCgpKTtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGRlc2MgPSAkLnRyaW0oJGJsb2NrLmZpbmQoXCJ0ZXh0YXJlYVtuYW1lPWRlc2NdXCIpLnZhbCgpKTtcblxuICAgICAgICAgICAgICAgICAgICBpZiAoICEgY24gKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyAkKCc8ZGl2IGNsYXNzPVwiYWxlcnQgYWxlcnQtZXJyb3JcIj5Zb3UgbXVzdCBlbnRlciBhIGNvbGxlY3Rpb24gbmFtZS48L2Rpdj4nKS5hcHBlbmRUbygkYmxvY2spO1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgZGlzcGxheV9pbmZvKFwiU3VibWl0dGluZzsgcGxlYXNlIHdhaXQuLi5cIik7XG4gICAgICAgICAgICAgICAgICAgIHN1Ym1pdF9wb3N0KHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGEgOiAnYWRkaXRzbmMnLFxuICAgICAgICAgICAgICAgICAgICAgICAgY24gOiBjbixcbiAgICAgICAgICAgICAgICAgICAgICAgIGRlc2MgOiBkZXNjLFxuICAgICAgICAgICAgICAgICAgICAgICAgc2hyZCA6ICRibG9jay5maW5kKFwiaW5wdXRbbmFtZT1zaHJkXTpjaGVja2VkXCIpLnZhbCgpXG4gICAgICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICBdKTtcblxuICAgICAgICAkZGlhbG9nLmZpbmQoXCJpbnB1dFt0eXBlPXRleHRdLHRleHRhcmVhXCIpLmVhY2goZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICB2YXIgJHRoaXMgPSAkKHRoaXMpO1xuICAgICAgICAgICAgdmFyICRjb3VudCA9ICQoXCIjXCIgKyAkdGhpcy5hdHRyKCdpZCcpICsgXCItY291bnRcIik7XG4gICAgICAgICAgICB2YXIgbGltaXQgPSAkdGhpcy5hdHRyKFwibWF4bGVuZ3RoXCIpO1xuXG4gICAgICAgICAgICAkY291bnQudGV4dChsaW1pdCAtICR0aGlzLnZhbCgpLmxlbmd0aCk7XG5cbiAgICAgICAgICAgICR0aGlzLmJpbmQoJ2tleXVwJywgZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgJGNvdW50LnRleHQobGltaXQgLSAkdGhpcy52YWwoKS5sZW5ndGgpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0pXG4gICAgfVxuXG4gICAgZnVuY3Rpb24gc3VibWl0X3Bvc3QocGFyYW1zKSB7XG4gICAgICAgIHZhciBkYXRhID0gJC5leHRlbmQoe30sIHsgcGFnZSA6ICdhamF4JywgaWQgOiBIVC5wYXJhbXMuaWQgfSwgcGFyYW1zKTtcbiAgICAgICAgJC5hamF4KHtcbiAgICAgICAgICAgIHVybCA6IGdldF91cmwoKSxcbiAgICAgICAgICAgIGRhdGEgOiBkYXRhXG4gICAgICAgIH0pLmRvbmUoZnVuY3Rpb24oZGF0YSkge1xuICAgICAgICAgICAgdmFyIHBhcmFtcyA9IHBhcnNlX2xpbmUoZGF0YSk7XG4gICAgICAgICAgICBoaWRlX2luZm8oKTtcbiAgICAgICAgICAgIGlmICggcGFyYW1zLnJlc3VsdCA9PSAnQUREX0lURU1fU1VDQ0VTUycgKSB7XG4gICAgICAgICAgICAgICAgLy8gZG8gc29tZXRoaW5nXG4gICAgICAgICAgICAgICAgYWRkX2l0ZW1fdG9fY29sbGlzdChwYXJhbXMpO1xuICAgICAgICAgICAgfSBlbHNlIGlmICggcGFyYW1zLnJlc3VsdCA9PSAnQUREX0lURU1fRkFJTFVSRScgKSB7XG4gICAgICAgICAgICAgICAgZGlzcGxheV9lcnJvcihcIkl0ZW0gY291bGQgbm90IGJlIGFkZGVkIGF0IHRoaXMgdGltZS5cIik7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKGRhdGEpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KS5mYWlsKGZ1bmN0aW9uKGpxWEhSLCB0ZXh0U3RhdHVzLCBlcnJvclRocm93bikge1xuICAgICAgICAgICAgY29uc29sZS5sb2codGV4dFN0YXR1cywgZXJyb3JUaHJvd24pO1xuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBhZGRfaXRlbV90b19jb2xsaXN0KHBhcmFtcykge1xuICAgICAgICB2YXIgJHVsID0gJChcIi5jb2xsZWN0aW9uLW1lbWJlcnNoaXBcIik7XG4gICAgICAgIHZhciBjb2xsX2hyZWYgPSBnZXRfdXJsKCkgKyBcIj9hPWxpc3RpcztjPVwiICsgcGFyYW1zLmNvbGxfaWQ7XG4gICAgICAgIHZhciAkYSA9ICQoXCI8YT5cIikuYXR0cihcImhyZWZcIiwgY29sbF9ocmVmKS50ZXh0KHBhcmFtcy5jb2xsX25hbWUpO1xuICAgICAgICAkKFwiPGxpPjwvbGk+XCIpLmFwcGVuZFRvKCR1bCkuYXBwZW5kKCRhKTtcbiAgICAgICAgJHVsLnBhcmVudHMoXCJkaXZcIikucmVtb3ZlQ2xhc3MoXCJoaWRlXCIpO1xuXG4gICAgICAgIC8vICQoXCIuY29sbGVjdGlvbi1tZW1iZXJzaGlwLXN1bW1hcnlcIikudGV4dChJTl9ZT1VSX0NPTExTX0xBQkVMKTtcblxuICAgICAgICAvLyBhbmQgdGhlbiBmaWx0ZXIgb3V0IHRoZSBsaXN0IGZyb20gdGhlIHNlbGVjdFxuICAgICAgICB2YXIgJG9wdGlvbiA9ICR0b29sYmFyLmZpbmQoXCJvcHRpb25bdmFsdWU9J1wiICsgcGFyYW1zLmNvbGxfaWQgKyBcIiddXCIpO1xuICAgICAgICAkb3B0aW9uLnJlbW92ZSgpO1xuXG4gICAgICAgIEhULnVwZGF0ZV9zdGF0dXMoYEFkZGVkIGNvbGxlY3Rpb24gJHtwYXJhbXMuY29sbF9uYW1lfSB0byB5b3VyIGxpc3QuYCk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gY29uZmlybV9sYXJnZShjb2xsU2l6ZSwgYWRkTnVtSXRlbXMsIGNhbGxiYWNrKSB7XG5cbiAgICAgICAgaWYgKCBjb2xsU2l6ZSA8PSAxMDAwICYmIGNvbGxTaXplICsgYWRkTnVtSXRlbXMgPiAxMDAwICkge1xuICAgICAgICAgICAgdmFyIG51bVN0cjtcbiAgICAgICAgICAgIGlmIChhZGROdW1JdGVtcyA+IDEpIHtcbiAgICAgICAgICAgICAgICBudW1TdHIgPSBcInRoZXNlIFwiICsgYWRkTnVtSXRlbXMgKyBcIiBpdGVtc1wiO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgbnVtU3RyID0gXCJ0aGlzIGl0ZW1cIjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHZhciBtc2cgPSBcIk5vdGU6IFlvdXIgY29sbGVjdGlvbiBjb250YWlucyBcIiArIGNvbGxTaXplICsgXCIgaXRlbXMuICBBZGRpbmcgXCIgKyBudW1TdHIgKyBcIiB0byB5b3VyIGNvbGxlY3Rpb24gd2lsbCBpbmNyZWFzZSBpdHMgc2l6ZSB0byBtb3JlIHRoYW4gMTAwMCBpdGVtcy4gIFRoaXMgbWVhbnMgeW91ciBjb2xsZWN0aW9uIHdpbGwgbm90IGJlIHNlYXJjaGFibGUgdW50aWwgaXQgaXMgaW5kZXhlZCwgdXN1YWxseSB3aXRoaW4gNDggaG91cnMuICBBZnRlciB0aGF0LCBqdXN0IG5ld2x5IGFkZGVkIGl0ZW1zIHdpbGwgc2VlIHRoaXMgZGVsYXkgYmVmb3JlIHRoZXkgY2FuIGJlIHNlYXJjaGVkLiBcXG5cXG5EbyB5b3Ugd2FudCB0byBwcm9jZWVkP1wiXG5cbiAgICAgICAgICAgIGNvbmZpcm0obXNnLCBmdW5jdGlvbihhbnN3ZXIpIHtcbiAgICAgICAgICAgICAgICBpZiAoIGFuc3dlciApIHtcbiAgICAgICAgICAgICAgICAgICAgY2FsbGJhY2soKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgLy8gYWxsIG90aGVyIGNhc2VzIGFyZSBva2F5XG4gICAgICAgICAgICBjYWxsYmFjaygpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgLy8gJChcIiNQVGFkZEl0ZW1CdG5cIikuY2xpY2soZnVuY3Rpb24oZSkge1xuICAgICQoXCJib2R5XCIpLm9uKCdjbGljaycsICcjUFRhZGRJdGVtQnRuJywgZnVuY3Rpb24oZSkge1xuICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgIHZhciBhY3Rpb24gPSAnYWRkSSdcblxuICAgICAgICBoaWRlX2Vycm9yKCk7XG5cbiAgICAgICAgdmFyIHNlbGVjdGVkX2NvbGxlY3Rpb25faWQgPSAkdG9vbGJhci5maW5kKFwic2VsZWN0XCIpLnZhbCgpO1xuICAgICAgICB2YXIgc2VsZWN0ZWRfY29sbGVjdGlvbl9uYW1lID0gJHRvb2xiYXIuZmluZChcInNlbGVjdCBvcHRpb246c2VsZWN0ZWRcIikudGV4dCgpO1xuXG4gICAgICAgIGlmICggKCBzZWxlY3RlZF9jb2xsZWN0aW9uX2lkID09IERFRkFVTFRfQ09MTF9NRU5VX09QVElPTiApICkge1xuICAgICAgICAgICAgZGlzcGxheV9lcnJvcihcIllvdSBtdXN0IHNlbGVjdCBhIGNvbGxlY3Rpb24uXCIpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKCBzZWxlY3RlZF9jb2xsZWN0aW9uX2lkID09IE5FV19DT0xMX01FTlVfT1BUSU9OICkge1xuICAgICAgICAgICAgLy8gZGVhbCB3aXRoIG5ldyBjb2xsZWN0aW9uXG4gICAgICAgICAgICBlZGl0X2NvbGxlY3Rpb25fbWV0YWRhdGEoe1xuICAgICAgICAgICAgICAgIGNyZWF0aW5nIDogdHJ1ZSxcbiAgICAgICAgICAgICAgICBjIDogc2VsZWN0ZWRfY29sbGVjdGlvbl9pZCxcbiAgICAgICAgICAgICAgICBpZCA6IEhULnBhcmFtcy5pZCxcbiAgICAgICAgICAgICAgICBhIDogYWN0aW9uXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIHZhciBhZGRfbnVtX2l0ZW1zID0gMTtcbiAgICAgICAgLy8gdmFyIENPTExfU0laRV9BUlJBWSA9IGdldENvbGxTaXplQXJyYXkoKTtcbiAgICAgICAgLy8gdmFyIGNvbGxfc2l6ZSA9IENPTExfU0laRV9BUlJBWVtzZWxlY3RlZF9jb2xsZWN0aW9uX2lkXTtcbiAgICAgICAgLy8gY29uZmlybV9sYXJnZShjb2xsX3NpemUsIGFkZF9udW1faXRlbXMsIGZ1bmN0aW9uKCkge1xuICAgICAgICAvLyAgICAgJGZvcm0uc3VibWl0KCk7XG4gICAgICAgIC8vIH0pXG5cbiAgICAgICAgZGlzcGxheV9pbmZvKFwiQWRkaW5nIGl0ZW0gdG8geW91ciBjb2xsZWN0aW9uOyBwbGVhc2Ugd2FpdC4uLlwiKTtcbiAgICAgICAgc3VibWl0X3Bvc3Qoe1xuICAgICAgICAgICAgYzIgOiBzZWxlY3RlZF9jb2xsZWN0aW9uX2lkLFxuICAgICAgICAgICAgYSAgOiAnYWRkaXRzJ1xuICAgICAgICB9KTtcblxuICAgIH0pXG5cbn0pO1xuIiwiaGVhZC5yZWFkeShmdW5jdGlvbigpIHtcblxuICBpZiAoICEgJChcImh0bWxcIikuaXMoXCIuY3Jtc1wiKSApIHtcbiAgICByZXR1cm47XG4gIH1cblxuICAvLyBpZiAoICQoXCIubmF2YmFyLXN0YXRpYy10b3BcIikuZGF0YSgnbG9nZ2VkaW4nKSAhPSAnWUVTJyAmJiB3aW5kb3cubG9jYXRpb24ucHJvdG9jb2wgPT0gJ2h0dHBzOicgKSB7XG4gIC8vICAgICAvLyBob3JyaWJsZSBoYWNrXG4gIC8vICAgICB2YXIgdGFyZ2V0ID0gd2luZG93LmxvY2F0aW9uLmhyZWYucmVwbGFjZSgvXFwkL2csICclMjQnKTtcbiAgLy8gICAgIHZhciBocmVmID0gJ2h0dHBzOi8vJyArIHdpbmRvdy5sb2NhdGlvbi5ob3N0bmFtZSArICcvU2hpYmJvbGV0aC5zc28vTG9naW4/ZW50aXR5SUQ9aHR0cHM6Ly9zaGliYm9sZXRoLnVtaWNoLmVkdS9pZHAvc2hpYmJvbGV0aCZ0YXJnZXQ9JyArIHRhcmdldDtcbiAgLy8gICAgIHdpbmRvdy5sb2NhdGlvbi5ocmVmID0gaHJlZjtcbiAgLy8gICAgIHJldHVybjtcbiAgLy8gfVxuXG4gIC8vIGRlZmluZSBDUk1TIHN0YXRlXG4gIEhULmNybXNfc3RhdGUgPSAnQ1JNUy1VUyc7XG5cbiAgLy8gZm9yY2UgQ1JNUyB1c2VycyB0byBhIGZpeGVkIGltYWdlIHNpemVcbiAgSFQuZm9yY2Vfc2l6ZSA9IDIwMDtcblxuICB2YXIgaSA9IHdpbmRvdy5sb2NhdGlvbi5ocmVmLmluZGV4T2YoJ3NraW49Y3Jtc3dvcmxkJyk7XG4gIGlmICggaSArIDEgIT0gMCApIHtcbiAgICAgIEhULmNybXNfc3RhdGUgPSAnQ1JNUy1Xb3JsZCc7XG4gIH1cblxuICAvLyBkaXNwbGF5IGJpYiBpbmZvcm1hdGlvblxuICB2YXIgJGRpdiA9ICQoXCIuYmliTGlua3NcIik7XG4gIHZhciAkcCA9ICRkaXYuZmluZChcInA6Zmlyc3RcIik7XG4gICRwLmZpbmQoXCJzcGFuOmVtcHR5XCIpLmVhY2goZnVuY3Rpb24oKSB7XG4gICAgICAvLyAkKHRoaXMpLnRleHQoJCh0aGlzKS5hdHRyKFwiY29udGVudFwiKSkuYWRkQ2xhc3MoXCJibG9ja2VkXCIpO1xuICAgICAgdmFyIGZyYWdtZW50ID0gJzxzcGFuIGNsYXNzPVwiYmxvY2tlZFwiPjxzdHJvbmc+e2xhYmVsfTo8L3N0cm9uZz4ge2NvbnRlbnR9PC9zcGFuPic7XG4gICAgICBmcmFnbWVudCA9IGZyYWdtZW50LnJlcGxhY2UoJ3tsYWJlbH0nLCAkKHRoaXMpLmF0dHIoJ3Byb3BlcnR5Jykuc3Vic3RyKDMpKS5yZXBsYWNlKCd7Y29udGVudH0nLCAkKHRoaXMpLmF0dHIoXCJjb250ZW50XCIpKTtcbiAgICAgICRwLmFwcGVuZChmcmFnbWVudCk7XG4gIH0pXG5cbiAgdmFyICRsaW5rID0gJChcIiNlbWJlZEh0bWxcIik7XG4gIGNvbnNvbGUubG9nKFwiQUhPWSBFTUJFRFwiLCAkbGluayk7XG4gICRsaW5rLnBhcmVudCgpLnJlbW92ZSgpO1xuXG4gICRsaW5rID0gJChcImFbZGF0YS10b2dnbGU9J1BUIEZpbmQgaW4gYSBMaWJyYXJ5J11cIik7XG4gICRsaW5rLnBhcmVudCgpLnJlbW92ZSgpO1xufSlcbiIsIi8vIGRvd25sb2FkZXJcblxudmFyIEhUID0gSFQgfHwge307XG52YXIgcGhvdG9jb3BpZXJfbWVzc2FnZSA9ICdUaGUgY29weXJpZ2h0IGxhdyBvZiB0aGUgVW5pdGVkIFN0YXRlcyAoVGl0bGUgMTcsIFUuUy4gQ29kZSkgZ292ZXJucyB0aGUgbWFraW5nIG9mIHJlcHJvZHVjdGlvbnMgb2YgY29weXJpZ2h0ZWQgbWF0ZXJpYWwuIFVuZGVyIGNlcnRhaW4gY29uZGl0aW9ucyBzcGVjaWZpZWQgaW4gdGhlIGxhdywgbGlicmFyaWVzIGFuZCBhcmNoaXZlcyBhcmUgYXV0aG9yaXplZCB0byBmdXJuaXNoIGEgcmVwcm9kdWN0aW9uLiBPbmUgb2YgdGhlc2Ugc3BlY2lmaWMgY29uZGl0aW9ucyBpcyB0aGF0IHRoZSByZXByb2R1Y3Rpb24gaXMgbm90IHRvIGJlIOKAnHVzZWQgZm9yIGFueSBwdXJwb3NlIG90aGVyIHRoYW4gcHJpdmF0ZSBzdHVkeSwgc2Nob2xhcnNoaXAsIG9yIHJlc2VhcmNoLuKAnSBJZiBhIHVzZXIgbWFrZXMgYSByZXF1ZXN0IGZvciwgb3IgbGF0ZXIgdXNlcywgYSByZXByb2R1Y3Rpb24gZm9yIHB1cnBvc2VzIGluIGV4Y2VzcyBvZiDigJxmYWlyIHVzZSzigJ0gdGhhdCB1c2VyIG1heSBiZSBsaWFibGUgZm9yIGNvcHlyaWdodCBpbmZyaW5nZW1lbnQuJztcblxuSFQuRG93bmxvYWRlciA9IHtcblxuICAgIGluaXQ6IGZ1bmN0aW9uKG9wdGlvbnMpIHtcbiAgICAgICAgdGhpcy5vcHRpb25zID0gJC5leHRlbmQoe30sIHRoaXMub3B0aW9ucywgb3B0aW9ucyk7XG4gICAgICAgIHRoaXMuaWQgPSB0aGlzLm9wdGlvbnMucGFyYW1zLmlkO1xuICAgICAgICB0aGlzLnBkZiA9IHt9O1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9LFxuXG4gICAgb3B0aW9uczoge1xuXG4gICAgfSxcblxuICAgIHN0YXJ0IDogZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBzZWxmID0gdGhpcztcbiAgICAgICAgdGhpcy5iaW5kRXZlbnRzKCk7XG4gICAgfSxcblxuICAgIGJpbmRFdmVudHM6IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgfSxcblxuICAgIGV4cGxhaW5QZGZBY2Nlc3M6IGZ1bmN0aW9uKGxpbmspIHtcbiAgICAgICAgdmFyIGh0bWwgPSAkKFwiI25vRG93bmxvYWRBY2Nlc3NcIikuaHRtbCgpO1xuICAgICAgICBodG1sID0gaHRtbC5yZXBsYWNlKCd7RE9XTkxPQURfTElOS30nLCAkKHRoaXMpLmF0dHIoXCJocmVmXCIpKTtcbiAgICAgICAgdGhpcy4kZGlhbG9nID0gYm9vdGJveC5hbGVydChodG1sKTtcbiAgICB9LFxuXG4gICAgZG93bmxvYWRQZGY6IGZ1bmN0aW9uKGNvbmZpZykge1xuICAgICAgICB2YXIgc2VsZiA9IHRoaXM7XG5cbiAgICAgICAgc2VsZi5zcmMgPSBjb25maWcuc3JjO1xuICAgICAgICBzZWxmLml0ZW1fdGl0bGUgPSBjb25maWcuaXRlbV90aXRsZTtcbiAgICAgICAgc2VsZi4kY29uZmlnID0gY29uZmlnO1xuXG4gICAgICAgIHZhciBodG1sID1cbiAgICAgICAgICAgIGA8ZGl2IGNsYXNzPVwiaW5pdGlhbFwiPjxwPlNldHRpbmcgdXAgdGhlIGRvd25sb2FkLi4uPC9kaXY+YCArXG4gICAgICAgICAgICBgPGRpdiBjbGFzcz1cIm9mZnNjcmVlblwiIHJvbGU9XCJzdGF0dXNcIiBhcmlhLWF0b21pYz1cInRydWVcIiBhcmlhLWxpdmU9XCJwb2xpdGVcIj48L2Rpdj5gICtcbiAgICAgICAgICAgICc8ZGl2IGNsYXNzPVwicHJvZ3Jlc3MgcHJvZ3Jlc3Mtc3RyaXBlZCBhY3RpdmUgaGlkZVwiIGFyaWEtaGlkZGVuPVwidHJ1ZVwiPicgK1xuICAgICAgICAgICAgICAgICc8ZGl2IGNsYXNzPVwiYmFyXCIgd2lkdGg9XCIwJVwiPjwvZGl2PicgK1xuICAgICAgICAgICAgJzwvZGl2PicgK1xuICAgICAgICAgICAgYDxkaXY+PHA+PGEgaHJlZj1cImh0dHBzOi8vd3d3LmhhdGhpdHJ1c3Qub3JnL2hlbHBfZGlnaXRhbF9saWJyYXJ5I0Rvd25sb2FkVGltZVwiIHRhcmdldD1cIl9ibGFua1wiPldoYXQgYWZmZWN0cyB0aGUgZG93bmxvYWQgc3BlZWQ/PC9hPjwvcD48L2Rpdj5gO1xuXG4gICAgICAgIHZhciBoZWFkZXIgPSAnQnVpbGRpbmcgeW91ciAnICsgc2VsZi5pdGVtX3RpdGxlO1xuICAgICAgICB2YXIgdG90YWwgPSBzZWxmLiRjb25maWcuc2VsZWN0aW9uLnBhZ2VzLmxlbmd0aDtcbiAgICAgICAgaWYgKCB0b3RhbCA+IDAgKSB7XG4gICAgICAgICAgICB2YXIgc3VmZml4ID0gdG90YWwgPT0gMSA/ICdwYWdlJyA6ICdwYWdlcyc7XG4gICAgICAgICAgICBoZWFkZXIgKz0gJyAoJyArIHRvdGFsICsgJyAnICsgc3VmZml4ICsgJyknO1xuICAgICAgICB9XG5cbiAgICAgICAgc2VsZi4kZGlhbG9nID0gYm9vdGJveC5kaWFsb2coXG4gICAgICAgICAgICBodG1sLFxuICAgICAgICAgICAgW1xuICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgbGFiZWwgOiAnQ2FuY2VsJyxcbiAgICAgICAgICAgICAgICAgICAgJ2NsYXNzJyA6ICdidG4teC1kaXNtaXNzIGJ0bicsXG4gICAgICAgICAgICAgICAgICAgIGNhbGxiYWNrOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICggc2VsZi4kZGlhbG9nLmRhdGEoJ2RlYWN0aXZhdGVkJykgKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc2VsZi4kZGlhbG9nLmNsb3NlTW9kYWwoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAkLmFqYXgoe1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHVybDogc2VsZi5zcmMgKyAnO2NhbGxiYWNrPUhULmRvd25sb2FkZXIuY2FuY2VsRG93bmxvYWQ7c3RvcD0xJyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkYXRhVHlwZTogJ3NjcmlwdCcsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY2FjaGU6IGZhbHNlLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVycm9yOiBmdW5jdGlvbihyZXEsIHRleHRTdGF0dXMsIGVycm9yVGhyb3duKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiRE9XTkxPQUQgQ0FOQ0VMTEVEIEVSUk9SXCIpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBzZWxmLiRkaWFsb2cuY2xvc2VNb2RhbCgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhyZXEsIHRleHRTdGF0dXMsIGVycm9yVGhyb3duKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCByZXEuc3RhdHVzID09IDUwMyApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNlbGYuZGlzcGxheVdhcm5pbmcocmVxKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNlbGYuZGlzcGxheUVycm9yKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgXSxcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBoZWFkZXI6IGhlYWRlcixcbiAgICAgICAgICAgICAgICBpZDogJ2Rvd25sb2FkJ1xuICAgICAgICAgICAgfVxuICAgICAgICApO1xuICAgICAgICBzZWxmLiRzdGF0dXMgPSBzZWxmLiRkaWFsb2cuZmluZChcImRpdltyb2xlPXN0YXR1c11cIik7XG5cbiAgICAgICAgc2VsZi5yZXF1ZXN0RG93bmxvYWQoKTtcblxuICAgIH0sXG5cbiAgICByZXF1ZXN0RG93bmxvYWQ6IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgICAgIHZhciBkYXRhID0ge307XG5cbiAgICAgICAgaWYgKCBzZWxmLiRjb25maWcuc2VsZWN0aW9uLnBhZ2VzLmxlbmd0aCA+IDAgKSB7XG4gICAgICAgICAgICBkYXRhWydzZXEnXSA9IHNlbGYuJGNvbmZpZy5zZWxlY3Rpb24uc2VxO1xuICAgICAgICB9XG5cbiAgICAgICAgc3dpdGNoIChzZWxmLiRjb25maWcuZG93bmxvYWRGb3JtYXQpIHtcbiAgICAgICAgICAgIGNhc2UgJ2ltYWdlJzpcbiAgICAgICAgICAgICAgICBkYXRhWydmb3JtYXQnXSA9ICdpbWFnZS9qcGVnJztcbiAgICAgICAgICAgICAgICBkYXRhWyd0YXJnZXRfcHBpJ10gPSAzMDA7XG4gICAgICAgICAgICAgICAgZGF0YVsnYnVuZGxlX2Zvcm1hdCddID0gJ3ppcCc7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBjYXNlICdwbGFpbnRleHQtemlwJzpcbiAgICAgICAgICAgICAgICBkYXRhWydidW5kbGVfZm9ybWF0J10gPSAnemlwJztcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGNhc2UgJ3BsYWludGV4dCc6XG4gICAgICAgICAgICAgICAgZGF0YVsnYnVuZGxlX2Zvcm1hdCddID0gJ3RleHQnO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG5cbiAgICAgICAgJC5hamF4KHtcbiAgICAgICAgICAgIHVybDogc2VsZi5zcmMucmVwbGFjZSgvOy9nLCAnJicpICsgJyZjYWxsYmFjaz1IVC5kb3dubG9hZGVyLnN0YXJ0RG93bmxvYWRNb25pdG9yJyxcbiAgICAgICAgICAgIGRhdGFUeXBlOiAnc2NyaXB0JyxcbiAgICAgICAgICAgIGNhY2hlOiBmYWxzZSxcbiAgICAgICAgICAgIGRhdGE6IGRhdGEsXG4gICAgICAgICAgICBlcnJvcjogZnVuY3Rpb24ocmVxLCB0ZXh0U3RhdHVzLCBlcnJvclRocm93bikge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiRE9XTkxPQUQgU1RBUlRVUCBOT1QgREVURUNURURcIik7XG4gICAgICAgICAgICAgICAgaWYgKCBzZWxmLiRkaWFsb2cgKSB7IHNlbGYuJGRpYWxvZy5jbG9zZU1vZGFsKCk7IH1cbiAgICAgICAgICAgICAgICBpZiAoIHJlcS5zdGF0dXMgPT0gNDI5ICkge1xuICAgICAgICAgICAgICAgICAgICBzZWxmLmRpc3BsYXlXYXJuaW5nKHJlcSk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgc2VsZi5kaXNwbGF5RXJyb3IocmVxKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH0sXG5cbiAgICBjYW5jZWxEb3dubG9hZDogZnVuY3Rpb24ocHJvZ3Jlc3NfdXJsLCBkb3dubG9hZF91cmwsIHRvdGFsKSB7XG4gICAgICAgIHZhciBzZWxmID0gdGhpcztcbiAgICAgICAgc2VsZi5jbGVhclRpbWVyKCk7XG4gICAgICAgIHNlbGYuJGRpYWxvZy5jbG9zZU1vZGFsKCk7XG4gICAgfSxcblxuICAgIHN0YXJ0RG93bmxvYWRNb25pdG9yOiBmdW5jdGlvbihwcm9ncmVzc191cmwsIGRvd25sb2FkX3VybCwgdG90YWwpIHtcbiAgICAgICAgdmFyIHNlbGYgPSB0aGlzO1xuXG4gICAgICAgIGlmICggc2VsZi50aW1lciApIHtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiQUxSRUFEWSBQT0xMSU5HXCIpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgc2VsZi5wZGYucHJvZ3Jlc3NfdXJsID0gcHJvZ3Jlc3NfdXJsO1xuICAgICAgICBzZWxmLnBkZi5kb3dubG9hZF91cmwgPSBkb3dubG9hZF91cmw7XG4gICAgICAgIHNlbGYucGRmLnRvdGFsID0gdG90YWw7XG5cbiAgICAgICAgc2VsZi5pc19ydW5uaW5nID0gdHJ1ZTtcbiAgICAgICAgc2VsZi5udW1fcHJvY2Vzc2VkID0gMDtcbiAgICAgICAgc2VsZi5pID0gMDtcblxuICAgICAgICBzZWxmLnRpbWVyID0gc2V0SW50ZXJ2YWwoZnVuY3Rpb24oKSB7IHNlbGYuY2hlY2tTdGF0dXMoKTsgfSwgMjUwMCk7XG4gICAgICAgIC8vIGRvIGl0IG9uY2UgdGhlIGZpcnN0IHRpbWVcbiAgICAgICAgc2VsZi5jaGVja1N0YXR1cygpO1xuXG4gICAgfSxcblxuICAgIGNoZWNrU3RhdHVzOiBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgICAgICBzZWxmLmkgKz0gMTtcbiAgICAgICAgJC5hamF4KHtcbiAgICAgICAgICAgIHVybCA6IHNlbGYucGRmLnByb2dyZXNzX3VybCxcbiAgICAgICAgICAgIGRhdGEgOiB7IHRzIDogKG5ldyBEYXRlKS5nZXRUaW1lKCkgfSxcbiAgICAgICAgICAgIGNhY2hlIDogZmFsc2UsXG4gICAgICAgICAgICBkYXRhVHlwZTogJ2pzb24nLFxuICAgICAgICAgICAgc3VjY2VzcyA6IGZ1bmN0aW9uKGRhdGEpIHtcbiAgICAgICAgICAgICAgICB2YXIgc3RhdHVzID0gc2VsZi51cGRhdGVQcm9ncmVzcyhkYXRhKTtcbiAgICAgICAgICAgICAgICBzZWxmLm51bV9wcm9jZXNzZWQgKz0gMTtcbiAgICAgICAgICAgICAgICBpZiAoIHN0YXR1cy5kb25lICkge1xuICAgICAgICAgICAgICAgICAgICBzZWxmLmNsZWFyVGltZXIoKTtcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKCBzdGF0dXMuZXJyb3IgJiYgc3RhdHVzLm51bV9hdHRlbXB0cyA+IDEwMCApIHtcbiAgICAgICAgICAgICAgICAgICAgc2VsZi4kZGlhbG9nLmNsb3NlTW9kYWwoKTtcbiAgICAgICAgICAgICAgICAgICAgc2VsZi5kaXNwbGF5UHJvY2Vzc0Vycm9yKCk7XG4gICAgICAgICAgICAgICAgICAgIHNlbGYuY2xlYXJUaW1lcigpO1xuICAgICAgICAgICAgICAgICAgICBzZWxmLmxvZ0Vycm9yKCk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmICggc3RhdHVzLmVycm9yICkge1xuICAgICAgICAgICAgICAgICAgICBzZWxmLiRkaWFsb2cuY2xvc2VNb2RhbCgpO1xuICAgICAgICAgICAgICAgICAgICBzZWxmLmRpc3BsYXlFcnJvcigpO1xuICAgICAgICAgICAgICAgICAgICBzZWxmLmNsZWFyVGltZXIoKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgZXJyb3IgOiBmdW5jdGlvbihyZXEsIHRleHRTdGF0dXMsIGVycm9yVGhyb3duKSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coXCJGQUlMRUQ6IFwiLCByZXEsIFwiL1wiLCB0ZXh0U3RhdHVzLCBcIi9cIiwgZXJyb3JUaHJvd24pO1xuICAgICAgICAgICAgICAgIHNlbGYuJGRpYWxvZy5jbG9zZU1vZGFsKCk7XG4gICAgICAgICAgICAgICAgc2VsZi5jbGVhclRpbWVyKCk7XG4gICAgICAgICAgICAgICAgaWYgKCByZXEuc3RhdHVzID09IDQwNCAmJiAoc2VsZi5pID4gMjUgfHwgc2VsZi5udW1fcHJvY2Vzc2VkID4gMCkgKSB7XG4gICAgICAgICAgICAgICAgICAgIHNlbGYuZGlzcGxheUVycm9yKCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9KVxuICAgIH0sXG5cbiAgICB1cGRhdGVQcm9ncmVzczogZnVuY3Rpb24oZGF0YSkge1xuICAgICAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgICAgIHZhciBzdGF0dXMgPSB7IGRvbmUgOiBmYWxzZSwgZXJyb3IgOiBmYWxzZSB9O1xuICAgICAgICB2YXIgcGVyY2VudDtcblxuICAgICAgICB2YXIgY3VycmVudCA9IGRhdGEuc3RhdHVzO1xuICAgICAgICBpZiAoIGN1cnJlbnQgPT0gJ0VPVCcgfHwgY3VycmVudCA9PSAnRE9ORScgKSB7XG4gICAgICAgICAgICBzdGF0dXMuZG9uZSA9IHRydWU7XG4gICAgICAgICAgICBwZXJjZW50ID0gMTAwO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgY3VycmVudCA9IGRhdGEuY3VycmVudF9wYWdlO1xuICAgICAgICAgICAgcGVyY2VudCA9IDEwMCAqICggY3VycmVudCAvIHNlbGYucGRmLnRvdGFsICk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoIHNlbGYubGFzdF9wZXJjZW50ICE9IHBlcmNlbnQgKSB7XG4gICAgICAgICAgICBzZWxmLmxhc3RfcGVyY2VudCA9IHBlcmNlbnQ7XG4gICAgICAgICAgICBzZWxmLm51bV9hdHRlbXB0cyA9IDA7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBzZWxmLm51bV9hdHRlbXB0cyArPSAxO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gdHJ5IDEwMCB0aW1lcywgd2hpY2ggYW1vdW50cyB0byB+MTAwIHNlY29uZHNcbiAgICAgICAgaWYgKCBzZWxmLm51bV9hdHRlbXB0cyA+IDEwMCApIHtcbiAgICAgICAgICAgIHN0YXR1cy5lcnJvciA9IHRydWU7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoIHNlbGYuJGRpYWxvZy5maW5kKFwiLmluaXRpYWxcIikuaXMoXCI6dmlzaWJsZVwiKSApIHtcbiAgICAgICAgICAgIHNlbGYuJGRpYWxvZy5maW5kKFwiLmluaXRpYWxcIikuaHRtbChgPHA+UGxlYXNlIHdhaXQgd2hpbGUgd2UgYnVpbGQgeW91ciAke3NlbGYuaXRlbV90aXRsZX0uPC9wPmApO1xuICAgICAgICAgICAgc2VsZi4kZGlhbG9nLmZpbmQoXCIucHJvZ3Jlc3NcIikucmVtb3ZlQ2xhc3MoXCJoaWRlXCIpO1xuICAgICAgICAgICAgc2VsZi51cGRhdGVTdGF0dXNUZXh0KGBQbGVhc2Ugd2FpdCB3aGlsZSB3ZSBidWlsZCB5b3VyICR7c2VsZi5pdGVtX3RpdGxlfS5gKVxuICAgICAgICB9XG5cbiAgICAgICAgc2VsZi4kZGlhbG9nLmZpbmQoXCIuYmFyXCIpLmNzcyh7IHdpZHRoIDogcGVyY2VudCArICclJ30pO1xuXG4gICAgICAgIGlmICggcGVyY2VudCA9PSAxMDAgKSB7XG4gICAgICAgICAgICBzZWxmLiRkaWFsb2cuZmluZChcIi5wcm9ncmVzc1wiKS5oaWRlKCk7XG4gICAgICAgICAgICB2YXIgZG93bmxvYWRfa2V5ID0gbmF2aWdhdG9yLnVzZXJBZ2VudC5pbmRleE9mKCdNYWMgT1MgWCcpICE9IC0xID8gJ1JFVFVSTicgOiAnRU5URVInO1xuICAgICAgICAgICAgc2VsZi4kZGlhbG9nLmZpbmQoXCIuaW5pdGlhbFwiKS5odG1sKGA8cD5BbGwgZG9uZSEgWW91ciAke3NlbGYuaXRlbV90aXRsZX0gaXMgcmVhZHkgZm9yIGRvd25sb2FkLiA8c3BhbiBjbGFzcz1cIm9mZnNjcmVlblwiPlNlbGVjdCAke2Rvd25sb2FkX2tleX0gdG8gZG93bmxvYWQuPC9zcGFuPjwvcD5gKTtcbiAgICAgICAgICAgIHNlbGYudXBkYXRlU3RhdHVzVGV4dChgQWxsIGRvbmUhIFlvdXIgJHtzZWxmLml0ZW1fdGl0bGV9IGlzIHJlYWR5IGZvciBkb3dubG9hZC4gU2VsZWN0ICR7ZG93bmxvYWRfa2V5fSB0byBkb3dubG9hZC5gKTtcblxuICAgICAgICAgICAgLy8gc2VsZi4kZGlhbG9nLmZpbmQoXCIuZG9uZVwiKS5zaG93KCk7XG4gICAgICAgICAgICB2YXIgJGRvd25sb2FkX2J0biA9IHNlbGYuJGRpYWxvZy5maW5kKCcuZG93bmxvYWQtcGRmJyk7XG4gICAgICAgICAgICBpZiAoICEgJGRvd25sb2FkX2J0bi5sZW5ndGggKSB7XG4gICAgICAgICAgICAgICAgJGRvd25sb2FkX2J0biA9ICQoJzxhIGNsYXNzPVwiZG93bmxvYWQtcGRmIGJ0biBidG4tcHJpbWFyeVwiIGRvd25sb2FkPVwiZG93bmxvYWRcIj5Eb3dubG9hZCB7SVRFTV9USVRMRX08L2E+Jy5yZXBsYWNlKCd7SVRFTV9USVRMRX0nLCBzZWxmLml0ZW1fdGl0bGUpKS5hdHRyKCdocmVmJywgc2VsZi5wZGYuZG93bmxvYWRfdXJsKTtcbiAgICAgICAgICAgICAgICBpZiAoICRkb3dubG9hZF9idG4uZ2V0KDApLmRvd25sb2FkID09IHVuZGVmaW5lZCApIHtcbiAgICAgICAgICAgICAgICAgICAgJGRvd25sb2FkX2J0bi5hdHRyKCd0YXJnZXQnLCAnX2JsYW5rJyk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICRkb3dubG9hZF9idG4uYXBwZW5kVG8oc2VsZi4kZGlhbG9nLmZpbmQoXCIubW9kYWxfX2Zvb3RlclwiKSkub24oJ2NsaWNrJywgZnVuY3Rpb24oZSkge1xuICAgICAgICAgICAgICAgICAgICAvLyBzZWxmLiRsaW5rLnRyaWdnZXIoXCJjbGljay5nb29nbGVcIik7XG5cbiAgICAgICAgICAgICAgICAgICAgSFQuYW5hbHl0aWNzLnRyYWNrRXZlbnQoeyBcbiAgICAgICAgICAgICAgICAgICAgICAgIGxhYmVsIDogJy0nLCBcbiAgICAgICAgICAgICAgICAgICAgICAgIGNhdGVnb3J5IDogJ1BUJywgXG4gICAgICAgICAgICAgICAgICAgICAgICBhY3Rpb24gOiBgUFQgRG93bmxvYWQgLSAke3NlbGYuJGNvbmZpZy5kb3dubG9hZEZvcm1hdC50b1VwcGVyQ2FzZSgpfSAtICR7c2VsZi4kY29uZmlnLnRyYWNraW5nQWN0aW9ufWAgXG4gICAgICAgICAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICAgICAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBzZWxmLiRkaWFsb2cuY2xvc2VNb2RhbCgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgJGRvd25sb2FkX2J0bi5yZW1vdmUoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIEhULnJlYWRlci5jb250cm9scy5zZWxlY3RpbmF0b3IuX2NsZWFyU2VsZWN0aW9uKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBIVC5yZWFkZXIuZW1pdCgnZG93bmxvYWREb25lJyk7XG4gICAgICAgICAgICAgICAgICAgIH0sIDE1MDApO1xuICAgICAgICAgICAgICAgICAgICBlLnN0b3BQcm9wYWdhdGlvbigpO1xuICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgICAgJGRvd25sb2FkX2J0bi5mb2N1cygpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgc2VsZi4kZGlhbG9nLmRhdGEoJ2RlYWN0aXZhdGVkJywgdHJ1ZSk7XG4gICAgICAgICAgICAvLyBzZWxmLnVwZGF0ZVN0YXR1c1RleHQoYFlvdXIgJHtzZWxmLml0ZW1fdGl0bGV9IGlzIHJlYWR5IGZvciBkb3dubG9hZC4gUHJlc3MgcmV0dXJuIHRvIGRvd25sb2FkLmApO1xuICAgICAgICAgICAgLy8gc3RpbGwgY291bGQgY2FuY2VsXG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBzZWxmLiRkaWFsb2cuZmluZChcIi5pbml0aWFsXCIpLnRleHQoYFBsZWFzZSB3YWl0IHdoaWxlIHdlIGJ1aWxkIHlvdXIgJHtzZWxmLml0ZW1fdGl0bGV9ICgke01hdGguY2VpbChwZXJjZW50KX0lIGNvbXBsZXRlZCkuYCk7XG4gICAgICAgICAgICBzZWxmLnVwZGF0ZVN0YXR1c1RleHQoYCR7TWF0aC5jZWlsKHBlcmNlbnQpfSUgY29tcGxldGVkYCk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gc3RhdHVzO1xuICAgIH0sXG5cbiAgICBjbGVhclRpbWVyOiBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgICAgICBpZiAoIHNlbGYudGltZXIgKSB7XG4gICAgICAgICAgICBjbGVhckludGVydmFsKHNlbGYudGltZXIpO1xuICAgICAgICAgICAgc2VsZi50aW1lciA9IG51bGw7XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgZGlzcGxheVdhcm5pbmc6IGZ1bmN0aW9uKHJlcSkge1xuICAgICAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgICAgIHZhciB0aW1lb3V0ID0gcGFyc2VJbnQocmVxLmdldFJlc3BvbnNlSGVhZGVyKCdYLUNob2tlLVVudGlsRXBvY2gnKSk7XG4gICAgICAgIHZhciByYXRlID0gcmVxLmdldFJlc3BvbnNlSGVhZGVyKCdYLUNob2tlLVJhdGUnKVxuXG4gICAgICAgIGlmICggdGltZW91dCA8PSA1ICkge1xuICAgICAgICAgICAgLy8ganVzdCBwdW50IGFuZCB3YWl0IGl0IG91dFxuICAgICAgICAgICAgc2V0VGltZW91dChmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgc2VsZi5yZXF1ZXN0RG93bmxvYWQoKTtcbiAgICAgICAgICAgIH0sIDUwMDApO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgdGltZW91dCAqPSAxMDAwO1xuICAgICAgICB2YXIgbm93ID0gKG5ldyBEYXRlKS5nZXRUaW1lKCk7XG4gICAgICAgIHZhciBjb3VudGRvd24gPSAoIE1hdGguY2VpbCgodGltZW91dCAtIG5vdykgLyAxMDAwKSApXG5cbiAgICAgICAgdmFyIGh0bWwgPVxuICAgICAgICAgICgnPGRpdj4nICtcbiAgICAgICAgICAgICc8cD5Zb3UgaGF2ZSBleGNlZWRlZCB0aGUgZG93bmxvYWQgcmF0ZSBvZiB7cmF0ZX0uIFlvdSBtYXkgcHJvY2VlZCBpbiA8c3BhbiBpZD1cInRocm90dGxlLXRpbWVvdXRcIj57Y291bnRkb3dufTwvc3Bhbj4gc2Vjb25kcy48L3A+JyArXG4gICAgICAgICAgICAnPHA+RG93bmxvYWQgbGltaXRzIHByb3RlY3QgSGF0aGlUcnVzdCByZXNvdXJjZXMgZnJvbSBhYnVzZSBhbmQgaGVscCBlbnN1cmUgYSBjb25zaXN0ZW50IGV4cGVyaWVuY2UgZm9yIGV2ZXJ5b25lLjwvcD4nICtcbiAgICAgICAgICAnPC9kaXY+JykucmVwbGFjZSgne3JhdGV9JywgcmF0ZSkucmVwbGFjZSgne2NvdW50ZG93bn0nLCBjb3VudGRvd24pO1xuXG4gICAgICAgIHNlbGYuJGRpYWxvZyA9IGJvb3Rib3guZGlhbG9nKFxuICAgICAgICAgICAgaHRtbCxcbiAgICAgICAgICAgIFtcbiAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgIGxhYmVsIDogJ09LJyxcbiAgICAgICAgICAgICAgICAgICAgJ2NsYXNzJyA6ICdidG4tZGlzbWlzcyBidG4tcHJpbWFyeScsXG4gICAgICAgICAgICAgICAgICAgIGNhbGxiYWNrOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNsZWFySW50ZXJ2YWwoc2VsZi5jb3VudGRvd25fdGltZXIpO1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICBdXG4gICAgICAgICk7XG5cbiAgICAgICAgc2VsZi5jb3VudGRvd25fdGltZXIgPSBzZXRJbnRlcnZhbChmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgY291bnRkb3duIC09IDE7XG4gICAgICAgICAgICAgIHNlbGYuJGRpYWxvZy5maW5kKFwiI3Rocm90dGxlLXRpbWVvdXRcIikudGV4dChjb3VudGRvd24pO1xuICAgICAgICAgICAgICBpZiAoIGNvdW50ZG93biA9PSAwICkge1xuICAgICAgICAgICAgICAgIGNsZWFySW50ZXJ2YWwoc2VsZi5jb3VudGRvd25fdGltZXIpO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiVElDIFRPQ1wiLCBjb3VudGRvd24pO1xuICAgICAgICB9LCAxMDAwKTtcblxuICAgIH0sXG5cbiAgICBkaXNwbGF5UHJvY2Vzc0Vycm9yOiBmdW5jdGlvbihyZXEpIHtcbiAgICAgICAgdmFyIGh0bWwgPVxuICAgICAgICAgICAgJzxwPicgKyBcbiAgICAgICAgICAgICAgICAnVW5mb3J0dW5hdGVseSwgdGhlIHByb2Nlc3MgZm9yIGNyZWF0aW5nIHlvdXIgUERGIGhhcyBiZWVuIGludGVycnVwdGVkLiAnICsgXG4gICAgICAgICAgICAgICAgJ1BsZWFzZSBjbGljayBcIk9LXCIgYW5kIHRyeSBhZ2Fpbi4nICsgXG4gICAgICAgICAgICAnPC9wPicgK1xuICAgICAgICAgICAgJzxwPicgK1xuICAgICAgICAgICAgICAgICdJZiB0aGlzIHByb2JsZW0gcGVyc2lzdHMgYW5kIHlvdSBhcmUgdW5hYmxlIHRvIGRvd25sb2FkIHRoaXMgUERGIGFmdGVyIHJlcGVhdGVkIGF0dGVtcHRzLCAnICsgXG4gICAgICAgICAgICAgICAgJ3BsZWFzZSBub3RpZnkgdXMgYXQgPGEgaHJlZj1cIi9jZ2kvZmVlZGJhY2svP3BhZ2U9Zm9ybVwiIGRhdGE9bT1cInB0XCIgZGF0YS10b2dnbGU9XCJmZWVkYmFjayB0cmFja2luZy1hY3Rpb25cIiBkYXRhLXRyYWNraW5nLWFjdGlvbj1cIlNob3cgRmVlZGJhY2tcIj5mZWVkYmFja0Bpc3N1ZXMuaGF0aGl0cnVzdC5vcmc8L2E+ICcgK1xuICAgICAgICAgICAgICAgICdhbmQgaW5jbHVkZSB0aGUgVVJMIG9mIHRoZSBib29rIHlvdSB3ZXJlIHRyeWluZyB0byBhY2Nlc3Mgd2hlbiB0aGUgcHJvYmxlbSBvY2N1cnJlZC4nICtcbiAgICAgICAgICAgICc8L3A+JztcblxuICAgICAgICAvLyBib290Ym94LmFsZXJ0KGh0bWwpO1xuICAgICAgICBib290Ym94LmRpYWxvZyhcbiAgICAgICAgICAgIGh0bWwsXG4gICAgICAgICAgICBbXG4gICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICBsYWJlbCA6ICdPSycsXG4gICAgICAgICAgICAgICAgICAgICdjbGFzcycgOiAnYnRuLWRpc21pc3MgYnRuLWludmVyc2UnXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgXSxcbiAgICAgICAgICAgIHsgY2xhc3NlcyA6ICdlcnJvcicgfVxuICAgICAgICApO1xuXG4gICAgICAgIGNvbnNvbGUubG9nKHJlcSk7XG4gICAgfSxcblxuICAgIGRpc3BsYXlFcnJvcjogZnVuY3Rpb24ocmVxKSB7XG4gICAgICAgIHZhciBodG1sID1cbiAgICAgICAgICAgICc8cD4nICtcbiAgICAgICAgICAgICAgICAnVGhlcmUgd2FzIGEgcHJvYmxlbSBidWlsZGluZyB5b3VyICcgKyB0aGlzLml0ZW1fdGl0bGUgKyAnOyBzdGFmZiBoYXZlIGJlZW4gbm90aWZpZWQuJyArXG4gICAgICAgICAgICAnPC9wPicgK1xuICAgICAgICAgICAgJzxwPicgK1xuICAgICAgICAgICAgICAgICdQbGVhc2UgdHJ5IGFnYWluIGluIDI0IGhvdXJzLicgK1xuICAgICAgICAgICAgJzwvcD4nO1xuXG4gICAgICAgIC8vIGJvb3Rib3guYWxlcnQoaHRtbCk7XG4gICAgICAgIGJvb3Rib3guZGlhbG9nKFxuICAgICAgICAgICAgaHRtbCxcbiAgICAgICAgICAgIFtcbiAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgIGxhYmVsIDogJ09LJyxcbiAgICAgICAgICAgICAgICAgICAgJ2NsYXNzJyA6ICdidG4tZGlzbWlzcyBidG4taW52ZXJzZSdcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICBdLFxuICAgICAgICAgICAgeyBjbGFzc2VzIDogJ2Vycm9yJyB9XG4gICAgICAgICk7XG5cbiAgICAgICAgY29uc29sZS5sb2cocmVxKTtcbiAgICB9LFxuXG4gICAgbG9nRXJyb3I6IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgICAgICQuZ2V0KHNlbGYuc3JjICsgJztudW1fYXR0ZW1wdHM9JyArIHNlbGYubnVtX2F0dGVtcHRzKTtcbiAgICB9LFxuXG4gICAgdXBkYXRlU3RhdHVzVGV4dDogZnVuY3Rpb24obWVzc2FnZSkge1xuICAgICAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgICAgIGlmICggc2VsZi5fbGFzdE1lc3NhZ2UgIT0gbWVzc2FnZSApIHtcbiAgICAgICAgICBpZiAoIHNlbGYuX2xhc3RUaW1lciApIHsgY2xlYXJUaW1lb3V0KHNlbGYuX2xhc3RUaW1lcik7IHNlbGYuX2xhc3RUaW1lciA9IG51bGw7IH1cblxuICAgICAgICAgIHNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgICAgICAgc2VsZi4kc3RhdHVzLnRleHQobWVzc2FnZSk7XG4gICAgICAgICAgICBzZWxmLl9sYXN0TWVzc2FnZSA9IG1lc3NhZ2U7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhcIi0tIHN0YXR1czpcIiwgbWVzc2FnZSk7XG4gICAgICAgICAgfSwgNTApO1xuICAgICAgICAgIHNlbGYuX2xhc3RUaW1lciA9IHNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgICAgICAgc2VsZi4kc3RhdHVzLmdldCgwKS5pbm5lclRleHQgPSAnJztcbiAgICAgICAgICB9LCA1MDApO1xuXG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgRU9UOiB0cnVlXG5cbn1cblxudmFyIGRvd25sb2FkRm9ybTtcbnZhciBkb3dubG9hZEZvcm1hdE9wdGlvbnM7XG52YXIgcmFuZ2VPcHRpb25zO1xudmFyIGRvd25sb2FkSWR4ID0gMDtcblxuaGVhZC5yZWFkeShmdW5jdGlvbigpIHtcbiAgICBIVC5kb3dubG9hZGVyID0gT2JqZWN0LmNyZWF0ZShIVC5Eb3dubG9hZGVyKS5pbml0KHtcbiAgICAgICAgcGFyYW1zIDogSFQucGFyYW1zXG4gICAgfSlcblxuICAgIEhULmRvd25sb2FkZXIuc3RhcnQoKTtcblxuICAgIC8vIG5vbi1qcXVlcnk/XG4gICAgZG93bmxvYWRGb3JtID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignI2Zvcm0tZG93bmxvYWQtbW9kdWxlJyk7XG4gICAgZG93bmxvYWRGb3JtYXRPcHRpb25zID0gQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoZG93bmxvYWRGb3JtLnF1ZXJ5U2VsZWN0b3JBbGwoJ2lucHV0W25hbWU9XCJkb3dubG9hZF9mb3JtYXRcIl0nKSk7XG4gICAgcmFuZ2VPcHRpb25zID0gQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoZG93bmxvYWRGb3JtLnF1ZXJ5U2VsZWN0b3JBbGwoJ1tkYXRhLWRvd25sb2FkLWZvcm1hdC10YXJnZXRdJykpO1xuXG4gICAgdmFyIGRvd25sb2FkU3VibWl0ID0gZG93bmxvYWRGb3JtLnF1ZXJ5U2VsZWN0b3IoJ1t0eXBlPVwic3VibWl0XCJdJyk7XG5cbiAgICB2YXIgaGFzRnVsbFBkZkFjY2VzcyA9IGRvd25sb2FkRm9ybS5kYXRhc2V0LmZ1bGxQZGZBY2Nlc3MgPT0gJ2FsbG93JztcblxuICAgIHZhciB1cGRhdGVEb3dubG9hZEZvcm1hdFJhbmdlT3B0aW9ucyA9IGZ1bmN0aW9uKG9wdGlvbikge1xuICAgICAgcmFuZ2VPcHRpb25zLmZvckVhY2goZnVuY3Rpb24ocmFuZ2VPcHRpb24pIHtcbiAgICAgICAgdmFyIGlucHV0ID0gcmFuZ2VPcHRpb24ucXVlcnlTZWxlY3RvcignaW5wdXQnKTtcbiAgICAgICAgaW5wdXQuZGlzYWJsZWQgPSAhIHJhbmdlT3B0aW9uLm1hdGNoZXMoYFtkYXRhLWRvd25sb2FkLWZvcm1hdC10YXJnZXR+PVwiJHtvcHRpb24udmFsdWV9XCJdYCk7XG4gICAgICB9KVxuICAgICAgXG4gICAgICAvLyBpZiAoICEgaGFzRnVsbFBkZkFjY2VzcyApIHtcbiAgICAgIC8vICAgdmFyIGNoZWNrZWQgPSBkb3dubG9hZEZvcm0ucXVlcnlTZWxlY3RvcihgW2RhdGEtZG93bmxvYWQtZm9ybWF0LXRhcmdldF1bZGF0YS12aWV3LXRhcmdldH49XCIke0hULnJlYWRlci52aWV3Lm5hbWV9XCJdIGlucHV0OmNoZWNrZWRgKTtcbiAgICAgIC8vICAgaWYgKCAhIGNoZWNrZWQgKSB7XG4gICAgICAvLyAgICAgICAvLyBjaGVjayB0aGUgZmlyc3Qgb25lXG4gICAgICAvLyAgICAgICB2YXIgaW5wdXQgPSBkb3dubG9hZEZvcm0ucXVlcnlTZWxlY3RvcihgW2RhdGEtZG93bmxvYWQtZm9ybWF0LXRhcmdldF1bZGF0YS12aWV3LXRhcmdldH49XCIke0hULnJlYWRlci52aWV3Lm5hbWV9XCJdIGlucHV0YCk7XG4gICAgICAvLyAgICAgICBpbnB1dC5jaGVja2VkID0gdHJ1ZTtcbiAgICAgIC8vICAgfVxuICAgICAgLy8gfVxuXG4gICAgICB2YXIgY2hlY2tlZCA9IGRvd25sb2FkRm9ybS5xdWVyeVNlbGVjdG9yKGBbZGF0YS1kb3dubG9hZC1mb3JtYXQtdGFyZ2V0XVtkYXRhLXZpZXctdGFyZ2V0fj1cIiR7SFQucmVhZGVyLnZpZXcubmFtZX1cIl0gaW5wdXQ6Y2hlY2tlZGApO1xuICAgICAgaWYgKCAhIGNoZWNrZWQgKSB7XG4gICAgICAgICAgLy8gY2hlY2sgdGhlIGZpcnN0IG9uZVxuICAgICAgICAgIHZhciBpbnB1dCA9IGRvd25sb2FkRm9ybS5xdWVyeVNlbGVjdG9yKGBbZGF0YS1kb3dubG9hZC1mb3JtYXQtdGFyZ2V0XVtkYXRhLXZpZXctdGFyZ2V0fj1cIiR7SFQucmVhZGVyLnZpZXcubmFtZX1cIl0gaW5wdXRgKTtcbiAgICAgICAgICBpbnB1dC5jaGVja2VkID0gdHJ1ZTtcbiAgICAgIH1cblxuICAgIH1cbiAgICBkb3dubG9hZEZvcm1hdE9wdGlvbnMuZm9yRWFjaChmdW5jdGlvbihvcHRpb24pIHtcbiAgICAgIG9wdGlvbi5hZGRFdmVudExpc3RlbmVyKCdjaGFuZ2UnLCBmdW5jdGlvbihldmVudCkge1xuICAgICAgICB1cGRhdGVEb3dubG9hZEZvcm1hdFJhbmdlT3B0aW9ucyh0aGlzKTtcbiAgICAgIH0pXG4gICAgfSlcblxuICAgIHJhbmdlT3B0aW9ucy5mb3JFYWNoKGZ1bmN0aW9uKGRpdikge1xuICAgICAgICB2YXIgaW5wdXQgPSBkaXYucXVlcnlTZWxlY3RvcignaW5wdXQnKTtcbiAgICAgICAgaW5wdXQuYWRkRXZlbnRMaXN0ZW5lcignY2hhbmdlJywgZnVuY3Rpb24oZXZlbnQpIHtcbiAgICAgICAgICAgIGRvd25sb2FkRm9ybWF0T3B0aW9ucy5mb3JFYWNoKGZ1bmN0aW9uKGZvcm1hdE9wdGlvbikge1xuICAgICAgICAgICAgICAgIGZvcm1hdE9wdGlvbi5kaXNhYmxlZCA9ICEgKCBkaXYuZGF0YXNldC5kb3dubG9hZEZvcm1hdFRhcmdldC5pbmRleE9mKGZvcm1hdE9wdGlvbi52YWx1ZSkgPiAtMSApO1xuICAgICAgICAgICAgfSlcbiAgICAgICAgfSlcbiAgICB9KVxuXG4gICAgSFQuZG93bmxvYWRlci51cGRhdGVEb3dubG9hZEZvcm1hdFJhbmdlT3B0aW9ucyA9IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgZm9ybWF0T3B0aW9uID0gZG93bmxvYWRGb3JtYXRPcHRpb25zLmZpbmQoaW5wdXQgPT4gaW5wdXQuY2hlY2tlZCk7XG4gICAgICAgIHVwZGF0ZURvd25sb2FkRm9ybWF0UmFuZ2VPcHRpb25zKGZvcm1hdE9wdGlvbik7XG4gICAgfVxuXG4gICAgLy8gZGVmYXVsdCB0byBQREZcbiAgICB2YXIgcGRmRm9ybWF0T3B0aW9uID0gZG93bmxvYWRGb3JtYXRPcHRpb25zLmZpbmQoaW5wdXQgPT4gaW5wdXQudmFsdWUgPT0gJ3BkZicpO1xuICAgIHBkZkZvcm1hdE9wdGlvbi5jaGVja2VkID0gdHJ1ZTtcbiAgICB1cGRhdGVEb3dubG9hZEZvcm1hdFJhbmdlT3B0aW9ucyhwZGZGb3JtYXRPcHRpb24pO1xuXG4gICAgdmFyIHR1bm5lbEZvcm0gPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcjdHVubmVsLWRvd25sb2FkLW1vZHVsZScpO1xuXG4gICAgZG93bmxvYWRGb3JtLmFkZEV2ZW50TGlzdGVuZXIoJ3N1Ym1pdCcsIGZ1bmN0aW9uKGV2ZW50KSB7XG4gICAgICAgIHZhciBmb3JtYXRPcHRpb24gPSBkb3dubG9hZEZvcm0ucXVlcnlTZWxlY3RvcignaW5wdXRbbmFtZT1cImRvd25sb2FkX2Zvcm1hdFwiXTpjaGVja2VkJyk7XG4gICAgICAgIHZhciByYW5nZU9wdGlvbiA9IGRvd25sb2FkRm9ybS5xdWVyeVNlbGVjdG9yKCdpbnB1dFtuYW1lPVwicmFuZ2VcIl06Y2hlY2tlZDpub3QoOmRpc2FibGVkKScpO1xuXG4gICAgICAgIHZhciBwcmludGFibGU7XG5cbiAgICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgZXZlbnQuc3RvcFByb3BhZ2F0aW9uKCk7XG5cbiAgICAgICAgaWYgKCAhIHJhbmdlT3B0aW9uICkge1xuICAgICAgICAgICAgLy8gbm8gdmFsaWQgcmFuZ2Ugb3B0aW9uIHdhcyBjaG9zZW5cbiAgICAgICAgICAgIGFsZXJ0KFwiUGxlYXNlIGNob29zZSBhIHZhbGlkIHJhbmdlIGZvciB0aGlzIGRvd25sb2FkIGZvcm1hdC5cIik7XG4gICAgICAgICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG5cbiAgICAgICAgdmFyIGFjdGlvbiA9IHR1bm5lbEZvcm0uZGF0YXNldC5hY3Rpb25UZW1wbGF0ZSArICggZm9ybWF0T3B0aW9uLnZhbHVlID09ICdwbGFpbnRleHQtemlwJyA/ICdwbGFpbnRleHQnIDogZm9ybWF0T3B0aW9uLnZhbHVlICk7XG5cbiAgICAgICAgdmFyIHNlbGVjdGlvbiA9IHsgcGFnZXM6IFtdIH07XG4gICAgICAgIGlmICggcmFuZ2VPcHRpb24udmFsdWUgPT0gJ3NlbGVjdGVkLXBhZ2VzJyApIHtcbiAgICAgICAgICAgIHNlbGVjdGlvbi5wYWdlcyA9IEhULnJlYWRlci5jb250cm9scy5zZWxlY3RpbmF0b3IuX2dldFBhZ2VTZWxlY3Rpb24oKTtcbiAgICAgICAgICAgIHNlbGVjdGlvbi5pc1NlbGVjdGlvbiA9IHRydWU7XG4gICAgICAgICAgICBpZiAoIHNlbGVjdGlvbi5wYWdlcy5sZW5ndGggPT0gMCApIHtcbiAgICAgICAgICAgICAgICB2YXIgYnV0dG9ucyA9IFtdO1xuXG4gICAgICAgICAgICAgICAgdmFyIG1zZyA9IFsgXCI8cD5Zb3UgaGF2ZW4ndCBzZWxlY3RlZCBhbnkgcGFnZXMgdG8gZG93bmxvYWQuPC9wPlwiIF07XG4gICAgICAgICAgICAgICAgaWYgKCBIVC5yZWFkZXIudmlldy5uYW1lID09ICcydXAnICkge1xuICAgICAgICAgICAgICAgICAgICBtc2cucHVzaChcIjxwPlRvIHNlbGVjdCBwYWdlcywgY2xpY2sgaW4gdGhlIHVwcGVyIGxlZnQgb3IgcmlnaHQgY29ybmVyIG9mIHRoZSBwYWdlLlwiKTtcbiAgICAgICAgICAgICAgICAgICAgbXNnLnB1c2goXCI8cCBjbGFzcz1cXFwiY2VudGVyZWRcXFwiPjxpbWcgc3JjPVxcXCIvcHQvd2ViL2dyYXBoaWNzL3ZpZXctZmxpcC5naWZcXFwiIC8+PC9wPlwiKTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBtc2cucHVzaChcIjxwPlRvIHNlbGVjdCBwYWdlcywgY2xpY2sgaW4gdGhlIHVwcGVyIHJpZ2h0IGNvcm5lciBvZiB0aGUgcGFnZS5cIik7XG4gICAgICAgICAgICAgICAgICAgIGlmICggSFQucmVhZGVyLnZpZXcubmFtZSA9PSAndGh1bWInICkge1xuICAgICAgICAgICAgICAgICAgICAgICAgbXNnLnB1c2goXCI8cCBjbGFzcz1cXFwiY2VudGVyZWRcXFwiPjxpbWcgc3JjPVxcXCIvcHQvd2ViL2dyYXBoaWNzL3ZpZXctdGh1bWIuZ2lmXFxcIiAvPjwvcD5cIik7XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBtc2cucHVzaChcIjxwIGNsYXNzPVxcXCJjZW50ZXJlZFxcXCI+PGltZyBzcmM9XFxcIi9wdC93ZWIvZ3JhcGhpY3Mvdmlldy1zY3JvbGwuZ2lmXFxcIiAvPjwvcD5cIik7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgbXNnLnB1c2goXCI8cD48dHQ+c2hpZnQgKyBjbGljazwvdHQ+IHRvIGRlL3NlbGVjdCB0aGUgcGFnZXMgYmV0d2VlbiB0aGlzIHBhZ2UgYW5kIGEgcHJldmlvdXNseSBzZWxlY3RlZCBwYWdlLlwiKTtcbiAgICAgICAgICAgICAgICBtc2cucHVzaChcIjxwPlBhZ2VzIHlvdSBzZWxlY3Qgd2lsbCBiZSBsaXN0ZWQgaW4gdGhlIGRvd25sb2FkIG1vZHVsZS5cIik7XG5cbiAgICAgICAgICAgICAgICBtc2cgPSBtc2cuam9pbihcIlxcblwiKTtcblxuICAgICAgICAgICAgICAgIGJ1dHRvbnMucHVzaCh7XG4gICAgICAgICAgICAgICAgICAgIGxhYmVsOiBcIk9LXCIsXG4gICAgICAgICAgICAgICAgICAgICdjbGFzcycgOiAnYnRuLWRpc21pc3MnXG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgYm9vdGJveC5kaWFsb2cobXNnLCBidXR0b25zKTtcblxuICAgICAgICAgICAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgfVxuICAgICAgICB9IGVsc2UgaWYgKCByYW5nZU9wdGlvbi52YWx1ZS5pbmRleE9mKCdjdXJyZW50LXBhZ2UnKSA+IC0xICkge1xuICAgICAgICAgICAgdmFyIHBhZ2U7XG4gICAgICAgICAgICBzd2l0Y2gocmFuZ2VPcHRpb24udmFsdWUpIHtcbiAgICAgICAgICAgICAgICBjYXNlICdjdXJyZW50LXBhZ2UnOlxuICAgICAgICAgICAgICAgICAgICBwYWdlID0gWyBIVC5yZWFkZXIudmlldy5jdXJyZW50TG9jYXRpb24oKSBdO1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICBjYXNlICdjdXJyZW50LXBhZ2UtdmVyc28nOlxuICAgICAgICAgICAgICAgICAgICBwYWdlID0gWyBIVC5yZWFkZXIudmlldy5jdXJyZW50TG9jYXRpb24oJ1ZFUlNPJykgXTtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgY2FzZSAnY3VycmVudC1wYWdlLXJlY3RvJzpcbiAgICAgICAgICAgICAgICAgICAgcGFnZSA9IFsgSFQucmVhZGVyLnZpZXcuY3VycmVudExvY2F0aW9uKCdSRUNUTycpIF07XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKCAhIHBhZ2UgKSB7XG4gICAgICAgICAgICAgICAgLy8gcHJvYmFibHkgaW1wb3NzaWJsZT9cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHNlbGVjdGlvbi5wYWdlcyA9IFsgcGFnZSBdO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKCBzZWxlY3Rpb24ucGFnZXMubGVuZ3RoID4gMCApIHtcbiAgICAgICAgICAgIHNlbGVjdGlvbi5zZXEgPSBIVC5yZWFkZXIuY29udHJvbHMuc2VsZWN0aW5hdG9yID9cbiAgICAgICAgICAgICAgICAgSFQucmVhZGVyLmNvbnRyb2xzLnNlbGVjdGluYXRvci5fZ2V0RmxhdHRlbmVkU2VsZWN0aW9uKHNlbGVjdGlvbi5wYWdlcykgOiBcbiAgICAgICAgICAgICAgICAgc2VsZWN0aW9uLnBhZ2VzO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKCByYW5nZU9wdGlvbi5kYXRhc2V0LmlzUGFydGlhbCA9PSAndHJ1ZScgJiYgc2VsZWN0aW9uLnBhZ2VzLmxlbmd0aCA8PSAxMCApIHtcblxuICAgICAgICAgICAgLy8gZGVsZXRlIGFueSBleGlzdGluZyBpbnB1dHNcbiAgICAgICAgICAgIHR1bm5lbEZvcm0ucXVlcnlTZWxlY3RvckFsbCgnaW5wdXQ6bm90KFtkYXRhLWZpeGVkXSknKS5mb3JFYWNoKGZ1bmN0aW9uKGlucHV0KSB7XG4gICAgICAgICAgICAgICAgdHVubmVsRm9ybS5yZW1vdmVDaGlsZChpbnB1dCk7XG4gICAgICAgICAgICB9KVxuXG4gICAgICAgICAgICBpZiAoIGZvcm1hdE9wdGlvbi52YWx1ZSA9PSAnaW1hZ2UnICkge1xuICAgICAgICAgICAgICAgIHZhciBzaXplX2F0dHIgPSBcInRhcmdldF9wcGlcIjtcbiAgICAgICAgICAgICAgICB2YXIgaW1hZ2VfZm9ybWF0X2F0dHIgPSAnZm9ybWF0JztcbiAgICAgICAgICAgICAgICB2YXIgc2l6ZV92YWx1ZSA9IFwiMzAwXCI7XG4gICAgICAgICAgICAgICAgaWYgKCBzZWxlY3Rpb24ucGFnZXMubGVuZ3RoID09IDEgKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIHNsaWdodCBkaWZmZXJlbmNlXG4gICAgICAgICAgICAgICAgICAgIGFjdGlvbiA9ICcvY2dpL2ltZ3Nydi9pbWFnZSc7XG4gICAgICAgICAgICAgICAgICAgIHNpemVfYXR0ciA9IFwic2l6ZVwiO1xuICAgICAgICAgICAgICAgICAgICBzaXplX3ZhbHVlID0gXCJwcGk6MzAwXCI7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgdmFyIGlucHV0ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnaW5wdXQnKTtcbiAgICAgICAgICAgICAgICBpbnB1dC5zZXRBdHRyaWJ1dGUoXCJ0eXBlXCIsIFwiaGlkZGVuXCIpO1xuICAgICAgICAgICAgICAgIGlucHV0LnNldEF0dHJpYnV0ZShcIm5hbWVcIiwgc2l6ZV9hdHRyKTtcbiAgICAgICAgICAgICAgICBpbnB1dC5zZXRBdHRyaWJ1dGUoXCJ2YWx1ZVwiLCBzaXplX3ZhbHVlKTtcbiAgICAgICAgICAgICAgICB0dW5uZWxGb3JtLmFwcGVuZENoaWxkKGlucHV0KTtcblxuICAgICAgICAgICAgICAgIHZhciBpbnB1dCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2lucHV0Jyk7XG4gICAgICAgICAgICAgICAgaW5wdXQuc2V0QXR0cmlidXRlKFwidHlwZVwiLCBcImhpZGRlblwiKTtcbiAgICAgICAgICAgICAgICBpbnB1dC5zZXRBdHRyaWJ1dGUoXCJuYW1lXCIsIGltYWdlX2Zvcm1hdF9hdHRyKTtcbiAgICAgICAgICAgICAgICBpbnB1dC5zZXRBdHRyaWJ1dGUoXCJ2YWx1ZVwiLCAnaW1hZ2UvanBlZycpO1xuICAgICAgICAgICAgICAgIHR1bm5lbEZvcm0uYXBwZW5kQ2hpbGQoaW5wdXQpO1xuICAgICAgICAgICAgfSBlbHNlIGlmICggZm9ybWF0T3B0aW9uLnZhbHVlID09ICdwbGFpbnRleHQtemlwJyApIHtcbiAgICAgICAgICAgICAgICB2YXIgaW5wdXQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdpbnB1dCcpO1xuICAgICAgICAgICAgICAgIGlucHV0LnNldEF0dHJpYnV0ZShcInR5cGVcIiwgXCJoaWRkZW5cIik7XG4gICAgICAgICAgICAgICAgaW5wdXQuc2V0QXR0cmlidXRlKFwibmFtZVwiLCAnYnVuZGxlX2Zvcm1hdCcpO1xuICAgICAgICAgICAgICAgIGlucHV0LnNldEF0dHJpYnV0ZShcInZhbHVlXCIsIFwiemlwXCIpO1xuICAgICAgICAgICAgICAgIHR1bm5lbEZvcm0uYXBwZW5kQ2hpbGQoaW5wdXQpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBzZWxlY3Rpb24uc2VxLmZvckVhY2goZnVuY3Rpb24ocmFuZ2UpIHtcbiAgICAgICAgICAgICAgICB2YXIgaW5wdXQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdpbnB1dCcpO1xuICAgICAgICAgICAgICAgIGlucHV0LnNldEF0dHJpYnV0ZShcInR5cGVcIiwgXCJoaWRkZW5cIik7XG4gICAgICAgICAgICAgICAgaW5wdXQuc2V0QXR0cmlidXRlKFwibmFtZVwiLCBcInNlcVwiKTtcbiAgICAgICAgICAgICAgICBpbnB1dC5zZXRBdHRyaWJ1dGUoXCJ2YWx1ZVwiLCByYW5nZSk7XG4gICAgICAgICAgICAgICAgdHVubmVsRm9ybS5hcHBlbmRDaGlsZChpbnB1dCk7XG4gICAgICAgICAgICB9KVxuXG4gICAgICAgICAgICB0dW5uZWxGb3JtLmFjdGlvbiA9IGFjdGlvbjtcbiAgICAgICAgICAgIC8vIEhULmRpc2FibGVVbmxvYWRUaW1lb3V0ID0gdHJ1ZTtcblxuICAgICAgICAgICAgLy8gcmVtb3ZlIG9sZCBpZnJhbWVzXG4gICAgICAgICAgICBkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKCdpZnJhbWUuZG93bmxvYWQtbW9kdWxlJykuZm9yRWFjaChmdW5jdGlvbihpZnJhbWUpIHtcbiAgICAgICAgICAgICAgICBkb2N1bWVudC5ib2R5LnJlbW92ZUNoaWxkKGlmcmFtZSk7XG4gICAgICAgICAgICB9KVxuXG4gICAgICAgICAgICBkb3dubG9hZElkeCArPSAxO1xuICAgICAgICAgICAgdmFyIHRyYWNrZXIgPSBgRCR7ZG93bmxvYWRJZHh9OmA7XG4gICAgICAgICAgICB2YXIgdHJhY2tlcl9pbnB1dCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2lucHV0Jyk7XG4gICAgICAgICAgICB0cmFja2VyX2lucHV0LnNldEF0dHJpYnV0ZSgndHlwZScsICdoaWRkZW4nKTtcbiAgICAgICAgICAgIHRyYWNrZXJfaW5wdXQuc2V0QXR0cmlidXRlKCduYW1lJywgJ3RyYWNrZXInKTtcbiAgICAgICAgICAgIHRyYWNrZXJfaW5wdXQuc2V0QXR0cmlidXRlKCd2YWx1ZScsIHRyYWNrZXIpO1xuICAgICAgICAgICAgdHVubmVsRm9ybS5hcHBlbmRDaGlsZCh0cmFja2VyX2lucHV0KTtcbiAgICAgICAgICAgIHZhciBpZnJhbWUgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdpZnJhbWUnKTtcbiAgICAgICAgICAgIGlmcmFtZS5zZXRBdHRyaWJ1dGUoJ25hbWUnLCBgZG93bmxvYWQtbW9kdWxlLSR7ZG93bmxvYWRJZHh9YCk7XG4gICAgICAgICAgICBpZnJhbWUuc2V0QXR0cmlidXRlKCdhcmlhLWhpZGRlbicsICd0cnVlJyk7XG4gICAgICAgICAgICBpZnJhbWUuc2V0QXR0cmlidXRlKCdjbGFzcycsICdkb3dubG9hZC1tb2R1bGUnKTtcbiAgICAgICAgICAgIGlmcmFtZS5zdHlsZS5vcGFjaXR5ID0gMDtcbiAgICAgICAgICAgIGRvY3VtZW50LmJvZHkuYXBwZW5kQ2hpbGQoaWZyYW1lKTtcbiAgICAgICAgICAgIHR1bm5lbEZvcm0uc2V0QXR0cmlidXRlKCd0YXJnZXQnLCBpZnJhbWUuZ2V0QXR0cmlidXRlKCduYW1lJykpO1xuXG4gICAgICAgICAgICBkb3dubG9hZFN1Ym1pdC5kaXNhYmxlZCA9IHRydWU7XG4gICAgICAgICAgICBkb3dubG9hZFN1Ym1pdC5jbGFzc0xpc3QuYWRkKCdidG4tbG9hZGluZycpO1xuXG4gICAgICAgICAgICB2YXIgdHJhY2tlckludGVydmFsID0gc2V0SW50ZXJ2YWwoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgdmFyIHZhbHVlID0gJC5jb29raWUoJ3RyYWNrZXInKSB8fCAnJztcbiAgICAgICAgICAgICAgICBpZiAoIEhULmlzX2RldiApIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coXCItLT9cIiwgdHJhY2tlciwgdmFsdWUpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAoIHZhbHVlLmluZGV4T2YodHJhY2tlcikgPiAtMSApIHtcbiAgICAgICAgICAgICAgICAgICAgJC5yZW1vdmVDb29raWUoJ3RyYWNrZXInLCB7IHBhdGg6ICcvJ30pO1xuICAgICAgICAgICAgICAgICAgICBjbGVhckludGVydmFsKHRyYWNrZXJJbnRlcnZhbCk7XG4gICAgICAgICAgICAgICAgICAgIGRvd25sb2FkU3VibWl0LmNsYXNzTGlzdC5yZW1vdmUoJ2J0bi1sb2FkaW5nJyk7XG4gICAgICAgICAgICAgICAgICAgIGRvd25sb2FkU3VibWl0LmRpc2FibGVkID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgIEhULmRpc2FibGVVbmxvYWRUaW1lb3V0ID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSwgMTAwKTtcblxuICAgICAgICAgICAgdHVubmVsRm9ybS5zdWJtaXQoKTtcblxuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG5cbiAgICAgICAgdmFyIF9mb3JtYXRfdGl0bGVzID0ge307XG4gICAgICAgIF9mb3JtYXRfdGl0bGVzLnBkZiA9ICdQREYnO1xuICAgICAgICBfZm9ybWF0X3RpdGxlcy5lcHViID0gJ0VQVUInO1xuICAgICAgICBfZm9ybWF0X3RpdGxlcy5wbGFpbnRleHQgPSAnVGV4dCAoLnR4dCknO1xuICAgICAgICBfZm9ybWF0X3RpdGxlc1sncGxhaW50ZXh0LXppcCddID0gJ1RleHQgKC56aXApJztcbiAgICAgICAgX2Zvcm1hdF90aXRsZXMuaW1hZ2UgPSAnSW1hZ2UgKEpQRUcpJztcblxuICAgICAgICAvLyBpbnZva2UgdGhlIGRvd25sb2FkZXJcbiAgICAgICAgSFQuZG93bmxvYWRlci5kb3dubG9hZFBkZih7XG4gICAgICAgICAgICBzcmM6IGFjdGlvbiArICc/aWQ9JyArIEhULnBhcmFtcy5pZCxcbiAgICAgICAgICAgIGl0ZW1fdGl0bGU6IF9mb3JtYXRfdGl0bGVzW2Zvcm1hdE9wdGlvbi52YWx1ZV0sXG4gICAgICAgICAgICBzZWxlY3Rpb246IHNlbGVjdGlvbixcbiAgICAgICAgICAgIGRvd25sb2FkRm9ybWF0OiBmb3JtYXRPcHRpb24udmFsdWUsXG4gICAgICAgICAgICB0cmFja2luZ0FjdGlvbjogcmFuZ2VPcHRpb24udmFsdWVcbiAgICAgICAgfSk7XG5cbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH0pXG5cbn0pO1xuXG4iLCIvLyBzdXBwbHkgbWV0aG9kIGZvciBjcmVhdGluZyBhbiBlbWJlZGRhYmxlIFVSTFxuaGVhZC5yZWFkeShmdW5jdGlvbigpIHtcblxuICAgIHZhciBzaWRlX3Nob3J0ID0gXCI0NTBcIjtcbiAgICB2YXIgc2lkZV9sb25nICA9IFwiNzAwXCI7XG4gICAgdmFyIGh0SWQgPSBIVC5wYXJhbXMuaWQ7XG4gICAgdmFyIGVtYmVkSGVscExpbmsgPSBcImh0dHBzOi8vd3d3LmhhdGhpdHJ1c3Qub3JnL2VtYmVkXCI7XG5cbiAgICB2YXIgY29kZWJsb2NrX3R4dDtcbiAgICB2YXIgY29kZWJsb2NrX3R4dF9hID0gZnVuY3Rpb24odyxoKSB7cmV0dXJuICc8aWZyYW1lIHdpZHRoPVwiJyArIHcgKyAnXCIgaGVpZ2h0PVwiJyArIGggKyAnXCIgJzt9XG4gICAgdmFyIGNvZGVibG9ja190eHRfYiA9ICdzcmM9XCJodHRwczovL2hkbC5oYW5kbGUubmV0LzIwMjcvJyArIGh0SWQgKyAnP3VybGFwcGVuZD0lM0J1aT1lbWJlZFwiPjwvaWZyYW1lPic7XG5cbiAgICB2YXIgJGJsb2NrID0gJChcbiAgICAnPGRpdiBjbGFzcz1cImVtYmVkVXJsQ29udGFpbmVyXCI+JyArXG4gICAgICAgICc8aDM+RW1iZWQgVGhpcyBCb29rICcgK1xuICAgICAgICAgICAgJzxhIGlkPVwiZW1iZWRIZWxwSWNvblwiIGRlZmF1bHQtZm9ybT1cImRhdGEtZGVmYXVsdC1mb3JtXCIgJyArXG4gICAgICAgICAgICAgICAgJ2hyZWY9XCInICsgZW1iZWRIZWxwTGluayArICdcIiB0YXJnZXQ9XCJfYmxhbmtcIj48aSBjbGFzcz1cImljb21vb24gaWNvbW9vbi1oZWxwXCIgYXJpYS1oaWRkZW49XCJ0cnVlXCI+PC9pPjxzcGFuIGNsYXNzPVwib2Zmc2NyZWVuXCI+SGVscDogRW1iZWRkaW5nIEhhdGhpVHJ1c3QgQm9va3M8L3NwYW4+PC9hPjwvaDM+JyArXG4gICAgICAgICc8Zm9ybT4nICsgXG4gICAgICAgICcgICAgPHNwYW4gY2xhc3M9XCJoZWxwLWJsb2NrXCI+Q29weSB0aGUgY29kZSBiZWxvdyBhbmQgcGFzdGUgaXQgaW50byB0aGUgSFRNTCBvZiBhbnkgd2Vic2l0ZSBvciBibG9nLjwvc3Bhbj4nICtcbiAgICAgICAgJyAgICA8bGFiZWwgZm9yPVwiY29kZWJsb2NrXCIgY2xhc3M9XCJvZmZzY3JlZW5cIj5Db2RlIEJsb2NrPC9sYWJlbD4nICtcbiAgICAgICAgJyAgICA8dGV4dGFyZWEgY2xhc3M9XCJpbnB1dC14bGFyZ2VcIiBpZD1cImNvZGVibG9ja1wiIG5hbWU9XCJjb2RlYmxvY2tcIiByb3dzPVwiM1wiPicgK1xuICAgICAgICBjb2RlYmxvY2tfdHh0X2Eoc2lkZV9zaG9ydCwgc2lkZV9sb25nKSArIGNvZGVibG9ja190eHRfYiArICc8L3RleHRhcmVhPicgKyBcbiAgICAgICAgJzxkaXYgY2xhc3M9XCJjb250cm9sc1wiPicgKyBcbiAgICAgICAgICAgICc8aW5wdXQgdHlwZT1cInJhZGlvXCIgbmFtZT1cInZpZXdcIiBpZD1cInZpZXctc2Nyb2xsXCIgdmFsdWU9XCIwXCIgY2hlY2tlZD1cImNoZWNrZWRcIiA+JyArXG4gICAgICAgICAgICAnPGxhYmVsIGNsYXNzPVwicmFkaW8gaW5saW5lXCIgZm9yPVwidmlldy1zY3JvbGxcIj4nICtcbiAgICAgICAgICAgICAgICAnPHNwYW4gY2xhc3M9XCJpY29tb29uIGljb21vb24tc2Nyb2xsXCIvPiBTY3JvbGwgVmlldyAnICtcbiAgICAgICAgICAgICc8L2xhYmVsPicgKyBcbiAgICAgICAgICAgICc8aW5wdXQgdHlwZT1cInJhZGlvXCIgbmFtZT1cInZpZXdcIiBpZD1cInZpZXctZmxpcFwiIHZhbHVlPVwiMVwiID4nICtcbiAgICAgICAgICAgICc8bGFiZWwgY2xhc3M9XCJyYWRpbyBpbmxpbmVcIiBmb3I9XCJ2aWV3LWZsaXBcIj4nICtcbiAgICAgICAgICAgICAgICAnPHNwYW4gY2xhc3M9XCJpY29tb29uIGljb21vb24tYm9vay1hbHQyXCIvPiBGbGlwIFZpZXcgJyArXG4gICAgICAgICAgICAnPC9sYWJlbD4nICtcbiAgICAgICAgJzwvZGl2PicgK1xuICAgICAgICAnPC9mb3JtPicgK1xuICAgICc8L2Rpdj4nXG4gICAgKTtcblxuXG4gICAgLy8gJChcIiNlbWJlZEh0bWxcIikuY2xpY2soZnVuY3Rpb24oZSkge1xuICAgICQoXCJib2R5XCIpLm9uKCdjbGljaycsICcjZW1iZWRIdG1sJywgZnVuY3Rpb24oZSkge1xuICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgIGJvb3Rib3guZGlhbG9nKCRibG9jaywgW1xuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIFwibGFiZWxcIiA6IFwiQ2FuY2VsXCIsXG4gICAgICAgICAgICAgICAgXCJjbGFzc1wiIDogXCJidG4tZGlzbWlzc1wiXG4gICAgICAgICAgICB9XG4gICAgXSk7XG5cbiAgICAgICAgLy8gQ3VzdG9tIHdpZHRoIGZvciBib3VuZGluZyAnLm1vZGFsJyBcbiAgICAgICAgJGJsb2NrLmNsb3Nlc3QoJy5tb2RhbCcpLmFkZENsYXNzKFwiYm9vdGJveE1lZGl1bVdpZHRoXCIpO1xuXG4gICAgICAgIC8vIFNlbGVjdCBlbnRpcmV0eSBvZiBjb2RlYmxvY2sgZm9yIGVhc3kgY29weWluZ1xuICAgICAgICB2YXIgdGV4dGFyZWEgPSAkYmxvY2suZmluZChcInRleHRhcmVhW25hbWU9Y29kZWJsb2NrXVwiKTtcbiAgICB0ZXh0YXJlYS5vbihcImNsaWNrXCIsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgJCh0aGlzKS5zZWxlY3QoKTtcbiAgICB9KTtcblxuICAgICAgICAvLyBNb2RpZnkgY29kZWJsb2NrIHRvIG9uZSBvZiB0d28gdmlld3MgXG4gICAgICAgICQoJ2lucHV0OnJhZGlvW2lkPVwidmlldy1zY3JvbGxcIl0nKS5jbGljayhmdW5jdGlvbiAoKSB7XG4gICAgICAgIGNvZGVibG9ja190eHQgPSBjb2RlYmxvY2tfdHh0X2Eoc2lkZV9zaG9ydCwgc2lkZV9sb25nKSArIGNvZGVibG9ja190eHRfYjsgXG4gICAgICAgICAgICB0ZXh0YXJlYS52YWwoY29kZWJsb2NrX3R4dCk7XG4gICAgICAgIH0pO1xuICAgICAgICAkKCdpbnB1dDpyYWRpb1tpZD1cInZpZXctZmxpcFwiXScpLmNsaWNrKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgY29kZWJsb2NrX3R4dCA9IGNvZGVibG9ja190eHRfYShzaWRlX2xvbmcsIHNpZGVfc2hvcnQpICsgY29kZWJsb2NrX3R4dF9iOyBcbiAgICAgICAgICAgIHRleHRhcmVhLnZhbChjb2RlYmxvY2tfdHh0KTtcbiAgICAgICAgfSk7XG4gICAgfSk7XG59KTtcblxuIiwiLy8gc3VwcGx5IG1ldGhvZCBmb3IgZmVlZGJhY2sgc3lzdGVtXG52YXIgSFQgPSBIVCB8fCB7fTtcbkhULmZlZWRiYWNrID0ge307XG5IVC5mZWVkYmFjay5kaWFsb2cgPSBmdW5jdGlvbigpIHtcbiAgICB2YXIgaHRtbCA9XG4gICAgICAgICc8Zm9ybT4nICtcbiAgICAgICAgJyAgICA8ZmllbGRzZXQ+JyArXG4gICAgICAgICcgICAgICAgIDxsZWdlbmQ+RW1haWwgQWRkcmVzczwvbGVnZW5kPicgK1xuICAgICAgICAnICAgICAgICA8bGFiZWwgZm9yPVwiZW1haWxcIiBjbGFzcz1cIm9mZnNjcmVlblwiPkVNYWlsIEFkZHJlc3M8L2xhYmVsPicgK1xuICAgICAgICAnICAgICAgICA8aW5wdXQgdHlwZT1cInRleHRcIiBjbGFzcz1cImlucHV0LXhsYXJnZVwiIHBsYWNlaG9sZGVyPVwiW1lvdXIgZW1haWwgYWRkcmVzc11cIiBuYW1lPVwiZW1haWxcIiBpZD1cImVtYWlsXCIgLz4nICtcbiAgICAgICAgJyAgICAgICAgPHNwYW4gY2xhc3M9XCJoZWxwLWJsb2NrXCI+V2Ugd2lsbCBtYWtlIGV2ZXJ5IGVmZm9ydCB0byBhZGRyZXNzIGNvcHlyaWdodCBpc3N1ZXMgYnkgdGhlIG5leHQgYnVzaW5lc3MgZGF5IGFmdGVyIG5vdGlmaWNhdGlvbi48L3NwYW4+JyArXG4gICAgICAgICcgICAgPC9maWVsZHNldD4nICtcbiAgICAgICAgJyAgICA8ZmllbGRzZXQ+JyArXG4gICAgICAgICcgICAgICAgIDxsZWdlbmQ+T3ZlcmFsbCBwYWdlIHJlYWRhYmlsaXR5IGFuZCBxdWFsaXR5PC9sZWdlbmQ+JyArXG4gICAgICAgICcgICAgICAgIDxkaXYgY2xhc3M9XCJhbGVydCBhbGVydC1oZWxwXCI+U2VsZWN0IG9uZSBvcHRpb24gdGhhdCBhcHBsaWVzPC9kaXY+JyArXG4gICAgICAgICcgICAgICAgIDxkaXYgY2xhc3M9XCJjb250cm9sXCI+JyArXG4gICAgICAgICcgICAgICAgICAgICA8aW5wdXQgdHlwZT1cInJhZGlvXCIgbmFtZT1cIlF1YWxpdHlcIiBpZD1cInB0LWZlZWRiYWNrLXF1YWxpdHktMVwiIHZhbHVlPVwicmVhZGFibGVcIiAvPicgK1xuICAgICAgICAnICAgICAgICAgICAgPGxhYmVsIGNsYXNzPVwicmFkaW9cIiBmb3I9XCJwdC1mZWVkYmFjay1xdWFsaXR5LTFcIiA+JyArXG4gICAgICAgICcgICAgICAgICAgICAgICAgRmV3IHByb2JsZW1zLCBlbnRpcmUgcGFnZSBpcyByZWFkYWJsZScgK1xuICAgICAgICAnICAgICAgICAgICAgPC9sYWJlbD4nICtcbiAgICAgICAgJyAgICAgICAgPC9kaXY+JyArXG4gICAgICAgICcgICAgICAgIDxkaXYgY2xhc3M9XCJjb250cm9sXCI+JyArXG4gICAgICAgICcgICAgICAgICAgICA8aW5wdXQgdHlwZT1cInJhZGlvXCIgbmFtZT1cIlF1YWxpdHlcIiBpZD1cInB0LWZlZWRiYWNrLXF1YWxpdHktMlwiIHZhbHVlPVwic29tZXByb2JsZW1zXCIgLz4nICtcbiAgICAgICAgJyAgICAgICAgICAgIDxsYWJlbCBjbGFzcz1cInJhZGlvXCIgZm9yPVwicHQtZmVlZGJhY2stcXVhbGl0eS0yXCI+JyArXG4gICAgICAgICcgICAgICAgICAgICAgICAgU29tZSBwcm9ibGVtcywgYnV0IHN0aWxsIHJlYWRhYmxlJyArXG4gICAgICAgICcgICAgICAgICAgICA8L2xhYmVsPicgK1xuICAgICAgICAnICAgICAgICA8L2Rpdj4nICtcbiAgICAgICAgJyAgICAgICAgPGRpdiBjbGFzcz1cImNvbnRyb2xcIj4nICtcbiAgICAgICAgJyAgICAgICAgICAgIDxpbnB1dCB0eXBlPVwicmFkaW9cIiBuYW1lPVwiUXVhbGl0eVwiIHZhbHVlPVwiZGlmZmljdWx0XCIgaWQ9XCJwdC1mZWVkYmFjay1xdWFsaXR5LTNcIiAvPicgK1xuICAgICAgICAnICAgICAgICAgICAgPGxhYmVsIGNsYXNzPVwicmFkaW9cIiBmb3I9XCJwdC1mZWVkYmFjay1xdWFsaXR5LTNcIj4nICtcbiAgICAgICAgJyAgICAgICAgICAgICAgICBTaWduaWZpY2FudCBwcm9ibGVtcywgZGlmZmljdWx0IG9yIGltcG9zc2libGUgdG8gcmVhZCcgK1xuICAgICAgICAnICAgICAgICAgICAgPC9sYWJlbD4nICtcbiAgICAgICAgJyAgICAgICAgPC9kaXY+JyArXG4gICAgICAgICcgICAgICAgIDxkaXYgY2xhc3M9XCJjb250cm9sXCI+JyArXG4gICAgICAgICcgICAgICAgICAgICA8aW5wdXQgdHlwZT1cInJhZGlvXCIgbmFtZT1cIlF1YWxpdHlcIiB2YWx1ZT1cIm5vbmVcIiBjaGVja2VkPVwiY2hlY2tlZFwiIGlkPVwicHQtZmVlZGJhY2stcXVhbGl0eS00XCIgLz4nICtcbiAgICAgICAgJyAgICAgICAgICAgIDxsYWJlbCBjbGFzcz1cInJhZGlvXCIgZm9yPVwicHQtZmVlZGJhY2stcXVhbGl0eS00XCI+JyArXG4gICAgICAgICcgICAgICAgICAgICAgICAgKE5vIHByb2JsZW1zKScgK1xuICAgICAgICAnICAgICAgICAgICAgPC9sYWJlbD4nICtcbiAgICAgICAgJyAgICAgICAgPC9kaXY+JyArXG4gICAgICAgICcgICAgPC9maWVsZHNldD4nICtcbiAgICAgICAgJyAgICA8ZmllbGRzZXQ+JyArXG4gICAgICAgICcgICAgICAgIDxsZWdlbmQ+U3BlY2lmaWMgcGFnZSBpbWFnZSBwcm9ibGVtcz88L2xlZ2VuZD4nICtcbiAgICAgICAgJyAgICAgICAgPGRpdiBjbGFzcz1cImFsZXJ0IGFsZXJ0LWhlbHBcIj5TZWxlY3QgYW55IHRoYXQgYXBwbHk8L2Rpdj4nICtcbiAgICAgICAgJyAgICAgICAgPGRpdiBjbGFzcz1cImNvbnRyb2xcIj4nICtcbiAgICAgICAgJyAgICAgICAgICAgIDxpbnB1dCB0eXBlPVwiY2hlY2tib3hcIiBuYW1lPVwiYmx1cnJ5XCIgdmFsdWU9XCIxXCIgaWQ9XCJwdC1mZWVkYmFjay1wcm9ibGVtcy0xXCIgLz4nICtcbiAgICAgICAgJyAgICAgICAgICAgIDxsYWJlbCBmb3I9XCJwdC1mZWVkYmFjay1wcm9ibGVtcy0xXCI+JyArXG4gICAgICAgICcgICAgICAgICAgICAgICAgTWlzc2luZyBwYXJ0cyBvZiB0aGUgcGFnZScgK1xuICAgICAgICAnICAgICAgICAgICAgPC9sYWJlbD4nICtcbiAgICAgICAgJyAgICAgICAgPC9kaXY+JyArXG4gICAgICAgICcgICAgICAgIDxkaXYgY2xhc3M9XCJjb250cm9sXCI+JyArXG4gICAgICAgICcgICAgICAgICAgICA8aW5wdXQgdHlwZT1cImNoZWNrYm94XCIgbmFtZT1cImJsdXJyeVwiIHZhbHVlPVwiMVwiIGlkPVwicHQtZmVlZGJhY2stcHJvYmxlbXMtMlwiICAvPicgK1xuICAgICAgICAnICAgICAgICAgICAgPGxhYmVsIGZvcj1cInB0LWZlZWRiYWNrLXByb2JsZW1zLTJcIj4nICtcbiAgICAgICAgJyAgICAgICAgICAgICAgICBCbHVycnkgdGV4dCcgK1xuICAgICAgICAnICAgICAgICAgICAgPC9sYWJlbD4nICtcbiAgICAgICAgJyAgICAgICAgPC9kaXY+JyArXG4gICAgICAgICcgICAgICAgIDxkaXYgY2xhc3M9XCJjb250cm9sXCI+JyArXG4gICAgICAgICcgICAgICAgICAgICA8aW5wdXQgdHlwZT1cImNoZWNrYm94XCIgbmFtZT1cImN1cnZlZFwiIHZhbHVlPVwiMVwiIGlkPVwicHQtZmVlZGJhY2stcHJvYmxlbXMtM1wiICAvPicgK1xuICAgICAgICAnICAgICAgICAgICAgPGxhYmVsIGZvcj1cInB0LWZlZWRiYWNrLXByb2JsZW1zLTNcIj4nICtcbiAgICAgICAgJyAgICAgICAgICAgICAgICBDdXJ2ZWQgb3IgZGlzdG9ydGVkIHRleHQnICtcbiAgICAgICAgJyAgICAgICAgICAgIDwvbGFiZWw+JyArXG4gICAgICAgICcgICAgICAgIDwvZGl2PicgK1xuICAgICAgICAnICAgICAgICA8ZGl2IGNsYXNzPVwiY29udHJvbFwiPicgK1xuICAgICAgICAnICAgICAgICAgICAgPGxhYmVsIGZvcj1cInB0LWZlZWRiYWNrLXByb2JsZW1zLW90aGVyXCI+T3RoZXIgcHJvYmxlbSA8L2xhYmVsPjxpbnB1dCB0eXBlPVwidGV4dFwiIGNsYXNzPVwiaW5wdXQtbWVkaXVtXCIgbmFtZT1cIm90aGVyXCIgdmFsdWU9XCJcIiBpZD1cInB0LWZlZWRiYWNrLXByb2JsZW1zLW90aGVyXCIgIC8+JyArXG4gICAgICAgICcgICAgICAgIDwvZGl2PicgK1xuICAgICAgICAnICAgIDwvZmllbGRzZXQ+JyArXG4gICAgICAgICcgICAgPGZpZWxkc2V0PicgK1xuICAgICAgICAnICAgICAgICA8bGVnZW5kPlByb2JsZW1zIHdpdGggYWNjZXNzIHJpZ2h0cz88L2xlZ2VuZD4nICtcbiAgICAgICAgJyAgICAgICAgPHNwYW4gY2xhc3M9XCJoZWxwLWJsb2NrXCIgc3R5bGU9XCJtYXJnaW4tYm90dG9tOiAxcmVtO1wiPjxzdHJvbmc+JyArXG4gICAgICAgICcgICAgICAgICAgICAoU2VlIGFsc286IDxhIGhyZWY9XCJodHRwOi8vd3d3LmhhdGhpdHJ1c3Qub3JnL3Rha2VfZG93bl9wb2xpY3lcIiB0YXJnZXQ9XCJfYmxhbmtcIj50YWtlLWRvd24gcG9saWN5PC9hPiknICtcbiAgICAgICAgJyAgICAgICAgPC9zdHJvbmc+PC9zcGFuPicgK1xuICAgICAgICAnICAgICAgICA8ZGl2IGNsYXNzPVwiYWxlcnQgYWxlcnQtaGVscFwiPlNlbGVjdCBvbmUgb3B0aW9uIHRoYXQgYXBwbGllczwvZGl2PicgK1xuICAgICAgICAnICAgICAgICA8ZGl2IGNsYXNzPVwiY29udHJvbFwiPicgK1xuICAgICAgICAnICAgICAgICAgICAgPGlucHV0IHR5cGU9XCJyYWRpb1wiIG5hbWU9XCJSaWdodHNcIiB2YWx1ZT1cIm5vYWNjZXNzXCIgaWQ9XCJwdC1mZWVkYmFjay1hY2Nlc3MtMVwiIC8+JyArXG4gICAgICAgICcgICAgICAgICAgICA8bGFiZWwgZm9yPVwicHQtZmVlZGJhY2stYWNjZXNzLTFcIj4nICtcbiAgICAgICAgJyAgICAgICAgICAgICAgICBUaGlzIGl0ZW0gaXMgaW4gdGhlIHB1YmxpYyBkb21haW4sIGJ1dCBJIGRvblxcJ3QgaGF2ZSBhY2Nlc3MgdG8gaXQuJyArXG4gICAgICAgICcgICAgICAgICAgICA8L2xhYmVsPicgK1xuICAgICAgICAnICAgICAgICA8L2Rpdj4nICtcbiAgICAgICAgJyAgICAgICAgPGRpdiBjbGFzcz1cImNvbnRyb2xcIj4nICtcbiAgICAgICAgJyAgICAgICAgICAgIDxpbnB1dCB0eXBlPVwicmFkaW9cIiBuYW1lPVwiUmlnaHRzXCIgdmFsdWU9XCJhY2Nlc3NcIiBpZD1cInB0LWZlZWRiYWNrLWFjY2Vzcy0yXCIgLz4nICtcbiAgICAgICAgJyAgICAgICAgICAgIDxsYWJlbCBmb3I9XCJwdC1mZWVkYmFjay1hY2Nlc3MtMlwiPicgK1xuICAgICAgICAnICAgICAgICAgICAgICAgICAgICBJIGhhdmUgYWNjZXNzIHRvIHRoaXMgaXRlbSwgYnV0IHNob3VsZCBub3QuJyArXG4gICAgICAgICcgICAgICAgICAgICA8L2xhYmVsPicgK1xuICAgICAgICAnICAgICAgICA8L2Rpdj4nICtcbiAgICAgICAgJyAgICAgICAgPGRpdiBjbGFzcz1cImNvbnRyb2xcIj4nICtcbiAgICAgICAgJyAgICAgICAgICAgIDxpbnB1dCB0eXBlPVwicmFkaW9cIiBuYW1lPVwiUmlnaHRzXCIgdmFsdWU9XCJub25lXCIgY2hlY2tlZD1cImNoZWNrZWRcIiBpZD1cInB0LWZlZWRiYWNrLWFjY2Vzcy0zXCIgLz4nICtcbiAgICAgICAgJyAgICAgICAgICAgIDxsYWJlbCBmb3I9XCJwdC1mZWVkYmFjay1hY2Nlc3MtM1wiPicgK1xuICAgICAgICAnICAgICAgICAgICAgICAgIChObyBwcm9ibGVtcyknICtcbiAgICAgICAgJyAgICAgICAgICAgIDwvbGFiZWw+JyArXG4gICAgICAgICcgICAgICAgIDwvZGl2PicgK1xuICAgICAgICAnICAgIDwvZmllbGRzZXQ+JyArXG4gICAgICAgICcgICAgPGZpZWxkc2V0PicgKyBcbiAgICAgICAgJyAgICAgICAgPGxlZ2VuZD5PdGhlciBwcm9ibGVtcyBvciBjb21tZW50cz88L2xlZ2VuZD4nICtcbiAgICAgICAgJyAgICAgICAgPHA+JyArXG4gICAgICAgICcgICAgICAgICAgICA8bGFiZWwgY2xhc3M9XCJvZmZzY3JlZW5cIiBmb3I9XCJjb21tZW50c1wiPk90aGVyIHByb2JsZW1zIG9yIGNvbW1lbnRzPzwvbGFiZWw+JyArXG4gICAgICAgICcgICAgICAgICAgICA8dGV4dGFyZWEgaWQ9XCJjb21tZW50c1wiIG5hbWU9XCJjb21tZW50c1wiIHJvd3M9XCIzXCI+PC90ZXh0YXJlYT4nICtcbiAgICAgICAgJyAgICAgICAgPC9wPicgK1xuICAgICAgICAnICAgIDwvZmllbGRzZXQ+JyArXG4gICAgICAgICc8L2Zvcm0+JztcblxuICAgIHZhciAkZm9ybSA9ICQoaHRtbCk7XG5cbiAgICAvLyBoaWRkZW4gZmllbGRzXG4gICAgJChcIjxpbnB1dCB0eXBlPSdoaWRkZW4nIG5hbWU9J1N5c0lEJyAvPlwiKS52YWwoSFQucGFyYW1zLmlkKS5hcHBlbmRUbygkZm9ybSk7XG4gICAgJChcIjxpbnB1dCB0eXBlPSdoaWRkZW4nIG5hbWU9J1JlY29yZFVSTCcgLz5cIikudmFsKEhULnBhcmFtcy5SZWNvcmRVUkwpLmFwcGVuZFRvKCRmb3JtKTtcblxuICAgIGlmICggSFQuY3Jtc19zdGF0ZSApIHtcbiAgICAgICAgJChcIjxpbnB1dCB0eXBlPSdoaWRkZW4nIG5hbWU9J0NSTVMnIC8+XCIpLnZhbChIVC5jcm1zX3N0YXRlKS5hcHBlbmRUbygkZm9ybSk7XG4gICAgICAgIHZhciAkZW1haWwgPSAkZm9ybS5maW5kKFwiI2VtYWlsXCIpO1xuICAgICAgICAkZW1haWwudmFsKEhULmNybXNfc3RhdGUpO1xuICAgICAgICAkZW1haWwuaGlkZSgpO1xuICAgICAgICAkKFwiPHNwYW4+XCIgKyBIVC5jcm1zX3N0YXRlICsgXCI8L3NwYW4+PGJyIC8+XCIpLmluc2VydEFmdGVyKCRlbWFpbCk7XG4gICAgICAgICRmb3JtLmZpbmQoXCIuaGVscC1ibG9ja1wiKS5oaWRlKCk7XG4gICAgfVxuXG4gICAgaWYgKCBIVC5yZWFkZXIgKSB7XG4gICAgICAgICQoXCI8aW5wdXQgdHlwZT0naGlkZGVuJyBuYW1lPSdTZXFObycgLz5cIikudmFsKEhULnBhcmFtcy5zZXEpLmFwcGVuZFRvKCRmb3JtKTtcbiAgICB9IGVsc2UgaWYgKCBIVC5wYXJhbXMuc2VxICkge1xuICAgICAgICAkKFwiPGlucHV0IHR5cGU9J2hpZGRlbicgbmFtZT0nU2VxTm8nIC8+XCIpLnZhbChIVC5wYXJhbXMuc2VxKS5hcHBlbmRUbygkZm9ybSk7XG4gICAgfVxuICAgICQoXCI8aW5wdXQgdHlwZT0naGlkZGVuJyBuYW1lPSd2aWV3JyAvPlwiKS52YWwoSFQucGFyYW1zLnZpZXcpLmFwcGVuZFRvKCRmb3JtKTtcblxuICAgIC8vIGlmICggSFQuY3Jtc19zdGF0ZSApIHtcbiAgICAvLyAgICAgJGZvcm0uZmluZChcIiNlbWFpbFwiKS52YWwoSFQuY3Jtc19zdGF0ZSk7XG4gICAgLy8gfVxuXG5cbiAgICByZXR1cm4gJGZvcm07XG59O1xuIiwiaGVhZC5yZWFkeShmdW5jdGlvbigpIHtcblxuICAgIHJldHVybjtcblxuICAgIHZhciBpbml0ZWQgPSBmYWxzZTtcblxuICAgIHZhciAkZm9ybSA9ICQoXCIjc2VhcmNoLW1vZGFsIGZvcm1cIik7XG5cbiAgICB2YXIgJGlucHV0ID0gJGZvcm0uZmluZChcImlucHV0LnNlYXJjaC1pbnB1dC10ZXh0XCIpO1xuICAgIHZhciAkaW5wdXRfbGFiZWwgPSAkZm9ybS5maW5kKFwibGFiZWxbZm9yPSdxMS1pbnB1dCddXCIpO1xuICAgIHZhciAkc2VsZWN0ID0gJGZvcm0uZmluZChcIi5jb250cm9sLXNlYXJjaHR5cGVcIik7XG4gICAgdmFyICRzZWFyY2hfdGFyZ2V0ID0gJGZvcm0uZmluZChcIi5zZWFyY2gtdGFyZ2V0XCIpO1xuICAgIHZhciAkZnQgPSAkZm9ybS5maW5kKFwic3Bhbi5mdW5reS1mdWxsLXZpZXdcIik7XG5cbiAgICB2YXIgJGJhY2tkcm9wID0gbnVsbDtcblxuICAgIHZhciAkYWN0aW9uID0gJChcIiNhY3Rpb24tc2VhcmNoLWhhdGhpdHJ1c3RcIik7XG4gICAgJGFjdGlvbi5vbignY2xpY2snLCBmdW5jdGlvbigpIHtcbiAgICAgICAgYm9vdGJveC5zaG93KCdzZWFyY2gtbW9kYWwnLCB7XG4gICAgICAgICAgICBvblNob3c6IGZ1bmN0aW9uKG1vZGFsKSB7XG4gICAgICAgICAgICAgICAgJGlucHV0LmZvY3VzKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH0pXG5cbiAgICB2YXIgX3NldHVwID0ge307XG4gICAgX3NldHVwLmxzID0gZnVuY3Rpb24oKSB7XG4gICAgICAgICRzZWxlY3QuaGlkZSgpO1xuICAgICAgICAkaW5wdXQuYXR0cigncGxhY2Vob2xkZXInLCAnU2VhcmNoIHdvcmRzIGFib3V0IG9yIHdpdGhpbiB0aGUgaXRlbXMnKTtcbiAgICAgICAgJGlucHV0X2xhYmVsLnRleHQoJ1NlYXJjaCBmdWxsLXRleHQgaW5kZXgnKTtcbiAgICAgICAgaWYgKCBpbml0ZWQgKSB7XG4gICAgICAgICAgICBIVC51cGRhdGVfc3RhdHVzKFwiU2VhcmNoIHdpbGwgdXNlIHRoZSBmdWxsLXRleHQgaW5kZXguXCIpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgX3NldHVwLmNhdGFsb2cgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgJHNlbGVjdC5zaG93KCk7XG4gICAgICAgICRpbnB1dC5hdHRyKCdwbGFjZWhvbGRlcicsICdTZWFyY2ggd29yZHMgYWJvdXQgdGhlIGl0ZW1zJyk7XG4gICAgICAgICRpbnB1dF9sYWJlbC50ZXh0KCdTZWFyY2ggY2F0YWxvZyBpbmRleCcpO1xuICAgICAgICBpZiAoIGluaXRlZCApIHtcbiAgICAgICAgICAgIEhULnVwZGF0ZV9zdGF0dXMoXCJTZWFyY2ggd2lsbCB1c2UgdGhlIGNhdGFsb2cgaW5kZXg7IHlvdSBjYW4gbGltaXQgeW91ciBzZWFyY2ggdG8gYSBzZWxlY3Rpb24gb2YgZmllbGRzLlwiKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHZhciB0YXJnZXQgPSAkc2VhcmNoX3RhcmdldC5maW5kKFwiaW5wdXQ6Y2hlY2tlZFwiKS52YWwoKTtcbiAgICBfc2V0dXBbdGFyZ2V0XSgpO1xuICAgIGluaXRlZCA9IHRydWU7XG5cbiAgICB2YXIgcHJlZnMgPSBIVC5wcmVmcy5nZXQoKTtcbiAgICBpZiAoIHByZWZzLnNlYXJjaCAmJiBwcmVmcy5zZWFyY2guZnQgKSB7XG4gICAgICAgICQoXCJpbnB1dFtuYW1lPWZ0XVwiKS5hdHRyKCdjaGVja2VkJywgJ2NoZWNrZWQnKTtcbiAgICB9XG5cbiAgICAkc2VhcmNoX3RhcmdldC5vbignY2hhbmdlJywgJ2lucHV0W3R5cGU9XCJyYWRpb1wiXScsIGZ1bmN0aW9uKGUpIHtcbiAgICAgICAgdmFyIHRhcmdldCA9IHRoaXMudmFsdWU7XG4gICAgICAgIF9zZXR1cFt0YXJnZXRdKCk7XG4gICAgICAgIEhULmFuYWx5dGljcy50cmFja0V2ZW50KHsgbGFiZWwgOiBcIi1cIiwgY2F0ZWdvcnkgOiBcIkhUIFNlYXJjaFwiLCBhY3Rpb24gOiB0YXJnZXQgfSk7XG4gICAgfSlcblxuICAgIC8vICRmb3JtLmRlbGVnYXRlKCc6aW5wdXQnLCAnZm9jdXMgY2hhbmdlJywgZnVuY3Rpb24oZSkge1xuICAgIC8vICAgICBjb25zb2xlLmxvZyhcIkZPQ1VTSU5HXCIsIHRoaXMpO1xuICAgIC8vICAgICAkZm9ybS5hZGRDbGFzcyhcImZvY3VzZWRcIik7XG4gICAgLy8gICAgIGlmICggJGJhY2tkcm9wID09IG51bGwgKSB7XG4gICAgLy8gICAgICAgICAkYmFja2Ryb3AgPSAkKCc8ZGl2IGNsYXNzPVwibW9kYWxfX292ZXJsYXkgaW52aXNpYmxlXCI+PC9kaXY+Jyk7XG4gICAgLy8gICAgICAgICAkYmFja2Ryb3Aub24oJ2NsaWNrJywgZnVuY3Rpb24oKSB7XG4gICAgLy8gICAgICAgICAgICAgY2xvc2Vfc2VhcmNoX2Zvcm0oKTtcbiAgICAvLyAgICAgICAgIH0pO1xuICAgIC8vICAgICB9XG4gICAgLy8gICAgICRiYWNrZHJvcC5hcHBlbmRUbygkKFwiYm9keVwiKSkuc2hvdygpO1xuICAgIC8vIH0pXG5cbiAgICAvLyAkKFwiYm9keVwiKS5vbignZm9jdXMnLCAnOmlucHV0LGEnLCBmdW5jdGlvbihlKSB7XG4gICAgLy8gICAgIHZhciAkdGhpcyA9ICQodGhpcyk7XG4gICAgLy8gICAgIGlmICggISAkdGhpcy5jbG9zZXN0KFwiLm5hdi1zZWFyY2gtZm9ybVwiKS5sZW5ndGggKSB7XG4gICAgLy8gICAgICAgICBjbG9zZV9zZWFyY2hfZm9ybSgpO1xuICAgIC8vICAgICB9XG4gICAgLy8gfSk7XG5cbiAgICAvLyB2YXIgY2xvc2Vfc2VhcmNoX2Zvcm0gPSBmdW5jdGlvbigpIHtcbiAgICAvLyAgICAgJGZvcm0ucmVtb3ZlQ2xhc3MoXCJmb2N1c2VkXCIpO1xuICAgIC8vICAgICBpZiAoICRiYWNrZHJvcCAhPSBudWxsICkge1xuICAgIC8vICAgICAgICAgJGJhY2tkcm9wLmRldGFjaCgpO1xuICAgIC8vICAgICAgICAgJGJhY2tkcm9wLmhpZGUoKTtcbiAgICAvLyAgICAgfVxuICAgIC8vIH1cblxuICAgIC8vIGFkZCBldmVudCBoYW5kbGVyIGZvciBzdWJtaXQgdG8gY2hlY2sgZm9yIGVtcHR5IHF1ZXJ5IG9yIGFzdGVyaXNrXG4gICAgJGZvcm0uc3VibWl0KGZ1bmN0aW9uKGV2ZW50KVxuICAgICAgICAge1xuXG4gICAgICAgICAgICBpZiAoICEgdGhpcy5jaGVja1ZhbGlkaXR5KCkgKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5yZXBvcnRWYWxpZGl0eSgpO1xuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAvL2NoZWNrIGZvciBibGFuayBvciBzaW5nbGUgYXN0ZXJpc2tcbiAgICAgICAgICAgdmFyICRpbnB1dCA9ICQodGhpcykuZmluZChcImlucHV0W25hbWU9cTFdXCIpO1xuICAgICAgICAgICB2YXIgcXVlcnkgPSAkaW5wdXQudmFsKCk7XG4gICAgICAgICAgIHF1ZXJ5ID0gJC50cmltKHF1ZXJ5KTtcbiAgICAgICAgICAgaWYgKHF1ZXJ5ID09PSAnJylcbiAgICAgICAgICAge1xuICAgICAgICAgICAgIGFsZXJ0KFwiUGxlYXNlIGVudGVyIGEgc2VhcmNoIHRlcm0uXCIpO1xuICAgICAgICAgICAgICRpbnB1dC50cmlnZ2VyKCdibHVyJyk7XG4gICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICB9XG4gICAgICAgICAgIC8vIC8vICogIEJpbGwgc2F5cyBnbyBhaGVhZCBhbmQgZm9yd2FyZCBhIHF1ZXJ5IHdpdGggYW4gYXN0ZXJpc2sgICAjIyMjIyNcbiAgICAgICAgICAgLy8gZWxzZSBpZiAocXVlcnkgPT09ICcqJylcbiAgICAgICAgICAgLy8ge1xuICAgICAgICAgICAvLyAgIC8vIGNoYW5nZSBxMSB0byBibGFua1xuICAgICAgICAgICAvLyAgICQoXCIjcTEtaW5wdXRcIikudmFsKFwiXCIpXG4gICAgICAgICAgIC8vICAgJChcIi5zZWFyY2gtZm9ybVwiKS5zdWJtaXQoKTtcbiAgICAgICAgICAgLy8gfVxuICAgICAgICAgICAvLyAjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMqXG4gICAgICAgICAgIGVsc2VcbiAgICAgICAgICAge1xuXG4gICAgICAgICAgICAvLyBzYXZlIGxhc3Qgc2V0dGluZ3NcbiAgICAgICAgICAgIHZhciBzZWFyY2h0eXBlID0gKCB0YXJnZXQgPT0gJ2xzJyApID8gJ2FsbCcgOiAkc2VsZWN0LmZpbmQoXCJzZWxlY3RcIikudmFsKCk7XG4gICAgICAgICAgICBIVC5wcmVmcy5zZXQoeyBzZWFyY2ggOiB7IGZ0IDogJChcImlucHV0W25hbWU9ZnRdOmNoZWNrZWRcIikubGVuZ3RoID4gMCwgdGFyZ2V0IDogdGFyZ2V0LCBzZWFyY2h0eXBlOiBzZWFyY2h0eXBlIH19KVxuXG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICAgfVxuXG4gICAgIH0gKTtcblxufSlcbiIsInZhciBIVCA9IEhUIHx8IHt9O1xuaGVhZC5yZWFkeShmdW5jdGlvbigpIHtcblxuICBIVC5hbmFseXRpY3MuZ2V0Q29udGVudEdyb3VwRGF0YSA9IGZ1bmN0aW9uKCkge1xuICAgIC8vIGNoZWF0XG4gICAgdmFyIHN1ZmZpeCA9ICcnO1xuICAgIHZhciBjb250ZW50X2dyb3VwID0gNDtcbiAgICBpZiAoICQoXCIjc2VjdGlvblwiKS5kYXRhKFwidmlld1wiKSA9PSAncmVzdHJpY3RlZCcgKSB7XG4gICAgICBjb250ZW50X2dyb3VwID0gMjtcbiAgICAgIHN1ZmZpeCA9ICcjcmVzdHJpY3RlZCc7XG4gICAgfSBlbHNlIGlmICggd2luZG93LmxvY2F0aW9uLmhyZWYuaW5kZXhPZihcImRlYnVnPXN1cGVyXCIpID4gLTEgKSB7XG4gICAgICBjb250ZW50X2dyb3VwID0gMztcbiAgICAgIHN1ZmZpeCA9ICcjc3VwZXInO1xuICAgIH1cbiAgICByZXR1cm4geyBpbmRleCA6IGNvbnRlbnRfZ3JvdXAsIHZhbHVlIDogSFQucGFyYW1zLmlkICsgc3VmZml4IH07XG5cbiAgfVxuXG4gIEhULmFuYWx5dGljcy5fc2ltcGxpZnlQYWdlSHJlZiA9IGZ1bmN0aW9uKGhyZWYpIHtcbiAgICB2YXIgdXJsID0gJC51cmwoaHJlZik7XG4gICAgdmFyIG5ld19ocmVmID0gdXJsLnNlZ21lbnQoKTtcbiAgICBuZXdfaHJlZi5wdXNoKCQoXCJodG1sXCIpLmRhdGEoJ2NvbnRlbnQtcHJvdmlkZXInKSk7XG4gICAgbmV3X2hyZWYucHVzaCh1cmwucGFyYW0oXCJpZFwiKSk7XG4gICAgdmFyIHFzID0gJyc7XG4gICAgaWYgKCBuZXdfaHJlZi5pbmRleE9mKFwic2VhcmNoXCIpID4gLTEgJiYgdXJsLnBhcmFtKCdxMScpICApIHtcbiAgICAgIHFzID0gJz9xMT0nICsgdXJsLnBhcmFtKCdxMScpO1xuICAgIH1cbiAgICBuZXdfaHJlZiA9IFwiL1wiICsgbmV3X2hyZWYuam9pbihcIi9cIikgKyBxcztcbiAgICByZXR1cm4gbmV3X2hyZWY7XG4gIH1cblxuICBIVC5hbmFseXRpY3MuZ2V0UGFnZUhyZWYgPSBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gSFQuYW5hbHl0aWNzLl9zaW1wbGlmeVBhZ2VIcmVmKCk7XG4gIH1cblxufSkiLCJoZWFkLnJlYWR5KGZ1bmN0aW9uKCkge1xuICB2YXIgJG1lbnU7IHZhciAkdHJpZ2dlcjsgdmFyICRoZWFkZXI7IHZhciAkbmF2aWdhdG9yO1xuICBIVCA9IEhUIHx8IHt9O1xuXG4gIEhULm1vYmlmeSA9IGZ1bmN0aW9uKCkge1xuXG4gICAgLy8gaWYgKCAkKFwiaHRtbFwiKS5pcyhcIi5kZXNrdG9wXCIpICkge1xuICAgIC8vICAgJChcImh0bWxcIikuYWRkQ2xhc3MoXCJtb2JpbGVcIikucmVtb3ZlQ2xhc3MoXCJkZXNrdG9wXCIpLnJlbW92ZUNsYXNzKFwibm8tbW9iaWxlXCIpO1xuICAgIC8vIH1cblxuICAgICRoZWFkZXIgPSAkKFwiaGVhZGVyXCIpO1xuICAgICRuYXZpZ2F0b3IgPSAkKFwiLmFwcC0tcmVhZGVyLS1uYXZpZ2F0b3JcIik7XG4gICAgaWYgKCAkbmF2aWdhdG9yLmxlbmd0aCApIHtcbiAgICAgIGRvY3VtZW50LmJvZHkuZGF0YXNldC5leHBhbmRlZCA9IHRydWU7XG4gICAgICAvLyAkbmF2aWdhdG9yLmdldCgwKS5zdHlsZS5zZXRQcm9wZXJ0eSgnLS1oZWlnaHQnLCBgLSR7JG5hdmlnYXRvci5vdXRlckhlaWdodCgpICogMC45MH1weGApO1xuICAgICAgLy8gJG5hdmlnYXRvci5nZXQoMCkuZGF0YXNldC5vcmlnaW5hbEhlaWdodCA9IGB7JG5hdmlnYXRvci5vdXRlckhlaWdodCgpfXB4YDtcbiAgICAgIC8vIGRvY3VtZW50LmRvY3VtZW50RWxlbWVudC5zdHlsZS5zZXRQcm9wZXJ0eSgnLS1uYXZpZ2F0b3ItaGVpZ2h0JywgYCR7JG5hdmlnYXRvci5vdXRlckhlaWdodCgpfXB4YCk7XG4gICAgICAvLyB2YXIgJGV4cGFuZG8gPSAkbmF2aWdhdG9yLmZpbmQoXCIuYWN0aW9uLWV4cGFuZG9cIik7XG4gICAgICB2YXIgJGV4cGFuZG8gPSAkKFwiI2FjdGlvbi1leHBhbmRvXCIpO1xuICAgICAgJGV4cGFuZG8ub24oJ2NsaWNrJywgZnVuY3Rpb24oKSB7XG4gICAgICAgIGRvY3VtZW50LmJvZHkuZGF0YXNldC5leHBhbmRlZCA9ICEgKCBkb2N1bWVudC5ib2R5LmRhdGFzZXQuZXhwYW5kZWQgPT0gJ3RydWUnICk7XG4gICAgICAgIHRoaXMuc2V0QXR0cmlidXRlKCdhcmlhLWV4cGFuZGVkJywgKCBkb2N1bWVudC5ib2R5LmRhdGFzZXQuZXhwYW5kZWQgPT0gJ3RydWUnICkpO1xuICAgICAgICAvLyB2YXIgbmF2aWdhdG9ySGVpZ2h0ID0gMDtcbiAgICAgICAgLy8gaWYgKCBkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQuZGF0YXNldC5leHBhbmRlZCA9PSAndHJ1ZScgKSB7XG4gICAgICAgIC8vICAgbmF2aWdhdG9ySGVpZ2h0ID0gJG5hdmlnYXRvci5nZXQoMCkuZGF0YXNldC5vcmlnaW5hbEhlaWdodDtcbiAgICAgICAgLy8gfVxuICAgICAgICAvLyBkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQuc3R5bGUuc2V0UHJvcGVydHkoJy0tbmF2aWdhdG9yLWhlaWdodCcsIG5hdmlnYXRvckhlaWdodCk7XG4gICAgICB9KVxuXG4gICAgICBpZiAoIEhULnBhcmFtcy51aSA9PSAnZW1iZWQnICkge1xuICAgICAgICBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgICAgICAkZXhwYW5kby50cmlnZ2VyKCdjbGljaycpO1xuICAgICAgICB9LCAxMDAwKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBIVC4kbWVudSA9ICRtZW51O1xuXG4gICAgdmFyICRzaWRlYmFyID0gJChcIiNzaWRlYmFyXCIpO1xuXG4gICAgJHRyaWdnZXIgPSAkc2lkZWJhci5maW5kKFwiYnV0dG9uW2FyaWEtZXhwYW5kZWRdXCIpO1xuXG4gICAgJChcIiNhY3Rpb24tbW9iaWxlLXRvZ2dsZS1mdWxsc2NyZWVuXCIpLm9uKCdjbGljaycsIGZ1bmN0aW9uKCkge1xuICAgICAgZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LnJlcXVlc3RGdWxsU2NyZWVuKCk7XG4gICAgfSlcblxuICAgIEhULnV0aWxzID0gSFQudXRpbHMgfHwge307XG5cbiAgICAvLyAkc2lkZWJhci5vbignY2xpY2snLCBmdW5jdGlvbihldmVudCkge1xuICAgICQoXCJib2R5XCIpLm9uKCdjbGljaycsICcuc2lkZWJhci1jb250YWluZXInLCBmdW5jdGlvbihldmVudCkge1xuICAgICAgLy8gaGlkZSB0aGUgc2lkZWJhclxuICAgICAgdmFyICR0aGlzID0gJChldmVudC50YXJnZXQpO1xuICAgICAgaWYgKCAkdGhpcy5pcyhcImlucHV0W3R5cGU9J3RleHQnXSxzZWxlY3RcIikgKSB7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICAgIGlmICggJHRoaXMucGFyZW50cyhcIi5mb3JtLXNlYXJjaC12b2x1bWVcIikubGVuZ3RoICkge1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgICBpZiAoICR0aGlzLmlzKFwiYnV0dG9uLGFcIikgKSB7XG4gICAgICAgIEhULnRvZ2dsZShmYWxzZSk7XG4gICAgICB9XG4gICAgfSlcblxuICAgIGlmICggSFQgJiYgSFQudXRpbHMgJiYgSFQudXRpbHMuaGFuZGxlT3JpZW50YXRpb25DaGFuZ2UgKSB7XG4gICAgICBIVC51dGlscy5oYW5kbGVPcmllbnRhdGlvbkNoYW5nZSgpO1xuICAgIH1cbiAgICBkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQuZGF0YXNldC5leHBhbmRlZCA9ICd0cnVlJztcbiAgfVxuXG4gIEhULnRvZ2dsZSA9IGZ1bmN0aW9uKHN0YXRlKSB7XG5cbiAgICAvLyAkdHJpZ2dlci5hdHRyKCdhcmlhLWV4cGFuZGVkJywgc3RhdGUpO1xuICAgICQoXCIuc2lkZWJhci1jb250YWluZXJcIikuZmluZChcImJ1dHRvblthcmlhLWV4cGFuZGVkXVwiKS5hdHRyKCdhcmlhLWV4cGFuZGVkJywgc3RhdGUpO1xuICAgICQoXCJodG1sXCIpLmdldCgwKS5kYXRhc2V0LnNpZGViYXJFeHBhbmRlZCA9IHN0YXRlO1xuICAgICQoXCJodG1sXCIpLmdldCgwKS5kYXRhc2V0LnZpZXcgPSBzdGF0ZSA/ICdvcHRpb25zJyA6ICd2aWV3ZXInO1xuXG4gICAgLy8gdmFyIHhsaW5rX2hyZWY7XG4gICAgLy8gaWYgKCAkdHJpZ2dlci5hdHRyKCdhcmlhLWV4cGFuZGVkJykgPT0gJ3RydWUnICkge1xuICAgIC8vICAgeGxpbmtfaHJlZiA9ICcjcGFuZWwtZXhwYW5kZWQnO1xuICAgIC8vIH0gZWxzZSB7XG4gICAgLy8gICB4bGlua19ocmVmID0gJyNwYW5lbC1jb2xsYXBzZWQnO1xuICAgIC8vIH1cbiAgICAvLyAkdHJpZ2dlci5maW5kKFwic3ZnIHVzZVwiKS5hdHRyKFwieGxpbms6aHJlZlwiLCB4bGlua19ocmVmKTtcbiAgfVxuXG4gIHNldFRpbWVvdXQoSFQubW9iaWZ5LCAxMDAwKTtcblxuICB2YXIgdXBkYXRlVG9vbGJhclRvcFByb3BlcnR5ID0gZnVuY3Rpb24oKSB7XG4gICAgdmFyIGggPSAkKFwiI3NpZGViYXIgLnNpZGViYXItdG9nZ2xlLWJ1dHRvblwiKS5vdXRlckhlaWdodCgpIHx8IDQwO1xuICAgIHZhciB0b3AgPSAoICQoXCJoZWFkZXJcIikuaGVpZ2h0KCkgKyBoICkgKiAxLjA1O1xuICAgIGRvY3VtZW50LmRvY3VtZW50RWxlbWVudC5zdHlsZS5zZXRQcm9wZXJ0eSgnLS10b29sYmFyLWhvcml6b250YWwtdG9wJywgdG9wICsgJ3B4Jyk7XG4gIH1cbiAgJCh3aW5kb3cpLm9uKCdyZXNpemUnLCB1cGRhdGVUb29sYmFyVG9wUHJvcGVydHkpO1xuICB1cGRhdGVUb29sYmFyVG9wUHJvcGVydHkoKTtcblxuICAkKFwiaHRtbFwiKS5nZXQoMCkuc2V0QXR0cmlidXRlKCdkYXRhLXNpZGViYXItZXhwYW5kZWQnLCBmYWxzZSk7XG5cbn0pXG4iLCJpZiAodHlwZW9mIE9iamVjdC5hc3NpZ24gIT0gJ2Z1bmN0aW9uJykge1xuICAvLyBNdXN0IGJlIHdyaXRhYmxlOiB0cnVlLCBlbnVtZXJhYmxlOiBmYWxzZSwgY29uZmlndXJhYmxlOiB0cnVlXG4gIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShPYmplY3QsIFwiYXNzaWduXCIsIHtcbiAgICB2YWx1ZTogZnVuY3Rpb24gYXNzaWduKHRhcmdldCwgdmFyQXJncykgeyAvLyAubGVuZ3RoIG9mIGZ1bmN0aW9uIGlzIDJcbiAgICAgICd1c2Ugc3RyaWN0JztcbiAgICAgIGlmICh0YXJnZXQgPT0gbnVsbCkgeyAvLyBUeXBlRXJyb3IgaWYgdW5kZWZpbmVkIG9yIG51bGxcbiAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcignQ2Fubm90IGNvbnZlcnQgdW5kZWZpbmVkIG9yIG51bGwgdG8gb2JqZWN0Jyk7XG4gICAgICB9XG5cbiAgICAgIHZhciB0byA9IE9iamVjdCh0YXJnZXQpO1xuXG4gICAgICBmb3IgKHZhciBpbmRleCA9IDE7IGluZGV4IDwgYXJndW1lbnRzLmxlbmd0aDsgaW5kZXgrKykge1xuICAgICAgICB2YXIgbmV4dFNvdXJjZSA9IGFyZ3VtZW50c1tpbmRleF07XG5cbiAgICAgICAgaWYgKG5leHRTb3VyY2UgIT0gbnVsbCkgeyAvLyBTa2lwIG92ZXIgaWYgdW5kZWZpbmVkIG9yIG51bGxcbiAgICAgICAgICBmb3IgKHZhciBuZXh0S2V5IGluIG5leHRTb3VyY2UpIHtcbiAgICAgICAgICAgIC8vIEF2b2lkIGJ1Z3Mgd2hlbiBoYXNPd25Qcm9wZXJ0eSBpcyBzaGFkb3dlZFxuICAgICAgICAgICAgaWYgKE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbChuZXh0U291cmNlLCBuZXh0S2V5KSkge1xuICAgICAgICAgICAgICB0b1tuZXh0S2V5XSA9IG5leHRTb3VyY2VbbmV4dEtleV07XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgICByZXR1cm4gdG87XG4gICAgfSxcbiAgICB3cml0YWJsZTogdHJ1ZSxcbiAgICBjb25maWd1cmFibGU6IHRydWVcbiAgfSk7XG59XG5cbi8vIGZyb206IGh0dHBzOi8vZ2l0aHViLmNvbS9qc2Vyei9qc19waWVjZS9ibG9iL21hc3Rlci9ET00vQ2hpbGROb2RlL2FmdGVyKCkvYWZ0ZXIoKS5tZFxuKGZ1bmN0aW9uIChhcnIpIHtcbiAgYXJyLmZvckVhY2goZnVuY3Rpb24gKGl0ZW0pIHtcbiAgICBpZiAoaXRlbS5oYXNPd25Qcm9wZXJ0eSgnYWZ0ZXInKSkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkoaXRlbSwgJ2FmdGVyJywge1xuICAgICAgY29uZmlndXJhYmxlOiB0cnVlLFxuICAgICAgZW51bWVyYWJsZTogdHJ1ZSxcbiAgICAgIHdyaXRhYmxlOiB0cnVlLFxuICAgICAgdmFsdWU6IGZ1bmN0aW9uIGFmdGVyKCkge1xuICAgICAgICB2YXIgYXJnQXJyID0gQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoYXJndW1lbnRzKSxcbiAgICAgICAgICBkb2NGcmFnID0gZG9jdW1lbnQuY3JlYXRlRG9jdW1lbnRGcmFnbWVudCgpO1xuICAgICAgICBcbiAgICAgICAgYXJnQXJyLmZvckVhY2goZnVuY3Rpb24gKGFyZ0l0ZW0pIHtcbiAgICAgICAgICB2YXIgaXNOb2RlID0gYXJnSXRlbSBpbnN0YW5jZW9mIE5vZGU7XG4gICAgICAgICAgZG9jRnJhZy5hcHBlbmRDaGlsZChpc05vZGUgPyBhcmdJdGVtIDogZG9jdW1lbnQuY3JlYXRlVGV4dE5vZGUoU3RyaW5nKGFyZ0l0ZW0pKSk7XG4gICAgICAgIH0pO1xuICAgICAgICBcbiAgICAgICAgdGhpcy5wYXJlbnROb2RlLmluc2VydEJlZm9yZShkb2NGcmFnLCB0aGlzLm5leHRTaWJsaW5nKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgfSk7XG59KShbRWxlbWVudC5wcm90b3R5cGUsIENoYXJhY3RlckRhdGEucHJvdG90eXBlLCBEb2N1bWVudFR5cGUucHJvdG90eXBlXSk7XG5cbmZ1bmN0aW9uIFJlcGxhY2VXaXRoUG9seWZpbGwoKSB7XG4gICd1c2Utc3RyaWN0JzsgLy8gRm9yIHNhZmFyaSwgYW5kIElFID4gMTBcbiAgdmFyIHBhcmVudCA9IHRoaXMucGFyZW50Tm9kZSwgaSA9IGFyZ3VtZW50cy5sZW5ndGgsIGN1cnJlbnROb2RlO1xuICBpZiAoIXBhcmVudCkgcmV0dXJuO1xuICBpZiAoIWkpIC8vIGlmIHRoZXJlIGFyZSBubyBhcmd1bWVudHNcbiAgICBwYXJlbnQucmVtb3ZlQ2hpbGQodGhpcyk7XG4gIHdoaWxlIChpLS0pIHsgLy8gaS0tIGRlY3JlbWVudHMgaSBhbmQgcmV0dXJucyB0aGUgdmFsdWUgb2YgaSBiZWZvcmUgdGhlIGRlY3JlbWVudFxuICAgIGN1cnJlbnROb2RlID0gYXJndW1lbnRzW2ldO1xuICAgIGlmICh0eXBlb2YgY3VycmVudE5vZGUgIT09ICdvYmplY3QnKXtcbiAgICAgIGN1cnJlbnROb2RlID0gdGhpcy5vd25lckRvY3VtZW50LmNyZWF0ZVRleHROb2RlKGN1cnJlbnROb2RlKTtcbiAgICB9IGVsc2UgaWYgKGN1cnJlbnROb2RlLnBhcmVudE5vZGUpe1xuICAgICAgY3VycmVudE5vZGUucGFyZW50Tm9kZS5yZW1vdmVDaGlsZChjdXJyZW50Tm9kZSk7XG4gICAgfVxuICAgIC8vIHRoZSB2YWx1ZSBvZiBcImlcIiBiZWxvdyBpcyBhZnRlciB0aGUgZGVjcmVtZW50XG4gICAgaWYgKCFpKSAvLyBpZiBjdXJyZW50Tm9kZSBpcyB0aGUgZmlyc3QgYXJndW1lbnQgKGN1cnJlbnROb2RlID09PSBhcmd1bWVudHNbMF0pXG4gICAgICBwYXJlbnQucmVwbGFjZUNoaWxkKGN1cnJlbnROb2RlLCB0aGlzKTtcbiAgICBlbHNlIC8vIGlmIGN1cnJlbnROb2RlIGlzbid0IHRoZSBmaXJzdFxuICAgICAgcGFyZW50Lmluc2VydEJlZm9yZShjdXJyZW50Tm9kZSwgdGhpcy5wcmV2aW91c1NpYmxpbmcpO1xuICB9XG59XG5pZiAoIUVsZW1lbnQucHJvdG90eXBlLnJlcGxhY2VXaXRoKVxuICAgIEVsZW1lbnQucHJvdG90eXBlLnJlcGxhY2VXaXRoID0gUmVwbGFjZVdpdGhQb2x5ZmlsbDtcbmlmICghQ2hhcmFjdGVyRGF0YS5wcm90b3R5cGUucmVwbGFjZVdpdGgpXG4gICAgQ2hhcmFjdGVyRGF0YS5wcm90b3R5cGUucmVwbGFjZVdpdGggPSBSZXBsYWNlV2l0aFBvbHlmaWxsO1xuaWYgKCFEb2N1bWVudFR5cGUucHJvdG90eXBlLnJlcGxhY2VXaXRoKSBcbiAgICBEb2N1bWVudFR5cGUucHJvdG90eXBlLnJlcGxhY2VXaXRoID0gUmVwbGFjZVdpdGhQb2x5ZmlsbDtcblxuIiwiaGVhZC5yZWFkeShmdW5jdGlvbigpIHtcbiAgdmFyICRmb3JtID0gJChcIi5mb3JtLXNlYXJjaC12b2x1bWVcIik7XG5cbiAgdmFyICRib2R5ID0gJChcImJvZHlcIik7XG5cbiAgJCh3aW5kb3cpLm9uKCd1bmRvLWxvYWRpbmcnLCBmdW5jdGlvbigpIHtcbiAgICAkKFwiYnV0dG9uLmJ0bi1sb2FkaW5nXCIpLnJlbW92ZUF0dHIoXCJkaXNhYmxlZFwiKS5yZW1vdmVDbGFzcyhcImJ0bi1sb2FkaW5nXCIpO1xuICB9KVxuXG4gICQoXCJib2R5XCIpLm9uKCdzdWJtaXQnLCAnZm9ybS5mb3JtLXNlYXJjaC12b2x1bWUnLCBmdW5jdGlvbihldmVudCkge1xuICAgIEhULmJlZm9yZVVubG9hZFRpbWVvdXQgPSAxNTAwMDtcbiAgICB2YXIgJGZvcm1fID0gJCh0aGlzKTtcblxuICAgIHZhciAkc3VibWl0ID0gJGZvcm1fLmZpbmQoXCJidXR0b25bdHlwZT1zdWJtaXRdXCIpO1xuICAgIGlmICggJHN1Ym1pdC5oYXNDbGFzcyhcImJ0bi1sb2FkaW5nXCIpICkge1xuICAgICAgYWxlcnQoXCJZb3VyIHNlYXJjaCBxdWVyeSBoYXMgYmVlbiBzdWJtaXR0ZWQgYW5kIGlzIGN1cnJlbnRseSBiZWluZyBwcm9jZXNzZWQuXCIpO1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICB2YXIgJGlucHV0ID0gJGZvcm1fLmZpbmQoXCJpbnB1dFt0eXBlPXRleHRdXCIpXG4gICAgaWYgKCAhICQudHJpbSgkaW5wdXQudmFsKCkpICkge1xuICAgICAgYm9vdGJveC5hbGVydChcIlBsZWFzZSBlbnRlciBhIHRlcm0gaW4gdGhlIHNlYXJjaCBib3guXCIpO1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICAkc3VibWl0LmFkZENsYXNzKFwiYnRuLWxvYWRpbmdcIikuYXR0cihcImRpc2FibGVkXCIsIFwiZGlzYWJsZWRcIik7XG5cbiAgICAkKHdpbmRvdykub24oJ3VubG9hZCcsIGZ1bmN0aW9uKCkge1xuICAgICAgJCh3aW5kb3cpLnRyaWdnZXIoJ3VuZG8tbG9hZGluZycpO1xuICAgIH0pXG5cbiAgICBpZiAoIEhULnJlYWRlciAmJiBIVC5yZWFkZXIuY29udHJvbHMuc2VhcmNoaW5hdG9yICkge1xuICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICAgIHJldHVybiBIVC5yZWFkZXIuY29udHJvbHMuc2VhcmNoaW5hdG9yLnN1Ym1pdCgkZm9ybV8uZ2V0KDApKTtcbiAgICB9XG5cbiAgICAvLyBkZWZhdWx0IHByb2Nlc3NpbmdcbiAgfSlcblxuICAkKFwiI2FjdGlvbi1zdGFydC1qdW1wXCIpLm9uKCdjaGFuZ2UnLCBmdW5jdGlvbigpIHtcbiAgICB2YXIgc3ogPSBwYXJzZUludCgkKHRoaXMpLmRhdGEoJ3N6JyksIDEwKTtcbiAgICB2YXIgdmFsdWUgPSBwYXJzZUludCgkKHRoaXMpLnZhbCgpLCAxMCk7XG4gICAgdmFyIHN0YXJ0ID0gKCB2YWx1ZSAtIDEgKSAqIHN6ICsgMTtcbiAgICB2YXIgJGZvcm1fID0gJChcIiNmb3JtLXNlYXJjaC12b2x1bWVcIik7XG4gICAgJGZvcm1fLmFwcGVuZChgPGlucHV0IG5hbWU9J3N0YXJ0JyB0eXBlPVwiaGlkZGVuXCIgdmFsdWU9XCIke3N0YXJ0fVwiIC8+YCk7XG4gICAgJGZvcm1fLmFwcGVuZChgPGlucHV0IG5hbWU9J3N6JyB0eXBlPVwiaGlkZGVuXCIgdmFsdWU9XCIke3N6fVwiIC8+YCk7XG4gICAgJGZvcm1fLnN1Ym1pdCgpO1xuICB9KVxuXG59KTtcbiIsImhlYWQucmVhZHkoZnVuY3Rpb24oKSB7XG5cbiAgICAkKFwiYm9keVwiKS5vbignY2xpY2snLCAnI3ZlcnNpb25JY29uJywgZnVuY3Rpb24oZSkge1xuICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgIGJvb3Rib3guYWxlcnQoXCI8cD5UaGlzIGlzIHRoZSBkYXRlIHdoZW4gdGhpcyBpdGVtIHdhcyBsYXN0IHVwZGF0ZWQuIFZlcnNpb24gZGF0ZXMgYXJlIHVwZGF0ZWQgd2hlbiBpbXByb3ZlbWVudHMgc3VjaCBhcyBoaWdoZXIgcXVhbGl0eSBzY2FucyBvciBtb3JlIGNvbXBsZXRlIHNjYW5zIGhhdmUgYmVlbiBtYWRlLiA8YnIgLz48YnIgLz48YSBocmVmPVxcXCIvY2dpL2ZlZWRiYWNrP3BhZ2U9Zm9ybVxcXCIgZGF0YS1kZWZhdWx0LWZvcm09XFxcImRhdGEtZGVmYXVsdC1mb3JtXFxcIiBkYXRhLXRvZ2dsZT1cXFwiZmVlZGJhY2sgdHJhY2tpbmctYWN0aW9uXFxcIiBkYXRhLWlkPVxcXCJcXFwiIGRhdGEtdHJhY2tpbmctYWN0aW9uPVxcXCJTaG93IEZlZWRiYWNrXFxcIj5Db250YWN0IHVzPC9hPiBmb3IgbW9yZSBpbmZvcm1hdGlvbi48L3A+XCIpXG4gICAgfSk7XG5cbn0pO1xuIl19
