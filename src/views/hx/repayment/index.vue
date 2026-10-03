<template>
    <div class="hx-repayment">
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
                <el-form-item v-if="!isPending" class="w-[200px]" label="确认状态">
                    <el-select v-model="formData.status" clearable placeholder="全部">
                        <el-option label="全部" value="" />
                        <el-option label="待确认" :value="0" />
                        <el-option label="已确认" :value="1" />
                        <el-option label="已驳回" :value="2" />
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
                    <el-table-column label="回款期数" prop="period" min-width="100" />
                    <el-table-column label="回款金额" min-width="130">
                        <template #default="{ row }">
                            ¥{{ formatterAmount(row.amount) }}
                        </template>
                    </el-table-column>
                    <el-table-column label="凭证" min-width="100">
                        <template #default="{ row }">{{ row.voucher_count }} 份</template>
                    </el-table-column>
                    <el-table-column label="上传人（业务经办人）" prop="uploader" min-width="150" />
                    <el-table-column label="上传时间" prop="upload_time" min-width="180" />
                    <el-table-column label="确认状态" min-width="110">
                        <template #default="{ row }">
                            <el-tag
                                :type="row.status == 1 ? 'success' : row.status == 2 ? 'danger' : 'warning'"
                                size="small"
                            >
                                {{ row.status_text }}
                            </el-tag>
                        </template>
                    </el-table-column>
                    <el-table-column label="确认人 / 时间" min-width="200">
                        <template #default="{ row }">
                            <span v-if="row.confirm_user">
                                {{ row.confirm_user }}<br />
                                <span class="text-tx-secondary">{{ row.confirm_time }}</span>
                            </span>
                            <span v-else>—</span>
                        </template>
                    </el-table-column>
                    <el-table-column label="操作" :width="isPending ? 230 : 110" fixed="right">
                        <template #default="{ row }">
                            <el-button type="primary" link @click="handleDetail(row)">详情</el-button>
                            <template v-if="isPending && row.status != 1">
                                <el-button type="success" link @click="handleConfirm(row)">
                                    确认审核
                                </el-button>
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
            @confirm="handleConfirm"
            @reject="handleReject"
            @close="showDetail = false"
        />
        <reject-popup
            v-if="showReject"
            ref="rejectRef"
            title="驳回回款凭证"
            tips="驳回后业务经办人可重新上传凭证；此环节不影响放款。"
            :quick-list="quickReasons"
            @close="showReject = false"
        />
    </div>
</template>

<script lang="ts" setup name="hxRepayment">
import { repaymentConfirm, repaymentLists, repaymentReject } from '@/api/hx/repayment'
import RejectPopup from '@/views/hx/components/reject-popup.vue'
import { usePaging } from '@/hooks/usePaging'
import feedback from '@/utils/feedback'
import { formatterAmount } from '@/utils/util'

import DetailPopup from './detail.vue'

/**
 * 回款管理 · 按确认流程拆为两个路由（P-10）：
 * - mode = pending ：待确认凭证 —— 财务核对后确认审核或驳回（驳回后经办人可重传）
 * - mode = records ：回款记录 —— 已确认凭证归档查询（只读）
 */
const props = withDefaults(defineProps<{ mode?: 'pending' | 'records' }>(), { mode: 'pending' })

const isPending = computed(() => props.mode === 'pending')

const detailRef = shallowRef<InstanceType<typeof DetailPopup>>()
const rejectRef = shallowRef<InstanceType<typeof RejectPopup>>()
const showDetail = ref(false)
const showReject = ref(false)
const quickReasons = [
    '凭证金额与应还金额不一致',
    '凭证信息模糊，无法识别',
    '凭证与客户信息不匹配'
]
const formData = reactive({
    sn: '',
    customer_name: '',
    // 待确认节点默认只看待确认凭证
    status: isPending.value ? 0 : ('' as any)
})
const { pager, getLists, resetParams, resetPage } = usePaging({
    fetchFun: repaymentLists,
    params: formData
})

const handleDetail = async (row: any) => {
    showDetail.value = true
    await nextTick()
    detailRef.value?.open(row)
}

const handleConfirm = async (row: any) => {
    await feedback.confirm('确认凭证无误？仅财务可确认，确认后该笔回款凭证归档。')
    await repaymentConfirm({ id: row.id, confirm_user: '财务负责人' })
    feedback.msgSuccess('回款凭证已确认')
    getLists()
}

const handleReject = async (row: any) => {
    showReject.value = true
    await nextTick()
    rejectRef.value?.open(row, async (reason: string) => {
        await repaymentReject({ id: row.id, reason, confirm_user: '财务负责人' })
        feedback.msgSuccess('已驳回，业务经办人可重新上传凭证')
        getLists()
    })
}

onMounted(() => {
    getLists()
})
</script>
