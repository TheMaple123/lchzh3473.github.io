"use strict";

function loadJS(src) {
    return new Promise(resolve => {
        var script = document.createElement('script');
        script.src = src;
        script.onload = resolve;
        document.body.appendChild(script);
    });
}

(async () => {
    await loadJS("/js/config.js");
    await loadJS("/js/page.js");
    await loadJS("/js/load.js");
    await loadJS("/js/input.js");
    await loadJS("/js/simulator.js");
    await loadJS("/js/render.js");
})();
