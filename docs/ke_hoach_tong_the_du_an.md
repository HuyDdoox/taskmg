# BẢN KẾ HOẠCH TỔNG THỂ DỰ ÁN (MASTER PROJECT BLUEPRINT)

> **Dự án:** TaskMG Workspace — Hệ thống Quản lý Dự án & Công việc chuẩn Jira  
> **Chủ nhiệm dự án (PO / PM):** Anh (Sếp)  
> **Trạng thái:** **ĐÃ HOÀN THIỆN 100% & VẬN HÀNH LIVE TRÊN VERCEL + SUPABASE**  
> **URL Production:** [https://taskmg-six.vercel.app/](https://taskmg-six.vercel.app/)

---

## 1. KIẾN TRÚC TỔNG THỂ HỆ THỐNG (SYSTEM ARCHITECTURE)

```mermaid
flowchart TD
    subgraph UI ["TẦNG GIAO DIỆN (NEXT.JS 16 + REACT 19 + FONT AWESOME 6)"]
        Landing["Landing Page Tĩnh (/)"]
        Auth["Đăng nhập / Đăng ký / Kích hoạt lời mời (/login, /accept-invite)"]
        Spaces["Danh sách Dự án & Tiến độ (/spaces)"]
        Workspace["5 Góc nhìn Jira: Summary | List | Board | Timeline | Members"]
        Modals["Task Drawer (Checklist/Logs) + Tạo Hàng Loạt (Paste/CSV) + Chuông 🔔"]
    end

    subgraph Core ["TẦNG NGHIỆP VỤ & BẢO MẬT (SERVER ACTIONS + RBAC)"]
        RBAC["Bộ kiểm soát phân quyền 4 Role (ADMIN, PM, MEMBER, VIEWER)"]
        EmailCheck["Kiểm tra tài khoản tồn tại theo Email & Link mời 1 lần"]
        TaskEngine["Engine Tạo Task lẻ / Hàng loạt Transaction & Checklist %"]
        NotifEngine["Hệ thống Thông báo In-App tự động theo sự kiện"]
    end

    subgraph Data ["TẦNG CƠ SỞ DỮ LIỆU ĐÁM MÂY (SUPABASE POSTGRESQL)"]
        Pooler[(Supabase IPv4 Transaction Pooler - Region ap-south-1)]
    end

    UI <--> Core
    Core <--> Pooler
```

---

## 2. PHẠM VI CÁC PHÂN HỆ ĐÃ TRIỂN KHAI HOÀN CHỈNH

| STT | Phân hệ Module | Chi tiết Nghiệp vụ Đã Hoàn Thiện |
| :---: | :--- | :--- |
| **1** | **Xác thực & Bảo mật Phiên** | • Đăng ký & Đăng nhập trực tiếp (`HttpOnly` HMAC-SHA256 Cookie).<br>• Whitelist 4 tài khoản Demo `@company.com` (bảo vệ tài khoản thật).<br>• Link mời thành viên mới `/accept-invite?token=...` tự đặt mật khẩu (chỉ dùng 1 lần). |
| **2** | **Đa Dự Án & Kiểm tra Nhân sự** | • Tạo dự án mới với mã `Project Key` tự động gợi ý, sinh sẵn 4 cột Kanban & Sprint 1.<br>• Tính chính xác `% Tiến độ hoàn thành` trên thẻ dự án và Avatar viết tắt 2 chữ cái.<br>• **Kiểm tra tài khoản đã tạo theo Email** trước khi thêm vào dự án (`Đã có tài khoản` / `Đã trong dự án` / `Chưa tạo tài khoản`). |
| **3** | **Quản lý Task & Tạo Hàng Loạt** | • Mã task tự động `#KEY-1, #KEY-2...`, phân loại `TASK/STORY/BUG/SUBTASK`, đánh giá kép `Priority` & `Risk Level`.<br>• Tạo hàng loạt tới 100 task qua **Dán danh sách** (tự bóc tách `[BUG]/[STORY]` & `\| [HIGH]`) hoặc **Import file `.CSV`**.<br>• Drawer chi tiết cho phép sửa trực tiếp Tiêu đề, Mô tả, Giai đoạn, thêm/tích/xóa `Action Checklist` (`0% ➔ 100%`) và xem `ActivityLog`. |
| **4** | **5 Góc nhìn Jira & Chuông 🔔** | • `Summary` (KPI & Charts), `List` (Sort 7 cột, Filter, Group by, Search, Inline Create), `Board` (Kéo thả Kanban 4 cột), `Timeline` (Milestones), `Members`.<br>• Chuông thông báo In-App 🔔 thời gian thực khi giao việc, mời dự án, chờ duyệt `In Review`.<br>• Chuyển đổi giao diện **Dark / Light Mode** & Responsive Mobile/Desktop. |
