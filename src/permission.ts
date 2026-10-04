/**
 * 权限控制
 */

import 'nprogress/nprogress.css'

import NProgress from 'nprogress'

import config from './config'
import { PageEnum } from './enums/pageEnum'
import router, { findFirstValidRoute } from './router'
import { INDEX_ROUTE, INDEX_ROUTE_NAME } from './router/routes'
import useTabsStore from './stores/modules/multipleTabs'
import useUserStore from './stores/modules/user'
import { clearAuthInfo } from './utils/auth'
import { isExternal } from './utils/validate'

// 动态添加路由-使用递归进行调整-（fix: 修复之前超过3级菜单导致使用keep-alive功能无效问题
const addRoutesRecursively = (routes: any, parentPath = '') => {
    try {
        routes.forEach((route: any) => {
            // 如果路由是外部链接，则不添加
            if (isExternal(route.path)) {
                return
            }

            // 拼接父路由路径和当前路由路径
            const fullPath = parentPath + route.path

            // 创建路由对象，确保每个路由都有唯一的名称
            const routerEntry = {
                ...route,
                path: fullPath,
                name: route.name || fullPath.replace(/\//g, '_').replace('_', '') // 替换斜杠为下划线，生成唯一名称
            }

            // 添加路由
            if (!route.children) {
                router.addRoute(INDEX_ROUTE_NAME, routerEntry)
            } else {
                router.addRoute(routerEntry)
            }

            // 递归处理子路由
            if (route.children && route.children.length > 0) {
                addRoutesRecursively(route.children, fullPath + '/')
            }
        })
    } catch (e) {
        console.error('Error adding routes:', e)
    }
}

// NProgress配置
NProgress.configure({ showSpinner: false })

const loginPath = PageEnum.LOGIN
const defaultPath = PageEnum.INDEX
/**
 * 登录后默认落地页（红星钱谷业务工作台）
 *
 * 背景：likeadmin 模板默认落到「后端下发的第一个有效菜单」，本项目后端菜单首节点是模板样例
 * 工作台（侧边栏已过滤隐藏），会导致登录后打开一个在导航上看不到的页面。
 * 故显式落地到本项目业务工作台 `/hx/dashboard`：它是本地静态挂载路由（router/routes.ts），
 * 必然存在且全角色可见；万一将来被下线，则回退「后端第一个有效菜单」的原有逻辑。
 */
const HX_HOME_ROUTE_NAME = 'HxDashboard'
// 免登录白名单
const whiteList: string[] = [PageEnum.LOGIN, PageEnum.ERROR_403]
/**
 * 本地预览路径前缀（红星钱谷业务系统）
 * 用途：后端菜单配置完成前，直接访问 /admin/hx/preview 验收页面，无需登录后端。
 * 正式上线后端菜单配置完成后，删除本常量与下方判断即可。
 */
const PREVIEW_PREFIX = '/hx'
router.beforeEach(async (to, from, next) => {
    // 开始 Progress Bar
    NProgress.start()
    document.title = to.meta.title ?? config.title
    const userStore = useUserStore()
    const tabsStore = useTabsStore()
    if (whiteList.includes(to.path) || to.path.startsWith(PREVIEW_PREFIX)) {
        // 在免登录白名单，直接进入
        next()
    } else if (userStore.token) {
        // 获取用户信息
        const hasGetUserInfo = Object.keys(userStore.userInfo).length !== 0
        if (hasGetUserInfo) {
            if (to.path === loginPath) {
                next({ path: defaultPath })
            } else {
                next()
            }
        } else {
            try {
                await userStore.getUserInfo()
                const routes = userStore.routes
                // 找到第一个有效路由
                const routeName = findFirstValidRoute(routes)
                // 没有有效路由跳转到403页面
                if (!routeName) {
                    clearAuthInfo()
                    next(PageEnum.ERROR_403)
                    return
                }
                // 登录 / 访问根路径的默认落地页：优先业务工作台，否则回退后端第一个有效菜单
                const homeRouteName = router.hasRoute(HX_HOME_ROUTE_NAME) ? HX_HOME_ROUTE_NAME : routeName
                tabsStore.setRouteName(homeRouteName!)
                INDEX_ROUTE.redirect = { name: homeRouteName }

                // 动态添加index路由
                router.addRoute(INDEX_ROUTE)
                // 动态添加其余路由
                addRoutesRecursively(routes)
                next({ ...to, replace: true })
            } catch (err) {
                clearAuthInfo()
                next({ path: loginPath, query: { redirect: to.fullPath } })
            }
        }
    } else {
        next({ path: loginPath, query: { redirect: to.fullPath } })
    }
})

router.afterEach(() => {
    NProgress.done()
})
