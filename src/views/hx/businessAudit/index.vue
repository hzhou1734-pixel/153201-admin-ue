<template>
    <div class="hx-business-audit">
        <el-card class="!border-none" shadow="never">
            <el-form class="mb-[-16px]" :model="formData" inline>
                <el-form-item class="w-[220px]" label="业务编号">
                    <el-input
                        v-model="formData.sn"
                        placeholder="请输入业务编号"
                        clearable
                        @keyup.enter="resetPage"
                    />
                </el-form-item>
                <el-form-item class="w-[200px]" label="客户姓名">
                    <el-input
                        v-model="formData.customer_name"
                        placeholder="请输入客户姓名"
                        clearable
                        @keyup.enter="resetPage"
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
                    <el-select v-model="formData.status" clearable placeholder="全部">
                        <el-option label="全部" value="" />
                        <el-option label="审核中" value="auditing" />
                        <el-option label="放款中" value="loaning" />
                        <el-option label="已拒绝" value="rejected" />
                        <el-option label="已完成" value="finished" />
                    </el-select>
                </el-form-item>
                <el-form-item>
                    <el-button type="primary" @click="resetPage">查询</el-button>
                    <el-button @click="resetParams">重置</el-button>
                </el-form-item>
            </el-form>
        </el-card>

        <el-card v-loading="pager.loading" class="mt-4 !border-none" shadow="never">
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
                                          : row.status == 'finished'
                                            ? 'success'
                                            : 'primary'
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
        <reject-popup
            v-if="showReject"
            ref="rejectRef"
            title="驳回业务申请"
            tips="驳回后客户端业务显示「已拒绝」，驳回理由必填并同步给客户与业务经办人。"
            :quick-list="quickReasons"
            @close="showReject = false"
        />
    </div>
</template>

<script lang="ts" setup name="hxBusinessAudit">
import { businessLists, businessPass, businessReject } from '@/api/hx/audit'
import { bankAll } from '@/api/hx/bank'
import RejectPopup from '@/views/hx/components/reject-popup.vue'
import { useDictOptions } from '@/hooks/useDictOptions'
import { usePaging } from '@/hooks/usePaging'
import feedback from '@/utils/feedback'
import { formatterAmount } from '@/utils/util'

import DetailPopup from './detail.vue'

/**
 * 审核中心 · 待审核业务（P-06 / P-07）：材料查看与下载 + 审批操作（通过推送签约短信 / 驳回必填理由）。
 * 原「审核记录（留痕）」节点已删除（与「审批留痕」功能重复）。
 */
const props = withDefaults(defineProps<{ mode?: 'pending' }>(), { mode: 'pending' })

const isPending = computed(() => props.mode === 'pending')

const detailRef = shallowRef<InstanceType<typeof DetailPopup>>()
const rejectRef = shallowRef<InstanceType<typeof RejectPopup>>()
const showDetail = ref(false)
const showReject = ref(false)
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
const { pager, getLists, resetParams, resetPage } = usePaging({
    fetchFun: businessLists,
    params: formData
})

const { optionsData } = useDictOptions<{ bank: any[] }>({
    bank: { api: bankAll }
})

const handleDetail = async (row: any) => {
    showDetail.value = true
    await nextTick()
    detailRef.value?.open(row)
}

const handlePass = async (row: any) => {
    await feedback.confirm(
        `确认审核通过？系统将向客户实名手机号 ${row.customer_mobile} 推送签约短信（e签宝签约链接），业务状态由「审核中」转为「放款中」。`
    )
    const res: any = await businessPass({ id: row.id })
    feedback.msgSuccess(`已通过，签约短信已推送至 ${res?.mobile || row.customer_mobile}`)
    getLists()
}

const handleReject = async (row: any) => {
    showReject.value = true
    await nextTick()
    rejectRef.value?.open(row, async (reason: string) => {
        await businessReject({ id: row.id, reason })
        feedback.msgSuccess('已驳回，客户端业务状态为「已拒绝」')
        getLists()
    })
}

onMounted(() => {
    getLists()
})
</script>
