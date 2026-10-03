<template>
    <div class="hx-bank-agent">
        <el-card class="!border-none" shadow="never">
            <el-form class="mb-[-16px]" :model="formData" inline>
                <el-form-item class="w-[200px]" label="姓名">
                    <el-input
                        v-model="formData.name"
                        placeholder="请输入姓名"
                        clearable
                        @keyup.enter="resetPage"
                    />
                </el-form-item>
                <el-form-item class="w-[220px]" label="手机号">
                    <el-input
                        v-model="formData.mobile"
                        placeholder="请输入手机号"
                        clearable
                        @keyup.enter="resetPage"
                    />
                </el-form-item>
                <el-form-item
                    class="w-[220px]"
                    :label="activeTab === 'approved' ? '所属银行' : '申请银行'"
                >
                    <el-select v-model="formData.bank_id" clearable placeholder="全部">
                        <el-option label="全部" value="" />
                        <el-option
                            v-for="item in optionsData.bank"
                            :key="item.id"
                            :label="item.name"
                            :value="item.id"
                        />
                    </el-select>
                </el-form-item>
                <el-form-item v-if="activeTab === 'approved'" class="w-[200px]" label="账号状态">
                    <el-select v-model="formData.status" clearable placeholder="全部">
                        <el-option label="全部" value="" />
                        <el-option label="启用" :value="1" />
                        <el-option label="停用" :value="0" />
                    </el-select>
                </el-form-item>
                <el-form-item>
                    <el-button type="primary" @click="resetPage">查询</el-button>
                    <el-button @click="resetParams">重置</el-button>
                </el-form-item>
            </el-form>
        </el-card>

        <el-card v-loading="pager.loading" class="mt-4 !border-none" shadow="never">
            <el-tabs v-model="activeTab" @tab-change="handleTabChange">
                <el-tab-pane name="pending">
                    <template #label>
                        待审核<span class="hx-tab-count">{{ counts.pending }}</span>
                    </template>
                </el-tab-pane>
                <el-tab-pane name="approved">
                    <template #label>
                        已通过<span class="hx-tab-count">{{ counts.approved }}</span>
                    </template>
                </el-tab-pane>
                <el-tab-pane name="rejected">
                    <template #label>
                        已驳回<span class="hx-tab-count">{{ counts.rejected }}</span>
                    </template>
                </el-tab-pane>
            </el-tabs>

            <div class="mb-3 text-xs text-tx-secondary">
                登录规则：仅「已通过」且账号为启用状态的经办人可正常登录前端提交业务操作；待审核、已驳回、已停用账号均无法登录。
            </div>

            <el-table :data="pager.lists" size="large">
                <el-table-column label="申请编号" prop="sn" min-width="165" />
                <el-table-column
                    :label="activeTab === 'approved' ? '经办人姓名' : '申请人'"
                    prop="name"
                    min-width="110"
                />
                <el-table-column label="手机号" prop="mobile" min-width="130" />
                <el-table-column
                    :label="activeTab === 'approved' ? '所属银行' : '申请银行'"
                    prop="bank_name"
                    min-width="120"
                    show-tooltip-when-overflow
                />
                <el-table-column
                    :label="activeTab === 'approved' ? '所属支行' : '申请支行'"
                    prop="branch_name"
                    min-width="135"
                    show-tooltip-when-overflow
                />
                <el-table-column v-if="activeTab !== 'approved'" label="认证状态" min-width="96">
                    <template #default="{ row }">
                        <el-tag :type="row.status === 'pending' ? 'warning' : 'danger'" size="small">
                            {{ row.status_text }}
                        </el-tag>
                    </template>
                </el-table-column>
                <el-table-column v-if="activeTab === 'approved'" label="账号状态" min-width="96">
                    <template #default="{ row }">
                        <el-tag :type="row.status == 1 ? 'success' : 'info'" size="small">
                            {{ row.status == 1 ? '启用' : '停用' }}
                        </el-tag>
                    </template>
                </el-table-column>
                <el-table-column label="前端登录" min-width="96">
                    <template #default="{ row }">
                        <el-tag :type="row.can_login ? 'success' : 'info'" size="small" effect="light">
                            {{ row.can_login ? '可登录' : '不可登录' }}
                        </el-tag>
                    </template>
                </el-table-column>
                <el-table-column
                    v-if="activeTab !== 'approved'"
                    label="提交时间"
                    prop="apply_time"
                    min-width="165"
                />
                <el-table-column
                    v-if="activeTab === 'approved'"
                    label="认证通过时间"
                    prop="audit_time"
                    min-width="165"
                />
                <el-table-column v-if="activeTab !== 'pending'" label="审核人" min-width="105">
                    <template #default="{ row }">
                        {{ row.audit_user || '—' }}
                    </template>
                </el-table-column>
                <el-table-column
                    v-if="activeTab === 'rejected'"
                    label="驳回理由"
                    prop="reject_reason"
                    min-width="220"
                    show-tooltip-when-overflow
                />
                <el-table-column
                    v-if="activeTab === 'approved'"
                    label="关联业务数"
                    prop="business_count"
                    min-width="110"
                />
                <el-table-column
                    v-if="activeTab === 'approved'"
                    label="最近登录"
                    prop="last_login_time"
                    min-width="165"
                >
                    <template #default="{ row }">
                        {{ row.last_login_time || '—' }}
                    </template>
                </el-table-column>
                <el-table-column label="操作" width="190" fixed="right">
                    <template #default="{ row }">
                        <template v-if="activeTab === 'pending'">
                            <span
                                class="hx-op-cell inline-flex"
                                @click="withPerm(() => handleAudit(row))"
                            >
                                <el-button type="primary" link :disabled="!canManage">
                                    审核
                                </el-button>
                            </span>
                            <span
                                class="hx-op-cell inline-flex"
                                @click="withPerm(() => handlePass(row))"
                            >
                                <el-button type="success" link :disabled="!canManage">
                                    通过
                                </el-button>
                            </span>
                            <span
                                class="hx-op-cell inline-flex"
                                @click="withPerm(() => handleReject(row))"
                            >
                                <el-button type="danger" link :disabled="!canManage">
                                    驳回
                                </el-button>
                            </span>
                        </template>
                        <template v-else-if="activeTab === 'rejected'">
                            <el-button type="primary" link @click="handleDetail(row)">
                                详情
                            </el-button>
                        </template>
                        <template v-else>
                            <span
                                class="hx-op-cell inline-flex"
                                @click="withPerm(() => handleEdit(row))"
                            >
                                <el-button type="primary" link :disabled="!canManage">
                                    编辑
                                </el-button>
                            </span>
                            <span
                                class="hx-op-cell inline-flex"
                                @click="withPerm(() => changeStatus(row))"
                            >
                                <el-button type="primary" link :disabled="!canManage">
                                    {{ row.status == 1 ? '停用' : '启用' }}
                                </el-button>
                            </span>
                            <span
                                class="hx-op-cell inline-flex"
                                @click="withPerm(() => handleRemove(row))"
                            >
                                <el-button type="danger" link :disabled="!canManage">
                                    移除
                                </el-button>
                            </span>
                        </template>
                    </template>
                </el-table-column>
                <template #empty>
                    <el-empty :description="emptyText" />
                </template>
            </el-table>
            <div class="flex mt-4 justify-end">
                <pagination v-model="pager" @change="getLists" />
            </div>
        </el-card>

        <detail-popup
            v-if="showDetail"
            ref="detailRef"
            :mode="detailMode"
            @pass="handlePass"
            @reject="handleReject"
            @close="showDetail = false"
        />
        <reject-popup
            v-if="showReject"
            ref="rejectRef"
            title="驳回经办人认证申请"
            tips="驳回后申请人可在客户端修改资料后重新提交；驳回理由必填并同步给申请人。"
            :quick-list="quickReasons"
            @close="showReject = false"
        />
        <edit-popup v-if="showEdit" ref="editRef" @success="getLists" @close="showEdit = false" />
    </div>
</template>

<script lang="ts" setup name="hxBankAgent">
import {
    bankAgentApplyAudit,
    bankAgentApplyCounts,
    bankAgentApplyLists,
    bankAgentLists,
    bankAgentRemove,
    bankAgentStatus
} from '@/api/hx/bankAgent'
import { bankAll } from '@/api/hx/bank'
import { HX_ROLE_GM, HX_ROLE_SUPER, currentHxRole } from '@/config/hxRoles'
import { useDictOptions } from '@/hooks/useDictOptions'
import { usePaging } from '@/hooks/usePaging'
import feedback from '@/utils/feedback'
import DetailPopup from '@/views/hx/bankAgentAuth/detail.vue'
import RejectPopup from '@/views/hx/components/reject-popup.vue'

import EditPopup from './edit.vue'

/**
 * 用户管理 · 银行经办人（P-05 调整）
 * 账号来源：用户在客户端 / 小程序提交「银行经办人认证申请」→ 管理后台审核
 *（审核中心 · 经办人认证审核 / 本页「待审核」tab）→ 审核通过后自动成为对应银行的经办人。
 * 因此本页不提供「添加」入口，仅支持查看、审核与编辑资料、停用 / 移除。
 *
 * 列表按认证状态分「待审核 / 已通过 / 已驳回」三个 tab：
 *   · 待审核 / 已驳回 → 用户在客户端提交的认证申请（可在此直接审核或查看驳回理由）
 *   · 已通过           → 认证通过后在册的银行经办人账号（可编辑、停用启、移除）
 * 登录规则：仅「已通过」且账号启用状态的经办人可登录前端提交业务操作。
 * 管理权限归总经理与超级管理员；其余角色只读查看。
 */
const canManage = computed(() =>
    [HX_ROLE_SUPER, HX_ROLE_GM].includes(currentHxRole.value)
)

const activeTab = ref<'pending' | 'approved' | 'rejected'>('pending')
const counts = reactive({ pending: 0, approved: 0, rejected: 0 })

const detailRef = shallowRef<InstanceType<typeof DetailPopup>>()
const rejectRef = shallowRef<InstanceType<typeof RejectPopup>>()
const editRef = shallowRef<InstanceType<typeof EditPopup>>()
const showDetail = ref(false)
const showReject = ref(false)
const showEdit = ref(false)
const detailMode = ref<'audit' | 'view'>('audit')

const quickReasons = [
    '工作证明未加盖单位公章',
    '身份证件照片模糊，无法识别',
    '所申请支行已暂停业务，暂不开放认证',
    '申请人岗位与所申请业务权限不匹配'
]

const formData = reactive({
    name: '',
    mobile: '',
    bank_id: '',
    status: ''
})

/**
 * 列表数据源随 tab 切换：
 * · 待审核 / 已驳回 → 认证申请数据
 * · 已通过           → 在册银行经办人数据
 */
const { pager, getLists, resetParams, resetPage } = usePaging({
    fetchFun: (params: any) => {
        if (activeTab.value === 'approved') {
            return bankAgentLists({ ...params, status: formData.status })
        }
        return bankAgentApplyLists({ ...params, status: activeTab.value })
    },
    params: formData
})

const { optionsData } = useDictOptions<{ bank: any[] }>({
    bank: { api: bankAll }
})

const emptyText = computed(() =>
    activeTab.value === 'pending'
        ? '暂无待审核的经办人认证申请'
        : activeTab.value === 'approved'
          ? '暂无银行经办人，待用户提交认证申请并经审核通过后自动生成'
          : '暂无已驳回的经办人认证申请'
)

/** tab 计数：待审核 / 已驳回取申请数，已通过取在册经办人账号数 */
const countsRefresh = async () => {
    const res: any = await bankAgentApplyCounts()
    counts.pending = res.pending
    counts.approved = res.accounts
    counts.rejected = res.rejected
}

const handleTabChange = () => {
    formData.status = ''
    countsRefresh()
    resetPage()
}

/** 权限拦截：无管理权限时给出提示（禁用按钮不派发事件，由外层 .hx-op-cell 承接） */
const withPerm = (fn: () => any) => {
    if (!canManage.value) {
        return feedback.msgWarning('银行经办人管理权限归总经理与超级管理员')
    }
    return fn()
}

// 待审核：打开审核弹窗（内含 审核通过 / 驳回）
const handleAudit = async (row: any) => {
    detailMode.value = 'audit'
    showDetail.value = true
    await nextTick()
    detailRef.value?.open(row)
}

// 已驳回：仅查看申请资料与驳回理由
const handleDetail = async (row: any) => {
    detailMode.value = 'view'
    showDetail.value = true
    await nextTick()
    detailRef.value?.open(row)
}

const handlePass = async (row: any) => {
    await feedback.confirm(
        `确认通过「${row.name}」的银行经办人认证申请？通过后该用户将成为「${row.bank_name}」的银行经办人，可登录前端提交业务操作。`
    )
    await bankAgentApplyAudit({ id: row.id, result: 'pass' })
    feedback.msgSuccess(`已通过，「${row.name}」已成为${row.bank_name}经办人`)
    showDetail.value = false
    countsRefresh()
    getLists()
}

const handleReject = async (row: any) => {
    showReject.value = true
    await nextTick()
    rejectRef.value?.open(row, async (reason: string) => {
        await bankAgentApplyAudit({ id: row.id, result: 'reject', reason })
        feedback.msgSuccess('已驳回，驳回理由已同步给申请人')
        showDetail.value = false
        countsRefresh()
        getLists()
    })
}

const changeStatus = async (row: any) => {
    const status = row.status == 1 ? 0 : 1
    await bankAgentStatus({ id: row.id, status })
    feedback.msgSuccess(status == 1 ? '银行经办人已启用' : '银行经办人已停用')
    countsRefresh()
    getLists()
}

const handleEdit = async (row: any) => {
    showEdit.value = true
    await nextTick()
    editRef.value?.open()
    editRef.value?.setFormData(row)
}

const handleRemove = async (row: any) => {
    await feedback.confirm(
        `确认移除银行经办人「${row.name}」？移除后该用户不再具备 ${row.bank_name} 经办人身份，也无法登录前端提交业务操作（平台用户本身不受影响）。`
    )
    await bankAgentRemove({ id: row.id })
    feedback.msgSuccess('银行经办人已移除')
    countsRefresh()
    getLists()
}

onMounted(() => {
    getLists()
    countsRefresh()
})
</script>

<style lang="scss">
/**
 * 操作栏：Chrome 下禁用态按钮不派发（也不冒泡）鼠标事件，
 * 让禁用按钮 pointer-events: none，点击由外层 .hx-op-cell 接管并给出权限提示。
 */
.hx-op-cell {
    cursor: pointer;

    .el-button.is-disabled {
        pointer-events: none;
    }
}

/** tab 右侧状态计数徽标 */
.hx-tab-count {
    display: inline-block;
    min-width: 18px;
    padding: 0 5px;
    margin-left: 4px;
    font-size: 12px;
    line-height: 18px;
    text-align: center;
    border-radius: 9px;
    color: var(--el-text-color-secondary);
    background: var(--el-fill-color);
}
</style>
