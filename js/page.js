"use strict";
document.oncontextmenu = e => e.preventDefault(); //qwq
for (const i of document.getElementById("view-nav").children) {
    i.addEventListener("click", function () {
        for (const j of this.parentElement.children) j.classList.remove("active");
        const doc = document.getElementById("view-doc");
        const msg = document.getElementById("view-msg");
        this.classList.add("active");
        if (i.id == "msg") {
            doc.src = "";
            doc.classList.add("hide");
            msg.classList.remove("hide");
        } else {
            if (doc.getAttribute("src") != `docs/${i.id}.html`) doc.src = `docs/${i.id}.html`;
            msg.classList.add("hide");
            doc.classList.remove("hide");
        }
    });
}
document.getElementById("cover-dark").addEventListener("click", () => {
    document.getElementById("cover-dark").classList.add("fade");
    document.getElementById("cover-view").classList.add("fade");
});
document.getElementById("qwq").addEventListener("click", () => {
    document.getElementById("cover-dark").classList.remove("fade");
    document.getElementById("cover-view").classList.remove("fade");
    document.getElementById("res").click();
});
document.getElementById("msg-out").addEventListener("click", () => {
    document.getElementById("cover-dark").classList.remove("fade");
    document.getElementById("cover-view").classList.remove("fade");
    document.getElementById("msg").click();
});
const message = {
    out: document.getElementById("msg-out"),
    view: document.getElementById("view-msg"),
    lastMessage: "",
    isError: false,
    get num() {
        return this.view.querySelectorAll(".msgbox").length;
    },
    sendMessage(msg) {
        const num = this.num;
        this.out.className = num ? "warning" : "accept";
        this.out.innerText = msg + (num ? `（发现${num}个问题，点击查看）` : "");
        this.lastMessage = msg;
        this.isError = false;
    },
    sendWarning(msg) {
        const msgbox = document.createElement("div");
        msgbox.innerText = msg;
        msgbox.classList.add("msgbox");
        const btn = document.createElement("a");
        btn.innerText = "忽略";
        btn.style.float = "right";
        btn.onclick = () => {
            msgbox.remove();
            if (this.isError) this.sendError(this.lastMessage);
            else this.sendMessage(this.lastMessage);
        }
        msgbox.appendChild(btn);
        this.view.appendChild(msgbox);
        if (this.isError) this.sendError(this.lastMessage);
        else this.sendMessage(this.lastMessage);
    },
    sendError(msg) {
        const num = this.num;
        this.out.className = "error";
        this.out.innerText = msg + (num ? `（发现${num}个问题，点击查看）` : "");
        this.lastMessage = msg;
        this.isError = true;
    }
}
//全屏相关
const full = {
    toggle(elem) {
        // if (!this.enabled) return false;
        if (this.element || elem.pseudoFullScreen) {
            if (document.exitFullscreen) return document.exitFullscreen();
            if (document.cancelFullScreen) return document.cancelFullScreen();
            if (document.webkitCancelFullScreen) return document.webkitCancelFullScreen();
            if (document.mozCancelFullScreen) return document.mozCancelFullScreen();
            if (document.msExitFullscreen) return document.msExitFullscreen();
            elem.pseudoFullScreen = false;
            document.getElementById('stage').style.marginLeft = null;
            resizeCanvas();
        } else {
            if (!(elem instanceof HTMLElement)) elem = document.body;
            if (elem.requestFullscreen) return elem.requestFullscreen();
            if (elem.webkitRequestFullscreen) return elem.webkitRequestFullscreen();
            if (elem.mozRequestFullScreen) return elem.mozRequestFullScreen();
            if (elem.msRequestFullscreen) return elem.msRequestFullscreen();
            elem.pseudoFullScreen = true;
            document.getElementById('stage').style.marginLeft = "0px";
            resizeCanvas();
        }
    },
    check(elem) {
        if (!(elem instanceof HTMLElement)) elem = document.body;
        return this.element == elem || elem.pseudoFullScreen;
    },
    get element() {
        return document.fullscreenElement || document.webkitFullscreenElement || document.mozFullScreenElement || document.msFullscreenElement;
    },
    get enabled() {
        return !!(document.fullscreenEnabled || document.webkitFullscreenEnabled || document.mozFullScreenEnabled || document.msFullscreenEnabled);
    }
};
function adjustInfo() {
    for (const i of chartInfoData) {
        if (selectchart.value == i.Chart) {
            if (bgms[i.Music]) selectbgm.value = i.Music;
            if (bgs[i.Image]) selectbg.value = i.Image;
            if (!!Number(i.AspectRatio)) selectaspectratio.value = i.AspectRatio;
            if (!!Number(i.ScaleRatio)) selectscaleratio.value = i.ScaleRatio;
            if (!!Number(i.GlobalAlpha)) selectglobalalpha.value = i.GlobalAlpha;
            inputName.value = i.Name;
            inputLevel.value = i.Level;
            inputIllustrator.value = i.Illustrator;
            inputDesigner.value = i.Designer;
        }
    }
    if (chartInfoDataJSON) {
        if (chartInfoDataJSON["name"]) inputName.value = chartInfoDataJSON["name"];
        if (chartInfoDataJSON["chartDesigner"]) inputDesigner.value = chartInfoDataJSON["chartDesigner"];
        if (chartInfoDataJSON["musicFile"]) selectbgm.value = chartInfoDataJSON["musicFile"];
        if (chartInfoDataJSON["illustration"]) selectbg.value = chartInfoDataJSON["illustration"];
        if (chartInfoDataJSON["illustrator"]) inputIllustrator.value = chartInfoDataJSON["illustrator"];
        message.sendWarning("检测到PhiCommunity格式谱面信息(meta.json)\n将无法显示等级")
    }
}
window.addEventListener("resize", resizeCanvas);
document.addEventListener("fullscreenchange", resizeCanvas);
selectscaleratio.addEventListener("change", resizeCanvas);
selectaspectratio.addEventListener("change", resizeCanvas);
//适应画面尺寸
function resizeCanvas() {
    const width = document.documentElement.clientWidth;
    const height = document.documentElement.clientHeight;
    const defaultWidth = Math.min(854, width * 0.8);
    const defaultHeight = defaultWidth / (selectaspectratio.value || 16 / 9);
    const realWidth = Math.floor(full.check(canvas) ? width : defaultWidth);
    const realHeight = Math.floor(full.check(canvas) ? height : defaultHeight);
    canvas.style.cssText += `;width:${realWidth}px;height:${realHeight}px`;
    canvas.width = realWidth * devicePixelRatio;
    canvas.height = realHeight * devicePixelRatio;
    canvasos.width = Math.min(realWidth, realHeight * AspectRatio) * devicePixelRatio;
    canvasos.height = realHeight * devicePixelRatio;
    wlen = canvasos.width / 2;
    hlen = canvasos.height / 2;
    wlen2 = canvasos.width / 18;
    hlen2 = canvasos.height * 0.6; //控制note流速
    noteScale = canvasos.width / (selectscaleratio.value || 8e3); //note、特效缩放
    lineScale = canvasos.width > canvasos.height * 0.75 ? canvasos.height / 18.75 : canvasos.width / 14.0625; //判定线、文字缩放
}
loadByUrl.addEventListener("click", function () {
    uploads.classList.add("disabled");
    uploadsUrl.classList.add("disabled");
    const xhr = new XMLHttpRequest();
    xhr.open("get", url.value, true);
    xhr.responseType = 'blob';
    xhr.send();
    xhr.onprogress = progress => { //显示加载文件进度
        message.sendMessage(`加载文件：${Math.floor(progress.loaded / 5079057 * 100)}%`);
    };
    xhr.onload = () => {
        document.getElementById("filename").value = url.value;
        console.log(xhr.response);
        loadFile(xhr.response);
    };
});