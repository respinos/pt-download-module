import NanoEvents from 'nanoevents';
import {Base} from './base';

import debounce from 'lodash/debounce';

export var Scroll = class extends Base {
  constructor(options={}) {
    super(options);
    this.mode = 'scroll';
    this.name = '1up';
    this.displayLabel = 'scroll page scans';
    this.pageOptions = {};
    this.embedHtml = true;
    this._debugLog = [];
  }

  _renderr(page) {
    var button = document.createElement('button');
    button.classList.add('button', 'btn-sm', 'action-load-page');
    button.dataset.seq = page.dataset.seq;
    button.innerText = 'Load page';
    button.setAttribute('tabindex', '-1');
    page.appendChild(button);
  }

  display(seq) {
    seq = parseInt(seq, 10);
    var target = this.container.querySelector(`.page[data-seq="${seq}"]`);
    if ( ! target ) { return; }
    target.dataset.visible = true; target.classList.add('page--visible');
    target.parentNode.scrollTop = target.offsetTop - target.parentNode.offsetTop;
    this.currentSeq = seq;
    this._currentPage = target;
    this.reader.emit('relocated', { seq: target.dataset.seq });
  }

  handleObserver(entries, observer) {
    entries.forEach(entry => {
      var div = entry.target;
      var seq = div.dataset.seq;
      var viewed = div.querySelector('img');
      if ( entry.isIntersecting && entry.intersectionRatio > 0.0  ) {
        // console.log("AHOY OBSERVING", entries.length, seq, 'onEnter', entry.intersectionRatio);
        if ( ! viewed ) {
          // console.log("AHOY OBSERVING", entries.length, seq, 'onEnter');
          this.loadImage(div, { check_scroll: true, callback: function(img) { div.dataset.visible = true; div.classList.add('page--visible'); } });
        } else if (  div.dataset.preloaded ) {
          div.dataset.preloaded = false;
          this.resizePage(div);
        }
        this.focus(div);
        if ( div.dataset.visible != 'true' ) {
          div.dataset.visible = true;
          div.classList.add('page--visible');
        }
      } else if ( viewed && ! div.dataset.preloaded ) {
        console.log("AHOY OBSERVING", entries.length, seq, 'onExit');
        this.unloadImage(div);
        div.dataset.visible = false; div.classList.remove('page--visible');
        this.unfocus(div);
      }
    })

    this.emitter.emit('scrolled');

    // if ( current.page ) {
    //   this.reader.emit('relocated', { seq: current.page.dataset.seq });
    // }
  };

  currentLocation() {
    var page = this.currentPage();
    return page ? page.dataset.seq : null;
  }

  currentPage() {
    var current_percentage = 0;
    var current;
    var bounds = this.container.getBoundingClientRect();
    var scrollTop = this.container.scrollTop;
    var visible = this.container.querySelectorAll('.page[data-loaded="true"],.page[data-loading="true"]');
    for(var i = 0; i < visible.length; i++) {
      var page = visible[i];
      var page_bounds = page.getBoundingClientRect();
      if ( page.offsetTop > ( scrollTop + bounds.height ) ) { continue; }
      if ( current_percentage < 1.0 && page.offsetTop >= scrollTop && (page.offsetTop + page_bounds.height) <= scrollTop + bounds.height ) {
        current_percentage = 1.0;
        current = page;
        continue;
      }

      var y1 = Math.abs(scrollTop - page.offsetTop);
      var y2 = Math.abs( ( scrollTop + bounds.height ) - ( page.offsetTop + page_bounds.height ) );
      var h = page_bounds.height - y1 - y2;
      var percentage = h / bounds.height;
      if ( percentage < 0 ) { continue; }
      if ( percentage > current_percentage ) {
        current_percentage = percentage;
        current = page;
      }
      // console.log("AHOY currentLocation", page.dataset.seq, percentage);
    }
    return current ? current : null;
  }

  next() {
    // var scrollTop = this.container.scrollTop;
    // this.container.scrollTop += this.container.offsetHeight;
    this.display(this.currentSeq + 1);
  }

  prev() {
    // if ( this.container.scrollTop == 0 ) { return ; }
    // this.container.scrollTop -= this.container.offsetHeight;
    this.display(this.currentSeq - 1);
  }

  _postResizePage(page, bounds, rect) {
    if ( rect.bottom <= bounds.bottom && rect.top < 0 ) {
      var scrollTop = this.container.scrollTop;
      setTimeout(function() {
        var updated_rect = page.getBoundingClientRect();
        var delta = updated_rect.height - rect.height;
        if ( this.container.scrollTop == scrollTop ) {
          // delta /= this.settings.scale;
          // console.log("AHOY afterResized", view.index, this.container.scrollTop, view.element.getBoundingClientRect().height, rect.height, delta / this.settings.scale);
          this.container.scrollTop += Math.ceil(delta);
          console.log("AHOY afterResized", page.dataset.seq, scrollTop, this.container.scrollTop, delta);
        } else {
          console.log("AHOY donotResized", page.dataset.seq, scrollTop, this.container.scrollTop, delta);
        }
      }.bind(this), 500);
    }
  }

  updatePageRotation(target, rotate) {
    // var margin = ( rotate % 180 == 0 ) ? 0 : ( target.offsetHeight - target.offsetWidth ) / 2;
    // target.dataset.rotate = rotate;
    // target.style.setProperty('--rotate', `${rotate}deg`);
    // target.style.setProperty('--rotate-margin', `-${margin}px ${margin}px`);
    this.reader.pagedetails.rotate[target.dataset.seq] = rotate;
  }

  bindEvents() {
    var self = this;
    super.bindEvents();

    var threshold = [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1];
    if ( document.querySelector('html').classList.contains('gt-ie9') ) {
      threshold = [ 0, 0.25, 0.5, 0.75, 1 ];
    }
    this.observer = new IntersectionObserver(this.handleObserver.bind(this), {
        root: this.container,
        rootMargin: '0px',
        threshold: threshold
    });
    // this.observer.USE_MUTATION_OBSERVER = false;

    this._handlers.rotate = this.reader.on('rotate', function(delta) {
      var seq = self.currentLocation();
      self.service.manifest.rotateBy(seq, delta);
      self.redrawPage(seq);
    });

    this._handlers.scrolled = this.on('scrolled', debounce(function() {
      if ( this._scrollPause ) { return ; }
      var page = this.currentPage();
      if ( page != null && this.currentSeq != page.dataset.seq ) {
        var seq = page.dataset.seq;
        this.reader.emit('relocated', { seq: seq });
        this.currentSeq = parseInt(seq, 10);
        if ( this._currentPage ) {
          this.unfocus(this._currentPage);
        }
        this.focus(page);
        this._currentPage = page;
      }
    }.bind(this), 50));

    this._handlers.click = this.clickHandler.bind(this);
    this.container.addEventListener('click', this._handlers.click);

    this.on('loaded', (page) => {
      page.querySelector('.action-load-page').setAttribute('tabindex', '-1');
    })
  }

  bindPageEvents(page) {
    this.observer.observe(page);
  }

  clickHandler(event) {
    var element = event.target;
    if ( element.tagName.toLowerCase() == 'button' && element.classList.contains('action-load-page') ) {
      event.preventDefault();
      event.stopPropagation();
      this.loadImage(element.parentNode, { preload: false });
    }
  }

  focusHandler(event) {
    super.focusHandler(event);
    var target = event.target;
    if ( target.tagName.toLowerCase() == 'div' && target.classList.contains('page') && ! window.reactivated ) {
      target.parentNode.scrollTop = target.offsetTop - target.parentNode.offsetTop;
    }
  }

  destroy() {
    super.destroy();
    this._handlers.rotate();
    this.container.removeEventListener('click', this._handlers.click);
    var pages = this.container.querySelectorAll('.page');
    this.observer.disconnect();
    for(var i = 0; i < pages.length; i++) {
      this.observer.unobserve(pages[i]);
      this.container.removeChild(pages[i]);
    }
    this.observer = null;
  }

};
