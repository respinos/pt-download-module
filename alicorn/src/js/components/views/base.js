import NanoEvents from 'nanoevents';
import unbindAll from 'nanoevents/unbind-all';

export var Base = class {
  constructor(options={}) {
    this.service = options.service;
    this.reader = options.reader;
    this.scale = options.scale || 1.0;
    this.mode = 'scroll';
    this.emitter = new NanoEvents();
    this._handlers = {};
    this.id = (new Date()).getTime();
    this.pages = [];
    this.trackResize = true;
  }

  attachTo(element, cb) {
    this.container = element;
    // var t0 = performance.now();
    this.bindEvents();
    // var t1 = performance.now();
    this.render(cb);
    // var t2 = performance.now();
    // console.log(`BENCHMARK view.attachTo: ${t2 - t0} / ${t1 - t0} / ${t2 - t1}`);
  }

  render(cb) {
    var minWidth = this.minWidth();
    var scale = this.scale;

    // this.container.style.display = 'none';

    var t0 = performance.now();
    var fragment = document.createDocumentFragment();

    for(var seq = 1; seq <= this.service.manifest.totalSeq; seq++) {

      var page = document.createElement('div');
      page.setAttribute('tabindex', '-1');

      var meta = this.service.manifest.meta(seq);
      var ratio = meta.height / meta.width;

      var h = Math.ceil(minWidth * ratio * scale);
      var w = Math.ceil(minWidth * scale);

      page.style.height = `${h}px`;
      page.style.width = `${w}px`;
      page.dataset.bestFit = ( scale <= 1 ) ? 'true' : 'false';
      if ( scale <= 1 ) {
        page.classList.add('page--best-fit');
      }
      page.style.setProperty('--width', page.style.width);

      page.classList.add('page');
      page.dataset.seq = seq;
      page.innerHTML = `<div class="page-text"></div><div class="info">${seq}</div>`;
      this._renderr(page);

      fragment.appendChild(page);
      this.pages.push(page);
    }

    // var t11 = performance.now();
    // console.log(`-- BENCHMARK render loop ${t11 - t0}`);

    this.container.appendChild(fragment);
    // this.container.style.display = 'block';

    // var t1 = performance.now();

    var pages = this.container.querySelectorAll('.page');
    // var t2 = performance.now();

    for(var i = 0; i < pages.length; i++) {
      this.bindPageEvents(pages[i]);
    }
    // var t3 = performance.now();
    // console.log(`BENCHMARK base.render: ${t3 - t0} / ${t1 - t0} / ${t2 - t1} / ${t3 - t2} / ${t1 - t11}`);

    this.is_active = true;
    this.loadImage(this.container.querySelector('[data-seq="1"]'), { check_scroll: true });
    if ( cb ) {
      cb();
    }
  }

  _renderr(page) {
    /* NOP */
  }

  resizePage(page) {
    var canvas = page.querySelector('img');
    if ( ! canvas ) { return ; }

    if ( page.dataset.loading !== 'false' ) {
      return;
    }

    if ( canvas.dataset.restricted == 'true' ) { return ; }

    var bounds = this.container.getBoundingClientRect();
    var rect = page.getBoundingClientRect();

    if ( canvas.height == 0 ) {
      // punt? I guess?
      var x = ( page.dataset.attempts || 1 ) - 0;
      x += 1;
      if ( x < 3 ) {
        // console.log(`--- AHOY ATTEMPTING resizePage ${page.dataset.seq} : ${x}`);
        page.dataset.attempts = x;
        setTimeout(function() {
          this.resizePage(page);
        }.bind(this), 0);
        return;
      } else {
        // console.log(`--- AHOY PUNTING resizePage ${page.dataset.seq} : ${x}`);
        return;
      }
    }

    var seq = parseInt(page.dataset.seq, 10);
    var minWidth = this.minPageWidth();

    var meta = this.service.manifest.meta(seq);
    var ratio = meta.height / meta.width;
    var scale = this.scale;

    var pageHeight = Math.ceil(minWidth * ratio * scale);
    var pageWidth = Math.ceil(minWidth * scale);

    // var option = 'A';
    // console.log("AHOY base.resizePage - rotated", option, meta.rotation, pageHeight, pageWidth, "::", canvas.height, canvas.width, canvas.naturalHeight, canvas.naturalWidth);

    page.style.height = `${pageHeight}px`;
    page.style.width = `${pageWidth}px`;
    // page.style.setProperty('--width', `${canvas.naturalWidth}px`);

    var updated_rect = page.getBoundingClientRect();
    var scrollTop = this.container.scrollTop;

    this._postResizePage(page, rect, bounds);
  }

  _postResizePage(page, rect, bounds) {

  }

  redrawPage(page) {
    if ( typeof(page) == "number" || typeof(page) == "string" ) {
      page = this.container.querySelector(`[data-seq="${page}"]`);
    }

    // var redraw_highlights = this._removeHighlights(page);

    var image_url = this.imageUrl(page);
    page.dataset.rotated = ( image_url.match(/rotation=[1-9]\d+/) ) ? true : false;

    var img = page.querySelector('img');
    if ( ! img || img.getAttribute('src') == image_url ) { 
      // this._removeHighlights(page);
      // setTimeout(() => {
      //   console.log("AHOY REDRAW HIGHLIGHTS NOP");
      //   this._drawHighlights(page);
      // })
      return ; 
    }
    var new_img = new Image();
    new_img.addEventListener('load', function _redrawHandler() {
      if ( img && img.parentElement && img.parentElement == page ) {
        page.replaceChild(new_img, img);
        this.resizePage(page);
        new_img.removeEventListener('load', _redrawHandler, true);
        if ( new_img.dataset.usedBlob == 'true' ) {
          URL.revokeObjectURL(new_img.src);
        }
      }
      delete page.dataset.reloading;
    }.bind(this), true);
    
    // new_img.src = image_url;

    fetch(image_url, { credentials: 'include' })
      .then(response => {
        if ( response.headers.get('x-hathitrust-access') == 'deny' ) {
          new_img.dataset.restricted = true;
        }
        if ( response.headers.get('x-hathitrust-renew') ) {
          HT.renew_auth(response.headers.get('x-hathitrust-renew'));
        }
        return response.blob();
      })
      .then(blob => {
        if ( img.dataset.restricted == 'true' && blob.text ) {
          blob.text().then((text) => {
            text = text.replace('RESTRICTED', 'ACCESS EXPIRED');
            blob = new Blob([text], { type: 'image/svg+xml'});
            var objectUrl = URL.createObjectURL(blob);
            new_img.dataset.usedBlob = true;
            new_img.src = objectUrl;
          })
        } else {
          // var objectUrl = URL.createObjectURL(blob);
          // new_img.src = objectUrl;
          new_img.src = image_url;
        }
        // setTimeout(() => {
        //   this._drawHighlights(page);
        // }, 0);
      })
  }

  loadImage(page, options={}) {
    if ( ! this.is_active ) { return ; }
    options = Object.assign({ check_scroll: false, preload: true }, options);
    var seq = page.dataset.seq;
    var rect = page.getBoundingClientRect();

    var buster;
    if ( page.querySelector('img') && page.querySelector('img').dataset.restricted == 'true' ) {
      var img = page.querySelector('img');
      page.removeChild(img);
      buster = Date.now();
    }

    if ( page.querySelector('img') ) {
      // preloadImages(page);
      // console.log(`AHOY loadImage ${seq} PRELOADED`);
      return;
    }

    if ( page.dataset.loading == "true" ) {
      return;
    }

    var image_url = this.imageUrl(page, buster);
    var html_url = this.service.html({ seq: seq });

    var html_request;
    if ( this.embedHtml && html_url ) {
      html_request = fetch(html_url, { credentials: 'include' })
    }

    var img = new Image();
    img.alt = `Page scan of sequence ${seq}`;

    page.dataset.loading = true;
    page.classList.add('page--loading');

    img.addEventListener('load', function _imgHandler() {
      // if ( img.dataset.restricted == 'true' ) { 
      //   console.log("AHOY loadImage load skip", seq, " > rechecking"); 
      //   img.dataset.restricted = false;
      //   img.src = img.dataset.src;
      //   return ; 
      // }

      if ( img.src.indexOf('data') > -1 ) { return ; }

      var page_height = page.offsetHeight;
      var page_width = page.offsetWidth;

      page.dataset.loading = false;
      page.classList.remove('page--loading');

      this.emitter.emit('loaded', page);

      this.service.manifest.update(seq, { width: img.width, height: img.height });

      var imageAspectRatio = img.width / img.height;
      // console.log(`AHOY LOAD ${seq} : ${img.width} x ${img.height} : ${page_width}`);
      // img.style.width = `${page_width}px`;
      // img.style.height = `${page_width / imageAspectRatio}px`;

      var adjusted_img_height = page_width / imageAspectRatio;
      var is_restricted = false;

      if ( img.src && img.src.indexOf('data') > -1 ) { is_restricted = true; }

      img.width = `${page_width}`;
      img.height = `${adjusted_img_height}`;

      // console.log(`AHOY LOAD ${seq} REDUX : ${img.width} x ${img.height} : ${img.style.width} x ${img.style.height} : ${page_width}`);

      page.appendChild(img);
      page.dataset.loaded = true;
      page.classList.add('page--loaded');

      if ( html_request ) {
        html_request
          .then(function(response) {
            if ( ! response.ok ) {
              return ""; 
            }
            return response.text();
          })
          .then(function(text) {
            var page_text = page.querySelector('.page-text');
            page_text.innerHTML = text;

            this._drawHighlights(page);

          }.bind(this));
      }

      if ( options.check_scroll || this.mode == 'thumbnail' ) {
        this.resizePage(page);
      }
      img.removeEventListener('load', _imgHandler, true);
      if ( img.dataset.usedBlob == 'true' ) {
        URL.revokeObjectURL(img.src);
      }
      if ( options.callback ) {
        options.callback(img);
      }
    }.bind(this), true)

    page.dataset.rotated = ( image_url.match(/rotation=[1-9]\d+/) ) ? true : false;

    fetch(image_url, { credentials: 'include' })
      .then(response => {
        if ( response.headers.get('x-hathitrust-access') == 'deny' ) {
          img.dataset.restricted = true;
        }
        if ( response.headers.get('x-hathitrust-renew') ) {
          HT.renew_auth(response.headers.get('x-hathitrust-renew'));
        }
        return response.blob();
      })
      .then(blob => {
        if ( img.dataset.restricted == 'true' && blob.text ) {
          blob.text().then((text) => {
            text = text.replace('RESTRICTED', 'ACCESS EXPIRED');
            blob = new Blob([text], { type: 'image/svg+xml'});
            var objectUrl = URL.createObjectURL(blob);
            img.src = objectUrl;
            img.dataset.usedBlob = true;
          })
        } else {
          // var objectUrl = URL.createObjectURL(blob);
          // img.src = objectUrl;
          img.src = image_url;
        }
      })

    if ( ! page.dataset.preloaded && options.preload ) {
      this.preloadImages(page);
    }
  }
  redrawPageImages() {
    var images = this.container.querySelectorAll('.page img');
    for(var i = 0; i < images.length; i++) {
      var img = images[i];
      var page = img.parentElement;
      this.redrawPage(page);
    }
    this._redrawPageImagesTimer = null;
  }

  unloadImage(page) {
    if ( page.dataset.preloaded == "true" ) { return; }
    if ( page.dataset.loading == "true" ) { return ; }
    var canvas = page.querySelector('img');
    if ( canvas ) {
      page.removeChild(canvas);
    }
    var page_text = page.querySelector('.page-text');
    page_text.innerHTML = '';
    page.dataset.preloaded = false;
    page.dataset.loaded = false; page.classList.remove('page--loaded');

    this._removeHighlights(page);
  }

  preloadImages(page) {
    var seq = parseInt(page.dataset.seq, 10);
    var delta = 1;
    while ( delta <= 1 ) {
      var prev_page = this.container.querySelector(`.page[data-seq="${seq - delta}"]`);
      if ( prev_page ) {
        prev_page.dataset.preloaded = true;
        this.loadImage(prev_page);
      }
      delta += 1;
    }
    delta = 1;
    while ( delta <= 1 ) {
      var next_page = this.container.querySelector(`.page[data-seq="${seq + delta}"]`);
      if ( next_page ) {
        next_page.dataset.preloaded = true;
        this.loadImage(next_page);
      }
      delta += 1;
    }
  }

  imageUrl(params, buster) {
    var oprams =  params;
    if ( params instanceof HTMLElement ) {
      var element = params; params = {};
      params.seq = element.dataset.seq;
      params.width = element.offsetWidth || 680;
    }
    // if ( this.reader.pagedetails.rotate[params.seq] ) {
    //   params.rotation = this.reader.pagedetails.rotate[params.seq];
    // }

    if ( ! params.width && ! params.height ) {
      console.log("AHOY IMAGEURL PROBLEM", params, oprams);
    }

    if ( buster ) { params.expiration = buster; }

    return this.service.image(params);
  }

  minPageWidth() {
    return this.minWidth();
  }

  minWidth() {
    var minWidth = this.container.parentNode.offsetWidth * 0.80;
    if ( minWidth < 680 && window.innerWidth >= 680 ) { minWidth = 680; }
    else if ( window.innerWidth < 680 ) { minWidth = window.innerWidth * 0.95; }
    return minWidth;
  }

  on() {
    return this.emitter.on.apply(this.emitter, arguments)
  }

  first() {
    this.display(1);
  }

  last() {
    this.display(this.service.manifest.totalSeq);
  }

  currentPage() {
    if ( this._currentPage ) {
      return this._currentPage;
    }
    return null;
  }

  bindEvents() {
    this._handlers.focus = this.focusHandler.bind(this);
    // this.container.addEventListener('focusin', this._handlers.focus);

    if ( this.trackResize ) {

      this.reader.on('redraw', (params) => {
        console.log("AHOY PARAMS", params);
        if ( params.scale && params.scale != this.scale ) {
          this.scale = params.scale;
          this.reader.emit('resize');
        }
      });

      this._handlers.resize = this.reader.on('resize', () => {
        this._resizePages();
      })
    }
  }

  bindPageEvents(page) {
  }

  focusHandler(event) {
    var target = event.target;
    if ( target.tagName.toLowerCase() == 'div' && target.classList.contains('page') ) {
      this._enableControlTabIndex(target);
    }
  }

  focus(page, invoke=false) {
    // page.setAttribute('accesskey', "9");
    if ( page === true || page === false ) {
      invoke = page;
      page = null;
    }
    if ( ! page ) {
      page = this.currentPage();
    }
    page.setAttribute('tabindex', '0');
    this._enableControlTabIndex(page);
    if ( invoke ){
      page.focus();
    }
  }

  unfocus(page) {
    page.setAttribute('tabindex', '-1');
    if ( page == document.activeElement ) { page.blur(); }
    var page_controls = page.querySelectorAll('[tabindex="0"]');
    for(var i = 0; i < page_controls.length; i++) {
      page_controls[i].setAttribute('tabindex', '-1');
      // if ( page_controls[i] == document.activeElement ) { page_controls[i].blur(); }
    }
  }

  config() {
    // the empty set supports everything
    return {};
  }

  destroy() {
    unbindAll(this.emitter);
    if ( this._handlers.focus ) {
      this.container.removeEventListener('focusin', this._handlers.focus);
    }
    if ( this._handlers.resize ) {
      this._handlers.resize();
    }
  }

  _enableControlTabIndex(page) {
    var page_controls = page.querySelectorAll('[tabindex="-1"]');
    for(var i = 0; i < page_controls.length; i++) {
      page_controls[i].setAttribute('tabindex', '0');
      // console.log("--- AHOY", page_controls[i]);
    }
  }

  _resizePages() {
    this._scrollPause = true;
    var minWidth = this.minWidth();
    var scale = this.scale;
    var currentSeq = this.currentLocation();
    var dirty = false;
    this.pages.forEach((page) => {
      var seq = parseInt(page.dataset.seq, 10);
      var meta = this.service.manifest.meta(seq);
      var ratio = meta.height / meta.width;

      var h = Math.ceil(minWidth * ratio * scale);
      var w = Math.ceil(minWidth * scale);

      // console.log("AHOY _resizePages", seq, page.style.width, "x", page.style.height, "/", w, "x", h);

      dirty = dirty || ( page.style.height != `${h}px` );

      page.style.width = `${w}px`;
      page.style.height = `${h}px`;
      page.dataset.bestFit = ( scale <= 1 ) ? 'true' : 'false';
      if ( scale <= 1 ) {
        page.classList.add('page--best-fit');
      }

      this._resizePageByPages(page);
    })

    if ( dirty ) {
      if ( this._redrawPageImagesTimer ) { clearTimeout(this._redrawPageImagesTimer); }
      this._redrawPageImagesTimer = setTimeout(() => {
        this.redrawPageImages();
      }, 100);
    }

    this.display(currentSeq);
    this._scrollPause = false;
  }

  _drawHighlights(page) {
    var self = this;

    // OK --- does this have a highlight?
    var img = page.querySelector('img');
    var page_text = page.querySelector('.page-text');

    function parseCoords(value) {
      // var values = value.split(';')[0].split(' ');
      // values.shift(); // box
      var values = value.split(' ')
      return values.map((v) => parseInt(v, 10));
    }

    var page_div = page_text.children[0];
    if ( ! page_div ) { return ; }

    var words = page_div.dataset.words;

    if ( words !== undefined ) { words = JSON.parse(words); }
    if ( ! words || ! words.length ) { return }

    var page_coords = parseCoords(page_div.dataset.coords);

    if ( ! this._highlightIndexMap ) {
      this._highlightIndexMap = {};
      this._highlightIndex = 0;
    }

    var scaling = {};
    if ( img.hasAttribute('width') ) {
      scaling.width = parseInt(img.getAttribute('width'), 10); // img.naturalWidth; // offsetWidth;
      scaling.height = parseInt(img.getAttribute('height'), 10); // img.naturalHeight; // offsetHeight;
    } else {
      scaling.width = img.offsetWidth;
      scaling.height = img.offsetHeight;
    }

    // if we're rotated then shift these
    var meta = this.service.manifest.meta(page.dataset.seq);
    if ( meta.rotation == 90 || meta.rotation == 270 ) {
      [ scaling.width, scaling.height ] = [ scaling.height, scaling.width ];
    }

    scaling.ratio = scaling.width / page_coords[2];
    scaling.ratioY = scaling.height / page_coords[3];
    scaling.padding = parseInt(window.getComputedStyle(page).marginTop) / 2;

    if ( img.hasAttribute('height') ) {
      scaling.ratioA = img.offsetHeight / parseInt(img.getAttribute('height'), 10);
      scaling.ratioB = img.offsetWidth / parseInt(img.getAttribute('width'), 10);
      scaling.ratioZ = ( scaling.ratioA < scaling.ratioB ) ? scaling.ratioA : scaling.ratioB;
    } else {
      scaling.ratioZ = 1.0;
    }

    scaling.ratio *= scaling.ratioZ;

    function textNodesUnder(el){
      var n, a=[], walk=document.createTreeWalker(el,NodeFilter.SHOW_TEXT,null,false);
      while(n=walk.nextNode()) a.push(n);
      return a;
    }

    var textNodes = textNodesUnder(page_div);
    textNodes.forEach(function(text) {
      var innerHTML = text.nodeValue.trim();
      if ( ! innerHTML ) { return; }

      var matched = false; var matchedWord = null;
      words.forEach(function(word) {
        var pattern = new RegExp(`\\b(${word})\\b`, 'gi');
        if ( innerHTML.match(pattern) ) {
          matched = true;
          matchedWord = word.toLowerCase();
        }
      })
      if ( ! matched ) { return ; }
      var span = text.parentNode;
      // var coords = parseCoords(span.dataset.coords).map((v) => v * scaling.ratio);
      var coords = parseCoords(span.dataset.coords);
      coords[0] *= scaling.ratio;
      coords[2] *= scaling.ratio;
      coords[1] *= scaling.ratio;
      coords[3] *= scaling.ratio;
      var highlight;

      var highlight_idx = self._highlightIndexMap[matchedWord];
      if ( ! highlight_idx ) {
        self._highlightIndex += 1;
        if ( self._highlightIndex > 6 ) { self._highlightIndex = 1; }
        self._highlightIndexMap[matchedWord] = self._highlightIndex;
        highlight_idx = self._highlightIndexMap[matchedWord];
      }

      // var highlight = document.createElement('span');
      // highlight.style.position = 'absolute';
      // highlight.style.width = `${coords[2] - coords[0]}px`;
      // highlight.style.height = `${coords[3] - coords[1]}px`;
      // highlight.dataset.top = coords[1];
      // highlight.dataset.padding = scaling.padding;
      // highlight.style.top = `${coords[1] - scaling.padding}px`;
      // highlight.style.left = `${coords[0]}px`;
      // highlight.style.backgroundColor = 'yellow';
      // highlight.style.opacity = '0.4';
      // page.appendChild(highlight);

      var highlight_w0 = ( coords[2] - coords[0] );
      var highlight_h0 = ( coords[3] - coords[1] );
      var highlight_w = highlight_w0 * 1.25;
      var highlight_h = highlight_h0 * 1.25;

      var highlight = document.createElement('span');
      highlight.classList.add('highlight');
      highlight.classList.add(`highlight_${highlight_idx}`);
      // highlight.style.position = 'absolute';
      // highlight.style.backgroundColor = 'greenyellow';
      // highlight.style.opacity = '0.4';
      highlight.dataset.top = coords[1];
      highlight.dataset.padding = scaling.padding;
      console.log("AHOY highlight.dataset");

      highlight.style.width = `${highlight_w / scaling.width * 100.0}%`;
      highlight.style.height = `${highlight_h / scaling.height * 100.0}%`;
      highlight.style.top = `${( coords[1] - ( ( highlight_h - highlight_h0 ) / 2 ) ) / scaling.height * 100.0}%`;
      highlight.style.left = `${( coords[0] - ( ( highlight_w - highlight_w0 ) / 2 ) ) / scaling.width * 100.0}%`;
      page.appendChild(highlight);

      console.log("AHOY MATCH", innerHTML, coords, scaling.ratio, scaling.ratioY, scaling);
    })
  }

  _removeHighlights(page) {
    var highlights = page.querySelectorAll('.highlight');
    var n = highlights.length;
    for(var i = 0; i < n; i++) {
      page.removeChild(highlights[i]);
    }
    return n;
  }

  _resizePageByPages() {
    /* NOP */
  }

}

