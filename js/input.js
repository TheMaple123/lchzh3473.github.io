'use strict';
const mouse = {}; //存放鼠标事件(用于检测，下同)
const touch = {}; //存放触摸事件
const keyboard = {}; //存放键盘事件
const taps = []; //额外处理tap(试图修复吃音bug)
const specialClick = {
    time: [0, 0, 0, 0],
    func: [() => {
        btnPause.click();
    }, () => {
        btnPlay.click();
        btnPlay.click();
    }, () => void 0, () => {
        full.toggle(canvas);
    }],
    click(id) {
        const now = Date.now();
        if (now - this.time[id] < 300) this.func[id]();
        this.time[id] = now;
    }
}
class Click {
    constructor(offsetX, offsetY) {
        this.offsetX = Number(offsetX);
        this.offsetY = Number(offsetY);
        this.isMoving = false;
        this.time = 0;
    }
    static activate(offsetX, offsetY) {
        taps.push(new Click(offsetX, offsetY));
        if (offsetX < lineScale * 1.5 && offsetY < lineScale * 1.5) specialClick.click(0);
        if (offsetX > canvasos.width - lineScale * 1.5 && offsetY < lineScale * 1.5) specialClick.click(1);
        if (offsetX < lineScale * 1.5 && offsetY > canvasos.height - lineScale * 1.5) specialClick.click(2);
        if (offsetX > canvasos.width - lineScale * 1.5 && offsetY > canvasos.height - lineScale * 1.5) specialClick.click(3);
        if (timeSinceEnd.second > 0) qwq[3] = qwq[3] > 0 ? -timeSinceEnd.second : timeSinceEnd.second;
        return new Click(offsetX, offsetY);
    }
    move(offsetX, offsetY) {
        this.offsetX = Number(offsetX);
        this.offsetY = Number(offsetY);
        this.isMoving = true;
        this.time = 0;
    }
    animate() {
        if (!this.time++) {
            if (this.isMoving) clickEvents0.push(ClickEvent0.getClickMove(this.offsetX, this.offsetY));
            else clickEvents0.push(ClickEvent0.getClickTap(this.offsetX, this.offsetY));
        } else clickEvents0.push(ClickEvent0.getClickHold(this.offsetX, this.offsetY));
    }
}
class Judgement {
    constructor(offsetX, offsetY, type) {
        if (autoplay.checked) {
            this.offsetX = Number(offsetX);
            this.offsetY = Number(offsetY);
        } else switch (selectflip.value) {
            case "br":
                this.offsetX = Number(offsetX);
                this.offsetY = Number(offsetY);
                break;
            case "bl":
                this.offsetX = canvasos.width - Number(offsetX);
                this.offsetY = Number(offsetY);
                break;
            case "tr":
                this.offsetX = Number(offsetX);
                this.offsetY = canvas.height - Number(offsetY);
                break;
            case "tl":
                this.offsetX = canvasos.width - Number(offsetX);
                this.offsetY = canvas.height - Number(offsetY);
                break;
            default:
                throw new Error("Flip Error");
        }
        this.type = Number(type) || 0; //1-Tap,2-Hold,3-Move
        this.catched = false;
    }
    isInArea(x, y, cosr, sinr, hw) {
        return isNaN(this.offsetX + this.offsetY) ? true : Math.abs((this.offsetX - x) * cosr + (this.offsetY - y) * sinr) <= hw;
    }
}
class Judgements extends Array {
    addJudgement(notes, realTime) {
        this.length = 0;
        if (autoplay.checked) {
            for (const i of notes) {
                const deltaTime = i.realTime - realTime;
                if (i.scored) continue;
                if (i.type == 1) {
                    if (deltaTime < 0.0) this.push(new Judgement(i.offsetX, i.offsetY, 1));
                } else if (i.type == 2) {
                    if (deltaTime < 0.2) this.push(new Judgement(i.offsetX, i.offsetY, 2));
                } else if (i.type == 3) {
                    if (i.status3) this.push(new Judgement(i.offsetX, i.offsetY, 2));
                    else if (deltaTime < 0.0) this.push(new Judgement(i.offsetX, i.offsetY, 1));
                } else if (i.type == 4) {
                    if (deltaTime < 0.2) this.push(new Judgement(i.offsetX, i.offsetY, 3));
                }
            }
        } else if (!isPaused) {
            for (const j in mouse) {
                const i = mouse[j];
                if (i instanceof Click) {
                    if (i.time) this.push(new Judgement(i.offsetX, i.offsetY, 2));
                    else if (i.isMoving) this.push(new Judgement(i.offsetX, i.offsetY, 3));
                    //else this.push(new Judgement(i.offsetX, i.offsetY, 1));
                }
            }
            for (const j in touch) {
                const i = touch[j];
                if (i instanceof Click) {
                    if (i.time) this.push(new Judgement(i.offsetX, i.offsetY, 2));
                    else if (i.isMoving) this.push(new Judgement(i.offsetX, i.offsetY, 3));
                    //else this.push(new Judgement(i.offsetX, i.offsetY, 1));
                }
            }
            for (const j in keyboard) {
                const i = keyboard[j];
                if (i instanceof Click) {
                    if (i.time) this.push(new Judgement(i.offsetX, i.offsetY, 2));
                    else /*if (i.isMoving)*/ this.push(new Judgement(i.offsetX, i.offsetY, 3));
                    //else this.push(new Judgement(i.offsetX, i.offsetY, 1));
                }
            }
            for (const i of taps) {
                if (i instanceof Click) this.push(new Judgement(i.offsetX, i.offsetY, 1));
            }
        }
    };
    judgeNote(notes, realTime, width) {
        for (const i of notes) {
            const deltaTime = i.realTime - realTime;
            if (i.scored) continue;
            if ((deltaTime < -(hyperMode.checked ? 0.12 : 0.16) && i.frameCount > (hyperMode.checked ? 3 : 4)) && !i.status2) {
                //console.log("Miss", i.name);
                i.status = 2;
                stat.addCombo(2, i.type);
                i.scored = true;
            } else if (i.type == 1) {
                for (let j = 0; j < this.length; j++) {
                    if (this[j].type == 1 && this[j].isInArea(i.offsetX, i.offsetY, i.cosr, i.sinr, width) && deltaTime < 0.2 && (deltaTime > -(hyperMode.checked ? 0.12 : 0.16) || i.frameCount < (hyperMode.checked ? 3 : 4))) {
                        if (deltaTime > (hyperMode.checked ? 0.12 : 0.16)) {
                            if (!this[j].catched) {
                                i.status = 6; //console.log("Bad", i.name);
                                i.badtime = Date.now();
                            }
                        } else if (deltaTime > 0.08) {
                            i.status = 7; //console.log("Good(Early)", i.name);
                            if (document.getElementById("hitSong").checked) playSound(res["HitSong0"], false, true, 0);
                            clickEvents1.push(ClickEvent1.getClickGood(i.projectX, i.projectY));
                            clickEvents2.push(ClickEvent2.getClickEarly(i.projectX, i.projectY));
                        } else if (deltaTime > 0.04) {
                            i.status = 5; //console.log("Perfect(Early)", i.name);
                            if (document.getElementById("hitSong").checked) playSound(res["HitSong0"], false, true, 0);
                            clickEvents1.push(hyperMode.checked ? ClickEvent1.getClickGreat(i.projectX, i.projectY) : ClickEvent1.getClickPerfect(i.projectX, i.projectY));
                            clickEvents2.push(ClickEvent2.getClickEarly(i.projectX, i.projectY));
                        } else if (deltaTime > -0.04 || i.frameCount < 1) {
                            i.status = 4; //console.log("Perfect(Max)", i.name);
                            if (document.getElementById("hitSong").checked) playSound(res["HitSong0"], false, true, 0);
                            clickEvents1.push(ClickEvent1.getClickPerfect(i.projectX, i.projectY));
                        } else if (deltaTime > -0.08 || i.frameCount < 2) {
                            i.status = 1; //console.log("Perfect(Late)", i.name);
                            if (document.getElementById("hitSong").checked) playSound(res["HitSong0"], false, true, 0);
                            clickEvents1.push(hyperMode.checked ? ClickEvent1.getClickGreat(i.projectX, i.projectY) : ClickEvent1.getClickPerfect(i.projectX, i.projectY));
                            clickEvents2.push(ClickEvent2.getClickLate(i.projectX, i.projectY));
                        } else {
                            i.status = 3; //console.log("Good(Late)", i.name);
                            if (document.getElementById("hitSong").checked) playSound(res["HitSong0"], false, true, 0);
                            clickEvents1.push(ClickEvent1.getClickGood(i.projectX, i.projectY));
                            clickEvents2.push(ClickEvent2.getClickLate(i.projectX, i.projectY));
                        }
                        if (i.status) {
                            stat.addCombo(i.status, 1);
                            i.scored = true;
                            this.splice(j, 1);
                            break;
                        }
                    }
                }
            } else if (i.type == 2) {
                if (i.status == 4 && deltaTime < 0) {
                    if (document.getElementById("hitSong").checked) playSound(res["HitSong1"], false, true, 0);
                    clickEvents1.push(ClickEvent1.getClickPerfect(i.projectX, i.projectY));
                    stat.addCombo(4, 2);
                    i.scored = true;
                } else if (!i.status) {
                    for (let j = 0; j < this.length; j++) {
                        if (this[j].isInArea(i.offsetX, i.offsetY, i.cosr, i.sinr, width) && deltaTime < (hyperMode.checked ? 0.12 : 0.16) && (deltaTime > -(hyperMode.checked ? 0.12 : 0.16) || i.frameCount < (hyperMode.checked ? 3 : 4))) {
                            //console.log("Perfect", i.name);
                            this[j].catched = true;
                            i.status = 4;
                            break;
                        }
                    }
                }
            } else if (i.type == 3) {
                if (i.status3) {
                    if ((Date.now() - i.status3) * i.holdTime >= 1.6e4 * i.realHoldTime) { //间隔时间与bpm成反比，待实测
                        if (i.status2 % 4 == 0) clickEvents1.push(ClickEvent1.getClickPerfect(i.projectX, i.projectY));
                        else if (i.status2 % 4 == 1) clickEvents1.push(hyperMode.checked ? ClickEvent1.getClickGreat(i.projectX, i.projectY) : ClickEvent1.getClickPerfect(i.projectX, i.projectY));
                        else if (i.status2 % 4 == 3) clickEvents1.push(ClickEvent1.getClickGood(i.projectX, i.projectY));
                        i.status3 = Date.now();
                    }
                    if (deltaTime + i.realHoldTime < 0.2) {
                        if (!i.status) {
                            stat.addCombo(i.status = i.status2, 3);
                        }
                        if (deltaTime + i.realHoldTime < 0) i.scored = true;
                        continue;
                    }
                }
                i.status4 = true;
                for (let j = 0; j < this.length; j++) {
                    if (!i.status3) {
                        if (this[j].type == 1 && this[j].isInArea(i.offsetX, i.offsetY, i.cosr, i.sinr, width) && deltaTime < (hyperMode.checked ? 0.12 : 0.16) && (deltaTime > -(hyperMode.checked ? 0.12 : 0.16) || i.frameCount < (hyperMode.checked ? 3 : 4))) {
                            if (document.getElementById("hitSong").checked) playSound(res["HitSong0"], false, true, 0);
                            if (deltaTime > 0.08) {
                                i.status2 = 7; //console.log("Good(Early)", i.name);
                                clickEvents1.push(ClickEvent1.getClickGood(i.projectX, i.projectY));
                                clickEvents2.push(ClickEvent2.getClickEarly(i.projectX, i.projectY));
                                i.status3 = Date.now();
                            } else if (deltaTime > 0.04) {
                                i.status2 = 5; //console.log("Perfect(Early)", i.name);
                                clickEvents1.push(hyperMode.checked ? ClickEvent1.getClickGreat(i.projectX, i.projectY) : ClickEvent1.getClickPerfect(i.projectX, i.projectY));
                                clickEvents2.push(ClickEvent2.getClickEarly(i.projectX, i.projectY));
                                i.status3 = Date.now();
                            } else if (deltaTime > -0.04 || i.frameCount < 1) {
                                i.status2 = 4; //console.log("Perfect(Max)", i.name);
                                clickEvents1.push(ClickEvent1.getClickPerfect(i.projectX, i.projectY));
                                i.status3 = Date.now();
                            } else if (deltaTime > -0.08 || i.frameCount < 2) {
                                i.status2 = 1; //console.log("Perfect(Late)", i.name);
                                clickEvents1.push(hyperMode.checked ? ClickEvent1.getClickGreat(i.projectX, i.projectY) : ClickEvent1.getClickPerfect(i.projectX, i.projectY));
                                clickEvents2.push(ClickEvent2.getClickLate(i.projectX, i.projectY));
                                i.status3 = Date.now();
                            } else {
                                i.status2 = 3; //console.log("Good(Late)", i.name);
                                clickEvents1.push(ClickEvent1.getClickGood(i.projectX, i.projectY));
                                clickEvents2.push(ClickEvent2.getClickLate(i.projectX, i.projectY));
                                i.status3 = Date.now();
                            }
                            this.splice(j, 1);
                            i.status4 = false;
                            i.status5 = deltaTime;
                            break;
                        }
                    } else if (this[j].isInArea(i.offsetX, i.offsetY, i.cosr, i.sinr, width)) i.status4 = false;
                }
                if (!isPaused && i.status3 && i.status4) {
                    i.status = 2; //console.log("Miss", i.name);
                    stat.addCombo(2, 3);
                    i.scored = true;
                }
            } else if (i.type == 4) {
                if (i.status == 4 && deltaTime < 0) {
                    if (document.getElementById("hitSong").checked) playSound(res["HitSong2"], false, true, 0);
                    clickEvents1.push(ClickEvent1.getClickPerfect(i.projectX, i.projectY));
                    stat.addCombo(4, 4);
                    i.scored = true;
                } else if (!i.status) {
                    for (let j = 0; j < this.length; j++) {
                        if (this[j].isInArea(i.offsetX, i.offsetY, i.cosr, i.sinr, width) && deltaTime < (hyperMode.checked ? 0.12 : 0.16) && (deltaTime > -(hyperMode.checked ? 0.12 : 0.16) || i.frameCount < (hyperMode.checked ? 3 : 4))) {
                            //console.log("Perfect", i.name);
                            this[j].catched = true;
                            if (this[j].type == 3) {
                                i.status = 4;
                                break;
                            }
                        }
                    }
                }
            }
        }
    }
}
const judgements = new Judgements();
class ClickEvents extends Array {
    defilter(func) {
        var i = this.length;
        while (i--) {
            if (func(this[i])) this.splice(i, 1);
        }
        return this;
    }
}
const clickEvents0 = new ClickEvents(); //存放点击特效
const clickEvents1 = new ClickEvents(); //存放点击特效
const clickEvents2 = new ClickEvents(); //存放点击特效
class ClickEvent0 {
    constructor(offsetX, offsetY, n1, n2) {
        switch (selectflip.value) {
            case "br":
                this.offsetX = Number(offsetX);
                this.offsetY = Number(offsetY);
                break;
            case "bl":
                this.offsetX = canvasos.width - Number(offsetX);
                this.offsetY = Number(offsetY);
                break;
            case "tr":
                this.offsetX = Number(offsetX);
                this.offsetY = canvas.height - Number(offsetY);
                break;
            case "tl":
                this.offsetX = canvasos.width - Number(offsetX);
                this.offsetY = canvas.height - Number(offsetY);
                break;
            default:
                throw new Error("Flip Error");
        }
        this.color = String(n1);
        this.text = String(n2);
        this.time = 0;
    }
    static getClickTap(offsetX, offsetY) {
        //console.log("Tap", offsetX, offsetY);
        return new ClickEvent0(offsetX, offsetY, "cyan", "");
    }
    static getClickHold(offsetX, offsetY) {
        //console.log("Hold", offsetX, offsetY);
        return new ClickEvent0(offsetX, offsetY, "lime", "");
    }
    static getClickMove(offsetX, offsetY) {
        //console.log("Move", offsetX, offsetY);
        return new ClickEvent0(offsetX, offsetY, "violet", "");
    }
}
class ClickEvent1 {
    constructor(offsetX, offsetY, n1, n2, n3) {
        this.offsetX = Number(offsetX) || 0;
        this.offsetY = Number(offsetY) || 0;
        this.time = Date.now();
        this.duration = 500;
        this.images = res["Clicks"][n1]; //以后做缺少检测
        this.color = String(n3);
        this.rand = Array(Number(n2) || 0).fill().map(() => [Math.random() * 80 + 185, Math.random() * 2 * Math.PI]);
    }
    static getClickPerfect(offsetX, offsetY) {
        return new ClickEvent1(offsetX, offsetY, "rgba(255,236,160,0.8823529)", 4, "#ffeca0");
    }
    static getClickGreat(offsetX, offsetY) {
        return new ClickEvent1(offsetX, offsetY, "rgba(168,255,177,0.9016907)", 4, "#a8ffb1");
    }
    static getClickGood(offsetX, offsetY) {
        return new ClickEvent1(offsetX, offsetY, "rgba(180,225,255,0.9215686)", 3, "#b4e1ff");
    }
}
class ClickEvent2 {
    constructor(offsetX, offsetY, n1, n2) {
        this.offsetX = Number(offsetX) || 0;
        this.offsetY = Number(offsetY) || 0;
        this.time = Date.now();
        this.duration = 250;
        this.color = String(n1);
        this.text = String(n2);
    }
    static getClickEarly(offsetX, offsetY) {
        //console.log("Tap", offsetX, offsetY);
        return new ClickEvent2(offsetX, offsetY, "#03aaf9", "Early");
    }
    static getClickLate(offsetX, offsetY) {
        //console.log("Hold", offsetX, offsetY);
        return new ClickEvent2(offsetX, offsetY, "#ff4612", "Late");
    }
}
//适配PC鼠标
const isMouseDown = {};
canvas.addEventListener("mousedown", function (evt) {
    evt.preventDefault();
    const idx = evt.button;
    const dx = (evt.pageX - getOffsetLeft(this)) / this.offsetWidth * this.width - (this.width - canvasos.width) / 2;
    const dy = (evt.pageY - getOffsetTop(this)) / this.offsetHeight * this.height;
    mouse[idx] = Click.activate(dx, dy);
    isMouseDown[idx] = true;
});
canvas.addEventListener("mousemove", function (evt) {
    evt.preventDefault();
    for (const idx in isMouseDown) {
        if (isMouseDown[idx]) {
            const dx = (evt.pageX - getOffsetLeft(this)) / this.offsetWidth * this.width - (this.width - canvasos.width) / 2;
            const dy = (evt.pageY - getOffsetTop(this)) / this.offsetHeight * this.height;
            mouse[idx].move(dx, dy);
        }
    }
});
canvas.addEventListener("mouseup", function (evt) {
    evt.preventDefault();
    const idx = evt.button;
    delete mouse[idx];
    delete isMouseDown[idx];
});
canvas.addEventListener("mouseout", function (evt) {
    evt.preventDefault();
    for (const idx in isMouseDown) {
        if (isMouseDown[idx]) {
            delete mouse[idx];
            delete isMouseDown[idx];
        }
    }
});
//适配键盘(喵喵喵?)
window.addEventListener("keydown", function (evt) {
    if (document.activeElement.classList.value == "input") return;
    if (btnPlay.value != "停止") return;
    evt.preventDefault();
    if (evt.key == "Shift") btnPause.click();
    else if (keyboard[evt.code] instanceof Click);
    else keyboard[evt.code] = Click.activate(NaN, NaN);
}, false);
window.addEventListener("keyup", function (evt) {
    if (document.activeElement.classList.value == "input") return;
    if (btnPlay.value != "停止") return;
    evt.preventDefault();
    if (evt.key == "Shift");
    else if (keyboard[evt.code] instanceof Click) delete keyboard[evt.code];
}, false);
window.addEventListener("blur", () => {
    for (const i in keyboard) delete keyboard[i]; //失去焦点清除键盘事件
});
//适配移动设备
const passive = {
    passive: false
}; //不加这玩意会出现warning
canvas.addEventListener("touchstart", function (evt) {
    evt.preventDefault();
    for (const i of evt.changedTouches) {
        const idx = i.identifier; //移动端存在多押bug(可能已经解决了？)
        const dx = (i.pageX - getOffsetLeft(this)) / this.offsetWidth * this.width - (this.width - canvasos.width) / 2;
        const dy = (i.pageY - getOffsetTop(this)) / this.offsetHeight * this.height;
        touch[idx] = Click.activate(dx, dy);
    }
}, passive);
canvas.addEventListener("touchmove", function (evt) {
    evt.preventDefault();
    for (const i of evt.changedTouches) {
        const idx = i.identifier;
        const dx = (i.pageX - getOffsetLeft(this)) / this.offsetWidth * this.width - (this.width - canvasos.width) / 2;
        const dy = (i.pageY - getOffsetTop(this)) / this.offsetHeight * this.height;
        touch[idx].move(dx, dy);
    }
}, passive);
canvas.addEventListener("touchend", function (evt) {
    evt.preventDefault();
    for (const i of evt.changedTouches) {
        const idx = i.identifier;
        delete touch[idx];
    }
});
canvas.addEventListener("touchcancel", function (evt) {
    evt.preventDefault();
    for (const i of evt.changedTouches) {
        const idx = i.identifier;
        delete touch[idx];
    }
});
//优化触摸定位，以后整合进class
function getOffsetLeft(element) {
    if (!(element instanceof HTMLElement)) return NaN;
    if (full.check(element)) return document.documentElement.scrollLeft;
    let elem = element;
    let a = 0;
    while (elem instanceof HTMLElement) {
        a += elem.offsetLeft;
        elem = elem.offsetParent;
    }
    return a;
}

function getOffsetTop(element) {
    if (!(element instanceof HTMLElement)) return NaN;
    if (full.check(element) && element.p) return document.documentElement.scrollTop;
    let elem = element;
    let a = 0;
    while (elem instanceof HTMLElement) {
        a += elem.offsetTop;
        elem = elem.offsetParent;
    }
    return a;
}