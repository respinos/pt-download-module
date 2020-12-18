
import NanoEvents from 'nanoevents';
import {Control} from './components/controls';
import {Service, Loader} from './components/imgsrv';
import {View} from './components/views';

import debounce from 'lodash/debounce';

var HT = window.HT || {}; window.HT = HT;
HT.is_dev = false;
HT.force_size = 100;
HT.debug_words = [ 'attorneys', 'judges', 'district' ];

// TODO -- UPDATE ELEMENTS

var $$main = document.querySelector('main');
var $main = document.querySelector(".app--reader--viewer");
var $root = document.querySelector('.app--reader');

var $toolbar = $root.querySelector('#toolbar-vertical');

var Reader = class {
  constructor(options={}) {
    this.options = Object.assign({ scale: 1.0 }, options);
    this.emitter = new NanoEvents();
    this.controls = {};
    this.pagedetails = { rotate: {}, scale: {} };
    this.identifier = this.options.identifier;
    this._trigger = null;
    this.trigger = {
      push: function(value) { this._trigger = value; },
      pop: function() { var retval = this._trigger; this._trigger = null; return retval; }
    }
    this.bindEvents();
  }

  start(params, cb) {
    if ( cb === undefined ) {
      cb = function() {
        this.emit('ready', this.view.name);
        $root.classList.remove('viewer--setup');
        this.view.display(params.seq || 1);
      }.bind(this);
    } else {
      var original_cb = cb;
      cb = function() {
        this.emit('ready', this.view.name);
        $root.classList.remove('viewer--setup');
        original_cb();
      }.bind(this);
    }

    $root.classList.add('viewer--setup');

    if ( params.view ) {
      $$main.dataset.view = $root.dataset.view = params.view; 
      $root.classList.add(`view--${params.view}`);

      if ( params.restarting ) {
        this.emit('status', `Switching to ${params.view} view`);
      }
    }
    if ( params.scale ) { this.options.scale = params.scale; }
    this.setView({ view: $root.dataset.view, seq: ( params.seq || 1 ) });
    setTimeout(function() {
      this.view.attachTo($main, cb);
    }.bind(this), 0);
  }

  restart(params) {
    var current = params.seq || this.view.currentLocation();

    if ( params.view == this.view.name && params.view == 'plaintext' && params.clicked ) { params.view = '1up'; }
    if ( params.view == '2up' && this.service.manifest.totalSeq == 1 ) { params.view = '1up'; }
    if ( params.view == this.view.name ) { return ; }

    params.restarting = true;

    if ( this.view ) { 
      $main.classList.remove(`view--${this.view.name}`);
      this.view.destroy(); 
      this.view = null; 
    }
    this.start(params, function() {
      console.log("AHOY TRYING TO GO TO", current);
      this.view.display(current);
    }.bind(this));
  }

  setView(params) {
    var t0 = performance.now();
    var cls = View.for(params.view);
    var t1 = performance.now();
    this.view = new cls({ reader: this, service: this.service, scale: this.options.scale, seq: params.seq });
    var t2 = performance.now();
    this.emit('configure', this.view.config());
    this._updateViews(params.view);

    HT.update_status(`Viewing book in ${this.view.displayLabel} view.`);
    // document.querySelector('#view-heading').innerText = `View: ${this.view.displayLabel}`;

    HT.prefs.set({ pt : { view : params.view } })
    console.log(`BENCHMARK setView: ${t2 - t0} / ${t1 - t0} / ${t2 - t1}`);
  }

  next() {
    this.view.next();
  }

  prev() {
    this.view.prev();
  }

  first() {
    this.view.first();
  }

  last() {
    this.view.last();
  }

  display(seq) {
    this.view.display(seq);
  }

  jump(delta) {
    var seq = parseInt(this.view.currentLocation(), 10);
    var target = seq + delta;
    if ( target < 0 ) { target = 1; }
    else if ( target > this.service.manifest.totalSeq ) {
      target = this.service.manifest.totalSeq;
    }
    this.display(target);
  }

  on() {
    return this.emitter.on.apply(this.emitter, arguments)
  }

  emit(event, params={}) {
    this.emitter.emit(event, params);
  }

  bindEvents() {
    /* NOOP */
    var lastMessage; var statusTimer;
    // this.on('status', (message) => {
    //   if ( lastMessage != message ) {
    //     if ( statusTimer ) { clearTimeout(statusTimer); statusTimer = null; }
    //     setTimeout(() => {
    //       $status.innerText = message;
    //       lastMessage = message;
    //       console.log("-- status:", message);
    //     }, 50);
    //     statusTimer = setTimeout(() => {
    //       $status.innerText = '';
    //     }, 500);
    //   }
    // });

    this.on('relocated', (params) => {

      this._updateHistoryUrl(params);

      // legacy
      HT.params.seq = params.seq;
      HT.params.view = this.view.name;

      this._currentLocation = params.seq;

      this._updateLinks(params.seq);
      this.emit('track');
    });

    this.on('relocated', (params) => {
      this.emit('status', `Showing page scan ${params.seq}`);
    })

    this.on('redraw', (params) => {
      if ( params.scale ) { // && ! this.is_mobile
        this.options.scale = params.scale;
        this.controls.flexinator.sidebar(params.scale <= 1.0);
        this.trigger.push(`zoom:${params.scale}`); // triggers track
        // this._logAction(undefined, `zoom:${params.scale}`);
      }
    })

    this._resizer = debounce(function() {
      // DO NOT emit resize events if we're pinch-zooming??
      if ( window.visualViewport && window.visualViewport.scale > 1 ) { 
        return ; 
      }
      this.emit('resize');
      // this._checkToolbar();
    }.bind(this), 100);

    // var jump = document.querySelector('#action-focus-current-page');
    // jump.addEventListener('click', (event) => {
    //   event.preventDefault();
    //   this.view.focus(true);
    //   this._logAction(undefined, 'action-focus-current-page');
    //   console.log("AHOY FOCUS CURRENT PAGE");
    //   return false;
    // })

    var IGNORE_FOCUS = [ 'input', 'textarea', 'a', 'button' ];
    var accesskey_triggers = document.querySelectorAll('button[accesskey][data-target]');
    for(var i = 0; i < accesskey_triggers.length; i++) {
      var btn = accesskey_triggers[i];
      btn.addEventListener('click', (event) => {
        event.preventDefault();
        var btn = document.querySelector(`#${event.target.dataset.target}`);
        btn.click();
        if ( document.activeElement && 
             IGNORE_FOCUS.indexOf(document.activeElement.localName) >= 0 && 
             document.activeElement.getAttribute('aria-hidden') != 'hidden'
        ) {
          return;
        }
        setTimeout(() => { 
          this.view.container.focus(); 
          // /console.log("AHOY CONTAINER FOCUS", document.activeElement, document.querySelectorAll('.page[tabindex="0"]'));;
          if ( reader.debug_focus ) {
            setTimeout(() => {
              console.log("AHOY CONTAINER AFTER", document.activeElement, document.querySelectorAll('.page[tabindex="0"]'));
            }, 500);
          }
        }, 500);
      })
    }

    window.addEventListener('resize', this._resizer);
  }

  // TODO - REFLECT CURRENT LAYOUT
  _updateLinks(seq) {
    var self = this;
    if ( ! seq ) { seq = this.view.currentLocation(); }
    if ( this.view.name == '2up' ) {
      // this is way more complicated
      var verso = this.view.container.querySelector('.slice[data-visible="true"] .page.verso');
      var recto = this.view.container.querySelector('.slice[data-visible="true"] .page.recto');
      // self._updateLinkSeq(document.querySelector(`#pagePdfLink1`), verso ? verso.dataset.seq : null);
      // self._updateLinkSeq(document.querySelector(`#pagePdfLink2`), recto ? recto.dataset.seq : null);

      [ [ 'current-recto-seq', recto ], [ 'current-verso-seq', verso ] ].forEach(function(tuple) {
        var span = document.querySelector(`#sidebar [data-slot="${tuple[0]}"]`);
        if ( ! span ) { return ; }
        var page = tuple[1];
        if ( page && page.dataset.seq ) {
          span.innerText = page.dataset.seq;
          span.parentNode.previousElementSibling.disabled = false;
        } else {
          span.innerText = '-';
          span.parentNode.previousElementSibling.disabled = true;
        }
      })

    } else {
      // var $link = document.querySelector("#pagePdfLink");
      // self._updateLinkSeq($link, seq);

      var span = document.querySelector('#sidebar [data-slot="current-seq"]');
      if ( span ) { span.innerText = seq; }
    }
    self._updateLinkSeq(document.querySelector("#pageURL"), seq);
    self._updateLinkSeq(document.querySelector("input[name=seq]"), seq);
    self._updateLinkSeq(document.querySelector("#login-link"), seq);
    self._updateLinkSeq(document.querySelector("#ssd-link"), seq);

    if ( HT.downloader && HT.downloader.updateDownloadFormatRangeOptions ) {
      HT.downloader.updateDownloadFormatRangeOptions();
    }
  }

  _updateViews(view) {
    var self = this;
    if ( ! view ) { view = this.view.name; }
    self._updateLinkAttribute(document.querySelector("#login-button"), "view", view);
    var inputs = document.querySelectorAll("input[name='view']");
    for(var i = 0; i < inputs.length; i++) {
      inputs[i].value = view;
    }
    $$main.dataset.view = $root.dataset.view = view;
    this._updateHistoryUrl({ view: view });
  }

  _updateLinkSeq($link, seq, disabled) {
    if ( ! $link ) { return ; }
    if ( seq == null || disabled == true ) {
      $link.setAttribute('disabled', 'disabled');
      $link.setAttribute('tabindex', -1);
      // $link.classList.add('disabled');
      if ( $link.tagName.toLowerCase() == 'a' ) {
        $link.dataset.href = $link.getAttribute('href');
        $link.setAttribute('href', 'javascript:function() { return false; }');
      }
    } else {
      if ( ! $link.classList.contains('disabled') && $link.getAttribute('disabled') == 'disabled' ) {
        $link.removeAttribute('disabled');
        $link.removeAttribute('tabindex');
        if ( $link.tagName.toLowerCase() == 'a' ) {
          $link.setAttribute('href', $link.dataset.href);
        }
      }
      if ( $link.tagName.toLowerCase() == 'input' && $link.getAttribute("name") == "seq" ) {
          $link.value = seq;
      } else if ( $link.tagName.toLowerCase() == 'input' ) {
          var href = $link.value;
          $link.value = href.replace(/seq=\d+/, "seq=" + seq);
      } else {
          this._updateLinkAttribute($link, "seq", seq);
      }
    }
  }

  _updateHistoryUrl(params) {
    var href = window.location.pathname + location.search;
    var argv = [];
    argv.push(`id=${this.identifier}`);
    argv.push(`view=${params.view || this.view.name}`);
    argv.push(`seq=${params.seq || HT.params.seq}`);
    if ( HT.params.skin ) { argv.push(`skin=${HT.params.skin}`); }
    if ( this.options.scale > 1.0 ) { argv.push(`size=${Math.floor(this.options.scale * 100)}`) };
    if ( HT.params.q1 ) { argv.push(`q1=${HT.params.q1}`); }
    if ( HT.params.debug ) { argv.push(`debug=${HT.params.debug}`); }
    if ( HT.params.l11_tracking ) { argv.push(`l11_tracking=${HT.params.l11_tracking}`); }
    if ( HT.params.l11_uid ) { argv.push(`l11_uid=${HT.params.l11_uid}`); }
    var new_href = location.pathname + '?' + argv.join('&');
    window.history.replaceState(null, document.title, new_href);
  }

  _updateLinkAttribute($link, key, value) {
    if ( ! $link ) { return ; }
    var href = $link.getAttribute("href");
    var regex = new RegExp(key + "(=|%3D)");
    if ( href.indexOf('#' + key) > -1 ) {
        regex = new RegExp('#' + key + '\\d+');
        href = href.replace(regex, '#' + key + value);
        $link.setAttribute('href', href);
    } else if ( ! regex.test(href) ) {
        // key not in href
        var text = key + "=" + value;
        var target_href = href;
        var idx;
        if ( ( idx = target_href.indexOf('target=') ) > -1 ) {
            // extract the target url
            idx += "target=".length;
            target_href = decodeURIComponent(href.substr(idx));
        }
        var sep = ';';
        if ( target_href.indexOf("&") > -1 ) {
            // add to parameters - semicolon
            sep = '&';
        }
        target_href += sep + text;
        if ( idx > -1 ) {
            // re-encode
            target_href = href.substr(0, idx) + encodeURIComponent(target_href);
        }
        $link.setAttribute("href", target_href);
    } else {
        // replace existing key
        regex = new RegExp(key + "(=|%3D)" + "\\w+(;|&|%3B|%26)?");
        $link.setAttribute("href", href.replace(regex, key + "$1" + value + "$2"));
    }
  }

  _bestFitScale() {
    var scale = ( ( $(window).width() * 0.95 ) / 680 );
    this.options.bestFitScale = scale;
    return scale;
  }

  _logAction(href, trigger) {
    if ( HT.analytics && HT.analytics.logAction ) {
      HT.analytics.logAction(href, trigger);
    }
  }

  _checkToolbar() {
    var originalHeight;
    if ( ! $toolbar.dataset.originalHeight ) {
      originalHeight = 0;
      for(var i = 0; i < $toolbar.children.length; i++) {
        originalHeight += $toolbar.children[i].offsetHeight;
      }
      $toolbar.dataset.originalHeight = originalHeight;
    } else {
      originalHeight =  parseInt($toolbar.dataset.originalHeight, 10);
    }
    var toolbarHeight = $toolbar.offsetHeight;
    var toolbarHorizontalHeight = document.querySelector('#toolbar-horizontal').offsetHeight;

    var mainStyles = getComputedStyle($root);
    var mainPadding = parseInt(mainStyles.paddingTop, 10) + parseInt(mainStyles.paddingBottom, 10);

    var navigatorHeight = document.querySelector('.navigator').offsetHeight;
    var r = originalHeight / window.innerHeight;
    console.log("AHOY TOOLBAR TRIGGER", originalHeight, window.innerHeight, r);
    if ( r > 0.57 ) {

      var values = [ window.innerHeight ];
      values.push(-(document.querySelector('header').offsetHeight));
      values.push(-(navigatorHeight));
      values.push(-(toolbarHorizontalHeight));
      values.push(-(mainPadding));


      var $sidebar = document.querySelector('#sidebar');
      if ( $sidebar.querySelector('button.sidebar-toggle-button').offsetHeight > 0 ) {
        // toolbarHeight -= $sidebar.offsetHeight;
        values.push(-($sidebar.offsetHeight));
      }

      toolbarHeight = values.reduce((a, b) => a + b, 0);
      toolbarHeight *= 0.8;

      console.log("AHOY TOOLBAR MATH", originalHeight, values, toolbarHeight);

      $toolbar.style.height = `${toolbarHeight}px`;
      $toolbar.classList.add('toolbar--shrunken');
      $toolbar.style.overflowY = 'auto';
    } else {
      $toolbar.style.overflowY = 'unset';
      $toolbar.style.height = 'auto';
      $toolbar.classList.remove('toolbar--shrunken');
    }
  }

}

var service = new Service({
  manifest: {
    readingOrder: $main.dataset.readingOrder,
    totalSeq: $main.dataset.totalSeq,
    defaultSeq: $main.dataset.defaultSeq,
    firstSeq: $main.dataset.firstSeq,
    defaultHeight: $main.dataset.defaultHeight,
    defaultWidth: $main.dataset.defaultWidth,
    featureList: JSON.parse($main.dataset.featureList)
  },
  identifier: HT.params.id,
  q1: HT.params.q1,
  debug: HT.params.debug,
  hasOcr: $main.dataset.hasOcr == 'true',
  allowFullDownload: $main.dataset.allowFullDownload == 'true'
})
HT.service = service;


var reader = new Reader({ identifier: HT.params.id });
reader.service = service;
HT.reader = reader;
HT.View = View;

reader.$$main = $$main;

// initiate loaders
HT.service.loaders.images = new Loader({ name: 'images' })
      .limit(3)
      .on(Loader.events.LOADED, function(image, datum) {
        if (! image ) { return false; }
        reader.view.postImage(image, datum);
      })
      .on(Loader.events.ERROR, function() {
        console.log("AHOY ERROR", arguments);
      });

// HT.service.loaders.texts = new Loader({ name: 'texts' })
//       .limit(3)
//       .on(Loader.events.LOADED, function(blob, datum) {
//         if (! blob ) { return false; }
//         reader.view.postText(blob, datum);
//       })
//       .on(Loader.events.ERROR, function() {
//         console.log("AHOY ERROR", arguments);
//       });

HT.service.loaders.thumbnails = new Loader({ name: 'thumbnails' })
      .limit(2)
      .on(Loader.events.LOADED, function(image, datum) {
        if (! image ) { return false; }
        reader.view.postThumbnail(image, datum);
      })
      .on(Loader.events.ERROR, function() {
        console.log("AHOY ERROR", arguments);
      });

$main.dataset.readingOrder = service.manifest.options.readingOrder;
$main.classList.toggle('reading-order--rtl', $main.dataset.readingOrder == 'right-to-left');

var is_active = false;
var scale = 0.75;
var image_width = 680;

// TODO -- VERIFY LAYOUT
reader.controls.navigator = new Control.Navigator({
  input: document.querySelector('input[type="range"]'),
  output: document.querySelector('.navigator-output'),
  prompt: document.querySelector('#action-prompt-seq'),
  form: document.querySelector('#form-go-page'),
  reader: reader
})

reader.controls.navigator.on('updateLocation', (params) => {
  console.log("AHOY updateLocation", params.seq);
  reader.view.display(params.seq);
})

reader.controls.paginator = new Control.Paginator({
  input: document.querySelector('#toolbar-horizontal'),
  reader: reader
});

reader.controls.viewinator = new Control.Viewinator({
  input: document.querySelector('.action-views'),
  reader: reader
});

reader.controls.zoominator = new Control.Zoominator({
  input: document.querySelector('.action-zoom'),
  reader: reader
})

reader.controls.rotator = new Control.Rotator({
  input: document.querySelector('.action-rotate'),
  reader: reader
})
reader.controls.rotator.on('rotate', function(delta) {
  this._logAction(undefined, `rotate:${delta}`);
  this.emit('rotate', delta);
}.bind(reader))

reader.controls.contentsnator = new Control.Contentsnator({
  input: document.querySelector('.table-of-contents'),
  reader: reader
});

var actionFullScreen = document.querySelector('.action-fullscreen');
if ( actionFullScreen ) {
  reader.controls.expandinator = new Control.Expandinator({
    input: actionFullScreen,
    reader: reader
  });
}

reader.controls.flexinator = new Control.Flexinator({ reader: reader });
reader.controls.flexinator.on('track', (trigger) => {
  reader._logAction(undefined, trigger);
  if ( HT.analytics && HT.analytics.trackEvent ) {
    HT.analytics.trackEvent({ label : "-", category : "HT Reader", action : `HT Reader: ${trigger}` });
  }
});

if ( reader.service.allowFullDownload ) {
  reader.controls.selectinator = new Control.Selectinator({
    reader: reader,
    input: document.querySelector('#download-selected-pages-output'),
    // link: selectedPagesPdfLink,
    reset: document.querySelector('#action-clear-selection')
  });
}

var _scrollCheck = debounce(function(event) {
  if ( window.visualViewport && window.visualViewport.scale == 1 ) {
    window.scrollTo(0,0);
  }
}, 50);
if ( true || ! ( $("html").is(".mobile") && $("html").is(".ios") ) ) {
  window.addEventListener('scroll', _scrollCheck);
}

$main.dataset.selected = 0;

reader.on('track', () => {
  if ( HT.analytics && HT.analytics._simplifyPageHref ) {
    HT.analytics.trackPageview(HT.analytics._simplifyPageHref(location.href));
  }
  reader._logAction(undefined, reader.trigger.pop());
})

document.body.addEventListener('keydown', function(event) {
  
  if ( event.key == 'Tab' && 
    ! event.shiftKey && 
    reader.view && 
    document.activeElement == reader.view.container ) {
    event.preventDefault();
    reader.view.focus(true);
  }

  return;

  var IGNORE_TARGETS = [ 'input', 'textarea' ];
  if ( IGNORE_TARGETS.indexOf(event.target.localName) >= 0 ) {
    return;
  }
  if ( event.key == 'ArrowLeft' ) {
    reader.prev();
  } else if ( event.key == 'ArrowRight' ) {
    reader.next();
  }
})

var scale = 1.0;
if ( HT.params.size  ) {
  var size = parseInt(HT.params.size, 10);
  if ( ! isNaN(size) ) {
    var value = size / 100.0;
    if ( reader.controls.zoominator.check(value) ) {
      scale = value;
    }
  }
}

reader.is_mobile = $("html").is(".mobile") || ( HT.params.debug && HT.params.debug.indexOf('mobile') > -1 );

var $sidebar = $("#sidebar");

reader.controls.mobile = {};

reader.on('redraw', function() {
  HT.toggle(false);
});

reader.controls.navigator.on('updateLocation', (params) => {
  if ( params.trigger && params.trigger == 'control-navigator' ) {
    HT.toggle(false);
  }
})

$sidebar.on('click', '[data-trigger="contents"]', function(event) {
  event.preventDefault();
  HT.toggle(false);
  $(".table-of-contents button").trigger('click');
})

$sidebar.on('click', '.action-view', function(event) {
  var target = $(this).data('target');
  if ( target == reader.view.name ) {
    return;
  }
  HT.utils.switch_view(target, event.detail == 1);
});

HT.utils = HT.utils || {};
HT.utils.switch_view = function(target, event_detail) {
  $sidebar.find(".action-view.active").removeClass("active").attr("aria-pressed", null);
  $sidebar.find(`button[data-target="${target}"]`).addClass("active").attr("aria-pressed", "true");
  var scale = 1.0; // reader._bestFitScale();
  reader.restart({ view: target, clicked: event_detail == 1, scale: scale, seq: HT.reader._currentLocation });
  reader.emit('redraw', {});
}

HT.utils.handleOrientationChange = function(ignore) {
  if ( window.innerWidth < 800 ) {
    if ( Math.abs(window.orientation) == 90 && HT.reader.service.manifest.totalSeq > 1 ) {
      // enable the 2up button
      // $sidebar.find(`button[data-target="2up"]`).attr('disabled', false);
      $(`button[data-target="2up"]`).attr('disabled', false);
    } else {
      // disable the 2up and switch views
      // $sidebar.find(`button[data-target="2up"]`).attr('disabled', true);
      $(`button[data-target="2up"]`).attr('disabled', true);
      if ( reader.view.name == '2up' && ignore !== true ) {
        HT.utils.switch_view('1up');
      }
    }
  } else if ( HT.reader.service.manifest.totalSeq > 1 ) {
    // $sidebar.find(`button[data-target="2up"]`).attr('disabled', false);
    $(`button[data-target="2up"]`).attr('disabled', false);
  }
}

if ( HT.params.ui && HT.params.ui == 'embed' && HT.params.view == 'default' ) {
  if ( window.innerWidth > window.innerHeight ) {
    HT.params.view = '2up';
  }
}
if ( HT.params.view == 'default' ) { HT.params.view = '1up'; }
if ( reader.service.manifest.totalSeq == 1 ) {
  if ( HT.params.view == '2up' || HT.params.view == 'thumb' ) {
    HT.params.view = '1up';
  }
}

reader.start({ view: HT.params.view || '1up', seq: HT.params.seq || 10, scale: scale });
$sidebar.find(`.action-view[data-target="${$$main.dataset.view}"]`).addClass('active');

var $menu; var $trigger; var $header; var $navigator;

var daInterval;
HT.debugActive = function() {
  if ( daInterval ) {
    clearInterval(daInterval);
    daInterval = null;
  } else {
    daInterval = setInterval(function() {
      console.log(document.activeElement)
    }, 1000);
  }
}

/* AND THE WINDOW */

function handleVisibilityChange() {
  if (document.hidden) {
    handleWindowBlur();
  } else  {
    handleWindowFocus();
  }
}

function handleWindowFocus() {
  if ( window.inactivated ) {
    window.inactivated = false;
    window.reactivated = true;
    setTimeout(function() {
      window.reactivated = false;
    }, 500)
  }
}

function handleWindowBlur() {
  window.inactivated = true;
  window.reactivated = false;
}

document.addEventListener("visibilitychange", handleVisibilityChange, false);
window.addEventListener("focus", handleWindowFocus, false);
window.addEventListener("blur", handleWindowBlur, false);

setTimeout(() => {
    var event = document.createEvent('UIEvents');
    event.initEvent('resize', true, false, window, 0);
    window.dispatchEvent(event)
}, 100);
