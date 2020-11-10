// where we play with tuning

var pages = container.querySelectorAll('.page');
var pagesMap = {};
var visible = new Set();
var unloaded_ = new Set();
var loaded_ = new Set();

function eqSet(as, bs) {
    return as.size === bs.size && all(isIn(bs), as);
}

function all(pred, as) {
    for (var a of as) if (!pred(a)) return false;
    return true;
}

function isIn(as) {
    return function (a) {
        return as.has(a);
    };
}

var isVisible = function(page) {
  var windowTop = container.scrollTop;
  var windowHeight = container.offsetHeight;

  var top = page.offsetTop;
  var height = page.offsetHeight;

  if (top + height >= windowTop &&
            top - 0 <= windowTop + windowHeight ) {
    return true;
  }

  return false;
}

var loader = function(seq) {
  seq = parseInt(seq, 10);
  var images = [];
  for(var i = seq - 5; i <= seq + 5; i++) {
    var page = pagesMap[i] ? pagesMap[i].page : null;
    if ( page && page.dataset.loaded == 'false' ) {
      var img = page.querySelector('img');
      imageLoader.add({ src: img.dataset.imageSrc, page: page })
    }
  }
  imageLoader.start();
}

var loadPages = function() {
  if ( eqSet(visible, loaded_) ) { return; }
  loaded_ = new Set(visible);

  var tmp = [...visible].sort((a,b) => { return a - b});

  for(var i = 0; i < tmp.length; i++) {
    var seq = tmp[i];
    var page = pagesMap[seq].page;
    if ( isVisible(page) ) {
      console.log("//", seq);
      loader(seq);
    } else {
      console.log("@@", seq);
      visible.delete(seq);
    }
  }
}

var threshold = 10 * 1000; // 10 seconds
var nearest = 5;
var unloadPages = function() {
  if ( eqSet(visible, unloaded_) ) { return; }
  unloaded_ = new Set(visible);

  var now = Date.now();
  var tmp = [...visible].sort((a,b) => { return a - b});
  var seq1 = parseInt(tmp[0], 10);
  var seq2 = parseInt(tmp[1], 10);

  for(const [seq, value] of Object.entries(pagesMap)) {
    if ( ! isVisible(value.page) && value.page.dataset.loaded == 'true' ) {
      if ( ! ( ( Math.abs(seq - seq1) <= nearest ) || ( Math.abs(seq - seq2) <= nearest ) ) ) {
        var x = now - value.exited;
        value.page.dataset.loaded = 'false';
        console.log("!!", value.page.dataset.seq, x);

        var img = value.page.querySelector('img');
        img.src = img.dataset.thumbnailSrc;

      } else {
        console.log("**", value.page.dataset.seq);
      }
    }
  }
}

var config = {
  root: container,
  rootMargin: '64px',
  threshold: 0
};

var initialized = false;

var observer = new IntersectionObserver(function(entries) {
  entries.forEach(entry => {
    var seq = entry.target.dataset.seq;
    if ( entry.isIntersecting ) {
      if ( entry.target.dataset.isLeaving == 'false' && entry.intersectionRatio > 0 ) {
        // we are ENTERING
        entry.target.dataset.isLeaving = true;
        console.log("|>", entry.target.dataset.seq);
        visible.add(seq);
      } else if ( entry.target.dataset.isLeaving == 'true' || entry.intersectionRatio == 0 ) {
        entry.target.dataset.isLeaving = false;
        visible.delete(entry.target.dataset.seq);
        console.log("<|", entry.target.dataset.seq);
      }
    }
  })
}, config);

var thumbnailImages = []; var thumbnailMap = {}; var imageMap = {};
for(var i = 0; i < pages.length; i++) {
  var page = pages[i];
  page.dataset.isLeaving = false;
  page.dataset.loaded = false;
  pagesMap[parseInt(page.dataset.seq, 10)] = { page: page, exited: -1, entered: -1 };

  var thumbnailSrc = `https://babel.hathitrust.org/cgi/imgsrv/thumbnail?id=coo.31924087659631;seq=${i}`;
  page.querySelector('img').dataset.thumbnailSrc = thumbnailSrc;
  thumbnailImages.push({ src: thumbnailSrc, page: page });

  var imageSrc = `https://babel.hathitrust.org/cgi/imgsrv/image?id=coo.31924087659631;seq=${i};size=100`;
  page.querySelector('img').dataset.imageSrc = imageSrc;

  observer.observe(page);
}

var unloadInterval = setInterval(unloadPages, 1000);
var loadInterval = setInterval(loadPages, 500);

var previewLoader = new PicLoader(thumbnailImages)
  .limit(3)
  .on(PicLoader.events.LOADED, function(image, datum) {
    if(!image) { return false; }
    var page = datum.page; // thumbnailMap[image.src];
    console.log("-- picloader", image.src, page);
    if ( page.dataset.loaded != 'true' ) {
      page.querySelector('img').setAttribute('src', image.src);
    }
  })

var imageLoader = new PicLoader()
  .limit(3)
  .on(PicLoader.events.LOADED, function(image, datum) {
    if(!image) { return false;}
    var page = datum.page; // imageMap[image.src];
    page.querySelector('img').setAttribute('src', image.src);
    page.dataset.loaded = true;
    console.log("☞", page.dataset.seq, image.src);
  });

previewLoader.start();