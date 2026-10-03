<template>
    <div class="bank-agent-edit">
        <popup
            ref="popupRef"
            title="编辑银行经办人"
            :async="true"
            width="680px"
            @confirm="handleSubmit"
            @close="handleClose"
        >
            <el-alert
                class="mb-4"
                type="info"
                :closable="false"
                show-icon
                title="账号来源"
                description="银行经办人由用户在客户端提交认证申请、经后台审核通过后生成，所属银行与经办人不可变更；此处仅可调整岗位、账号状态与备注。"
            />
            <el-descriptions :column="2" border size="small" class="mb-4">
                <el-descriptions-item label="经办人">{{ formData.name }}</el-descriptions-item>
                <el-descriptions-item label="手机号">{{ formData.mobile }}</el-descriptions-item>
                <el-descriptions-item label="所属银行">
                    {{ bankNameOf(formData.bank_id) }}
                </el-descriptions-item>
                <el-descriptions-item label="所属支行">
                    {{ source.branch_name || '全行' }}
                </el-descriptions-item>
                <el-descriptions-item label="来源申请编号" :span="2">
                    {{ source.apply_sn || '—' }}
                </el-descriptions-item>
                <el-descriptions-item label="认证通过时间" :span="2">
                    {{ source.audit_time || '—' }}
                </el-descriptions-item>
            </el-descriptions>

            <el-form ref="formRef" :model="formData" label-width="90px">
                <el-form-item label="岗位">
                    <el-input
                        v-model="formData.position"
                        class="flex-1"
                        placeholder="如：客户经理 / 副行长"
                        clearable
                    />
                </el-form-item>
                <el-form-item label="账号状态">
                    <el-switch v-model="formData.status" :active-value="1" :inactive-value="0" />
                </el-form-item>
                <el-form-item label="备注">
                    <el-input
                        v-model="formData.remark"
                        type="textarea"
                        :rows="3"
                        placeholder="请输入备注"
                    />
                </el-form-item>
            </el-form>
        </popup>
    </div>
</template>

<script lang="ts" setup>
import type { FormInstance } from 'element-plus'

import { bankAgentEdit } from '@/api/hx/bankAgent'
import { bankAll } from '@/api/hx/bank'
import Popup from '@/components/popup/index.vue'
import { useDictOptions } from '@/hooks/useDictOptions'
import feedback from '@/utils/feedback'

/**
 * 编辑银行经办人
 * 账号由认证申请审核通过后生成，因此弹窗不再提供「添加」模式：
 * 银行与经办人不可变更，仅可调整岗位 / 账号状态 / 备注。
 */
const emit = defineEmits(['success', 'close'])
const formRef = shallowRef<FormInstance>()
const popupRef = shallowRef<InstanceType<typeof Popup>>()
/** 当前行原始数据（仅用于展示不可编辑的只读信息） */
const source = ref<any>({})

const formData = reactive({
    id: '',
    user_id: '',
    name: '',
    mobile: '',
    bank_id: '' as any,
    branch_id: '' as any,
    position: '',
    status: 1,
    remark: ''
})

const { optionsData } = useDictOptions<{ bank: any[] }>({
    bank: { api: bankAll }
})

const bankNameOf = (id: any) =>
    (optionsData.bank || []).find((item: any) => item.id == id)?.name || '—'

const handleSubmit = async () => {
    await bankAgentEdit(formData)
    feedback.msgSuccess('银行经办人资料已更新')
    popupRef.value?.close()
    emit('success')
}

const open = () => {
    popupRef.value?.open()
}

const setFormData = async (row: any) => {
    source.value = row
    formData.id = ''
    formData.user_id = ''
    formData.name = ''
    formData.mobile = ''
    formData.bank_id = ''
    formData.branch_id = ''
    formData.position = ''
    formData.status = 1
    formData.remark = ''
    for (const key in formData) {
        //@ts-ignore
        if (row[key] != null && row[key] != undefined) formData[key] = row[key]
    }
}

const handleClose = () => emit('close')

defineExpose({ open, setFormData })
</script>
