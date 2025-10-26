'use strict';

/**
 * Cookie相关工具函数
 */

// 存储cookie状态的变量
let cookieStr = '';
let cookieMap = new Map();

/**
 * 更新Cookie
 * @returns {Promise<boolean>} 是否更新成功
 */
async function updateCookie() {
    try {
        const cookies = await chrome.cookies.getAll({});
        return storeCookie(cookies);
    } catch (error) {
        console.error('获取cookie失败:', error);
        return false;
    }
}

/**
 * 存储Cookie
 * @param {Array} cookies Cookie数组
 * @returns {boolean} 是否有更新
 */
function storeCookie(cookies) {
    // cookie更新校验
    const cookiesStr = JSON.stringify(cookies);
    if (cookieStr === cookiesStr) {
        console.log('cookie缓存未更新');
        return false;
    }

    cookieStr = cookiesStr;
    const newCookieMap = new Map();

    // 解析domain
    cookies.forEach((item) => {
        const str = (newCookieMap.get(item.domain) || '') + item.name + '=' + item.value + '; ';
        newCookieMap.set(item.domain, str);
    });

    cookieMap = newCookieMap;
    console.log('cookie缓存已更新');

    return true;
}

/**
 * 获取Cookie Map
 * @returns {Map} Cookie Map
 */
function getCookieMap() {
    return cookieMap;
}

/**
 * 获取指定域名的Cookie
 * @param {string} domain 域名
 * @returns {string|null} Cookie字符串
 */
function getDomainCookie(domain) {
    let cookieValue = cookieMap.get(domain);
    if (!cookieValue) {
        cookieValue = cookieMap.get('/');
    }
    return cookieValue || null;
}

export {
    updateCookie,
    storeCookie,
    getCookieMap,
    getDomainCookie
};