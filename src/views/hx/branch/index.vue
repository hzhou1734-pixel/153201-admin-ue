<template>
    <div class="hx-branch">
        <el-card class="!border-none" shadow="never">
            <el-form class="mb-[-16px]" :model="formData" inline>
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
                <el-form-item class="w-[240px]" label="支行名称">
                    <el-input
                        v-model="formData.name"
                        placeholder="请输入支行名称"
                        clearable
                        @keyup.enter="resetPage"
                    />
                </el-form-item>
                <el-form-item class="w-[240px]" label="所属市州">
                    <el-select v-model="formData.city" clearable placeholder="全部">
                        <el-option label="全部" value="" />
                        <el-option v-for="city in cityList" :key="city" :label="city" :value="city" />
                    </el-select>
                </el-form-item>
                <el-form-item class="w-[200px]" label="状态">
                    <el-select v-model="formData.status" clearable placeholder="全部">
                        <el-option label="全部" value="" />
                        <el-option label="启用" :value="1" />
                        <el-option label="停用" :value="0" />
                    </el-select>
                </el-form-item>
                <el-form-item>
                    <el-button type="primary" @click="resetPage">查询</el-button>
                    <el-button @click="resetParams">重置</el-button>
                </el-form-item>
            </el-form>
        </el-card>

        <el-card v-loading="pager.loading" class="mt-4 !border-none" shadow="never">
            <el-button type="primary" @click="handleAdd">
                <template #icon>
                    <icon name="el-icon-Plus" />
                </template>
                新增支行
            </el-button>
            <div class="mt-4">
                <el-table :data="pager.lists" size="large">
                    <el-table-column label="所属银行" prop="bank_name" min-width="150" />
                    <el-table-column
                        label="支行名称"
                        prop="name"
                        min-width="180"
                        show-tooltip-when-overflow
                    />
                    <el-table-column label="支行账户" prop="account" min-width="200" />
                    <el-table-column label="所属市州" prop="city" min-width="130" />
                    <el-table-column label="状态" min-width="110">
                        <template #default="{ row }">
                            <el-switch
                                v-model="row.status"
                                :active-value="1"
                                :inactive-value="0"
                                @change="changeStatus(row)"
                            />
                        </template>
                    </el-table-column>
                    <el-table-column label="创建时间" prop="create_time" min-width="180" />
                    <el-table-column label="操作" width="120" fixed="right">
                        <template #default="{ row }">
                            <el-button type="primary" link @click="handleEdit(row)">编辑</el-button>
                        </template>
                    </el-table-column>
                </el-table>
            </div>
            <div class="flex mt-4 justify-end">
                <pagination v-model="pager" @change="getLists" />
            </div>
        </el-card>

        <edit-popup v-if="showEdit" ref="editRef" @success="getLists" @close="showEdit = false" />
    </div>
</template>

<script lang="ts" setup name="hxBranch">
import { bankAll, branchEdit, branchLists } from '@/api/hx/bank'
import { HUNAN_CITY_LIST } from '@/config/hunan'
import { useDictOptions } from '@/hooks/useDictOptions'
import { usePaging } from '@/hooks/usePaging'
import feedback from '@/utils/feedback'

import EditPopup from './edit.vue'

const cityList = HUNAN_CITY_LIST
const editRef = shallowRef<InstanceType<typeof EditPopup>>()
const showEdit = ref(false)
const formData = reactive({
    bank_id: '',
    name: '',
    city: '',
    status: ''
})
const { pager, getLists, resetParams, resetPage } = usePaging({
    fetchFun: branchLists,
    params: formData
})

const { optionsData } = useDictOptions<{ bank: any[] }>({
    bank: { api: bankAll }
})

const changeStatus = async (row: any) => {
    await branchEdit({
        id: row.id,
        bank_id: row.bank_id,
        name: row.name,
        account: row.account,
        city: row.city,
        status: row.status,
        remark: row.remark
    })
    feedback.msgSuccess(row.status == 1 ? '已启用' : '已停用，客户端与银行端支行列表已同步')
    getLists()
}

const handleAdd = async () => {
    showEdit.value = true
    await nextTick()
    editRef.value?.open('add')
}

const handleEdit = async (row: any) => {
    showEdit.value = true
    await nextTick()
    editRef.value?.open('edit')
    editRef.value?.setFormData(row)
}

onMounted(() => {
    getLists()
})
</script>
