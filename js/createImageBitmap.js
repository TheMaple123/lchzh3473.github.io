/*
* Polyfill for createImageBitmap
* https://developer.mozilla.org/en-US/docs/Web/API/WindowOrWorkerGlobalScope/createImageBitmap
*
* Supports CanvasImageSource (img, video, canvas) sources, Blobs, and ImageData.
*
* From:
* - https://dev.to/nektro/createimagebitmap-polyfill-for-safari-and-edge-228
* - https://gist.github.com/MonsieurV/fb640c29084c171b4444184858a91bc7
* Updated by:
* - Yoan Tournade <yoan@ytotech.com>
* - diachedelic, https://gist.github.com/diachedelic
* - Paul Ellis, https://pseudosavant.com
*/

(function createImageBitmapIIFE(global) {
    function isCanvasImageSource(el) {
        const validElements = ['img', 'video', 'canvas'];

        return (el && el.tagName && validElements.includes(el.tagName.toLowerCase()));
    }

    function idealSize(currentValue, newValue, numerator, denominator) {
        if (typeof newValue === 'number') return newValue;
        if (typeof numerator !== 'number' || typeof denominator !== 'number') return currentValue;

        return (numerator / denominator) * currentValue;
    }

    if (!('createImageBitmap' in window) || true) {
        window.createImageBitmap = async function polyfillCreateImageBitmap(data, opts) {
            return new Promise((resolve, reject) => {
                opts = opts || {};

                let dataURL;
                const canvas = document.createElement('canvas');

                try {
                    const ctx = canvas.getContext('2d');

                    if (data instanceof Blob) {
                        dataURL = URL.createObjectURL(data);
                    } else if (isCanvasImageSource(data)) {
                        const width = data.naturalWidth || data.videoWidth || data.clientWidth || data.width
                        const height = data.naturalHeight || data.videoHeight || data.clientHeight || data.height
                        canvas.width = idealSize(width, opts.resizeWidth, opts.resizeHeight, height);
                        canvas.height = idealSize(height, opts.resizeHeight, opts.resizeWidth, width);

                        ctx.drawImage(data, 0, 0, canvas.width, canvas.height);

                        dataURL = canvas.toDataURL();
                    } else if (data instanceof ImageData) {
                        canvas.width = idealSize(data.width, opts.resizeWidth, opts.resizeHeight, data.height);;
                        canvas.height = idealSize(data.height, opts.resizeHeight, opts.resizeWidth, data.width);

                        ctx.putImageData(data, 0, 0);

                        dataURL = canvas.toDataURL();
                    } else {
                        reject('createImageBitmap does not handle the provided image source type');
                    }

                    const img = new Image();
                    img.onerror = reject;
                    img.onload = () => resolve(img);
                    img.src = dataURL;
                } finally {
                    // avoid memory leaks on iOS Safari, see https://stackoverflow.com/a/52586606
                    canvas.width = 0;
                    canvas.height = 0;
                }
            });
        };
    }

})(this);