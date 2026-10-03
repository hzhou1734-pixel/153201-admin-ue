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
            <el-form ref="formRef" :model="formData" label-width="100px" :rules="formRules">
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
                <el-form-item label="支行名称" prop="name">
                    <el-input v-model="formData.name" placeholder="请输入支行名称" clearable />
                </el-form-item>
                <el-form-item label="支行账户" prop="account">
                    <el-input v-model="formData.account" placeholder="请输入支行账户" clearable />
                </el-form-item>
                <el-form-item label="所属市州" prop="city">
                    <el-select
                        v-model="formData.city"
                        class="flex-1"
                        placeholder="限湖南省 14 个市州"
                        clearable
                    >
                        <el-option v-for="city in cityList" :key="city" :label="city" :value="city" />
                    </el-select>
                    <div class="form-tips">支行归属限定湖南省 14 个市州，按市州选择</div>
                </el-form-item>
                <el-form-item label="状态">
                    <el-switch v-model="formData.status" :active-value="1" :inactive-value="0" />
                    <span class="form-tips ml-2">
                        停用后客户端、银行端可选支行列表实时同步移除
                    </span>
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

import { bankAll, branchAdd, branchEdit } from '@/api/hx/bank'
import Popup from '@/components/popup/index.vue'
import { HUNAN_CITY_LIST } from '@/config/hunan'
import { useDictOptions } from '@/hooks/useDictOptions'

const emit = defineEmits(['success', 'close'])
const cityList = HUNAN_CITY_LIST
const formRef = shallowRef<FormInstance>()
const popupRef = shallowRef<InstanceType<typeof Popup>>()
const mode = ref('add')
const popupTitle = computed(() => (mode.value == 'edit' ? '编辑支行' : '新增支行'))

const formData = reactive({
    id: '',
    bank_id: '',
    name: '',
    account: '',
    city: '',
    status: 1,
    remark: ''
})

const formRules = reactive({
    bank_id: [{ required: true, message: '请选择所属银行', trigger: ['change'] }],
    name: [{ required: true, message: '请输入支行名称', trigger: ['blur'] }],
    account: [{ required: true, message: '请输入支行账户', trigger: ['blur'] }],
    city: [{ required: true, message: '请选择所属市州', trigger: ['change'] }]
})

const { optionsData } = useDictOptions<{ bank: any[] }>({
    bank: { api: bankAll }
})

const handleSubmit = async () => {
    await formRef.value?.validate()
    mode.value == 'edit' ? await branchEdit(formData) : await branchAdd(formData)
    popupRef.value?.close()
    emit('success')
}

const open = (type = 'add') => {
    mode.value = type
    if (type == 'add') {
        formData.id = ''
        formData.bank_id = ''
        formData.name = ''
        formData.account = ''
        formData.city = ''
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
