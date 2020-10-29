var container = document.querySelector(".box-reader");
var pageHTML = "";
for (var i = 1; i <= 50; i++) {
  // pageHTML += `<div class="page" id="page-${i}"><div class="seq">${i}</div></div>`;
  pageHTML += `<div class="page"><div class="page-toolbar">
  <button><svg id="bi-arrow-counterclockwise" width="1em" height="1em" viewBox="0 0 16 16" class="bi bi-arrow-counterclockwise" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" d="M8 3a5 5 0 1 1-4.546 2.914.5.5 0 0 0-.908-.417A6 6 0 1 0 8 2v1z"/><path d="M8 4.466V.534a.25.25 0 0 0-.41-.192L5.23 2.308a.25.25 0 0 0 0 .384l2.36 1.966A.25.25 0 0 0 8 4.466z"/></svg></button>
  <button><svg id="bi-file-earmark-arrow-down" width="1em" height="1em" viewBox="0 0 16 16" class="bi bi-file-earmark-arrow-down" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M4 0h5.5v1H4a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V4.5h1V14a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V2a2 2 0 0 1 2-2z"/><path d="M9.5 3V0L14 4.5h-3A1.5 1.5 0 0 1 9.5 3z"/><path fill-rule="evenodd" d="M8 6a.5.5 0 0 1 .5.5v3.793l1.146-1.147a.5.5 0 0 1 .708.708l-2 2a.5.5 0 0 1-.708 0l-2-2a.5.5 0 1 1 .708-.708L7.5 10.293V6.5A.5.5 0 0 1 8 6z"/></svg></button>
  <span>#${i}</span>
  </div><div class="image"></div></div>`;
}
container.innerHTML = pageHTML;

// var main = document.querySelector("main");
// var activePanel;
// var buttons = document.querySelectorAll(".sidebar button");
// for (var i = 0; i < buttons.length; i++) {
//   var button = buttons[i];
//   button.addEventListener("click", function (e) {
//     e.preventDefault();
//     var trigger = this;
//     var target = this.dataset.target;
//     if (activePanel) {
//       var previous = document.querySelector(
//         `button[data-target="${activePanel.getAttribute("id")}"]`
//       );
//       activePanel.classList.remove("active");
//       previous.dataset.active = false;
//       if (activePanel.getAttribute("id") == target) {
//         main.dataset.panelOpen = false;
//         activePanel = null;
//         return;
//       }
//     }
//     main.dataset.panelOpen = true;
//     activePanel = document.getElementById(target);
//     activePanel.classList.add("active");
//     trigger.dataset.active = true;
//   });
// }
