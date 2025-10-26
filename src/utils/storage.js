'use strict';

/**
 * 从storage中获取数据
 * @param {string|Array} keys 需要获取的键或键数组
 * @returns {Promise<Object>} 获取的数据
 */
async function getStorage(keys) {
    try {
        return await chrome.storage.local.get(keys);
    } catch (error) {
        console.error('获取存储数据失败:', error);
        return {};
    }
}

/**
 * 设置storage数据
 * @param {Object} data 要存储的数据对象
 * @returns {Promise<void>}
 */
async function setStorage(data) {
    try {
        await chrome.storage.local.set(data);
        return true;
    } catch (error) {
        console.error('设置存储数据失败:', error);
        return false;
    }
}

/**
 * 从manifest.json获取默认配置
 * @returns {Object} 默认配置对象
 */
function getManifestDefaults() {
    const manifest = chrome.runtime.getManifest();
    return {
        defaultDomains: manifest.default_domains || [],
        defaultForbiddenDomains: manifest.default_fobidden_domains || []
    };
}

export {
    getStorage,
    setStorage,
    getManifestDefaults
};