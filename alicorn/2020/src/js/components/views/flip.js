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
    this._checkForFoldouts = this.checkForFoldouts.bind(this);
    this._edges = {};
    this._layout = {};
    this.trackResize = false;

    this.setupSlices();
  }

  setupSlices() {
    var totalSeq = this.service.manifest.totalSeq;
    var num_slices = Math.ceil((this.service.manifest.totalSeq - 2) / 2) + 2;
    this.seq2slice = {};
    this.slices = [];

    var startSeq = 1;
    var endSeq = this.service.manifest.totalSeq;

    if ( this.service.manifest.checkFeatures(1, "FRONT_COVER") || ( this.service.manifest.checkFeatures(1, "COVER") && this.service.manifest.checkFeatures(1, "RIGHT") ) || this.service.manifest.checkFeatures(1, "COVER") || ! this.service.manifest.checkFeatures(1) ) {
        // first page is a cover
        this.slices.push([ { seq: null }, {seq: 1 }]);
        startSeq = 2;
    }
    var lastSlice;
    if ( this.service.manifest.checkFeatures(endSeq, "BACK_COVER") || ( this.service.manifest.checkFeatures(endSeq, "COVER") && this.service.manifest.checkFeatures(endSeq, "LEFT") ) ) {
        lastSlice = [ { seq: endSeq }, { seq: null } ];
        endSeq -= 1;
    }

    for(var seq = startSeq; seq <= endSeq; seq += 2) {
      var next_seq = seq + 1;
      if ( next_seq > this.service.manifest.totalSeq ) {
        next_seq = null;
      }
      this.slices.push([ {seq: seq }, { seq: next_seq } ]);
    }

    if ( lastSlice ) {
      this.slices.push(lastSlice);
    }

    if ( this.isRTL ) {
      this.slices.reverse();
    }

    this.slices.forEach((tuple, slice_idx) => {
      if ( this.isRTL ) { tuple.reverse(); }
      tuple.forEach((slice) => {
        if ( slice.seq !== null ) {
          this.seq2slice[slice.seq] = slice_idx;
        }
      })
    })
  }

  render(cb) {
    var slices = this.slices;

    this._updateLayout();
    
    // this.container.style.display = 'none';

    var fragment = document.createDocumentFragment();

    slices.forEach((datum, slice_idx) => {
      var slice = this._buildSlice(datum, slice_idx);
      fragment.appendChild(slice);
      datum.slice = slice;
      this._updateLayoutSlice(datum);
    })

    this._updateLayoutEdges();

    slices.forEach((datum) => {
      this._updateLayoutSliceSize(datum);
    });

    this.container.appendChild(fragment);
    // this.container.style.display = 'block';

    this.is_active = true;
    // this.loadSlice(this.container.querySelector('.slice'));
    if ( cb ) {
      cb();
    }
  }

  minPageWidth() {
    return this._layout.minWidth;
  }

  _updateLayout() {
    this._layout.minWidth = ( this.minWidth() / 2 ) * this.scale;
    this._layout.maxHeight = this.container.parentNode.offsetHeight * 0.95 * this.scale;
    this._layout.offsetWidth = this.minWidth() * this.scale;
    this._layout.pageHeight = this._layout.maxHeight; //  * this.scale;
    this._layout.edgeHeight = this._layout.pageHeight * 0.98;
    this._layout.containerWidth = this.container.parentNode.offsetWidth;

    // this.container.style.setProperty('--page-height', `${this._layout.pageHeight}px`);
    // this.container.style.setProperty('--slice-width', `${this._layout.sliceWidth}px`);

    this._layout.maxEdgeWidth = 0;
    this._layout.maxSliceWidth = 0;
  }

  _updateLayoutSlice(datum) {
    var slice, edge, page, slice_width;
    slice = datum.slice;
    edge = slice.querySelector('.edge.verso');
    edge.style.height = `${this._layout.edgeHeight}px`;

    page = slice.querySelector('.page.verso');
    page.style.height = `${this._layout.pageHeight}px`;
    page.style.maxHeight = page.style.height;
    page.style.width = `${this._layout.pageHeight * datum[0].ratio}px`;
    slice_width = this._layout.pageHeight * datum[0].ratio;

    edge = slice.querySelector('.edge.recto');
    edge.style.height = `${this._layout.edgeHeight}px`;

    page = slice.querySelector('.page.recto');
    page.style.height = `${this._layout.pageHeight}px`;
    page.style.maxHeight = page.style.height;
    page.style.width = `${this._layout.pageHeight * datum[1].ratio}px`;
    slice_width += this._layout.pageHeight * datum[1].ratio;

    if ( slice_width > this._layout.maxSliceWidth ) {
      this._layout.maxSliceWidth = slice_width;
    }

    if ( this.scale > 1.0 ) {
      slice.style.height = `${this._layout.pageHeight * 1.02}px`;
    } else {
      slice.style.height = 'auto';
    }

  }

  _updateLayoutSliceSize(datum) {
    var slice = datum.slice;
    var sliceWidth = this._layout.sliceWidth;
    slice.style.width = `${sliceWidth}px`;
  }

  _updateLayoutEdges() {
    // var max_edge_width = Math.abs(( ( this._layout.offsetWidth - ( this._layout.maxSliceWidth / this.scale ) ) * 0.85 ) / 2);
    var max_edge_width = this._layout.maxSliceWidth * 0.25;
    var page_factor = 10;
    var edge_width = 3 * Math.ceil(this.service.manifest.totalSeq / page_factor);
    if ( edge_width > max_edge_width ) { edge_width = max_edge_width; }
    this._layout.maxEdgeWidth = edge_width;

    this.slices.forEach((datum) => {
      var slice = datum.slice;
      slice.querySelector('.edge.verso').style.width = `${edge_width * datum[0].edgeFraction}px`;
      slice.querySelector('.edge.recto').style.width = `${edge_width * datum[1].edgeFraction}px`;
    })

    this._layout.sliceWidth = this._layout.maxSliceWidth + ( this._layout.maxEdgeWidth * 1.10 );
    if ( this._layout.sliceWidth < this._layout.containerWidth ) {
      this.container.classList.add('viewer--centered');
    } else {
      this.container.classList.remove('viewer--centered');
    }
  }

  _buildSlice(datum, slice_idx) {
    var edge, page, slice;

    slice = document.createElement('div');
    slice.classList.add('slice');
    // slice.style.width = `${this._layout.sliceWidth}px`;

    datum[0].edgeFraction = slice_idx / this.slices.length;
    edge = this._buildEdge('verso', datum[0].edgeFraction);
    slice.appendChild(edge);
    page = this._buildPage('verso', datum[0]);
    slice.appendChild(page);

    datum[1].edgeFraction = ( this.slices.length - slice_idx ) / this.slices.length;
    page = this._buildPage('recto', datum[1]);
    slice.appendChild(page);
    edge = this._buildEdge('recto', datum[1].edgeFraction);
    slice.appendChild(edge);

    slice.dataset.visible = false; slice.classList.remove('slice--visible');
    slice.dataset.slice = slice_idx;

    return slice;
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

  loadSlice(slice) {
    var pages = slice.querySelectorAll('.page[data-seq]');
    for(var i = 0; i < pages.length; i++) {
      this.loadImage(pages[i], { check_scroll: true, callback: this._checkForFoldouts });
    }
    slice.dataset.visible = true; slice.classList.add('slice--visible');
  }

  unloadSlice(slice) {
    var pages = slice.querySelectorAll('.page[data-seq]');
    for(var i = 0; i < pages.length; i++) {
      this.unloadImage(pages[i]);
      this.unfocus(pages[i]);
    }
    slice.dataset.visible = false; slice.classList.remove('slice--visible');
  }

  // resizePage(page) {
  // }

  display(seq) {
    seq = parseInt(seq, 10);
    var current = this.container.querySelector(`.slice[data-visible="true"]`);
    var slice_idx = this.seq2slice[seq];
    var target = this.container.querySelector(`.slice[data-slice="${slice_idx}"]`);

    this.currentSeq = seq;

    // var target = this.container.querySelector(`.page[data-seq="${seq}"]`);
    if ( ! target ) { return; }
    if ( target == current ) { return ; }

    if ( current ) {
      // current.dataset.visible = false; current.classList.remove('slice--visible');
      this._invisible(current);
      setTimeout(function() {
        this.unloadSlice(current);
      }.bind(this))
    }

    this._visible(target);

    this.loadSlice(target);
    // this.loadImage(target, true);
    this.reader.emit('relocated', { seq: this.slice2seq(slice_idx) });
  }

  _visible(target) {
    target.dataset.visible = true; target.classList.add('slice--visible');
    var pages = target.querySelectorAll('.page');
    for(var i = 0; i < pages.length; i++) {
      pages[i].classList.add('page--visible');
    }
  }

  _invisible(target) {
    target.dataset.visible = false; target.classList.remove('slice--visible');
    var pages = target.querySelectorAll('.page');
    for(var i = 0; i < pages.length; i++) {
      pages[i].classList.remove('page--visible');
    }
  }

  slice2seq(slice_idx) {
    var tuple = this.slices[slice_idx];
    if ( tuple[0] && tuple[0].seq ) { return tuple[0].seq; }
    return tuple[1].seq;
  }

  currentLocation(side='DEFAULT') {
    var slice = this.container.querySelector('.slice[data-visible="true"]');
    var expr;
    switch(side) {
      case 'DEFAULT':
        expr = '.page[data-seq]'; // first match
        break;
      case 'VERSO':
        expr = '.page.verso';
        break;
      case 'RECTO':
        expr = '.page.recto';
    }
    var page = slice.querySelector(expr);
    return page ? page.dataset.seq : null;
  }

  currentPage() {
    var slice = this.container.querySelector('.slice[data-visible="true"]');
    var page = slice.querySelector('.page[data-seq]');
    return page;
  }

  currentLocations() {
    var verso = this.container.querySelector('.slice[data-visible="true"] .page.verso');
    var recto = this.container.querySelector('.slice[data-visible="true"] .page.recto');
    var retval = [];

  }

  _calculateSeq(direction) {
    if ( this.isRTL ) { direction = -direction; }
    var delta;
    if ( direction > 0 ) {
      delta = this.currentSeq == 1 ? 1 : 2;
    } else {
      delta = -2;
    }
    var seq = this.currentSeq + delta;
    if ( seq <= 0 ) { seq = 1; }
    if ( seq > this.service.manifest.totalSeq ) { seq = this.service.manifest.totalSeq; }
    return seq;
  }

  next() {
    this.container.scrollTop = 0;
    this.display(this._calculateSeq(1));
  }

  prev() {
    this.container.scrollTop = 0;
    this.display(this._calculateSeq(-1));
  }

  first() {
    this.display(this.isRTL ? this.service.manifest.totalSeq : 1);
  }

  last() {
    this.display(this.isRTL ? 1 : this.service.manifest.totalSeq);
  }

  minWidth() {
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
    var ideal_w = ( this._max.width * r * 2 );
    if ( ideal_w < w ) { this._minWidth = w; }
    else if ( ideal_w / w < 1.125 ) { this._minWidth = w; }
    else { this._minWidth = ideal_w; }

    return this._minWidth;
  }

  preloadImages(page) {
    var seq = parseInt(page.dataset.seq, 10);
    var delta = 1;
    while ( delta <= 2 ) {
      var prev_page = this.container.querySelector(`.page[data-seq="${seq - delta}"]`);
      if ( prev_page ) {
        prev_page.dataset.preloaded = true;
        this.loadImage(prev_page, { check_scroll: true, callback: this._checkForFoldouts });
      }
      delta += 1;
    }
    delta = 1;
    while ( delta <= 2 ) {
      var next_page = this.container.querySelector(`.page[data-seq="${seq + delta}"]`);
      if ( next_page ) {
        next_page.dataset.preloaded = true;
        this.loadImage(next_page, { check_scroll: true, callback: this._checkForFoldouts });
      }
      delta += 1;
    }
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

    this._handlers.resize = this.reader.on('resize', () => {

      this._updateLayout();

      this.slices.forEach((datum) => {
        this._updateLayoutSlice(datum);
      });

      this._updateLayoutEdges();

      this.slices.forEach((datum) => {
        this._updateLayoutSliceSize(datum);
      });

      if ( this._redrawPageImagesTimer ) { clearTimeout(this._redrawPageImagesTimer); }
      this._redrawPageImagesTimer = setTimeout(() => {
        this.redrawPageImages();
      }, 100);

    })
  }

  bindPageEvents(page) {
    page.parentElement.dataset.visible = false;
  }

  clickHandler(event) {
    var element = event.target;
    if ( element.classList.contains('edge') ) {
      return this._clickHandlerEdge(element, event);
    }
    if ( element.tagName.toLowerCase() == 'button' ) {
      if ( element.classList.contains('action-view-foldout') ) {
        event.preventDefault();
        event.stopPropagation();
        var page = element.closest('.page');
        var img = page.querySelector('img.foldout');

        var img_height = parseInt(img.dataset.height, 10);
        var img_width = parseInt(img.dataset.width, 10);

        var zoom_h = window.innerHeight * 0.80;
        var r = zoom_h / img_height;
        var zoom_w = img_width * r;

        zoom_w = window.innerWidth * 0.80;
        zoom_h = zoom_w / r;

        var zoom_img_src = this.imageUrl({ seq: page.dataset.seq, width: zoom_w });

        var new_img = `<div class="loading foldout"><img style="visibility: hidden" height="${zoom_h}" width="${zoom_w}" /></div>`;
        var dialog = bootbox.dialog(new_img,
          [{ label: 'Close', class: 'btn-dismiss' }],
          {
            lightbox: true,
            header: `View page scan ${page.dataset.seq} foldout`,
            width: ( window.innerWidth * 0.80 ), // zoom_w,
            height: ( window.innerHeight * 0.80 )
          }
        );
        var $zoom_img = dialog.find("img");
        $zoom_img.on('load', function() {
          $zoom_img.css({ visibility: 'visible' });
          $zoom_img.parent().removeClass('loading');
        })
        $zoom_img.attr('src', zoom_img_src);
      }
    } else {
      // check that this is a page
      element = element.closest('.page');
      if ( element ) {
        return this._clickHandlerPage(element, event);
      }
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

  _clickHandlerEdge(edge, event) {
    var offsetX = event.offsetX;
    var edge_width = edge.offsetWidth;
    var totalSeq = this.service.manifest.totalSeq;
    var target_slice; var target_seq;
    if ( edge.classList.contains('recto') ) {
      // recto edge
      var page = edge.parentElement.querySelector('.page.recto');
      var seq = parseInt(page.dataset.seq, 10);
      target_seq = Math.ceil(seq + ( totalSeq - seq ) * ( offsetX / edge_width ));
      if ( target_seq > totalSeq ) { target_seq = totalSeq; }
    } else {
      // verso edge
      var page = edge.parentElement.querySelector('.page.verso');
      var seq = parseInt(page.dataset.seq, 10);
      target_seq = Math.ceil(seq - ( seq ) * ( ( edge_width - offsetX ) / edge_width ));
      if ( target_seq < 1 ) { target_seq = 1; }
    }
    // console.log("AHOY AHOY flip.click edge", event.target, offsetX, seq, target_seq, ( edge_width - offsetX ) / edge_width);
    this.display(target_seq);
  }

  checkForFoldouts(img) {

    var page = img.parentElement;
    var slice = page.parentElement;
    var seq = page.dataset.seq;

    var manifest = this.service.manifest;

    var is_unusual = ( 
      ( manifest.checkFeatures(seq, "FOLDOUT") && ! manifest.checkFeatures(seq, "BLANK") )
        || 
      ( ( page.offsetHeight / slice.offsetHeight ) < 0.75 )
    );
    if ( is_unusual ) {
      console.log("AHOY AHOY FOLDOUT?", seq, img.width, img.height, is_unusual);
      img.classList.add('foldout');
      img.dataset.width = img.width;
      img.dataset.height = img.height;
      // img.dataset.adjustedHeight = adjusted_img_height;

      // var page = img.parentElement;
      var button = document.createElement('button');
      button.classList.add('btn', 'btn-mini', 'action-view-foldout');
      button.innerText = 'View Foldout';
      button.dataset.seq = page.dataset.seq;
      var marginLeft = ( ( page.offsetWidth - img.offsetWidth ) / 2 ) / page.offsetWidth * 100.0;
      var delta = '';
      if ( page.classList.contains('recto') ) {
        delta = '-';
      }
      button.style.marginLeft = `${delta}${marginLeft}%`;
      page.appendChild(button);
    }
  }

  destroy() {
    super.destroy();
    var pages = this.container.querySelectorAll('.slice');
    for(var i = 0; i < pages.length; i++) {
      this.container.removeChild(pages[i]);
    }
    this.container.removeEventListener('click', this._clickHandler);
    this._handlers.resize();

  }

  config() {
    var retval = super.config();
    retval.rotate = false;
    return retval;
  }

};
