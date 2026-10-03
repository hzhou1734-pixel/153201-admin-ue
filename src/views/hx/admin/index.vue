<template>
    <div class="hx-admin">
        <el-card class="!border-none" shadow="never">
            <el-form class="mb-[-16px]" :model="formData" inline>
                <el-form-item class="w-[200px]" label="登录账号">
                    <el-input
                        v-model="formData.account"
                        placeholder="请输入登录账号"
                        clearable
                        @keyup.enter="resetPage"
                    />
                </el-form-item>
                <el-form-item class="w-[200px]" label="姓名">
                    <el-input
                        v-model="formData.name"
                        placeholder="请输入姓名"
                        clearable
                        @keyup.enter="resetPage"
                    />
                </el-form-item>
                <el-form-item class="w-[200px]" label="角色">
                    <el-select v-model="formData.role" clearable placeholder="全部">
                        <el-option label="全部" value="" />
                        <el-option v-for="role in roleList" :key="role" :label="role" :value="role" />
                    </el-select>
                </el-form-item>
                <el-form-item class="w-[180px]" label="状态">
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
                新增管理员
            </el-button>
            <div class="mt-4">
                <el-table :data="pager.lists" size="large">
                    <el-table-column label="登录账号" prop="account" min-width="140" />
                    <el-table-column label="姓名" prop="name" min-width="160" />
                    <el-table-column label="关联角色" min-width="130">
                        <template #default="{ row }">
                            <el-tag
                                :type="row.role === '超级管理员' ? 'danger' : 'primary'"
                                size="small"
                                effect="plain"
                            >
                                {{ row.role }}
                            </el-tag>
                        </template>
                    </el-table-column>
                    <el-table-column label="手机号" prop="mobile" min-width="140" />
                    <el-table-column label="状态" min-width="100">
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
                    <el-table-column label="操作" width="150" fixed="right">
                        <template #default="{ row }">
                            <el-button type="primary" link @click="handleEdit(row)">编辑</el-button>
                            <el-button type="danger" link @click="handleDelete(row)">删除</el-button>
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

<script lang="ts" setup name="hxAdmin">
import { HX_ROLES } from '@/config/hxRoles'
import { adminDelete, adminLists, adminStatus } from '@/api/hx/admin'
import { usePaging } from '@/hooks/usePaging'
import feedback from '@/utils/feedback'

import EditPopup from './edit.vue'

const roleList = HX_ROLES
const editRef = shallowRef<InstanceType<typeof EditPopup>>()
const showEdit = ref(false)
const formData = reactive({
    account: '',
    name: '',
    role: '',
    status: ''
})
const { pager, getLists, resetParams, resetPage } = usePaging({
    fetchFun: adminLists,
    params: formData
})

const changeStatus = async (row: any) => {
    await adminStatus({ id: row.id, status: row.status })
    feedback.msgSuccess(row.status == 1 ? '账号已启用' : '账号已停用')
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

const handleDelete = async (row: any) => {
    await feedback.confirm(`确定删除管理员「${row.name}」（${row.account}）？`)
    await adminDelete({ id: row.id })
    feedback.msgSuccess('删除成功')
    getLists()
}

onMounted(() => {
    getLists()
})
</script>
