<template>
    <div class="hx-bank-agent-auth">
        <el-card class="!border-none" shadow="never">
            <el-form class="mb-[-16px]" :model="formData" inline>
                <el-form-item class="w-[200px]" label="申请人">
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
                <el-form-item class="w-[240px]" label="申请银行">
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
                <el-form-item class="w-[200px]" label="认证状态">
                    <el-select v-model="formData.status" clearable placeholder="全部">
                        <el-option label="全部" value="" />
                        <el-option label="待审核" value="pending" />
                        <el-option label="已通过" value="approved" />
                        <el-option label="已驳回" value="rejected" />
                    </el-select>
                </el-form-item>
                <el-form-item>
                    <el-button type="primary" @click="resetPage">查询</el-button>
                    <el-button @click="resetParams">重置</el-button>
                </el-form-item>
            </el-form>
        </el-card>

        <el-card v-loading="pager.loading" class="mt-4 !border-none" shadow="never">
            <el-alert
                class="mb-4"
                type="info"
                :closable="false"
                show-icon
                title="经办人认证审核"
                description="银行经办人账号由用户在客户端 / 小程序提交「账号认证申请」产生。审核通过后，该用户即成为对应银行的银行经办人（自动进入「用户管理 · 银行经办人」列表）；驳回须填写理由并同步给申请人。后台不直接添加银行经办人。"
            />
            <el-table :data="pager.lists" size="large">
                <el-table-column label="申请编号" prop="sn" min-width="160" />
                <el-table-column label="申请人" prop="name" min-width="110" />
                <el-table-column label="手机号" prop="mobile" min-width="140" />
                <el-table-column label="申请银行" prop="bank_name" min-width="150" />
                <el-table-column
                    label="申请支行"
                    prop="branch_name"
                    min-width="160"
                    show-tooltip-when-overflow
                />
                <el-table-column label="申请岗位" min-width="120">
                    <template #default="{ row }">{{ row.position || '—' }}</template>
                </el-table-column>
                <el-table-column label="材料数" min-width="90">
                    <template #default="{ row }">{{ row.material_count }} 份</template>
                </el-table-column>
                <el-table-column label="提交时间" prop="apply_time" min-width="180" />
                <el-table-column label="认证状态" min-width="110">
                    <template #default="{ row }">
                        <el-tag :type="statusTag(row.status)" size="small">
                            {{ row.status_text }}
                        </el-tag>
                    </template>
                </el-table-column>
                <el-table-column label="审核人 / 时间" min-width="220">
                    <template #default="{ row }">
                        <template v-if="row.audit_time">
                            <div>{{ row.audit_user }}</div>
                            <div class="text-tx-secondary text-xs">{{ row.audit_time }}</div>
                        </template>
                        <span v-else>—</span>
                    </template>
                </el-table-column>
                <el-table-column label="操作" width="200" fixed="right">
                    <template #default="{ row }">
                        <el-button type="primary" link @click="handleDetail(row)">
                            {{ row.status == 'pending' ? '审核' : '详情' }}
                        </el-button>
                        <template v-if="row.status == 'pending'">
                            <el-button type="success" link @click="handlePass(row)">通过</el-button>
                            <el-button type="danger" link @click="handleReject(row)">驳回</el-button>
                        </template>
                    </template>
                </el-table-column>
                <template #empty>
                    <el-empty description="暂无银行经办人认证申请" />
                </template>
            </el-table>
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
            title="驳回经办人认证申请"
            tips="驳回后申请人可在客户端修改资料后重新提交；驳回理由必填并同步给申请人。"
            :quick-list="quickReasons"
            @close="showReject = false"
        />
    </div>
</template>

<script lang="ts" setup name="hxBankAgentAuth">
import { bankAgentApplyAudit, bankAgentApplyLists } from '@/api/hx/bankAgent'
import { bankAll } from '@/api/hx/bank'
import RejectPopup from '@/views/hx/components/reject-popup.vue'
import { useDictOptions } from '@/hooks/useDictOptions'
import { usePaging } from '@/hooks/usePaging'
import feedback from '@/utils/feedback'

import DetailPopup from './detail.vue'

/**
 * 审核中心 · 经办人认证审核（P-05 调整）
 * 银行经办人账号不是后台添加的，而是用户在客户端 / 小程序提交认证申请后，
 * 由管理后台在此审核：通过 → 生成银行经办人账号；驳回 → 记录理由反馈申请人。
 */
const detailRef = shallowRef<InstanceType<typeof DetailPopup>>()
const rejectRef = shallowRef<InstanceType<typeof RejectPopup>>()
const showDetail = ref(false)
const showReject = ref(false)
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
const { pager, getLists, resetParams, resetPage } = usePaging({
    fetchFun: bankAgentApplyLists,
    params: formData
})

const { optionsData } = useDictOptions<{ bank: any[] }>({
    bank: { api: bankAll }
})

const statusTag = (s: string): 'warning' | 'success' | 'danger' =>
    s == 'pending' ? 'warning' : s == 'approved' ? 'success' : 'danger'

const handleDetail = async (row: any) => {
    showDetail.value = true
    await nextTick()
    detailRef.value?.open(row)
}

const handlePass = async (row: any) => {
    await feedback.confirm(
        `确认通过「${row.name}」的银行经办人认证申请？通过后该用户将成为「${row.bank_name}」的银行经办人。`
    )
    await bankAgentApplyAudit({ id: row.id, result: 'pass' })
    feedback.msgSuccess(`已通过，「${row.name}」已成为${row.bank_name}经办人`)
    showDetail.value = false
    getLists()
}

const handleReject = async (row: any) => {
    showReject.value = true
    await nextTick()
    rejectRef.value?.open(row, async (reason: string) => {
        await bankAgentApplyAudit({ id: row.id, result: 'reject', reason })
        feedback.msgSuccess('已驳回，驳回理由已同步给申请人')
        showDetail.value = false
        getLists()
    })
}

onMounted(() => {
    getLists()
})
</script>
