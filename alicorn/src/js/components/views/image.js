import NanoEvents from 'nanoevents';
import {Base} from './base';

export var Single = class extends Base {
  constructor(options={}) {
    super(options);
    this.mode = 'image';
    this.name = 'image';
    this.displayLabel = 'page by page';
    this.embedHtml = true;
  }

  display(seq) {
    seq = parseInt(seq, 10);
    if ( seq == this.currentSeq ) { return ; }
    var current = this.container.querySelector(`.page[data-visible="true"]`);
    var target = this.container.querySelector(`.page[data-seq="${seq}"]`);
    if ( ! target ) { return; }

    if ( current ) {
      setTimeout(function() {
        current.dataset.visible = false; current.classList.remove('page--visible');
        this.unloadImage(current);
      }.bind(this))
    }

    var viewed = target.querySelector('img');
    if ( ! viewed ) {
      this.loadImage(target, { check_scroll: true });
    } else {
      this.resizePage(target);
    }

    this.reader.emit('relocated', { seq: target.dataset.seq });
    if ( this._currentPage ) {
      console.log(`AHOY display currentPage = ${this._currentPage.dataset.seq}`);
      this.unfocus(this._currentPage);
    }
    this._currentPage = target;
    this.focus(this._currentPage);
    this.currentSeq = seq;
    target.dataset.visible = true; target.classList.add('page--visible');
    console.log(`AHOY display currentPage NOW = ${this._currentPage.dataset.seq}`);
  }

  currentLocation() {
    return this.currentSeq;
  }

  next() {
    this.container.scrollTop = 0;
    this.display(this.currentSeq + 1);
    // var current = this.container.querySelector(`.page[data-seq="${this.currentSeq}"]`);
    // var next = current.nextSiblingElement;
    // if ( next ) {
    //   this.display(next);
    // }
  }

  prev() {
    this.container.scrollTop = 0;
    this.display(this.currentSeq - 1);
  }

  _postResizePage(bounds, rect) {
    if ( rect.bottom <= bounds.bottom && rect.top < 0 ) {
      setTimeout(function() {
        delta = updated_rect.height - rect.height;
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

  bindEvents() {
    var self = this;

    super.bindEvents();

    this._handlers.rotate = this.reader.on('rotate', function(delta) {
      var seq = self.currentLocation();
      self.service.manifest.rotateBy(seq, delta);
      self.redrawPage(seq);
    });
  }

  bindPageEvents(page) {
    page.dataset.visible = false; page.classList.remove('page--visible');
  }

  // focus(page, invoke=false) {
  //   page = super.focus(page, invoke);
  //   page.style.zIndex = 1;
  // }

  destroy() {
    super.destroy();
    if ( this._handlers.rotate ){
      this._handlers.rotate();
    }
    var pages = this.container.querySelectorAll('.page');
    for(var i = 0; i < pages.length; i++) {
      this.container.removeChild(pages[i]);
    }
  }

};
