'use strict';

import { getDomainCookie } from './cookie.js';
import { isDomainForbidden } from './domain.js';
import { getStorage, setStorage } from './storage.js';

// 规则动作类型
const RULE_ACTION_TYPE = chrome.declarativeNetRequest.RuleActionType;
// 请求资源类型
const RESOURCE_TYPE = chrome.declarativeNetRequest.ResourceType;
// 规则条件
const RULE_CONDITION = chrome.declarativeNetRequest.RuleCondition;

// ID计数器
let idCounter = 0;

/**
 * 生成唯一的规则ID
 * @returns {number} 唯一ID
 */
function generateRuleId() {
    const baseId = Date.now() << 8;
    const uniqueId = baseId + (idCounter++ % 256);
    return uniqueId;
}

/**
 * 创建规则
 * @param {string} domain 域名
 * @param {string} cookieValue Cookie值
 * @param {number} id 规则ID
 * @param {number} priority 优先级
 * @returns {Object|null} 规则对象
 */
function createRule(domain, cookieValue, id, priority = 1) {
    if (!cookieValue) return null;

    return {
        id: id,
        priority: priority,
        action: {
            type: RULE_ACTION_TYPE.MODIFY_HEADERS,
            requestHeaders: [
                {
                    header: 'Cookie',
                    operation: chrome.declarativeNetRequest.HeaderOperation.SET,
                    value: cookieValue
                }
            ]
        },
        condition: {
            urlFilter: domain,
            resourceTypes: [RESOURCE_TYPE.MAIN_FRAME, RESOURCE_TYPE.SUB_FRAME, RESOURCE_TYPE.XMLHTTPREQUEST]
        }
    };
}

/**
 * 更新所有规则
 * @param {boolean} cookieStatus Cookie状态
 * @param {Array} domainList 域名列表
 * @returns {Promise<void>}
 */
async function updateRules(cookieStatus, domainList) {
    if (!cookieStatus) {
        await removeAllRules();
        return;
    }

    // 移除现有规则
    await removeAllRules();

    const rules = [];
    const idList = [];

    // 为domain_list中的每个域名添加规则
    for (const domain of domainList) {
        // 跳过禁止列表中的域名
        if (isDomainForbidden(domain)) continue;

        const cookieValue = getDomainCookie(domain);
        if (cookieValue) {
            const ruleId = generateRuleId();
            const rule = createRule(domain, cookieValue, ruleId, 100);
            if (rule) {
                rules.push(rule);
                idList.push(ruleId);
            }
        }
    }

    // 保存规则ID到storage
    await setStorage({ id_list: idList });

    // 更新规则
    if (rules.length > 0) {
        try {
            await chrome.declarativeNetRequest.updateDynamicRules({
                removeRuleIds: [],
                addRules: rules
            });
            console.log(`成功添加 ${rules.length} 条规则`);
        } catch (error) {
            console.error('更新规则失败:', error);
        }
    }

    return idList;
}

/**
 * 移除所有规则
 * @returns {Promise<void>}
 */
async function removeAllRules() {
    const result = await getStorage('id_list');
    const idList = result.id_list || [];
    
    if (idList.length === 0) return;

    try {
        await chrome.declarativeNetRequest.updateDynamicRules({
            removeRuleIds: idList,
            addRules: []
        });
        console.log(`成功移除 ${idList.length} 条规则`);
        await setStorage({ id_list: [] });
    } catch (error) {
        console.error('移除规则失败:', error);
    }
}

export {
    generateRuleId,
    createRule,
    updateRules,
    removeAllRules
};