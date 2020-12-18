import NanoEvents from 'nanoevents';
import {Single} from './image';

import debounce from 'lodash/debounce';

export var PlainText = class extends Single {
  constructor(options={}) {
    super(options);
    this.mode = this.name = 'plaintext';
    this.displayLabel = 'plain text';
    this.trackResize = false;
  }

  render(cb) {

    var fragment = document.createDocumentFragment();

    var slice_index = 1;
    for(var seq = 1; seq <= this.service.manifest.totalSeq; seq++) {

      var page = document.createElement('div');
      page.setAttribute('tabindex', '-1');

      page.classList.add('page');
      page.dataset.seq = seq;

      var klass = seq % 2 == 0 ? 'verso' : 'recto';
      if ( seq % 2 == 0 ) {
        slice_index += 1;
      }

      page.classList.add(klass);

      slice_index = this._slicify(seq);

      page.dataset.slice = slice_index;
      page.dataset.loaded = false;

      page.innerHTML = `<div class="page--toolbar"><div class="tag"><span>#${seq}</span></div></div><div data-placeholder="☉" class="page-text">☉</div>`;
      this._renderr(page);

      fragment.appendChild(page);
      this.pages.push(page);
      this.pagesIndex[seq] = page;
    }

    this.container.appendChild(fragment);

    var pages = this.container.querySelectorAll('.page');

    for(var i = 0; i < pages.length; i++) {
      this.bindPageEvents(pages[i]);
    }

    if ( this._initialSeq ) {
      this.display(this._initialSeq);
    }

    if ( cb ) {
      setTimeout(cb, 1000);
      this._initialized = true;
    }
  }

  loadImage(page, options={}) {
    var self = this;

    var _process = function(seq, loadImage) {
      var page = self.pagesIndex[seq] ? self.pagesIndex[seq] : null;
      if ( page && page.dataset.loaded == 'false' ) {
        var html_url = self.service.html({ seq: seq });
        if ( html_url ) {
          self.service.loaders.images.queue({ src: html_url, page: page, mimetype: 'text/html' });
        }
      }
    }

    var pages = Array.isArray(page) ? page : [ page ];
    console.log("?? loadImage", pages);
    var page = pages[0];

    for(var i = 0; i < pages.length; i++) {
      // first queue the immediate pages
      for(var i = 0; i < pages.length; i++) {
        var page = pages[i];
        var seq = parseInt(page.dataset.seq, 10);
        _process(seq, true);
      }
    }

    // now queue surrounding pages
    if ( options.lazy !== false ) {
      var page = pages[0];
      var seq = parseInt(page.dataset.seq, 10);

      for(var ii = seq - 2; ii < seq; ii++) {
        _process(ii, true);
      }
    }

    if ( options.lazy !== false ) {
      var page = pages[pages.length - 1];
      var seq = parseInt(page.dataset.seq, 10);
      for(var ii = seq + 2; ii > seq; ii--) {
        _process(ii, true);
      }
    }
    self.service.loaders.images.start();

    console.log("// loading:", page.dataset.seq);
  }

  postText(text, datum) {
    super.postText(text, datum);
    var page_text = datum.page.querySelector('.page-text');
    if ( page_text.textContent.trim() == "" ) {
      page_text.innerHTML = `<div class="alert alert-block alert-info alert-headline"><p>NO TEXT ON PAGE</p></div><p>This page does not contain any text recoverable by the OCR engine.</p>`;
    }

    datum.page.dataset.loaded = true;
  }

  _drawHighlights(page) {
    // NOP
  }

  unloadImage(page) {

    page.dataset.loaded = 'false';
    page.dataset.isLeaving = false;


    var page_text = page.querySelector('.page-text');
    page_text.innerHTML = page_text.dataset.placeholder;
  }

  bindEvents() {

    this._handlers.resize = this.reader.on('resize', () => {
      // var loaded = this.container.querySelectorAll('[data-loaded="true"]');
      // for(var i = 0; i < loaded.length; i++) {
      //   var page = loaded[i];
      //   var page_text = page.querySelector('.page-text');
      //   if ( page_text.offsetHeight < page_text.scrollHeight ) {
      //     // page.style.height = `${page_text.scrollHeight}px`;
      //     page.style.height = 'auto';
      //   }
      // }
    })

    this.reader.on('relocated', (params) => {
      this.reader.emit('status', `Showing page scan ${params.seq}`);
    });

    window.addEventListener('resize', this._resizer);

  }

  bindPageEvents(page) {
    page.dataset.visible = false;
  }

  destroy() {
    super.destroy();
    this._handlers.resize();
    // window.removeEventListener('resize', this._resizer);
  }

  config() {
    var retval = super.config();
    retval.rotate = false;
    retval.zoom = false;
    return retval;
  }


};
