'use strict';

import { getStorage, setStorage } from './storage.js';

// 默认禁止列表
let forbiddenDomains = [];

/**
 * 初始化禁止域名列表
 * @param {Array} defaultForbiddenDomains 默认禁止域名列表
 */
function initForbiddenDomains(defaultForbiddenDomains) {
    forbiddenDomains = defaultForbiddenDomains || [];
}

/**
 * 检查域名是否在禁止列表中
 * @param {string} domain 域名
 * @returns {boolean} 是否在禁止列表中
 */
function isDomainForbidden(domain) {
    for (const forbidden of forbiddenDomains) {
        if (domain.includes(forbidden)) {
            return true;
        }
    }
    return false;
}

/**
 * 获取域名列表
 * @returns {Promise<Array>} 域名列表
 */
async function getDomainList() {
    const result = await getStorage('domain_list');
    return result.domain_list || [];
}

/**
 * 添加域名到域名列表
 * @param {string} domain 域名
 * @param {Array} domainList 当前域名列表
 * @returns {Promise<boolean>} 是否添加成功
 */
async function addDomain(domain, domainList) {
    if (!domain || domainList.includes(domain)) return false;

    domainList.push(domain);
    await setStorage({ domain_list: domainList });
    console.log(`添加域名 ${domain} 成功`);
    return true;
}

/**
 * 从域名列表中移除域名
 * @param {string} domain 域名
 * @param {Array} domainList 当前域名列表
 * @returns {Promise<boolean>} 是否移除成功
 */
async function removeDomain(domain, domainList) {
    const index = domainList.indexOf(domain);
    if (index === -1) return false;

    domainList.splice(index, 1);
    await setStorage({ domain_list: domainList });
    console.log(`移除域名 ${domain} 成功`);
    return true;
}

export {
    initForbiddenDomains,
    isDomainForbidden,
    getDomainList,
    addDomain,
    removeDomain
};