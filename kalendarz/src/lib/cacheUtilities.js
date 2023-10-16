export function getImage(url, cacheKey, callback, cache = true) {
    let image = null;
    if (cache) {
        image = sessionStorage.getItem(cacheKey);
    }
    if (image) {
        const blob = b64toBlob(image, "image/png");
        callback({img:URL.createObjectURL(blob), status:"Pulled from cache"});
    } else if (url !== null) {
        const httpRequest = new XMLHttpRequest();
        httpRequest.responseType = 'blob';
        httpRequest.open('GET', url);
        httpRequest.send();
        httpRequest.onload = () => {
            if (httpRequest.status === 200) {
                const blob = httpRequest.response;
                const img = new Image();
                img.src = URL.createObjectURL(blob);
                img.onload = () => {
                    if (img.naturalWidth && img.naturalHeight) {
                        const reader = new FileReader();
                        reader.readAsDataURL(blob);
                        reader.onloadend = function() {
                            const base64data = reader.result;
                            sessionStorage.setItem(cacheKey, base64data.split(",")[1]);
                            callback({img:URL.createObjectURL(blob), status:httpRequest.status});
                        }
                    }
                };
            } else {
                callback({img: null, status: httpRequest.status});
            }
        };
    } else {
        callback({img: null, status: "No url provided"});
    }
}


function b64toBlob(b64Data, contentType = '', sliceSize = 512) {
    const byteCharacters = window.atob(b64Data);
    const byteArrays = [];

    for (let offset = 0; offset < byteCharacters.length; offset += sliceSize) {
        const slice = byteCharacters.slice(offset, offset + sliceSize);
        const byteNumbers = new Array(slice.length);

        for (let i = 0; i < slice.length; i++) {
            byteNumbers[i] = slice.charCodeAt(i);
        }

        const byteArray = new Uint8Array(byteNumbers);
        byteArrays.push(byteArray);
    }

    return new Blob(byteArrays, { type: contentType });
}