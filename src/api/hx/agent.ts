import request from '@/utils/request'

import {
    agentName,
    agents,
    bankName,
    delay,
    eq,
    like,
    nextId,
    now,
    paginate,
    USE_MOCK,
    users
} from './mock'

/* ==================== 业务经办人账号（P-02） ==================== */

// 经办人列表
export function agentLists(params: any) {
    if (!USE_MOCK) {
        return request.get({ url: '/hx.agent/lists', params }, { ignoreCancelToken: true })
    }
    const list = agents
        .filter(
            (item) =>
                like(item.name, params.name) &&
                like(item.mobile, params.mobile) &&
                eq(item.bank_id, params.bank_id) &&
                eq(item.status, params.status)
        )
        .map((item) => ({
            ...item,
            bank_name: bankName(item.bank_id)
        }))
    return paginate(list, params)
}

/**
 * 可选用户池（平台注册用户）
 * 用于「选择用户 → 开通业务经办人权限」：返回平台注册用户，并标记该用户是否已具备业务经办人身份，
 * 已开通的用户在选择器内置灰不可重复选择。
 */
export function agentUserPool(params: any = {}) {
    if (!USE_MOCK) {
        return request.get({ url: '/hx.agent/userPool', params }, { ignoreCancelToken: true })
    }
    const keyword = String(params.keyword || '').trim()
    const list = users
        .filter((user) => user.status != 0)
        .filter(
            (user) =>
                !keyword ||
                String(user.name).includes(keyword) ||
                String(user.mobile).includes(keyword) ||
                String(user.city || '').includes(keyword)
        )
        .map((user) => {
            const owned = agents.find((item) => item.user_id == user.id || item.mobile == user.mobile)
            return {
                id: user.id,
                name: user.name,
                mobile: user.mobile,
                city: user.city || '—',
                source: user.source || '—',
                register_time: user.register_time || '',
                is_agent: !!owned,
                agent_bank_name: owned ? bankName(owned.bank_id) : ''
            }
        })
    return delay(list)
}

// 经办人全部（下拉）
export function agentAll(params: any = {}) {
    if (!USE_MOCK) return request.get({ url: '/hx.agent/all', params })
    const list = agents
        .filter((item) => item.status === 1 && eq(item.bank_id, params.bank_id))
        .map((item) => ({
            ...item,
            bank_name: bankName(item.bank_id)
        }))
    return delay(list)
}

// 经办人详情
export function agentDetail(params: any) {
    if (!USE_MOCK) return request.get({ url: '/hx.agent/detail', params })
    const item = agents.find((row) => row.id == params.id)
    return delay({
        ...item,
        bank_name: item ? bankName(item.bank_id) : ''
    })
}

// 开通业务经办人（选择平台注册用户 → 开通经办人权限）
export function agentAdd(params: any) {
    if (!USE_MOCK) return request.post({ url: '/hx.agent/add', params })
    const id = nextId(agents)
    agents.push({
        id,
        user_id: params.user_id || 0,
        perms: [],
        last_login_time: '',
        create_time: now(),
        open_time: now(),
        ...params
    })
    return delay({})
}

// 经办人编辑
export function agentEdit(params: any) {
    if (!USE_MOCK) return request.post({ url: '/hx.agent/edit', params })
    const index = agents.findIndex((item) => item.id == params.id)
    if (index > -1) agents[index] = { ...agents[index], ...params }
    return delay({})
}

// 经办人启停用
export function agentStatus(params: any) {
    if (!USE_MOCK) return request.post({ url: '/hx.agent/status', params })
    const item = agents.find((row) => row.id == params.id)
    if (item) item.status = params.status
    return delay({})
}

// 分配权限（P-02：分配权限归总经理）
export function agentAuthSave(params: any) {
    if (!USE_MOCK) return request.post({ url: '/hx.agent/auth', params })
    const item = agents.find((row) => row.id == params.id)
    if (item) item.perms = params.perms || []
    return delay(item)
}

// 权限树（经办人可分配的功能权限）
export function agentPermTree() {
    if (!USE_MOCK) return request.get({ url: '/hx.agent/permTree' })
    return delay([
        {
            id: 'business',
            label: '业务办理',
            children: [
                { id: 'business:submit', label: '提交贷款业务申请' },
                { id: 'business:upload', label: '上传客户资料 / 银行材料' },
                { id: 'business:repay_upload', label: '上传回款凭证（Y-03）' },
                { id: 'business:sign', label: '发起 e签宝签约' }
            ]
        },
        {
            id: 'query',
            label: '查询权限',
            children: [
                { id: 'query:customer', label: '查看名下客户' },
                { id: 'query:business', label: '查看名下业务进度' }
            ]
        }
    ])
}

export { agentName }
