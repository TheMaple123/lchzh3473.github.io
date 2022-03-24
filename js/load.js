"use strict";
//兼容性检测
if (typeof zip != "object") message.sendWarning("检测到zip组件未正常加载，将无法使用模拟器");
if (typeof createImageBitmap != "function") message.sendWarning("检测到当前浏览器不支持ImageBitmap，将无法使用模拟器");
if (!(window.AudioContext || window.webkitAudioContext)) message.sendWarning("检测到当前浏览器不支持AudioContext，将无法使用模拟器");
if (!full.enabled) message.sendWarning("检测到当前浏览器不支持全屏，播放时双击右下角将使用伪全屏");
//qwq
selectbg.onchange = () => {
    Renderer.bgImage = bgs[selectbg.value];
    Renderer.bgImageBlur = bgsBlur[selectbg.value];
    resizeCanvas();
}
//自动填写歌曲信息
selectchart.addEventListener("change", adjustInfo);

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

//初始化
window.onload = function () {
    //加载资源
    (async function () {
        let loadedNum = 0;
        await Promise.all((obj => {
            const arr = [];
            for (const i in obj) arr.push([i, obj[i]]);
            return arr;
        })({
            JudgeLine: "//jsdelivr.panbaidu.cn/gh/dajia-1701/Phisimulator@main/src/JudgeLine.png",
            ProgressBar: "//jsdelivr.panbaidu.cn/gh/dajia-1701/Phisimulator@main/src/ProgressBar.png",
            SongsNameBar: "//jsdelivr.panbaidu.cn/gh/dajia-1701/Phisimulator@main/src/SongsNameBar.png",
            Pause: "//jsdelivr.panbaidu.cn/gh/dajia-1701/Phisimulator@main/src/Pause.png",
            clickRaw: "//jsdelivr.panbaidu.cn/gh/dajia-1701/Phisimulator@main/src/clickRaw.png",
            Tap: "//jsdelivr.panbaidu.cn/gh/dajia-1701/Phisimulator@main/src/Tap.png",
            Tap2: "//jsdelivr.panbaidu.cn/gh/dajia-1701/Phisimulator@main/src/Tap2.png",
            TapHL: "//jsdelivr.panbaidu.cn/gh/dajia-1701/Phisimulator@main/src/TapHL.png",
            Drag: "//jsdelivr.panbaidu.cn/gh/dajia-1701/Phisimulator@main/src/Drag.png",
            DragHL: "//jsdelivr.panbaidu.cn/gh/dajia-1701/Phisimulator@main/src/DragHL.png",
            HoldHead: "//jsdelivr.panbaidu.cn/gh/dajia-1701/Phisimulator@main/src/HoldHead.png",
            HoldHeadHL: "//jsdelivr.panbaidu.cn/gh/dajia-1701/Phisimulator@main/src/HoldHeadHL.png",
            Hold: "//jsdelivr.panbaidu.cn/gh/dajia-1701/Phisimulator@main/src/Hold.png",
            HoldHL: "//jsdelivr.panbaidu.cn/gh/dajia-1701/Phisimulator@main/src/HoldHL.png",
            HoldEnd: "//jsdelivr.panbaidu.cn/gh/dajia-1701/Phisimulator@main/src/HoldEnd.png",
            Flick: "//jsdelivr.panbaidu.cn/gh/dajia-1701/Phisimulator@main/src/Flick.png",
            FlickHL: "//jsdelivr.panbaidu.cn/gh/dajia-1701/Phisimulator@main/src/FlickHL.png",
            LevelOver1: "//jsdelivr.panbaidu.cn/gh/dajia-1701/Phisimulator@main/src/LevelOver1.png",
            LevelOver3: "//jsdelivr.panbaidu.cn/gh/dajia-1701/Phisimulator@main/src/LevelOver3.png",
            LevelOver4: "//jsdelivr.panbaidu.cn/gh/dajia-1701/Phisimulator@main/src/LevelOver4.png",
            LevelOver5: "//jsdelivr.panbaidu.cn/gh/dajia-1701/Phisimulator@main/src/LevelOver5.png",
            Rank: "//jsdelivr.panbaidu.cn/gh/dajia-1701/Phisimulator@main/src/Rank.png",
            NoImage: "//jsdelivr.panbaidu.cn/gh/dajia-1701/Phisimulator@main/src/0.png",
            mute: "//jsdelivr.panbaidu.cn/gh/dajia-1701/Phisimulator@main/src/mute.ogg",
            HitSong0: "//jsdelivr.panbaidu.cn/gh/dajia-1701/Phisimulator@main/src/HitSong0.ogg",
            HitSong1: "//jsdelivr.panbaidu.cn/gh/dajia-1701/Phisimulator@main/src/HitSong1.ogg",
            HitSong2: "//jsdelivr.panbaidu.cn/gh/dajia-1701/Phisimulator@main/src/HitSong2.ogg"
        }).map(([name, src], _i, arr) => {
            const xhr = new XMLHttpRequest();
            xhr.open("get", src, true);
            xhr.responseType = 'arraybuffer';
            xhr.send();
            return new Promise(resolve => {
                xhr.onload = async () => {
                    if (/\.(mp3|wav|ogg)$/i.test(src)) res[name] = await actx.decodeAudioData(xhr.response);
                    else if (/\.(png|jpeg|jpg)$/i.test(src)) res[name] = await createImageBitmap(new Blob([xhr.response]));
                    message.sendMessage(`加载资源：${Math.floor(++loadedNum / arr.length * 100)}%`);
                    resolve();
                };
            });
        }));
        res["JudgeLineMP"] = await createImageBitmap(imgShader(res["JudgeLine"], "#feffa9"));
        res["JudgeLineAP"] = await createImageBitmap(imgShader(res["JudgeLine"], "#a3ffac"));
        res["JudgeLineFC"] = await createImageBitmap(imgShader(res["JudgeLine"], "#a2eeff"));
        res["TapBad"] = await createImageBitmap(imgShader(res["Tap2"], "#6c4343"));
        res["Clicks"] = {};
        //res["Clicks"].default = await qwqImage(res["clickRaw"], "white");
        res["Ranks"] = await qwqImage(res["Rank"], "white");
        res["Clicks"]["rgba(255,236,160,0.8823529)"] = await qwqImage(res["clickRaw"], "rgba(255,236,160,0.8823529)"); //#fce491
        res["Clicks"]["rgba(168,255,177,0.9016907)"] = await qwqImage(res["clickRaw"], "rgba(168,255,177,0.9016907)"); //#97f79d
        res["Clicks"]["rgba(180,225,255,0.9215686)"] = await qwqImage(res["clickRaw"], "rgba(180,225,255,0.9215686)"); //#9ed5f3
        message.sendMessage("等待上传文件...");
        upload.parentElement.classList.remove("disabled");
        uploadsUrl.classList.remove("disabled");
    })();
}

//加载文件
const loadFile = function (file) {
    const reader = new FileReader();
    reader.readAsArrayBuffer(file);
    reader.onprogress = progress => { //显示加载文件进度
        const size = file.size;
        message.sendMessage(`加载文件：${Math.floor(progress.loaded / size * 100)}%`);
    };
    reader.onload = async function () {
        //加载zip//gildas-lormeau.github.io/zip.js)
        const reader = new zip.ZipReader(new zip.Uint8ArrayReader(new Uint8Array(this.result)));
        reader.getEntries().then(async zipDataRaw => {
            const zipData = [];
            for (const i of zipDataRaw) {
                if (i.filename.replace(/.*\//, "")) zipData.push(i); //过滤文件夹
            }
            console.log(zipData);
            let loadedNum = 0;
            const zipRaw = await Promise.all(zipData.map(i => new Promise(async resolve => {
                if (i.filename == "line.csv") {
                    const data = await i.getData(new zip.TextWriter());
                    const chartLine = csv2array(data, true);
                    chartLineData.push(...chartLine);
                    loading(++loadedNum);
                    resolve(chartLine);
                } else if (i.filename == "info.csv") {
                    const data_2 = await i.getData(new zip.TextWriter());
                    const chartInfo = csv2array(data_2, true);
                    console.log("info.csv");
                    console.log(chartInfo);
                    chartInfoData.push(...chartInfo);
                    loading(++loadedNum);
                    resolve(chartInfo);
                } else if (i.filename == "meta.json") { // PhiCommunity 格式
                    const data_3 = await i.getData(new zip.TextWriter());
                    console.log(data_3);
                    chartInfoDataJSON = JSON.parse(data_3);
                    loading(++loadedNum);
                    resolve(chartInfoDataJSON);
                } else i.getData(new zip.Uint8ArrayWriter()).then(async data => {
                    const audioData = await actx.decodeAudioData(data.buffer);
                    bgms[i.filename] = audioData;
                    selectbgm.appendChild(createOption(i.filename, i.filename));
                    loading(++loadedNum);
                    resolve(audioData);
                }).catch(async () => {
                    const data = await i.getData(new zip.BlobWriter());
                    const imageData = await createImageBitmap(data);
                    bgs[i.filename] = imageData;
                    bgsBlur[i.filename] = await createImageBitmap(imgBlur(imageData));
                    selectbg.appendChild(createOption(i.filename, i.filename));
                    loading(++loadedNum);
                    resolve(imageData);
                }).catch(async () => {
                    const data = await i.getData(new zip.TextWriter());
                    console.log(JSON.parse(data)); //test
                    const jsonData = await chart123(JSON.parse(data));
                    charts[i.filename] = jsonData;
                    charts[i.filename]["md5"] = md5(data);
                    selectchart.appendChild(createOption(i.filename, i.filename));
                    loading(++loadedNum);
                    resolve(jsonData);
                }).catch(async () => {
                    const data = await i.getData(new zip.TextWriter());
                    const jsonData = await chart123(chartp23(data, i.filename));
                    charts[i.filename] = jsonData;
                    charts[i.filename]["md5"] = md5(data);
                    selectchart.appendChild(createOption(i.filename, i.filename));
                    loading(++loadedNum);
                    resolve(jsonData);
                }).catch(error => {
                    console.log(error);
                    loading(++loadedNum);
                    message.sendWarning(`不支持的文件：${i.filename}`);
                    resolve(undefined);
                });
            })));

            function createOption(innerhtml, value) {
                const option = document.createElement("option");
                const isHidden = /(^|\/)\./.test(innerhtml);
                option.innerHTML = isHidden ? "" : innerhtml;
                option.value = value;
                if (isHidden) option.classList.add("hide");
                return option;
            }

            function loading(num) {
                message.sendMessage(`读取文件：${Math.floor(num / zipData.length * 100)}%`);
                if (num == zipData.length) {
                    if (selectchart.children.length == 0) {
                        message.sendError("读取出错：未发现谱面文件"); //test
                    } else if (selectbgm.children.length == 0) {
                        message.sendError("读取出错：未发现音乐文件"); //test
                    } else {
                        select.classList.remove("disabled");
                        btnPause.classList.add("disabled");
                        adjustInfo();
                    }
                }
            }
            console.log(zipRaw);
        }, () => {
            message.sendError("读取出错：不是zip文件"); //test
        });
        reader.close();
    }
}