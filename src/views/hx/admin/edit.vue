<template>
    <div class="admin-edit">
        <popup
            ref="popupRef"
            :title="popupTitle"
            :async="true"
            width="560px"
            @confirm="handleSubmit"
            @close="handleClose"
        >
            <el-form ref="formRef" :model="formData" label-width="96px" :rules="formRules">
                <el-form-item label="登录账号" prop="account">
                    <el-input
                        v-model="formData.account"
                        class="flex-1"
                        placeholder="请输入登录账号"
                        :disabled="isEdit"
                        clearable
                    />
                </el-form-item>
                <el-form-item label="姓名" prop="name">
                    <el-input v-model="formData.name" class="flex-1" placeholder="请输入姓名" clearable />
                </el-form-item>
                <el-form-item label="关联角色" prop="role">
                    <el-select v-model="formData.role" class="flex-1" placeholder="请选择角色" clearable>
                        <el-option v-for="role in roleList" :key="role" :label="role" :value="role" />
                    </el-select>
                </el-form-item>
                <el-form-item label="手机号" prop="mobile">
                    <el-input
                        v-model="formData.mobile"
                        class="flex-1"
                        placeholder="请输入手机号"
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

import { HX_ROLES } from '@/config/hxRoles'
import { adminAdd, adminEdit } from '@/api/hx/admin'
import Popup from '@/components/popup/index.vue'
import feedback from '@/utils/feedback'

const emit = defineEmits(['success', 'close'])
const formRef = shallowRef<FormInstance>()
const popupRef = shallowRef<InstanceType<typeof Popup>>()
const roleList = HX_ROLES
const mode = ref('add')

const popupTitle = computed(() => (mode.value == 'edit' ? '编辑管理员' : '新增管理员'))
const isEdit = computed(() => mode.value == 'edit')

const formData = reactive({
    id: '',
    account: '',
    name: '',
    role: '',
    mobile: '',
    status: 1,
    remark: ''
})

const formRules = reactive({
    account: [{ required: true, message: '请输入登录账号', trigger: ['blur'] }],
    name: [{ required: true, message: '请输入姓名', trigger: ['blur'] }],
    role: [{ required: true, message: '请选择关联角色', trigger: ['change'] }]
})

const handleSubmit = async () => {
    await formRef.value?.validate()
    if (mode.value == 'edit') {
        await adminEdit(formData)
        feedback.msgSuccess('管理员信息已更新')
    } else {
        await adminAdd({ ...formData })
        feedback.msgSuccess(`管理员「${formData.name}」创建成功`)
    }
    popupRef.value?.close()
    emit('success')
}

const open = (type = 'add') => {
    mode.value = type
    popupRef.value?.open()
    if (type == 'add') resetForm()
}

const resetForm = () => {
    formData.id = ''
    formData.account = ''
    formData.name = ''
    formData.role = ''
    formData.mobile = ''
    formData.status = 1
    formData.remark = ''
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
