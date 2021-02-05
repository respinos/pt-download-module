// https://babeljs.io/docs/en/babel-polyfill

import "core-js/stable";
import "regenerator-runtime/runtime";

// shoelace
import '@shoelace-style/shoelace/dist/shoelace/shoelace.css';
// import { setAssetPath, SlButton, SlDropdown,  } from '@shoelace-style/shoelace';
import { defineCustomElements, setAssetPath } from '@shoelace-style/shoelace';
const location_ = ( window.parent == window ) ? location : window.parent.location;
setAssetPath(`${location_.protocol}${location_.host}/2021/dist/shoelace/icons`);
// customElements.define('sl-button', SlButton);
// customElements.define('sl-dropdown', SlDropdown);
defineCustomElements();

const main = document.querySelector('main');

window.addEventListener('load', (event) => {
  const selectPanel = document.querySelector('#action-select-panel');
  if ( selectPanel ) {
    selectPanel.addEventListener('sl-select', event => {
      const selectedItem = event.detail.item;
      console.log(event.detail, selectedItem.value);
      document.body.dataset.panelState = 'open';
    });
  }
})

if ( document.body.dataset.prototype == 'drawers' ) {

  const drawers = {};
  document.querySelectorAll('sl-drawer').forEach((drawer) => {
    drawers[drawer.id] = drawer;
  })

  document.querySelectorAll('[data-toggle="drawer"]').forEach((button) => {
    button.addEventListener('click', () => {
      var targetId = button.dataset.target.substr(1);
      drawers[targetId].show();
    })
  })
}

if ( document.body.dataset.prototype == 'stacked' ) {
  const actionSearch = document.querySelector('#action-search-volume');
  actionSearch.addEventListener('click', (e) => {
    document.body.dataset.panelState = 'open';
    e.preventDefault();
  })
}

main.addEventListener('click', function(e) {
    // loop parent nodes from the target to the delegation node
    for (var target = e.target; target && target != this; target = target.parentNode) {
        if (target.matches('[data-action="close-panel"]')) {
            // if ( activePanel ) {
            //   closeActivePanel();
            //   closePanels();
            // }
            document.body.dataset.panelState = 'closed';
            break;
        }
    }
}, false);
