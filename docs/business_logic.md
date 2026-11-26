# TÀI LIỆU ĐẶC TẢ NGHIỆP VỤ (BUSINESS ANALYSIS - BA & SRS)

> **Dự án:** TaskMG Workspace — Hệ thống Quản lý Dự án & Công việc chuẩn Jira  
> **Chủ nhiệm dự án (PO / PM):** Sếp  
> **Link vận hành Live:** [https://taskmg-six.vercel.app/](https://taskmg-six.vercel.app/)  
> **Tài liệu đối chiếu:** `docs/business_logic.md`

---

## 1. TỔNG QUAN HỆ THỐNG & MA TRẬN PHÂN QUYỀN (RBAC)

Hệ thống cung cấp giải pháp quản lý đa dự án (Multi-Project Spaces) và công việc chuẩn Jira với 5 góc nhìn (`Summary`, `List`, `Board`, `Timeline`, `Members`), hỗ trợ tạo task hàng loạt (Paste danh sách & Import `.CSV`), kiểm tra tài khoản tồn tại theo Email, đường dẫn mời thành viên `/accept-invite` và chuông thông báo In-App 🔔.

### Ma trận Phân quyền 4 Vai trò (RBAC Matrix):

| Quyền hạn nghiệp vụ | ADMIN (Chủ dự án) | PM (Quản lý) | MEMBER (Thành viên) | VIEWER (Khách) |
| :--- | :---: | :---: | :---: | :---: |
| Tạo / Xóa Dự án | ✅ | ❌ | ❌ | ❌ |
| Thêm thành viên & Kiểm tra tài khoản theo Email | ✅ | ✅ | ❌ | ❌ |
| Đổi Role (`ADMIN/PM/MEMBER/VIEWER`) & Gỡ thành viên | ✅ | ❌ | ❌ | ❌ |
| Tạo Giai đoạn (Milestones / Sprints) | ✅ | ✅ | ❌ | ❌ |
| Tạo Task lẻ & Tạo Task hàng loạt (Paste / `.CSV`) | ✅ | ✅ | ✅ (Gán cho mình) | ❌ |
| Sửa Priority, Risk Level, Due Date, Milestone, Giao việc người khác | ✅ | ✅ | ❌ | ❌ |
| Đổi trạng thái Task (`To Do` ↔ `In Progress` ↔ `In Review`) | ✅ (Mọi task) | ✅ (Mọi task) | ✅ (Chỉ task của mình) | ❌ |
| Chốt duyệt Task sang cột `Hoàn thành (Done)` | ✅ | ✅ | ❌ (Bị khóa 🔒) | ❌ |
| Thêm / Tích chọn / Xóa mục `Action Checklist` | ✅ | ✅ | ✅ (Chỉ task của mình) | ❌ |

---

## 2. ĐẶC TẢ CHI TIẾT 5 PHÂN HỆ CỐT LÕI

### Phân hệ 1: Xác thực Trực tiếp & Lời mời Thành viên (`/login`, `/accept-invite`)
- **Đăng ký & Đăng nhập trực tiếp:** Băm mật khẩu chuẩn `scrypt` kèm salt ngẫu nhiên, lưu phiên đăng nhập qua Cookie `HttpOnly` ký số `HMAC-SHA256` chống giả mạo.
- **Đăng nhập nhanh Demo (Whitelist Security):** Chỉ cho phép 4 tài khoản mẫu `@company.com` (`ADMIN`, `PM`, `MEMBER`, `VIEWER`) hiển thị trên bảng Demo Login để phục vụ trải nghiệm nhanh; tuyệt đối ẩn và bảo vệ tài khoản người dùng thật.
- **Đường dẫn mời thành viên (`/accept-invite?token=...`):** Khi mời một email chưa tạo tài khoản trên hệ thống, hệ thống sinh token định danh 1 lần (hết hạn sau 24h) để thành viên tự đặt mật khẩu và kích hoạt vào thẳng dự án.

### Phân hệ 2: Quản lý Đa Dự Án (`/spaces`) & Kiểm tra Tài khoản Thành viên (`Members`)
- **Tạo Dự Án:** Tự động gợi ý `projectKey` viết tắt (2–10 ký tự in hoa, chống trùng), tự sinh 4 cột Kanban mặc định và `Sprint 1`.
- **Thẻ Dự Án:** Hiển thị biểu tượng dự án Font Awesome 6 Gradient, thanh tiến độ `% Hoàn thành` tính từ cột `Done / Hoàn thành` và danh sách Avatar viết tắt 2 chữ cái (`SO`, `ND`, `TQ`, `LD`).
- **Kiểm tra tài khoản đã tạo theo Email (`checkUserByEmail`):** Trước khi thêm người vào dự án, hệ thống kiểm tra email trên CSDL:
  - `✅ Đã có tài khoản`: Hiển thị họ tên và cho phép thêm ngay vào dự án.
  - `⚠️ Đã ở trong dự án`: Cảnh báo và chặn thêm trùng.
  - `❌ Chưa tạo tài khoản`: Cảnh báo rõ ràng và gợi ý chuyển sang tab *"+ Tạo & Mời người mới"* để cấp link `/accept-invite`.

### Phân hệ 3: Quản lý Task Chuẩn Jira & Tạo Hàng Loạt (`Single & Bulk Create`)
- **Định danh tự động:** `issueKey` kết hợp `projectKey` và số thứ tự tăng dần (`TASK-1`, `TASK-2`...).
- **Phân loại & Đánh giá kép:**
  - `issueType`: `TASK` | `STORY` | `BUG` | `SUBTASK`.
  - `priority`: `BLOCKER` (Highest) | `HIGH` | `MEDIUM` | `LOW`.
  - `riskLevel`: `LOW` | `MEDIUM` | `HIGH` | `CRITICAL` (Cảnh báo đỏ `🔥 Critical`).
- **Tạo Task Hàng Loạt (`BulkCreateTaskModal`):**
  1. **Dán danh sách (Paste List):** Tự động nhận diện mỗi dòng là 1 task, bóc tách thông minh tiền tố `[BUG]`, `[STORY]`, `[TASK]` và hậu tố `| [HIGH]`, `| [BLOCKER]`, `| [LOW]`.
  2. **Import file `.CSV`:** Hỗ trợ tải file `.CSV` mẫu và import tới 100 công việc trong 1 Transaction CSDL.
- **Slide-over Task Drawer (`TaskDrawer`):**
  - Cho phép sửa trực tiếp **Tiêu đề**, **Mô tả công việc**, **Trạng thái**, **Người làm**, **Giai đoạn (Milestone)**, **Độ ưu tiên**, **Mức rủi ro**, **Hạn chót**.
  - **Action Checklist:** Thêm bước cần làm, tích chọn tự động nhảy thanh tiến độ `0% ➔ 100%`, xóa mục gõ sai và lưu vết `ActivityLog`.

### Phân hệ 4: Đa Góc Nhìn Chuẩn Jira (5 Multi-Views)
1. **Summary View:** 4 thẻ KPI tổng quan, biểu đồ tiến độ theo Trạng thái, Độ ưu tiên và Khối lượng công việc từng thành viên.
2. **List View:** Bảng danh sách công việc hỗ trợ **Sort 3 trạng thái trên cả 7 cột**, Filter theo Avatar/Priority/Milestone, **Group by** (`Status`, `Priority`, `Assignee`), tìm kiếm tức thì và tạo nhanh inline `+ Create`.
3. **Board View:** Bảng Kanban kéo thả 4 cột (`To Do`, `In Progress`, `In Review`, `Done`) kèm bộ lọc nhanh (*Việc của tôi, Rủi ro cao, Có hạn chót, Lọc giai đoạn*).
4. **Timeline View:** Quản lý tiến độ theo từng Giai đoạn / Sprint (`UPCOMING`, `IN_PROGRESS`, `COMPLETED`).
5. **Members View:** Quản lý nhân sự dự án, kiểm tra tài khoản theo Email và phân quyền.

### Phân hệ 5: Thông báo In-App 🔔 & Giao diện Sáng/Tối
- **Chuông thông báo (`NotificationBell`):** Tự động bắn thông báo khi được mời vào dự án, được giao task mới, task chuyển sang `Chờ duyệt (In Review)` hoặc thay đổi hạn chót. Hỗ trợ lọc *Tất cả / Chưa đọc* và *Đọc tất cả*.
- **Theme & Responsive:** Chuyển đổi mượt mà giữa **Dark Mode** (Jira Dark) và **Light Mode**, ẩn thanh cuộn thô và tương thích hoàn toàn trên cả Desktop lẫn Mobile (`390px`).
