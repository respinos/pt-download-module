import NanoEvents from 'nanoevents';
import {Base} from './base';

export var Single = class extends Base {
  constructor(options={}) {
    super(options);
    this.mode = 'image';
    this.name = 'image';
    this.displayLabel = 'page by page';
    this.embedHtml = true;
    this.isAnimating = false;
  }

  display(seq) {
    var self = this;

    if ( self.isAnimating ) { return ; }

    seq = parseInt(seq, 10);
    if ( seq == this.currentSeq ) { return ; }

    var current = this.container.querySelector(`.page[data-visible="true"]`);

    var target = this.container.querySelector(`.page[data-seq="${seq}"]`);
    if ( ! target ) { return; }

    this.loadImage(target);

    // really?
    var delta = this.currentSeq < seq;
    target.dataset.visible = true;
    this.currentSeq = seq;

    if ( ! current ) {
      return;
    }

    var inClass = delta > 0 ? 'page--moveFromRight' : 'page--moveFromLeft';
    var outClass = delta > 0 ? 'page--moveToLeft' : 'page--moveToRight';
    outClass = 'page--fade';

    var endCurrentPage = false;
    var endTargetPage = false;

    var onEndAnimation = function(current, target) {
      console.log("-- onEndAnimation", current, target);
      endTargetPage = false;
      endCurrentPage = false;
      current.dataset.visible = false;
      current.classList.remove(outClass);
      target.classList.remove(inClass);
      self.container.classList.remove('animating');
      self.isAnimating = false;
      self.currentSeq = parseInt(target.dataset.seq);

      self.reader.emit('relocated', { seq: seq });
    }

    var outAnimationHandler = function(event) {
      current.removeEventListener('animationend', outAnimationHandler);
      endCurrentPage = true;
      console.log("-- outAnimationHandler", endCurrentPage, endTargetPage);
      if ( endTargetPage ) { onEndAnimation(current, target); }      
    }
    var inAnimationHandler = function(event) {
      target.removeEventListener('animationend', inAnimationHandler);
      endTargetPage = true;
      console.log("-- inAnimationHandler", endCurrentPage, endTargetPage);
      if ( endCurrentPage ) { onEndAnimation(current, target); }      
    }

    this.container.classList.add('animating');
    current.addEventListener('animationend', outAnimationHandler);
    target.addEventListener('animationend', inAnimationHandler);

    // current.addEventListener('animationend', (event) => { console.log('-- current animationend') });
    // target.addEventListener('animationend', (event) => { console.log('-- target animationend') });


    current.classList.add(outClass);
    target.classList.add(inClass);

    this.visible(target);
  }


  currentLocation() {
    return this.currentSeq;
  }

  next() {
    this.container.scrollTop = 0;
    this.display(this.currentSeq + 1);
  }

  prev() {
    this.container.scrollTop = 0;
    this.display(this.currentSeq - 1);
  }

  bindEvents() {
    var self = this;

    super.bindEvents();

    this._clickHandler = this.clickHandler.bind(this);
    this.container.addEventListener('click', this._clickHandler);

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
