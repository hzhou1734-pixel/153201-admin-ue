import request from '@/utils/request'

import { delay, now, pushLog, thirdParty, USE_MOCK } from './mock'

/* ==================== 三方对接配置（P-11） ==================== */

/** 配置项说明：storage 云存储 / sms 短信 / esign e签宝 / weapp 小程序 */
export type ThirdPartyKey = 'storage' | 'sms' | 'esign' | 'weapp'

export function thirdPartyGet(params: { key: ThirdPartyKey }) {
    if (!USE_MOCK) return request.get({ url: '/hx.thirdParty/detail', params })
    return delay({ ...thirdParty[params.key] })
}

export function thirdPartySave(params: { key: ThirdPartyKey; data: any }) {
    if (!USE_MOCK) return request.post({ url: '/hx.thirdParty/save', params })
    thirdParty[params.key] = { ...thirdParty[params.key], ...params.data }
    pushLog('三方对接配置', '保存配置', `更新「${params.key}」对接参数 ${now()}`)
    return delay({})
}

// 连通性测试
export function thirdPartyTest(params: { key: ThirdPartyKey }) {
    if (!USE_MOCK) return request.post({ url: '/hx.thirdParty/test', params })
    return delay({ success: true, message: '连通性测试通过（演示数据）' })
}

/** 短信场景模板（对应 1.4 四类短信场景） */
export function smsTemplates() {
    if (!USE_MOCK) return request.get({ url: '/hx.thirdParty/smsTemplates' })
    return delay([
        { key: 'auth', scene: '经办人权限开通通知', template_id: 'SMS_3001', target: '银行经办人' },
        { key: 'sign', scene: '签约通知（e签宝签约链接）', template_id: 'SMS_3002', target: '客户实名手机号' },
        { key: 'loan', scene: '放款通知', template_id: 'SMS_3003', target: '客户 + 银行经办人' },
        { key: 'repay', scene: '回款确认通知', template_id: 'SMS_3004', target: '业务经办人' }
    ])
}
