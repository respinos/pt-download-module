// var page = document.querySelector(`.page[data-seq="25"]`);
// page.dataset.visible = "true";

var pages = container.querySelectorAll('.page');
var seq = 25;
var lastSeq;

var _show = function(seq) {
  document.querySelector(`.page[data-seq="${seq}"]`).dataset.visible = "show";
}

var _pending = function(seq) {
  document.querySelector(`.page[data-seq="${seq}"]`).dataset.visible = 'pending'; 
}

var _finalize = function(event) {
  event.target.removeEventListener('animationend', _finalize);
  container.dataset.animating = false;
  console.log("-- ", seq, "->", lastSeq);
  // document.querySelectorAll(`.page[data-visible="true"]`).forEach(function(page) {
  //   console.log("<", page);
  //   page.dataset.visible = false;
  // })
  // document.querySelectorAll(`.page[data-visible="pending"]`).forEach(function(page) {
  //   console.log(">", page);
  //   page.dataset.visible = true;
  // })
}

var go_next = function() {
  // _pending(seq + 1);

  // document.querySelector(`.page[data-seq="${seq}"]`).addEventListener('animationend', _finalize);

  container.dataset.animating = true;
  container.dataset.transition = 'next';

  var target = document.querySelector(`.page[data-seq="${seq + 1}"]`);
  document.querySelectorAll('.page').forEach(function(page) {
    if ( page.dataset.visible == "show" ) {
      page.dataset.visible = "hide";
    } else {
      page.dataset.visible = "";
    }
  })
  target.dataset.visible = "show";

  lastSeq = seq;
  seq += 1;
}

var go_prev = function() {
  _pending(seq - 1);

  // document.querySelector(`.page[data-seq="${seq}"]`).addEventListener('animationend', _finalize);

  container.dataset.animating = true;
  container.dataset.transition = 'previous';
  var target = document.querySelector(`.page[data-seq="${seq - 1}"]`);
  pages.forEach(function(page) {
    if ( page.dataset.visible == "show" ) {
      page.dataset.visible = "hide";
    } else {
      page.dataset.visible = "";
    }
  })
  target.dataset.visible = "show";

  lastSeq = seq;
  seq -= 1;
}

var thumbnailImages = []; var thumbnailMap = {}; var imageMap = {};
for(var i = 0; i < pages.length; i++) {
  var page = pages[i];

  var seq_ = page.dataset.seq;
  var thumbnailSrc = `https://babel.hathitrust.org/cgi/imgsrv/thumbnail?id=coo.31924087659631;seq=${seq_}`;
  page.querySelector('img').dataset.thumbnailSrc = thumbnailSrc;
  thumbnailImages.push({ src: thumbnailSrc, page: page });

  var imageSrc = `https://babel.hathitrust.org/cgi/imgsrv/image?id=coo.31924087659631;seq=${seq_};size=100`;
  page.querySelector('img').dataset.imageSrc = imageSrc;
}

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

// previewLoader.start();

_show(seq);

