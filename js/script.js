"use strict";

function loadJS(src) {
    return new Promise(resolve => {
        var script = document.createElement('script');
        script.src = src;
        script.onload = resolve;
        document.body.appendChild(script);
    });
}

loadJS("/js/config.js");
loadJS("/js/page.js");
loadJS("/js/load.js");
loadJS("/js/input.js");
loadJS("/js/simulator.js");
loadJS("/js/render.js");