import request from '@/utils/request'

import { agentName, agents, bankName, branches, delay, eq, like, nextId, paginate, USE_MOCK } from './mock'

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
                eq(item.branch_id, params.branch_id) &&
                eq(item.status, params.status)
        )
        .map((item) => ({
            ...item,
            bank_name: bankName(item.bank_id),
            branch_name: branches.find((b) => b.id == item.branch_id)?.name || '—',
            city: branches.find((b) => b.id == item.branch_id)?.city || '—',
            auth_status_text: ['待认证', '认证中', '已认证'][item.auth_status] || '—'
        }))
    return paginate(list, params)
}

// 经办人全部（下拉）
export function agentAll(params: any = {}) {
    if (!USE_MOCK) return request.get({ url: '/hx.agent/all', params })
    const list = agents
        .filter((item) => item.status === 1 && eq(item.bank_id, params.bank_id))
        .map((item) => ({
            ...item,
            bank_name: bankName(item.bank_id),
            branch_name: branches.find((b) => b.id == item.branch_id)?.name || '—'
        }))
    return delay(list)
}

// 经办人详情
export function agentDetail(params: any) {
    if (!USE_MOCK) return request.get({ url: '/hx.agent/detail', params })
    const item = agents.find((row) => row.id == params.id)
    return delay({
        ...item,
        bank_name: item ? bankName(item.bank_id) : '',
        branch_name: item ? branches.find((b) => b.id == item.branch_id)?.name || '' : ''
    })
}

// 经办人新增
export function agentAdd(params: any) {
    if (!USE_MOCK) return request.post({ url: '/hx.agent/add', params })
    const id = nextId(agents)
    agents.push({
        id,
        auth_status: 0,
        perms: [],
        last_login_time: '',
        create_time: '',
        ...params
    })
    // 支行绑定唯一经办人
    const branch = branches.find((b) => b.id == params.branch_id)
    if (branch) branch.agent_id = id
    return delay({})
}

// 经办人编辑
export function agentEdit(params: any) {
    if (!USE_MOCK) return request.post({ url: '/hx.agent/edit', params })
    const index = agents.findIndex((item) => item.id == params.id)
    if (index > -1) {
        const oldBranchId = agents[index].branch_id
        agents[index] = { ...agents[index], ...params }
        if (oldBranchId != params.branch_id) {
            const old = branches.find((b) => b.id == oldBranchId)
            if (old && old.agent_id == params.id) old.agent_id = 0
            const current = branches.find((b) => b.id == params.branch_id)
            if (current) current.agent_id = params.id
        }
    }
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
