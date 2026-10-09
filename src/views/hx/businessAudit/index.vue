<template>
    <div class="hx-business-audit">
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
                <el-form-item class="w-[200px]" label="业务状态">
                    <el-select
                        v-model="formData.status"
                        clearable
                        placeholder="全部"
                        @change="handleQuery"
                    >
                        <el-option label="全部" value="" />
                        <el-option label="审核中" value="auditing" />
                        <el-option label="已通过" value="passed" />
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
            <div>
                <el-table :data="pager.lists" size="large">
                    <el-table-column label="业务编号" prop="sn" min-width="160" />
                    <el-table-column label="客户姓名" prop="customer_name" min-width="110" />
                    <el-table-column
                        label="企业名称"
                        prop="company"
                        min-width="220"
                        show-tooltip-when-overflow
                    />
                    <el-table-column label="业务金额" min-width="130">
                        <template #default="{ row }">
                            ¥{{ formatterAmount(row.amount) }}
                        </template>
                    </el-table-column>
                    <el-table-column label="银行 / 支行" min-width="220" show-tooltip-when-overflow>
                        <template #default="{ row }">
                            {{ row.bank_name }} / {{ row.branch_name }}
                        </template>
                    </el-table-column>
                    <el-table-column label="业务经办人" prop="agent_name" min-width="110" />
                    <el-table-column label="材料数" min-width="90">
                        <template #default="{ row }">{{ row.material_count }} 份</template>
                    </el-table-column>
                    <el-table-column label="提交时间" prop="submit_time" min-width="180" />
                    <el-table-column label="业务状态" min-width="110">
                        <template #default="{ row }">
                            <el-tag
                                :type="
                                    row.status == 'auditing'
                                        ? 'warning'
                                        : row.status == 'rejected'
                                          ? 'danger'
                                          : 'success'
                                "
                                size="small"
                            >
                                {{ row.status_text }}
                            </el-tag>
                        </template>
                    </el-table-column>
                    <el-table-column label="操作" width="240" fixed="right">
                        <template #default="{ row }">
                            <el-button type="primary" link @click="handleDetail(row)">
                                {{ isPending ? '材料与详情' : '详情' }}
                            </el-button>
                            <template v-if="isPending && row.status == 'auditing'">
                                <el-button type="success" link @click="handlePass(row)">通过</el-button>
                                <el-button type="danger" link @click="handleReject(row)">驳回</el-button>
                            </template>
                        </template>
                    </el-table-column>
                </el-table>
            </div>
            <div class="flex mt-4 justify-end">
                <pagination v-model="pager" @change="getLists" />
            </div>
        </el-card>

        <detail-popup
            v-if="showDetail"
            ref="detailRef"
            @pass="handlePass"
            @reject="handleReject"
            @close="showDetail = false"
        />
        <audit-popup
            v-if="showAudit"
            ref="auditRef"
            :title="auditTitle"
            :confirm-text="auditConfirmText"
            :require-reason="auditMode === 'reject'"
            :quick-list="auditMode === 'reject' ? quickReasons : []"
            @close="showAudit = false"
        />
    </div>
</template>

<script lang="ts" setup name="hxBusinessAudit">
import { businessLists, businessPass, businessReject, businessStatusCounts } from '@/api/hx/audit'
import { bankAll } from '@/api/hx/bank'
import AuditPopup from '@/views/hx/components/audit-popup.vue'
import { useDictOptions } from '@/hooks/useDictOptions'
import { usePaging } from '@/hooks/usePaging'
import feedback from '@/utils/feedback'
import { exportHxExcel, fetchHxAllPages, type HxExportColumn } from '@/utils/hxExport'
import { formatterAmount } from '@/utils/util'

import DetailPopup from './detail.vue'

/**
 * 审核中心 · 风控初审（原「待审核业务」，P-06 / P-07）：材料查看与下载 + 审批操作
 * （通过推送签约短信 / 驳回必填理由）；通过、驳回均支持填写文字备注与上传补充图片（均为选填）。
 * 原「审核记录（留痕）」节点已删除（与「审批留痕」功能重复）。
 */
const props = withDefaults(defineProps<{ mode?: 'pending' }>(), { mode: 'pending' })

const isPending = computed(() => props.mode === 'pending')

const detailRef = shallowRef<InstanceType<typeof DetailPopup>>()
const auditRef = shallowRef<InstanceType<typeof AuditPopup>>()
const showDetail = ref(false)
const showAudit = ref(false)
/** 审核弹窗模式：pass=通过 / reject=驳回 */
const auditMode = ref<'pass' | 'reject'>('pass')
/** 当前正在审核的行 */
const currentRow = ref<any>({})
const quickReasons = [
    '材料不完整，请补充后重新提交',
    '银行流水与经营规模不匹配',
    '客户征信存在逾期记录',
    '抵押物价值不足，需重新评估'
]
const formData = reactive({
    sn: '',
    customer_name: '',
    bank_id: '',
    // 待审核节点默认只看审核中的业务
    status: isPending.value ? 'auditing' : ''
})
const { pager, getLists, resetParams } = usePaging({
    fetchFun: businessLists,
    params: formData
})

/**
 * 状态栏：全部 / 审核中 / 已通过 / 已驳回（键名对应 businessStatusCounts 返回字段）
 * —— 本页只体现风控初审自身结果：已通过 = 初审通过（放款中 + 已完成）。
 */
const statusTabs = [
    { label: '全部', value: '', key: 'all' },
    { label: '审核中', value: 'auditing', key: 'auditing' },
    { label: '已通过', value: 'passed', key: 'passed' },
    { label: '已驳回', value: 'rejected', key: 'rejected' }
]
/** 各状态业务数量（随筛选条件刷新，不受「业务状态」筛选本身影响） */
const counts = ref<Record<string, number>>({
    all: 0,
    auditing: 0,
    passed: 0,
    rejected: 0
})

const loadCounts = async () => {
    try {
        counts.value = await businessStatusCounts({ ...formData })
    } catch (error) {
        // 统计失败不阻塞列表展示
    }
}

/** 列表 + 数量一并刷新 */
const refresh = () => {
    getLists()
    loadCounts()
}

/** 点击状态栏：切换业务状态筛选并回到第一页 */
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

/** 导出列：与列表展示一致；金额 / 数量列导出为数值，便于 Excel 内二次统计 */
const exportColumns: HxExportColumn[] = [
    { label: '业务编号', value: 'sn', width: 18 },
    { label: '客户姓名', value: 'customer_name', width: 12 },
    { label: '企业名称', value: (row) => row.company || '—', width: 30 },
    { label: '业务金额(元)', value: (row) => Number(row.amount || 0), width: 16 },
    {
        label: '银行 / 支行',
        value: (row) => `${row.bank_name || '—'} / ${row.branch_name || '—'}`,
        width: 30
    },
    { label: '业务经办人', value: 'agent_name', width: 12 },
    { label: '材料数(份)', value: (row) => Number(row.material_count || 0), width: 12 },
    { label: '提交时间', value: 'submit_time', width: 20 },
    { label: '业务状态', value: 'status_text', width: 12 }
]

/** 正在导出：避免重复点击触发多次下载 */
const exporting = ref(false)

/** 导出 Excel：按当前筛选条件取全量数据落表（导出全部，不是仅当前页） */
const handleExport = async () => {
    if (exporting.value) return
    exporting.value = true
    feedback.loading('正在导出中...')
    try {
        const rows = await fetchHxAllPages(businessLists, { ...formData })
        exportHxExcel('风控初审', exportColumns, rows)
        feedback.closeLoading()
        feedback.msgSuccess(`已导出 ${rows.length} 条业务数据`)
    } catch (error) {
        feedback.closeLoading()
        feedback.msgError('导出失败，请稍后重试')
    } finally {
        exporting.value = false
    }
}

const handleDetail = async (row: any) => {
    showDetail.value = true
    await nextTick()
    detailRef.value?.open(row)
}

/** 审核弹窗标题 / 确认按钮文案（通过、驳回两态联动） */
const auditTitle = computed(() => (auditMode.value === 'pass' ? '审核通过' : '驳回业务申请'))
const auditConfirmText = computed(() => (auditMode.value === 'pass' ? '确认通过' : '确认驳回'))

/** 打开审核弹窗：mode 决定通过 / 驳回文案与必填规则 */
const openAudit = async (
    mode: 'pass' | 'reject',
    row: any,
    submit: (payload: { reason: string; remark: string; images: string[] }) => void
) => {
    auditMode.value = mode
    currentRow.value = row
    showAudit.value = true
    await nextTick()
    auditRef.value?.open(submit)
}

const handlePass = async (row: any) => {
    openAudit('pass', row, async ({ remark, images }) => {
        const res: any = await businessPass({ id: row.id, remark, images })
        feedback.msgSuccess(`已通过，签约短信已推送至 ${res?.mobile || row.customer_mobile}`)
        refresh()
    })
}

const handleReject = async (row: any) => {
    openAudit('reject', row, async ({ reason, remark, images }) => {
        await businessReject({ id: row.id, reason, remark, images })
        feedback.msgSuccess('已驳回，客户端业务状态同步为「已驳回」')
        refresh()
    })
}

onMounted(() => {
    refresh()
})
</script>

<style lang="scss" scoped>
/* 表格上方状态栏：各业务状态标签 + 数量，点击切换筛选 */
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
