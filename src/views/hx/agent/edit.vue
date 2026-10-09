<template>
    <div class="edit-popup">
        <popup
            ref="popupRef"
            :title="popupTitle"
            :async="true"
            width="580px"
            @confirm="handleSubmit"
            @close="handleClose"
        >
            <el-form ref="formRef" :model="formData" label-width="104px" :rules="formRules">
                <el-form-item label="经办人姓名" prop="name">
                    <el-input v-model="formData.name" placeholder="—" disabled />
                </el-form-item>
                <el-form-item label="手机号" prop="mobile">
                    <el-input v-model="formData.mobile" placeholder="—" disabled />
                    <div class="form-tips">
                        账号身份来自开通时选择的平台注册用户，姓名与手机号不可修改
                    </div>
                </el-form-item>
                <el-form-item label="所属银行" prop="bank_id">
                    <el-select
                        v-model="formData.bank_id"
                        class="flex-1"
                        placeholder="请选择所属银行"
                        clearable
                    >
                        <el-option
                            v-for="item in optionsData.bank"
                            :key="item.id"
                            :label="item.name"
                            :value="item.id"
                        />
                    </el-select>
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

import { agentEdit } from '@/api/hx/agent'
import { bankAll } from '@/api/hx/bank'
import Popup from '@/components/popup/index.vue'
import { useDictOptions } from '@/hooks/useDictOptions'

const emit = defineEmits(['success', 'close'])
const formRef = shallowRef<FormInstance>()
const popupRef = shallowRef<InstanceType<typeof Popup>>()
const popupTitle = computed(() => '编辑业务经办人')

const formData = reactive({
    id: '',
    name: '',
    mobile: '',
    bank_id: '',
    status: 1,
    remark: ''
})

const formRules = reactive({
    name: [{ required: true, message: '请输入经办人姓名', trigger: ['blur'] }],
    mobile: [
        { required: true, message: '请输入手机号', trigger: ['blur'] },
        { pattern: /^1[3-9]\d{9}$/, message: '手机号格式不正确', trigger: ['blur'] }
    ],
    bank_id: [{ required: true, message: '请选择所属银行', trigger: ['change'] }]
})

const { optionsData } = useDictOptions<{ bank: any[] }>({
    bank: { api: bankAll }
})

const handleSubmit = async () => {
    await formRef.value?.validate()
    await agentEdit(formData)
    popupRef.value?.close()
    emit('success')
}

const open = () => {
    popupRef.value?.open()
}

const setFormData = async (row: any) => {
    for (const key in formData) {
        //@ts-ignore
        if (row[key] != null && row[key] != undefined) formData[key] = row[key]
    }
}

const handleClose = () => emit('close')

defineExpose({ open, setFormData })
</script>
