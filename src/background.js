'use strict';

const state = {
    cookieStatus: true, //开启状态
    cookieStr: '', //用于校验相同cookie
    cookieMap: null, //存储cookie的domain映射
}

init()

function init() {
    console.log('chrome-cookie-issue is powered by chirpmonster')
    //获取第一次cookie
    updateCookie()
    //添加开关监听器
    addMessageListener()
    //添加请求监听器
    addRequestListener()
}

function updateCookie() {
    chrome.cookies.getAll(
        {},
        (cookie) => {
            storeCookie(cookie)
        },
    )
}

function storeCookie(cookie) {
    //cookie更新校验
    if (state.cookieStr === JSON.stringify(cookie)) {
        console.log('cookie缓存未更新')
        return
    }
    state.cookieStr = JSON.stringify(cookie)
    const newCookieMap = new Map()
    //解析domain
    cookie.forEach((item) => {
        const str = (newCookieMap.get(item.domain) || '') + item.name + '=' + item.value + '; '
        newCookieMap.set(item.domain, str)
    })
    state.cookieMap = newCookieMap
    console.log('cookie缓存已更新')
    console.log(cookie)
}

function addMessageListener() {
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        if (request.type === 'cookieStatus') {
            if(request.cookieStatus!==null){
                state.cookieStatus = request.cookieStatus
                updateCookie()
            }
        }
        sendResponse({
            success:true,
            cookieStatus:state.cookieStatus
        })
    });
}

function addRequestListener() {
    chrome.webRequest.onBeforeSendHeaders.addListener(
        setCookie,
        {urls: ["<all_urls>"]},
        ["blocking", "requestHeaders", "extraHeaders"]
    );
}

function setCookie(details) {
    if (!state.cookieStatus) {
        return
    }
    updateCookie()
    //如果已经有cookie，return
    for (let i = details.requestHeaders.length - 1; i >= 0; i--) {
        if (details.requestHeaders[i] === 'Cookie') {
            return
        }
    }
    const reg = /\.([a-z0-9-])+\.[a-z]+(:[0-9]*)?/g
    console.log('成功携带cookie:' + details.url)
    if (!details.url) {
        console.log(details+'本次未成功携带Cookie，请确认该请求是否需要携带Cookie')
        return
    }
    let domain=details.url.match(/:\/\/.*?\//i)?.[0]??details.url //正则获取domain或者保底
    domain = domain.match(reg)
    domain = domain?.[0]?.split(':')?.[0]
    //网盘和谷歌商城存在验证问题
    let forbiddenList=['baidu','google','gitlab']
    for(let i=0;i<forbiddenList.length;i++){
        if(domain?.includes(forbiddenList[i])){
            return
        }
    }
    const newCookie = state.cookieMap.get(domain)
    //如果cookie不存在，return
    if (!newCookie) {
        return
    }
    details.requestHeaders.push({name: 'Cookie', value: newCookie})
    return {requestHeaders: details.requestHeaders}
}