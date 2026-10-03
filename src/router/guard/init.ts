import type { Router } from 'vue-router'

import useAppStore from '@/stores/modules/app'

export default function createInitGuard(router: Router) {
    router.beforeEach(async () => {
        const appStore = useAppStore()
        if (Object.keys(appStore.config).length == 0) {
            // 获取配置
            const data: any = await appStore.getConfig()
            // favicon 使用本地资源（public/favicon.ico），不再从后端配置读取
            void data
        }
    })
}
