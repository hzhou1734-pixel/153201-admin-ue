import request from '@/utils/request'

import {
    agentName,
    agents,
    bankName,
    branchName,
    businesses,
    customers,
    delay,
    eq,
    like,
    loans,
    paginate,
    pushLog,
    repayments,
    USE_MOCK
} from './mock'

/* ==================== 客户列表 / 详情 / 归属分配（P-04） ==================== */

/** 业务状态文案（与业务审核模块保持一致） */
const BUSINESS_STATUS: Record<string, string> = {
    auditing: '审核中',
    loaning: '放款中',
    rejected: '已拒绝',
    finished: '已完成'
}

/**
 * 客户的历史提交贷款申请数据
 * 关联口径：业务表 customer_id 命中客户 ID，或实名手机号一致（兼容后台录入时未回填 ID 的历史数据）
 */
function applicationsOf(customerId: any, mobile?: string) {
    return businesses
        .filter((item: any) => item.customer_id == customerId || (mobile && item.customer_mobile == mobile))
        .map((item: any) => {
            const loan = loans.find((row: any) => row.business_id == item.id)
            const repays = repayments.filter(
                (row: any) => row.business_id == item.id || row.sn == item.sn
            )
            return {
                id: item.id,
                sn: item.sn,
                amount: item.amount,
                bank_name: bankName(item.bank_id),
                branch_name: branchName(item.branch_id),
                agent_name: agentName(item.agent_id),
                agent_id: item.agent_id,
                material_type: item.material_type,
                submit_time: item.submit_time,
                sign_time: item.sign_time,
                status: item.status,
                status_text: BUSINESS_STATUS[item.status] || '—',
                reject_reason: item.reject_reason,
                remark: item.remark,
                material_count: item.materials?.length || 0,
                // 审批 / 放款 / 回款三段进度
                approval_status_text: loan
                    ? { pending: '审批中', approved: '审批通过', rejected: '已驳回' }[loan.status as string]
                    : '—',
                paid_status: loan?.paid_status ?? 0,
                paid_status_text: loan?.paid_status == 1 ? '已放款' : '待放款',
                pay_time: loan?.pay_time || '',
                repay_count: repays.length,
                repay_amount: repays
                    .filter((row: any) => row.status == 1)
                    .reduce((sum: number, row: any) => sum + (row.amount || 0), 0)
            }
        })
        .sort((a: any, b: any) => String(b.submit_time).localeCompare(String(a.submit_time)))
}

/** 客户的贷款申请统计（累计申请 / 在贷 / 已放款 / 已回款） */
function statisticOf(list: any[]) {
    const finished = list.filter((item: any) => item.paid_status == 1)
    return {
        apply_count: list.length,
        apply_amount: list.reduce((sum: number, item: any) => sum + (item.amount || 0), 0),
        ongoing_count: list.filter((item: any) => ['auditing', 'loaning'].includes(item.status)).length,
        loan_count: finished.length,
        loan_amount: finished.reduce((sum: number, item: any) => sum + (item.amount || 0), 0),
        repay_amount: list.reduce((sum: number, item: any) => sum + (item.repay_amount || 0), 0)
    }
}

/** 客户数据装饰：归属经办人 / 所属机构 / 绑定状态 / 业务统计 */
function decorate(item: any, withExtras = false) {
    const agent = agents.find((row: any) => row.id == item.agent_id)
    const applications = applicationsOf(item.id, item.mobile)
    const base = {
        ...item,
        // 客户类型：person 个人 / company 企业（P-04 补充）
        customer_type: item.customer_type === 'company' ? 'company' : 'person',
        customer_type_text: item.customer_type === 'company' ? '企业' : '个人',
        agent_name: item.agent_id ? agentName(item.agent_id) : '',
        agent_mobile: agent?.mobile || '',
        bank_name: agent ? bankName(agent.bank_id) : '—',
        branch_name: agent ? branchName(agent.branch_id) : (item.branch_name || '—'),
        bind_status_text: item.bind_status == 1 ? '已扫码绑定' : '未绑定',
        // 业务笔数按真实业务数据实时统计，避免静态字段与业务表不一致
        business_count: applications.length,
        apply_amount: applications.reduce((sum: number, row: any) => sum + (row.amount || 0), 0)
    }
    if (!withExtras) return base
    const sns = applications.map((row: any) => row.sn)
    return {
        ...base,
        applications,
        statistic: statisticOf(applications),
        repayment_records: repayments
            .filter((row: any) => row.customer_name == item.name || sns.includes(row.sn))
            .map((row: any) => ({
                ...row,
                status_text: ['待确认', '已确认', '已驳回'][row.status] || '—',
                voucher_count: row.vouchers?.length || 0
            }))
    }
}

/**
 * 客户列表
 * 约束（P-04）：
 * 1. 分配权限归总经理
 * 2. 已归属（含已扫码绑定）客户同样支持修改归属
 */
export function customerLists(params: any) {
    if (!USE_MOCK) {
        return request.get({ url: '/hx.customer/lists', params }, { ignoreCancelToken: true })
    }
    const list = customers
        .filter(
            (item) =>
                like(item.name, params.name) &&
                like(item.mobile, params.mobile) &&
                eq(item.customer_type, params.customer_type) &&
                eq(item.agent_id, params.agent_id) &&
                eq(item.bind_status, params.bind_status)
        )
        .map((item) => decorate(item))
    return paginate(list, params)
}

// 为客户指定 / 变更业务经办人（已归属客户同样支持重新指定）
export function customerAssign(params: any) {
    if (!USE_MOCK) return request.post({ url: '/hx.customer/assign', params })
    const item = customers.find((row) => row.id == params.id)
    if (!item) return delay({})
    const before = item.agent_id ? agentName(item.agent_id) : '未分配'
    item.agent_id = params.agent_id
    pushLog(
        '客户管理',
        '客户归属分配',
        `客户「${item.name}」归属经办人由「${before}」变更为「${agentName(params.agent_id)}」`
    )
    return delay({})
}

/**
 * 客户详情
 * 返回：客户基础数据 + 归属经办人信息 + 贷款申请统计 + 历史提交贷款申请数据 + 回款记录
 */
export function customerDetail(params: any) {
    if (!USE_MOCK) return request.get({ url: '/hx.customer/detail', params })
    const item = customers.find((row) => row.id == params.id)
    if (!item) return delay({})
    return delay(decorate(item, true))
}

/** 客户历史提交贷款申请数据（客户详情抽屉独立分页场景使用） */
export function customerApplications(params: any) {
    if (!USE_MOCK) {
        return request.get({ url: '/hx.customer/applications', params }, { ignoreCancelToken: true })
    }
    const item = customers.find((row) => row.id == params.customer_id)
    const list = applicationsOf(params.customer_id, item?.mobile)
    return paginate(list, params)
}
