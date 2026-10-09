import request from '@/utils/request'

import {
    bankAgents,
    bankName,
    branchName,
    businesses,
    delay,
    eq,
    like,
    paginate,
    pushLog,
    USE_MOCK
} from './mock'

/* ==================== 银行经办人（在册经办人列表：后台选择平台注册用户开通） ==================== */

/**
 * 银行经办人列表（在册）
 * 数据来源：后台在「业务经办人账号」页选择平台注册用户开通银行经办人权限后生成，
 * 账号身份（姓名 / 手机号 / 所属银行 / 支行）不可变更；业务笔数按所属银行 / 支行实时统计
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

// 银行经办人编辑（岗位 / 状态 / 备注；银行与经办人由后台选择用户开通确定，不可变更）
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
