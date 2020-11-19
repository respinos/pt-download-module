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

var rootMargin = 128;
var isVisible = function(page) {
  var windowTop = container.parentNode.scrollTop;
  var windowHeight = container.parentNode.offsetHeight;

  var top = page.offsetTop;
  var height = page.offsetHeight;

  if ( page.dataset.seq == '17' ) {
    console.log("--", top + height + rootMargin, '>=', windowTop, "//", top - rootMargin, '<=', windowTop + windowHeight);
  }

  if (top + height + rootMargin >= windowTop &&
            top - rootMargin <= windowTop + windowHeight ) {
    return true;
  }

  return false;
}

var getPage = function(seq) {
  return document.querySelector(`.page[data-seq="${seq}"]`);
}

var loader = function(seq) {

  var _process = function(x, loadImage) {
    var page = pagesMap[x] ? pagesMap[x].page : null;
    if ( page && page.dataset.loaded == 'false' ) {
      var img = page.querySelector('img');
      previewLoader.add({ src: img.dataset.thumbnailSrc, page: page });
      if ( loadImage ) {
        imageLoader.add({ src: img.dataset.imageSrc, page: page })
      }
    }
  }

  seq = parseInt(seq, 10);
  _process(seq, true);
  for(var i = seq - 10; i <= seq + 10; i++) {
    if ( i == seq ) { continue; }
    var loadImage = Math.abs(i - seq) <= 5;
    _process(i, loadImage);
  }
  imageLoader.start();
  previewLoader.start();
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
        value.page.dataset.isLeaving = false;
        console.log("!!", value.page.dataset.seq, x);

        var img = value.page.querySelector('img');
        // img.src = img.dataset.thumbnailSrc;
        img.src = img.dataset.thumbnailSrc || img.dataset.placeholderSrc;

      } else {
        console.log("**", value.page.dataset.seq);
      }
    }
  }
}

var config = {
  root: container.parentNode,
  rootMargin: `${rootMargin}px`,
  threshold: 0
};

var initialized = false;

var observer = new IntersectionObserver(function(entries) {
  entries.forEach(entry => {
    var seq = entry.target.dataset.seq;
    var page = entry.target;
    if ( entry.isIntersecting ) {
      if ( entry.intersectionRatio > 0 ) {
        page.dataset.lastViewsStarted = entry.time;
        console.log("|>", entry.target.dataset.seq);
        visible.add(page.dataset.seq);
      }
    } else {
      visible.delete(page.dataset.seq);
      console.log("****", page.dataset.seq);
      if ( entry.intersectionRatio == 0.0 && page.dataset.lastViewsStarted >= ( 60000 * 2 ) ) {
        page.dataset.loaded = false;
        var img = page.querySelector('img');
        img.src = img.dataset.placeholderSrc;
      }
      console.log("<|", entry.target.dataset.seq);      
    }
  })
}, config);


// var observer = new IntersectionObserver(function(entries) {
//   entries.forEach(entry => {
//     var seq = entry.target.dataset.seq;
//     if ( entry.isIntersecting ) {
//       if ( entry.target.dataset.isLeaving == 'false' && entry.intersectionRatio > 0 ) {
//         // we are ENTERING
//         entry.target.dataset.isLeaving = true;
//         console.log("|>", entry.target.dataset.seq);
//         visible.add(seq);
//       } else if ( entry.target.dataset.isLeaving == 'true' || entry.intersectionRatio == 0 ) {
//         entry.target.dataset.isLeaving = false;
//         visible.delete(entry.target.dataset.seq);
//         console.log("<|", entry.target.dataset.seq);
//       }
//     }
//   })
// }, config);

var htid = container.dataset.htid;
var thumbnailImages = []; var thumbnailMap = {}; var imageMap = {};
for(var i = 0; i < pages.length; i++) {
  var page = pages[i];
  page.dataset.isLeaving = false;
  page.dataset.loaded = false;
  pagesMap[parseInt(page.dataset.seq, 10)] = { page: page, exited: -1, entered: -1 };

  var thumbnailSrc = `https://babel.hathitrust.org/cgi/imgsrv/thumbnail?id=${htid};seq=${page.dataset.seq}`;
  page.querySelector('img').dataset.thumbnailSrc = thumbnailSrc;
  thumbnailImages.push({ src: thumbnailSrc, page: page });

  var imageSrc = `https://babel.hathitrust.org/cgi/imgsrv/image?id=${htid};seq=${page.dataset.seq};height=${defaultHeight * devicePixelRatio}`;
  page.querySelector('img').dataset.imageSrc = imageSrc;
  page.querySelector('img').dataset.height = defaultHeight;

  observer.observe(page);
}

var unloadInterval = setInterval(unloadPages, 1000);
var loadInterval = setInterval(loadPages, 500);

var previewLoader = new PicLoader()
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
    var img = page.querySelector('img');
    img.setAttribute('src', image.src);
    img.setAttribute('height', img.dataset.height);
    var r = parseInt(img.dataset.height, 10) / img.naturalHeight;
    img.setAttribute('width', Math.ceil(img.naturalWidth * r));

    if ( img.naturalWidth > img.naturalHeight ) {
      // fold-out
      img.style.height = 'auto';
    }

    page.dataset.loaded = true;
    console.log("☞", page.dataset.seq, image.src);
    var span = page.querySelector('.image-xy');
    setTimeout(function() {
      span.innerText = `${img.clientWidth}x${img.clientHeight} / ${image.naturalWidth}x${image.naturalHeight}`;
    })
  });

// previewLoader.start();

container.addEventListener('click', function(e) {
  for (var target = e.target; target && target != this; target = target.parentNode) {
      if (target.matches('[data-action="rotate-counterclockwise"]')) {
        e.preventDefault();
        var page = target.closest('.page');
        var rotated = parseInt(page.dataset.rotated || 0);
        rotated -= 90;
        if ( rotated == -360 ) { rotated = 0; }
        page.dataset.rotated = rotated;
      }
  }
})