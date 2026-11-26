# HỒ SƠ KỊCH BẢN & BÁO CÁO NGHIỆM THU KIỂM THỬ (QA TEST CASES & REPORT)

> **Dự án:** TaskMG Workspace — Hệ thống Quản lý Dự án & Công việc chuẩn Jira  
> **Môi trường kiểm thử:** Live Cloud Production ([https://taskmg-six.vercel.app/](https://taskmg-six.vercel.app/))  
> **Cơ sở dữ liệu:** Supabase PostgreSQL (`ap-south-1`, IPv4 Pooler `6543`)  
> **Phạm vi:** 6 Phân hệ cốt lõi — 20 Kịch bản Kiểm thử (Happy Path, Edge Cases, Negative & Security RBAC/IDOR/XSS)

---

## 1. MA TRẬN KỊCH BẢN & KẾT QUẢ KIỂM THỬ (20/20 TEST CASES)

### Phân hệ A: Landing Page, Xác thực (Auth) & Lời mời (`/accept-invite`)

| Mã TC | Tên kịch bản | Dữ liệu & Thao tác kiểm thử | Kết quả thực tế | Trạng thái |
| :---: | :--- | :--- | :--- | :---: |
| **TC-01** | Truy cập Landing Page `/` (Static Pre-rendered) | Mở `https://taskmg-six.vercel.app/`, kiểm tra tốc độ tải & nút *Đăng nhập / Đăng ký* | Trang tĩnh tải tức thì (`< 100ms`), các nút CTA hiển thị rõ và mở tab mới (`target="_blank"`). | ✅ **PASS** |
| **TC-02** | Đăng ký tài khoản mới trực tiếp | Nhập Họ tên, Email mới, Mật khẩu `>= 6` ký tự tại `/login?mode=register` | Tạo tài khoản thành công trên Supabase, cấp cookie `HttpOnly` HMAC-SHA256 và chuyển thẳng vào `/spaces`. | ✅ **PASS** |
| **TC-03** | Chặn đăng ký mật khẩu ngắn & trùng Email | 1) Nhập mật khẩu `123` (`< 6` ký tự)<br>2) Nhập email `sep@company.com` đã tồn tại | 1) Chặn gửi, báo lỗi `"Mật khẩu phải từ 6 ký tự trở lên"`<br>2) Chặn tạo trùng, báo lỗi `"Email này đã được đăng ký"`. | ✅ **PASS** |
| **TC-12** | Mời thành viên mới & kích hoạt qua `/accept-invite` | Admin tạo lời mời cho email mới ➔ Mở link `/accept-invite?token=...` ➔ Đặt mật khẩu | Hiển thị đúng tên người được mời, kích hoạt tài khoản thành công và tự động đăng nhập vào dự án. | ✅ **PASS** |
| **TC-13** | Chống dùng lại link mời (`/accept-invite` Replay Block) | Mở lại đúng đường dẫn `/accept-invite?token=...` sau khi đã kích hoạt xong | Token đã bị xóa sau lần dùng đầu tiên; hệ thống chặn và báo link không hợp lệ/đã sử dụng. | ✅ **PASS** |

---

### Phân hệ B: Quản lý Danh sách Dự án (`/spaces`)

| Mã TC | Tên kịch bản | Dữ liệu & Thao tác kiểm thử | Kết quả thực tế | Trạng thái |
| :---: | :--- | :--- | :--- | :---: |
| **TC-04** | Tạo Dự án mới & Tự động gợi ý Project Key | Nhập tên dự án `"QA Live Auto Project"`, kiểm tra mã Key gợi ý và bấm Tạo | Tự động sinh 4 cột Kanban mặc định (`To Do`, `In Progress`, `In Review`, `Done`), `Sprint 1` và gán quyền `ADMIN`. | ✅ **PASS** |
| **TC-04B** | Chặn tạo dự án trùng `Project Key` | Nhập mã Key `TASK` (đã tồn tại trên hệ thống) | Server Action chặn và trả thông báo `"Mã dự án TASK đã tồn tại, hãy chọn mã khác"`. | ✅ **PASS** |
| **TC-04C** | Hiển thị `% Tiến độ hoàn thành` & Avatar chữ cái đầu | Kiểm tra thẻ dự án `TASK` trên `/spaces` có các task ở cột `"Hoàn thành (Done)"` và tên thành viên có ngoặc đơn `(Fullstack)` | Đã vá lỗi so khớp tên cột `Done / Hoàn thành` và loại bỏ hậu tố `(...)` khi tạo Avatar viết tắt (`ND`, `TQ`, `LD`). | ✅ **PASS (Fixed)** |

---

### Phân hệ C: Kiểm tra Tài khoản & Quản lý Thành viên (`Members`)

| Mã TC | Tên kịch bản | Dữ liệu & Thao tác kiểm thử | Kết quả thực tế | Trạng thái |
| :---: | :--- | :--- | :--- | :---: |
| **TC-07** | Kiểm tra Email đã tạo tài khoản chưa trước khi thêm thành viên | Mở modal *Thêm Thành Viên* ➔ Nhập email vào ô **Kiểm tra tài khoản đã tạo theo Email** và bấm *Kiểm tra*: <br>1) Email đã có tài khoản<br>2) Email đã trong dự án<br>3) Email chưa tạo tài khoản | 1) Báo xanh `✅ Đã tìm thấy tài khoản` và tự chọn để thêm ngay<br>2) Báo vàng `⚠️ Đã là thành viên trong dự án`<br>3) Báo đỏ `❌ Email chưa tạo tài khoản trên hệ thống` kèm nút chuyển sang *Tạo & Mời người mới*. | ✅ **PASS** |
| **TC-07B** | Đổi vai trò (Role) & Xóa thành viên khỏi dự án | `ADMIN` đổi Role thành viên từ `MEMBER` ➔ `PM` và gỡ thành viên thử nghiệm | Cập nhật Role tức thì, bắn thông báo In-App `PROJECT_INVITED` cho thành viên được thêm. | ✅ **PASS** |

---

### Phân hệ D: Phân quyền RBAC 4 Vai trò & Bảo mật (IDOR / XSS)

| Mã TC | Tên kịch bản | Dữ liệu & Thao tác kiểm thử | Kết quả thực tế | Trạng thái |
| :---: | :--- | :--- | :--- | :---: |
| **TC-08** | Vai trò `VIEWER` (`designer@company.com`) | Mở dự án `TASK`, kiểm tra toàn bộ nút bấm và dropdown | Chế độ `Read-only` 100%: ẩn nút *Tạo Task / Thêm hàng loạt*, hiện nhãn `👁️ Chế độ chỉ xem (VIEWER)`, khóa mọi ô Status/Priority/Assignee. | ✅ **PASS** |
| **TC-09** | Vai trò `MEMBER` (`deva@company.com`) | 1) Thử đổi Status task của người khác (`TASK-8`)<br>2) Mở menu Status trên task của chính mình (`TASK-4`) | 1) Task của người khác bị khóa (`disabled`)<br>2) Task của mình cho phép chuyển `To Do` ↔ `In Progress` ↔ `Chờ duyệt`, nhưng **khóa mục `Hoàn thành (Done)`**. | ✅ **PASS** |
| **TC-10** | Vai trò `PM` (`tester@company.com`) | Kiểm tra trang `/spaces` (nút Xóa dự án) và quyền trong dự án `TASK` | Không có nút Xóa dự án trên `/spaces`, không sửa được quyền của `ADMIN`, nhưng có toàn quyền tạo/duyệt Task sang `Done`, tạo Milestone và thêm `MEMBER`/`VIEWER`. | ✅ **PASS** |
| **TC-11** | **Chống lỗ hổng IDOR** (Truy cập trái phép qua URL) | Đăng nhập tài khoản người lạ (`qa.outsider@test.com`) ➔ Gõ thẳng URL `/projects/877a6634-2f6f-4f9d-ad22-7aff7e1a411e` | Bị chặn ngay tại Server Component, hiển thị màn hình *"Không thể truy cập Dự án — Bạn không có quyền truy cập dự án này"*. | ✅ **PASS** |
| **TC-18** | **Chống lỗ hổng XSS Injection** | Nhập payload `<script>alert(1)</script>` vào tiêu đề Task / Checklist | React & Server Action escape hoàn toàn, hiển thị dưới dạng văn bản thuần, không thực thi mã độc. | ✅ **PASS** |

---

### Phân hệ E: Quản lý Task, Tạo Hàng Loạt (Bulk Create) & 5 Jira Views

| Mã TC | Tên kịch bản | Dữ liệu & Thao tác kiểm thử | Kết quả thực tế | Trạng thái |
| :---: | :--- | :--- | :--- | :---: |
| **TC-05** | Tạo Task Hàng Loạt qua **Paste danh sách** | Mở *Thêm hàng loạt* ➔ Dán 3 dòng có tiền tố `[BUG]`, `[STORY]` và hậu tố `\| [HIGH]` | Tự động bóc tách đúng loại thẻ (`BUG`, `STORY`, `TASK`) và mức độ ưu tiên (`HIGH`, `MEDIUM`), tạo 3 mã task liên tiếp trong 1 Transaction. | ✅ **PASS** |
| **TC-16** | Tạo Task Hàng Loạt qua **Import file `.CSV`** | Chuyển sang tab *Import file .CSV*, kiểm tra cấu trúc cột & bảng xem trước (Preview) | Hỗ trợ tải file mẫu `.CSV`, bóc tách chuẩn 4 cột (`Title, IssueType, Priority, DueDate`), loại bỏ dòng trống tự động. | ✅ **PASS** |
| **TC-06** | Slide-over Task Drawer & Action Checklist | Mở chi tiết Task ➔ Thêm mục Checklist mới ➔ Tích hoàn thành từng mục ➔ Đổi Status | Thanh tiến độ Checklist nhảy từ `0%` lên `100%` mượt mà, lưu vết vào `ActivityLog`. | ✅ **PASS** |
| **TC-14** | **Tab List:** Sort 7 cột, Filter, Group by & Search | Bấm tiêu đề cột `Work`, `Priority`, `Status` (3 trạng thái), lọc theo Avatar, gom nhóm `Group: Status` | Sắp xếp chính xác tăng/giảm/mặc định, gom nhóm theo từng trạng thái có thể thu gọn/mở rộng. | ✅ **PASS** |
| **TC-15** | **Tab Board, Summary & Timeline** | Chuyển qua lại giữa các tab `Summary`, `Board` Kanban và `Timeline` (Milestones) | Biểu đồ KPI Summary, các cột Kanban và danh sách Giai đoạn (Sprints) đồng bộ dữ liệu 100%. | ✅ **PASS** |

---

### Phân hệ F: Thông báo In-App & Giao diện Responsive

| Mã TC | Tên kịch bản | Dữ liệu & Thao tác kiểm thử | Kết quả thực tế | Trạng thái |
| :---: | :--- | :--- | :--- | :---: |
| **TC-17** | Chuông thông báo In-App 🔔 (`NotificationBell`) | Kiểm tra badge đỏ số lượng thông báo chưa đọc ➔ Mở popover ➔ Bấm *Đọc tất cả* | Hiển thị rõ nội dung thông báo mời dự án/giao việc kèm thời gian, bấm *Đọc tất cả* xóa badge đỏ về `0`. | ✅ **PASS** |
| **TC-19** | Chuyển đổi **Dark / Light Mode** & Responsive Mobile (`390x844`) | Bấm nút Mặt trời/Mặt trăng đổi theme ➔ Thu nhỏ màn hình về kích thước iPhone (`390x844`) | Đổi theme Sáng/Tối tức thì (lưu `localStorage`), giao diện Mobile cuộn ngang bảng List mượt mà, không tràn vỡ khung. | ✅ **PASS** |

---

## 2. CÁC HẠNG MỤC ĐÃ TỰ ĐỘNG KHẮC PHỤC & NÂNG CẤP (SELF-HEALING LOG)

1. **Nâng cấp Kiểm tra tài khoản tồn tại theo Email khi thêm thành viên (`src/app/actions/member-actions.ts`, `src/components/workspace/MembersView.tsx`):**
   - Bổ sung Server Action `checkUserByEmail(projectId, email)` và khung kiểm tra trực tiếp trong Modal *Thêm Thành Viên*.
   - Phân biệt rõ 3 trạng thái: **Đã tạo tài khoản** (`✅` cho phép thêm ngay), **Đã trong dự án** (`⚠️` chặn thêm trùng), và **Chưa tạo tài khoản** (`❌` cảnh báo rõ và gợi ý chuyển sang tạo tài khoản mời kèm link `/accept-invite`).
2. **Sửa lỗi thanh tiến độ dự án hiển thị `0%` trên `/spaces` (`src/components/projects/ProjectsDashboard.tsx`):**
   - Cập nhật bộ lọc cột hoàn thành nhận diện cả tên tiếng Anh lẫn tiếng Việt (`includes('done') || includes('hoàn thành')`).
3. **Sửa lỗi Avatar viết tắt hiển thị ký tự `(` (`src/components/projects/ProjectsDashboard.tsx`, `src/components/workspace/ListView.tsx`, `src/components/workspace/MembersView.tsx`):**
   - Loại bỏ phần chú thích trong ngoặc đơn `(...)` trước khi trích xuất chữ cái đầu của Họ và Tên (`Nguyễn Văn Dev (Fullstack)` ➔ `ND`).
