# Banjg Property — 项目交接文档

**更新日期**：2026-10-09  
**维护者**：86yixuanchen-rgb  
**仓库**：[github.com/86yixuanchen-rgb/banjg-property](https://github.com/86yixuanchen-rgb/banjg-property)

---

## 一、项目概述

Banjg Property 是一款面向澳洲物业经理的 **AI 辅助维修协调工具**，核心功能是：

- 统一管理租户、房东、承包商三方的维修请求
- 看板式工作流（New → Waiting → Action Needed → Scheduled → Completed）
- 跨渠道统一收件箱（Email / SMS / Teams / Chat）
- AI 助手（DeepSeek）对请求进行分析并提供建议操作
- 物业、联系人、日历、分析等工作区模块

本项目由 **[Lovable.dev](https://lovable.dev)** 脚手架生成，与 Lovable 编辑器保持双向同步。

> **注意**：不要对已推送的提交执行 `rebase`、`amend`、`squash` 或 `force push`，否则会破坏 Lovable 端的历史记录。

---

## 二、技术栈

| 层次 | 技术 |
|------|------|
| 框架 | [TanStack Start](https://tanstack.com/start) 1.x（SSR + 文件路由） |
| UI | React 19 + TypeScript 5.8 |
| 样式 | Tailwind CSS v4 + shadcn/ui（Radix UI） |
| 路由 | TanStack Router（自动生成 `routeTree.gen.ts`） |
| 数据请求 | TanStack Query v5 |
| 表单 | React Hook Form + Zod |
| 认证 | [Clerk](https://clerk.com)（`@clerk/tanstack-react-start` 1.7.x） |
| AI | DeepSeek API（`deepseek-chat` 模型） |
| 构建 | Vite 8 + Rolldown |
| 测试 | Vitest + Testing Library |

---

## 三、本地开发

### 环境要求

- Node.js ≥ 20
- npm（或 bun，项目同时提供 `bunfig.toml`）

### 启动步骤

```bash
git clone https://github.com/86yixuanchen-rgb/banjg-property.git
cd banjg-property
npm install
```

复制环境变量模板并填入真实 key：

```bash
cp .env.example .env.local
# 编辑 .env.local，填入 Clerk 和 DeepSeek 的 key
```

```bash
npm run dev
```

浏览器访问 `http://localhost:8080`（Vite 默认端口 8080），用真实邮箱通过 Clerk Email OTP 登录或注册。

### 可用命令

| 命令 | 说明 |
|------|------|
| `npm run dev` | 启动开发服务器 |
| `npm run build` | 生产构建 |
| `npm run preview` | 预览生产包 |
| `npm run test` | 运行测试 |
| `npm run lint` | ESLint 检查 |
| `npm run format` | Prettier 格式化 |

### 环境变量

在项目根目录创建 `.env.local`（参考 `.env.example`）：

```env
# Clerk 认证（必填）— 从 https://dashboard.clerk.com 获取
VITE_CLERK_PUBLISHABLE_KEY=pk_test_xxxxxxxxxxxxxxxxxxxx
CLERK_SECRET_KEY=sk_test_xxxxxxxxxxxxxxxxxxxx

# DeepSeek AI 助手（可选，未配置时 AI 面板显示提示）
DEEPSEEK_API_KEY=sk-xxxxxxxxxxxxxxxxxxxx
```

**获取 Clerk Key 的步骤：**
1. 登录 [dashboard.clerk.com](https://dashboard.clerk.com)
2. 创建新应用，选择"Email code"作为认证方式
3. 在 API Keys 页面复制 Publishable Key 和 Secret Key

---

## 四、项目结构

```
src/
├── components/
│   ├── AppShell.tsx          # 全局布局：侧边栏、顶部导航、通知、AI 浮动按钮
│   ├── AssistantPanel.tsx    # AI 对话面板（调用 DeepSeek 服务端函数）
│   ├── RequestCard.tsx       # 看板卡片组件（支持拖拽状态更改）
│   └── ui/                   # shadcn/ui 基础组件库（不要手动修改）
├── lib/
│   ├── auth.tsx              # Clerk 认证封装（useAuth hook，维持统一 API）
│   ├── data.ts               # 种子数据：RepairRequest、Column、Priority 类型
│   ├── deepseek.ts           # DeepSeek 服务端函数（TanStack Start server fn）
│   ├── workspace.tsx         # 全局状态 Context：请求列表、toast 通知
│   └── utils.ts              # cn() 工具函数
├── routes/
│   ├── __root.tsx            # 根路由：ClerkProvider、QueryClientProvider、SEO head
│   ├── index.tsx             # 主仪表盘：统计、AI Briefing、看板
│   ├── login.tsx             # 登录页（Clerk 预制 <SignIn withSignUp /> 组件）
│   ├── inbox.tsx             # 统一收件箱
│   ├── requests.$id.tsx      # 维修请求详情页
│   └── workspace.$section.tsx # 工作区（Properties / Contacts / Calendar / Analytics / Settings）
├── start.ts                  # TanStack Start 实例（含 clerkMiddleware）
└── styles.css                # Tailwind 全局样式 + 设计 token
```

---

## 五、数据模型

当前所有数据存储在 React Context 内存中，页面刷新后重置为种子数据（`src/lib/data.ts`）。

```typescript
interface RepairRequest {
  id: string;          // "REQ-108"
  title: string;       // "Dripping kitchen tap"
  address: string;     // "3/22 Oxford St, Paddington"
  priority: "Urgent" | "High" | "Medium" | "Low";
  column: "New" | "Waiting" | "Action Needed" | "Scheduled" | "Completed";
  status: string;      // 当前状态描述
  waitingOn: string;   // "Landlord · David Chen" | "Tenant · Mia Russo" | ...
  nextAction: string;  // 下一步操作提示
  waiting: string;     // 等待时长
  lastUpdate: string;  // 最后更新时间
}
```

`waitingOn` 字段格式约定：`"<角色> · <姓名>"`（中点分隔），详情页会解析此字段以动态渲染 Stakeholders 面板和时间线。

---

## 六、认证说明（Clerk Email OTP）

认证由 [Clerk](https://clerk.com) 提供，使用 `@clerk/tanstack-react-start` 1.7.x。

### 架构

```
ClerkProvider（__root.tsx）
    ↓
clerkMiddleware()（start.ts，服务端）
    ↓
useAuth()（auth.tsx 封装）→ 所有页面通过此 hook 读取用户信息
```

### 登录 / 注册流程

登录页使用 Clerk 预制 `<SignIn withSignUp />` 组件，自动处理：

- 邮箱 OTP 登录（已有账号）
- 邮箱 OTP 注册（新账号，`withSignUp` 启用）
- Google OAuth（若在 Clerk Dashboard 配置）
- Bot Protection / CAPTCHA
- Session 创建与激活
- 登录后跳转 `/`（`forceRedirectUrl="/"`)

无需手动调用 signal API。Clerk 组件内部自动完成所有流程。

### `useAuth()` hook API（`src/lib/auth.tsx`）

```typescript
const { user, ready, isSignedIn, signOut } = useAuth();
// user: { name: string; email: string } | null（用户资料，可能短暂为 null）
// ready: boolean（Clerk 加载完成标志）
// isSignedIn: boolean（session 级别，比 user 更快更新，用于路由守卫）
// signOut: () => void
```

### 添加更多登录方式（Google / Instagram / WhatsApp）

当前登录页使用 Clerk 预制组件，已配置的认证方式会自动显示。要添加新方式：
1. 在 [Clerk Dashboard](https://dashboard.clerk.com) → Social Connections 启用对应 OAuth provider
2. 按提示在对应 Developer Console 创建 OAuth 应用并配置回调 URL
3. `<SignIn />` 组件会自动显示新的登录按钮，无需修改代码

---

## 七、AI 助手集成

`src/lib/deepseek.ts` 定义了一个 TanStack Start 服务端函数，在服务端调用 DeepSeek API，避免 API Key 泄露到客户端。

**调用流程**：
```
AssistantPanel（前端） → askDeepSeek（服务端函数） → DeepSeek API → 返回答案
```

**未配置 API Key 时**：返回 `NOT_CONFIGURED` 错误码，前端显示配置提示，不影响其他功能。

---

## 八、已完成的代码修复与迭代（2026-10-09）

### 第一轮：9 项 Bug 修复

| # | 问题描述 | 涉及文件 |
|---|---------|---------|
| 1 | `addRequest` 在请求列表为空时生成 `REQ--Infinity` | `lib/workspace.tsx` |
| 2 | 请求详情页找不到 ID 时静默 fallback 到 REQ-101 | `routes/requests.$id.tsx` |
| 3 | 详情页 timeline / 人员 / quote 全部硬编码为 REQ-101 数据 | `routes/requests.$id.tsx` |
| 4 | Inbox AI 建议操作不随消息切换，切换后 checked 状态不重置 | `routes/inbox.tsx` |
| 5 | 仪表盘用户名和日期硬编码（"Good morning, Sarah" / "Wednesday, 7 October"） | `routes/index.tsx` |
| 6 | Profile 下拉菜单点击页面其他区域不会关闭 | `components/AppShell.tsx` |
| 7 | 通知铃铛只切换红点，无实际内容 | `components/AppShell.tsx` |
| 8 | `AssistantPanel` 底部 4 个未使用的组件残留死代码 | `components/AssistantPanel.tsx` |
| 9 | `workspace.$section.tsx` 单组件处理 5 种页面，改为独立子组件 | `routes/workspace.$section.tsx` |

### 第二轮：Clerk 认证接入

| 改动 | 文件 |
|------|------|
| 接入 `@clerk/tanstack-react-start`，替换 localStorage mock | `lib/auth.tsx` |
| 根路由替换为 `ClerkProvider` | `routes/__root.tsx` |
| 服务端加入 `clerkMiddleware()` | `start.ts` |
| 登录页实现 Email OTP 两步验证流程（仅登录） | `routes/login.tsx` |
| 新增环境变量模板 | `.env.example` |
| 修复 `params` spread 类型错误（exactOptionalPropertyTypes） | `components/AppShell.tsx` |
| 修复 env var bracket notation 类型错误 | `lib/deepseek.ts` |

### 第三轮：登录/注册改用 Clerk 预制组件

| 改动 | 文件 |
|------|------|
| 删除 234 行手写 signal API，改用 `<SignIn withSignUp />` 预制组件 | `routes/login.tsx` |
| `useAuth()` 增加 `isSignedIn` 字段（session 维度，避免 `useUser` 竞争） | `lib/auth.tsx` |
| `AppShell` 路由守卫改用 `isSignedIn` 代替 `!user` | `components/AppShell.tsx` |
| 更新交接文档 | `HANDOVER.md` |

---

## 九、待办事项（优先级排序）

### P0 — 上线前必须完成

- [ ] **数据持久化**：接入后端数据库（推荐 Supabase 或 PlanetScale），替换 Context 内存存储
- [x] ~~**真实认证**：替换 localStorage mock，接入真实 Auth~~ → **已完成**（Clerk Email OTP）
- [ ] **Meta OAuth**：接入 Instagram / WhatsApp Business API，实现真实的社交登录和消息收发

### P1 — 近期规划

- [ ] **请求数据模型扩展**：为每个请求添加 `tenantName`、`landlordName`、`tradeName`、`photos`、`timeline` 字段，摆脱从 `waitingOn` 字段推断的临时方案
- [ ] **文件上传**：租户上传维修照片
- [ ] **邮件/SMS 集成**：对接 SendGrid / Twilio，实现真实消息发送（当前 "Reply" 和 "Send Reminder" 仅触发 toast）
- [ ] **日历集成**：对接 Google Calendar 或 Outlook，实现真实预约

### P2 — 长期优化

- [ ] **拖拽看板**：实现 Kanban 卡片拖放（推荐 `@dnd-kit/core`）
- [ ] **多租户 / 多 PM**：支持多个物业经理账号
- [ ] **移动端 App**：基于现有 API 开发 React Native 版本
- [ ] **报表导出**：PDF / Excel 格式的月度维修报告

---

## 十、部署

项目使用 TanStack Start（基于 Nitro），支持多种部署目标。

推荐方式（Vercel）：
1. 将仓库连接到 Vercel
2. 构建命令：`npm run build`
3. 输出目录：`.output`
4. 在 Vercel 环境变量中添加：
   - `VITE_CLERK_PUBLISHABLE_KEY`
   - `CLERK_SECRET_KEY`
   - `DEEPSEEK_API_KEY`
5. 在 Clerk Dashboard → Domains，将 Vercel 的生产域名加入白名单

其他支持的部署目标：Netlify、Cloudflare Workers、Node.js 服务器（参考 [Nitro 部署文档](https://nitro.unjs.io/deploy)）。

---

## 十一、与 Lovable.dev 的同步关系

此仓库通过 GitHub 与 Lovable 编辑器双向同步：
- 在 Lovable 编辑器中的修改会自动提交到本仓库
- 本地推送到 `main` 分支的提交会同步回 Lovable

**操作限制**：
- 禁止 `git push --force`
- 禁止 `git rebase`、`git commit --amend` 对已推送的提交
- 所有本地修改请通过正常 `git commit && git push` 提交

---

*本文档由 Claude Code 自动生成，如有项目背景信息需要补充，请直接编辑此文件。*
