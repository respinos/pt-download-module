import NanoEvents from 'nanoevents';

export var Manifest = class {
  constructor(options={}) {
    this.options = Object.assign({}, options);
    this.totalSeq = parseInt(options.totalSeq, 10);
    this.defaultSeq = parseInt(options.defaultSeq, 10);
    this.firstSeq = parseInt(options.firstSeq, 10);
    this.defaultImage = {
      height: parseInt(options.defaultHeight, 10),
      width: parseInt(options.defaultWidth, 10),
      rotation: 0
    };
    this.featureList = options.featureList;
    this.featureMap = {};
    this._seq2num = {};
    this._num2seq = {};
    this._pageNum = { first: null, last: null };
    this.featureList.forEach(function(item) {
      this.featureMap[item.seq] = item;
      if ( item.pageNum && ! this._seq2num[item.seq] ) {
        this._seq2num[item.seq] = item.pageNum;
        this._num2seq[item.pageNum] = item.seq;
        if ( this._pageNum.first == null ) { this._pageNum.first = item.pageNum; }
        this._pageNum.last = item.pageNum;
      }
    }.bind(this))

    this.manifest = {};
  }

  update(seq, meta) {
    if ( meta.rotation != null && meta.width === undefined ) {
      // just updating rotation
      this.manifest[seq].rotation = meta.rotation;
      return;
    }
    // ... which will help with switching lanes and rotating
    if ( this.manifest[seq] && this.manifest[seq].width ) { return ; }
    var ratio = this.defaultImage.width / meta.width;
    this.manifest[seq] = {
      width: this.defaultImage.width,
      height: meta.height * ratio,
      rotation: meta.rotation || 0
    }
  }

  meta(seq) {
    if ( this.manifest[seq] ) {
      var meta = this.manifest[seq];
      if ( meta.rotation % 180 != 0 ) {
        return { height: meta.width, width: meta.height, rotation: meta.rotation };
      }
      return meta;
    }
    return this.defaultImage;
  }

  rotateBy(seq, delta) {
    var rotation;
    // this shouldn't happen
    if ( ! this.manifest[seq] ) { return; }
    rotation = this.manifest[seq].rotation;
    if ( rotation == 0 ) { rotation = 360; }
    rotation += delta;
    rotation = rotation % 360;
    this.manifest[seq].rotation = rotation;
  }

  checkFeatures(seq, feature) {
    var data = this.featureMap[seq];
    if ( data && data.features ) {
      if ( feature === undefined ) { return data.features.length > 1 };
      return ( data.features.indexOf(feature) > -1 );
    }
    return false;
  }

  pageNum(seq) {
    var value = this._seq2num[seq];
    if ( value ) { value = `p.${value}`; return value; }
    return null;
  }

  pageNumRange() {
    if ( this._pageNum.first == null ) { return null; }
    return `${this._pageNum.first}-${this._pageNum.last}`;
  }

  hasPageNum() {
    return ! ( this._pageNum.first == null );
  }

  seq(pageNum) {
    return this._num2seq[pageNum] || pageNum;
  }
}

export var Service = class {
  constructor(options={}) {
    this.manifest = new Manifest(options.manifest);
    this.identifier = options.identifier;
    this.q1 = options.q1;
    this.debug = options.debug;
    this.hasOcr = options.hasOcr;
    this.allowFullDownload = options.allowFullDownload;
    this.expiration = options.expiration;
    this.loaders = {};
    this.emitter = new NanoEvents();
    this.bindEvents();
  }

  thumbnail(options={}) {
    var width = 250; // one size fits all
    var meta = this.manifest.meta(options.seq);
    var rotation = meta.rotation || 0;
    var params = [];
    params.push(`id=${this.identifier}`);
    params.push(`seq=${options.seq}`);
    params.push(`width=${width}`);
    params.push(`rotation=${rotation}`);
    if ( this.debug ) {
      params.push(`debug=${this.debug}`);
    }
    return `/cgi/imgsrv/thumbnail?${params.join(';')}`;
  }

  image(options={}) {
    var action = 'image'; // options.mode == 'thumbnail' ? 'thumbnail' : 'image';
    var param = this.bestFit(options);
    var meta = this.manifest.meta(options.seq);
    var rotation = meta.rotation || 0;
    var params = [];
    params.push(`id=${this.identifier}`);
    params.push(`seq=${options.seq}`);
    params.push(`${param.param}=${param.value}`);
    params.push(`rotation=${rotation}`);
    if ( this.debug ) {
      params.push(`debug=${this.debug}`);
    }
    if ( options.expiration ) {
      params.push(`_=${options.expiration}`);
    }
    return `/cgi/imgsrv/${action}?${params.join(';')}`;
  }

  html(options={}) {
    if ( ! this.hasOcr ) { return null; }
    var url = `/cgi/imgsrv/html?id=${this.identifier};seq=${options.seq}`;
    if ( this.q1 ) {
      url += `;q1=${this.q1}`;
    }
    if ( this.debug ) {
      url += `;debug=${this.debug}`;
    }
    if ( options.expiration ) {
      url += `;_=${options.expiration}`;
    }
    return url;
  }

  on() {
    return this.emitter.on.apply(this.emitter, arguments)
  }

  bindEvents() {

  }

  bestFit(params) {
    // var possibles = [ 0.25, 0.5, 0.75, 1.0, 1.25, 1.5, 1.75, 2.0, 3.0, 4.0 ];
    var possibles = [ 0.25, 0.5, 0.75, 1.0, 1.25, 1.5, 1.75, 2.0, 2.25, 2.5, 2.75, 3.0, 3.25, 3.5, 3.75, 4.0 ];
    var max_possible = possibles[possibles.length - 1];

    var baseWidth = ( window.innerWidth >= 680 ) ? 680 : ( window.innerWidth * 0.95 );
    baseWidth = 680;

    var retval = {};
    // var scale = ( window.outerWidth >= 680 ) ? 1.0 : ( window.outerWidth * 0.95 / 680.0 );
    if ( params.width ) {
      retval.param = 'size';
      retval.value = possibles.find(function(possible) {
        var check = baseWidth * possible;
        return ( params.width <= check );
      })
      if ( retval.value === undefined ) {
        // out of bounds!
        retval.value = max_possible;
      }
      retval.value *= window.devicePixelRatio;
      retval.value = possibles.find(function(possible) {
        return ( retval.value <= possible );
      }) || max_possible;
    } else if ( params.height ) {
      // retval.param = 'height';
      // retval.value = params.height;
      retval.param = 'size';
      var meta = this.manifest.meta(params.seq);
      var r = meta.height / meta.width;
      retval.value = possibles.find(function(possible) {
        var check = ( baseWidth * possible ) * r;
        // console.log("AHOY imgsrv.bestFit.height", params.seq, possible, params.height, meta.height, r, check);
        return params.height <= check;
      });
      if ( retval.value === undefined ) {
        retval.value = 4.0;
      }
      retval.value *= window.devicePixelRatio;
      retval.value = possibles.find(function(possible) {
        return ( retval.value <= possible );
      }) || max_possible;
    }
    retval.value = Math.floor(retval.value * 100.0);
    if ( HT.force_size ) { retval.value = HT.force_size; }
    return retval;
  }



};

var Events = {
    LOADED:'loaded'
  , LOADING:'loading'
  , COMPLETE:'complete'
  , ERROR:'error'
  , PROMOTED:'promoted'
  , DEMOTED:'demoted'
  }

export var Loader = class {

  constructor(options={}) {
    this.reset(options.n_parallel);
    if ( options.urls && options.urls.length ) {
      this.add(options.urls);
    }
    this.name = options.name || '[loader]';
    this.emitter = new NanoEvents();
  }

  reset(n_parallel) {
    this.loaded = {};
    this._loaded = [];
    this._loading = [];
    this._events = {};
    this._parallel = n_parallel || 1;
    this._slots = this._parallel;
    this._queue = [];
    this._errors = [];
    this._complete = false;
    this._paused = true;
    this._previousOneWasAFunction = false;
    this._insertionPoint = 0;
  }

  limit(n) {
    if(arguments.length){
      var slots = this._parallel - n;
      this._parallel = n;
      this._slots+=slots;
      this.next();
      return this;
    }
    return this._parallel;
  }

  parallel(n) {
    return this.limit(n);
  }

  start(fn) {
    this._paused = false;
    this._complete = false;
    if(fn) { this.on(Events.COMPETE, fn); }
    this.next();
    return this;
  }

  stop() {
    this._paused = true;
    return this;
  }

  add() {
    var l = arguments.length - 1,i = -1, src,insertAt,index;
    for(l;l>i;--l){
      src = arguments[l];
      if(Object.prototype.toString.call(src) === '[object Array]'){
        this._previousOneWasAFunction = false;
        this.add.apply(this,src);
      }
      else if((typeof src === 'string') || src.hasOwnProperty('src')){
        insertAt = (this._insertionPoint == 'last') ? this._queue.length : this._insertionPoint;
        index = this.getIndex(src);
        if(index >= 0){
          this.changePosition(index,insertAt);
        }else{
          this._queue.splice(insertAt,0,src);
        }
        if(this._previousOneWasAFunction){this.once(src,this._previousOneWasAFunction);}
        this._previousOneWasAFunction = false;
        //if(this._complete === true && this._paused === true){
          //this.start();
        //}
      }
      else if(src.constructor && src.call && src.apply){
        this._previousOneWasAFunction = src;
      }
    }
    return this;
  }

  queue(){
    var args = new Array(arguments.length), l = args.length, i = 0;
    if(!l){return this;}
    for(i;i<l;i++){args[i] = arguments[i];}
    var insertAt = this._insertionPoint;
    this._insertionPoint = 'last';
    this.add.apply(this,args);
    this._insertionPoint = insertAt;
    return this;
  }

  getIndex(src){
    var q = this._queue, l = q.length, i = 0;
    if(typeof src !== 'string'){src = src.src}
    for(i;i<l;++i){
      if(q[i] === src || (q[i].src && q[i].src === src)){
        return i;
      }
    }
    return -1;
  }

  next(){

    if(this._paused === true){return this;}

    if(!this._queue.length){
      if(!this._complete){
        this._complete = true;
        this._paused = true;
        this.dispatch(Events.COMPLETE);
      }
      return;
    }

    while(this._loading.length < this._parallel && this._queue.length){
      var _queued = this._queue.shift();
      if ( ( typeof _queued === 'object') && _queued.mimetype && _queued.mimetype.startsWith('text/') ) {
        this._loadText(_queued);

      } else {
        this._load(_queued);
      }
    }
    
    return this;
  }

  _loadText(src) {
    var self = this;
    var request_src = (typeof src === 'string') ? src : src.src;

    var is_restricted = false;
    var err = null;
    fetch(request_src, { credentials: 'include' })
      .then(response => {
        if ( ! response.ok ) {
          err = response.text();
        }
        if ( response.headers.get('x-hathitrust-access') == 'deny' ) {
          is_restricted = true;
        }
        if ( response.headers.get('x-hathitrust-renew') ) {
          if ( HT && HT.renew_auth ) {
            HT.renew_auth(response.headers.get('x-hathitrust-renew'));
          }
        }

        var chokeAllowed = response.headers.get('x-choke-allowed');
        var chokeDebt = response.headers.get('x-choke-debt');
        console.log(":::", self.name, src.page.dataset.seq, request_src, chokeAllowed, chokeDebt);

        return response.text();
      })
      .then(text => {
        if ( is_restricted == 'true' && text ) {
          text = text.replace('RESTRICTED', 'ACCESS EXPIRED');
        } else {
          // nothing
        }

        setTimeout(() => {
          self._slots++;
          if(self._slots>self._parallel){
            self._slots = self._parallel;
          }
          var loading = self._loading, l = loading.length, i = 0;
          for(i;i<l;++i){
            if(loading[i] == src){loading.splice(i,1);}
          }
          if(err){
            self._errors.push(src);
            self.dispatch(Events.ERROR,[src]);
            self.dispatch(src,[null,src]);
          }else{
            self._loaded.push(src);
            self.loaded[src] = text;
            self.dispatch(Events.LOADED,[text,src]);
            self.dispatch(src,[text,src]);
          }
          self.next();
        }, 0);

      })

    // image.src = (typeof src === 'string') ? src : src.src;
    return this;    
  }

  _load(src){

    var makeDone = function(self,src){
      return function done(image,err){
        image.onerror = image.onabort = image.onload = null;
        self._slots++;
        if(self._slots>self._parallel){
          self._slots = self._parallel;
        }
        var loading = self._loading, l = loading.length, i = 0;
        for(i;i<l;++i){
          if(loading[i] == src){loading.splice(i,1);}
        }
        if(err){
          self._errors.push(src);
          self.dispatch(Events.ERROR,[src]);
          self.dispatch(src,[null,src]);
        }else{
          self._loaded.push(src);
          self.loaded[src] = image;
          self.dispatch(Events.LOADED,[image,src]);
          self.dispatch(src,[image,src]);
        }
        self.next();
      };
    }

    var image = new Image()
    , self = this
    , done = makeDone(this,src)
    ;
    this._loading.push(src);
    this.dispatch(Events.LOADING,[src]);
    image.onerror = image.onabort = function(){done(this,true);}
    image.onload = function(){done(this);}

    var image_src = (typeof src === 'string') ? src : src.src;

    fetch(image_src, { credentials: 'include', referrer: `https://babel.hathitrust.org/cgi/pt?id=${HT.params.id}` })
      .then(response => {
        if ( response.headers.get('x-hathitrust-access') == 'deny' ) {
          image.dataset.restricted = true;
        }
        if ( response.headers.get('x-hathitrust-renew') ) {
          if ( HT && HT.renew_auth ) {
            HT.renew_auth(response.headers.get('x-hathitrust-renew'));
          }
        }

        var chokeAllowed = response.headers.get('x-choke-allowed');
        var chokeDebt = response.headers.get('x-choke-debt');
        console.log(":::", self.name, src.page.dataset.seq, image_src, chokeAllowed, chokeDebt);

        return response.blob();
      })
      .then(blob => {
        if ( image.dataset.restricted == 'true' && blob.text ) {
          blob.text().then((text) => {
            text = text.replace('RESTRICTED', 'ACCESS EXPIRED');
            blob = new Blob([text], { type: 'image/svg+xml'});
            var objectUrl = URL.createObjectURL(blob);
            image.src = objectUrl;
            image.dataset.usedBlob = true;
          })
        } else {
          var objectUrl = URL.createObjectURL(blob);
          image.src = objectUrl;
          // image.src = image_src;
        }
      })

    // image.src = (typeof src === 'string') ? src : src.src;
    return this;
  }

  promote(src){
    var index = this.getIndex(src);
    if(index<=0){return this;}
    return this.changePosition(index,0);
  }

  changePosition(index,insertAt){
    if(index == insertAt){return this;}
    var item = this._queue.splice(index,1)[0];
    this._queue.splice(insertAt,0,item);
    if(index > insertAt){
      this.dispatch(Events.PROMOTED,[item,index,insertAt]);
    }else{
      this.dispatch(Events.DEMOTED,[item,index,insertAt]);
    }
    return this;
  }

  on(evt,fn){
    (this._events[evt] = this._events[evt] || []).push(fn);
    return this;
  }

  addEventListener(evt, fn) {
    return this.on(evt, fn);
  }

  off(evt, fn) {
    if(this._events[evt]){
      if(fn){
        var evts = this._events[evt], l = evts.length, i = 0;
        for(i;i<l;++i){
          if(evts[i] == fn){
            evts.splice(i,1);
            break;
          }
        }
      }else{this._events[evt] = [];}
      return this;
    }
  }

  removeEventListener(evt, fn) {
    return this.off(evt, fn);
  }

  once(evt,fn){
    var self = this;
    var wrapper = function(){
      //https://github.com/petkaantonov/bluebird/wiki/Optimization-killers#3-managing-arguments
      var args = new Array(arguments.length), l = args.length, i = 0;
      for(i;i<l;++i){args[i] = arguments[i];}
      self.off(evt,wrapper);
      return fn.apply(this,args);
    }
    self.on(evt,wrapper);
    return this;
  }

  dispatch(evt,args){
    var l = this._events[evt] && this._events[evt].length, i = 0;
    if(l){
      for(i;i<l;++i){
        try{
          this._events[evt][i].apply(this,args);
        }catch(e){
          console.log(e, this._events[evt])
        }
      }
    }
    return this;
  }

}

Loader.events = Events;