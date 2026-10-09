/**
 * 红星钱谷业务系统 —— 本地 Mock 数据层
 *
 * 用途：后端接口就绪前，管理后台可完整预览/验收页面（列表、筛选、状态流转、审批操作）。
 * 切换：把 USE_MOCK 改为 false（或设置环境变量 VITE_USE_MOCK=false），
 *      接口请求将自动走真实后端（src/api/hx/*.ts 中的 request 调用）。
 */
export const USE_MOCK = true

/** 模拟网络延迟 */
function delay<T>(data: T, ms = 200): Promise<T> {
    return new Promise((resolve) => setTimeout(() => resolve(data), ms))
}

/** 通用分页 */
export function paginate<T>(list: T[], params: any = {}) {
    const page = Number(params.page_no || 1)
    const size = Number(params.page_size || 15)
    const start = (page - 1) * size
    return delay({
        count: list.length,
        lists: list.slice(start, start + size),
        page_no: page,
        page_size: size
    })
}

/** 简易模糊匹配 */
function like(source: any, keyword: any) {
    if (keyword === '' || keyword === null || keyword === undefined) return true
    return String(source ?? '')
        .toLowerCase()
        .includes(String(keyword).toLowerCase())
}

function eq(source: any, target: any) {
    if (target === '' || target === null || target === undefined) return true
    return String(source) === String(target)
}

export function nextId(list: any[]) {
    return list.length ? Math.max(...list.map((item) => item.id)) + 1 : 1
}

function now() {
    const d = new Date()
    const p = (n: number) => String(n).padStart(2, '0')
    return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(
        d.getMinutes()
    )}:${p(d.getSeconds())}`
}

// ============================ 银行 / 支行（P-03） ============================

export const banks: any[] = [
    { id: 1, name: '中国工商银行', status: 1, sort: 1, create_time: '2026-08-10 09:12:00' },
    { id: 2, name: '中国农业银行', status: 1, sort: 2, create_time: '2026-08-10 09:15:00' },
    { id: 3, name: '中国建设银行', status: 1, sort: 3, create_time: '2026-08-11 10:20:00' },
    { id: 4, name: '长沙银行', status: 1, sort: 4, create_time: '2026-08-12 14:05:00' },
    { id: 5, name: '湖南三湘银行', status: 0, sort: 5, create_time: '2026-08-12 14:10:00' }
]

export const branches: any[] = [
    {
        id: 1,
        bank_id: 1,
        name: '长沙五一路支行',
        account: '1901 0203 0910 0012 345',
        city: '长沙市',
        status: 1,
        remark: '',
        create_time: '2026-08-10 09:20:00'
    },
    {
        id: 2,
        bank_id: 1,
        name: '株洲天元支行',
        account: '1901 0203 0910 0012 888',
        city: '株洲市',
        status: 1,
        remark: '',
        create_time: '2026-08-10 09:26:00'
    },
    {
        id: 3,
        bank_id: 2,
        name: '长沙芙蓉支行',
        account: '1801 0104 0400 5522 011',
        city: '长沙市',
        status: 1,
        remark: '',
        create_time: '2026-08-11 10:31:00'
    },
    {
        id: 4,
        bank_id: 3,
        name: '衡阳雁峰支行',
        account: '4300 1502 0900 7788 002',
        city: '衡阳市',
        status: 1,
        remark: '',
        create_time: '2026-08-11 11:02:00'
    },
    {
        id: 5,
        bank_id: 4,
        name: '常德武陵支行',
        account: '8000 1234 5678 9090 12',
        city: '常德市',
        status: 0,
        remark: '暂停业务',
        create_time: '2026-08-12 15:40:00'
    },
    {
        id: 6,
        bank_id: 2,
        name: '怀化鹤城支行',
        account: '1801 0104 0400 5522 066',
        city: '怀化市',
        status: 1,
        remark: '',
        create_time: '2026-08-13 09:05:00'
    }
]

// ============================ 业务经办人账号（P-02） ============================

export const agents: any[] = [
    {
        id: 1,
        name: '张建国',
        mobile: '13873110001',
        bank_id: 1,
        status: 1,
        perms: ['business'],
        create_time: '2026-08-10 09:24:00',
        last_login_time: '2026-09-30 08:41:12',
        remark: ''
    },
    {
        id: 2,
        name: '李红梅',
        mobile: '13907310002',
        bank_id: 1,
        status: 1,
        perms: ['business'],
        create_time: '2026-08-10 09:28:00',
        last_login_time: '2026-09-29 17:20:05',
        remark: ''
    },
    {
        id: 3,
        name: '王湘平',
        mobile: '13786100003',
        bank_id: 2,
        status: 1,
        perms: ['business'],
        create_time: '2026-08-11 10:33:00',
        last_login_time: '',
        remark: ''
    },
    {
        id: 4,
        name: '赵志强',
        mobile: '13508400004',
        bank_id: 3,
        status: 0,
        perms: ['business'],
        create_time: '2026-08-11 11:10:00',
        last_login_time: '2026-09-12 10:02:33',
        remark: '已停用'
    },
    // 以下为「启用但尚未分配支行」的经办人，供「支行维护 · 分配业务经办人」从列表中选择关联
    {
        id: 5,
        name: '刘志远',
        mobile: '13873110005',
        bank_id: 1,
        status: 1,
        perms: ['business'],
        create_time: '2026-08-14 09:40:00',
        last_login_time: '2026-09-28 11:05:20',
        remark: ''
    },
    {
        id: 6,
        name: '陈晓东',
        mobile: '13907310006',
        bank_id: 2,
        status: 1,
        perms: ['business'],
        create_time: '2026-08-14 10:12:00',
        last_login_time: '2026-09-27 15:32:08',
        remark: ''
    },
    {
        id: 7,
        name: '周文斌',
        mobile: '13508400007',
        bank_id: 3,
        status: 1,
        perms: ['business'],
        create_time: '2026-08-15 08:55:00',
        last_login_time: '',
        remark: ''
    }
]

// ============================ 客户（P-04） ============================

export const customers: any[] = [
    {
        id: 1,
        customer_type: 'company',
        name: '陈志远',
        mobile: '18670001001',
        id_card: '4301**********0017',
        company: '长沙远达建材有限公司',
        company_type: '有限责任公司',
        company_address: '长沙市芙蓉区五一大道 128 号远达大厦 12 层',
        industry: '建筑建材',
        agent_id: 1,
        bind_status: 1,
        bind_time: '2026-09-02 10:12:30',
        source: '扫码注册',
        register_time: '2026-09-02 10:12:00',
        remark: '经营贷需求，抵押物为自有厂房',
        create_time: '2026-09-02 10:12:00'
    },
    {
        id: 2,
        customer_type: 'company',
        name: '刘美娟',
        mobile: '18670001002',
        id_card: '4302**********2043',
        company: '株洲美居装饰工程有限公司',
        company_type: '有限责任公司',
        company_address: '株洲市天元区长江北路 66 号',
        industry: '装饰工程',
        agent_id: 2,
        bind_status: 1,
        bind_time: '2026-09-05 15:31:10',
        source: '扫码注册',
        register_time: '2026-09-05 15:31:00',
        remark: '二次合作客户，回款及时',
        create_time: '2026-09-05 15:31:00'
    },
    {
        id: 3,
        customer_type: 'person',
        name: '周文彬',
        mobile: '18670001003',
        id_card: '4303**********3315',
        company: '',
        company_type: '',
        company_address: '',
        industry: '',
        agent_id: 0,
        bind_status: 0,
        bind_time: '',
        source: '后台录入',
        register_time: '',
        remark: '由市场部线下触达，待分配归属',
        create_time: '2026-09-20 09:00:00'
    },
    {
        id: 4,
        customer_type: 'person',
        name: '黄丽君',
        mobile: '18670001004',
        id_card: '4304**********1128',
        company: '',
        company_type: '',
        company_address: '',
        industry: '',
        agent_id: 0,
        bind_status: 0,
        bind_time: '',
        source: '后台录入',
        register_time: '',
        remark: '暂未确定对接支行',
        create_time: '2026-09-22 11:20:00'
    },
    {
        id: 5,
        customer_type: 'company',
        name: '谭建华',
        mobile: '18670001005',
        id_card: '4307**********0521',
        company: '常德建华物流有限公司',
        company_type: '有限责任公司',
        company_address: '常德市武陵区柳叶大道 1008 号',
        industry: '交通运输',
        agent_id: 3,
        bind_status: 1,
        bind_time: '2026-09-25 08:45:20',
        source: '扫码注册',
        register_time: '2026-09-25 08:45:00',
        remark: '物流车队扩张融资，单笔金额较大需董事长终审',
        create_time: '2026-09-25 08:45:00'
    }
]

// ============================ 平台用户池（P-05 调整：银行经办人来源） ============================

/**
 * 平台注册用户：由小程序 / 客户端注册产生。
 * 该用户池也是银行经办人的来源：在「业务经办人账号」页选择本池中的用户，为其开通对应银行的经办人权限。
 */
export const users: any[] = [
    {
        id: 1,
        name: '孙铭',
        mobile: '13800001001',
        id_card: '4301**********0112',
        city: '长沙市',
        source: '小程序注册',
        status: 1,
        register_time: '2026-08-01 09:12:00',
        last_login_time: '2026-09-30 09:05:00'
    },
    {
        id: 2,
        name: '周雅琴',
        mobile: '13800001002',
        id_card: '4301**********2028',
        city: '长沙市',
        source: '小程序注册',
        status: 1,
        register_time: '2026-08-03 14:26:00',
        last_login_time: '2026-09-29 16:40:00'
    },
    {
        id: 3,
        name: '李文昊',
        mobile: '13800001003',
        id_card: '4302**********1537',
        city: '株洲市',
        source: '小程序注册',
        status: 1,
        register_time: '2026-08-05 10:03:00',
        last_login_time: '2026-09-28 11:12:00'
    },
    {
        id: 4,
        name: '何俊杰',
        mobile: '13900002002',
        id_card: '4301**********3011',
        city: '长沙市',
        source: '后台录入',
        status: 1,
        register_time: '2026-08-08 09:40:00',
        last_login_time: '2026-09-27 15:26:00'
    },
    {
        id: 5,
        name: '彭思远',
        mobile: '13900002003',
        id_card: '4304**********2225',
        city: '衡阳市',
        source: '小程序注册',
        status: 1,
        register_time: '2026-08-14 16:18:00',
        last_login_time: '2026-09-26 09:33:00'
    },
    {
        id: 6,
        name: '罗启明',
        mobile: '13700003003',
        id_card: '4304**********4419',
        city: '衡阳市',
        source: '小程序注册',
        status: 1,
        register_time: '2026-08-19 11:05:00',
        last_login_time: '2026-09-12 10:02:33'
    },
    {
        id: 7,
        name: '谢雨薇',
        mobile: '13700003004',
        id_card: '4307**********6602',
        city: '常德市',
        source: '小程序注册',
        status: 1,
        register_time: '2026-08-22 08:52:00',
        last_login_time: '2026-09-24 14:08:00'
    },
    {
        id: 8,
        name: '唐立诚',
        mobile: '13500004005',
        id_card: '4312**********8806',
        city: '怀化市',
        source: '后台录入',
        status: 1,
        register_time: '2026-08-26 13:47:00',
        last_login_time: '2026-09-21 17:35:00'
    },
    {
        id: 9,
        name: '邹凯',
        mobile: '13500004006',
        id_card: '4306**********9934',
        city: '岳阳市',
        source: '小程序注册',
        status: 0,
        register_time: '2026-09-02 10:11:00',
        last_login_time: ''
    },
    {
        id: 10,
        name: '冯晓琳',
        mobile: '13600005007',
        id_card: '4303**********1170',
        city: '湘潭市',
        source: '小程序注册',
        status: 1,
        register_time: '2026-09-06 15:29:00',
        last_login_time: '2026-09-25 09:47:00'
    },
    {
        id: 11,
        name: '杨思琪',
        mobile: '13700006009',
        id_card: '4302**********7741',
        city: '株洲市',
        source: '小程序注册',
        status: 1,
        register_time: '2026-09-10 10:22:00',
        last_login_time: '2026-09-28 16:05:00'
    },
    {
        id: 12,
        name: '尹浩然',
        mobile: '13700006010',
        id_card: '4312**********5528',
        city: '怀化市',
        source: '小程序注册',
        status: 1,
        register_time: '2026-09-14 09:38:00',
        last_login_time: '2026-09-30 11:26:00'
    }
]

// ============================ 银行经办人（在册经办人列表：后台选择平台注册用户开通） ============================

/**
 * 银行经办人：代表银行侧对接人员。由后台在「业务经办人账号」页选择平台注册用户开通权限后生成
 * （audit_user / audit_time 即开通留痕），后台不再直接添加账号。
 * 与「业务经办人账号」区分：业务经办人负责提交业务与材料，银行经办人为银行侧对接与确认人。
 */
export const bankAgents: any[] = [
    {
        id: 1,
        user_id: 2,
        apply_sn: 'HXBA20260810001',
        name: '周雅琴',
        mobile: '13800001002',
        bank_id: 1,
        branch_id: 1,
        position: '客户经理',
        status: 1,
        business_count: 2,
        audit_user: '周总经理',
        audit_time: '2026-08-12 10:20:00',
        last_login_time: '2026-09-29 16:40:00',
        remark: '工行五一支行对接人'
    },
    {
        id: 2,
        user_id: 4,
        apply_sn: 'HXBA20260812002',
        name: '何俊杰',
        mobile: '13900002002',
        bank_id: 2,
        branch_id: 3,
        position: '副行长',
        status: 1,
        business_count: 1,
        audit_user: '周总经理',
        audit_time: '2026-08-15 09:35:00',
        last_login_time: '2026-09-27 15:26:00',
        remark: '农行芙蓉支行，负责大额业务复核'
    },
    {
        id: 3,
        user_id: 6,
        apply_sn: 'HXBA20260818003',
        name: '罗启明',
        mobile: '13700003003',
        bank_id: 3,
        branch_id: 4,
        position: '客户经理',
        status: 0,
        business_count: 2,
        audit_user: '超级管理员',
        audit_time: '2026-08-20 14:12:00',
        last_login_time: '2026-09-12 10:02:33',
        remark: '已调岗，账号停用'
    }
]

// ============================ 业务（P-06 / P-07） ============================

function materials(sn: string) {
    return [
        { name: `${sn}-客户身份证正面.jpg`, type: 1, size: '1.2MB', url: '', upload_time: '' },
        { name: `${sn}-客户身份证反面.jpg`, type: 1, size: '1.1MB', url: '', upload_time: '' },
        { name: `${sn}-营业执照.pdf`, type: 1, size: '2.4MB', url: '', upload_time: '' },
        { name: `${sn}-银行授信批复.pdf`, type: 2, size: '860KB', url: '', upload_time: '' },
        { name: `${sn}-贷款合同（待签）.pdf`, type: 2, size: '1.5MB', url: '', upload_time: '' }
    ]
}

export const businesses: any[] = [
    {
        id: 1,
        sn: 'HX20260902001',
        customer_id: 1,
        customer_name: '陈志远',
        customer_mobile: '18670001001',
        company: '长沙远达建材有限公司',
        amount: 3000000,
        bank_id: 1,
        branch_id: 1,
        agent_id: 1,
        status: 'auditing',
        material_type: '客户资料',
        submit_time: '2026-09-02 10:40:00',
        sign_time: '',
        materials: materials('HX20260902001'),
        reject_reason: '',
        remark: '经营贷，抵押物为厂房',
        review_user: '',
        review_time: ''
    },
    {
        id: 2,
        sn: 'HX20260905002',
        customer_id: 2,
        customer_name: '刘美娟',
        customer_mobile: '18670001002',
        company: '株洲美居装饰工程有限公司',
        amount: 800000,
        bank_id: 1,
        branch_id: 2,
        agent_id: 2,
        status: 'loaning',
        material_type: '银行材料',
        submit_time: '2026-09-05 16:02:00',
        sign_time: '2026-09-08 10:20:00',
        materials: materials('HX20260905002'),
        reject_reason: '',
        remark: '',
        review_user: '孙风控',
        review_time: '2026-09-05 17:40:00'
    },
    {
        id: 3,
        sn: 'HX20260925003',
        customer_id: 5,
        customer_name: '谭建华',
        customer_mobile: '18670001005',
        company: '常德建华物流有限公司',
        amount: 6000000,
        bank_id: 2,
        branch_id: 3,
        agent_id: 3,
        status: 'loaning',
        material_type: '银行材料',
        submit_time: '2026-09-25 09:12:00',
        sign_time: '2026-09-27 15:40:00',
        materials: materials('HX20260925003'),
        reject_reason: '',
        remark: '超过500万，需董事长审批',
        review_user: '孙风控',
        review_time: '2026-09-25 14:30:00'
    },
    {
        id: 4,
        sn: 'HX20260928004',
        customer_id: 3,
        customer_name: '周文彬',
        customer_mobile: '18670001003',
        company: '湘潭文彬机械制造有限公司',
        amount: 1200000,
        bank_id: 3,
        branch_id: 4,
        agent_id: 4,
        status: 'rejected',
        material_type: '客户资料',
        submit_time: '2026-09-28 11:30:00',
        sign_time: '',
        materials: materials('HX20260928004'),
        reject_reason: '近半年银行流水与经营规模不匹配，暂不符合准入条件',
        remark: '',
        review_user: '孙风控',
        review_time: '2026-09-28 14:00:00'
    },
    {
        id: 5,
        sn: 'HX20260912005',
        customer_id: 6,
        customer_name: '李海涛',
        customer_mobile: '18670001008',
        company: '岳阳海涛食品有限公司',
        amount: 1500000,
        bank_id: 3,
        branch_id: 4,
        agent_id: 4,
        status: 'loaning',
        material_type: '银行材料',
        submit_time: '2026-09-12 09:12:00',
        sign_time: '2026-09-12 09:40:00',
        materials: materials('HX20260912005'),
        reject_reason: '',
        remark: '审批通过待放款，用于财务放款登记环节演示',
        review_user: '孙风控',
        review_time: '2026-09-12 09:50:00'
    },
    // ↓ 以下为客户的历史申请记录（已完成 / 已结清 / 已拒绝），用于客户详情「历史贷款申请」展示
    {
        id: 6,
        sn: 'HX20260818006',
        customer_id: 5,
        customer_name: '谭建华',
        customer_mobile: '18670001005',
        company: '常德建华物流有限公司',
        amount: 900000,
        bank_id: 2,
        branch_id: 3,
        agent_id: 3,
        status: 'finished',
        material_type: '银行材料',
        submit_time: '2026-08-18 10:02:00',
        sign_time: '2026-08-20 09:30:00',
        materials: materials('HX20260818006'),
        reject_reason: '',
        remark: '首批车辆采购贷，已结清',
        review_user: '孙风控',
        review_time: '2026-08-18 11:00:00'
    },
    {
        id: 7,
        sn: 'HX20260705007',
        customer_id: 1,
        customer_name: '陈志远',
        customer_mobile: '18670001001',
        company: '长沙远达建材有限公司',
        amount: 500000,
        bank_id: 1,
        branch_id: 1,
        agent_id: 1,
        status: 'finished',
        material_type: '客户资料',
        submit_time: '2026-07-05 09:40:00',
        sign_time: '2026-07-08 14:20:00',
        materials: materials('HX20260705007'),
        reject_reason: '',
        remark: '短期周转贷，已按时结清',
        review_user: '孙风控',
        review_time: '2026-07-05 10:10:00'
    },
    {
        id: 8,
        sn: 'HX20260718008',
        customer_id: 2,
        customer_name: '刘美娟',
        customer_mobile: '18670001002',
        company: '株洲美居装饰工程有限公司',
        amount: 2000000,
        bank_id: 1,
        branch_id: 2,
        agent_id: 2,
        status: 'rejected',
        material_type: '客户资料',
        submit_time: '2026-07-18 15:10:00',
        sign_time: '',
        materials: materials('HX20260718008'),
        reject_reason: '企业纳税评级未达到准入要求，建议补充近一期完税证明后重申',
        remark: '',
        review_user: '孙风控',
        review_time: '2026-07-18 16:00:00'
    }
]

// ============================ 放款审批（P-08 / P-09） ============================

export const loans: any[] = [
    {
        id: 1,
        business_id: 2,
        sn: 'HX20260905002',
        customer_name: '刘美娟',
        customer_mobile: '18670001002',
        amount: 800000,
        bank_id: 1,
        branch_id: 2,
        agent_id: 2,
        sign_time: '2026-09-08 10:20:00',
        nodes: [
            {
                role: '风控负责人',
                status: 1,
                user: '孙风控',
                time: '2026-09-08 14:00:00',
                remark: '材料齐全，同意'
            },
            {
                role: '财务负责人',
                status: 0,
                user: '',
                time: '',
                remark: ''
            },
            {
                role: '总经理',
                status: -1,
                user: '',
                time: '',
                remark: ''
            }
        ],
        status: 'pending',
        paid_status: 0,
        pay_time: '',
        pay_user: '',
        create_time: '2026-09-08 11:00:00'
    },
    {
        id: 2,
        business_id: 3,
        sn: 'HX20260925003',
        customer_name: '谭建华',
        customer_mobile: '18670001005',
        amount: 6000000,
        bank_id: 2,
        branch_id: 3,
        agent_id: 3,
        sign_time: '2026-09-27 15:40:00',
        nodes: [
            {
                role: '风控负责人',
                status: 1,
                user: '孙风控',
                time: '2026-09-27 16:20:00',
                remark: '同意'
            },
            {
                role: '财务负责人',
                status: 1,
                user: '钱财务',
                time: '2026-09-28 09:30:00',
                remark: '资金计划已排'
            },
            {
                role: '总经理',
                status: 1,
                user: '总经理-周总',
                time: '2026-09-28 15:10:00',
                remark: '同意'
            },
            {
                role: '董事长',
                status: 0,
                user: '',
                time: '',
                remark: ''
            }
        ],
        status: 'pending',
        paid_status: 0,
        pay_time: '',
        pay_user: '',
        create_time: '2026-09-27 16:00:00'
    },
    {
        id: 3,
        business_id: 6,
        sn: 'HX20260910005',
        customer_name: '—',
        customer_mobile: '18670001006',
        amount: 500000,
        bank_id: 1,
        branch_id: 1,
        agent_id: 1,
        sign_time: '2026-09-10 09:00:00',
        nodes: [
            {
                role: '风控负责人',
                status: 1,
                user: '孙风控',
                time: '2026-09-10 10:00:00',
                remark: '同意'
            },
            {
                role: '财务负责人',
                status: 1,
                user: '钱财务',
                time: '2026-09-10 11:20:00',
                remark: '同意'
            },
            {
                role: '总经理',
                status: 1,
                user: '总经理-周总',
                time: '2026-09-10 14:00:00',
                remark: '同意'
            }
        ],
        status: 'approved',
        paid_status: 1,
        pay_time: '2026-09-11 10:30:00',
        pay_user: '钱财务',
        create_time: '2026-09-10 09:30:00'
    },
    {
        id: 4,
        business_id: 6,
        sn: 'HX20260915006',
        customer_name: '—',
        customer_mobile: '18670001007',
        amount: 2000000,
        bank_id: 3,
        branch_id: 4,
        agent_id: 4,
        sign_time: '2026-09-15 10:00:00',
        nodes: [
            {
                role: '风控负责人',
                status: 1,
                user: '孙风控',
                time: '2026-09-15 11:00:00',
                remark: '同意'
            },
            {
                role: '财务负责人',
                status: 2,
                user: '钱财务',
                time: '2026-09-15 15:30:00',
                remark: '抵押登记手续未完成，驳回'
            }
        ],
        status: 'rejected',
        paid_status: 0,
        pay_time: '',
        pay_user: '',
        create_time: '2026-09-15 10:20:00'
    },
    {
        id: 5,
        business_id: 5,
        sn: 'HX20260912005',
        customer_name: '李海涛',
        customer_mobile: '18670001008',
        amount: 1500000,
        bank_id: 3,
        branch_id: 4,
        agent_id: 4,
        sign_time: '2026-09-12 09:40:00',
        nodes: [
            {
                role: '风控负责人',
                status: 1,
                user: '孙风控',
                time: '2026-09-12 10:30:00',
                remark: '同意'
            },
            {
                role: '财务负责人',
                status: 1,
                user: '钱财务',
                time: '2026-09-12 14:10:00',
                remark: '同意'
            },
            {
                role: '总经理',
                status: 1,
                user: '总经理-周总',
                time: '2026-09-13 09:20:00',
                remark: '同意'
            }
        ],
        status: 'approved',
        paid_status: 0,
        pay_time: '',
        pay_user: '',
        create_time: '2026-09-12 09:10:00'
    },
    {
        id: 6,
        business_id: 7,
        sn: 'HX20260705007',
        customer_name: '陈志远',
        customer_mobile: '18670001001',
        amount: 500000,
        bank_id: 1,
        branch_id: 1,
        agent_id: 1,
        sign_time: '2026-07-08 14:20:00',
        nodes: [
            {
                role: '风控负责人',
                status: 1,
                user: '孙风控',
                time: '2026-07-08 15:00:00',
                remark: '同意'
            },
            {
                role: '财务负责人',
                status: 1,
                user: '钱财务',
                time: '2026-07-09 09:30:00',
                remark: '同意'
            },
            {
                role: '总经理',
                status: 1,
                user: '总经理-周总',
                time: '2026-07-09 11:10:00',
                remark: '同意'
            }
        ],
        status: 'approved',
        paid_status: 1,
        pay_time: '2026-07-10 10:00:00',
        pay_user: '钱财务',
        create_time: '2026-07-08 14:40:00'
    },
    {
        id: 7,
        business_id: 6,
        sn: 'HX20260818006',
        customer_name: '谭建华',
        customer_mobile: '18670001005',
        amount: 900000,
        bank_id: 2,
        branch_id: 3,
        agent_id: 3,
        sign_time: '2026-08-20 09:30:00',
        nodes: [
            {
                role: '风控负责人',
                status: 1,
                user: '孙风控',
                time: '2026-08-20 10:10:00',
                remark: '同意'
            },
            {
                role: '财务负责人',
                status: 1,
                user: '钱财务',
                time: '2026-08-21 14:00:00',
                remark: '同意'
            },
            {
                role: '总经理',
                status: 1,
                user: '总经理-周总',
                time: '2026-08-22 09:40:00',
                remark: '同意'
            }
        ],
        status: 'approved',
        paid_status: 1,
        pay_time: '2026-08-24 15:20:00',
        pay_user: '钱财务',
        create_time: '2026-08-20 09:50:00'
    }
]

// ============================ 回款凭证（P-10） ============================

export const repayments: any[] = [
    {
        id: 1,
        business_id: 2,
        sn: 'HX20260905002',
        customer_name: '刘美娟',
        amount: 50000,
        period: '第1期',
        uploader: '李红梅',
        upload_time: '2026-09-30 09:10:00',
        vouchers: [
            { name: 'HX20260905002-回款凭证.png', size: '420KB', url: '' },
            { name: 'HX20260905002-银行流水.png', size: '960KB', url: '' },
            { name: 'HX20260905002-收款回单.jpg', size: '510KB', url: '' },
            { name: 'HX20260905002-转账截图.jpg', size: '330KB', url: '' },
            { name: 'HX20260905002-合同扫描件.pdf', size: '1.2MB', url: '' }
        ],
        status: 0,
        reason: '',
        confirm_user: '',
        confirm_time: ''
    },
    {
        id: 2,
        business_id: 3,
        sn: 'HX20260925003',
        customer_name: '谭建华',
        amount: 120000,
        period: '第1期',
        uploader: '王湘平',
        upload_time: '2026-09-28 16:20:00',
        vouchers: [{ name: 'HX20260925003-回款凭证.jpg', size: '380KB', url: '' }],
        status: 2,
        reason: '凭证金额与应还金额不一致，请核对后重新上传',
        confirm_user: '钱财务',
        confirm_time: '2026-09-29 10:05:00'
    },
    {
        id: 3,
        business_id: 1,
        sn: 'HX20260902001',
        customer_name: '陈志远',
        amount: 30000,
        period: '第1期',
        uploader: '张建国',
        upload_time: '2026-09-20 14:00:00',
        vouchers: [{ name: 'HX20260902001-回款凭证.jpg', size: '350KB', url: '' }],
        status: 1,
        reason: '',
        confirm_user: '钱财务',
        confirm_time: '2026-09-20 17:30:00'
    }
]

// ============================ 三方对接配置（P-11） ============================

export const thirdParty: Record<string, any> = {
    storage: {
        status: 1,
        driver: 'aliyun',
        access_key: 'LTAI5t**********9Xq',
        secret_key: '',
        bucket: 'hongxing-qg',
        domain: 'https://oss.hongxingqg.com',
        region: 'oss-cn-changsha'
    },
    sms: {
        status: 1,
        driver: 'aliyun',
        access_key: 'LTAI5t**********7Bd',
        secret_key: '',
        sign: '红星钱谷',
        templates: {
            auth: 'SMS_3001', // 经办人权限开通通知
            sign: 'SMS_3002', // 签约链接通知（客户）
            loan: 'SMS_3003', // 放款通知（客户 / 银行经办人）
            repay: 'SMS_3004' // 回款确认通知
        }
    },
    esign: {
        status: 1,
        app_id: '7438****9201',
        app_secret: '',
        face_auth: 1,
        notify_url: 'https://api.hongxingqg.com/adminapi/hx.esign/notify',
        sign_flow: '人脸认证 → 意愿确认 → 签署 → 结果回传'
    },
    weapp: {
        status: 1,
        app_id: 'wx8f2c****b91a',
        app_secret: '',
        name: '红星钱谷'
    }
}

// ============================ 操作日志 ============================

/** 初始动态：模拟平台近期已发生的操作，供工作台「最近动态」展示 */
export const operationLogs: any[] = [
    {
        id: 1,
        module: '业务审核',
        action: '审核通过',
        content: '业务「HX20260905002」材料核对通过，已向客户推送 e签宝签约短信',
        user: '孙风控',
        time: '2026-09-05 17:40:00'
    },
    {
        id: 2,
        module: '放款管理',
        action: '审批通过',
        content: '业务「HX20260925003」风控负责人审批通过，流转至财务负责人',
        user: '孙风控',
        time: '2026-09-26 09:12:00'
    },
    {
        id: 3,
        module: '回款管理',
        action: '凭证驳回',
        content: '业务「HX20260925003」回款凭证金额与应还金额不一致，已驳回待重传',
        user: '钱财务',
        time: '2026-09-29 10:05:00'
    },
    {
        id: 4,
        module: '客户管理',
        action: '客户注册',
        content: '客户「谭建华」扫码注册，自动归属业务经办人「王湘平」',
        user: '系统',
        time: '2026-09-25 14:20:00'
    },
    {
        id: 5,
        module: '账号管理',
        action: '新增经办人',
        content: '新增业务经办人「李红梅」（株洲天元支行），已分配业务操作权限',
        user: '周总经理',
        time: '2026-08-10 09:28:00'
    }
]

export function pushLog(moduleName: string, action: string, content: string, user = '当前登录账号') {
    operationLogs.unshift({
        id: nextId(operationLogs),
        module: moduleName,
        action,
        content,
        user,
        time: now()
    })
    return operationLogs
}

export { delay, like, eq, now }

// ============================ 关联名称辅助 ============================

export function bankName(id: number) {
    return banks.find((item) => item.id == id)?.name || '—'
}

export function branchName(id: number) {
    return branches.find((item) => item.id == id)?.name || '—'
}

export function agentName(id: number) {
    return agents.find((item) => item.id == id)?.name || '—'
}

export function currentRole() {
    // Mock 环境下的当前操作角色，可在页面切角色查看按钮权限差异
    return localStorage.getItem('hx_mock_role') || '总经理'
}

// ============================ 角色权限（系统设置 · 角色管理） ============================

/** 功能板块（权限颗粒度的「行」维度）：一个板块对应系统中的一个一级/二级业务域 */
export const PERM_MODULES = [
    { key: 'dashboard', name: '工作台' },
    { key: 'customer', name: '客户管理' },
    { key: 'audit', name: '审核中心' },
    { key: 'loan', name: '放款管理' },
    { key: 'repayment', name: '回款管理' },
    { key: 'basis', name: '基础数据' },
    { key: 'account', name: '用户与账号' },
    { key: 'setting', name: '系统设置' }
]

/** 操作权限（权限颗粒度的「列」维度）：每个功能板块可逐项勾选的操作 */
export const PERM_ACTIONS = [
    { key: 'view', name: '查看' },
    { key: 'add', name: '新增' },
    { key: 'edit', name: '编辑' },
    { key: 'delete', name: '删除' },
    { key: 'audit', name: '审核' },
    { key: 'export', name: '导出' }
]

/** 角色默认权限预设：按业务职责生成各功能板块的操作颗粒度 */
export function buildDefaultPerms(role: string): Record<string, Record<string, boolean>> {
    const all: Record<string, boolean> = Object.fromEntries(PERM_ACTIONS.map((a) => [a.key, true]))
    const none: Record<string, boolean> = Object.fromEntries(PERM_ACTIONS.map((a) => [a.key, false]))
    const viewOnly: Record<string, boolean> = Object.fromEntries(
        PERM_ACTIONS.map((a) => [a.key, a.key === 'view'])
    )
    const base: Record<string, Record<string, boolean>> = {}
    PERM_MODULES.forEach((m) => (base[m.key] = { ...none }))

    const grant = (keys: string[], acts: Record<string, boolean>) => {
        keys.forEach((k) => (base[k] = { ...acts }))
    }

    if (role === '超级管理员') {
        PERM_MODULES.forEach((m) => (base[m.key] = { ...all }))
    } else if (role === '风控负责人') {
        grant(
            ['dashboard', 'customer', 'audit', 'loan', 'repayment', 'basis', 'account', 'setting'],
            viewOnly
        )
        grant(['audit'], { ...viewOnly, add: true, edit: true, audit: true })
        grant(['loan'], { ...viewOnly, audit: true })
    } else if (role === '财务负责人') {
        grant(['dashboard', 'customer', 'basis', 'setting'], viewOnly)
        grant(['loan'], { ...viewOnly, add: true, edit: true, audit: true, export: true })
        grant(['repayment'], { ...viewOnly, add: true, edit: true, audit: true, export: true })
    } else if (role === '总经理') {
        grant(
            ['dashboard', 'customer', 'audit', 'loan', 'repayment', 'basis', 'account', 'setting'],
            viewOnly
        )
        grant(['customer', 'basis', 'account'], { ...viewOnly, add: true, edit: true, delete: true })
        grant(['audit', 'loan'], { ...viewOnly, audit: true })
    } else if (role === '董事长') {
        grant(['dashboard', 'loan', 'repayment', 'basis', 'setting'], viewOnly)
        grant(['loan'], { ...viewOnly, audit: true })
    }
    return base
}

/** 角色权限存储：角色名 → 权限矩阵；首次访问按职责生成默认预设 */
export const rolePermissions: Record<string, Record<string, Record<string, boolean>>> = {
    超级管理员: buildDefaultPerms('超级管理员'),
    风控负责人: buildDefaultPerms('风控负责人'),
    财务负责人: buildDefaultPerms('财务负责人'),
    总经理: buildDefaultPerms('总经理'),
    董事长: buildDefaultPerms('董事长')
}

/** 角色说明（角色管理列表用） */
export const ROLE_DESC: Record<string, string> = {
    超级管理员: '平台最高权限，可见并操作全部功能板块，负责机构 / 账号 / 对接 / 角色等系统配置。',
    风控负责人: '业务准入与材料审核，负责客户融资业务审核及放款审批首节点。',
    财务负责人: '放款登记与回款凭证确认，负责放款审批次节点、放款登记与回款核对。',
    总经理: '500 万及以下放款终审、客户归属分配与经办人账号管理。',
    董事长: '500 万以上大额放款终审。'
}

// ============================ 管理员账号（系统设置 · 管理员管理） ============================

export const adminAccounts: any[] = [
    {
        id: 1,
        account: 'admin',
        name: '李管（超级管理员）',
        role: '超级管理员',
        mobile: '13900000010',
        status: 1,
        create_time: '2026-08-01 08:00:00',
        last_login_time: '2026-09-30 09:00:00',
        remark: '平台最高权限，负责系统全部配置'
    },
    {
        id: 2,
        account: 'gm_zhou',
        name: '周总',
        role: '总经理',
        mobile: '13900000003',
        status: 1,
        create_time: '2026-08-02 10:00:00',
        last_login_time: '2026-09-29 18:20:00',
        remark: ''
    },
    {
        id: 3,
        account: 'risk_sun',
        name: '孙风控',
        role: '风控负责人',
        mobile: '13900000001',
        status: 1,
        create_time: '2026-08-03 11:00:00',
        last_login_time: '2026-09-30 08:30:00',
        remark: ''
    },
    {
        id: 4,
        account: 'fin_qian',
        name: '钱财务',
        role: '财务负责人',
        mobile: '13900000002',
        status: 1,
        create_time: '2026-08-03 11:10:00',
        last_login_time: '2026-09-30 09:10:00',
        remark: ''
    },
    {
        id: 5,
        account: 'chair_zheng',
        name: '郑董',
        role: '董事长',
        mobile: '13900000004',
        status: 0,
        create_time: '2026-08-03 11:20:00',
        last_login_time: '2026-09-28 10:00:00',
        remark: '大额放款终审，账号停用中'
    }
]
