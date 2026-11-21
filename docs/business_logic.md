# TÀI LIỆU ĐẶC TẢ NGHIỆP VỤ (BUSINESS ANALYSIS - BA & SRS)

> **Dự án:** Website Quản lý Công việc & Dự án (Task Management - Chuẩn Jira thu nhỏ)  
> **Chủ nhiệm dự án (PO / PM):** Sếp  
> **Tài liệu đối chiếu:** `docs/business_logic.md`  
> **Quy định:** Bắt buộc đối chiếu tài liệu này trước khi lập trình hoặc thay đổi tính năng.

---

## 1. TỔNG QUAN HỆ THỐNG & ĐỐI TƯỢNG NGƯỜI DÙNG

Hệ thống cung cấp giải pháp quản lý công việc và dự án tinh gọn theo chuẩn Jira, hỗ trợ làm việc cộng tác thời gian thực thông qua bảng Kanban kéo thả, kênh chat trao đổi và hệ thống gửi email thông báo tự động.

### Phân quyền người dùng (RBAC Matrix):
| Quyền hạn | Admin (Chủ sở hữu) | Project Manager (PM) | Member (Thành viên) | Viewer (Khách) |
| :--- | :---: | :---: | :---: | :---: |
| Tạo / Xóa Dự án | ✅ | ❌ | ❌ | ❌ |
| Tạo Giai đoạn (Milestone) | ✅ | ✅ | ❌ | ❌ |
| Tạo / Giao Task cho người khác | ✅ | ✅ | ✅ (Chỉ trong dự án) | ❌ |
| Đổi trạng thái kéo thả Kanban | ✅ | ✅ | ✅ (Task được gán) | ❌ |
| Tích chọn Action Checklist | ✅ | ✅ | ✅ | ❌ |
| Tham gia Chat Kênh dự án | ✅ | ✅ | ✅ | ✅ (Chỉ đọc) |

---

## 2. ĐẶC TẢ CHI TIẾT 4 PHÂN HỆ CỐT LÕI

### Phân hệ 1: Quản lý Dự Án & Giai Đoạn (Projects & Milestones)
- **Tạo Dự Án:**
  - `name`: Tên dự án (Bắt buộc, 3 - 100 ký tự).
  - `project_key`: Mã tiền tố viết tắt (In hoa, 2 - 5 ký tự, ví dụ `TASK`, `PROJ`). Dùng để tự sinh mã định danh task con (`#TASK-1`, `#TASK-2`...).
  - `description`: Bối cảnh và mục tiêu dự án.
- **Phân chia Giai đoạn (Milestones / Sprints):**
  - Giúp chia nhỏ dự án lớn thành các chặng: `UPCOMING` (Sắp tới) ➔ `IN_PROGRESS` (Đang chạy) ➔ `COMPLETED` (Đã xong).
  - Mỗi Task có thể gắn vào 1 Milestone. Bảng Kanban hỗ trợ bộ lọc nhanh theo từng Giai đoạn để không bị ngợp thông tin.

### Phân hệ 2: Quản lý Task Chuẩn Jira (Jira-style Task Management)
- **Cấu trúc Định danh & Phân loại:**
  - `task_number`: Số tự tăng theo dự án (`#1, #2, #3...`).
  - `issue_key`: Mã duy nhất kết hợp giữa Key và Number (`TASK-1`, `TASK-2`...).
  - `issue_type`: 🟢 `TASK` (Công việc) | 🔵 `STORY` (Tính năng) | 🔴 `BUG` (Lỗi) | 🟣 `SUBTASK`.
- **Đánh giá Kép (Priority vs Risk Level):**
  - `priority`: Độ khẩn cấp (`LOWEST` | `LOW` | `MEDIUM` | `HIGH` | `BLOCKER`).
  - `risk_level`: Mức độ rủi ro hệ thống (`LOW` | `MEDIUM` | `HIGH` | `CRITICAL`). Task có mức `CRITICAL` bắt buộc hiển thị icon cảnh báo đỏ.
- **Cấu trúc Nội dung khi Click vào Task (Slide-over Drawer):**
  - **Mô tả công việc (Overview / Job Description):** Trả lời câu hỏi *"Tại sao làm và kết quả kỳ vọng là gì?"*.
  - **Chi tiết việc phải làm (Action Checklist):** Danh sách các bước cụ thể có checkbox tích chọn. Tự động tính tỷ lệ hoàn thành (`0% ➔ 100% progress bar`).
  - **Audit & Timestamps:** `created_at` (Ngày tạo), `updated_at` (Ngày sửa gần nhất), `due_date` (Hạn chót).
  - **Vị trí sắp xếp (`order_index`):** Số thực (Fractional Indexing) để kéo thả chèn giữa 2 task không cần update toàn bảng.

### Phân hệ 3: Bảng Kanban Kéo Thả (Kanban Board View)
- Mặc định gồm 4 cột trạng thái chuẩn:
  1. `To Do` (Cần làm) - Mã màu xám `#6B7280`.
  2. `In Progress` (Đang làm) - Mã màu xanh `#3B82F6`.
  3. `In Review` (Xét duyệt) - Mã màu tím `#8B5CF6`.
  4. `Done` (Hoàn thành) - Mã màu xanh lá `#10B981`.
- **Thao tác Kéo Thả:** Sử dụng thư viện `@dnd-kit`, kéo thẻ chuyển cột hoặc đổi vị trí trong cột mượt mà.
- **Bộ Lọc Nhanh (Quick Filters):**
  - Lọc "Chỉ việc của tôi" (My tasks).
  - Lọc "Rủi ro cao" (Critical / High risk).
  - Lọc "Sắp trễ hạn" (Due soon trong 48h).
  - Lọc theo Giai đoạn (Milestone).
- **Đồng bộ Thời Gian Thực (Realtime Sync):** Bắn sự kiện WebSocket (`TASK_MOVED`) khi có thành viên kéo thẻ để tự động cập nhật màn hình người khác.

### Phân hệ 4: Kênh Chat Trao Đổi & Mail Tự Động
- **Kênh Chat:**
  - Hỗ trợ Chat 1-1 và Chat theo Kênh Dự án (`ChatChannel`).
  - Thảo luận trực tiếp dưới dạng bình luận (Comments) trong từng Task.
- **Gửi Mail Chạy Ngầm (Background Queue):**
  - Kích hoạt gửi email tự động khi:
    1. Thành viên được phân công làm Assignee của một Task mới.
    2. Deadline của Task bị dời hoặc thay đổi.
    3. Task sắp hết hạn trong vòng 24h (Cron reminder).
  - Sử dụng cơ chế hàng đợi bất đồng bộ (Queue/Worker), tuyệt đối không block luồng xử lý API chính. *(Đã loại bỏ Video Meeting)*.

---

## 3. TIÊU CHUẨN HOÀN THÀNH (DEFINITION OF DONE - DoD)
Một tính năng chỉ được xem là hoàn thành khi:
1. Đã được viết code hoàn chỉnh và build không phát sinh lỗi (`npm run build` pass 100%).
2. Đã lưu vết hoạt động vào bảng `ACTIVITY_LOGS`.
3. Đã tự kiểm thử trên ít nhất 2 kịch bản: luồng chuẩn (Happy path) và luồng dữ liệu biên/xấu.
4. Cập nhật tiến độ vào file `docs/tien_do_du_an.md`.
