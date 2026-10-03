import request from '@/utils/request'

import {
    bankAgentApplies,
    bankAgents,
    bankName,
    branchName,
    businesses,
    delay,
    eq,
    like,
    nextId,
    now,
    paginate,
    pushLog,
    USE_MOCK
} from './mock'

/* ==================== 银行经办人（P-05 调整：认证申请审核通过后生成） ==================== */

/**
 * 银行经办人列表
 * 数据来源：用户在客户端提交「银行经办人认证申请」，经管理后台审核通过后自动生成，
 * 后台不再提供「添加银行经办人」入口；业务笔数按所属银行 / 支行实时统计
 */
export function bankAgentLists(params: any) {
    if (!USE_MOCK) {
        return request.get({ url: '/hx.bankAgent/lists', params }, { ignoreCancelToken: true })
    }
    const list = bankAgents
        .filter(
            (item) =>
                like(item.name, params.name) &&
                like(item.mobile, params.mobile) &&
                eq(item.bank_id, params.bank_id) &&
                eq(item.status, params.status)
        )
        .map((item) => ({
            ...item,
            sn: item.apply_sn,
            bank_name: bankName(item.bank_id),
            branch_name: item.branch_id ? branchName(item.branch_id) : '全行',
            // 登录规则：仅「已通过 + 账号启用」的经办人可登录前端提交业务操作
            can_login: item.status == 1,
            business_count: businesses.filter(
                (b) => b.bank_id == item.bank_id && (!item.branch_id || b.branch_id == item.branch_id)
            ).length
        }))
    return paginate(list, params)
}

// 银行经办人详情
export function bankAgentDetail(params: any) {
    if (!USE_MOCK) return request.get({ url: '/hx.bankAgent/detail', params })
    const item = bankAgents.find((row) => row.id == params.id)
    return delay({
        ...item,
        bank_name: item ? bankName(item.bank_id) : '',
        branch_name: item && item.branch_id ? branchName(item.branch_id) : '全行'
    })
}

// 银行经办人编辑（岗位 / 状态 / 备注；银行与经办人由认证审核确定，不可变更）
export function bankAgentEdit(params: any) {
    if (!USE_MOCK) return request.post({ url: '/hx.bankAgent/edit', params })
    const index = bankAgents.findIndex((item) => item.id == params.id)
    if (index > -1) {
        bankAgents[index] = { ...bankAgents[index], ...params }
        pushLog('银行经办人', '编辑经办人', `银行经办人「${bankAgents[index].name}」资料已更新`)
    }
    return delay({})
}

// 银行经办人启停用
export function bankAgentStatus(params: any) {
    if (!USE_MOCK) return request.post({ url: '/hx.bankAgent/status', params })
    const item = bankAgents.find((row) => row.id == params.id)
    if (item) {
        item.status = params.status
        pushLog(
            '银行经办人',
            params.status == 1 ? '启用经办人' : '停用经办人',
            `银行经办人「${item.name}」账号已${params.status == 1 ? '启用' : '停用'}`
        )
    }
    return delay({})
}

// 移除银行经办人（取消其银行经办人身份，不影响平台用户本身）
export function bankAgentRemove(params: any) {
    if (!USE_MOCK) return request.post({ url: '/hx.bankAgent/remove', params })
    const index = bankAgents.findIndex((row) => row.id == params.id)
    if (index > -1) {
        pushLog('银行经办人', '移除经办人', `银行经办人「${bankAgents[index].name}」已移除`)
        bankAgents.splice(index, 1)
    }
    return delay({})
}

/* ==================== 银行经办人认证申请（P-05 调整：经办人账号来源） ==================== */

const applyStatusText = (status: string) =>
    status == 'pending' ? '待审核' : status == 'approved' ? '已通过' : '已驳回'

/**
 * 认证申请列表
 * 用户在客户端 / 小程序提交的认证申请，管理后台在此审核
 */
export function bankAgentApplyLists(params: any) {
    if (!USE_MOCK) {
        return request.get({ url: '/hx.bankAgent/applyLists', params }, { ignoreCancelToken: true })
    }
    const list = bankAgentApplies
        .filter(
            (item) =>
                like(item.name, params.name) &&
                like(item.mobile, params.mobile) &&
                eq(item.bank_id, params.bank_id) &&
                eq(item.status, params.status)
        )
        .map((item) => ({
            ...item,
            bank_name: bankName(item.bank_id),
            branch_name: item.branch_id ? branchName(item.branch_id) : '全行',
            status_text: applyStatusText(item.status),
            // 登录规则：仅审核通过的申请具备前端登录权限
            can_login: item.status == 'approved',
            material_count: (item.materials || []).length
        }))
    return paginate(list, params)
}

// 认证申请详情
export function bankAgentApplyDetail(params: any) {
    if (!USE_MOCK) return request.get({ url: '/hx.bankAgent/applyDetail', params })
    const item = bankAgentApplies.find((row) => row.id == params.id)
    return delay({
        ...item,
        bank_name: item ? bankName(item.bank_id) : '',
        branch_name: item && item.branch_id ? branchName(item.branch_id) : '全行',
        status_text: item ? applyStatusText(item.status) : ''
    })
}

/**
 * 认证申请审核
 * - result = 'pass'  ：申请状态置为「已通过」，并写入 bankAgents——该用户成为对应银行的银行经办人
 * - result = 'reject'：申请状态置为「已驳回」，记录驳回理由（必填）
 */
export function bankAgentApplyAudit(params: any) {
    if (!USE_MOCK) return request.post({ url: '/hx.bankAgent/applyAudit', params })
    const apply = bankAgentApplies.find((row) => row.id == params.id)
    if (!apply) return delay({})
    const pass = params.result == 'pass'
    apply.status = pass ? 'approved' : 'rejected'
    apply.audit_user = params.audit_user || '当前登录账号'
    apply.audit_time = now()
    apply.reject_reason = pass ? '' : params.reason || ''
    if (pass) {
        // 审核通过 → 该用户获得对应银行的银行经办人身份（同一用户 + 同一银行不重复生成）
        const exists = bankAgents.find(
            (item) => item.user_id == apply.user_id && item.bank_id == apply.bank_id
        )
        if (!exists) {
            bankAgents.unshift({
                id: nextId(bankAgents),
                user_id: apply.user_id,
                apply_sn: apply.sn,
                name: apply.name,
                mobile: apply.mobile,
                bank_id: apply.bank_id,
                branch_id: apply.branch_id || 0,
                position: apply.position || '',
                status: 1,
                business_count: 0,
                audit_user: apply.audit_user,
                audit_time: apply.audit_time,
                last_login_time: '',
                remark: apply.remark || ''
            })
        }
        pushLog(
            '银行经办人',
            '认证审核通过',
            `「${apply.name}」的银行经办人认证已通过，成为「${bankName(apply.bank_id)}」经办人`
        )
    } else {
        pushLog(
            '银行经办人',
            '认证审核驳回',
            `「${apply.name}」的银行经办人认证被驳回：${apply.reject_reason}`
        )
    }
    return delay({})
}

/**
 * 认证申请状态统计：供列表页「待审核 / 已通过 / 已驳回」tab 计数使用
 * · pending  ：待审核申请数
 * · approved ：已通过的申请数
 * · rejected ：已驳回申请数
 * · accounts ：当前在册的银行经办人账号数（已通过且未移除）
 */
export function bankAgentApplyCounts() {
    if (!USE_MOCK) return request.get({ url: '/hx.bankAgent/applyCounts' })
    const applyCount = (status: string) =>
        bankAgentApplies.filter((item) => item.status == status).length
    return delay({
        pending: applyCount('pending'),
        approved: applyCount('approved'),
        rejected: applyCount('rejected'),
        accounts: bankAgents.length
    })
}
