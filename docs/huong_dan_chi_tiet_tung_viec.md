# BẢNG CHÚ THÍCH CHI TIẾT TỪNG VIỆC ĐÃ LÀM (DỄ HIỂU - CHO NGƯỜI NGOÀI ĐỌC HIỂU NGAY)

> **Dành cho:** Sếp (PO), Giảng viên hướng dẫn, Ban giám khảo chấm đồ án hoặc thành viên mới tham gia dự án.  
> **Nguyên tắc biên soạn:** Diễn đạt bằng ngôn ngữ bình dân, đơn giản, chỉ rõ "Tại sao làm" và "Kết quả là gì".

---

## PHẦN 1: HỆ THỐNG CLOUD LIVE (TẠI SAO KHÔNG DÙNG LOCAL?)

Trước đây khi làm đồ án, sinh viên thường chạy trên máy cá nhân (`localhost:3000`, database cài trên máy). Khi mang máy đi nộp hoặc tắt máy thì website chết, người khác không vào xem được.

👉 **Giải pháp của chúng ta: Chuyển 100% lên Cloud Live:**
1. **Giao diện & API (Vercel):** Đưa code lên Vercel, website tự động có link HTTPS chạy 24/7 trên toàn cầu.
2. **Cơ sở dữ liệu (Supabase):** Thay vì cài MySQL/PostgreSQL nặng máy, dữ liệu lưu trên đám mây Supabase (khu vực Singapore/Mumbai) cực kỳ bảo mật và không bao giờ mất.
3. **Máy chủ Realtime (Render):** Chạy dịch vụ WebSocket độc lập trên Render để giữ kết nối trực tiếp, giúp hai người ở hai đầu cầu kéo task là màn hình tự nhảy.

---

## PHẦN 2: CHÚ THÍCH CHI TIẾT TỪNG VIỆC ĐÃ HOÀN THÀNH

### Việc 1: Thiết Kế & Nạp 10 Bảng Dữ Liệu Lên Supabase (`prisma/schema.prisma`)
- **Tại sao phải làm:** Trước khi xây nhà phải làm móng. Một hệ thống quản lý công việc chuyên nghiệp cần nhiều bảng dữ liệu quan hệ chặt chẽ với nhau.
- **10 bảng gồm những gì:**
  1. `USERS`: Lưu tài khoản người dùng (Sếp, Dev, Tester).
  2. `PROJECTS`: Lưu thông tin dự án (Tên dự án, Mã tiền tố `TASK`).
  3. `PROJECT_MEMBERS`: Phân quyền (Ai là Admin, ai là Member).
  4. `MILESTONES`: Lưu các chặng/giai đoạn (Giai đoạn 1, Giai đoạn 2...).
  5. `KANBAN_COLUMNS`: Lưu 4 cột Kanban (Cần làm, Đang làm, Xét duyệt, Hoàn thành).
  6. `TASKS`: Lưu thông tin từng công việc (Mã TASK-1, Độ ưu tiên, Mức rủi ro, Hạn chót).
  7. `TASK_CHECKLISTS`: Lưu danh sách việc con có ô checkbox tích chọn.
  8. `CHAT_CHANNELS`: Lưu kênh chat dự án.
  9. `MESSAGES`: Lưu từng tin nhắn trò chuyện.
  10. `ACTIVITY_LOGS`: Lưu lịch sử "Ai đã kéo task, lúc mấy giờ".
- **Kết quả:** Đã nạp thành công 7 task mẫu, 3 người dùng và các cột lên CSDL Supabase.

---

### Việc 2: Xây Dựng Bảng Kanban Kéo Thả Ná Ná Jira (`src/components/kanban/KanbanBoard.tsx`)
- **Tại sao phải làm:** Người dùng muốn quản lý trực quan thay vì nhìn danh sách chữ khô khan.
- **Cách làm:**
  - Chia màn hình thành 4 cột trạng thái màu sắc rõ ràng.
  - Người dùng dùng chuột nhấp giữ thẻ và kéo sang cột khác (To Do ➔ Done), hệ thống tự động lưu vị trí mới vào Supabase mà không cần bấm nút Lưu.
  - Cung cấp các nút lọc 1-click: *Chỉ xem việc của mình*, *Chỉ xem việc có nguy cơ rủi ro cao 🔥*, *Chỉ xem việc sắp hết hạn ⏰*.
- **Kết quả:** Trải nghiệm kéo thả mượt mà 60fps, giao diện hiện đại chuẩn Jira.

---

### Việc 3: Tích Hợp Bảng Trượt Phải Chi Tiết Task (`src/components/kanban/TaskDrawer.tsx`)
- **Tại sao phải làm:** Khi xem thẻ nhỏ trên Kanban, người dùng chỉ thấy tiêu đề ngắn. Cần một nơi để đọc chi tiết mô tả và bấm từng bước việc phải làm.
- **Cách làm:**
  - Khi click vào bất kỳ thẻ Task nào, một bảng sẽ **trượt êm ái từ cạnh phải màn hình ra** (không che hết màn hình, không bị load lại trang).
  - Có 2 phần quan trọng:
    1. **Mô tả công việc (Job Overview):** Giải thích mục tiêu của task.
    2. **Chi tiết việc phải làm (Action Checklist):** Các bước cụ thể kèm checkbox. Tích chọn vào đâu thì thanh tiến độ % tự động tăng lên đến đó.
- **Kết quả:** Quản lý tiến độ cực kỳ chi tiết đến từng đầu việc nhỏ.

---

### Việc 4: Lập Trình Kênh Chat Dự Án Thời Gian Thực (`src/components/chat/ChatChannelView.tsx`)
- **Tại sao phải làm:** Thay vì phải mở Zalo/Slack bên ngoài để trao đổi, các thành viên chat trực tiếp ngay trong dự án.
- **Cách làm:**
  - Tích hợp WebSocket (`Socket.io`) kết nối tới máy chủ Render.
  - Khi anh nhắn một tin, tin nhắn lập tức lưu vào bảng `MESSAGES` của Supabase, đồng thời phát sóng (broadcast) cho toàn bộ thành viên khác đang mở web thấy ngay.
- **Kết quả:** Kênh thảo luận nội bộ mượt mà, không bị loãng thông tin.

---

### Việc 5: Quản Lý Giai Đoạn Dự Án (`src/components/milestones/MilestonesView.tsx`)
- **Tại sao phải làm:** Trả lời câu hỏi *"Dự án lớn quá thì quản lý như thế nào để không bị ngợp việc?"*.
- **Cách làm:**
  - Chia dự án thành 3 cột mốc: Giai đoạn 1 (Khung xương), Giai đoạn 2 (Kanban Realtime), Giai đoạn 3 (Chat).
  - Hệ thống tự động đếm xem trong giai đoạn đó có bao nhiêu task, đã xong bao nhiêu task và vẽ thanh % tiến độ.
- **Kết quả:** Sếp hoặc Giảng viên mở tab Giai Đoạn là thấy ngay bức tranh tiến độ dự án đạt bao nhiêu %.

---

### Việc 6: Đóng Gói Toàn Diện & Đồng Bộ Lên GitHub
- Toàn bộ code đã được đẩy lên nhánh chính `main` tại [https://github.com/HuyDdoox/taskmg.git](https://github.com/HuyDdoox/taskmg.git).
- Mỗi khi code có thay đổi, Vercel sẽ tự động build lại trong 30 giây mà không cần người dùng can thiệp thủ công.
