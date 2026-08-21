# 1) System Context Diagram

**回答：谁在系统外部，谁与系统交互，系统边界在哪里**

```text
+-------------------+          +----------------------------------+          +----------------------+
| Client Org        |--------->|                                  |<---------| Reviewer             |
| / Task Owner      |          |   Human Judgment Infrastructure  |          | (Human Reviewer)     |
|                   |          |                                  |          |                      |
+-------------------+          |   - Task orchestration           |          +----------------------+
                               |   - Review workflow              |
+-------------------+          |   - Dispute workflow             |          +----------------------+
| Expert Arbitrator |--------->|   - Provenance / audit           |<---------| Admin / Operator     |
| / Domain Expert   |          |   - Export / delivery            |          |                      |
+-------------------+          |                                  |          +----------------------+
                               +------------------+---------------+
                                                  |
                                                  |
                                                  v
                               +----------------------------------+
                               | External AI Annotation Service   |
                               | / Model / LLM / VLM             |
                               +----------------------------------+

                                                  |
                                                  |
                                                  v
                               +----------------------------------+
                               | External Client Data Source      |
                               | / S3 / Internal Storage / DB     |
                               +----------------------------------+
```

### 边界说明

* 你的系统是 **Human Judgment Infrastructure**
* 客户数据源和 AI 模型都可以在系统外部
* Reviewer / Arbitrator / Admin / Client 都是外部参与者
* 你的系统负责的是 **judgment orchestration**，不是原始数据托管

---

# 2) AI–Human Judgment Pipeline Diagram

**回答：AI 和人类各自怎么参与 judgment 流程**

```text
   +------------------+
   | Task Item        |
   | + Data Pointer   |
   +---------+--------+
             |
             v
   +------------------+
   | AI Suggestion    |
   | / Pre-Annotation |
   +---------+--------+
             |
             v
   +---------------------------+
   | Human Review              |
   |                           |
   | - accept                  |
   | - modify                  |
   | - reject                  |
   +------+--------------------+
          |
          +------------------------------+
          |                              |
          v                              v
+----------------------+      +----------------------+
| Agreement / Normal   |      | Disagreement Detected|
| Review Outcome       |      +----------+-----------+
+----------+-----------+                 |
           |                             v
           |                  +----------------------+
           |                  | Dispute Case         |
           |                  | / Conflict Review    |
           |                  +----------+-----------+
           |                             |
           |                             v
           |                  +----------------------+
           |                  | Expert Arbitration   |
           |                  | / Final Decision     |
           |                  +----------+-----------+
           |                             |
           +--------------+--------------+
                          |
                          v
                +----------------------+
                | Canonical Judgment   |
                | + Provenance Record  |
                +----------+-----------+
                           |
                           v
                +----------------------+
                | Export / Delivery    |
                | / Evaluation Record  |
                +----------------------+
```

### 核心点

* AI 先给 suggestion
* Human 不只是“点一下”，而是 **accept / modify / reject**
* disagreement 不是异常，而是进入 dispute
* 最终形成 **canonical judgment + provenance**

---

# 3) End-to-End Data Flow Diagram

**回答：一条任务从创建到结果交付，怎么流动**

```text
+----------------------+
| Client Org           |
| creates task         |
+----------+-----------+
           |
           v
+----------------------+
| Task Definition      |
| - task profile       |
| - label space        |
| - review policy      |
+----------+-----------+
           |
           v
+----------------------+
| Data Reference       |
| - external dataset   |
| - item pointers      |
+----------+-----------+
           |
           +-------------------------------+
           |                               |
           v                               v
+----------------------+        +----------------------+
| AI Annotation Input  |        | Human Assignment     |
| to model/service     |        | to reviewer(s)       |
+----------+-----------+        +----------+-----------+
           |                               |
           v                               |
+----------------------+                   |
| AI Annotation Output |-------------------+
| candidate labels     |
+----------+-----------+
           |
           v
+----------------------+
| Review Workspace     |
| human review         |
+----------+-----------+
           |
           +------------------------------+
           |                              |
           v                              v
+----------------------+        +----------------------+
| Normal Review Result |        | Disagreement         |
+----------+-----------+        +----------+-----------+
           |                               |
           |                               v
           |                    +----------------------+
           |                    | Dispute Workflow     |
           |                    +----------+-----------+
           |                               |
           |                               v
           |                    +----------------------+
           |                    | Expert Arbitration   |
           |                    +----------+-----------+
           |                               |
           +---------------+---------------+
                           |
                           v
                +--------------------------+
                | Provenance + Final Output |
                +------------+-------------+
                             |
                             v
                +--------------------------+
                | Export back to client    |
                +--------------------------+
```

### 核心点

* task creation 和 data reference 分开
* AI annotation 与 human assignment 并行进入 review
* dispute / arbitration 是主流程的一部分，不是外挂

---

# 4) Service Boundary / Logical Architecture Diagram

**回答：系统内部有哪些核心模块，各自负责什么**

```text
+----------------------------------------------------------------------------------+
|                    Human Judgment Infrastructure Platform                         |
+----------------------------------------------------------------------------------+
|                                                                                  |
|  +--------------------+    +--------------------+    +-------------------------+ |
|  | Identity & Access  |    | Org / Project /    |    | Task Profiling &       | |
|  |                    |    | Task Management    |    | Policy Definition      | |
|  +--------------------+    +--------------------+    +-------------------------+ |
|                                                                                  |
|  +--------------------+    +--------------------+    +-------------------------+ |
|  | External Data      |    | AI Annotation      |    | Review Workspace        | |
|  | Access Gateway     |    | Orchestration      |    | (human review)          | |
|  +--------------------+    +--------------------+    +-------------------------+ |
|                                                                                  |
|  +--------------------+    +--------------------+    +-------------------------+ |
|  | Dispute Management |    | Arbitration        |    | Provenance / Audit      | |
|  |                    |    | Workspace          |    |                         | |
|  +--------------------+    +--------------------+    +-------------------------+ |
|                                                                                  |
|  +--------------------+    +--------------------+    +-------------------------+ |
|  | Export / Delivery  |    | Annotation Engine  |    | Metrics / Quality       | |
|  |                    |    | Adapter Layer      |    | Signals                 | |
|  +--------------------+    +--------------------+    +-------------------------+ |
|                                                                                  |
+----------------------------------------------------------------------------------+
```

### 模块含义

* **Identity & Access**：注册、登录、角色、权限
* **Org / Project / Task Management**：组织、项目、任务管理
* **Task Profiling & Policy Definition**：定义 judgment question、标签空间、review policy
* **External Data Access Gateway**：访问客户外部数据
* **AI Annotation Orchestration**：模型结果引入/调度
* **Review Workspace**：人类 review 页面
* **Dispute Management**：冲突管理
* **Arbitration Workspace**：专家仲裁
* **Provenance / Audit**：全过程记录
* **Export / Delivery**：输出给客户
* **Annotation Engine Adapter Layer**：对接 Label Studio / 其他引擎
* **Metrics / Quality Signals**：质量与差异信号

---

# 5) Storage Boundary / Data Ownership Diagram

**回答：什么数据放哪里，谁拥有，什么不能落在我们平台**

```text
                               CLIENT OWNED
+----------------------------------------------------------------------------------+
|                                                                                  |
|  +-----------------------------------+                                           |
|  | Raw Dataset / Source Data         |                                           |
|  | - images / text / video / audio   |                                           |
|  | - internal DB / object storage    |                                           |
|  +-------------------+---------------+                                           |
|                      |                                                           |
+----------------------+-----------------------------------------------------------+
                       |
                       | controlled access / runtime retrieval
                       v

                               PLATFORM BOUNDARY
+----------------------------------------------------------------------------------+
|                                                                                  |
|  +-----------------------------------+                                           |
|  | Data Pointer / Item Reference     |                                           |
|  | - dataset id                      |                                           |
|  | - object pointer                  |                                           |
|  | - task item mapping               |                                           |
|  +-----------------------------------+                                           |
|                                                                                  |
|  +-----------------------------------+                                           |
|  | Judgment Records                  |                                           |
|  | - AI suggestions                  |                                           |
|  | - human annotations               |                                           |
|  | - dispute records                 |                                           |
|  | - arbitration outcomes            |                                           |
|  +-----------------------------------+                                           |
|                                                                                  |
|  +-----------------------------------+                                           |
|  | Provenance / Audit Logs           |                                           |
|  | - reviewer id                     |                                           |
|  | - timestamps                      |                                           |
|  | - revision history                |                                           |
|  +-----------------------------------+                                           |
|                                                                                  |
|  +-----------------------------------+                                           |
|  | Org / User / Task Metadata        |                                           |
|  +-----------------------------------+                                           |
|                                                                                  |
|  +-----------------------------------+                                           |
|  | Temporary Runtime Cache           |                                           |
|  | - optional / policy-controlled    |                                           |
|  | - not canonical storage           |                                           |
|  +-----------------------------------+                                           |
|                                                                                  |
+----------------------------------------------------------------------------------+

Result Delivery:
Platform -> Exported judgments / provenance -> Client Org
```

### 这张图钉死的事情

* **raw data 是 client owned**
* 平台主要持有：

  * data pointers
  * judgments
  * provenance
  * metadata
* 平台不默认持有原始数据
* runtime cache 只是临时存在，不是 canonical storage

---

# 一页总览（5 张图分别回答什么）

```text
1. System Context
   -> 谁在系统外，谁和系统交互

2. AI–Human Judgment Pipeline
   -> AI 和 Human 怎么协作形成 judgment

3. End-to-End Data Flow
   -> 一条任务从创建到交付怎么流转

4. Service Boundary
   -> 系统内部有哪些核心模块

5. Storage Boundary
   -> 数据放哪里，谁拥有，平台 hold 什么
```

---

## 下一步最自然的顺序

如果按工程推进，我建议下一步做这两个之一：

### 方案 A：把这 5 张图整理成正式文档

做成一个：

* `system_context.md`
* `architecture_overview.md`

### 方案 B：直接进入更细一级

也就是从这 5 张图出发，写：

* **System Design Document**
* **Module Responsibilities**
* **Task Tree / Epics**

我建议先做 **Module Responsibilities**，因为这样就能直接对应 Jira / Issues。


---


很好，这一步其实是把 **C4 Container View → Domain Architecture (DDD)** 对齐，并同时**钉死 Label Studio 的架构位置**。
如果这一步不清楚，后面代码仓、服务边界、API、甚至团队分工都会混乱。

我会做三件事：

1. 给出 **Domain Model（DDD Bounded Contexts）**
2. 映射 **C4 Containers ↔ Domain Context**
3. 明确 **Label Studio 的真实位置**

---

# 1. Domain Architecture (DDD)

根据你之前的 Canon 和 Requirements，这个系统自然分成 **6 个 Bounded Context**。

```text
+-------------------------------------------------------------+
|                  Human Judgment Platform                    |
+-------------------------------------------------------------+

   +---------------------------+
   | Identity & Organization   |
   |                           |
   | users                     |
   | roles                     |
   | organizations             |
   +------------+--------------+

                |

   +---------------------------+
   | Task Management Context   |
   |                           |
   | projects                  |
   | tasks                     |
   | task profiling            |
   | dataset references        |
   +------------+--------------+

                |

   +---------------------------+
   | Annotation Context        |
   |                           |
   | AI suggestions            |
   | human annotations         |
   | review actions            |
   +------------+--------------+

                |

   +---------------------------+
   | Dispute & Arbitration     |
   |                           |
   | disagreements             |
   | dispute cases             |
   | arbitration decisions     |
   +------------+--------------+

                |

   +---------------------------+
   | Judgment Provenance       |
   |                           |
   | audit history             |
   | decision lineage          |
   | reviewer metrics          |
   +------------+--------------+

                |

   +---------------------------+
   | Export & Delivery         |
   |                           |
   | result packaging          |
   | dataset export            |
   +---------------------------+
```

---

## 每个 Domain Context 的职责

### Identity & Organization

管理：

* users
* roles
* organizations
* access control

不涉及任何 annotation logic。

---

### Task Management

管理：

* project
* task definition
* dataset pointer
* task configuration
* label schema

这是 **平台入口 domain**。

---

### Annotation Context

管理：

* AI suggestions
* human review
* annotation records

负责 **review workspace**。

---

### Dispute & Arbitration

管理：

* disagreement detection
* dispute creation
* arbitration workflow

这是 **治理层 domain**。

---

### Judgment Provenance

管理：

* annotation history
* review lineage
* reviewer statistics
* decision traceability

这是系统最核心的 **可信度基础设施**。

---

### Export & Delivery

管理：

* export formats
* result packaging
* client data delivery

---

# 2. Mapping: Containers ↔ Domain Context

现在把 **C4 Containers** 对齐到这些 Domain。

```text
Container                          Domain Context
--------------------------------------------------------------
Web Application                    UI layer (all domains)

Workflow Orchestration Service     Task Management
                                   Dispute & Arbitration

AI Annotation Adapter              Annotation Context

External Data Access Gateway       Task Management

Judgment & Provenance Store        Judgment Provenance

Export & Delivery Service          Export & Delivery

Identity Service                   Identity & Organization
```

---

# 3. Label Studio 的架构位置（关键）

你之前问的核心问题是：

> 我们是在 Label Studio 上开发，还是把它当 kernel？

答案非常清晰：

**Label Studio 不应该是系统核心。**

它是：

> **Annotation Engine Adapter**

架构位置如下：

```text
                 +-----------------------+
                 | Review Workspace UI   |
                 +-----------+-----------+
                             |
                             v
                 +-----------------------+
                 | Annotation Context    |
                 | (platform logic)      |
                 +-----------+-----------+
                             |
                             v
                 +-----------------------+
                 | Annotation Engine     |
                 | Adapter Layer         |
                 +-----------+-----------+
                             |
              +--------------+--------------+
              |                             |
              v                             v

      +---------------+           +------------------+
      | Label Studio  |           | Custom Reviewer  |
      | (optional)    |           | Interface        |
      +---------------+           +------------------+
```

---

## 为什么必须这样设计

如果你把 Label Studio 作为核心：

问题会非常严重：

### 1. 治理能力被限制

Label Studio 不支持：

* dispute workflow
* arbitration
* judgment provenance

---

### 2. 数据主权模型冲突

你的架构：

```
external dataset
```

Label Studio 默认：

```
upload dataset
```

---

### 3. AI orchestration能力不足

你需要：

* AI suggestions
* multiple models
* evaluation pipeline

Label Studio 很弱。

---

### 4. 架构被第三方锁死

如果 Label Studio 升级 / 停止维护：

系统风险很大。

---

# 正确架构定位

因此：

```text
Your Platform
   |
   |--- Task orchestration
   |--- Judgment governance
   |--- Data sovereignty
   |
   +---- Annotation Engine Adapter
            |
            +---- Label Studio
            +---- Custom UI
            +---- Other tools
```

Label Studio 只是：

> **pluggable annotation engine**

---

# 4. 最终架构层次（完整）

```text
Layer 1 — External World

Client Org
Reviewer
Arbitrator
AI Models
Client Data Storage


Layer 2 — Platform

Human Judgment Infrastructure


Layer 3 — Domain Contexts

Identity
Task Management
Annotation
Dispute
Provenance
Export


Layer 4 — Containers

Web App
Workflow Service
AI Adapter
Data Access Gateway
Provenance Store
Export Service


Layer 5 — Engines

Label Studio
Custom Annotation UI
External AI Models
External Storage
```

---

# 5. 一个非常重要的结论

现在其实已经很清楚：

你做的不是：

```text
annotation platform
```

而是：

```text
Judgment Infrastructure
```

或者更准确一点：

```text
Human-AI Judgment Governance Platform
```

---
