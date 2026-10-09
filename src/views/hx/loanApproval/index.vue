<template>
    <div class="hx-loan-approval">
        <el-card class="!border-none" shadow="never">
            <el-form class="mb-[-16px]" :model="formData" inline>
                <el-form-item class="w-[220px]" label="业务编号">
                    <el-input
                        v-model="formData.sn"
                        placeholder="请输入业务编号"
                        clearable
                        @keyup.enter="handleQuery"
                    />
                </el-form-item>
                <el-form-item class="w-[200px]" label="客户姓名">
                    <el-input
                        v-model="formData.customer_name"
                        placeholder="请输入客户姓名"
                        clearable
                        @keyup.enter="handleQuery"
                    />
                </el-form-item>
                <el-form-item class="w-[240px]" label="所属银行">
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
                <el-form-item class="w-[200px]" label="审批状态">
                    <el-select
                        v-model="formData.status"
                        clearable
                        placeholder="全部"
                        @change="handleQuery"
                    >
                        <el-option label="全部" value="" />
                        <el-option label="审批中" value="pending" />
                        <el-option label="审批通过" value="approved" />
                        <el-option label="已驳回" value="rejected" />
                    </el-select>
                </el-form-item>
                <el-form-item>
                    <el-button type="primary" @click="handleQuery">查询</el-button>
                    <el-button @click="handleReset">重置</el-button>
                    <el-button :disabled="exporting" @click="handleExport">导出Excel</el-button>
                </el-form-item>
            </el-form>
        </el-card>

        <el-card v-loading="pager.loading" class="mt-4 !border-none" shadow="never">
            <div class="hx-status-bar">
                <div
                    v-for="tab in statusTabs"
                    :key="tab.value"
                    class="hx-status-tab"
                    :class="{ 'is-active': formData.status === tab.value }"
                    @click="switchStatus(tab.value)"
                >
                    <span class="hx-status-tab__label">{{ tab.label }}</span>
                    <span class="hx-status-tab__count">{{ counts[tab.key] ?? 0 }}</span>
                </div>
            </div>
            <div class="mb-3 flex items-center">
                <span class="text-tx-secondary">
                    当前审批身份：
                    <el-tag class="ml-1" size="small" effect="plain">{{ currentRole }}</el-tag>
                </span>
                <span v-if="isTodo && !isSuper" class="ml-4 text-tx-secondary text-sm">
                    仅展示轮到「{{ currentRole }}」审批的业务；顺序固定不可跳级
                </span>
            </div>
            <el-table :data="pager.lists" size="large">
                <el-table-column label="业务编号" prop="sn" min-width="160" />
                <el-table-column label="客户姓名" prop="customer_name" min-width="110" />
                <el-table-column label="放款金额" min-width="140">
                    <template #default="{ row }">
                        ¥{{ formatterAmount(row.amount) }}
                    </template>
                </el-table-column>
                <el-table-column label="银行 / 支行" min-width="210" show-tooltip-when-overflow>
                    <template #default="{ row }">
                        {{ row.bank_name }} / {{ row.branch_name }}
                    </template>
                </el-table-column>
                <el-table-column label="签约完成时间" prop="sign_time" min-width="180" />
                <el-table-column label="审批流程" min-width="240">
                    <template #default="{ row }">
                        <div class="flex flex-wrap items-center">
                            <template v-for="(node, index) in row.nodes" :key="index">
                                <span
                                    class="px-2 py-[2px] rounded text-xs mr-1 mb-1"
                                    :class="nodeClass(node)"
                                >
                                    {{ node.role }}
                                </span>
                                <icon
                                    v-if="index < row.nodes.length - 1"
                                    class="mr-1 mb-1 text-tx-secondary"
                                    name="el-icon-Right"
                                    :size="12"
                                />
                            </template>
                        </div>
                    </template>
                </el-table-column>
                <el-table-column label="当前审批节点" min-width="180">
                    <template #default="{ row }">
                        <el-tag v-if="row.status == 'pending'" type="warning" size="small">
                            {{ row.current_node }}（{{ row.current_index + 1 }}/{{ row.node_total }}）
                        </el-tag>
                        <span v-else>—</span>
                    </template>
                </el-table-column>
                <el-table-column label="审批状态" min-width="110">
                    <template #default="{ row }">
                        <el-tag
                            :type="
                                row.status == 'approved'
                                    ? 'success'
                                    : row.status == 'rejected'
                                      ? 'danger'
                                      : 'warning'
                            "
                            size="small"
                        >
                            {{ row.status_text }}
                        </el-tag>
                    </template>
                </el-table-column>
                <el-table-column label="操作" width="200" fixed="right">
                    <template #default="{ row }">
                        <el-button type="primary" link @click="handleDetail(row)">
                            审批 / 留痕
                        </el-button>
                        <el-button
                            v-if="isTodo && row.status == 'pending' && canApprove(row)"
                            type="success"
                            link
                            @click="handleApprove(row)"
                        >
                            审批
                        </el-button>
                    </template>
                </el-table-column>
            </el-table>
            <div class="flex mt-4 justify-end">
                <pagination v-model="pager" @change="getLists" />
            </div>
        </el-card>

        <detail-popup
            v-if="showDetail"
            ref="detailRef"
            @success="refresh"
            @close="showDetail = false"
        />
    </div>
</template>

<script lang="ts" setup name="hxLoanApproval">
import { bankAll } from '@/api/hx/bank'
import { loanLists, loanStatusCounts } from '@/api/hx/loan'
import { useDictOptions } from '@/hooks/useDictOptions'
import { usePaging } from '@/hooks/usePaging'
import { HX_ROLE_SUPER, currentHxRole } from '@/config/hxRoles'
import feedback from '@/utils/feedback'
import { exportHxExcel, fetchHxAllPages, type HxExportColumn } from '@/utils/hxExport'
import { formatterAmount } from '@/utils/util'

import DetailPopup from './detail.vue'

/**
 * 放款管理 · 放款审批（P-08）：待我审批 + 审批操作（顺序固定不可跳级，权限按角色拆分）。
 * 节点操作人 / 时间已内嵌于详情页「流程节点记录（全链路）」（原「审批留痕」独立页面已删除）。
 */
const props = withDefaults(defineProps<{ mode?: 'todo' }>(), { mode: 'todo' })

const isTodo = computed(() => props.mode === 'todo')
const currentRole = currentHxRole
const isSuper = computed(() => currentRole.value === HX_ROLE_SUPER)

const detailRef = shallowRef<InstanceType<typeof DetailPopup>>()
const showDetail = ref(false)
const formData = reactive({
    sn: '',
    customer_name: '',
    bank_id: '',
    // 待我审批：默认只看审批中；留痕页：全部状态
    status: isTodo.value ? 'pending' : '',
    // 非管理员身份时只取轮到本人审批的业务（管理员看全部待办）
    role: isTodo.value && currentHxRole.value !== HX_ROLE_SUPER ? currentHxRole.value : ''
})
const { pager, getLists, resetParams } = usePaging({
    fetchFun: loanLists,
    params: formData
})

/** 状态栏：标签与数量键对应 loanStatusCounts 返回字段 */
const statusTabs = [
    { label: '全部', value: '', key: 'all' },
    { label: '审批中', value: 'pending', key: 'pending' },
    { label: '审批通过', value: 'approved', key: 'approved' },
    { label: '已驳回', value: 'rejected', key: 'rejected' }
]
/** 各审批状态业务数量（随筛选条件刷新，不受「审批状态」筛选本身影响） */
const counts = ref<Record<string, number>>({
    all: 0,
    pending: 0,
    approved: 0,
    rejected: 0
})

const loadCounts = async () => {
    try {
        counts.value = await loanStatusCounts({ ...formData })
    } catch (error) {
        // 统计失败不阻塞列表展示
    }
}

/** 列表 + 数量一并刷新 */
const refresh = () => {
    getLists()
    loadCounts()
}

/** 点击状态栏：切换审批状态筛选并回到第一页 */
const switchStatus = (value: string) => {
    if (formData.status === value) return
    formData.status = value
    pager.page = 1
    refresh()
}

/** 查询：回到第一页并刷新列表与数量 */
const handleQuery = () => {
    pager.page = 1
    refresh()
}

/** 重置：恢复初始筛选条件并刷新数量 */
const handleReset = () => {
    resetParams()
    loadCounts()
}

const { optionsData } = useDictOptions<{ bank: any[] }>({
    bank: { api: bankAll }
})

/** 导出列：与列表展示一致；金额列导出为数值，便于 Excel 内二次统计 */
const exportColumns: HxExportColumn[] = [
    { label: '业务编号', value: 'sn', width: 18 },
    { label: '客户姓名', value: 'customer_name', width: 12 },
    { label: '放款金额(元)', value: (row) => Number(row.amount || 0), width: 16 },
    {
        label: '银行 / 支行',
        value: (row) => `${row.bank_name || '—'} / ${row.branch_name || '—'}`,
        width: 30
    },
    { label: '签约完成时间', value: 'sign_time', width: 20 },
    {
        label: '审批流程',
        value: (row) => (row.nodes || []).map((node: any) => node.role).join(' → '),
        width: 34
    },
    {
        label: '当前审批节点',
        value: (row) =>
            row.status === 'pending'
                ? `${row.current_node}（${row.current_index + 1}/${row.node_total}）`
                : '—',
        width: 20
    },
    { label: '审批状态', value: 'status_text', width: 12 }
]

/** 正在导出：避免重复点击触发多次下载 */
const exporting = ref(false)

/** 导出 Excel：按当前筛选条件取全量数据落表（导出全部，不是仅当前页） */
const handleExport = async () => {
    if (exporting.value) return
    exporting.value = true
    feedback.loading('正在导出中...')
    try {
        const rows = await fetchHxAllPages(loanLists, { ...formData })
        exportHxExcel('放款审批', exportColumns, rows)
        feedback.closeLoading()
        feedback.msgSuccess(`已导出 ${rows.length} 条放款审批数据`)
    } catch (error) {
        feedback.closeLoading()
        feedback.msgError('导出失败，请稍后重试')
    } finally {
        exporting.value = false
    }
}

const canApprove = (row: any) => isSuper.value || row.current_node === currentRole.value

const nodeClass = (node: any) => {
    if (node.status == 1) return 'bg-[rgba(103,194,58,0.12)] text-[#67c23a]'
    if (node.status == 2) return 'bg-[rgba(245,108,108,0.12)] text-[#f56c6c]'
    if (node.status == 0) return 'bg-[rgba(230,162,60,0.14)] text-[#e6a23c]'
    return 'bg-[rgba(144,147,153,0.12)] text-[#909399]'
}

const handleDetail = async (row: any) => {
    showDetail.value = true
    await nextTick()
    detailRef.value?.open(row, isTodo.value && row.status == 'pending' && canApprove(row))
}

const handleApprove = async (row: any) => {
    showDetail.value = true
    await nextTick()
    detailRef.value?.open(row, true)
}

// 角色切换后刷新待办（菜单可见性同步由侧边栏响应）
watch(currentHxRole, (role) => {
    if (!isTodo.value) return
    formData.role = role === HX_ROLE_SUPER ? '' : role
    formData.status = 'pending'
    pager.page = 1
    refresh()
})

onMounted(() => {
    refresh()
})
</script>

<style lang="scss" scoped>
/* 表格上方状态栏：各审批状态标签 + 数量，点击切换筛选 */
.hx-status-bar {
    display: flex;
    align-items: center;
    gap: 28px;
    margin-bottom: 16px;
    border-bottom: 1px solid var(--el-border-color-lighter);

    .hx-status-tab {
        position: relative;
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding-bottom: 12px;
        font-size: 14px;
        color: var(--el-text-color-regular);
        cursor: pointer;
        user-select: none;
        transition:
            color 0.2s,
            font-weight 0.2s;

        &:hover {
            color: var(--el-color-primary);
        }

        &.is-active {
            color: var(--el-color-primary);
            font-weight: 600;

            &::after {
                content: '';
                position: absolute;
                right: 0;
                bottom: -1px;
                left: 0;
                height: 2px;
                background: var(--el-color-primary);
                border-radius: 2px;
            }

            .hx-status-tab__count {
                color: #fff;
                background: var(--el-color-primary);
            }
        }

        &__count {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            min-width: 18px;
            height: 18px;
            padding: 0 6px;
            font-size: 12px;
            font-weight: 500;
            line-height: 1;
            color: var(--el-text-color-secondary);
            background: var(--el-fill-color);
            border-radius: 9px;
            transition:
                color 0.2s,
                background 0.2s;
        }
    }
}
</style>
