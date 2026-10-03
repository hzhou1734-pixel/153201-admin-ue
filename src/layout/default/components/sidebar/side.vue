<template>
    <div class="side" :style="sideStyle">
        <side-logo v-if="settingStore.showLogo" :show-title="!isCollapsed" :theme="sideTheme" />
        <side-menu
            :routes="routes"
            :is-collapsed="isCollapsed"
            :width="settingStore.sideWidth"
            :unique-opened="settingStore.isUniqueOpened"
            :config="menuProp"
            :theme="sideTheme"
            @select="handleSelect"
        />
    </div>
</template>

<script setup lang="ts">
import useAppStore from '@/stores/modules/app'
import useSettingStore from '@/stores/modules/setting'
import useUserStore from '@/stores/modules/user'

import SideLogo from './logo.vue'
import SideMenu from './menu.vue'

import { currentHxRole } from '@/config/hxRoles'
import { mergeHxMenus } from '@/router/hxMenuMerge'
import { filterHxMenusByRole, hxMenus } from '@/router/hxMenus'

const appStore = useAppStore()
const isCollapsed = computed(() => {
    if (appStore.isMobile) {
        return false
    } else {
        return appStore.isCollapsed
    }
})

const settingStore = useSettingStore()
const sideTheme = computed(() => settingStore.sideTheme)
const userStore = useUserStore()

/**
 * 侧边栏 = 后台原有菜单 + 业务节点，融合为一个整体：
 * 客户列表/客户归属分配 并入「用户管理」（整体提到第二位）；系统对接 并入「系统设置」；
 * 其余业务节点（审核 / 放款 / 回款 / 基础数据 / 账号权限）插入「工作台」之后。
 * 业务节点按当前角色过滤，实现菜单级权限拆分。
 */
const routes = computed(() => {
    const hxTree = filterHxMenusByRole(hxMenus as any[], currentHxRole.value)
    return mergeHxMenus(userStore.routes || [], hxTree)
})

const sideStyle = computed(() => {
    return sideTheme.value == 'dark'
        ? {
              '--side-dark-color': settingStore.sideDarkColor
          }
        : ''
})
const menuProp = computed(() => {
    return {
        backgroundColor: sideTheme.value == 'dark' ? settingStore.sideDarkColor : '',
        textColor: sideTheme.value == 'dark' ? 'var(--el-color-white)' : '',
        activeTextColor: sideTheme.value == 'dark' ? 'var(--el-color-white)' : ''
    }
})
const handleSelect = () => {
    if (appStore.isMobile) {
        appStore.toggleCollapsed(true)
    }
}
</script>

<style lang="scss" scoped>
.side {
    position: relative;
    z-index: 999;
    @apply border-r border-br-light h-full flex flex-col;
    background-color: var(--side-dark-color, var(--el-bg-color));
}
</style>
