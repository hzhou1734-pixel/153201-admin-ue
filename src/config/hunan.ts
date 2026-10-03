/**
 * 湖南省 14 个市州 —— 支行归属限定范围
 * 依据需求 P-03：支行归属限定湖南省 14 个市州（按市州选择）
 */
export const HUNAN_CITY_LIST: string[] = [
    '长沙市',
    '株洲市',
    '湘潭市',
    '衡阳市',
    '邵阳市',
    '岳阳市',
    '常德市',
    '张家界市',
    '益阳市',
    '郴州市',
    '永州市',
    '怀化市',
    '娄底市',
    '湘西土家族苗族自治州'
]

/**
 * 放款审批流转角色（P-08）
 * 顺序固定不可跳级：风控负责人 → 财务负责人 → 总经理（500万及以下）→ 董事长（500万以上）
 */
export const LOAN_500W = 5000000

export const LOAN_APPROVAL_ROLES: string[] = [
    '风控负责人',
    '财务负责人',
    '总经理',
    '董事长'
]

/** 依据金额计算需要经过的审批节点 */
export function getLoanApprovalNodes(amount: number): string[] {
    return amount > LOAN_500W
        ? [...LOAN_APPROVAL_ROLES]
        : LOAN_APPROVAL_ROLES.filter((role) => role !== '董事长')
}

/** 业务状态（客户端可见） */
export const BUSINESS_STATUS_MAP: Record<string, string> = {
    auditing: '审核中',
    loaning: '放款中',
    rejected: '已拒绝',
    finished: '已完成'
}

/** 银行经办人账号状态 */
export const BANK_AGENT_STATUS_MAP: Record<number, string> = {
    0: '停用',
    1: '启用'
}

/** 回款凭证确认状态 */
export const REPAYMENT_STATUS_MAP: Record<number, string> = {
    0: '待确认',
    1: '已确认',
    2: '已驳回'
}
