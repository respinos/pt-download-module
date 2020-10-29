import NanoEvents from 'nanoevents';

var escapeRE;
var escapeText = function(text) {
  if (!escapeRE) {
    var specials = [
      '/', '.', '*', '+', '?', '|',
      '(', ')', '[', ']', '{', '}', '\\'
    ];
    escapeRE = new RegExp(
      '(\\' + specials.join('|\\') + ')', 'g'
    );
  }
  return text.replace(escapeRE, '\\$1');
}

export var Highlighter = class {
  constructor(options={}) {
    // this.options = Object.assign({}, options);
    this.reader = options.reader;
    this.emitter = new NanoEvents();
    this.highlighted = {};
    this.bindEvents();
  }

  on() {
    return this.emitter.on.apply(this.emitter, arguments)
  }

  highlights() {
    var highlights = sessionStorage.getItem('highlight') || '[]';
    if ( highlights ) { highlights = JSON.parse(highlights); }
    else { highlights = []; }
    return highlights;
  }

  bindEvents() {
    var self = this;

    var highlighted = {};

    var highlights = this.highlights();

    this.reader.on('updateHighlights', () => {
      self.reader.view.annotations.reset();
      self.highlighted = {};
      for(var contents of self.reader.view.rendition.manager.getContents()) {
        self.annotate(contents);
      }
    })

    this.reader.on('initialized', () => {
      self.reader.view.on('renditionStarted', function(rendition) {
        self.highlighted = {};
        rendition.hooks.content.register(function cozyHighlightContents(contents) {
          self.annotate(contents);
        })
      })
    })

  }

  annotate(contents) {
    var self = this;

    var annotations = this.reader.view.annotations;

    var highlights = this.highlights();
    if ( highlights.length == 0 ) { return ; }

    var section = contents.cfiBase;
    if ( this.highlighted[section] ) { return ; }
    this.highlighted[section] = true;

    if ( true && contents && highlights.length > 0) {
      highlights.forEach(function(word) {
        var re = new RegExp('\\b' + escapeText(word) + '\\b', 'i');
        var s = contents.window.getSelection();
        var e = contents.document.getElementsByTagName('body').item(0);
        var hrefs = self._highlight(contents, s, e, word, re);
        if ( hrefs.length ) {
          hrefs.forEach(function(href) {
            // console.log("AHOY HIGHLIGHTING", href, word);
            annotations.highlight(href, {}, null, 'epubjs-search-hl');
          })
        }
      })
    }
  }

  _highlight(c, s, element, text, re) {
    var hrefs = [];
    var elements = Array.from(element.children); // element.querySelectorAll("p");
    var start, end, range, pos;

    while ( elements.length ) {
      var element = elements.shift();
      if ( element.innerText.search(re) > -1 ) {
        for(var ii = 0; ii < element.childNodes.length; ii++) {
          var check = element.childNodes[ii];
          if ( check.nodeType == 1 && check.innerText.search(re) > -1 ) {
            // push onto the stack
            elements.push(check);
          } else if ( check.nodeType == 3 && check.textContent.search(re) > -1 ) {
            range = element.ownerDocument.createRange();
            start = check.textContent.search(re);
            end = start + text.length;
            // console.log("AHOY AHOY NEW HIGHLIGHT", check.textContent, start, end);
            range.setStart(check, start);
            range.setEnd(check, end);
            var cfi = c.cfiFromRange(range);
            hrefs.push(cfi);
          }
        }
      }
    }

    return hrefs;
  }

  _highlightXX(c, s, element, text, re){
    var hrefs = [];
    var elements = element.children; // element.querySelectorAll("p");
    var start, end, range, pos;

    // var re = new RegExp('\\b' + escapeText(text) + '\\b', 'i');

    function dig(el){
      // $(el).contents().each(function(i,e){
      var contents = el.childNodes;
      for(var i = 0; i < contents.length; i++) {
        var e = contents[i];
        if (e.nodeType==1){
            // not a textnode
         dig(e);   
        }else{
          if (pos<=start){
           if (pos+e.length>=start){
            range.setStart(e, start-pos);
           }
          }
          
          if (pos<=end){
           if (pos+e.length>=end){
            range.setEnd(e, end-pos);
           }
          }            
          
          pos = pos+e.length;
        }
      }  
    }

    for(var i = 0; i < elements.length; i++) {
      var e = elements[i];
      // start = e.innerText.toLowerCase().indexOf(text.toLowerCase());
      start = e.innerText.search(re);
      if ( start > -1 ) {
        range = element.ownerDocument.createRange();
        end = start + text.length;
        pos = 0;
        dig(e, start, end);
        // console.log("AHOY", e, start, end, text, text.length, range);
        var cfi = c.cfiFromRange(range);
        hrefs.push(cfi);
        // console.log(cfi);
      } else {
        // console.log("AHOY NO", e, text);
      }
    }
    return hrefs;
    // s.addRange(range);
  }

}