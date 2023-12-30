// This script can be used to add interactivity to the page
// For example, handling the "Add Panel" button click to clone the settings panel

// document.querySelector('.add-panel').addEventListener('click', () => {
//     const panel = document.querySelector('.settings-panel');
//     const clone = panel.cloneNode(true);
//     panel.parentNode.insertBefore(clone, panel.nextSibling);
// });
function addPanel() {
    var settingsContainer = document.querySelector('.settings-container');
    var newPanel = settingsContainer.firstElementChild.cloneNode(true);
    settingsContainer.appendChild(newPanel);
}