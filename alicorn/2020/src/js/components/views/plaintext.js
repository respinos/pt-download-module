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
    // var minWidth = this.minWidth();
    // var scale = this.scale;

    var fragment = document.createDocumentFragment();
    for(var seq = 1; seq <= this.service.manifest.totalSeq; seq++) {

      var page = document.createElement('div');
      page.setAttribute('tabindex', '-1');

      // page.style.height = `${h}px`;
      // page.style.width = `${w}px`;
      page.dataset.bestFit = true; page.classList.add('page--best-fit');

      page.classList.add('page');
      page.dataset.seq = seq;
      page.innerHTML = `<div class="page-text"></div><div class="info">${seq}</div>`;
      fragment.appendChild(page);
    }

    this.container.appendChild(fragment);
    var pages = this.container.querySelectorAll('.page');
    for(var i = 0; i < pages.length; i++) {
      this.bindPageEvents(pages[i]);
    }

    this.is_active = true;
    this.loadImage(this.container.querySelector('[data-seq="1"]'), {check_scroll: true});
    if ( cb ) {
      cb();
    }
  }

  loadImage(page, options={}) {
    var self = this;

    if ( ! this.is_active ) { return ; }
    options = Object.assign({ check_scroll: false, preload: true }, options);
    var seq = page.dataset.seq;
    var rect = page.getBoundingClientRect();

    var html_url = this.service.html({ seq: seq });

    if ( page.querySelectorAll('.page-text > *').length ) {
      return;
    }

    if ( page.dataset.loading == "true" ) {
      return;
    }

    if ( ! this._highlightIndexMap ) {
      this._highlightIndexMap = {};
      this._highlightIndex = 0;
    }

    var html_request;
    html_request = fetch(html_url, { credentials: 'include' });

    page.dataset.loading = true; page.classList.add('page--loading');
    html_request
      .then(function(response) {
        return response.text();
      })
      .then(function(text) {
        var page_text = page.querySelector('.page-text');
        page_text.innerHTML = text;

        if ( page_text.textContent.trim() == "" ) {
          page_text.innerHTML = `<div class="alert alert-block alert-info alert-headline"><p>NO TEXT ON PAGE</p></div><p>This page does not contain any text recoverable by the OCR engine.</p>`;
        }

        page.dataset.loaded = true; page.classList.add('page--loaded');

        page.style.height = 'auto';

        // console.log("AHOY PAGES", seq, page_text.offsetHeight, page.offsetHeight, page_text.offsetHeight / page.offsetHeight);
        // if ( page_text.offsetHeight / page.offsetHeight < 0.50 ) {
        //   page_text.style.paddingTop = '3rem';
        // }

        // if ( page_text.offsetHeight < page_text.scrollHeight ) {
        //   page.style.height = `${page_text.scrollHeight}px`;
        // }

        var page_div = page_text.children[0];
        var words = page_div.dataset.words;
        if ( words !== undefined ) {
          words = JSON.parse(words);

          function textNodesUnder(el){
            var n, a=[], walk=document.createTreeWalker(el,NodeFilter.SHOW_TEXT,null,false);
            while(n=walk.nextNode()) a.push(n);
            return a;
          }

          var textNodes = textNodesUnder(page_div);
          var spanClass = 'solr_highlight_1';
          var highlight_idx = 0;

          textNodes.forEach(function(text) {
            var innerHTML = text.nodeValue.trim();
            if ( ! innerHTML ) { return; }
            words.forEach(function(word) {
              var pattern = new RegExp(`\\b(${word})\\b`, 'gi');

              var matchedWord = word.toLowerCase();
              var highlight_idx = self._highlightIndexMap[matchedWord];
              if ( ! highlight_idx ) {
                self._highlightIndex += 1;
                if ( self._highlightIndex > 6 ) { self._highlightIndex = 1; }
                self._highlightIndexMap[matchedWord] = self._highlightIndex;
                highlight_idx = self._highlightIndexMap[matchedWord];
              }
              spanClass = `solr_highlight_${highlight_idx}`;

              var replaceWith = '<span' + ( spanClass ? ' class="' + spanClass + '"' : '' ) + '>$1</span>';
              innerHTML = innerHTML.replace(pattern, replaceWith);
            })
            if ( innerHTML == text.nodeValue.trim() ) { return; }
            text.parentNode.innerHTML = innerHTML;
          })
        }
      });

    if ( ! page.dataset.preloaded && options.preload ) {
      this.preloadImages(page);
    }
  }

  unloadImage(page) {
    if ( page.dataset.preloaded == "true" ) { return; }
    if ( page.dataset.loading == "true" ) { return ; }
    var page_text = page.querySelector('.page-text');
    page_text.innerHTML = '';
    page.dataset.preloaded = false;
    page.dataset.loaded = false; page.classList.remove('page--loaded');
  }

  bindEvents() {

    this._handlers.resize = this.reader.on('resize', () => {
      var loaded = this.container.querySelectorAll('[data-loaded="true"]');
      for(var i = 0; i < loaded.length; i++) {
        var page = loaded[i];
        var page_text = page.querySelector('.page-text');
        if ( page_text.offsetHeight < page_text.scrollHeight ) {
          // page.style.height = `${page_text.scrollHeight}px`;
          page.style.height = 'auto';
        }
      }
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
