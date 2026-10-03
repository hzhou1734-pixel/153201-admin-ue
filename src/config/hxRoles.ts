/**
 * 红星钱谷业务系统 —— 角色定义
 *
 * 权限拆分依据（需求文档）：
 * - P-08 放款审批：风控负责人 → 财务负责人 → 总经理 → 董事长（顺序固定不可跳级）
 * - P-05 银行经办人（选择银行 + 选择平台用户生成）：总经理 / 超级管理员
 * - P-09 放款登记 / P-10 回款确认：财务负责人
 * - P-02 分配权限 / P-04 客户归属分配：总经理
 * - P-11 三方对接 / P-12 角色权限：管理员
 */
import { ref } from 'vue'

// 超级管理员：可见全部菜单与操作（后台最高权限）
export const HX_ROLE_SUPER = '超级管理员'
// 风控负责人：业务审核 + 放款审批首节点（原认证审核已下线）
export const HX_ROLE_RISK = '风控负责人'
// 财务负责人：放款审批次节点 + 放款登记 + 回款确认
export const HX_ROLE_FINANCE = '财务负责人'
// 总经理：500 万及以下放款终审 + 客户归属分配 + 经办人权限分配
export const HX_ROLE_GM = '总经理'
// 董事长：500 万以上放款终审
export const HX_ROLE_CHAIRMAN = '董事长'

/** 全部角色（含管理员），用于角色切换与菜单过滤 */
export const HX_ROLES = [
    HX_ROLE_SUPER,
    HX_ROLE_RISK,
    HX_ROLE_FINANCE,
    HX_ROLE_GM,
    HX_ROLE_CHAIRMAN
]

/** 放款审批四角色（P-08，不含管理员） */
export const HX_APPROVAL_ROLES = [HX_ROLE_RISK, HX_ROLE_FINANCE, HX_ROLE_GM, HX_ROLE_CHAIRMAN]

/** 当前模拟角色（本地演示用；正式接入后端后由登录账号权限决定） */
export const HX_ROLE_KEY = 'hx_mock_role'

export function getCurrentHxRole(): string {
    try {
        return localStorage.getItem(HX_ROLE_KEY) || HX_ROLE_SUPER
    } catch (error) {
        return HX_ROLE_SUPER
    }
}

export function setCurrentHxRole(role: string) {
    try {
        localStorage.setItem(HX_ROLE_KEY, role)
    } catch (error) {
        // ignore
    }
}

/**
 * 当前角色（响应式）：侧边栏菜单过滤、待办列表过滤均依赖该状态。
 * 正式接入后端后，这里应改为登录账号的角色信息。
 */
export const currentHxRole = ref(getCurrentHxRole())

/** 切换当前角色（同时持久化，页面刷新后保持一致） */
export function applyHxRole(role: string) {
    setCurrentHxRole(role)
    currentHxRole.value = role
}
