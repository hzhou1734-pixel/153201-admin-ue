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
                    <el-input v-model="formData.name" placeholder="请输入经办人姓名" clearable />
                </el-form-item>
                <el-form-item label="手机号" prop="mobile">
                    <el-input
                        v-model="formData.mobile"
                        placeholder="请输入手机号（客户端凭此号码接收验证码登录）"
                        clearable
                    />
                    <div class="form-tips">分配权限后，经办人凭该手机号验证码经客户端登录（Y-01）</div>
                </el-form-item>
                <el-form-item label="所属银行" prop="bank_id">
                    <el-select
                        v-model="formData.bank_id"
                        class="flex-1"
                        placeholder="请选择所属银行"
                        clearable
                        @change="handleBankChange"
                    >
                        <el-option
                            v-for="item in optionsData.bank"
                            :key="item.id"
                            :label="item.name"
                            :value="item.id"
                        />
                    </el-select>
                </el-form-item>
                <el-form-item label="所属支行" prop="branch_id">
                    <el-select
                        v-model="formData.branch_id"
                        class="flex-1"
                        placeholder="请选择所属支行"
                        clearable
                    >
                        <el-option
                            v-for="item in branchOptions"
                            :key="item.id"
                            :label="item.name"
                            :value="item.id"
                            :disabled="item.disabled && item.id != formData.branch_id"
                        />
                    </el-select>
                    <div class="form-tips">
                        已配置经办人的支行不可重复选择（同一支行仅一个经办人账号）
                    </div>
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

import { agentAdd, agentEdit } from '@/api/hx/agent'
import { bankAll, branchAll } from '@/api/hx/bank'
import Popup from '@/components/popup/index.vue'
import { useDictOptions } from '@/hooks/useDictOptions'

const emit = defineEmits(['success', 'close'])
const formRef = shallowRef<FormInstance>()
const popupRef = shallowRef<InstanceType<typeof Popup>>()
const branchOptions = ref<any[]>([])
const mode = ref('add')
const popupTitle = computed(() => (mode.value == 'edit' ? '编辑业务经办人' : '新增业务经办人'))

const formData = reactive({
    id: '',
    name: '',
    mobile: '',
    bank_id: '',
    branch_id: '',
    status: 1,
    remark: ''
})

const formRules = reactive({
    name: [{ required: true, message: '请输入经办人姓名', trigger: ['blur'] }],
    mobile: [
        { required: true, message: '请输入手机号', trigger: ['blur'] },
        { pattern: /^1[3-9]\d{9}$/, message: '手机号格式不正确', trigger: ['blur'] }
    ],
    bank_id: [{ required: true, message: '请选择所属银行', trigger: ['change'] }],
    branch_id: [{ required: true, message: '请选择所属支行', trigger: ['change'] }]
})

const { optionsData } = useDictOptions<{ bank: any[] }>({
    bank: { api: bankAll }
})

const loadBranch = async (bankId: any) => {
    if (!bankId) {
        branchOptions.value = []
        return
    }
    branchOptions.value = await branchAll({ bank_id: bankId })
}

const handleBankChange = () => {
    formData.branch_id = ''
    loadBranch(formData.bank_id)
}

const handleSubmit = async () => {
    await formRef.value?.validate()
    mode.value == 'edit' ? await agentEdit(formData) : await agentAdd(formData)
    popupRef.value?.close()
    emit('success')
}

const open = (type = 'add') => {
    mode.value = type
    if (type == 'add') {
        formData.id = ''
        formData.name = ''
        formData.mobile = ''
        formData.bank_id = ''
        formData.branch_id = ''
        formData.status = 1
        formData.remark = ''
        branchOptions.value = []
    }
    popupRef.value?.open()
}

const setFormData = async (row: any) => {
    for (const key in formData) {
        //@ts-ignore
        if (row[key] != null && row[key] != undefined) formData[key] = row[key]
    }
    await loadBranch(row.bank_id)
}

const handleClose = () => emit('close')

defineExpose({ open, setFormData })
</script>
