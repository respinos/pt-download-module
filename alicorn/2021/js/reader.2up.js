// var page = document.querySelector(`.page[data-seq="50"]`);
// var page = document.querySelector(`.page[data-seq="50"]`);
// page.dataset.visible = "true";

var _slicify = function(seq) {
  return ( Math.ceil(seq / 2) || 0 ) + 1;
}

var _hide = function(seq) {
  document.querySelectorAll(`.page[data-slice="${_slicify(seq)}"]`).forEach(function(page) {
    page.dataset.visible = false;
  });  
}

var _pending = function(seq) {
  var nodes = document.querySelectorAll(`.page[data-slice="${_slicify(seq)}"]`);
  nodes.forEach(function(page) {
    page.dataset.visible = 'pending';
  });  
  return nodes;
}

var _show = function(seq) {
  document.querySelectorAll(`.page[data-slice="${_slicify(seq)}"]`).forEach(function(page) {
    page.dataset.visible = true;
  });
}

var seq = 30;

var go_next = function() {
  _pending(seq + 2);
  container.dataset.animating = true;
  container.dataset.transition = 'next';

  seq += 2;

  // var last_seq = _pending(seq);
  // _hide(seq);
  // seq += 2;
  // _show(seq);
}

var go_prev = function() {
  _pending(seq - 2);
  container.dataset.animating = true;
  container.dataset.transition = 'previous';

  seq -= 2;
  // // var last_seq = _pending(seq);
  // _hide(seq);
  // seq -= 2;
  // _show(seq);
}

_show(seq);

var a;
container.addEventListener('animationend', function(event) {
  // var nodes = document.querySelectorAll(`.page[data-visible="true"]`); console.log()
  console.log("animationend", event);
  if ( a ) { clearTimeout(a); }
  a = setTimeout(function() {
    container.dataset.animating = false;
    document.querySelectorAll(`.page[data-visible="true"]`).forEach(function(page) {
      console.log("<", page);
      page.dataset.visible = false;
    })
    document.querySelectorAll(`.page[data-visible="pending"]`).forEach(function(page) {
      console.log(">", page);
      page.dataset.visible = true;
    })
  }, 500);
})