//note预处理
function prerenderChart(chart) {
    const chartOld = JSON.parse(JSON.stringify(chart));
    const chartNew = chartOld;
    //优化events
    for (const LineId in chartNew.judgeLineList) {
        const i = chartNew.judgeLineList[LineId];
        i.bpm *= Number(selectspeed.value);
        i.lineId = LineId;
        i.offsetX = 0;
        i.offsetY = 0;
        i.alpha = 0;
        i.rotation = 0;
        i.positionY = 0; //临时过渡用
        i.images = [res["JudgeLine"], res["JudgeLineMP"], res["JudgeLineAP"], res["JudgeLineFC"]];
        i.imageH = 0.008;
        i.imageW = 1.042;
        i.imageB = 0;
        i.speedEvents = addRealTime(arrangeSpeedEvent(i.speedEvents), i.bpm);
        i.judgeLineDisappearEvents = addRealTime(arrangeLineEvent(i.judgeLineDisappearEvents), i.bpm);
        i.judgeLineMoveEvents = addRealTime(arrangeLineEvent(i.judgeLineMoveEvents), i.bpm);
        i.judgeLineRotateEvents = addRealTime(arrangeLineEvent(i.judgeLineRotateEvents), i.bpm);
        Renderer.lines.push(i);
        for (const NoteId in i.notesAbove) addNote(i.notesAbove[NoteId], 1.875 / i.bpm, LineId, NoteId, true);
        for (const NoteId in i.notesBelow) addNote(i.notesBelow[NoteId], 1.875 / i.bpm, LineId, NoteId, false);
    }
    const sortNote = (a, b) => a.realTime - b.realTime || a.lineId - b.lineId || a.noteId - b.noteId;
    Renderer.notes.sort(sortNote);
    Renderer.taps.sort(sortNote);
    Renderer.drags.sort(sortNote);
    Renderer.holds.sort(sortNote);
    Renderer.flicks.sort(sortNote);
    Renderer.reverseholds.sort(sortNote).reverse();
    Renderer.tapholds.sort(sortNote);
    //向Renderer添加Note
    function addNote(note, base32, lineId, noteId, isAbove) {
        note.offsetX = 0;
        note.offsetY = 0;
        note.alpha = 0;
        note.rotation = 0;
        note.realTime = note.time * base32;
        note.realHoldTime = note.holdTime * base32;
        note.lineId = lineId;
        note.noteId = noteId;
        note.isAbove = isAbove;
        note.name = `${lineId}${isAbove ? "+" : "-"}${noteId}`;
        Renderer.notes.push(note);
        if (note.type == 1) Renderer.taps.push(note);
        else if (note.type == 2) Renderer.drags.push(note);
        else if (note.type == 3) Renderer.holds.push(note);
        else if (note.type == 4) Renderer.flicks.push(note);
        if (note.type == 3) Renderer.reverseholds.push(note);
        if (note.type == 1 || note.type == 3) Renderer.tapholds.push(note);
    }
    //合并不同方向note
    for (const i of chartNew.judgeLineList) {
        i.notes = [];
        for (const j of i.notesAbove) {
            j.isAbove = true;
            i.notes.push(j);
        }
        for (const j of i.notesBelow) {
            j.isAbove = false;
            i.notes.push(j);
        }
    }
    //双押提示
    const timeOfMulti = {};
    for (const i of Renderer.notes) timeOfMulti[i.realTime.toFixed(6)] = timeOfMulti[i.realTime.toFixed(6)] ? 2 : 1;
    for (const i of Renderer.notes) i.isMulti = (timeOfMulti[i.realTime.toFixed(6)] == 2);
    return chartNew;
    //规范判定线事件
    function arrangeLineEvent(events) {
        const oldEvents = JSON.parse(JSON.stringify(events)); //深拷贝
        const newEvents = [{ //以1-1e6开头
            startTime: 1 - 1e6,
            endTime: 0,
            start: oldEvents[0] ? oldEvents[0].start : 0,
            end: oldEvents[0] ? oldEvents[0].end : 0,
            start2: oldEvents[0] ? oldEvents[0].start2 : 0,
            end2: oldEvents[0] ? oldEvents[0].end2 : 0
        }];
        oldEvents.push({ //以1e9结尾
            startTime: 0,
            endTime: 1e9,
            start: oldEvents[oldEvents.length - 1] ? oldEvents[oldEvents.length - 1].start : 0,
            end: oldEvents[oldEvents.length - 1] ? oldEvents[oldEvents.length - 1].end : 0,
            start2: oldEvents[oldEvents.length - 1] ? oldEvents[oldEvents.length - 1].start2 : 0,
            end2: oldEvents[oldEvents.length - 1] ? oldEvents[oldEvents.length - 1].end2 : 0
        });
        for (const i2 of oldEvents) { //保证时间连续性
            const i1 = newEvents[newEvents.length - 1];
            if (i1.endTime > i2.endTime);
            else if (i1.endTime == i2.startTime) newEvents.push(i2);
            else if (i1.endTime < i2.startTime) newEvents.push({
                startTime: i1.endTime,
                endTime: i2.startTime,
                start: i1.end,
                end: i1.end,
                start2: i1.end2,
                end2: i1.end2
            }, i2);
            else if (i1.endTime > i2.startTime) newEvents.push({
                startTime: i1.endTime,
                endTime: i2.endTime,
                start: (i2.start * (i2.endTime - i1.endTime) + i2.end * (i1.endTime - i2.startTime)) / (i2.endTime - i2.startTime),
                end: i1.end,
                start2: (i2.start2 * (i2.endTime - i1.endTime) + i2.end2 * (i1.endTime - i2.startTime)) / (i2.endTime - i2.startTime),
                end2: i1.end2
            });
        }
        //合并相同变化率事件
        const newEvents2 = [newEvents.shift()];
        for (const i2 of newEvents) {
            const i1 = newEvents2[newEvents2.length - 1];
            const d1 = i1.endTime - i1.startTime;
            const d2 = i2.endTime - i2.startTime;
            if (i2.startTime == i2.endTime);
            else if (i1.end == i2.start && i1.end2 == i2.start2 && (i1.end - i1.start) * d2 == (i2.end - i2.start) * d1 && (i1.end2 - i1.start2) * d2 == (i2.end2 - i2.start2) * d1) {
                i1.endTime = i2.endTime;
                i1.end = i2.end;
                i1.end2 = i2.end2;
            } else newEvents2.push(i2);
        }
        return JSON.parse(JSON.stringify(newEvents2));
    }
    //规范speedEvents
    function arrangeSpeedEvent(events) {
        const newEvents = [];
        for (const i2 of events) {
            const i1 = newEvents[newEvents.length - 1];
            if (!i1 || i1.value != i2.value) newEvents.push(i2);
            else i1.endTime = i2.endTime;
        }
        return JSON.parse(JSON.stringify(newEvents));
    }
    //添加realTime
    function addRealTime(events, bpm) {
        for (const i of events) {
            i.startRealTime = i.startTime / bpm * 1.875;
            i.endRealTime = i.endTime / bpm * 1.875;
            i.startDeg = -Deg * i.start;
            i.endDeg = -Deg * i.end;
        }
        return events;
    }
}
document.addEventListener("visibilitychange", () => document.visibilityState == "hidden" && btnPause.value == "暂停" && btnPause.click());
document.addEventListener("pagehide", () => document.visibilityState == "hidden" && btnPause.value == "暂停" && btnPause.click()); //兼容Safari
const timeSinceStart = new Timer();
const timeSinceAnim = new Timer();
const timeSinceEnd = new Timer();
//play
btnPlay.addEventListener("click", async function () {
    btnPause.value = "暂停";
    if (this.value == "播放") {
        stopPlaying.push(playSound(res["mute"], true, false, 0)); //播放空音频(防止音画不同步)
        ("lines,notes,taps,drags,flicks,holds,reverseholds,tapholds").split(",").map(i => Renderer[i] = []);
        Renderer.chart = prerenderChart(charts[selectchart.value]); //fuckqwq
        stat.reset(Renderer.chart.numOfNotes, Renderer.chart.md5);
        for (const i of chartLineData) {
            if (selectchart.value == i.Chart) {
                Renderer.chart.judgeLineList[i.LineId].images[0] = bgs[i.Image];
                Renderer.chart.judgeLineList[i.LineId].images[1] = await createImageBitmap(imgShader(bgs[i.Image], "#feffa9"));
                Renderer.chart.judgeLineList[i.LineId].images[2] = await createImageBitmap(imgShader(bgs[i.Image], "#a3ffac"));
                Renderer.chart.judgeLineList[i.LineId].images[3] = await createImageBitmap(imgShader(bgs[i.Image], "#a2eeff"));
                Renderer.chart.judgeLineList[i.LineId].imageH = Number(i.Vert);
                Renderer.chart.judgeLineList[i.LineId].imageW = Number(i.Horz);
                Renderer.chart.judgeLineList[i.LineId].imageB = Number(i.IsDark);
            }
        }
        Renderer.bgImage = bgs[selectbg.value] || res["NoImage"];
        Renderer.bgImageBlur = bgsBlur[selectbg.value] || res["NoImage"];
        Renderer.bgMusic = bgms[selectbgm.value];
        this.value = "停止";
        resizeCanvas();
        duration = Renderer.bgMusic.duration / Number(selectspeed.value);
        isInEnd = false;
        isOutStart = false;
        isOutEnd = false;
        isPaused = false;
        timeBgm = 0;
        if (!showTransition.checked) timeSinceStart.addTime(3000);
        canvas.classList.remove("fade");
        mask.classList.add("fade");
        btnPause.classList.remove("disabled");
        for (const i of document.querySelectorAll(".disabled-when-playing")) i.classList.add("disabled");
        loop();
        timeSinceStart.play();
    } else {
        while (stopPlaying.length) stopPlaying.shift()();
        cancelAnimationFrame(stopDrawing);
        resizeCanvas();
        canvas.classList.add("fade");
        mask.classList.remove("fade");
        for (const i of document.querySelectorAll(".disabled-when-playing")) i.classList.remove("disabled");
        btnPause.classList.add("disabled");
        //清除原有数据
        fucktemp = false;
        fucktemp2 = false;
        clickEvents0.length = 0;
        clickEvents1.length = 0;
        clickEvents2.length = 0;
        timeSinceStart.reset();
        timeSinceAnim.reset();
        timeSinceEnd.reset();
        curTime = 0;
        curTimestamp = 0;
        duration = 0;
        this.value = "播放";
    }
});
btnPause.addEventListener("click", function () {
    if (this.classList.contains("disabled") || btnPlay.value == "播放") return;
    if (this.value == "暂停") {
        timeSinceStart.pause();
        if (showTransition.checked && isOutStart) timeSinceAnim.pause();
        isPaused = true;
        this.value = "继续";
        curTime = timeBgm;
        while (stopPlaying.length) stopPlaying.shift()();
    } else {
        timeSinceStart.play();
        if (showTransition.checked && isOutStart) timeSinceAnim.play();
        isPaused = false;
        if (isInEnd && !isOutStart) playBgm(Renderer.bgMusic, timeBgm * Number(selectspeed.value));
        this.value = "暂停";
    }
});
inputOffset.addEventListener("input", function () {
    if (this.value < -400) this.value = -400;
    if (this.value > 600) this.value = 600;
});
//播放bgm
function playBgm(data, offset) {
    isPaused = false;
    if (!offset) offset = 0;
    curTimestamp = Date.now();
    stopPlaying.push(playSound(data, false, true, offset, Number(selectspeed.value)));
}
let fucktemp = false;
let fucktemp2 = false;
//作图
function loop() {
    const now = Date.now();
    //计算时间
    if (timeSinceAnim.second < 0.67) {
        calcAngle(now);
        draw(now);
    } else if (!fucktemp) drawSettlementBG();
    if (fucktemp2) drawSettlement(fucktemp2);
    ctx.globalAlpha = 1;
    if (document.getElementById("imageBlur").checked) ctx.drawImage(Renderer.bgImageBlur, ...adjustSize(Renderer.bgImageBlur, canvas, 1.1));
    else ctx.drawImage(Renderer.bgImage, ...adjustSize(Renderer.bgImage, canvas, 1.1));
    ctx.fillStyle = "#000";
    ctx.globalAlpha = 0.4;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.globalAlpha = 1;
    ctx.drawImage(canvasos, (canvas.width - canvasos.width) / 2, 0);
    //Copyright
    ctx.font = `${lineScale * 0.4}px Mina`;
    ctx.fillStyle = "#ccc";
    ctx.globalAlpha = 0.8;
    ctx.textAlign = "right";
    ctx.textBaseline = "middle";
    ctx.fillText(`Phisimulator`, (canvas.width + canvasos.width) / 2 - lineScale * 0.1, canvas.height - lineScale * 0.2);
    stopDrawing = requestAnimationFrame(loop); //回调更新动画
}

function calcAngle(now) { // 计算判定线和Note的角度
    if (!isInEnd && timeSinceStart.second >= 3) {
        isInEnd = true;
        playBgm(Renderer.bgMusic);
    }
    if (!isPaused && isInEnd && !isOutStart) timeBgm = (now - curTimestamp) / 1e3 + curTime;
    if (timeBgm >= duration) isOutStart = true;
    if (showTransition.checked && isOutStart && !isOutEnd) {
        isOutEnd = true;
        timeSinceAnim.play();
    }
    timeChart = Math.max(timeBgm - Renderer.chart.offset / Number(selectspeed.value) - (Number(inputOffset.value) / 1e3 || 0), 0);
    //遍历判定线events和Note
    for (const line of Renderer.lines) {
        for (const i of line.judgeLineDisappearEvents) {
            if (timeChart < i.startRealTime) break;
            if (timeChart > i.endRealTime) continue;
            const t2 = (timeChart - i.startRealTime) / (i.endRealTime - i.startRealTime);
            const t1 = 1 - t2;
            line.alpha = i.start * t1 + i.end * t2;
        }
        for (const i of line.judgeLineMoveEvents) {
            if (timeChart < i.startRealTime) break;
            if (timeChart > i.endRealTime) continue;
            const t2 = (timeChart - i.startRealTime) / (i.endRealTime - i.startRealTime);
            const t1 = 1 - t2;
            line.offsetX = canvasos.width * (i.start * t1 + i.end * t2);
            line.offsetY = canvasos.height * (1 - i.start2 * t1 - i.end2 * t2);
        }
        for (const i of line.judgeLineRotateEvents) {
            if (timeChart < i.startRealTime) break;
            if (timeChart > i.endRealTime) continue;
            const t2 = (timeChart - i.startRealTime) / (i.endRealTime - i.startRealTime);
            const t1 = 1 - t2;
            line.rotation = i.startDeg * t1 + i.endDeg * t2;
            line.cosr = Math.cos(line.rotation);
            line.sinr = Math.sin(line.rotation);
        }
        for (const i of line.speedEvents) {
            if (timeChart < i.startRealTime) break;
            if (timeChart > i.endRealTime) continue;
            line.positionY = (timeChart - i.startRealTime) * i.value * Number(selectspeed.value) + i.floorPosition;
        }
        for (const i of line.notesAbove) {
            i.cosr = line.cosr;
            i.sinr = line.sinr;
            setAlpha(i, wlen2 * i.positionX, hlen2 * getY(i));
        }
        for (const i of line.notesBelow) {
            i.cosr = -line.cosr;
            i.sinr = -line.sinr;
            setAlpha(i, -wlen2 * i.positionX, hlen2 * getY(i));
        }

        function getY(i) {
            if (!i.badtime) return realgetY(i);
            if (Date.now() - i.badtime > 500) delete i.badtime;
            if (!i.badY) i.badY = realgetY(i);
            return i.badY;
        }

        function realgetY(i) {
            if (i.type != 3) return (i.floorPosition - line.positionY) * i.speed;
            if (i.realTime < timeChart) return (i.realTime - timeChart) * i.speed * Number(selectspeed.value);
            return i.floorPosition - line.positionY;
        }

        function setAlpha(i, dx, dy) {
            i.projectX = line.offsetX + dx * i.cosr;
            i.offsetX = i.projectX + dy * i.sinr;
            i.projectY = line.offsetY + dx * i.sinr;
            i.offsetY = i.projectY - dy * i.cosr;
            i.visible = Math.abs(i.offsetX - wlen) + Math.abs(i.offsetY - hlen) < wlen * 1.23625 + hlen + hlen2 * i.realHoldTime * i.speed * Number(selectspeed.value);
            if (i.badtime) i.alpha = 1 - range((Date.now() - i.badtime) / 500);
            else if (i.realTime > timeChart) {
                if (dy > -1e-3 * hlen2) i.alpha = (i.type == 3 && i.speed == 0) ? (showPoint.checked ? 0.45 : 0) : 1;
                else i.alpha = showPoint.checked ? 0.45 : 0;
                //i.frameCount = 0;
            } else {
                if (i.type == 3) i.alpha = i.speed == 0 ? (showPoint.checked ? 0.45 : 0) : (i.status % 4 == 2 ? 0.45 : 1);
                else i.alpha = Math.max(1 - (timeChart - i.realTime) / (hyperMode.checked ? 0.12 : 0.16), 0); //过线后0.16s消失
                i.frameCount = isNaN(i.frameCount) ? 0 : i.frameCount + 1;
            }
        }
    }
    if (isInEnd) {
        judgements.addJudgement(Renderer.notes, timeChart);
        judgements.judgeNote(Renderer.drags, timeChart, canvasos.width * 0.117775);
        judgements.judgeNote(Renderer.flicks, timeChart, canvasos.width * 0.117775);
        judgements.judgeNote(Renderer.tapholds, timeChart, canvasos.width * 0.117775); //播放打击音效和判定
    }
    taps.length = 0; //qwq
    frameTimer.addTick(); //计算fps
    clickEvents0.defilter(i => i.time++ > 0); //清除打击特效
    clickEvents1.defilter(i => now >= i.time + i.duration); //清除打击特效
    clickEvents2.defilter(i => now >= i.time + i.duration); //清除打击特效
    for (const i in mouse) mouse[i] instanceof Click && mouse[i].animate();
    for (const i in touch) touch[i] instanceof Click && touch[i].animate();
}

function draw(now) { // 游玩画面
    ctxos.clearRect(0, 0, canvasos.width, canvasos.height); //重置画面
    ctxos.globalCompositeOperation = "destination-over"; //由后往前绘制
    ctxos.drawImage(res["Tap"], 0, 0);
    if (document.getElementById("showCE2").checked)
        for (const i of clickEvents2) { //绘制打击特效2
            const tick = (now - i.time) / i.duration;
            ctxos.setTransform(...imgFlip(1, 0, 0, 1, i.offsetX, i.offsetY)); //缩放
            if (selectflip.value[0] == "t") ctxos.transform(-1, 0, 0, -1, 0, 0); //qwq
            ctxos.font = `bold ${noteScale * (256 + 128 * (((0.2078 * tick - 1.6524) * tick + 1.6399) * tick + 0.4988))}px Mina`;
            ctxos.textAlign = "center";
            ctxos.textBaseline = "middle";
            ctxos.fillStyle = i.color;
            ctxos.globalAlpha = 1 - tick; //不透明度
            ctxos.fillText(i.text, 0, -noteScale * 192);
        }
    for (const i of clickEvents1) { //绘制打击特效1
        const tick = (now - i.time) / i.duration;
        ctxos.globalAlpha = 1;
        ctxos.setTransform(...imgFlip(noteScale * 6, 0, 0, noteScale * 6, i.offsetX, i.offsetY)); //缩放
        ctxos.drawImage(i.images[parseInt(tick * 30)] || i.images[i.images.length - 1], -128, -128); //停留约0.5秒
        ctxos.fillStyle = i.color;
        ctxos.globalAlpha = 1 - tick; //不透明度
        const r3 = 30 * (((0.2078 * tick - 1.6524) * tick + 1.6399) * tick + 0.4988); //方块大小
        for (const j of i.rand) {
            const ds = j[0] * (9 * tick / (8 * tick + 1)); //打击点距离
            ctxos.fillRect(ds * Math.cos(j[1]) - r3 / 2, ds * Math.sin(j[1]) - r3 / 2, r3, r3);
        }
    }
    if (document.getElementById("feedback").checked) {
        for (const i of clickEvents0) { //绘制打击特效0
            ctxos.globalAlpha = 0.85;
            ctxos.setTransform(...imgFlip(1, 0, 0, 1, i.offsetX, i.offsetY)); //缩放
            ctxos.fillStyle = i.color;
            ctxos.beginPath();
            ctxos.arc(0, 0, lineScale * 0.5, 0, 2 * Math.PI);
            ctxos.fill();
            i.time++;
        }
    }
    if (timeSinceStart.second >= 3 && timeSinceAnim.second == 0) {
        if (showPoint.checked) { //绘制定位点
            ctxos.font = `${lineScale}px Mina`;
            ctxos.textAlign = "center";
            ctxos.textBaseline = "bottom";
            for (const i of Renderer.notes) {
                if (!i.visible) continue;
                ctxos.setTransform(...imgFlip(i.cosr, i.sinr, -i.sinr, i.cosr, i.offsetX, i.offsetY));
                ctxos.fillStyle = "cyan";
                ctxos.globalAlpha = i.realTime > timeChart ? 1 : 0.5;
                ctxos.fillText(i.name, 0, -lineScale * 0.1);
                ctxos.globalAlpha = 1;
                ctxos.fillStyle = "lime";
                ctxos.fillRect(-lineScale * 0.2, -lineScale * 0.2, lineScale * 0.4, lineScale * 0.4);
            }
            for (const i of Renderer.lines) {
                ctxos.setTransform(...imgFlip(i.cosr, i.sinr, -i.sinr, i.cosr, i.offsetX, i.offsetY));
                ctxos.fillStyle = "yellow";
                ctxos.globalAlpha = (i.alpha + 0.5) / 1.5;
                ctxos.fillText(i.lineId, 0, -lineScale * 0.1);
                ctxos.globalAlpha = 1;
                ctxos.fillStyle = "violet";
                ctxos.fillRect(-lineScale * 0.2, -lineScale * 0.2, lineScale * 0.4, lineScale * 0.4);
            }
        }
        //绘制note
        for (const i of Renderer.flicks) drawNote(i, timeChart, 4);
        for (const i of Renderer.taps) drawNote(i, timeChart, 1);
        for (const i of Renderer.drags) drawNote(i, timeChart, 2);
        for (const i of Renderer.reverseholds) drawNote(i, timeChart, 3);
    }
    //绘制背景
    if (timeSinceStart.second >= 2.5) drawLine(stat.lineStatus ? 2 : 1); //绘制判定线(背景前1)
    ctxos.resetTransform();
    ctxos.fillStyle = "#000"; //背景变暗
    ctxos.globalAlpha = selectglobalalpha.value == "" ? 0.6 : selectglobalalpha.value; //背景不透明度
    ctxos.fillRect(0, 0, canvasos.width, canvasos.height);
    if (timeSinceStart.second >= 2.5 && !stat.lineStatus) drawLine(0); //绘制判定线(背景后0)
    ctxos.globalAlpha = 1;
    ctxos.resetTransform();
    if (document.getElementById("imageBlur").checked) {
        ctxos.drawImage(Renderer.bgImageBlur, ...adjustSize(Renderer.bgImageBlur, canvasos, 1));
    } else {
        ctxos.drawImage(Renderer.bgImage, ...adjustSize(Renderer.bgImage, canvasos, 1));
    }
    ctxos.fillRect(0, 0, canvasos.width, canvasos.height);
    ctxos.globalCompositeOperation = "source-over";
    //绘制进度条
    ctxos.setTransform(canvasos.width / 1920, 0, 0, canvasos.width / 1920, 0, lineScale * (timeSinceStart.second < 0.67 ? (tween[2](timeSinceStart.second * 1.5) - 1) : -tween[2](timeSinceAnim.second * 1.5)) * 1.75);
    ctxos.drawImage(res["ProgressBar"], timeBgm / duration * 1920 - 1920, 0);
    //绘制文字
    ctxos.resetTransform();
    ctxos.fillStyle = "#fff";
    //开头过渡动画
    if (timeSinceStart.second < 3) {
        if (timeSinceStart.second < 0.67) ctxos.globalAlpha = tween[2](timeSinceStart.second * 1.5);
        else if (timeSinceStart.second >= 2.5) ctxos.globalAlpha = tween[2](6 - timeSinceStart.second * 2);
        ctxos.textAlign = "center";
        //歌名
        ctxos.textBaseline = "alphabetic";
        ctxos.font = `${lineScale * 1.1}px Mina`;
        ctxos.fillText(inputName.value || inputName.placeholder, wlen, hlen * 0.75);
        //曲绘和谱师
        ctxos.textBaseline = "top";
        ctxos.font = `${lineScale * 0.55}px Mina`;
        ctxos.fillText(`Illustration designed by ${inputIllustrator.value || inputIllustrator.placeholder}`, wlen, hlen * 1.25 + lineScale * 0.15);
        ctxos.fillText(`Level designed by ${inputDesigner.value || inputDesigner.placeholder}`, wlen, hlen * 1.25 + lineScale * 1.0);
        //判定线(装饰用)
        ctxos.globalAlpha = 1;
        ctxos.setTransform(1, 0, 0, 1, wlen, hlen);
        const imgW = lineScale * 48 * (timeSinceStart.second < 0.67 ? tween[3](timeSinceStart.second * 1.5) : 1);
        const imgH = lineScale * 0.15;
        if (timeSinceStart.second >= 2.5) ctxos.globalAlpha = tween[2](6 - timeSinceStart.second * 2);
        ctxos.drawImage(lineColor.checked ? res["JudgeLineMP"] : res["JudgeLine"], -imgW / 2, -imgH / 2, imgW, imgH);
    }
    //绘制分数和combo以及暂停按钮
    ctxos.globalAlpha = 1;
    ctxos.setTransform(1, 0, 0, 1, 0, lineScale * (timeSinceStart.second < 0.67 ? (tween[2](timeSinceStart.second * 1.5) - 1) : -tween[2](timeSinceAnim.second * 1.5)) * 1.75);
    ctxos.textBaseline = "alphabetic";
    ctxos.font = `${lineScale * 0.95}px Mina`;
    ctxos.textAlign = "right";
    ctxos.fillText(stat.scoreStr, canvasos.width - lineScale * 0.65, lineScale * 1.375);
    if (!qwq[0]) ctxos.drawImage(res["Pause"], lineScale * 0.6, lineScale * 0.7, lineScale * 0.63, lineScale * 0.7);
    if (stat.combo > 2) {
        ctxos.textAlign = "center";
        ctxos.font = `${lineScale * 1.32}px Mina`;
        ctxos.fillText(stat.combo, wlen, lineScale * 1.375);
        ctxos.globalAlpha = timeSinceStart.second < 0.67 ? tween[2](timeSinceStart.second * 1.5) : (1 - tween[2](timeSinceAnim.second * 1.5));
        ctxos.font = `${lineScale * 0.66}px Mina`;
        ctxos.fillText(autoplay.checked ? "Autoplay" : "combo", wlen, lineScale * 2.05);
    }
    //绘制歌名和等级
    ctxos.globalAlpha = 1;
    ctxos.setTransform(1, 0, 0, 1, 0, lineScale * (timeSinceStart.second < 0.67 ? (1 - tween[2](timeSinceStart.second * 1.5)) : tween[2](timeSinceAnim.second * 1.5)) * 1.75);
    ctxos.textBaseline = "alphabetic";
    ctxos.textAlign = "right";
    ctxos.font = `${lineScale * 0.63}px Mina`;
    ctxos.fillText(inputLevel.value || inputLevel.placeholder, canvasos.width - lineScale * 0.75, canvasos.height - lineScale * 0.66);
    ctxos.drawImage(res["SongsNameBar"], lineScale * 0.53, canvasos.height - lineScale * 1.22, lineScale * 0.119, lineScale * 0.612);
    ctxos.textAlign = "left";
    ctxos.fillText(inputName.value || inputName.placeholder, lineScale * 0.85, canvasos.height - lineScale * 0.66);
    ctxos.resetTransform();
    if (qwq[0]) {
        //绘制时间和帧率以及note打击数
        if (timeSinceStart.second < 0.67) ctxos.globalAlpha = tween[2](timeSinceStart.second * 1.5);
        else ctxos.globalAlpha = 1 - tween[2](timeSinceAnim.second * 1.5);
        ctxos.textBaseline = "middle";
        ctxos.font = `${lineScale * 0.4}px Mina`;
        ctxos.textAlign = "left";
        ctxos.fillText(`${time2Str(timeBgm)}/${time2Str(duration)}${scfg()}`, lineScale * 0.05, lineScale * 0.5);
        ctxos.textAlign = "right";
        ctxos.fillText(frameTimer.fps, canvasos.width - lineScale * 0.05, lineScale * 0.5);
        ctxos.textBaseline = "alphabetic";
        if (showPoint.checked) stat.combos.forEach((val, idx) => {
            ctxos.fillStyle = comboColor[idx];
            ctxos.fillText(val, lineScale * (idx + 1) * 1.1, canvasos.height - lineScale * 0.1);
        });
    }
    //判定线函数，undefined/0:默认,1:非,2:恒成立
    function drawLine(bool) {
        ctxos.globalAlpha = 1;
        const tw = 1 - tween[2](timeSinceAnim.second * 1.5);
        for (const i of Renderer.lines) {
            if (bool ^ i.imageB && timeSinceAnim.second < 0.67) {
                ctxos.globalAlpha = i.alpha;
                ctxos.setTransform(...imgFlip(i.cosr * tw, i.sinr, -i.sinr * tw, i.cosr, wlen + (i.offsetX - wlen) * tw, i.offsetY)); //hiahiah
                const imgH = i.imageH > 0 ? lineScale * 18.75 * i.imageH : canvasos.height * -i.imageH; // hlen*0.008
                const imgW = imgH * i.images[0].width / i.images[0].height * i.imageW; //* 38.4*25 * i.imageH* i.imageW; //wlen*3
                ctxos.drawImage(i.images[lineColor.checked ? stat.lineStatus : 0], -imgW / 2, -imgH / 2, imgW, imgH);
            }
        }
    }
}

function drawSettlementBG() { //结算背景
    fucktemp = true;
    btnPause.click(); //isPaused = true;
    while (stopPlaying.length) stopPlaying.shift()();
    cancelAnimationFrame(stopDrawing);
    btnPause.classList.add("disabled");
    ctxos.globalCompositeOperation = "source-over";
    ctxos.resetTransform();
    ctxos.globalAlpha = 1;
    if (document.getElementById("imageBlur").checked) {
        ctxos.drawImage(Renderer.bgImageBlur, ...adjustSize(Renderer.bgImageBlur, canvasos, 1));
        ctx.drawImage(Renderer.bgImageBlur, ...adjustSize(Renderer.bgImageBlur, canvas, 1));
    } else {
        ctxos.drawImage(Renderer.bgImage, ...adjustSize(Renderer.bgImage, canvasos, 1));
        ctx.drawImage(Renderer.bgImage, ...adjustSize(Renderer.bgImage, canvas, 1));
    }
    ctxos.fillStyle = "#000"; //背景变暗
    ctxos.globalAlpha = selectglobalalpha.value == "" ? 0.6 : selectglobalalpha.value; //背景不透明度
    ctxos.fillRect(0, 0, canvasos.width, canvasos.height);
    const difficulty = ["ez", "hd", "in", "at"].indexOf(inputLevel.value.slice(0, 2).toLocaleLowerCase());
    const xhr = new XMLHttpRequest();
    xhr.open("get", `src/LevelOver${difficulty < 0 ? 2 : difficulty}${hyperMode.checked ? "_v2" : ""}.ogg`, true);
    xhr.responseType = 'arraybuffer';
    xhr.send();
    xhr.onload = async () => {
        const bgm = await actx.decodeAudioData(xhr.response);
        const timeout = setTimeout(() => {
            if (!fucktemp) return;
            stopPlaying.push(playSound(bgm, true, true, 0));
            timeSinceEnd.reset();
            timeSinceEnd.play();
            fucktemp2 = stat.getData(autoplay.checked);
        }, 1000);
        stopPlaying.push(() => clearTimeout(timeout));
    }
}

function drawSettlement(statData) { //结算页面文字
    ctxos.resetTransform();
    ctxos.globalCompositeOperation = "source-over";
    ctxos.clearRect(0, 0, canvasos.width, canvasos.height);
    ctxos.globalAlpha = 1;
    if (document.getElementById("imageBlur").checked) ctxos.drawImage(Renderer.bgImageBlur, ...adjustSize(Renderer.bgImageBlur, canvasos, 1));
    else ctxos.drawImage(Renderer.bgImage, ...adjustSize(Renderer.bgImage, canvasos, 1));
    ctxos.fillStyle = "#000"; //背景变暗
    ctxos.globalAlpha = selectglobalalpha.value == "" ? 0.6 : selectglobalalpha.value; //背景不透明度
    ctxos.fillRect(0, 0, canvasos.width, canvasos.height);
    ctxos.globalCompositeOperation = "destination-out";
    ctxos.globalAlpha = 1;
    const k = 3.7320508075688776; //tan75°
    ctxos.setTransform(canvasos.width - canvasos.height / k, 0, -canvasos.height / k, canvasos.height, canvasos.height / k, 0);
    ctxos.fillRect(0, 0, 1, tween[8](range((timeSinceEnd.second - 0.13) * 0.94)));
    ctxos.resetTransform();
    ctxos.globalCompositeOperation = "destination-over";
    const qwq0 = (canvasos.width - canvasos.height / k) / (16 - 9 / k);
    ctxos.setTransform(qwq0 / 120, 0, 0, qwq0 / 120, wlen - qwq0 * 8, hlen - qwq0 * 4.5); //?
    ctxos.drawImage(res["LevelOver4"], 183, 42, 1184, 228);
    ctxos.globalAlpha = range((timeSinceEnd.second - 0.27) / 0.83);
    ctxos.drawImage(res["LevelOver1"], 102, 378);
    ctxos.globalCompositeOperation = "source-over";
    ctxos.globalAlpha = 1;
    ctxos.drawImage(res["LevelOver5"], 700 * tween[8](range(timeSinceEnd.second * 1.25)) - 369, 91, 20, 80);
    //歌名和等级
    ctxos.fillStyle = "#fff";
    ctxos.textBaseline = "middle";
    ctxos.textAlign = "left";
    ctxos.font = "80px Mina";
    ctxos.fillText(inputName.value || inputName.placeholder, 700 * tween[8](range(timeSinceEnd.second * 1.25)) - 320, 145);
    ctxos.font = "30px Mina";
    ctxos.fillText(inputLevel.value || inputLevel.placeholder, 700 * tween[8](range(timeSinceEnd.second * 1.25)) - 317, 208);
    //Rank图标
    ctxos.globalAlpha = range((timeSinceEnd.second - 1.87) * 3.75);
    const qwq2 = 293 + range((timeSinceEnd.second - 1.87) * 3.75) * 100;
    const qwq3 = 410 - range((timeSinceEnd.second - 1.87) * 2.14) * 164;
    ctxos.drawImage(res["LevelOver3"], 661 - qwq2 / 2, 545 - qwq2 / 2, qwq2, qwq2);
    ctxos.drawImage(res["Ranks"][stat.rankStatus], 661 - qwq3 / 2, 545 - qwq3 / 2, qwq3, qwq3);
    //各种数据
    ctxos.globalAlpha = range((timeSinceEnd.second - 0.87) * 2.50);
    ctxos.fillStyle = statData[0] ? "#18ffbf" : "#fff";
    ctxos.fillText(statData[0] ? "NEW BEST" : "BEST", 898, 428);
    ctxos.fillStyle = "#fff";
    ctxos.textAlign = "center";
    ctxos.fillText(statData[1], 1180, 428);
    ctxos.globalAlpha = range((timeSinceEnd.second - 1.87) * 2.50);
    ctxos.textAlign = "right";
    ctxos.fillText(statData[2], 1414, 428);
    ctxos.globalAlpha = range((timeSinceEnd.second - 0.95) * 1.50);
    ctxos.textAlign = "left";
    ctxos.fillText(stat.accStr, 352, 545);
    ctxos.fillText(stat.maxcombo, 1528, 545);
    ctxos.fillStyle = statData[4];
    ctxos.fillText(statData[3], 1355, 590);
    ctxos.fillStyle = "#fff";
    ctxos.textAlign = "center";
    ctxos.font = "86px Mina";
    ctxos.globalAlpha = range((timeSinceEnd.second - 1.12) * 2.00);
    ctxos.fillText(stat.scoreStr, 1075, 554);
    ctxos.font = "26px Mina";
    ctxos.globalAlpha = range((timeSinceEnd.second - 0.87) * 2.50);
    ctxos.fillText(stat.perfect, 891, 645);
    ctxos.globalAlpha = range((timeSinceEnd.second - 1.07) * 2.50);
    ctxos.fillText(stat.good, 1043, 645);
    ctxos.globalAlpha = range((timeSinceEnd.second - 1.27) * 2.50);
    ctxos.fillText(stat.noteRank[6], 1196, 645);
    ctxos.globalAlpha = range((timeSinceEnd.second - 1.47) * 2.50);
    ctxos.fillText(stat.noteRank[2], 1349, 645);
    ctxos.font = "22px Mina";
    const qwq4 = range((qwq[3] > 0 ? timeSinceEnd.second - qwq[3] : 0.2 - timeSinceEnd.second - qwq[3]) * 5.00);
    ctxos.globalAlpha = 0.8 * range((timeSinceEnd.second - 0.87) * 2.50) * qwq4;
    ctxos.fillStyle = "#696";
    ctxos.fill(new Path2D("M841,718s-10,0-10,10v80s0,10,10,10h100s10,0,10-10v-80s0-10-10-10h-40l-10-20-10,20h-40z"));
    ctxos.globalAlpha = 0.8 * range((timeSinceEnd.second - 1.07) * 2.50) * qwq4;
    ctxos.fillStyle = "#669";
    ctxos.fill(new Path2D("M993,718s-10,0-10,10v80s0,10,10,10h100s10,0,10-10v-80s0-10-10-10h-40l-10-20-10,20h-40z"));
    ctxos.fillStyle = "#fff";
    ctxos.globalAlpha = range((timeSinceEnd.second - 0.97) * 2.50) * qwq4;
    ctxos.fillText("Early: " + stat.noteRank[5], 891, 755);
    ctxos.fillText("Late: " + stat.noteRank[1], 891, 788);
    ctxos.globalAlpha = range((timeSinceEnd.second - 1.17) * 2.50) * qwq4;
    ctxos.fillText("Early: " + stat.noteRank[7], 1043, 755);
    ctxos.fillText("Late: " + stat.noteRank[3], 1043, 788);
    ctxos.resetTransform();
    ctxos.globalCompositeOperation = "destination-over";
    ctxos.globalAlpha = 1;
    ctxos.fillStyle = "#000";
    ctxos.drawImage(Renderer.bgImage, ...adjustSize(Renderer.bgImage, canvasos, 1));
    ctxos.fillRect(0, 0, canvasos.width, canvasos.height);
}

function range(num) {
    if (num < 0) return 0;
    if (num > 1) return 1;
    return num;
}

//绘制Note
function drawNote(note, realTime, type) {
    const HL = note.isMulti && document.getElementById("highLight").checked;
    if (!note.visible) return;
    if (note.type != 3 && note.scored && !note.badtime) return;
    if (note.type == 3 && note.realTime + note.realHoldTime < realTime) return; //qwq
    ctxos.globalAlpha = note.alpha;
    ctxos.setTransform(...imgFlip(noteScale * note.cosr, noteScale * note.sinr, -noteScale * note.sinr, noteScale * note.cosr, note.offsetX, note.offsetY));
    if (type == 3) {
        const baseLength = hlen2 / noteScale * note.speed * Number(selectspeed.value);
        const holdLength = baseLength * note.realHoldTime;
        if (note.realTime > realTime) {
            if (HL) {
                ctxos.drawImage(res["HoldHeadHL"], -res["HoldHeadHL"].width * 1.026 * 0.5, 0, res["HoldHeadHL"].width * 1.026, res["HoldHeadHL"].height * 1.026);
                ctxos.drawImage(res["HoldHL"], -res["HoldHL"].width * 1.026 * 0.5, -holdLength, res["HoldHL"].width * 1.026, holdLength);
            } else {
                ctxos.drawImage(res["HoldHead"], -res["HoldHead"].width * 0.5, 0);
                ctxos.drawImage(res["Hold"], -res["Hold"].width * 0.5, -holdLength, res["Hold"].width, holdLength);
            }
            ctxos.drawImage(res["HoldEnd"], -res["HoldEnd"].width * 0.5, -holdLength - res["HoldEnd"].height);
        } else {
            if (HL) ctxos.drawImage(res["HoldHL"], -res["HoldHL"].width * 1.026 * 0.5, -holdLength, res["HoldHL"].width * 1.026, holdLength - baseLength * (realTime - note.realTime));
            else ctxos.drawImage(res["Hold"], -res["Hold"].width * 0.5, -holdLength, res["Hold"].width, holdLength - baseLength * (realTime - note.realTime));
            ctxos.drawImage(res["HoldEnd"], -res["HoldEnd"].width * 0.5, -holdLength - res["HoldEnd"].height);
        }
    } else if (note.badtime) {
        if (type == 1) ctxos.drawImage(res["TapBad"], -res["TapBad"].width * 0.5, -res["TapBad"].height * 0.5);
    } else if (HL) {
        if (type == 1) ctxos.drawImage(res["TapHL"], -res["TapHL"].width * 0.5, -res["TapHL"].height * 0.5);
        else if (type == 2) ctxos.drawImage(res["DragHL"], -res["DragHL"].width * 0.5, -res["DragHL"].height * 0.5);
        else if (type == 4) ctxos.drawImage(res["FlickHL"], -res["FlickHL"].width * 0.5, -res["FlickHL"].height * 0.5);
    } else {
        if (type == 1) ctxos.drawImage(res["Tap"], -res["Tap"].width * 0.5, -res["Tap"].height * 0.5);
        else if (type == 2) ctxos.drawImage(res["Drag"], -res["Drag"].width * 0.5, -res["Drag"].height * 0.5);
        else if (type == 4) ctxos.drawImage(res["Flick"], -res["Flick"].width * 0.5, -res["Flick"].height * 0.5);
    }
}
//test
function chart123(chart) {
    const newChart = JSON.parse(JSON.stringify(chart)); //深拷贝
    switch (newChart.formatVersion) { //加花括号以避免beautify缩进bug
        case 1: {
            newChart.formatVersion = 3;
            for (const i of newChart.judgeLineList) {
                let y = 0;
                for (const j of i.speedEvents) {
                    if (j.startTime < 0) j.startTime = 0;
                    j.floorPosition = y;
                    y += (j.endTime - j.startTime) * j.value / i.bpm * 1.875;
                }
                for (const j of i.judgeLineDisappearEvents) {
                    j.start2 = 0;
                    j.end2 = 0;
                }
                for (const j of i.judgeLineMoveEvents) {
                    j.start2 = j.start % 1e3 / 520;
                    j.end2 = j.end % 1e3 / 520;
                    j.start = parseInt(j.start / 1e3) / 880;
                    j.end = parseInt(j.end / 1e3) / 880;
                }
                for (const j of i.judgeLineRotateEvents) {
                    j.start2 = 0;
                    j.end2 = 0;
                }
            }
        }
        case 3: { }
        case 3473:
            break;
        default:
            throw `Unsupported formatVersion: ${newChart.formatVersion}`;
    }
    return newChart;
}

function chartp23(pec, filename) {
    class Chart {
        constructor() {
            this.formatVersion = 3;
            this.offset = 0;
            this.numOfNotes = 0;
            this.judgeLineList = [];
        }
        pushLine(judgeLine) {
            this.judgeLineList.push(judgeLine);
            this.numOfNotes += judgeLine.numOfNotes;
            return judgeLine;
        }
    }
    class JudgeLine {
        numOfNotes = 0;
        numOfNotesAbove = 0;
        numOfNotesBelow = 0;
        bpm = 120;
        constructor(bpm) {
            this.bpm = bpm;
            ("speedEvents,notesAbove,notesBelow,judgeLineDisappearEvents,judgeLineMoveEvents,judgeLineRotateEvents,judgeLineDisappearEventsPec,judgeLineMoveEventsPec,judgeLineRotateEventsPec").split(",").map(i => this[i] = []);
        }
        pushNote(note, pos, isFake) {
            switch (pos) {
                case undefined:
                case 1:
                    this.notesAbove.push(note);
                    break;
                case 2:
                    this.notesBelow.push(note);
                    break;
                default:
                    throw "wrong note position"
            }
            if (!isFake) {
                this.numOfNotes++;
                this.numOfNotesAbove++;
            }
        }
        pushEvent(type, startTime, endTime, n1, n2, n3, n4) {
            const evt = {
                startTime: startTime,
                endTime: endTime,
            }
            if (typeof startTime == 'number' && typeof endTime == 'number' && startTime > endTime) {
                console.warn("Warning: startTime " + startTime + " is larger than endTime " + endTime);
                //return;
            }
            switch (type) {
                case 0:
                    evt.value = n1;
                    this.speedEvents.push(evt);
                    break;
                case 1:
                    evt.start = n1;
                    evt.end = n2;
                    evt.start2 = 0;
                    evt.end2 = 0;
                    this.judgeLineDisappearEvents.push(evt);
                    break;
                case 2:
                    evt.start = n1;
                    evt.end = n2;
                    evt.start2 = n3;
                    evt.end2 = n4;
                    this.judgeLineMoveEvents.push(evt);
                    break;
                case 3:
                    evt.start = n1;
                    evt.end = n2;
                    evt.start2 = 0;
                    evt.end2 = 0;
                    this.judgeLineRotateEvents.push(evt);
                    break;
                case -1:
                    evt.value = n1;
                    evt.motionType = 1;
                    this.judgeLineDisappearEventsPec.push(evt);
                    break;
                case -2:
                    evt.value = n1;
                    evt.value2 = n2;
                    evt.motionType = n3;
                    this.judgeLineMoveEventsPec.push(evt);
                    break;
                case -3:
                    evt.value = n1;
                    evt.motionType = n2;
                    this.judgeLineRotateEventsPec.push(evt);
                    break;
                default:
                    throw `Unexpected Event Type: ${type}`;
            }
        }
    }
    class Note {
        constructor(type, time, x, holdTime, speed) {
            this.type = type;
            this.time = time;
            this.positionX = x;
            this.holdTime = type == 3 ? holdTime : 0;
            this.speed = isNaN(speed) ? 1 : speed; //默认值不为0不能改成Number(speed)||1
            //this.floorPosition = time % 1e9 / 104 * 1.2;
        }
    }
    //test start
    const rawChart = pec.match(/[^\n\r ]+/g).map(i => isNaN(i) ? String(i) : Number(i));
    const qwqChart = new Chart();
    const raw = {};
    ("bp,n1,n2,n3,n4,cv,cp,cd,ca,cm,cr,cf").split(",").map(i => raw[i] = []);
    const rawarr = [];
    let fuckarr = [1, 1]; //n指令的#和&
    let rawstr = "";
    if (!isNaN(rawChart[0])) qwqChart.offset = (rawChart.shift() / 1e3 - 0.175); //v18x固定延迟
    for (let i = 0; i < rawChart.length; i++) {
        let p = rawChart[i];
        if (!isNaN(p)) rawarr.push(p);
        else if (p == "#" && rawstr[0] == "n") fuckarr[0] = rawChart[++i];
        else if (p == "&" && rawstr[0] == "n") fuckarr[1] = rawChart[++i];
        else if (raw[p]) pushCommand(p);
        else throw `Unknown Command: ${p}`;
    }
    pushCommand(""); //补充最后一个元素(bug)
    //处理bpm变速
    if (!raw.bp[0]) raw.bp.push([0, 120]);
    const baseBpm = raw.bp[0][1];
    if (raw.bp[0][0]) raw.bp.unshift([0, baseBpm]);
    const bpmEvents = []; //存放bpm变速事件
    let fuckBpm = 0;
    raw.bp.sort((a, b) => a[0] - b[0]).forEach((i, idx, arr) => {
        if (arr[idx + 1] && arr[idx + 1][0] <= 0) return; //过滤负数
        const start = i[0] < 0 ? 0 : i[0];
        const end = arr[idx + 1] ? arr[idx + 1][0] : 1e9;
        const bpm = i[1];
        bpmEvents.push({
            startTime: start,
            endTime: end,
            bpm: bpm,
            value: fuckBpm
        });
        fuckBpm += (end - start) / bpm;
    });

    function pushCommand(next) {
        if (raw[rawstr]) {
            if (rawstr[0] == "n") {
                rawarr.push(...fuckarr);
                fuckarr = [1, 1];
            }
            raw[rawstr].push(JSON.parse(JSON.stringify(rawarr)));
        }
        rawarr.length = 0;
        rawstr = next;
    }
    //将pec时间转换为pgr时间
    function calcTime(timePec) {
        let timePhi = 0;
        for (const i of bpmEvents) {
            if (timePec < i.startTime) break;
            if (timePec > i.endTime) continue;
            timePhi = Math.round(((timePec - i.startTime) / i.bpm + i.value) * baseBpm * 32);
        }
        return timePhi;
    }
    //处理note和判定线事件
    let linesPec = [];
    for (const i of raw.n1) {
        if (!linesPec[i[0]]) linesPec[i[0]] = new JudgeLine(baseBpm);
        linesPec[i[0]].pushNote(new Note(1, calcTime(i[1]) + (i[4] ? 1e9 : 0), i[2] * 9 / 1024, 0, i[5]), i[3], i[4]);
        if (i[4]) message.sendWarning(`检测到FakeNote(可能无法正常显示)\n位于:"n1 ${i.slice(0, 5).join(" ")}"\n来自${filename}`);
        if (i[6] != 1) message.sendWarning(`检测到异常Note(可能无法正常显示)\n位于:"n1 ${i.slice(0, 5).join(" ")} # ${i[5]} & ${i[6]}"\n来自${filename}`);
    } //102.4
    for (const i of raw.n2) {
        if (!linesPec[i[0]]) linesPec[i[0]] = new JudgeLine(baseBpm);
        linesPec[i[0]].pushNote(new Note(3, calcTime(i[1]) + (i[5] ? 1e9 : 0), i[3] * 9 / 1024, calcTime(i[2]) - calcTime(i[1]), i[6]), i[4], i[5]);
        if (i[5]) message.sendWarning(`检测到FakeNote(可能无法正常显示)\n位于:"n2 ${i.slice(0, 6).join(" ")}"\n来自${filename}`);
        if (i[7] != 1) message.sendWarning(`检测到异常Note(可能无法正常显示)\n位于:"n2 ${i.slice(0, 5).join(" ")} # ${i[6]} & ${i[7]}"\n来自${filename}`);
    }
    for (const i of raw.n3) {
        if (!linesPec[i[0]]) linesPec[i[0]] = new JudgeLine(baseBpm);
        linesPec[i[0]].pushNote(new Note(4, calcTime(i[1]) + (i[4] ? 1e9 : 0), i[2] * 9 / 1024, 0, i[5]), i[3], i[4]);
        if (i[4]) message.sendWarning(`检测到FakeNote(可能无法正常显示)\n位于:"n3 ${i.slice(0, 5).join(" ")}"\n来自${filename}`);
        if (i[6] != 1) message.sendWarning(`检测到异常Note(可能无法正常显示)\n位于:"n3 ${i.slice(0, 5).join(" ")} # ${i[5]} & ${i[6]}"\n来自${filename}`);
    }
    for (const i of raw.n4) {
        if (!linesPec[i[0]]) linesPec[i[0]] = new JudgeLine(baseBpm);
        linesPec[i[0]].pushNote(new Note(2, calcTime(i[1]) + (i[4] ? 1e9 : 0), i[2] * 9 / 1024, 0, i[5]), i[3], i[4]);
        if (i[4]) message.sendWarning(`检测到FakeNote(可能无法正常显示)\n位于:"n4 ${i.slice(0, 5).join(" ")}"\n来自${filename}`);
        if (i[6] != 1) message.sendWarning(`检测到异常Note(可能无法正常显示)\n位于:"n4 ${i.slice(0, 5).join(" ")} # ${i[5]} & ${i[6]}"\n来自${filename}`);
    }
    //变速
    for (const i of raw.cv) {
        if (!linesPec[i[0]]) linesPec[i[0]] = new JudgeLine(baseBpm);
        linesPec[i[0]].pushEvent(0, calcTime(i[1]), null, i[2] / 7.0); //6.0??
    }
    //不透明度
    for (const i of raw.ca) {
        if (!linesPec[i[0]]) linesPec[i[0]] = new JudgeLine(baseBpm);
        linesPec[i[0]].pushEvent(-1, calcTime(i[1]), calcTime(i[1]), i[2] > 0 ? i[2] / 255 : 0); //暂不支持alpha值扩展
        if (i[2] < 0) message.sendWarning(`检测到负数Alpha:${i[2]}(将被视为0)\n位于:"ca ${i.join(" ")}"\n来自${filename}`);
    }
    for (const i of raw.cf) {
        if (!linesPec[i[0]]) linesPec[i[0]] = new JudgeLine(baseBpm);
        if (i[1] > i[2]) {
            message.sendWarning(`检测到开始时间大于结束时间(将禁用此事件)\n位于:"cf ${i.join(" ")}"\n来自${filename}`);
            continue;
        }
        linesPec[i[0]].pushEvent(-1, calcTime(i[1]), calcTime(i[2]), i[3] > 0 ? i[3] / 255 : 0);
        if (i[3] < 0) message.sendWarning(`检测到负数Alpha:${i[3]}(将被视为0)\n位于:"cf ${i.join(" ")}"\n来自${filename}`);
    }
    //移动
    for (const i of raw.cp) {
        if (!linesPec[i[0]]) linesPec[i[0]] = new JudgeLine(baseBpm);
        linesPec[i[0]].pushEvent(-2, calcTime(i[1]), calcTime(i[1]), i[2] / 2048, i[3] / 1400, 1);
    }
    for (const i of raw.cm) {
        if (!linesPec[i[0]]) linesPec[i[0]] = new JudgeLine(baseBpm);
        if (i[1] > i[2]) {
            message.sendWarning(`检测到开始时间大于结束时间(将禁用此事件)\n位于:"cm ${i.join(" ")}"\n来自${filename}`);
            continue;
        }
        linesPec[i[0]].pushEvent(-2, calcTime(i[1]), calcTime(i[2]), i[3] / 2048, i[4] / 1400, i[5]);
        if (i[5] && !tween[i[5]] && i[5] != 1) message.sendWarning(`未知的缓动类型:${i[5]}(将被视为1)\n位于:"cm ${i.join(" ")}"\n来自${filename}`);
    }
    //旋转
    for (const i of raw.cd) {
        if (!linesPec[i[0]]) linesPec[i[0]] = new JudgeLine(baseBpm);
        linesPec[i[0]].pushEvent(-3, calcTime(i[1]), calcTime(i[1]), -i[2], 1); //??
    }
    for (const i of raw.cr) {
        if (!linesPec[i[0]]) linesPec[i[0]] = new JudgeLine(baseBpm);
        if (i[1] > i[2]) {
            message.sendWarning(`检测到开始时间大于结束时间(将禁用此事件)\n位于:"cr ${i.join(" ")}"\n来自${filename}`);
            continue;
        }
        linesPec[i[0]].pushEvent(-3, calcTime(i[1]), calcTime(i[2]), -i[3], i[4]);
        if (i[4] && !tween[i[4]] && i[4] != 1) message.sendWarning(`未知的缓动类型:${i[4]}(将被视为1)\n位于:"cr ${i.join(" ")}"\n来自${filename}`);
    }
    for (const i of linesPec) {
        if (i) {
            i.notesAbove.sort((a, b) => a.time - b.time); //以后移到123函数
            i.notesBelow.sort((a, b) => a.time - b.time); //以后移到123函数
            let s = i.speedEvents;
            let ldp = i.judgeLineDisappearEventsPec;
            let lmp = i.judgeLineMoveEventsPec;
            let lrp = i.judgeLineRotateEventsPec;
            const srt = (a, b) => (a.startTime - b.startTime) + (a.endTime - b.endTime); //不单独判断以避免误差
            s.sort(srt); //以后移到123函数
            ldp.sort(srt); //以后移到123函数
            lmp.sort(srt); //以后移到123函数
            lrp.sort(srt); //以后移到123函数
            //cv和floorPosition一并处理
            let y = 0;
            for (let j = 0; j < s.length; j++) {
                s[j].endTime = j < s.length - 1 ? s[j + 1].startTime : 1e9;
                if (s[j].startTime < 0) s[j].startTime = 0;
                s[j].floorPosition = y;
                y += (s[j].endTime - s[j].startTime) * s[j].value / i.bpm * 1.875;
            }
            for (const j of i.notesAbove) {
                let qwqwq = 0;
                let qwqwq2 = 0;
                let qwqwq3 = 0;
                for (const k of i.speedEvents) {
                    if (j.time % 1e9 > k.endTime) continue;
                    if (j.time % 1e9 < k.startTime) break;
                    qwqwq = k.floorPosition;
                    qwqwq2 = k.value;
                    qwqwq3 = j.time % 1e9 - k.startTime;
                }
                j.floorPosition = qwqwq + qwqwq2 * qwqwq3 / i.bpm * 1.875;
                if (j.type == 3) j.speed *= qwqwq2;
            }
            for (const j of i.notesBelow) {
                let qwqwq = 0;
                let qwqwq2 = 0;
                let qwqwq3 = 0;
                for (const k of i.speedEvents) {
                    if (j.time % 1e9 > k.endTime) continue;
                    if (j.time % 1e9 < k.startTime) break;
                    qwqwq = k.floorPosition;
                    qwqwq2 = k.value;
                    qwqwq3 = j.time % 1e9 - k.startTime;
                }
                j.floorPosition = qwqwq + qwqwq2 * qwqwq3 / i.bpm * 1.875;
                if (j.type == 3) j.speed *= qwqwq2;
            }
            //整合motionType
            let ldpTime = 0;
            let ldpValue = 0;
            for (const j of ldp) {
                i.pushEvent(1, ldpTime, j.startTime, ldpValue, ldpValue);
                if (tween[j.motionType]) {
                    for (let k = parseInt(j.startTime); k < parseInt(j.endTime); k++) {
                        let ptt1 = (k - j.startTime) / (j.endTime - j.startTime);
                        let ptt2 = (k + 1 - j.startTime) / (j.endTime - j.startTime);
                        let pt1 = j.value - ldpValue;
                        i.pushEvent(1, k, k + 1, ldpValue + tween[j.motionType](ptt1) * pt1, ldpValue + tween[j.motionType](ptt2) * pt1);
                    }
                } else if (j.motionType) i.pushEvent(1, j.startTime, j.endTime, ldpValue, j.value);
                ldpTime = j.endTime;
                ldpValue = j.value;
            }
            i.pushEvent(1, ldpTime, 1e9, ldpValue, ldpValue);
            //
            let lmpTime = 0;
            let lmpValue = 0;
            let lmpValue2 = 0;
            for (const j of lmp) {
                i.pushEvent(2, lmpTime, j.startTime, lmpValue, lmpValue, lmpValue2, lmpValue2);
                if (tween[j.motionType]) {
                    for (let k = parseInt(j.startTime); k < parseInt(j.endTime); k++) {
                        let ptt1 = (k - j.startTime) / (j.endTime - j.startTime);
                        let ptt2 = (k + 1 - j.startTime) / (j.endTime - j.startTime);
                        let pt1 = j.value - lmpValue;
                        let pt2 = j.value2 - lmpValue2;
                        i.pushEvent(2, k, k + 1, lmpValue + tween[j.motionType](ptt1) * pt1, lmpValue + tween[j.motionType](ptt2) * pt1, lmpValue2 + tween[j.motionType](ptt1) * pt2, lmpValue2 + tween[j.motionType](ptt2) * pt2);
                    }
                } else if (j.motionType) i.pushEvent(2, j.startTime, j.endTime, lmpValue, j.value, lmpValue2, j.value2);
                lmpTime = j.endTime;
                lmpValue = j.value;
                lmpValue2 = j.value2;
            }
            i.pushEvent(2, lmpTime, 1e9, lmpValue, lmpValue, lmpValue2, lmpValue2);
            //
            let lrpTime = 0;
            let lrpValue = 0;
            for (const j of lrp) {
                i.pushEvent(3, lrpTime, j.startTime, lrpValue, lrpValue);
                if (tween[j.motionType]) {
                    for (let k = parseInt(j.startTime); k < parseInt(j.endTime); k++) {
                        let ptt1 = (k - j.startTime) / (j.endTime - j.startTime);
                        let ptt2 = (k + 1 - j.startTime) / (j.endTime - j.startTime);
                        let pt1 = j.value - lrpValue;
                        i.pushEvent(3, k, k + 1, lrpValue + tween[j.motionType](ptt1) * pt1, lrpValue + tween[j.motionType](ptt2) * pt1);
                    }
                } else if (j.motionType) i.pushEvent(3, j.startTime, j.endTime, lrpValue, j.value);
                lrpTime = j.endTime;
                lrpValue = j.value;
            }
            i.pushEvent(3, lrpTime, 1e9, lrpValue, lrpValue);
            qwqChart.pushLine(i);
        }
    }
    return JSON.parse(JSON.stringify(qwqChart));
}
const tween = [null, null,
    pos => Math.sin(pos * Math.PI / 2), //2
    pos => 1 - Math.cos(pos * Math.PI / 2), //3
    pos => 1 - (pos - 1) ** 2, //4
    pos => pos ** 2, //5
    pos => (1 - Math.cos(pos * Math.PI)) / 2, //6
    pos => ((pos *= 2) < 1 ? pos ** 2 : -((pos - 2) ** 2 - 2)) / 2, //7
    pos => 1 + (pos - 1) ** 3, //8
    pos => pos ** 3, //9
    pos => 1 - (pos - 1) ** 4, //10
    pos => pos ** 4, //11
    pos => ((pos *= 2) < 1 ? pos ** 3 : ((pos - 2) ** 3 + 2)) / 2, //12
    pos => ((pos *= 2) < 1 ? pos ** 4 : -((pos - 2) ** 4 - 2)) / 2, //13
    pos => 1 + (pos - 1) ** 5, //14
    pos => pos ** 5, //15
    pos => 1 - 2 ** (-10 * pos), //16
    pos => 2 ** (10 * (pos - 1)), //17
    pos => Math.sqrt(1 - (pos - 1) ** 2), //18
    pos => 1 - Math.sqrt(1 - pos ** 2), //19
    pos => (2.70158 * pos - 1) * (pos - 1) ** 2 + 1, //20
    pos => (2.70158 * pos - 1.70158) * pos ** 2, //21
    pos => ((pos *= 2) < 1 ? (1 - Math.sqrt(1 - pos ** 2)) : (Math.sqrt(1 - (pos - 2) ** 2) + 1)) / 2, //22
    pos => pos < 0.5 ? (14.379638 * pos - 5.189819) * pos ** 2 : (14.379638 * pos - 9.189819) * (pos - 1) ** 2 + 1, //23
    pos => 1 - 2 ** (-10 * pos) * Math.cos(pos * Math.PI / .15), //24
    pos => 2 ** (10 * (pos - 1)) * Math.cos((pos - 1) * Math.PI / .15), //25
    pos => ((pos *= 11) < 4 ? pos ** 2 : pos < 8 ? (pos - 6) ** 2 + 12 : pos < 10 ? (pos - 9) ** 2 + 15 : (pos - 10.5) ** 2 + 15.75) / 16, //26
    pos => 1 - tween[26](1 - pos), //27
    pos => (pos *= 2) < 1 ? tween[26](pos) / 2 : tween[27](pos - 1) / 2 + .5, //28
    pos => pos < 0.5 ? 2 ** (20 * pos - 11) * Math.sin((160 * pos + 1) * Math.PI / 18) : 1 - 2 ** (9 - 20 * pos) * Math.sin((160 * pos + 1) * Math.PI / 18) //29
];
//导出json
function chartify(json) {
    let newChart = {};
    newChart.formatVersion = 3;
    newChart.offset = json.offset;
    newChart.numOfNotes = json.numOfNotes;
    newChart.judgeLineList = [];
    for (const i of json.judgeLineList) {
        let newLine = {};
        newLine.numOfNotes = i.numOfNotes;
        newLine.numOfNotesAbove = i.numOfNotesAbove;
        newLine.numOfNotesBelow = i.numOfNotesBelow;
        newLine.bpm = i.bpm;
        ("speedEvents,notesAbove,notesBelow,judgeLineDisappearEvents,judgeLineMoveEvents,judgeLineRotateEvents").split(",").map(i => newLine[i] = []);
        for (const j of i.speedEvents) {
            if (j.startTime == j.endTime) continue;
            let newEvent = {};
            newEvent.startTime = j.startTime;
            newEvent.endTime = j.endTime;
            newEvent.value = Number(j.value.toFixed(6));
            newEvent.floorPosition = Number(j.floorPosition.toFixed(6));
            newLine.speedEvents.push(newEvent);
        }
        for (const j of i.notesAbove) {
            let newNote = {};
            newNote.type = j.type;
            newNote.time = j.time;
            newNote.positionX = Number(j.positionX.toFixed(6));
            newNote.holdTime = j.holdTime;
            newNote.speed = Number(j.speed.toFixed(6));
            newNote.floorPosition = Number(j.floorPosition.toFixed(6));
            newLine.notesAbove.push(newNote);
        }
        for (const j of i.notesBelow) {
            let newNote = {};
            newNote.type = j.type;
            newNote.time = j.time;
            newNote.positionX = Number(j.positionX.toFixed(6));
            newNote.holdTime = j.holdTime;
            newNote.speed = Number(j.speed.toFixed(6));
            newNote.floorPosition = Number(j.floorPosition.toFixed(6));
            newLine.notesBelow.push(newNote);
        }
        for (const j of i.judgeLineDisappearEvents) {
            if (j.startTime == j.endTime) continue;
            let newEvent = {};
            newEvent.startTime = j.startTime;
            newEvent.endTime = j.endTime;
            newEvent.start = Number(j.start.toFixed(6));
            newEvent.end = Number(j.end.toFixed(6));
            newEvent.start2 = Number(j.start2.toFixed(6));
            newEvent.end2 = Number(j.end2.toFixed(6));
            newLine.judgeLineDisappearEvents.push(newEvent);
        }
        for (const j of i.judgeLineMoveEvents) {
            if (j.startTime == j.endTime) continue;
            let newEvent = {};
            newEvent.startTime = j.startTime;
            newEvent.endTime = j.endTime;
            newEvent.start = Number(j.start.toFixed(6));
            newEvent.end = Number(j.end.toFixed(6));
            newEvent.start2 = Number(j.start2.toFixed(6));
            newEvent.end2 = Number(j.end2.toFixed(6));
            newLine.judgeLineMoveEvents.push(newEvent);
        }
        for (const j of i.judgeLineRotateEvents) {
            if (j.startTime == j.endTime) continue;
            let newEvent = {};
            newEvent.startTime = j.startTime;
            newEvent.endTime = j.endTime;
            newEvent.start = Number(j.start.toFixed(6));
            newEvent.end = Number(j.end.toFixed(6));
            newEvent.start2 = Number(j.start2.toFixed(6));
            newEvent.end2 = Number(j.end2.toFixed(6));
            newLine.judgeLineRotateEvents.push(newEvent);
        }
        newChart.judgeLineList.push(newLine);
    }
    return newChart;
}
//调节画面尺寸和全屏相关
function adjustSize(source, dest, scale) {
    const [sw, sh, dw, dh] = [source.width, source.height, dest.width, dest.height];
    if (dw * sh > dh * sw) return [dw * (1 - scale) / 2, (dh - dw * sh / sw * scale) / 2, dw * scale, dw * sh / sw * scale];
    return [(dw - dh * sw / sh * scale) / 2, dh * (1 - scale) / 2, dh * sw / sh * scale, dh * scale];
}
//给图片上色
function imgShader(img, color) {
    const canvas = document.createElement("canvas");
    canvas.width = img.width;
    canvas.height = img.height;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(img, 0, 0);
    const imgData = ctx.getImageData(0, 0, img.width, img.height);
    const data = hex2rgba(color);
    for (let i = 0; i < imgData.data.length / 4; i++) {
        imgData.data[i * 4] *= data[0] / 255;
        imgData.data[i * 4 + 1] *= data[1] / 255;
        imgData.data[i * 4 + 2] *= data[2] / 255;
        imgData.data[i * 4 + 3] *= data[3] / 255;
    }
    return imgData;
}
//画面翻转
function imgFlip(a, b, c, d, e, f) {
    switch (selectflip.value) {
        case "br":
            return [a, b, c, d, e, f];
        case "bl":
            return [a, -b, -c, d, canvasos.width - e, f];
        case "tr":
            return [-a, b, c, -d, e, canvasos.height - f];
        case "tl":
            return [-a, -b, -c, -d, canvasos.width - e, canvasos.height - f];
        default:
            throw new Error("Flip Error");
    }
}

function imgBlur(img) {
    const canvas = document.createElement("canvas");
    canvas.width = img.width;
    canvas.height = img.height;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(img, 0, 0);
    return StackBlur.imageDataRGB(ctx.getImageData(0, 0, img.width, img.height), 0, 0, img.width, img.height, Math.ceil(Math.min(img.width, img.height) * 0.0125));
}
//十六进制color转rgba数组
function hex2rgba(color) {
    const ctx = document.createElement("canvas").getContext("2d");
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, 1, 1);
    return ctx.getImageData(0, 0, 1, 1).data;
}
//rgba数组(0-1)转十六进制
function rgba2hex(...rgba) {
    return "#" + rgba.map(i => ("00" + Math.round(Number(i) * 255 || 0).toString(16)).slice(-2)).join("");
}
//读取csv
function csv2array(data, isObject) {
    const strarr = data.replace(/\r/g, "").split("\n");
    const col = [];
    for (const i of strarr) {
        let rowstr = "";
        let isQuot = false;
        let beforeQuot = false;
        const row = [];
        for (const j of i) {
            if (j == '"') {
                if (!isQuot) isQuot = true;
                else if (beforeQuot) {
                    rowstr += j;
                    beforeQuot = false;
                } else beforeQuot = true;
            } else if (j == ',') {
                if (!isQuot) {
                    row.push(rowstr);
                    rowstr = "";
                } else if (beforeQuot) {
                    row.push(rowstr);
                    rowstr = "";
                    isQuot = false;
                    beforeQuot = false;
                } else rowstr += j;
            } else if (!beforeQuot) rowstr += j;
            else throw "Error 1";
        }
        if (!isQuot) {
            row.push(rowstr);
            rowstr = "";
        } else if (beforeQuot) {
            row.push(rowstr);
            rowstr = "";
            isQuot = false;
            beforeQuot = false;
        } else throw "Error 2";
        col.push(row);
    }
    if (!isObject) return col;
    const qwq = [];
    for (let i = 1; i < col.length; i++) {
        const obj = {};
        for (let j = 0; j < col[0].length; j++) obj[col[0][j]] = col[i][j];
        qwq.push(obj);
    }
    return qwq;
}