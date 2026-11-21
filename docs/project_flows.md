# NHẬT KÝ LUỒNG LÀM VIỆC DỰ ÁN (PROJECT WORKFLOW LOGS)

> **Mục đích:** Ghi lại toàn bộ các luồng làm việc (Workflows), quyết định kỹ thuật và tiến trình trao đổi giữa Sếp (PO) và Kỹ thuật dưới dạng sơ đồ tư duy trực quan, ngắn gọn, ai nhìn vào cũng hiểu ngay.

---

## 📌 FLOW 1: TIẾP NHẬN YÊU CẦU KHÁCH HÀNG & QUY TRÌNH 5 PHA

```mermaid
flowchart TD
    Customer["🏢 KHÁCH HÀNG\n(Đưa ra đề bài / Yêu cầu tính năng)"] --> Team["👥 ANH & ĐỘI NGŨ KỸ THUẬT\n(Tiếp nhận & Thống nhất mô hình 5 pha)"]

    Team --> P1["Pha 1: Phân tích & Kiến trúc\n(BA + Tech Lead / SA)"]
    P1 -->|SRS & ERD Chốt| P2["Pha 2: Thiết kế UI/UX\n(UI/UX Designer)"]
    P2 -->|Figma & UI Kit Chốt| P3["Pha 3: Lập trình Coding\n(Fullstack / BE + FE Dev)"]
    P3 -->|Source Code & Build Chốt| P4["Pha 4: Kiểm thử & Bảo mật\n(QA / QC + Security)"]
    P4 -->|Test Pass 100%| P5["Pha 5: Triển khai & Bàn giao\n(DevOps + Tech Lead)"]
    P5 --> Handover["🚀 BÀN GIAO CHO KHÁCH HÀNG\n(Nghiệm thu thực tế)"]
```

### Chú thích súc tích:
- **Khởi nguồn:** Khách hàng đưa bài toán thực tế. Anh và Em cùng đứng chung một đội ngũ (Software House) để xử lý.
- **Tiêu chuẩn chuyển pha:** Mỗi pha chỉ chuyển giao khi có sản phẩm chốt (SRS & ERD ➔ Figma ➔ Source Code ➔ Test Pass ➔ Bàn giao).


---

## 📌 FLOW 2: TINH GỌN PHẠM VI (CẮT BỎ VIDEO MEETING) & NÂNG CẤP CHUẨN JIRA

```mermaid
flowchart LR
    A["👤 Sếp chỉ đạo điều chỉnh\n(Bỏ Video Meeting, thêm Chuẩn Jira)"] --> B["✂️ Cắt bỏ WebRTC & SFU Server\n(Giảm 40% độ phức tạp máy chủ)"]
    B --> C["🎯 Tập trung 4 Cốt Lõi Tinh Gọn:\n1. Dự án & Giai đoạn (Milestones)\n2. Task chuẩn Jira (Risk, Sort, Checklist)\n3. Kanban Drag-Drop Realtime\n4. Chat Nhóm & Mail Tự Động"]
    C --> D["📂 Cập nhật Lược đồ CSDL\n(Thay MEETINGS bằng MILESTONES)"]
```

### Chú thích súc tích:
- **Quyết định:** Cắt bỏ tính năng Video Meeting để tránh cồng kềnh hạ tầng và rủi ro nghẽn băng thông WebRTC.
- **Tập trung:** Giữ Chat / Group chat thời gian thực; nâng cấp Task theo chuẩn Jira (Risk, Priority, Checklist) và chia Giai đoạn (Milestones).

---

## 📌 FLOW 3: KHỞI TẠO HẠ TẦNG FULLSTACK & NẠP DỮ LIỆU CƠ SỞ (OPTION 1)

```mermaid
flowchart LR
    A["👤 Sếp duyệt Option 1 & chỉ đạo nạp data"] --> B["⚙️ Dựng Next.js 15 (React 19) + Tailwind CSS"]
    B --> C["🗄️ Cấu hình Prisma ORM 10 bảng dữ liệu"]
    C --> D["🌱 Chạy Seed Data: 3 Users, Dự án TASK, 3 Milestones, 4 Cột, 7 Tasks Jira"]
    D --> E["🎯 Kết quả: Build Pass 100%, sẵn sàng làm UI"]
```

### Chú thích súc tích:
- **Công nghệ triển khai:** Next.js 15 (App Router, Turbopack, TypeScript), Prisma ORM 6.4.1, SQLite Database cục bộ.
- **Dữ liệu đã nạp:** 1 Dự án mẫu [TASK], 3 Giai đoạn, 4 Cột Kanban, 7 Task chuẩn Jira kèm Action Checklist & Mức rủi ro, 1 Kênh chat thảo luận và Activity Logs.
- **Kiểm thử thực tế:** Build thành công 100% trong 3.7 giây, không lỗi TypeScript.

---

## 📌 FLOW 4: HOÀN THIỆN GIAO DIỆN BẢNG KANBAN & DRAWER CHI TIẾT (CHUẨN JIRA)

```mermaid
flowchart LR
    A["👤 Sếp yêu cầu bước tiếp theo"] --> B["🎨 Dựng Giao Diện Chuẩn Jira\n(Sidebar Trái, Topbar, 4 Cột Kanban)"]
    B --> C["🖱️ Xử lý Kéo Thả Mượt Mà\n(Cập nhật cột & vị trí order_index)"]
    C --> D["📑 Drawer Trượt Phải Chi Tiết Task\n(Overview, Checklist tích % tiến độ, Risk)"]
    D --> E["🎯 Kết quả: TASK-3 & TASK-4 Đạt 100%\n(Build Pass Turbopack trong 0.7s)"]
```

### Chú thích súc tích:
- **Tính năng hoàn thành:** Bảng Kanban 4 cột (`To Do`, `In Progress`, `In Review`, `Done`), Bộ lọc nhanh (*Chỉ việc của tôi, Rủi ro cao 🔥, Sắp hết hạn ⏰, Lọc theo Giai đoạn*), Kéo thả thẻ mượt mà cập nhật Server Action.
- **Drawer chi tiết Task:** Click vào bất kỳ Task nào sẽ trượt bảng chi tiết từ phải sang, hiển thị Mô tả công việc, Action Checklist có thể tích chọn tăng % tiến độ, Lịch sử Activity Logs.
- **Kiểm thử:** Next.js 16.4 Turbopack build thành công 100% trong 780ms.

---

## 📌 FLOW 5: KẾT NỐI CLOUD SUPABASE POSTGRESQL & ĐỒNG BỘ DỮ LIỆU

```mermaid
flowchart LR
    A["👤 Sếp cung cấp password dự án taskmg"] --> B["⚙️ Cấu hình .env kết nối Cloud Supabase\n(Host: db.jjzgilgwtwhbedpyokme.supabase.co)"]
    B --> C["🗄️ Đổi Prisma sang PostgreSQL & Chạy db push\n(Đồng bộ 10 bảng lên Cloud thành công)"]
    C --> D["🌱 Chạy Seed Data lên Supabase Cloud\n(3 Users, 3 Milestones, 4 Cột, 7 Tasks)"]
    D --> E["🎯 Kết quả: Next.js kết nối trực tiếp Supabase\n(Build Pass 100% trong 0.5s)"]
```

### Chú thích súc tích:
- **Hạ tầng CSDL mới:** Nâng cấp từ SQLite cục bộ lên **Supabase PostgreSQL Cloud** thực tế (Project Ref: `jjzgilgwtwhbedpyokme`).
- **Đồng bộ dữ liệu:** 10 bảng dữ liệu quan hệ và toàn bộ dữ liệu mẫu đã được nạp trực tiếp vào Supabase Database.
- **Hiệu năng:** Next.js App Router kết nối trực tiếp, `npm run build` thành công trong 536ms.

---

## 📌 FLOW 6: ĐẨY CODE LÊN GITHUB & THIẾT LẬP GO-LIVE TRIỂN KHAI

```mermaid
flowchart LR
    A["👤 Sếp cung cấp repo GitHub & yêu cầu Go-live"] --> B["📦 Stage, Commit 15 Files Toàn Diện"]
    B --> C["🚀 Git Push lên https://github.com/HuyDdoox/taskmg.git\n(Branch main đồng bộ 100%)"]
    C --> D["🌐 Kiến Trúc Go-Live:\n• Vercel: Host Fullstack Next.js (FE + BE Server Actions)\n• Supabase: Managed PostgreSQL Cloud\n• Render: Host Realtime WebSocket Server"]
```

### Chú thích súc tích:
- **Kho lưu trữ:** Toàn bộ mã nguồn, tài liệu BA, lược đồ Prisma và UI Kanban đã đẩy lên GitHub `HuyDdoox/taskmg`.
- **Mô hình Go-Live:** Next.js 15 triển khai trực tiếp trên Vercel (kết nối Supabase Database).

---

## 📌 FLOW 7: XÂY DỰNG BACKEND REALTIME SOCKET.IO & SẴN SÀNG GO-LIVE RENDER

```mermaid
flowchart LR
    A["👤 Sếp chỉ đạo Go-live Backend Render"] --> B["⚙️ Khởi tạo thư mục server/\n(Express.js + Socket.io + CORS)"]
    B --> C["⚡ Lập trình Event Realtime:\n• join_project • task_moved • send_message"]
    C --> D["📄 Cấu hình render.yaml tự động\n(RootDir: server, Port: 10000)"]
    D --> E["🚀 Git Push lên HuyDdoox/taskmg.git\n(Sẵn sàng 1-click deploy trên Render)"]
```

### Chú thích súc tích:
- **Backend Service:** Đã xây dựng hoàn chỉnh máy chủ WebSocket thời gian thực độc lập tại thư mục `server/`.
- **Cấu hình Render:** Tự động hóa qua file `render.yaml` (Node.js runtime, port 10000, khu vực Singapore siêu nhanh).
- **Trạng thái:** Đã đẩy toàn bộ lên nhánh `main` của GitHub.

---
*(Các luồng công việc tiếp theo sẽ được tự động cập nhật bên dưới khi triển khai từng pha)*
