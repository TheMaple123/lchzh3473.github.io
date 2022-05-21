"use strict";
const upload = document.getElementById("upload");
const uploads = document.getElementById("uploads");
const url = document.getElementById('url');
const loadByUrl = document.getElementById("load-by-url");
const uploadsUrl = document.getElementById('uploads-url');
const mask = document.getElementById("mask");
const select = document.getElementById("select");
const selectbg = document.getElementById("select-bg");
const btnPlay = document.getElementById("btn-play");
const btnPause = document.getElementById("btn-pause");
const selectbgm = document.getElementById("select-bgm");
const selectchart = document.getElementById("select-chart");
const selectscaleratio = document.getElementById("select-scale-ratio"); //数值越大note越小
const selectaspectratio = document.getElementById("select-aspect-ratio");
const selectglobalalpha = document.getElementById("select-global-alpha");
const selectflip = document.getElementById("select-flip");
const selectspeed = document.getElementById("select-speed");
const scfg = function () {
    let arr = [];
    switch (selectflip.value) {
        case "bl":
            arr.push("FlipX");
            break;
        case "tr":
            arr.push("FlipY");
            break;
        case "tl":
            arr.push("FlipX&Y");
            break;
        default:
    }
    switch (selectspeed.value) {
        case "0.594604":
            arr.push("Slowest");
            break;
        case "0.793701":
            arr.push("Slower");
            break;
        case "1.189207":
            arr.push("Faster");
            break;
        case "1.334840":
            arr.push("Fastest");
            break;
        default:
    }
    if (isPaused) arr.push("Paused");
    if (arr.length == 0) return "";
    return `(${arr.join("+")})`;
}
const inputName = document.getElementById("input-name");
const inputLevel = document.getElementById("input-level");
const inputDesigner = document.getElementById("input-designer");
const inputIllustrator = document.getElementById("input-illustrator");
const inputOffset = document.getElementById("input-offset");
const showPoint = document.getElementById("showPoint");
const lineColor = document.getElementById("lineColor");
const autoplay = document.getElementById("autoplay");
const hyperMode = document.getElementById("hyperMode");
const showTransition = document.getElementById("showTransition");
const bgs = {};
const bgsBlur = {};
const bgms = {};
const charts = {};
const chartLineData = []; //line.csv
const chartInfoData = []; //info.csv
let chartInfoDataJSON = null; //meta.json
const AspectRatio = 16 / 9; //宽高比上限
const Deg = Math.PI / 180; //角度转弧度
let wlen, hlen, wlen2, hlen2, noteScale, lineScale; //背景图相关
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d"); //游戏界面(alpha:false会出现兼容问题)
const canvasos = document.createElement("canvas"); //用于绘制游戏主界面
const ctxos = canvasos.getContext("2d");
const Renderer = { //存放谱面
    chart: null,
    bgImage: null,
    bgImageBlur: null,
    bgMusic: null,
    lines: [],
    notes: [],
    taps: [],
    drags: [],
    flicks: [],
    holds: [],
    reverseholds: [],
    tapholds: []
};