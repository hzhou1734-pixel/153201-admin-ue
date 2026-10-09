import request from '@/utils/request'

import { agentName, bankName, branchName, businesses, currentRole, delay, eq, like, loans, now, paginate, pushLog, USE_MOCK } from './mock'

/** 依据金额计算审批节点（500万及以下：风控→财务→总经理；500万以上：再加董事长） */
export function approvalRoles(amount: number): string[] {
    return amount > 5000000
        ? ['风控负责人', '财务负责人', '总经理', '董事长']
        : ['风控负责人', '财务负责人', '总经理']
}

function decorate(item: any) {
    const roles = approvalRoles(item.amount)
    // 兼容历史数据：补齐节点数组
    if (!item.nodes || item.nodes.length < roles.length) {
        const nodes = roles.map((role: string, index: number) => {
            const exist = item.nodes?.find((n: any) => n.role == role)
            return exist || { role, status: index === 0 ? 0 : -1, user: '', time: '', remark: '' }
        })
        item.nodes = nodes
    }
    const currentNode = item.nodes.find((n: any) => n.status === 0)
    // 关联同编号业务：带出上游「提交业务 / 业务审核」节点，供「流程节点记录（全链路）」展示
    const biz = businesses.find((b) => b.sn == item.sn)
    return {
        ...item,
        bank_name: bankName(item.bank_id),
        branch_name: branchName(item.branch_id),
        agent_name: agentName(item.agent_id),
        roles,
        current_node: currentNode?.role || '—',
        current_index: nodeIndex(item),
        node_total: roles.length,
        paid_status_text: item.paid_status == 1 ? '已放款' : '待放款',
        status_text: { pending: '审批中', approved: '审批通过', rejected: '已驳回' }[item.status],
        submit_user: biz ? agentName(biz.agent_id) : '',
        submit_time: biz?.submit_time || '',
        review_user: biz?.review_user || '',
        review_time: biz?.review_time || '',
        biz_status: biz?.status || '',
        biz_reject_reason: biz?.reject_reason || '',
        pay_user: item.pay_user || '',
        pay_time: item.pay_time || ''
    }
}

function nodeIndex(item: any) {
    return item.nodes.findIndex((n: any) => n.status === 0)
}

/* ==================== 放款审批流转（P-08） ==================== */

export function loanLists(params: any) {
    if (!USE_MOCK) {
        return request.get({ url: '/hx.loan/lists', params }, { ignoreCancelToken: true })
    }
    const list = loans
        .map(decorate)
        .filter(
            (item) =>
                like(item.sn, params.sn) &&
                like(item.customer_name, params.customer_name) &&
                eq(item.bank_id, params.bank_id) &&
                eq(item.status, params.status) &&
                // 权限拆分：传入 role 时只返回「轮到该角色审批」的业务（顺序不可跳级）
                (!params.role || item.current_node === params.role)
        )
    return paginate(list, params)
}

// 审批状态数量统计（放款审批页状态栏）：按当前筛选条件统计各状态数量，忽略「审批状态」筛选本身
export function loanStatusCounts(params: any) {
    if (!USE_MOCK) {
        return request.get({ url: '/hx.loan/statusCount', params }, { ignoreCancelToken: true })
    }
    const base = loans
        .map(decorate)
        .filter(
            (item) =>
                like(item.sn, params.sn) &&
                like(item.customer_name, params.customer_name) &&
                eq(item.bank_id, params.bank_id) &&
                // 权限拆分：传入 role 时只统计「轮到该角色审批」的业务，与列表口径保持一致
                (!params.role || item.current_node === params.role)
        )
    const count = (status: string) => base.filter((item) => item.status === status).length
    return delay({
        all: base.length,
        pending: count('pending'),
        approved: count('approved'),
        rejected: count('rejected')
    })
}

export function loanDetail(params: any) {
    if (!USE_MOCK) return request.get({ url: '/hx.loan/detail', params })
    const item = loans.find((row) => row.id == params.id)
    return delay(item ? decorate(item) : {})
}

/**
 * 审批操作（通过 / 驳回）
 * 顺序固定不可跳级；任一驳回后续角色无需审核
 */
export function loanApprove(params: any) {
    if (!USE_MOCK) return request.post({ url: '/hx.loan/approve', params })
    const item = loans.find((row) => row.id == params.id)
    if (!item) return delay({})
    const index = nodeIndex(item)
    if (index === -1) return Promise.reject(new Error('该业务当前无待审批节点'))
    const node = item.nodes[index]
    if (node.role !== params.role) {
        return Promise.reject(new Error(`当前应由「${node.role}」审批，不可跳级`))
    }
    if (params.result === 1) {
        node.status = 1
        node.user = params.user
        node.time = now()
        node.remark = params.remark || '同意'
        if (index + 1 < item.nodes.length) {
            item.nodes[index + 1].status = 0
        } else {
            item.status = 'approved'
        }
        pushLog('放款管理', '审批通过', `业务「${item.sn}」${node.role}审批通过`)
    } else {
        node.status = 2
        node.user = params.user
        node.time = now()
        node.remark = params.remark
        item.status = 'rejected'
        pushLog('放款管理', '审批驳回', `业务「${item.sn}」${node.role}驳回：${params.remark}`)
    }
    return delay({})
}

/* ==================== 放款操作（状态登记）（P-09） ==================== */

// 待放款 / 已放款申请列表
export function loanPendingLists(params: any) {
    if (!USE_MOCK) {
        return request.get({ url: '/hx.loan/pending', params }, { ignoreCancelToken: true })
    }
    const list = loans
        .filter((item) => item.status === 'approved')
        .filter(
            (item) =>
                like(item.sn, params.sn) &&
                like(item.customer_name, params.customer_name) &&
                eq(item.paid_status, params.paid_status)
        )
        .map(decorate)
    return paginate(list, params)
}

/**
 * 已放款登记（财务线下完成放款后操作）
 * 联动：客户端业务状态转「已完成」；放款通知短信按场景推送
 */
export function loanMarkPaid(params: any) {
    if (!USE_MOCK) return request.post({ url: '/hx.loan/paid', params })
    const item = loans.find((row) => row.id == params.id)
    if (!item) return delay({})
    item.paid_status = 1
    item.pay_time = now()
    item.pay_user = currentRole()
    const business = businesses.find((b) => b.id == item.business_id)
    if (business) {
        business.status = 'finished'
    }
    pushLog(
        '放款管理',
        '已放款登记',
        `业务「${item.sn}」已放款登记，客户状态转「已完成」，放款通知短信已推送（客户 + 银行经办人）`
    )
    return delay({})
}

// 放款操作记录
export function loanPaidRecords() {
    if (!USE_MOCK) return request.get({ url: '/hx.loan/records' })
    return delay(
        loans
            .filter((item) => item.paid_status == 1)
            .map((item) => ({
                id: item.id,
                sn: item.sn,
                customer_name: item.customer_name,
                amount: item.amount,
                pay_time: item.pay_time,
                bank_name: bankName(item.bank_id),
                agent_name: agentName(item.agent_id)
            }))
    )
}
