import NanoEvents from 'nanoevents';
import unbindAll from 'nanoevents/unbind-all';

export var setfn = {
  eqSet: function(as, bs) {
    return as.size === bs.size && this.all(this.isIn(bs), as);    
  },

  all: function(pred, as) {
    for (var a of as) if (!pred(a)) return false;
    return true;
  },

  isIn: function(as) {
    return function (a) {
        return as.has(a);
    };    
  }
};

function rgbToYIQ({r, g, b}) {
  return ((r * 299) + (g * 587) + (b * 114)) / 1000;
}

function hexToRgb(hex) {
  if (!hex || hex === undefined || hex === '') {
    return undefined;
  }

  const result =
        /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);

  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : undefined;
}

function contrast(colorHex, threshold = 128) {
  if (colorHex === undefined) {
    return '#000';
  }

  const rgb = hexToRgb(colorHex);

  if (rgb === undefined) {
    return '#000';
  }

  return rgbToYIQ(rgb) >= threshold ? '#000' : '#fff';
}

function simpleSvgPlaceholder({
  width = 300,
  height = 150,
  text = `${width}×${height}`,
  fontFamily = 'sans-serif',
  fontWeight = 'bold',
  fontSize = Math.floor(Math.min(width, height) * 0.2),
  dy = fontSize * 0.35,
  bgColor = '#ddd',
  textColor = 'rgba(0,0,0,0.5)',
  dataUri = true,
  charset = 'UTF-8'
} = {}) {
  const str = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
    <rect fill="${bgColor}" width="${width}" height="${height}"/>
    <text fill="${textColor}" font-family="${fontFamily}" font-size="${fontSize}" dy="${dy}" font-weight="${fontWeight}" x="50%" y="50%" text-anchor="middle">${text}</text>
  </svg>`;

  // Thanks to: filamentgroup/directory-encoder
  const cleaned = str
    .replace(/[\t\n\r]/gim, '') // Strip newlines and tabs
    .replace(/\s\s+/g, ' ') // Condense multiple spaces
    .replace(/'/gim, '\\i'); // Normalize quotes

  if (dataUri) {
    const encoded = encodeURIComponent(cleaned)
      .replace(/\(/g, '%28') // Encode brackets
      .replace(/\)/g, '%29');

    return `data:image/svg+xml;charset=${charset},${encoded}`;
  }

  return cleaned;
}

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
    this.pagesIndex = {};
    this.trackResize = true;

    this.rootMargin = options.rootMargin || 1024; // ( 8 * 16 );

    this.sets = {};
    this.sets.visible = new Set();
    this.sets.unloaded = new Set();
    this.sets.loaded = new Set();

    this._tracker = { images: {}, thumbnails: {} };
    this._intervals = {};

    this._initialSeq = options.seq;
    this._initialized = false;
  }

  attachTo(element, cb) {
    this.container = element;
    this.bindEvents();
    this.render(cb);
  }

  render(cb) {
    var minWidth = this.minWidth();
    var maxHeight = this.maxHeight();

    var scale = this.scale;

    var t0 = performance.now();
    var fragment = document.createDocumentFragment();

console.log("-- render", minWidth);

    if ( maxHeight ) {
      this.container.style.setProperty('--max-page-height', `${maxHeight * scale}px`);
    }

    var slice_index = 1;

    this._hasFrontCover = ( this.service.manifest.checkFeatures(1, "FRONT_COVER") || ( this.service.manifest.checkFeatures(1, "COVER") && this.service.manifest.checkFeatures(1, "RIGHT") ) || this.service.manifest.checkFeatures(1, "COVER") || ! this.service.manifest.checkFeatures(1) );
    this._hasBackCover =  ( this.service.manifest.checkFeatures(endSeq, "BACK_COVER") || ( this.service.manifest.checkFeatures(endSeq, "COVER") && this.service.manifest.checkFeatures(endSeq, "LEFT") ) );

    // // --- DEBUGGING
    // this._hasFrontCover = this._hasBackCover = false;

    if ( this._hasFrontCover ) {
        // first page is a cover, so add a dummy page
        var page = document.createElement('div');
        page.setAttribute('tabindex', '-1');
        page.classList.add('page', 'placeholder', 'verso');
        page.dataset.slice = slice_index;
        page.dataset.placeholder = true;
        fragment.appendChild(page);
    }

    for(var seq = 1; seq <= this.service.manifest.totalSeq; seq++) {

      var page = document.createElement('div');
      page.setAttribute('tabindex', '-1');

      var meta = this.service.manifest.meta(seq);
      var ratio = meta.height / meta.width;

      var h = Math.ceil(minWidth * ratio * scale);
      var w = Math.ceil(minWidth * scale);

      page.dataset.height = h;
      page.dataset.width = w;

      page.dataset.bestFit = ( scale <= 1 ) ? 'true' : 'false';
      if ( scale <= 1 ) {
        page.classList.add('page--best-fit');
      }
      // page.style.setProperty('--width', page.style.width);

      page.classList.add('page');
      page.dataset.seq = seq;

      // var klass = ( seq - 1 ) % 2 == 0 ? 'verso' : 'recto';
      var klass = this._assignSide(seq);
      page.classList.add(klass);

      slice_index = this._slicify(seq);

      page.dataset.slice = slice_index;
      page.dataset.loaded = false;

      var bgColor = randomColor({ luminosity: 'random', hue: 'random', format: 'hex' });
      var textColor = contrast(bgColor);

      var bgColor = '#F8F8F8';
      var textColor = '#F0F0F0';

      var placeholder = simpleSvgPlaceholder({
        bgColor: bgColor,
        textColor: textColor,
        text: `#${seq}`,
        fontFamily: `monospace`,
        width: w,
        height: h,
      });

      var thumbnailSrc = this.service.thumbnail({ seq: seq });
      page.innerHTML = `<div class="page--toolbar"><div class="tag"><span>#${seq}</span></div></div><div class="page-text"></div><div class="image" style="height: ${h}px; width: ${w}px"><img height="${h}" width="${w}" src="${placeholder}" data-placeholder-src="${placeholder}" data-thumbnail-src="${thumbnailSrc}" /></div>`;
      this._renderr(page);

      fragment.appendChild(page);
      this.pages.push(page);
      this.pagesIndex[seq] = page;
    }

    var endSeq = this.service.manifest.totalSeq;
    if ( this._hasBackCover ) {
      // there's a back cover
      var page = document.createElement('div');
      page.setAttribute('tabindex', '-1');
      page.classList.add('page', 'placeholder', 'recto');
      page.dataset.slice = slice_index;
      page.dataset.placeholder = true;
      fragment.appendChild(page);
    }

    this.container.appendChild(fragment);

    var pages = this.container.querySelectorAll('.page');

    for(var i = 0; i < pages.length; i++) {
      this.bindPageEvents(pages[i]);
      // pages[i].__coords = {
      //   offsetTop: pages[i].offsetTop,
      //   offsetHeight: pages[i].offsetHeight
      // }
    }

    if ( this._initialSeq ) {
      this.display(this._initialSeq);
    }

    if ( cb ) {
      setTimeout(cb, 1000);
      this._initialized = true;
      // cb();
    }
  }

  _renderr(page) {
    /* NOP */
  }

  _slicify(seq) {
    var n; var delta;
    if ( this._hasFrontCover ) { n = ( seq % 2 == 0 ) ? seq : seq - 1; delta = 1; }
    else { n = ( seq % 2 == 1 ) ? seq : seq - 1; delta = 0; }
    return ( Math.ceil(n / 2) || 0 ) + delta;
  }

  _assignSide(seq) {
    var klass;
    if ( this._hasFrontCover ) { klass = seq % 2 == 0 ? 'verso' : 'recto'; }
    else { klass = seq % 2 == 0 ? 'recto' : 'verso' };
    return klass;
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

    // page.style.height = `${pageHeight}px`;
    // page.style.width = `${pageWidth}px`;
    // page.style.setProperty('--width', `${canvas.naturalWidth}px`);

    var updated_rect = page.getBoundingClientRect();
    var scrollTop = this.container.scrollTop;

    this._postResizePage(page, rect, bounds);
  }

  _postResizePage(page, rect, bounds) {

  }

  redrawPage(page) {
    console.log("-- base.redrawPage", page);
    page.dataset.loaded = page.dataset.reframed = false;
    var page_text = page.querySelector('.page-text');
    if ( page_text ) {
      page_text.innerHTML = '';      
    }
    this._removeHighlights(page);
    this.loadImage(page, { lazy: false });
  }

  loadImage(page, options={}) {
    var self = this;

    var _process = function(seq, loadImage) {
      var page = self.pagesIndex[seq] ? self.pagesIndex[seq] : null;
      if ( page && page.dataset.loaded == 'false' ) {
        var img = page.querySelector('img');
        // img.src.indexOf(img.dataset.thumbnailSrc) < 0 
        // img.src == img.dataset.placeHolderSrc
        if ( page.dataset.reframed != 'true' ) {
          self._tracker.thumbnails[seq] = self._tracker.thumbnails[seq] ? self._tracker.thumbnails[seq] + 1 : 1;
          self.service.loaders.thumbnails.queue({ src: img.dataset.thumbnailSrc, page: page });          
        }
        // previewLoader.add({ src: img.dataset.thumbnailSrc, page: page });
        if ( loadImage ) {
          // imageLoader.add({ src: self.imageUrl(page), page: page })
          self._tracker.images[seq] = self._tracker.images[seq] ? self._tracker.images[seq] + 1 : 1;
          self.service.loaders.images.queue({ src: self.imageUrl(page), page: page });
          if ( self.embedHtml ) {
            var html_url = self.service.html({ seq: seq });
            if ( html_url ) {
              self.service.loaders.images.queue({ src: html_url, page: page, mimetype: 'text/html' });
            }
          }
        }
      }

    }

    var pages = Array.isArray(page) ? page : [ page ];
    console.log("?? loadImage", pages);
    var page = pages[0];

    // first queue the immediate pages
    for(var i = 0; i < pages.length; i++) {
      var page = pages[i];
      var seq = parseInt(page.dataset.seq, 10);
      _process(seq, true);
    }

    // now queue thumbnails
    if ( options.lazy !== false ) {
      var page = pages[0];
      var seq = parseInt(page.dataset.seq, 10);

      for(var ii = seq - 2; ii < seq; ii++) {
        _process(ii, true);
      }
      for(var ii = seq - 10; ii < ( seq + 2 ); ii++) {
        _process(ii, false);
      }
    }

    if ( options.lazy !== false ) {
      var page = pages[pages.length - 1];
      var seq = parseInt(page.dataset.seq, 10);
      for(var ii = seq + 2; ii > seq; ii--) {
        _process(ii, true);
      }
      for(var ii = seq + 10; ii > ( seq + 2 ); ii--) {
        _process(ii, false);
      }
    }

    // var seq = parseInt(page.dataset.seq, 10);
    // _process(seq, true);

    // if ( options.lazy !== false ) {
    //   // queue thumbnails + images
    //   for(var i = seq + 2; i > seq; i--) {
    //     _process(i, true);
    //   }
    //   for(var i = seq - 2; i < seq; i++) {
    //     _process(i, true);
    //   }

    //   // queue thumbnails
    //   for(var i = seq + 10; i > seq + 2; i--) {
    //     _process(i, false);
    //   }
    //   for(var i = seq - 10; i < seq - 2; i++) {
    //     _process(i, false);
    //   }
    // }

    self.service.loaders.images.start();
    self.service.loaders.thumbnails.start();

    console.log("-- loading:", page.dataset.seq);
  }

  postImage(image, datum) {
    var page = datum.page;
    if ( datum.mimetype == 'text/html' ) {
      return this.postText(image, datum);
    }
    if ( page.dataset.loaded != 'true' ) {
      var img = page.querySelector('img');
      img.src = image.src;
      this.service.manifest.update(page.dataset.seq, { width: image.width, height: image.height });
      this._reframePage(image, page);
      // if ( page.dataset.reframed != 'true' ) {
      //   // img.parentElement.style.height = `${img.offsetHeight}px`;
      //   var r = image.height / image.width;
      //   var frame = img.parentElement;
      //   var new_img_height = parseFloat(frame.style.width) * r;
      //   frame.style.height = `${new_img_height}px`;
      //   img.height = new_img_height;
      //   page.dataset.reframed = 'true';
      //   // --- this is like with absolute positioning, everything that 
      //   // --- follows also has to be updated
      //   // page.__coords = {
      //   //   offsetTop: pages[i].offsetTop,
      //   //   offsetHeight: pages[i].offsetHeight
      //   // }
      // }
      page.dataset.loaded = true;

      // if ( this.embedHtml ) {
      //   this.loadText(page);
      // }

    }
  }

  postText(text, datum) {
    var page = datum.page;
    var page_text = page.querySelector('.page-text');
    page_text.innerHTML = text;
    this._drawHighlights(page);
  }

  postThumbnail(image, datum) {
    var page = datum.page;
    if ( page.dataset.loaded != 'true' ) {
      var img = page.querySelector('img');
      this._reframePage(image, page);
      img.src = image.src;
    }
  }

  _reframePage(image, page) {
    if ( page.dataset.reframed != 'true' ) {
      var frame = page.querySelector('.image');
      var img = frame.querySelector('img');

      var r = image.height / image.width;
      var frameWidth = parseFloat(frame.style.width);
      frame.style.height = `${frameWidth * r}px`;

      img.dataset.width = frameWidth;
      img.dataset.height = frameWidth * r;

      this._checkForFoldouts(image, page);
      page.dataset.reframed = 'true';
    }

  }

  _checkForFoldouts(image, page) {

    var seq = page.dataset.seq;
    var manifest = this.service.manifest;

    if ( image.width < image.height ) { return ; }

    var is_unusual = ( 
      ( manifest.checkFeatures(seq, "FOLDOUT") && ! manifest.checkFeatures(seq, "BLANK") )
        || 
      ( ( image.width / image.height ) > ( 4 / 3 ) )
    );

    console.log("-- _checkForFoldouts", seq, is_unusual, image.width, image.height, image.width / image.height, image.width / image.height > ( 4 / 3 ));

    if ( is_unusual ) {
      // probably a fold out? maybe not a fold out?
      page.classList.add('page--foldout');
      this._reframeUnusualImage(page);
      this._addFoldoutPopout(page);
    }
  }

  _reframeUnusualImage(page) {
    var frame = page.querySelector(".image");
    var frameWidth = parseFloat(frame.style.width);
    var margin = ( ( frameWidth * 1.1 ) - frameWidth ) / 2;
    frame.style.marginTop = `${margin}px`;
    page.style.marginBottom = `${margin}px`;
  }

  _addFoldoutPopout(page) {
    var toolbar = page.querySelector('.page--toolbar .tag');
    var icon = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-box-arrow-up-left" viewBox="0 0 16 16">
        <path fill-rule="evenodd" d="M7.364 3.5a.5.5 0 0 1 .5-.5H14.5A1.5 1.5 0 0 1 16 4.5v10a1.5 1.5 0 0 1-1.5 1.5h-10A1.5 1.5 0 0 1 3 14.5V7.864a.5.5 0 1 1 1 0V14.5a.5.5 0 0 0 .5.5h10a.5.5 0 0 0 .5-.5v-10a.5.5 0 0 0-.5-.5H7.864a.5.5 0 0 1-.5-.5z"/>
        <path fill-rule="evenodd" d="M0 .5A.5.5 0 0 1 .5 0h5a.5.5 0 0 1 0 1H1.707l8.147 8.146a.5.5 0 0 1-.708.708L1 1.707V5.5a.5.5 0 0 1-1 0v-5z"/>
      </svg>`;
    icon = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-arrow-up-left-square" viewBox="0 0 16 16">
  <path fill-rule="evenodd" d="M14 1H2a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V2a1 1 0 0 0-1-1zM2 0a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V2a2 2 0 0 0-2-2H2z"/>
  <path fill-rule="evenodd" d="M10.828 10.828a.5.5 0 0 1-.707 0L6.025 6.732V9.5a.5.5 0 0 1-1 0V5.525a.5.5 0 0 1 .5-.5H9.5a.5.5 0 0 1 0 1H6.732l4.096 4.096a.5.5 0 0 1 0 .707z"/>
</svg>`;
    var button = document.createElement('button');
    button.dataset.seq = page.dataset.seq;
    button.dataset.action = 'popout';
    button.setAttribute('aria-label', `Open foldout for page scan #${page.dataset.seq}`);
    button.setAttribute('data-role', 'tooltip');
    button.setAttribute('data-microtip-position', 'left');
    button.setAttribute('data-microtip-size', 'small');
    button.setAttribute('tabindex', '-1');
    button.innerHTML = `${icon}`;
    toolbar.insertBefore(button, toolbar.childNodes[0]);
  }

  redrawPageImages() {
    var possibles = this.container.querySelectorAll('.page[data-loaded="true"]');
    for(var i = 0; i < possibles.length; i++) {
      var page = possibles[i];
      this.redrawPage(page);
    }
    this._redrawPageImagesTimer = null;
  }

  unloadImage(page) {

    page.dataset.loaded = 'false';
    page.dataset.isLeaving = false;

    var img = page.querySelector('img');
    img.src = img.dataset.thumbnailSrc || img.dataset.placeholderSrc;

    var page_text = page.querySelector('.page-text');
    page_text.innerHTML = '';

    this._removeHighlights(page);

    // if ( page.dataset.preloaded == "true" ) { return; }
    // if ( page.dataset.loading == "true" ) { return ; }
    // var canvas = page.querySelector('img');
    // if ( canvas ) {
    //   page.removeChild(canvas);
    // }
    // var page_text = page.querySelector('.page-text');
    // page_text.innerHTML = '';
    // page.dataset.preloaded = false;
    // page.dataset.loaded = false; page.classList.remove('page--loaded');

    // this._removeHighlights(page);
  }

  preloadImages(page) {

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

  maxHeight() {
    return null;
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

  getPage(seq) {
    return this.pagesIndex[seq];
  }

  bindEvents() {
    this._lastContainerWidth = this.container.offsetWidth;
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
        if ( ! this._initialized ) { return ; }
        console.log("base._handlers.resize", this._lastContainerWidth, this._lastContainerWidth ? ( this._lastContainerWidth == ( this.container.offsetWidth * this.scale ) ) : '-',  this.container.offsetWidth, this.scale);
        if ( this._lastContainerWidth && ( this._lastContainerWidth == this.container.offsetWidth * this.scale ) ) { return ; }
        this._lastContainerWidth = this.container.offsetWidth * this.scale;
        this._resizePages();
      })
    }

    this._intervals.unloader = setInterval(this.unloadPages.bind(this), 5000);
  }

  unloadPages() {

    var pages = this.container.querySelectorAll('.page[data-loaded="true"]');
    var possibles = new Set();
    pages.forEach((page) => possibles.add(page.dataset.seq));
    if ( setfn.eqSet(this.sets.unloaded, possibles )) { return ; }
    this.sets.unloaded = possibles;

    var nearest = 5;
    var visible = this.sets.visible;

    var now = Date.now();
    var tmp = [...visible].sort((a,b) => { return a - b});
    var seq1 = parseInt(tmp[0], 10);
    var seq2 = parseInt(tmp[1], 10);

    pages.forEach((page) => {
      var seq = parseInt(page.dataset.seq, 10);
      if ( ! this.isVisible(page) ) {
        if ( ! ( ( Math.abs(seq - seq1) <= nearest ) || ( Math.abs(seq - seq2) <= nearest ) ) ) {
          this.unloadImage(page);
          console.log("<<", seq);
        } else {
          console.log("**", seq);
        }
      }
    })
  }

  // default isVisible
  isVisible(page) {
    return page.dataset.visible == 'true';
  }

  visible(pages) {
    this.sets.visible = new Set();
    if ( pages instanceof HTMLElement ) {
      pages = [ pages ];
    } else {
      pages.forEach((page) => {
        this.sets.visible.add(parseInt(page.dataset.seq, 10));
      })
    }
  }

  bindPageEvents(page) {
  }

  clickHandler(event) {
    var element = event.target.closest('button');
    if ( element && element.dataset.action == 'popout' ) {
      event.preventDefault();
      event.stopPropagation();

      var page = element.closest('.page');
      var img = page.querySelector('img');

      var img_height = parseInt(img.dataset.height, 10);
      var img_width = parseInt(img.dataset.width, 10);

      var max_zoom_h = Math.floor(window.innerHeight * 0.85);
      // var r = zoom_h / img_height;
      // var zoom_w = img_width * r;

      var zoom_w = Math.floor(window.innerWidth * 0.90);
      var r = zoom_w / img_width;
      var zoom_h = img_height * r;

      if ( max_zoom_h < zoom_h ) {
        r = max_zoom_h / zoom_h;
        zoom_h = max_zoom_h;
        zoom_w *= r;
      }

      var zoom_img_src = this.imageUrl({ seq: page.dataset.seq, width: zoom_w });

      var new_img = `<div class="loading foldout"><img style="visibility: hidden; max-height: 100%;" height="${zoom_h}" width="${zoom_w}" /></div>`;
      var dialog = bootbox.dialog(new_img,
        [{ label: 'Close', class: 'btn-dismiss' }],
        {
          lightbox: true,
          header: `View page scan ${page.dataset.seq} foldout`,
          width: zoom_w - 16, // zoom_w,
          height: zoom_h - 16
        }
      );

console.log("-- popout", `${zoom_w}x${zoom_h}`, `${window.innerWidth * 0.9}x${window.innerHeight * 0.9}`, dialog);
window.xdialog = dialog;

      var $zoom_img = dialog.find("img");
      $zoom_img.on('load', function() {
        $zoom_img.css({ visibility: 'visible' });
        $zoom_img.parent().removeClass('loading');
      })
      $zoom_img.attr('src', zoom_img_src);
    }
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
    clearInterval(this._intervals.unloader);
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
    var maxHeight = this.maxHeight();

    var scale = this.scale;
    var currentSeq = this.currentLocation();
console.log("?? _resizePages", currentSeq);

    if ( maxHeight ) {
      this.container.style.setProperty('--max-page-height', `${maxHeight * scale}px`);
    }

    var dirty = false;
    this.pages.forEach((page) => {
      var seq = parseInt(page.dataset.seq, 10);
      var meta = this.service.manifest.meta(seq);
      var ratio = meta.height / meta.width;

      var h = Math.ceil(minWidth * ratio * scale);
      var w = Math.ceil(minWidth * scale);

      // console.log("AHOY _resizePages", seq, page.style.width, "x", page.style.height, "/", w, "x", h);

      dirty = dirty || ( page.style.height != `${h}px` );

      page.dataset.width = w;
      page.dataset.height = h;
      page.querySelector('.image').style.width = `${w}px`;
      page.querySelector('.image').style.height = `${h}px`;
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
    var image_frame = page.querySelector('.image');
    var page_text = page.querySelector('.page-text');

    var timestamp = (new Date).getTime();

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
    if ( HT.debug_words ) { words = HT.debug_words; }
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
      scaling.width = img.width; // img.offsetWidth;
      scaling.height = img.height; // img.offsetHeight;
    }

    // if we're rotated then shift these
    var meta = this.service.manifest.meta(page.dataset.seq);
    if ( meta.rotation == 90 || meta.rotation == 270 ) {
      [ scaling.width, scaling.height ] = [ scaling.height, scaling.width ];
    }

    scaling.ratio = scaling.width / page_coords[2];
    scaling.ratioY = scaling.height / page_coords[3];
    scaling.padding = 0; // parseInt(window.getComputedStyle(page).marginTop) / 2;

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
      highlight.dataset.word = innerHTML;
      highlight.dataset.timestamp = timestamp;

      highlight.dataset.top = coords[1];
      highlight.dataset.padding = scaling.padding;

      highlight.style.width = `${highlight_w / scaling.width * 100.0}%`;
      highlight.style.height = `${highlight_h / scaling.height * 100.0}%`;
      highlight.style.top = `${( coords[1] - ( ( highlight_h - highlight_h0 ) / 2 ) ) / scaling.height * 100.0}%`;
      highlight.style.left = `${( coords[0] - ( ( highlight_w - highlight_w0 ) / 2 ) ) / scaling.width * 100.0}%`;
      image_frame.appendChild(highlight);

      console.log("AHOY MATCH", page.dataset.seq, innerHTML, coords, scaling.ratio, scaling.ratioY, scaling);
    })
  }

  _removeHighlights(page) {
    var image_frame = page.querySelector('.image');
    var highlights = page.querySelectorAll('.highlight');
    var n = highlights.length;
    for(var i = 0; i < n; i++) {
      image_frame.removeChild(highlights[i]);
    }
    return n;
  }

  _resizePageByPages() {
    /* NOP */
  }

  isVisible(page) {
    var windowTop = this.container.parentNode.scrollTop;
    var windowHeight = this.container.parentNode.offsetHeight;

    var rootMargin = this.rootMargin;

    var top = page.offsetTop;
    var height = page.offsetHeight;
    // var top = page.__coords.offsetTop;
    // var height = page.__coords.offsetHeight;

    if (top + height + rootMargin >= windowTop &&
              top - rootMargin <= windowTop + windowHeight ) {
      return true;
    }

    return false;
  }

}

