import { Engine } from './engine.js';
import { UI } from './ui.js';

// Expose UI and Engine to the browser window
// This allows HTML 'onclick' attributes to find them
window.UI = UI;
window.Engine = Engine;

// Wait for page to load, then start the engine and listen for the button
window.addEventListener('DOMContentLoaded', () => {
    console.log("SHINJUKU SHOWDOWN: INITIALIZING...");
    
    // Initialize the Canvas and Event Listeners
    Engine.init();

    // specific fix for the Start Button
    const startBtn = document.getElementById('btn-to-select');
    if(startBtn) {
        startBtn.addEventListener('click', () => {
            UI.toSelect();
        });
    }
});