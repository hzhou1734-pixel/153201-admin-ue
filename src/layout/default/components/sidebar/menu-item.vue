<template>
    <template v-if="!route.meta?.hidden">
        <app-link v-if="!hasShowChild" :to="`${routePath}?${queryStr}`">
            <el-menu-item :index="routePath" :class="plainClass">
                <icon
                    class="menu-item-icon"
                    :size="16"
                    v-if="routeMeta?.icon"
                    :name="routeMeta?.icon"
                />
                <template #title>
                    <span>{{ routeMeta?.title }}</span>
                </template>
            </el-menu-item>
        </app-link>
        <el-sub-menu v-else :index="routePath" :popper-class="popperClass" :class="plainClass">
            <template #title>
                <icon
                    class="menu-item-icon"
                    :size="16"
                    v-if="routeMeta?.icon"
                    :name="routeMeta?.icon"
                />
                <span>{{ routeMeta?.title }}</span>
            </template>
            <menu-item
                v-for="item in route?.children"
                :key="resolvePath(item.path)"
                :route="item"
                :route-path="resolvePath(item.path)"
                :popper-class="popperClass"
            />
        </el-sub-menu>
    </template>
</template>

<script lang="ts" setup>
import type { RouteRecordRaw } from 'vue-router'

import { getNormalPath, objectToQuery } from '@/utils/util'
import { isExternal } from '@/utils/validate'

interface Props {
    route: RouteRecordRaw
    routePath: string
    popperClass: string
}

const props = defineProps<Props>()

const hasShowChild = computed(() => {
    const children: RouteRecordRaw[] = props.route.children ?? []
    return !!children.filter((item) => !item.meta?.hidden).length
})

const routeMeta = computed(() => {
    return props.route.meta
})

/** 无图标菜单项（当前用于三级及更深菜单）：标记后由下方全局样式补齐左侧缩进 */
const plainClass = computed(() => (routeMeta.value?.icon ? '' : 'menu-item-no-icon'))

const resolvePath = (path: string) => {
    if (isExternal(path)) {
        return path
    }
    // 绝对路径子项直接返回：业务节点并入后台菜单（如「用户管理」）时，
    // 其真实地址与宿主菜单 path 无关，拼接会得到不存在的地址
    if (path.startsWith('/')) {
        return getNormalPath(path)
    }
    const newPath = getNormalPath(`${props.routePath}/${path}`)
    return newPath
}
const queryStr = computed<string>(() => {
    const query = props.route.meta?.query as string
    if (!query) {
        return ''
    }
    try {
        const queryObj = JSON.parse(query)
        return objectToQuery(queryObj)
    } catch (error) {
        // console.log(error)

        return query
    }
})
</script>
<style lang="scss" scoped>
.el-menu-item,
.el-sub-menu__title {
    .menu-item-icon {
        margin-right: 8px;
        width: var(--el-menu-icon-width);
        text-align: center;
        vertical-align: middle;
    }
}
</style>

<style lang="scss">
/**
 * 无图标菜单项（三级及更深菜单统一不配图标）：
 * element-plus 的 padding-left 只按层级（--el-menu-level）计算，不含图标占位，
 * 去掉图标后三级菜单文字会比二级更靠左、层次倒置。此处补上图标占位宽度（icon-width + 8px margin），
 * 使各级文字起始位置与「有图标」时保持一致。
 * 不使用 scoped：目标元素含 el-menu 子组件内部节点（.el-sub-menu__title），scoped 属性无法命中。
 */
.el-menu-item.menu-item-no-icon,
.el-sub-menu.menu-item-no-icon > .el-sub-menu__title {
    padding-left: calc(
        var(--el-menu-base-level-padding) + var(--el-menu-level) *
            var(--el-menu-level-padding) + var(--el-menu-icon-width) + 8px
    ) !important;
}
</style>
