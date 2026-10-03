<template>
    <div class="edit-popup">
        <popup
            ref="popupRef"
            :title="popupTitle"
            :async="true"
            width="550px"
            @confirm="handleSubmit"
            @close="handleClose"
        >
            <el-form ref="formRef" :model="formData" label-width="96px" :rules="formRules">
                <el-form-item label="银行名称" prop="name">
                    <el-input v-model="formData.name" placeholder="请输入银行名称" clearable />
                </el-form-item>
                <el-form-item label="排序" prop="sort">
                    <el-input-number v-model="formData.sort" :min="0" :max="999" />
                </el-form-item>
                <el-form-item label="状态">
                    <el-switch v-model="formData.status" :active-value="1" :inactive-value="0" />
                    <span class="form-tips ml-2">停用后该银行下支行不可再选择</span>
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

import { bankAdd, bankEdit } from '@/api/hx/bank'
import Popup from '@/components/popup/index.vue'

const emit = defineEmits(['success', 'close'])
const formRef = shallowRef<FormInstance>()
const popupRef = shallowRef<InstanceType<typeof Popup>>()
const mode = ref('add')
const popupTitle = computed(() => (mode.value == 'edit' ? '编辑银行' : '新增银行'))

const formData = reactive({
    id: '',
    name: '',
    sort: 0,
    status: 1,
    remark: ''
})

const formRules = reactive({
    name: [{ required: true, message: '请输入银行名称', trigger: ['blur'] }]
})

const handleSubmit = async () => {
    await formRef.value?.validate()
    mode.value == 'edit' ? await bankEdit(formData) : await bankAdd(formData)
    popupRef.value?.close()
    emit('success')
}

const open = (type = 'add') => {
    mode.value = type
    if (type == 'add') {
        formData.id = ''
        formData.name = ''
        formData.sort = 0
        formData.status = 1
        formData.remark = ''
    }
    popupRef.value?.open()
}

const setFormData = (row: any) => {
    for (const key in formData) {
        //@ts-ignore
        if (row[key] != null && row[key] != undefined) formData[key] = row[key]
    }
}

const handleClose = () => emit('close')

defineExpose({ open, setFormData })
</script>
