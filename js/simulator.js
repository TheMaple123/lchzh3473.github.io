'use strict';
async function qwqImage(img, color) {
    const clickqwq = imgShader(img, color);
    const arr = [];
    const min = Math.min(img.width, img.height);
    const max = Math.max(img.width, img.height);
    for (let i = 0; i < parseInt(max / min); i++) arr[i] = await createImageBitmap(clickqwq, 0, i * min, min, min);
    return arr;
}
//必要组件
let stopDrawing;
const stat = {
    noteRank: [0, 0, 0, 0, 0, 0, 0, 0],
    combos: [0, 0, 0, 0, 0],
    maxcombo: 0,
    combo: 0,
    get good() {
        return this.noteRank[7] + this.noteRank[3];
    },
    get bad() {
        return this.noteRank[6] + this.noteRank[2];
    },
    get great() {
        return this.noteRank[5] + this.noteRank[1];
    },
    get perfect() {
        return this.noteRank[4] + this.great;
    },
    get all() {
        return this.perfect + this.good + this.bad;
    },
    get scoreNum() {
        const a = 1e6 * (this.perfect * 0.9 + this.good * 0.585 + this.maxcombo * 0.1) / this.numOfNotes;
        const b = 1e6 * (this.noteRank[4] + this.great * 0.65 + this.good * 0.35) / this.numOfNotes;
        return hyperMode.checked ? (isFinite(b) ? b : 0) : (isFinite(a) ? a : 0);
    },
    get scoreStr() {
        const a = this.scoreNum.toFixed(0);
        return ("0").repeat(a.length < 7 ? 7 - a.length : 0) + a;
    },
    get accNum() {
        const a = (this.perfect + this.good * 0.65) / this.all;
        const b = (this.noteRank[4] + this.great * 0.65 + this.good * 0.35) / this.all;
        return hyperMode.checked ? (isFinite(b) ? b : 0) : (isFinite(a) ? a : 0);
    },
    get accStr() {
        return (100 * this.accNum).toFixed(2) + "%";
    },
    get lineStatus() {
        if (this.bad) return 0;
        if (this.good) return 3;
        if (this.great && hyperMode.checked) return 2;
        return 1;
    },
    get rankStatus() {
        const a = Math.round(this.scoreNum);
        if (a >= 1e6) return 0;
        if (a >= 9.6e5) return 1;
        if (a >= 9.2e5) return 2;
        if (a >= 8.8e5) return 3;
        if (a >= 8.2e5) return 4;
        if (a >= 7e5) return 5;
        return 6;
    },
    get localData() {
        const l1 = Math.round(this.accNum * 1e4 + 566).toString(22).slice(-3);
        const l2 = Math.round(this.scoreNum + 40672).toString(32).slice(-4);
        const l3 = (Number(inputLevel.value.match(/\d+$/))).toString(36).slice(-1);
        return l1 + l2 + l3;
    },
    getData(isAuto) {
        const s1 = this.data[this.id].slice(0, 3);
        const s2 = this.data[this.id].slice(3, 7);
        const l1 = Math.round(this.accNum * 1e4 + 566).toString(22).slice(-3);
        const l2 = Math.round(this.scoreNum + 40672).toString(32).slice(-4);
        const l3 = (Number(inputLevel.value.match(/\d+$/))).toString(36).slice(-1);
        const a = (parseInt(s2, 32) - 40672).toFixed(0);
        const scoreBest = ("0").repeat(a.length < 7 ? 7 - a.length : 0) + a;
        if (!isAuto) this.data[this.id] = (s1 > l1 ? s1 : l1) + (s2 > l2 ? s2 : l2) + l3;
        const arr = [];
        for (const i in this.data) arr.push(i + this.data[i]);
        localStorage.setItem("phi", arr.sort(() => Math.random() - 0.5).join(""));
        if (isAuto) return [false, scoreBest, "", "AUTO PLAY", "#fe4365"];
        if (selectspeed.value != "1") return [false, scoreBest, "", "SPEED CHANGED", "#65fe43"];
        let brr = [s2 < l2, scoreBest, (s2 > l2 ? "- " : "+ ") + Math.abs(scoreBest - this.scoreStr)];
        if (this.lineStatus == 1) brr.push("ALL  PERFECT", "#ffc500");
        else if (this.lineStatus == 2) brr.push("ALL  PERFECT", "#91ff8f");
        else if (this.lineStatus == 3) brr.push("FULL  COMBO", "#00bef1");
        else brr.push("", "#fff");
        return brr;
    },
    reset(numOfNotes, id) {
        this.numOfNotes = Number(numOfNotes) || 0;
        this.combo = 0;
        this.maxcombo = 0;
        this.noteRank = [0, 0, 0, 0, 0, 0, 0, 0]; //4:PM,5:PE,1:PL,7:GE,3:GL,6:BE,2:BL
        this.combos = [0, 0, 0, 0, 0]; //不同种类note实时连击次数
        this.data = {};
        if (localStorage.getItem("phi") == null) localStorage.setItem("phi", ""); //初始化存储
        const str = localStorage.getItem("phi");
        for (let i = 0; i < parseInt(str.length / 40); i++) {
            const data = str.slice(i * 40, i * 40 + 40);
            this.data[data.slice(0, 32)] = data.slice(-8);
        }
        if (id) {
            if (!this.data[id]) this.data[id] = this.localData;
            this.id = id;
        }
    },
    addCombo(status, type) {
        this.noteRank[status]++;
        this.combo = status % 4 == 2 ? 0 : this.combo + 1;
        if (this.combo > this.maxcombo) this.maxcombo = this.combo;
        this.combos[0]++;
        this.combos[type]++;
    }
}
//const stat = new Stat();
const comboColor = ["#fff", "#0ac3ff", "#f0ed69", "#a0e9fd", "#fe4365"];
//读取文件
upload.onchange = function () {
    const file = this.files[0];
    document.getElementById("filename").value = file ? file.name : "";
    if (!file) {
        message.sendError("未选择任何文件");
        return;
    }
    uploads.classList.add("disabled");
    uploadsUrl.classList.add("disabled");
    loadFile(file);
}
const time2Str = time => `${parseInt(time / 60)}:${`00${parseInt(time % 60)}`.slice(-2)}`;
const frameTimer = { //计算fps
    tick: 0,
    time: Date.now(),
    fps: "",
    addTick(fr = 10) {
        if (++this.tick >= fr) {
            this.tick = 0;
            this.fps = (1e3 * fr / (-this.time + (this.time = Date.now()))).toFixed(0);
        }
        return this.fps;
    }
}
class Timer {
    constructor() {
        this.reset();
    }
    play() {
        if (!this.isPaused) throw new Error("Time has been playing");
        this.t1 = Date.now();
        this.isPaused = false;
    }
    pause() {
        if (this.isPaused) throw new Error("Time has been paused");
        this.t0 = this.time;
        this.isPaused = true;
    }
    reset() {
        this.t0 = 0;
        this.t1 = 0;
        this.isPaused = true;
    }
    addTime(num) {
        this.t0 += num;
    }
    get time() {
        if (this.isPaused) return this.t0;
        return this.t0 + Date.now() - this.t1;
    }
    get second() {
        return this.time / 1e3;
    }
}
let curTime = 0;
let curTimestamp = 0;
let timeBgm = 0;
let timeChart = 0;
let duration = 0;
let isInEnd = false; //开头过渡动画
let isOutStart = false; //结尾过渡动画
let isOutEnd = false; //临时变量
let isPaused = true; //暂停

//声音组件
const AudioContext = window.AudioContext || window.webkitAudioContext;
const actx = (new Audio()).canPlayType("audio/ogg") == "" ? new oggmented.OggmentedAudioContext() : new AudioContext(); //兼容Safari
const stopPlaying = [];
const gain = actx.createGain();
const playSound = (res, loop, isOut, offset, playbackrate) => {
    const bufferSource = actx.createBufferSource();
    bufferSource.buffer = res;
    bufferSource.loop = loop; //循环播放
    bufferSource.connect(gain);
    bufferSource.playbackRate.value = Number(playbackrate || 1);
    if (isOut) gain.connect(actx.destination);
    bufferSource.start(0, offset);
    return () => bufferSource.stop();
}
const res = {}; //存放资源
resizeCanvas();
uploads.classList.add("disabled");
uploadsUrl.classList.add("disabled");
select.classList.add("disabled");