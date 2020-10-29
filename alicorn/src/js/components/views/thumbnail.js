import {Scroll} from './scroll';

export var Thumbnail = class extends Scroll {
  constructor(options={}) {
    super(options);
    this.mode = 'thumbnail';
    this.name = 'thumb';
    this.displayLabel = 'thumbnails';
    this.possibles = [ 0.5, 0.75, 1.0 ];
    this.scale = 1.0;
    this.embedHtml = false;
    this.trackResize = false;
  }

  imageUrl(params) {
    if ( params instanceof HTMLElement ) {
      var element = params; params = {};
      params.seq = element.dataset.seq;
      params.width = element.offsetWidth;
    }
    return this.service.thumbnail(params);
  }

  minWidth() {
    // best guess
    // return 160;
    var max = null;
    for(var seq = 1; seq < this.service.manifest.totalSeq; seq++) {
      var meta = this.service.manifest.meta(seq);
      if ( max === null || meta.width > max.width ) {
        max = meta;
      }
    }
    // calculate a ratio based on the max height of a thumbnail,
    // since most page scans are taller than wider
    var r = 250 / max.height;
    var w = max.width * r;

    if ( window.innerWidth < 680 ) {
      w *= ( window.innerWidth / 680 );
    }
    
    return w;
  }

  bindEvents() {
    super.bindEvents();
    this._clickHandler = this.clickHandler.bind(this);
    this.container.addEventListener('click', this._clickHandler);

    this.reader.on('redraw', (params) => {
      if ( ! params.scale ) { return; }
      this.scale = params.scale;
      this._resizePages();
    });
  }

  _resizePageByPages(page) {
    var img = page.querySelector('img');
    if ( img ) {
      img.style.width = page.style.width;
      img.style.height = page.style.height;
    }
  }

  redrawPageImages() {
    this._redrawPageImagesTimer = null;
  }

  clickHandler(event) {
    var element = event.target;
    if ( element.tagName.toLowerCase() != 'button' ) {
      element = element.closest('.page');
      if ( element ) {
        this.reader.restart({ view: '1up', seq: element.dataset.seq });
      }
    }
  }

  destroy() {
    super.destroy();
    this.container.removeEventListener('click', this._clickHandler);
  }

  config() {
    var retval = super.config();
    retval.zoom = true;
    retval.rotate = false;
    return retval;
  }

};