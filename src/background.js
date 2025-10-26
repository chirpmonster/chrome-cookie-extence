'use strict';

import { updateCookie } from './utils/cookie.js';
import { initForbiddenDomains, getDomainList, addDomain, removeDomain } from './utils/domain.js';
import { updateRules, removeAllRules } from './utils/rules.js';
import { getStorage, setStorage, getManifestDefaults } from './utils/storage.js';

// 应用状态
const state = {
    cookieStatus: true,
    autoCompleteStatus: true
};

init();

async function init() {
    console.log('chrome-cookie-issue is powered by ronhliu (V3 version)');

    // 从manifest.json获取默认配置
    const { defaultDomains, defaultForbiddenDomains } = getManifestDefaults();

    // 初始化禁止域名列表
    initForbiddenDomains(defaultForbiddenDomains);

    // 初始化状态和域名列表
    await initState(defaultDomains);

    // 获取第一次cookie
    await updateCookie();

    // 添加开关监听器
    addMessageListener();

    // 初始化规则（如果cookie开关已打开）
    if (state.cookieStatus) {
        const domainList = await getDomainList();
        await updateRules(state.cookieStatus, domainList);
    }
}

// 初始化状态和域名列表
async function initState(defaultDomains) {
    try {
        const result = await getStorage(['domain_list', 'cookieStatus']);

        // 初始化domain_list
        if (!result.domain_list) {
            await setStorage({ domain_list: defaultDomains });
        }

        // 初始化cookieStatus
        if (result.cookieStatus !== undefined) {
            state.cookieStatus = result.cookieStatus;
        }

        console.log('初始化状态和域名列表成功');
    } catch (error) {
        console.error('初始化状态和域名列表失败:', error);
    }
}

function addMessageListener() {
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        if (request.type === 'cookieStatus') {
            if (request.cookieStatus === true || request.cookieStatus === false) {
                state.cookieStatus = request.cookieStatus;
                // 保存状态到storage
                setStorage({ cookieStatus: state.cookieStatus });

                updateCookie().then(async () => {
                    const domainList = await getDomainList();
                    if (state.cookieStatus) {
                        updateRules(state.cookieStatus, domainList);
                    } else {
                        removeAllRules();
                    }
                });
            }

            sendResponse({
                success: true,
                cookieStatus: state.cookieStatus
            });
        }

        if (request.type === 'autoCompleteStatus') {
            if (request.autoCompleteStatus === true || request.autoCompleteStatus === false) {
                state.autoCompleteStatus = request.autoCompleteStatus;
            }

            sendResponse({
                success: true,
                autoCompleteStatus: state.autoCompleteStatus
            });
        }

        if (request.type === 'addDomain') {
            if (request.domain) {
                getDomainList().then(domainList => {
                    addDomain(request.domain, domainList).then(async success => {
                        if (success && state.cookieStatus) {
                            const updatedDomainList = await getDomainList();
                            updateRules(state.cookieStatus, updatedDomainList);
                        }
                        sendResponse({
                            success: true,
                            domain_list: await getDomainList()
                        });
                    });
                });
                return true; // 保持消息通道开放以支持异步响应
            }
        }

        if (request.type === 'removeDomain') {
            if (request.domain) {
                getDomainList().then(domainList => {
                    removeDomain(request.domain, domainList).then(async success => {
                        if (success && state.cookieStatus) {
                            const updatedDomainList = await getDomainList();
                            updateRules(state.cookieStatus, updatedDomainList);
                        }
                        sendResponse({
                            success: true,
                            domain_list: await getDomainList()
                        });
                    });
                });
                return true; // 保持消息通道开放以支持异步响应
            }
        }

        if (request.type === 'getDomainList') {
            getDomainList().then(domainList => {
                sendResponse({
                    success: true,
                    domain_list: domainList
                });
            });
            return true; // 保持消息通道开放以支持异步响应
        }

        return true; // 保持消息通道开放以支持异步响应
    });
}

// 定期更新规则（每5分钟）
// setInterval(async () => {
//     if (state.cookieStatus) {
//         const updated = await updateCookie();
//         if (updated) {
//             const domainList = await getDomainList();
//             await updateRules(state.cookieStatus, domainList);
//         }
//     }
// }, 5 * 60 * 1000);