import request from '@/utils/request'

import {
    agentName,
    agents,
    banks,
    branches,
    delay,
    eq,
    like,
    nextId,
    paginate,
    pushLog,
    USE_MOCK
} from './mock'

/* ==================== 银行（P-03） ==================== */

// 银行列表
export function bankLists(params: any) {
    if (!USE_MOCK) {
        return request.get({ url: '/hx.bank/lists', params }, { ignoreCancelToken: true })
    }
    const list = banks
        .filter((item) => like(item.name, params.name) && eq(item.status, params.status))
        .map((item) => ({ ...item, branch_count: branches.filter((b) => b.bank_id == item.id).length }))
    return paginate(list, params)
}

// 银行全部（下拉用）
export function bankAll(params: any = {}) {
    if (!USE_MOCK) return request.get({ url: '/hx.bank/all', params })
    return delay(banks.filter((item) => item.status === 1).map((item) => ({ ...item })))
}

// 银行新增
export function bankAdd(params: any) {
    if (!USE_MOCK) return request.post({ url: '/hx.bank/add', params })
    banks.push({ id: nextId(banks), create_time: '', ...params })
    return delay({})
}

// 银行编辑
export function bankEdit(params: any) {
    if (!USE_MOCK) return request.post({ url: '/hx.bank/edit', params })
    const index = banks.findIndex((item) => item.id == params.id)
    if (index > -1) banks[index] = { ...banks[index], ...params }
    return delay({})
}

// 银行详情
export function bankDetail(params: any) {
    if (!USE_MOCK) return request.get({ url: '/hx.bank/detail', params })
    return delay({ ...banks.find((item) => item.id == params.id) })
}

/* ==================== 支行（P-03） ==================== */

// 支行列表
export function branchLists(params: any) {
    if (!USE_MOCK) {
        return request.get({ url: '/hx.branch/lists', params }, { ignoreCancelToken: true })
    }
    const list = branches
        .filter(
            (item) =>
                like(item.name, params.name) &&
                eq(item.bank_id, params.bank_id) &&
                eq(item.city, params.city) &&
                eq(item.status, params.status)
        )
        .map((item) => ({
            ...item,
            bank_name: banks.find((b) => b.id == item.bank_id)?.name || '—',
            agent_name: item.agent_id ? agentName(item.agent_id) : ''
        }))
    return paginate(list, params)
}

// 支行全部（按银行过滤，下拉用）
export function branchAll(params: any = {}) {
    if (!USE_MOCK) return request.get({ url: '/hx.branch/all', params })
    const list = branches
        .filter((item) => item.status === 1 && eq(item.bank_id, params.bank_id))
        .map((item) => ({
            ...item,
            bank_name: banks.find((b) => b.id == item.bank_id)?.name || '—',
            disabled: !!item.agent_id
        }))
    return delay(list)
}

// 支行新增
export function branchAdd(params: any) {
    if (!USE_MOCK) return request.post({ url: '/hx.branch/add', params })
    branches.push({ id: nextId(branches), agent_id: 0, create_time: '', ...params })
    return delay({})
}

// 支行编辑
export function branchEdit(params: any) {
    if (!USE_MOCK) return request.post({ url: '/hx.branch/edit', params })
    const index = branches.findIndex((item) => item.id == params.id)
    if (index > -1) branches[index] = { ...branches[index], ...params }
    return delay({})
}

// 支行详情
export function branchDetail(params: any) {
    if (!USE_MOCK) return request.get({ url: '/hx.branch/detail', params })
    const item = branches.find((row) => row.id == params.id)
    return delay({
        ...item,
        bank_name: item ? banks.find((b) => b.id == item.bank_id)?.name || '' : '',
        agent_name: item?.agent_id ? agentName(item.agent_id) : ''
    })
}

/**
 * 支行 · 可选业务经办人（「分配业务经办人」弹窗列表）
 * - 仅展示启用状态的业务经办人
 * - 已关联其它支行的经办人标记 disabled（同一支行仅一个经办人账号）
 * - 已关联当前支行的经办人标记 current，置顶并默认选中
 */
export function branchAgentOptions(params: any = {}) {
    if (!USE_MOCK) {
        return request.get({ url: '/hx.branch/agentOptions', params }, { ignoreCancelToken: true })
    }
    const list = agents
        .filter(
            (item) =>
                item.status === 1 &&
                like(item.name, params.name) &&
                like(item.mobile, params.mobile)
        )
        .map((item) => {
            const bound = branches.find((b) => b.agent_id == item.id)
            const current = !!bound && bound.id == params.branch_id
            return {
                ...item,
                bank_name: banks.find((b) => b.id == item.bank_id)?.name || '—',
                bound_branch_name: bound?.name || '',
                current,
                disabled: !!bound && !current,
                disabled_text: bound && !current ? `已关联${bound.name}` : ''
            }
        })
        .sort((a, b) => Number(b.current) - Number(a.current))
    return delay(list)
}

/**
 * 支行 · 分配业务经办人（agent_id = 0 表示取消关联）
 * 双向唯一：一个支行仅一个经办人，一个经办人仅挂一个支行，变更时同步解除旧绑定
 */
export function branchAssignAgent(params: any) {
    if (!USE_MOCK) return request.post({ url: '/hx.branch/assignAgent', params })
    const branch = branches.find((b) => b.id == params.id)
    if (!branch) return delay({})
    const agentId = Number(params.agent_id || 0)
    // 该支行原经办人解除绑定（同步清空其所属支行）
    const oldAgent = agents.find((a) => a.id == branch.agent_id)
    if (oldAgent && oldAgent.id != agentId) oldAgent.branch_id = 0
    if (agentId) {
        // 该经办人若已挂在其它支行，先解除对方
        const other = branches.find((b) => b.agent_id == agentId && b.id != branch.id)
        if (other) other.agent_id = 0
        const agent = agents.find((a) => a.id == agentId)
        if (agent) agent.branch_id = branch.id
    }
    branch.agent_id = agentId
    pushLog(
        '支行维护',
        agentId ? '分配业务经办人' : '取消业务经办人',
        agentId
            ? `「${branch.name}」已关联业务经办人「${agentName(agentId)}」`
            : `「${branch.name}」已取消业务经办人关联`
    )
    return delay({})
}
