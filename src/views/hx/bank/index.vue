<template>
    <div class="hx-bank">
        <el-card class="!border-none" shadow="never">
            <el-form class="mb-[-16px]" :model="formData" inline>
                <el-form-item class="w-[280px]" label="银行名称">
                    <el-input
                        v-model="formData.name"
                        placeholder="请输入银行名称"
                        clearable
                        @keyup.enter="resetPage"
                    />
                </el-form-item>
                <el-form-item class="w-[220px]" label="状态">
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
                新增银行
            </el-button>
            <div class="mt-4">
                <el-table :data="pager.lists" size="large">
                    <el-table-column label="ID" prop="id" min-width="60" />
                    <el-table-column label="银行名称" prop="name" min-width="180" />
                    <el-table-column label="下属支行" prop="branch_count" min-width="100">
                        <template #default="{ row }">
                            <span>{{ row.branch_count }} 家</span>
                        </template>
                    </el-table-column>
                    <el-table-column label="排序" prop="sort" min-width="80" />
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

<script lang="ts" setup name="hxBank">
import { bankEdit, bankLists } from '@/api/hx/bank'
import { usePaging } from '@/hooks/usePaging'
import feedback from '@/utils/feedback'

import EditPopup from './edit.vue'

const editRef = shallowRef<InstanceType<typeof EditPopup>>()
const showEdit = ref(false)
const formData = reactive({
    name: '',
    status: ''
})
const { pager, getLists, resetParams, resetPage } = usePaging({
    fetchFun: bankLists,
    params: formData
})

const changeStatus = async (row: any) => {
    await bankEdit({ id: row.id, name: row.name, sort: row.sort, status: row.status })
    feedback.msgSuccess(row.status == 1 ? '已启用' : '已停用')
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
