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
  selectPanel.addEventListener('sl-select', event => {
    const selectedItem = event.detail.item;
    console.log(event.detail, selectedItem.value);
    document.body.dataset.panelState = 'open';
  });
})

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
