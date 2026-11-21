# BẢN KẾ HOẠCH TỔNG THỂ DỰ ÁN (MASTER PROJECT BLUEPRINT)
> **Dự án:** Website Quản lý Công việc & Dự án (Task Management - Chuẩn Jira thu nhỏ)  
> **Chủ nhiệm dự án (PO / PM):** Anh (Sếp)  
> **Đơn vị thực hiện:** Đội ngũ Kỹ thuật Thu nhỏ (Software House)  
> **Trạng thái:** Chờ phê duyệt chính thức (Pending Final Approval)

---

## 1. SƠ ĐỒ BỨC TRANH TỔNG THỂ HỆ THỐNG (SYSTEM OVERVIEW)

```mermaid
flowchart TD
    subgraph UI ["TẦNG GIAO DIỆN (JIRA-LIKE UI)"]
        Nav["Top Bar (Tìm kiếm, Tạo nhanh, Thông báo)"]
        Sidebar["Sidebar Trái (Dự án, Kanban, Chat)"]
        Board["Bảng Kanban Kéo Thả (Quick Filters: Của tôi, Rủi ro, Deadline)"]
        Drawer["Slide-over Drawer (Mô tả, Checklist, Audit, Risk)"]
    end

    subgraph Core ["TẦNG NGHIỆP VỤ CỐT LÕI (4 MODULES)"]
        M1["1. Dự án & Giai đoạn (Milestones / Sprints)"]
        M2["2. Task Chuẩn Jira (Mã TASK-12, Risk Level, Priority, Checklist)"]
        M3["3. Kanban Board Realtime (Fractional Indexing, Socket.io Sync)"]
        M4["4. Chat Kênh & Mail Tự Động (Chat 1-1, Chat Kênh, Mail Queue)"]
    end

    subgraph Data ["TẦNG DỮ LIỆU & HÀNG ĐỢI (PERSISTENCE)"]
        DB[(PostgreSQL / MongoDB: 10 Bảng quan hệ)]
        Queue[(Redis Queue / Background Worker)]
    end

    UI <--> Core
    Core <--> Data
```

---

## 2. PHẠM VI 4 MODULE TÍNH NĂNG CHỐT

| STT | Phân hệ Module | Chi tiết Nghiệp vụ Chốt |
| :---: | :--- | :--- |
| **1** | **Quản lý Dự án & Giai đoạn** | • Tạo dự án với mã định danh (Project Key, vd: `TASK`).<br>• Phân quyền thành viên (Admin, PM, Member, Viewer).<br>• Chia công việc theo **Giai đoạn (Milestones / Sprints)** giúp dự án lớn không bị ngợp việc. |
| **2** | **Quản lý Task Chuẩn Jira** | • Mã task tự động: `#TASK-1`, `#TASK-2`... dễ sort tăng/giảm.<br>• Phân loại: Task, Bug, Story.<br>• Đánh giá kép: **Độ ưu tiên (Priority)** & **Mức độ rủi ro (Risk Level)**.<br>• Khi ấn vào Task trượt ra Drawer: Gồm **Mô tả công việc (Overview)** và **Chi tiết việc phải làm (Action Checklist có % tiến độ)**.<br>• Lưu vết thời gian `created_at`, `updated_at` và vị trí `order_index`. |
| **3** | **Bảng Kanban Kéo Thả** | • Kéo thả mượt mà, phân cột trạng thái tùy biến.<br>• Bộ lọc nhanh (Quick Filters): *Việc của tôi, Rủi ro cao, Sắp hết hạn*.<br>• Đồng bộ tức thì (Realtime Socket.io) khi thành viên khác kéo task. |
| **4** | **Chat Kênh & Mail Tự Động** | • Chat trực tiếp 1-1 giữa đồng nghiệp.<br>• Chat theo Kênh Dự án và Bình luận thảo luận trong từng Task.<br>• Gửi email tự động qua Background Queue (không làm đơ web) khi giao task, dời hạn, cảnh báo trễ hạn. *(Đã loại bỏ Video Meeting)*. |

---

## 3. LƯỢC ĐỒ CƠ SỞ DỮ LIỆU TINH GỌN (10 BẢNG CHUẨN HÓA)

1. `USERS`: Người dùng (id, email, full_name, password_hash, avatar_url).
2. `PROJECTS`: Dự án (id, name, project_key, description, owner_id).
3. `PROJECT_MEMBERS`: Phân quyền (project_id, user_id, role).
4. `MILESTONES`: Giai đoạn dự án (id, project_id, title, start_date, end_date, status).
5. `KANBAN_COLUMNS`: Cột Kanban (id, project_id, title, position).
6. `TASKS`: Thẻ công việc (id, task_number, issue_key, title, description, issue_type, priority, risk_level, column_id, milestone_id, assignee_id, reporter_id, order_index, due_date, created_at, updated_at).
7. `TASK_CHECKLISTS`: Chi tiết việc phải làm (id, task_id, title, is_completed, position).
8. `CHAT_CHANNELS`: Kênh chat dự án (id, project_id, name, type).
9. `MESSAGES`: Tin nhắn chat (id, channel_id, sender_id, content, created_at).
10. `ACTIVITY_LOGS`: Lịch sử vết thay đổi task (id, task_id, user_id, action, created_at).

---

## 4. LỘ TRÌNH 5 PHA THỰC THI & CỔNG NGHIỆM THU (QUALITY GATES)

```mermaid
flowchart LR
    P1["Pha 1: Phân tích & Kiến trúc\n(SRS, ERD, API Specs)"] -->|Gate 1: Duyệt tài liệu| P2["Pha 2: Thiết kế UI/UX\n(Figma Jira-like, UI Kit)"]
    P2 -->|Gate 2: Duyệt Figma| P3["Pha 3: Lập trình Coding\n(DB, CRUD, Kanban, Chat, Mail)"]
    P3 -->|Gate 3: Build Pass Local| P4["Pha 4: Kiểm thử & Bảo mật\n(Test chức năng, Phá hoại, OWASP)"]
    P4 -->|Gate 4: Test Pass 100%| P5["Pha 5: Triển khai & Bàn giao\n(Docker, Cloud, SSL, HDSD)"]
    P5 --> Handover["🚀 Khách Hàng Nghiệm Thu"]
```

- **Pha 1:** Xuất bản tài liệu đặc tả nghiệp vụ SRS + Lược đồ SQL Schema.
- **Pha 2:** Thiết kế bản mẫu Figma giao diện chuẩn Jira (Sidebar, Kanban, Slide Drawer).
- **Pha 3:** Lập trình Fullstack hoàn thiện 4 module.
- **Pha 4:** Kiểm thử gắt gao, rà soát lỗi bảo mật (IDOR, XSS, Race condition kéo thả).
- **Pha 5:** Đưa website lên Internet (HTTPS) và bàn giao cho khách hàng nghiệm thu.
