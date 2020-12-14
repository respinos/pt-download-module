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

var container = document.querySelector(".app--reader--viewer");
var defaultWidth = parseInt(container.dataset.defaultWidth);
var defaultHeight = parseInt(container.dataset.defaultHeight);

var targetWidth = 850;
var r = targetWidth / defaultWidth;
defaultHeight *= r;
defaultHeight = Math.ceil(defaultHeight);
defaultWidth = targetWidth;

var placeholderWidth = defaultWidth * 0.8;
container.style.setProperty('--width', `${defaultWidth}px`);
container.style.setProperty('--height', `${defaultHeight}px`);

var checkboxEmptySvg = `<svg width="1em" height="1em" viewBox="0 0 16 16" class="bi bi-square" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
  <path fill-rule="evenodd" d="M14 1H2a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V2a1 1 0 0 0-1-1zM2 0a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V2a2 2 0 0 0-2-2H2z"/>
</svg>`;
var checkboxCheckedSvg = `<svg width="1em" height="1em" viewBox="0 0 16 16" class="bi bi-check-square" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
  <path fill-rule="evenodd" d="M14 1H2a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V2a1 1 0 0 0-1-1zM2 0a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V2a2 2 0 0 0-2-2H2z"/>
  <path fill-rule="evenodd" d="M10.97 4.97a.75.75 0 0 1 1.071 1.05l-3.992 4.99a.75.75 0 0 1-1.08.02L4.324 8.384a.75.75 0 1 1 1.06-1.06l2.094 2.093 3.473-4.425a.236.236 0 0 1 .02-.022z"/>
</svg>`;

var pageHTML = "";
var N = parseInt(container.dataset.totalSeq);
var slice_index = 1;
for (var i = 1; i <= N; i++) {
  // pageHTML += `<div class="page" id="page-${i}"><div class="seq">${i}</div></div>`;

  var bgColor = randomColor({ luminosity: 'random', hue: 'random', format: 'hex' });
  var textColor = contrast(bgColor);

  var width = defaultWidth;
  // if ( i == 15 ) { width *= 1.5; }

  var placeholder = simpleSvgPlaceholder({
    bgColor: bgColor,
    textColor: textColor,
    text: `#${i}`,
    fontFamily: `monospace`,
    width: width,
    height: defaultHeight,
    // width: 680,
    // height: 680 * 1.5
  });
  var klass = i % 2 == 0 ? 'verso' : 'recto';
  if ( i % 2 == 0 ) {
    slice_index += 1;
  }
  pageHTML += `<div class="page ${klass}" data-seq="${i}" data-slice="${slice_index}" data-visible="false" data-width="${width}" data-height="${defaultHeight}"><div class="tag"><button data-role="tooltip" aria-pressed="false" aria-label="Select page">${checkboxEmptySvg}${checkboxCheckedSvg}</button> <span>#${i}</span></div><div class="image"><img src="${placeholder}" data-placeholder-src="${placeholder}" /></div></div>`;
}
container.innerHTML = pageHTML;

