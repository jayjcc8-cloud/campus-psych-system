# 教师匿名心理支持平台

这是一次按新产品定位重建的代码库：面向教师群体，提供匿名优先的心理支持请求入口。产品尊重用户自主权，不强制登录、不强制绑定身份、不追问未回应或未到场。

## 技术栈

- 用户端：`uni-app + Vue3 + TypeScript`
- 管理后台：`Vue3 + Vite + TypeScript`
- API：`NestJS + TypeScript`
- 数据库：`PostgreSQL`
- 工作区：`pnpm workspace`
- 部署/本地环境：`Docker Compose`

## 目录

```text
apps/user-client   匿名教师支持用户端
apps/admin-web     心理服务中心管理后台
apps/api           NestJS REST API
packages/shared    共享类型、状态、校验 schema
infra              Docker Compose 环境
legacy             旧学生预约系统归档
```

## 本地启动

```bash
pnpm install
docker compose -f infra/docker-compose.yml up postgres
pnpm dev:api
pnpm dev:admin
pnpm dev:user
```

也可以一键启动 API 与后台：

```bash
docker compose -f infra/docker-compose.yml up
```

默认后台账号：

```text
账号：center-admin
密码：Admin@123456
```

## 核心能力

- 匿名提交支持请求
- 可选邮箱或其他联系方式
- 选择心理服务中心开放时段
- 生成匿名回执码
- 凭回执码查看状态和撤回请求
- 中心后台处理请求池
- 温和限流和垃圾标记
- 后台操作审计
