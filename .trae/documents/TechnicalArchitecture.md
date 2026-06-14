## 1. 架构设计

```mermaid
graph TB
    subgraph "前端层"
        "React SPA"
        "Zustand Store"
        "React Router"
    end
    subgraph "数据层"
        "localStorage"
        "Mock Data"
    end
    "React SPA" --> "Zustand Store"
    "Zustand Store" --> "localStorage"
    "React SPA" --> "React Router"
```

纯前端应用，使用 localStorage 持久化状态，无需后端服务。所有业务逻辑（七天限制、异议超期、验收锁定、变更重新公示）在前端 Zustand store 中实现。

## 2. 技术说明

- 前端：React@18 + TypeScript + Tailwind CSS@3 + Vite
- 初始化工具：vite-init
- 后端：无（纯前端，localStorage 持久化）
- 数据库：无（localStorage + Zustand persist 中间件）

## 3. 路由定义

| 路由 | 用途 |
|------|------|
| / | 首页，角色选择入口 |
| /street | 街道台账页面 |
| /resident | 居民公示端页面 |
| /supervisor | 监理验收页面 |
| /objections | 异议处理页面 |
| /construction | 施工计划页面 |
| /changes | 变更历史页面 |
| /risks | 红色风险清单页面 |
| /archive | 归档审计页面 |

## 4. API 定义

无后端 API。所有数据通过 Zustand store 管理，使用 persist 中间件自动同步到 localStorage。

## 5. 服务器架构图

不适用（纯前端应用）

## 6. 数据模型

### 6.1 数据模型定义

```mermaid
erDiagram
    "Project" ||--o{ "Building" : "contains"
    "Project" ||--o{ "BudgetSource" : "has"
    "Project" ||--o{ "ConstructionUnit" : "assigned"
    "Project" ||--o{ "PublicNotice" : "publishes"
    "Building" ||--o{ "Household" : "contains"
    "PublicNotice" ||--o{ "Vote" : "receives"
    "PublicNotice" ||--o{ "Objection" : "receives"
    "Project" ||--o{ "ConstructionPhase" : "has"
    "ConstructionPhase" ||--o{ "Inspection" : "inspected"
    "Inspection" ||--o{ "Rework" : "may_need"
    "Project" ||--o{ "ChangeRecord" : "tracks"
    "Project" ||--o{ "AuditLog" : "logs"

    "Project" {
        "string id PK"
        "string name"
        "string address"
        "number totalArea"
        "number totalBudget"
        "string status"
        "boolean budgetConfirmed"
        "boolean supervisorFiled"
        "string createdAt"
    }
    "Building" {
        "string id PK"
        "string projectId FK"
        "string buildingNo"
        "number units"
        "number households"
        "number area"
        "boolean inspectionLocked"
    }
    "Household" {
        "string id PK"
        "string buildingId FK"
        "string unitNo"
        "string floorNo"
        "string roomNo"
        "number area"
    }
    "BudgetSource" {
        "string id PK"
        "string projectId FK"
        "string sourceType"
        "number amount"
        "string description"
    }
    "ConstructionUnit" {
        "string id PK"
        "string projectId FK"
        "string name"
        "string qualification"
        "string contactPerson"
        "string contactPhone"
    }
    "PublicNotice" {
        "string id PK"
        "string projectId FK"
        "string startDate"
        "string endDate"
        "boolean fullSevenDays"
        "string status"
    }
    "Vote" {
        "string id PK"
        "string noticeId FK"
        "string residentId"
        "boolean approve"
        "string votedAt"
    }
    "Objection" {
        "string id PK"
        "string noticeId FK"
        "string content"
        "string contactInfo"
        "string status"
        "string reply"
        "string createdAt"
        "string processedAt"
        "boolean overdue"
    }
    "ConstructionPhase" {
        "string id PK"
        "string projectId FK"
        "string buildingId FK"
        "string phaseName"
        "string startDate"
        "string endDate"
        "string status"
    }
    "Inspection" {
        "string id PK"
        "string phaseId FK"
        "string result"
        "number score"
        "string inspectedAt"
        "string inspector"
    }
    "Rework" {
        "string id PK"
        "string inspectionId FK"
        "string reason"
        "string measure"
        "string reinspectResult"
        "string reinspectAt"
    }
    "ChangeRecord" {
        "string id PK"
        "string projectId FK"
        "string buildingId FK"
        "string reason"
        "string status"
        "string appliedAt"
        "string approvedAt"
        "boolean requiresRepublication"
        "string rePublicationStart"
        "string rePublicationEnd"
    }
    "AuditLog" {
        "string id PK"
        "string projectId FK"
        "string operator"
        "string action"
        "string detail"
        "string timestamp"
    }
```

### 6.2 数据定义语言

使用 TypeScript 类型定义代替 DDL：

```typescript
interface Project {
  id: string;
  name: string;
  address: string;
  totalArea: number;
  totalBudget: number;
  status: 'draft' | 'publishing' | 'approved' | 'constructing' | 'completed' | 'archived';
  budgetConfirmed: boolean;
  supervisorFiled: boolean;
  createdAt: string;
}

interface Building {
  id: string;
  projectId: string;
  buildingNo: string;
  units: number;
  households: number;
  area: number;
  inspectionLocked: boolean;
}

interface Household {
  id: string;
  buildingId: string;
  unitNo: string;
  floorNo: string;
  roomNo: string;
  area: number;
}

interface BudgetSource {
  id: string;
  projectId: string;
  sourceType: 'fiscal' | 'special_fund' | 'self_funded' | 'other';
  amount: number;
  description: string;
}

interface ConstructionUnit {
  id: string;
  projectId: string;
  name: string;
  qualification: string;
  contactPerson: string;
  contactPhone: string;
}

interface PublicNotice {
  id: string;
  projectId: string;
  startDate: string;
  endDate: string;
  fullSevenDays: boolean;
  status: 'active' | 'expired' | 'republished';
}

interface Vote {
  id: string;
  noticeId: string;
  residentName: string;
  approve: boolean;
  votedAt: string;
}

interface Objection {
  id: string;
  noticeId: string;
  content: string;
  contactInfo: string;
  status: 'pending' | 'processing' | 'resolved' | 'overdue';
  reply: string;
  createdAt: string;
  processedAt: string;
  overdue: boolean;
}

interface ConstructionPhase {
  id: string;
  projectId: string;
  buildingId: string;
  phaseName: string;
  startDate: string;
  endDate: string;
  status: 'pending' | 'in_progress' | 'completed' | 'rework';
}

interface Inspection {
  id: string;
  phaseId: string;
  result: 'pass' | 'fail' | 'rework';
  score: number;
  inspectedAt: string;
  inspector: string;
}

interface Rework {
  id: string;
  inspectionId: string;
  reason: string;
  measure: string;
  reinspectResult: 'pass' | 'fail';
  reinspectAt: string;
}

interface ChangeRecord {
  id: string;
  projectId: string;
  buildingId: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  appliedAt: string;
  approvedAt: string;
  requiresRepublication: boolean;
  rePublicationStart: string;
  rePublicationEnd: string;
}

interface AuditLog {
  id: string;
  projectId: string;
  operator: string;
  role: 'street' | 'resident' | 'supervisor';
  action: string;
  detail: string;
  timestamp: string;
}
```
