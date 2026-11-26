# BẢNG THEO DÕI TIẾN ĐỘ DỰ ÁN (PROJECT PROGRESS TRACKER)

> **Dự án:** TaskMG Workspace — Hệ thống Quản lý Dự án & Công việc chuẩn Jira  
> **Cập nhật lần cuối:** 26/11/2026  
> **Tổng thể tiến độ:** **100% HOÀN THIỆN, ĐÃ KIỂM THỬ E2E 20/20 KỊCH BẢN & VẬN HÀNH LIVE**  
> **Link Production:** [https://taskmg-six.vercel.app/](https://taskmg-six.vercel.app/)

---

## 📌 BẢNG NGHIỆM THU CÁC HẠNG MỤC CỐT LÕI

| Mã Hạng Mục | Tên Phân Hệ / Tính Năng | Mức Ưu Tiên | Trạng Thái Nghiệm Thu |
| :---: | :--- | :---: | :--- |
| **MOD-01** | Landing Page tĩnh + Đăng ký / Đăng nhập / Whitelist 4 Role Demo | `BLOCKER` | ✅ **HOÀN THÀNH 100%** |
| **MOD-02** | Quản lý Đa Dự Án (`/spaces`), Tiến độ `% Done`, Icon Font Awesome 6 | `HIGH` | ✅ **HOÀN THÀNH 100%** |
| **MOD-03** | Kiểm tra Email đã tạo tài khoản chưa & Link mời `/accept-invite` 1 lần | `HIGH` | ✅ **HOÀN THÀNH 100%** |
| **MOD-04** | Phân quyền RBAC 4 Vai trò (`ADMIN`, `PM`, `MEMBER`, `VIEWER`) & Chống IDOR | `BLOCKER` | ✅ **HOÀN THÀNH 100%** |
| **MOD-05** | 5 Góc nhìn Jira (`Summary`, `List` Sort 7 cột/Group/Filter, `Board`, `Timeline`, `Members`) | `HIGH` | ✅ **HOÀN THÀNH 100%** |
| **MOD-06** | Tạo Task Hàng Loạt (Paste danh sách tự tách `[BUG] \| [HIGH]` & Import `.CSV`) | `HIGH` | ✅ **HOÀN THÀNH 100%** |
| **MOD-07** | Slide-over Task Drawer (Sửa Tiêu đề/Mô tả/Milestone, thêm/tích/xóa Checklist `%`) | `MEDIUM` | ✅ **HOÀN THÀNH 100%** |
| **MOD-08** | Chuông Thông báo In-App 🔔 (`NotificationBell`) & Chuyển đổi Dark/Light Mode | `MEDIUM` | ✅ **HOÀN THÀNH 100%** |
| **MOD-09** | Kiểm thử E2E 20/20 Kịch bản QA trên Live Vercel ([docs/qa_test_report.md](file:///e:/Hocki5/Task/docs/qa_test_report.md)) | `HIGH` | ✅ **PASS 20/20 (100%)** |

---

## 🌐 HẠ TẦNG TAM GIÁC CLOUD ĐANG VẬN HÀNH (3-CLOUD ARCHITECTURE)
- **Fullstack Hosting (FE & Server Actions):** Vercel Production (`bom1` Mumbai — tối ưu độ trễ với CSDL).
- **Máy chủ Realtime WebSocket (v2.0):** Render Web Service (`server/index.js` — đồng bộ kéo thả Kanban, tạo Task lẻ/hàng loạt, sửa Task Drawer, Checklist & đẩy tín hiệu Chuông thông báo 🔔 Non-Blocking).
- **Cơ sở dữ liệu:** Supabase PostgreSQL Cloud (`ap-south-1` — kết nối qua IPv4 Pooler `6543`).
- **Kho lưu trữ mã nguồn:** GitHub [https://github.com/HuyDdoox/taskmg.git](https://github.com/HuyDdoox/taskmg.git).
