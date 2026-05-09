export type PageKey = "home" | "center" | "process" | "privacy" | "demo" | "miniapp";

export interface NavItem {
  key: PageKey;
  label: string;
}

export const navItems: NavItem[] = [
  { key: "home", label: "首页" },
  { key: "center", label: "中心介绍" },
  { key: "process", label: "服务流程" },
  { key: "privacy", label: "隐私安全" },
  { key: "demo", label: "功能演示" },
  { key: "miniapp", label: "小程序入口" }
];

export const pageKeys = navItems.map((item) => item.key);

export const flowSteps = [
  { title: "选择咨询师", copy: "浏览公开资料，了解咨询师的支持方向和沟通风格。" },
  { title: "选择时间", copy: "查看开放时段、咨询方式和地点说明，选择合适时间。" },
  { title: "确认预约", copy: "确认咨询师、时间段、方式和隐私提示，再提交预约。" },
  { title: "等待确认", copy: "咨询师在小程序端处理预约，用户可在我的预约中查看状态。" },
  { title: "按时咨询", copy: "咨询前可查看确认单，如需调整按平台提示完成操作。" }
];

export const demoSteps = [
  {
    title: "首页",
    short: "预约与测评入口",
    status: "浏览中",
    copy: "首页展示预约入口、测评入口、最近可约和隐私提示。",
    primary: "预约心理咨询",
    detail: "找一个愿意说话的时间",
    tags: ["预约入口", "测评入口", "隐私提示"]
  },
  {
    title: "选择咨询师",
    short: "公开资料",
    status: "选择中",
    copy: "咨询师资料用于了解风格，不展示评分、价格或商业推荐。",
    primary: "周老师",
    detail: "最近可约 05/12 14:00-15:00",
    tags: ["公开资料", "时间段", "非商业"]
  },
  {
    title: "选择时间",
    short: "完整时间段",
    status: "可提交",
    copy: "用户看到开始与结束时间、方式和地点，再进入确认预约。",
    primary: "05/12 14:00-15:00",
    detail: "线下 · 咨询室 201",
    tags: ["时间段", "地点", "方式"]
  },
  {
    title: "确认预约",
    short: "待确认",
    status: "待确认",
    copy: "预约提交后进入待确认，状态由咨询师端同步更新。",
    primary: "预约确认单",
    detail: "咨询师确认后可在我的预约查看",
    tags: ["待确认", "状态同步", "确认单"]
  },
  {
    title: "测评报告",
    short: "量化参考",
    status: "已生成",
    copy: "测评结果以量表分与雷达图呈现，只作为筛查参考。",
    primary: "中度关注",
    detail: "WHO-5 / PHQ-9 / GAD-7 摘要",
    tags: ["雷达图", "量表分", "非诊断"]
  }
];

export const privacyCards = [
  { icon: "封", title: "邮箱账号", copy: "用户和咨询师使用邮箱账号登录，降低系统生成账号的记忆成本。" },
  { icon: "摘", title: "测评摘要", copy: "预约关联测评时只展示风险等级和量表摘要，不展示逐题答案。" },
  { icon: "审", title: "数据审计", copy: "后台关键操作进入审计记录，帮助中心追踪管理行为。" },
  { icon: "急", title: "紧急资源", copy: "紧急支持资源仅做信息提示，不替代本地急救或专业服务。" }
];

export const centerCards = [
  { title: "专业团队", copy: "咨询师资料与排期由本人维护，中心负责审核与数据看板。" },
  { title: "温暖陪伴", copy: "文案和流程避免催促、评判和商业化表达，让用户更容易开始。" },
  { title: "隐私保护", copy: "只在必要范围内展示信息，测评结果以摘要形式辅助沟通。" }
];
