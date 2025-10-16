// ==UserScript==
// @name         Naga Helper
// @namespace    http://tampermonkey.net/
// @version      2025-10-16
// @description  Show NAGA numerical information
// @author       You
// @match        https://naga.dmv.nico/htmls/*
// @icon         https://naga.dmv.nico/static/img/naga.png
// @grant        none
// ==/UserScript==

(function() {
    'use strict';
    const haiT = ["1m","2m","3m","4m","5m","6m","7m","8m","9m",
                 "1p","2p","3p","4p","5p","6p","7p","8p","9p",
                 "1s","2s","3s","4s","5s","6s","7s","8s","9s",
                 "東","南","西","北","白","發","中"];
    var kyoku = 0;
    var step = 0;
    // const callback = (mutationList, observer) => {
    //     for (const mutation of mutationList) {
    //         if (mutation.type === "childList") {
    //         }
    //     }
    // };
    var app = document.getElementById("app");
    // Create an observer instance linked to the callback function
    // const observer = new MutationObserver(callback);
    // const config = { attributes: false, childList: true, subtree: false };
    // observer.observe(app, config);
    document.addEventListener('keyup', function(event){
        if(event.key != 'S' && event.key != 's') return;
        var app = document.getElementById("app");
        let infoDiv = document.getElementById('extraInfoDiv');
        if(!infoDiv){
            infoDiv = document.createElement("div");
            infoDiv.style.display="none";
            infoDiv.id="extraInfoDiv";
            infoDiv.innerHTML="<table style='color:white;padding:3px;'><thead><tr><td style='width:6em'>選擇</td><td style='width:6em;text-align:right'>傾向</td></tr></thead><tbody id='extraInfoTable'></tbody></table>";
            app.append(infoDiv);
        }
        if(infoDiv.style.display == "none"){
            app.style.display = "inline-flex";
            app.style["justify-content"] = "space-around";
            app.style.width = "100%";
            infoDiv.style.display="";
        }else{
            app.style.display = "";
            app.style.width = "";
            infoDiv.style.display="none";
        }
    });
    function isSelf(detail, selfActor){
        let msgType = detail.info.msg.type;
        if(msgType=="tsumo" || msgType=="chi" || msgType=="pon" || msgType=="ankan" || msgType=="kakan" || msgType=="daiminkan"){
            return detail.info.msg.actor == selfActor;
        }else if(msgType=="dahai" && "huro" in detail){
            return selfActor.toString() in detail.huro;
        }
        return false;
    }
    function isDiff(detail, selfActor, model){
        let msgType = detail.info.msg.type;
        if(msgType=="tsumo" || msgType=="chi" || msgType=="pon" || msgType=="ankan" || msgType=="kakan" || msgType=="daiminkan"){
            return detail.info.msg.actor == selfActor && detail.info.msg.real_dahai != null && detail.info.msg.real_dahai != detail.info.msg.pred_dahai[model];
        }else if(msgType=="dahai" && "huro" in detail){
            if(!(selfActor.toString() in detail.huro)) return false;
        }
        return false;
    }
    function huroTranslate(method, hai){
        if(method == "0"){
            return "跳過";
        }else if(method == "1"){
            let n = parseInt(hai.charAt(0));
            let t = hai.charAt(1);
            return (n+1).toString()+(n+2).toString()+t+"吃";
        }else if(method == "2"){
            let n = parseInt(hai.charAt(0));
            let t = hai.charAt(1);
            return (n-1).toString()+(n+1).toString()+t+"吃";
        }else if(method == "3"){
            let n = parseInt(hai.charAt(0));
            let t = hai.charAt(1);
            return (n-2).toString()+(n-1).toString()+t+"吃";
        }else if(method == "4"){
            return "碰";
        }else if(method == "5"){
            return "槓";
        }
        return '?';
    }
    function indexSort(test){
        var test_with_index = [];
        for (var i in test) {
            test_with_index.push([test[i], i]);
        }
        test_with_index.sort(function(left, right) {
            return left[0] < right[0] ? 1 : -1;
        });
        var indexes = [];
        for (var j in test_with_index) {
            indexes.push(test_with_index[j][1]);
        }
        return indexes;
    }
    function updateExtraInfoTable(){
        let infoTable = document.getElementById('extraInfoTable');
        if(!infoTable) return;
        let selfActor = document.querySelectorAll('select')[0].value;
        let model = document.querySelectorAll('select')[2].value;
        infoTable.innerHTML="";
        if(step >= pred[kyoku].length) return;
        let detail = pred[kyoku][step];
        let msgType = detail.info.msg.type;
        if(msgType == "tsumo" || msgType=="chi" || msgType=="pon" || msgType=="ankan" || msgType=="kakan" || msgType=="daiminkan"){
            if(detail.info.msg.actor != selfActor) return;
            let sortedIndex = indexSort(detail.dahai_pred[model]);
            for(let h of sortedIndex){
                let predValue = detail.dahai_pred[model][h];
                if(predValue == 0) break;
                let tr = infoTable.insertRow(-1);
                let haiTd = tr.insertCell(0);
                haiTd.appendChild(document.createTextNode(haiT[h]));
                let prefTd = tr.insertCell(1);
                prefTd.style['text-align'] = "right";
                prefTd.appendChild(document.createTextNode((predValue/100.0).toFixed(2)+"%"));
            }
        }else if(msgType == "dahai" && "huro" in detail){
            let huro = detail.huro[selfActor];
            if(!huro) return;
            for(let h in huro[model]){
                let predValue = huro[model][h];
                if(predValue == 0) break;
                let tr = infoTable.insertRow(-1);
                let haiTd = tr.insertCell(0);
                haiTd.appendChild(document.createTextNode(huroTranslate(h, detail.info.msg.pai)));
                let prefTd = tr.insertCell(1);
                prefTd.style['text-align'] = "right";
                prefTd.appendChild(document.createTextNode((predValue*100.0).toFixed(2)+"%"));
            }
        }
    }
    app.addEventListener('wheel', function(event){
        if(event.deltaY < 0){
            if(step <= 0){
                kyoku--;
                step = pred[kyoku].length;
            }else{
                step--;
            }
        }else{
            if(step >= pred[kyoku].length){
                step = 0;
                kyoku++;
            }else{
                step++;
            }
        }
        updateExtraInfoTable();
    });
    app.addEventListener('click', function(event){
        if(event.target.nodeName == "BUTTON"){
            let selfActor = document.querySelectorAll('select')[0].value;
            let model = document.querySelectorAll('select')[2].value;
            const title = event.target.innerText;
            switch(title){
                case '< 前局':
                    kyoku--;
                    step=0;
                    break;
                case '< 前':
                    if(step <= 0){
                        kyoku--;
                        step = pred[kyoku].length;
                    }else{
                        step--;
                    }
                    break;
                case '< 前違':
                    if(step <= 0){
                        kyoku--;
                        step = pred[kyoku].length;
                    }else{
                        do{
                            step--;
                        }while(step > 0 && !isDiff(pred[kyoku][step], selfActor, model));
                    };
                    break;
                case '< 前自':
                    if(step <= 0){
                        kyoku--;
                        step = pred[kyoku].length;
                    }else{
                        do{
                            step--;
                        }while(step > 0 && !isSelf(pred[kyoku][step], selfActor));
                    };
                    break;
                case '次局 >':
                    kyoku++;
                    step=0;
                    break;
                case '次 >':
                    if(step >= pred[kyoku].length){
                        step = 0;
                        kyoku++;
                    }else{
                        step++;
                    }
                    break;
                case '次違 >':
                    if(step >= pred[kyoku].length){
                        step = 0;
                        kyoku++;
                    }else{
                        do{
                            step++;
                        }while(step < pred[kyoku].length && !isDiff(pred[kyoku][step], selfActor, model));
                    };
                    break;
                case '次自 >':
                    if(step >= pred[kyoku].length){
                        step = 0;
                        kyoku++;
                    }else{
                        do{
                            step++;
                        }while(step < pred[kyoku].length && !isSelf(pred[kyoku][step], selfActor));
                    };
                    break;
                default:
                    return;
            }
            updateExtraInfoTable();
        }
    });
    app.addEventListener('input', function(){updateExtraInfoTable()})
})();
