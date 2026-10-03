<template>
    <div class="hx-customer-detail">
        <el-drawer
            v-model="visible"
            title="客户详情"
            size="1060px"
            :destroy-on-close="true"
            @close="emit('close')"
        >
            <div v-loading="loading">
                <!-- 客户概要 -->
                <div class="hx-ct-profile">
                    <el-avatar
                        :size="52"
                        class="hx-ct-avatar"
                        :style="{
                            background:
                                detail.customer_type === 'company'
                                    ? 'var(--el-color-primary)'
                                    : 'var(--el-color-success)'
                        }"
                    >
                        {{ (detail.name || '客').slice(0, 1) }}
                    </el-avatar>
                    <div class="flex-1 min-w-0">
                        <div class="flex items-center gap-2">
                            <span class="text-xl font-medium">{{ detail.name || '—' }}</span>
                            <el-tag
                                :type="detail.bind_status == 1 ? 'success' : 'info'"
                                size="small"
                                effect="light"
                            >
                                {{ detail.bind_status_text }}
                            </el-tag>
                            <el-tag
                                :type="detail.customer_type === 'company' ? 'primary' : 'info'"
                                size="small"
                                effect="light"
                            >
                                {{ detail.customer_type_text }}
                            </el-tag>
                            <el-tag v-if="stats.ongoing_count" type="warning" size="small" effect="light">
                                在贷 {{ stats.ongoing_count }} 笔
                            </el-tag>
                        </div>
                        <div class="mt-1 text-tx-secondary">
                            {{ detail.mobile }} · {{ detail.company || '暂无企业信息' }}
                        </div>
                    </div>
                    <div class="hx-ct-agent">
                        <div class="text-tx-secondary text-xs mb-1">归属业务经办人</div>
                        <template v-if="detail.agent_name">
                            <div class="font-medium">{{ detail.agent_name }}（{{ detail.agent_mobile }}）</div>
                        </template>
                        <el-tag v-else type="warning" size="small">未分配</el-tag>
                    </div>
                </div>

                <!-- 业务数据概览 -->
                <el-row :gutter="12" class="mt-4">
                    <el-col v-for="card in statCards" :key="card.label" :span="6">
                        <div class="hx-ct-stat">
                            <div class="text-tx-secondary text-xs">{{ card.label }}</div>
                            <div class="hx-ct-stat-value">{{ card.value }}</div>
                            <div class="text-tx-secondary text-xs mt-1">{{ card.tip }}</div>
                        </div>
                    </el-col>
                </el-row>

                <el-tabs v-model="activeTab" class="mt-4">
                    <el-tab-pane label="客户基础数据" name="base">
                        <el-descriptions :column="2" border size="small">
                            <el-descriptions-item label="客户姓名">{{ detail.name }}</el-descriptions-item>
                            <el-descriptions-item label="客户类型">
                                <el-tag
                                    :type="detail.customer_type === 'company' ? 'primary' : 'info'"
                                    size="small"
                                    effect="light"
                                >
                                    {{ detail.customer_type_text }}
                                </el-tag>
                            </el-descriptions-item>
                            <el-descriptions-item label="实名手机号">{{ detail.mobile }}</el-descriptions-item>
                            <el-descriptions-item label="证件号码">
                                {{ detail.id_card || '—' }}
                            </el-descriptions-item>
                            <el-descriptions-item label="归属业务经办人">
                                {{ detail.agent_name || '未分配' }}
                            </el-descriptions-item>
                            <el-descriptions-item label="经办人手机号">
                                {{ detail.agent_mobile || '—' }}
                            </el-descriptions-item>
                            <el-descriptions-item label="绑定状态">
                                <el-tag
                                    :type="detail.bind_status == 1 ? 'success' : 'info'"
                                    size="small"
                                >
                                    {{ detail.bind_status_text }}
                                </el-tag>
                            </el-descriptions-item>
                            <el-descriptions-item label="绑定时间">
                                {{ detail.bind_time || '—' }}
                            </el-descriptions-item>
                            <el-descriptions-item label="注册时间">
                                {{ detail.register_time || '—' }}
                            </el-descriptions-item>
                            <el-descriptions-item label="累计申请金额">
                                ¥{{ formatterAmount(stats.apply_amount) }}
                            </el-descriptions-item>
                        </el-descriptions>
                    </el-tab-pane>

                    <el-tab-pane :label="`历史贷款申请（${applications.length}）`" name="loan">
                        <el-table :data="applications" size="small" border max-height="380">
                            <el-table-column label="业务编号" prop="sn" min-width="140" />
                            <el-table-column label="申请金额（元）" min-width="130">
                                <template #default="{ row }">
                                    ¥{{ formatterAmount(row.amount) }}
                                </template>
                            </el-table-column>
                            <el-table-column label="所属机构" min-width="160">
                                <template #default="{ row }">
                                    <div>{{ row.bank_name }}</div>
                                    <div class="text-tx-secondary text-xs">{{ row.branch_name }}</div>
                                </template>
                            </el-table-column>
                            <el-table-column label="业务经办人" prop="agent_name" min-width="100" />
                            <el-table-column label="业务状态" min-width="100">
                                <template #default="{ row }">
                                    <el-tag
                                        :type="
                                            row.status == 'rejected'
                                                ? 'danger'
                                                : row.status == 'finished'
                                                  ? 'success'
                                                  : 'warning'
                                        "
                                        size="small"
                                        effect="light"
                                    >
                                        {{ row.status_text }}
                                    </el-tag>
                                </template>
                            </el-table-column>
                            <el-table-column label="放款进度" min-width="120">
                                <template #default="{ row }">
                                    <div class="text-xs text-tx-secondary mb-1">
                                        {{ row.approval_status_text }}
                                    </div>
                                    <el-tag
                                        :type="row.paid_status == 1 ? 'success' : 'info'"
                                        size="small"
                                        effect="plain"
                                    >
                                        {{ row.paid_status_text }}
                                    </el-tag>
                                </template>
                            </el-table-column>
                            <el-table-column label="提交时间" prop="submit_time" min-width="150" />
                            <el-table-column label="操作" width="100" fixed="right">
                                <template #default="{ row }">
                                    <el-button type="primary" link @click="handleBusiness(row)">
                                        业务详情
                                    </el-button>
                                </template>
                            </el-table-column>
                            <template #empty>
                                <el-empty description="该客户暂无历史贷款申请数据" :image-size="80" />
                            </template>
                        </el-table>
                    </el-tab-pane>

                    <el-tab-pane :label="`回款记录（${records.length}）`" name="repay">
                        <el-table :data="records" size="small" border max-height="380">
                            <el-table-column label="业务编号" prop="sn" min-width="140" />
                            <el-table-column label="期数" prop="period" min-width="90" />
                            <el-table-column label="回款金额（元）" min-width="130">
                                <template #default="{ row }">
                                    ¥{{ formatterAmount(row.amount) }}
                                </template>
                            </el-table-column>
                            <el-table-column label="凭证" min-width="90">
                                <template #default="{ row }">{{ row.voucher_count }} 份</template>
                            </el-table-column>
                            <el-table-column label="凭证状态" min-width="100">
                                <template #default="{ row }">
                                    <el-tag
                                        :type="
                                            row.status == 1
                                                ? 'success'
                                                : row.status == 2
                                                  ? 'danger'
                                                  : 'warning'
                                        "
                                        size="small"
                                        effect="light"
                                    >
                                        {{ row.status_text }}
                                    </el-tag>
                                </template>
                            </el-table-column>
                            <el-table-column label="上传信息" min-width="160">
                                <template #default="{ row }">
                                    <div>{{ row.uploader }}</div>
                                    <div class="text-tx-secondary text-xs">{{ row.upload_time }}</div>
                                </template>
                            </el-table-column>
                            <el-table-column label="财务确认" min-width="120">
                                <template #default="{ row }">
                                    <div>{{ row.confirm_user || '—' }}</div>
                                    <div class="text-tx-secondary text-xs">
                                        {{ row.confirm_time || '—' }}
                                    </div>
                                </template>
                            </el-table-column>
                            <template #empty>
                                <el-empty description="该客户暂无回款记录" :image-size="80" />
                            </template>
                        </el-table>
                    </el-tab-pane>
                </el-tabs>
            </div>

            <template #footer>
                <div class="flex justify-end">
                    <el-button @click="visible = false">关闭</el-button>
                    <!--
                        禁用按钮自身不派发鼠标事件，故点击处理放在 tooltip 的外层包裹节点上，
                        保证任何禁用原因下都能稳定响应点击并给出提示。
                    -->
                    <el-tooltip :disabled="canAssign" :content="assignTip" placement="top">
                        <span class="hx-op-cell inline-flex" @click="handleAssign">
                            <el-button type="primary" :disabled="!canAssign">
                                修改归属经办人
                            </el-button>
                        </span>
                    </el-tooltip>
                </div>
            </template>
        </el-drawer>

        <business-detail-popup
            v-if="showBusiness"
            ref="businessRef"
            mode="view"
            @close="showBusiness = false"
        />
    </div>
</template>

<script lang="ts" setup>
import { computed, ref, shallowRef } from 'vue'

import { customerDetail } from '@/api/hx/customer'
import { HX_ROLE_GM as GM, HX_ROLE_SUPER as SUPER, currentHxRole } from '@/config/hxRoles'
import BusinessDetailPopup from '@/views/hx/businessAudit/detail.vue'
import feedback from '@/utils/feedback'
import { formatterAmount } from '@/utils/util'

const emit = defineEmits(['close', 'assign'])

const visible = ref(false)
const loading = ref(false)
const activeTab = ref('base')
const detail = ref<any>({})
const showBusiness = ref(false)
const businessRef = shallowRef<InstanceType<typeof BusinessDetailPopup>>()

const applications = computed<any[]>(() => detail.value.applications || [])
const records = computed<any[]>(() => detail.value.repayment_records || [])
const stats = computed<any>(
    () =>
        detail.value.statistic || {
            apply_count: 0,
            apply_amount: 0,
            ongoing_count: 0,
            loan_count: 0,
            loan_amount: 0,
            repay_amount: 0
        }
)

const statCards = computed(() => [
    {
        label: '累计申请笔数',
        value: `${stats.value.apply_count} 笔`,
        tip: `累计金额 ¥${formatterAmount(stats.value.apply_amount)}`
    },
    {
        label: '在贷业务',
        value: `${stats.value.ongoing_count} 笔`,
        tip: '审核中 / 放款中'
    },
    {
        label: '已放款',
        value: `${stats.value.loan_count} 笔`,
        tip: `放款金额 ¥${formatterAmount(stats.value.loan_amount)}`
    },
    {
        label: '已回款金额',
        value: `¥${formatterAmount(stats.value.repay_amount)}`,
        tip: '仅统计财务已确认凭证'
    }
])

/** 归属变更权限：仅总经理（超级管理员同权），且客户未扫码绑定（P-04） */
const canAssign = computed(
    () => [GM, SUPER].includes(currentHxRole.value) && detail.value.bind_status != 1
)

/** 禁用原因提示：绑定状态优先于角色权限提示 */
const assignTip = computed(() =>
    detail.value.bind_status == 1 ? '已扫码绑定的客户归属不可变更' : '客户归属变更权限归总经理'
)

const load = async () => {
    loading.value = true
    try {
        detail.value = await customerDetail({ id: detail.value.id })
    } finally {
        loading.value = false
    }
}

const open = async (row: any) => {
    detail.value = { id: row.id }
    activeTab.value = 'base'
    visible.value = true
    await load()
}

/** 归属变更后刷新详情 */
const reload = async () => {
    if (visible.value) await load()
}

const handleBusiness = async (row: any) => {
    showBusiness.value = true
    await nextTick()
    businessRef.value?.open(row)
}

const handleAssign = () => {
    if (detail.value.bind_status == 1) {
        return feedback.msgWarning('已扫码绑定的客户归属不可变更')
    }
    if (![GM, SUPER].includes(currentHxRole.value)) {
        return feedback.msgWarning('客户归属变更权限归总经理')
    }
    emit('assign', detail.value)
}

defineExpose({ open, reload })
</script>

<style lang="scss">
/**
 * 抽屉内容会被 teleport 到 body，scoped 样式无法稳定命中内部节点，故统一使用唯一类名做全局声明。
 */
.hx-customer-detail {
    .hx-ct-profile {
        display: flex;
        align-items: center;
        gap: 16px;
        padding: 16px;
        border: 1px solid var(--el-border-color-lighter);
        border-radius: 8px;
        background: var(--el-fill-color-lighter);
    }

    .hx-ct-avatar {
        flex: none;
        font-size: 22px;
        color: #fff;
    }

    .hx-ct-agent {
        flex: none;
        min-width: 220px;
        padding-left: 16px;
        border-left: 1px dashed var(--el-border-color);
        text-align: left;
    }

    .hx-ct-stat {
        padding: 12px 14px;
        border: 1px solid var(--el-border-color-lighter);
        border-radius: 8px;
    }

    /**
     * 禁用按钮在 Chrome 下不派发（也不冒泡）鼠标事件，pointer-events: none 后
     * 事件由外层 .hx-op-cell 承接，点击提示与 hover 提示均可生效。
     */
    .hx-op-cell {
        cursor: pointer;

        .el-button.is-disabled {
            pointer-events: none;
        }
    }

    .hx-ct-stat-value {
        margin-top: 4px;
        font-size: 20px;
        font-weight: 600;
    }
}
</style>
