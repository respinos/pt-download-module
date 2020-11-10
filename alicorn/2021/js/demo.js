HT = HT || {};
HT.is_dev = false;

function rgbToYIQ({r, g, b}) {
  return ((r * 299) + (g * 587) + (b * 114)) / 1000;
}

function hexToRgb(hex) {
  if (!hex || hex === undefined || hex === '') {
    return undefined;
  }

  const result =
        /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);

  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : undefined;
}

function contrast(colorHex, threshold = 128) {
  if (colorHex === undefined) {
    return '#000';
  }

  const rgb = hexToRgb(colorHex);

  if (rgb === undefined) {
    return '#000';
  }

  return rgbToYIQ(rgb) >= threshold ? '#000' : '#fff';
}


function simpleSvgPlaceholder({
  width = 300,
  height = 150,
  text = `${width}×${height}`,
  fontFamily = 'sans-serif',
  fontWeight = 'bold',
  fontSize = Math.floor(Math.min(width, height) * 0.2),
  dy = fontSize * 0.35,
  bgColor = '#ddd',
  textColor = 'rgba(0,0,0,0.5)',
  dataUri = true,
  charset = 'UTF-8'
} = {}) {
  const str = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
    <rect fill="${bgColor}" width="${width}" height="${height}"/>
    <text fill="${textColor}" font-family="${fontFamily}" font-size="${fontSize}" dy="${dy}" font-weight="${fontWeight}" x="50%" y="50%" text-anchor="middle">${text}</text>
  </svg>`;

  // Thanks to: filamentgroup/directory-encoder
  const cleaned = str
    .replace(/[\t\n\r]/gim, '') // Strip newlines and tabs
    .replace(/\s\s+/g, ' ') // Condense multiple spaces
    .replace(/'/gim, '\\i'); // Normalize quotes

  if (dataUri) {
    const encoded = encodeURIComponent(cleaned)
      .replace(/\(/g, '%28') // Encode brackets
      .replace(/\)/g, '%29');

    return `data:image/svg+xml;charset=${charset},${encoded}`;
  }

  return cleaned;
}


var container = document.querySelector(".box-reader");
container.style.setProperty('--width', '850px');
var pageHTML = "";
var N = 50;
var slice_index = 1;
for (var i = 1; i <= N; i++) {
  // pageHTML += `<div class="page" id="page-${i}"><div class="seq">${i}</div></div>`;

  var bgColor = randomColor({ luminosity: 'random', hue: 'random', format: 'hex' });
  var textColor = contrast(bgColor);

  var placeholder = simpleSvgPlaceholder({
    bgColor: bgColor,
    textColor: textColor,
    text: `#${i}`,
    fontFamily: `monospace`,
    width: 680,
    height: 680 * 1.5
  });
  var klass = i % 2 == 0 ? 'verso' : 'recto';
  if ( i % 2 == 0 ) {
    slice_index += 1;
  }
  pageHTML += `<div class="page ${klass}" data-seq="${i}" data-slice="${slice_index}" data-visible="false"><div class="page-toolbar">
  <button><svg id="bi-arrow-counterclockwise" width="1em" height="1em" viewBox="0 0 16 16" class="bi bi-arrow-counterclockwise" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" d="M8 3a5 5 0 1 1-4.546 2.914.5.5 0 0 0-.908-.417A6 6 0 1 0 8 2v1z"/><path d="M8 4.466V.534a.25.25 0 0 0-.41-.192L5.23 2.308a.25.25 0 0 0 0 .384l2.36 1.966A.25.25 0 0 0 8 4.466z"/></svg></button>
  <button><svg id="bi-file-earmark-arrow-down" width="1em" height="1em" viewBox="0 0 16 16" class="bi bi-file-earmark-arrow-down" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M4 0h5.5v1H4a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V4.5h1V14a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V2a2 2 0 0 1 2-2z"/><path d="M9.5 3V0L14 4.5h-3A1.5 1.5 0 0 1 9.5 3z"/><path fill-rule="evenodd" d="M8 6a.5.5 0 0 1 .5.5v3.793l1.146-1.147a.5.5 0 0 1 .708.708l-2 2a.5.5 0 0 1-.708 0l-2-2a.5.5 0 1 1 .708-.708L7.5 10.293V6.5A.5.5 0 0 1 8 6z"/></svg></button>
  <span>#${i}</span>
  </div><div class="image"><img src="${placeholder}" data-placeholder-src="${placeholder}" /></div></div>`;
}
container.innerHTML = pageHTML;

var main = document.querySelector("main");
var activePanel;
var buttons = document.querySelectorAll(".box-sidebar button[data-target]");

var closeActivePanel = function() {
  var previous = document.querySelector(
    `button[data-target="${activePanel.getAttribute("id")}"]`
  );
  activePanel.classList.remove("active");
  previous.dataset.active = false;
}

var closePanels = function() {
  main.dataset.panelOpen = false;
  activePanel = null;
};

for (var i = 0; i < buttons.length; i++) {
  var button = buttons[i];
  button.addEventListener("click", function (e) {
    e.preventDefault();
    var trigger = this;
    var target = this.dataset.target;
    if (activePanel) {
      closeActivePanel();
      if (activePanel.getAttribute("id") == target) {
        closePanels();
        return;
      }
    }
    main.dataset.panelOpen = true;
    activePanel = document.getElementById(target);
    activePanel.classList.add("active");
    trigger.dataset.active = true;
  });
}

var toolbar = document.querySelector('.box-sidebar');
var toolbarToggle = document.querySelector('button[data-action="action-toggle-toolbar"]');
toolbarToggle.addEventListener('click', function(e) {
  e.preventDefault();
  var collapsed = ! ( toolbar.dataset.collapsed == 'true' );
  var top = '';
  if ( collapsed ) { 
    var styles = window.window.getComputedStyle(toolbar);
    var top = parseInt(styles.top, 10);
    var matrixValues = styles.transform.match(/matrix.*\((.+)\)/)[1].split(', ');
    var delta = parseInt(matrixValues[5], 10);
    top += delta;
    top = `${top}px`;
    console.log("AHOY", toolbar, top); 
  }
  toolbar.style.top = top;
  toolbar.dataset.collapsed = collapsed;
  toolbarToggle.classList[collapsed ? 'add' : 'remove']('active');
});

main.addEventListener('click', function(e) {
    // loop parent nodes from the target to the delegation node
    for (var target = e.target; target && target != this; target = target.parentNode) {
        if (target.matches('[data-action="close-panel"]')) {
            if ( activePanel ) {
              closeActivePanel();
              closePanels();
            }
            break;
        }
    }
}, false);