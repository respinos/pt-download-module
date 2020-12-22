import NanoEvents from 'nanoevents';
import {Base} from './base';

import debounce from 'lodash/debounce';

export var Flip = class extends Base {
  constructor(options={}) {
    super(options);
    this.mode = 'image';
    this.name = '2up';
    this.displayLabel = 'flip page scans'; // 'two-page side-by-side';
    this.embedHtml = true;
    this.is_active = false;
    this.isRTL = this.service.manifest.options.readingOrder  == 'right-to-left';
    // this._checkForFoldouts = this.checkForFoldouts.bind(this);
    this._edges = {};
    this._layout = {};
    this.trackResize = true;
    this.isAnimating = false;
  }

  _buildEdge(side, fraction) {
    var div = document.createElement('div');
    div.classList.add('edge', side);
    div.style.setProperty('--fraction', fraction);
    return div;
  }

  _buildPage(side, datum) {
    if ( datum.seq === null ) {
      return this._buildNull(side, datum);
    }

    var page = document.createElement('div');
    page.classList.add('page', side);
    var seq = datum.seq;

    datum.ratio = this._pageRatio(datum.seq);
    page.style.setProperty('--page-ratio', datum.ratio);

    page.dataset.seq = seq;
    page.setAttribute('tabindex', 0);

    page.innerHTML = `<div class="page-text"></div><div class="info">${seq}</div>`;
    return page;
  }

  _buildNull(side, datum) {
    var page = document.createElement('div');
    page.classList.add('page', 'page--null', side);
    datum.ratio = this._pageRatio(1);
    page.style.setProperty('--page-ratio', datum.ratio);
    page.innerHTML = `<div class="page-text"></div>`;

    return page;
  }

  _pageRatio(seq) {
    var ratio;
    var meta = this.service.manifest.meta(seq);
    if ( meta.width > meta.height ) {
      ratio = meta.height / meta.width;
    } else {
      ratio = meta.width / meta.height;
    }
    return ratio;
  }

  imageUrl(params) {
    var oprams = params;
    if ( params instanceof HTMLElement ) {
      var element = params; params = {};
      params.seq = element.dataset.seq;
      params.height = element.offsetHeight;
    }

    if ( ! params.width && ! params.height ) {
      console.log("AHOY IMAGEURL PROBLEM", params, oprams);
    }

    return this.service.image(params);
  }

  _hide(seq) {
    this.container.querySelectorAll(`.page[data-slice="${this._slicify(seq)}"]`).forEach(function(page) {
      page.dataset.visible = false;
    });
  }

  _queue(seq) {
    var nodes = this.container.querySelectorAll(`.page[data-slice="${this._slicify(seq)}"]`);
    var possibles = this.container.querySelectorAll(`.page[data-slice="${this._slicify(seq)}"]`);
    this.loadImage(Array.prototype.slice.call(possibles));
    nodes.forEach(function(page) {
      page.dataset.visible = 'pending';
    });  
    return nodes;
  }

  render(cb) {
    if ( this.isRTL ) {
      this.container.classList.add('reading-order--rtl');
    }
    super.render(cb);
  }

  display(seq) {
    var self = this;

    if ( self.isAnimating ) { return ; }

    seq = parseInt(seq, 10);
    if ( seq == this.currentSeq ) { return ; }

    var currentPages = this.container.querySelectorAll('.page[data-visible="true"]');
    
    var slice_index = this._slicify(seq);
    var targetPages = this.container.querySelectorAll(`.page[data-slice="${this._slicify(seq)}"]`);
    if ( ! targetPages.length ) { return; }

    this.loadImage(Array.prototype.slice.call(targetPages));

    // really?
    var delta = this.currentSeq < seq;
    targetPages.forEach((page) => { page.dataset.visible = true; })
    this.currentSeq = seq;

    if ( ! currentPages.length ) { return ; }

    // var inClass = delta > 0 ? 'page--flipFromRight' : 'page--flipFromLeft';
    // var outClass = delta > 0 ? 'page--flipToLeft' : 'page--flipToRight';
    var inClass = delta > 0 ? 'page--flipToLeft' : 'page--flipToRight';
    var otherClass = delta > 0 ? 'page--flippingToLeft' : 'page--flippingToRight';
    var outClass = inClass;

    // outClass = 'page--fade';

    var endCurrentPage = false;
    var endTargetPage = false;

    var onEndAnimation = function(currentPages, targetPages) {
      console.log("-- onEndAnimation", currentPages, targetPages);
      endTargetPage = false;
      endCurrentPage = false;
      currentPages.forEach((page) => { page.dataset.visible = false; page.classList.remove(outClass, otherClass); })      
      targetPages.forEach((page) => { page.classList.remove(inClass, otherClass); })
      self.container.classList.remove('animating');
      self.isAnimating = false;

      self.reader.emit('relocated', { seq: self.currentSeq });
    }

    var outAnimationHandler = function(event) {
      currentPages.forEach((page) => { page.removeEventListener('animationend', outAnimationHandler); });
      endCurrentPage = true;
      console.log("-- outAnimationHandler", endCurrentPage, endTargetPage);
      if ( endTargetPage ) { onEndAnimation(currentPages, targetPages); }
    }
    var inAnimationHandler = function(event) {
      targetPages.forEach((page) => { page.removeEventListener('animationend', inAnimationHandler); });
      endTargetPage = true;
      console.log("-- inAnimationHandler", endCurrentPage, endTargetPage);
      if ( endCurrentPage ) { onEndAnimation(currentPages, targetPages); }      
    }

    this.container.classList.add('animating');
    currentPages.forEach((page) => { page.addEventListener('animationend', outAnimationHandler); });
    targetPages.forEach((page) => { page.addEventListener('animationend', inAnimationHandler); });

    // current.addEventListener('animationend', (event) => { console.log('-- current animationend') });
    // target.addEventListener('animationend', (event) => { console.log('-- target animationend') });

    console.log("flip.display", seq, currentPages, targetPages);
    if ( delta > 0 ) {
      currentPages[1].classList.add(outClass);
      targetPages[0].classList.add(inClass);
    } else {
      currentPages[0].classList.add(outClass);
      targetPages[1].classList.add(inClass);
    }

    this.visible(targetPages);
  }

  displayNOANIMATION(seq) {
    var currentPages = this.container.querySelectorAll('.page[data-visible="true"]');
    if ( currentPages ) {
      currentPages.forEach((page) => {
        page.dataset.visible = false;
      })
    }

    // this._queue(seq);
    // this.container.dataset.animating = true;
    // this.container.dataset.transition = ( this.currentSeq < seq ) ? 'next' : 'previous';

    this.currentSeq = parseInt(seq, 10);

    var slice_index = this._slicify(seq);
    var possibles = this.container.querySelectorAll(`.page[data-slice="${this._slicify(seq)}"]`);
    console.log("--", seq, slice_index, possibles);
    this.loadImage(Array.prototype.slice.call(possibles));
    possibles.forEach(function(page) {
      page.dataset.visible = true;
    });

    this.visible(possibles);
    this.reader.emit('relocated', { seq: seq });
  }

  _reframePage(image, page) {
    if ( page.dataset.reframed != 'true' ) {
      var frame = page.querySelector('.image');
      var img = frame.querySelector('img');

      var r = image.height / image.width;
      var frameWidth = parseFloat(frame.style.width);
      frame.style.height = `${frameWidth * r}px`;

      // change the width to match how much padding we have
      var slice_index = parseInt(page.dataset.slice, 10);
      var slice_max = this._slicify(this.service.manifest.totalSeq);
      var slice_fraction;
      if ( page.classList.contains('verso') ) {
        slice_fraction = slice_index / slice_max;
      } else {
        slice_fraction = ( slice_max - slice_index ) / slice_max;
      }
      var edge_width = ( frameWidth - img.offsetWidth ) * slice_fraction;

      img.dataset.width = frameWidth;
      img.dataset.height = frameWidth * r;

      // frame.style.width = `${img.offsetWidth + ( frameWidth * slice_fraction )}px`;
      frame.style.width = `${img.offsetWidth + edge_width}px`;

      this._checkForFoldouts(image, page);
      page.dataset.reframed = 'true';
      console.log("-- _reframePage", page.dataset.seq, edge_width, slice_fraction, img.clientWidth, frameWidth * slice_fraction, img.clientWidth + ( frameWidth * slice_fraction ));
    }

  }

  currentLocation(side='DEFAULT') {
    // var slice = this.container.querySelector('.page[data-visible="true"]');
    var expr;
    switch(side) {
      case 'DEFAULT':
        expr = '.page[data-visible="true"][data-seq]'; // first match
        break;
      case 'VERSO':
        expr = '.page[data-visible="true"].verso';
        break;
      case 'RECTO':
        expr = '.page[data-visible="true"].recto';
    }
    // var page = slice.querySelector(expr);
    var page = this.container.querySelector(expr);
    return page ? page.dataset.seq : null;
  }

  currentPage() {
    return this.container.querySelector('.page[data-visible="true"]');
  }

  _calculateSeq(direction) {
    if ( this.isRTL ) { direction = -direction; }
    var delta;
    if ( direction > 0 ) {
      delta = ( this._hasFrontCover && this.currentSeq ) == 1 ? 1 : 2;
    } else {
      delta = -2;
    }
    var seq = this.currentSeq + delta;
    if ( seq <= 0 ) { seq = 1; }
    if ( seq > this.service.manifest.totalSeq ) { seq = this.service.manifest.totalSeq; }
    return seq;
  }

  next() {
    this.display(this._calculateSeq(1));
  }

  prev() {
    this.display(this._calculateSeq(-1));
  }

  first() {
    this.display(this.isRTL ? this.service.manifest.totalSeq : 1);
  }

  last() {
    this.display(this.isRTL ? 1 : this.service.manifest.totalSeq);
  }

  minWidth() {
    var minWidth = this.container.parentNode.offsetWidth;
    return this.minWidthNew();
  }

  maxHeight() {
    return this.container.parentNode.offsetHeight * 0.81;
  }

  minWidthNew2() {
    var minWidth = this.container.parentNode.offsetWidth;
    var h = this.container.parentNode.offsetHeight;

  }

  minWidthNew() {
    var minWidth = this.container.parentNode.offsetWidth;
    // if ( minWidth < 680 && window.innerWidth >= 680 ) { minWidth = 680; }
    // else if ( window.innerWidth < 680 ) { minWidth = window.innerWidth * 0.95; }

    minWidth /= 2;
    minWidth *= 0.9;

    return minWidth;
  }

  minWidthOld() {
    if ( ! this._max ) {
      var max = null;
      for(var seq = 1; seq < this.service.manifest.totalSeq; seq++) {
        var meta = this.service.manifest.meta(seq);
        if ( max === null || meta.width > max.width ) {
          max = meta;
        }
      }
      this._max = max;
    }

    var w = this.container.parentNode.offsetWidth;
    var h = this.container.parentNode.offsetHeight;

    var r = h / this._max.height;
    var ideal_w = ( this._max.width * r * 1 );
    if ( ideal_w < w ) { this._minWidth = w; }
    else if ( ideal_w / w < 1.125 ) { this._minWidth = w; }
    else { this._minWidth = ideal_w; }

    return this._minWidth;
  }

  _reframeUnusualImage(page) {
    // NOP
  }

  bindEvents() {
    var self = this;

    super.bindEvents();

    this._clickHandler = this.clickHandler.bind(this);
    this.container.addEventListener('click', this._clickHandler);

    this.reader.on('redraw', (params) => {
      if ( params.scale ) {
        this.scale = params.scale;
      }
      this.reader.emit('resize');
    });

    // this._handlers.resize = this.reader.on('resize', () => {

    //   // this._updateLayout();

    //   // this.slices.forEach((datum) => {
    //   //   this._updateLayoutSlice(datum);
    //   // });

    //   // this._updateLayoutEdges();

    //   // this.slices.forEach((datum) => {
    //   //   this._updateLayoutSliceSize(datum);
    //   // });

    //   // if ( this._redrawPageImagesTimer ) { clearTimeout(this._redrawPageImagesTimer); }
    //   // this._redrawPageImagesTimer = setTimeout(() => {
    //   //   this.redrawPageImages();
    //   // }, 100);

    // })

    // })
  }

  bindPageEvents(page) {
    page.parentElement.dataset.visible = false;
  }

  clickHandler(event) {

    super.clickHandler(event);

    var element = event.target;

    if ( element.closest('button') ) { return ; }

    if ( element.closest('img') ) {
      // click directly on the <img>
      element = element.closest('.page');
      return this._clickHandlerPage(element, event);
    }

    if ( element.closest('.image') ) {
      // clicked not on the <img> but the edge
      return this._clickHandlerEdge(element.closest('.image'), event) ;
    }
  }

  _clickHandlerPage(page, event) {
    if ( page.classList.contains('verso') ) {
      // navigating back
      this.prev();
    } else {
      // navigating next
      this.next();
    }
  }

  _clickHandlerEdge(frame, event) {
    var offsetX = event.offsetX;
    var img = frame.querySelector('img');
    var page = frame.closest('.page');
    var edge_width = ( frame.offsetWidth - img.offsetWidth );
    offsetX -= img.offsetWidth;
    var totalSeq = this.service.manifest.totalSeq;
    var target_slice; var target_seq;
    if ( page.classList.contains('recto') ) {
      // recto edge
      var seq = parseInt(page.dataset.seq, 10);
      target_seq = Math.ceil(seq + ( totalSeq - seq ) * ( offsetX / edge_width ));
      if ( target_seq > totalSeq ) { target_seq = totalSeq; }
    } else {
      // verso edge
      var seq = parseInt(page.dataset.seq, 10);
      target_seq = Math.ceil(seq - ( seq ) * ( ( edge_width - offsetX ) / edge_width ));
      if ( target_seq < 1 ) { target_seq = 1; }
    }
    // console.log("AHOY AHOY flip.click edge", event.target, offsetX, seq, target_seq, ( edge_width - offsetX ) / edge_width);
    this.display(target_seq);
  }

  destroy() {
    super.destroy();
    // var pages = this.container.querySelectorAll('.slice');
    // for(var i = 0; i < pages.length; i++) {
    //   this.container.removeChild(pages[i]);
    // }
    this.container.removeEventListener('click', this._clickHandler);
    this._handlers.resize();

  }

  config() {
    var retval = super.config();
    retval.rotate = false;
    return retval;
  }

};
