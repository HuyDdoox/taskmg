# KỊCH BẢN & NỘI DUNG SLIDE BÁO CÁO DỰ ÁN: TASKMG WORKSPACE
*(Hành trình Điều phối AI Agent theo Mô hình Software House để Xây dựng, Kiểm thử & Triển khai Hệ thống Quản lý Dự án Chuẩn Jira)*

> **Tài khoản Canva đã kết nối:** `Shop OngTia`  
> **Link Sản phẩm Live:** [https://taskmg-six.vercel.app/](https://taskmg-six.vercel.app/)  
> **Link Backend Realtime Render v2.0:** [https://taskmg-backend.onrender.com/](https://taskmg-backend.onrender.com/)  
> **Kho Mã nguồn GitHub:** [https://github.com/HuyDdoox/taskmg.git](https://github.com/HuyDdoox/taskmg.git)

---

## 📋 PHẦN 1: KHỐI PROMPT COPY-PASTE 1 CHẠM (DÙNG CHO MỌI AI TẠO SLIDE KHÁC NẾU CẦN)

> Anh có thể copy nguyên khung bên dưới dán vào bất kỳ công cụ AI làm slide nào (Gamma.app, Canva Magic Design, ChatGPT, Claude...) nếu muốn sinh thêm phiên bản khác:

```text
Hãy thiết kế cho tôi một bộ Slide thuyết trình chuyên nghiệp gồm 10 trang (tỷ lệ 16:9, ngôn ngữ Tiếng Việt, phong cách Modern Tech màu Xanh Jira #0C66E4 và Đen Slate #1D2125) báo cáo quá trình tôi (đóng vai trò Product Owner / Tech Lead) điều phối AI Agent (đóng vai trò Đội ngũ Kỹ thuật Software House) xây dựng thành công dự án "TaskMG Workspace — Hệ thống Quản lý Dự án & Công việc chuẩn Jira" chạy Live tại https://taskmg-six.vercel.app/.

Cấu trúc bắt buộc gồm 10 Slide sau:
- Slide 1: Trang bìa — TaskMG Workspace: Quản lý Dự án & Công việc chuẩn Jira (Human PO + AI Software House, kiến trúc Vercel + Render v2.0 + Supabase).
- Slide 2: Phương pháp Điều phối AI — Áp dụng Vòng lặp 5 bước Plan & Confirm (1. Khảo sát & Đưa 2-3 Options -> 2. Lắng nghe PO -> 3. Chốt Checklist trước khi code -> 4. Thực thi & Tự sửa lỗi Self-Healing -> 5. Nghiệm thu Proof of Work).
- Slide 3: Quyết định Chiến lược của PO — Tinh gọn phạm vi: Cắt bỏ Video Meeting & Chat rườm rà, bỏ gửi mail OTP chậm chạp, chuyển sang Đăng ký trực tiếp + Link mời 1 lần (/accept-invite) + Chuông thông báo In-App và đồng bộ bộ Icon Font Awesome 6.
- Slide 4: Kiến trúc Tam giác 3 Đám mây (3-Cloud Architecture) — Vercel Fullstack (Next.js 16, Server Actions, Region bom1) + Render Realtime v2.0 (Socket.io Non-Blocking) + Supabase PostgreSQL (IPv4 Pooler cổng 6543).
- Slide 5: Bảo mật Xác thực & Đa Dự Án (/spaces) — Cookie HttpOnly HMAC-SHA256, Whitelist 4 tài khoản Demo @company.com (bảo vệ tài khoản thật), Link mời /accept-invite 1 lần, Dashboard tiến độ % dự án.
- Slide 6: Không gian 5 Góc nhìn Chuẩn Jira — 1. Summary (KPI & Biểu đồ), 2. List (Sort 3 trạng thái trên 7 cột, Filter, Group by), 3. Board (Kéo thả Kanban 4 cột), 4. Timeline (Sprints), 5. Members (Có tính năng Kiểm tra Email đã tạo tài khoản chưa trước khi thêm).
- Slide 7: Quản lý Task Chuyên sâu & Tạo Hàng Loạt — Tạo lẻ, Tạo hàng loạt (Dán danh sách tự động bóc tách tag [STORY]/[BUG]/[TASK] và | [HIGH]/[BLOCKER] + Import file .CSV), Slide-over Task Drawer sửa trực tiếp Tiêu đề/Mô tả/Milestone và Action Checklist nhảy % tiến độ.
- Slide 8: Phân quyền RBAC 4 Vai trò & Thông báo Realtime — ADMIN (Toàn quyền), PM (Quản lý & duyệt Done, không xóa dự án), MEMBER (Chỉ sửa task của mình, bị khóa mục Done 🔒), VIEWER (Chế độ chỉ xem 100%) + Chuông thông báo In-App nhảy số realtime.
- Slide 9: Tối ưu Hiệu năng Cloud & Kiểm thử Tự động E2E bằng AI Browser — Khắc phục lỗi IPv6 Lambda bằng Pooler 6543, kết nối Socket Non-Blocking tránh Render ngủ đông 50s, điều khiển AI Browser Agent tự chạy 20/20 kịch bản QA trên trang Live (Chống IDOR, XSS, tự phát hiện và sửa lỗi UI).
- Slide 10: Kết quả Nghiệm thu Thực tế & Bài học Kinh nghiệm — 20/20 Test Cases PASS 100%, 2 dự án thực tế sống động (Dự án TASK 15 công việc & Dự án Hệ thống Thương Mại Điện Tử OmniShop 10 công việc, 5 thành viên, 3 Sprints, 68 sự kiện Realtime trên Render).
```

---

## 📑 PHẦN 2: NỘI DUNG CHI TIẾT & LỜI THUYẾT TRÌNH (SPEAKER NOTES) TỪNG SLIDE

### Slide 1: Trang Bìa — Tổng Quan Dự Án
- **Tiêu đề chính:** TaskMG Workspace — Quản Lý Dự Án & Công Việc Chuẩn Jira
- **Tiêu đề phụ:** Báo cáo Tiến trình Điều phối AI Agent (Software House Standard) từ Ý tưởng đến Vận hành Thực tế trên Cloud
- **Nội dung chính trên Slide:**
  - 🌐 **Sản phẩm Live:** `https://taskmg-six.vercel.app/`
  - ⚡ **Realtime Server v2.0:** `https://taskmg-backend.onrender.com/`
  - 💻 **GitHub Repository:** `https://github.com/HuyDdoox/taskmg`
  - 👤 **Mô hình thực hiện:** Human Product Owner (Định hướng & Kiểm định) + AI Agent (Kiến trúc, Lập trình & Kiểm thử E2E)
- **Lời dẫn thuyết trình (Speaker Notes):**
  > *"Xin chào mọi người. Hôm nay tôi xin trình bày báo cáo về dự án TaskMG Workspace — hệ thống quản lý dự án và công việc theo chuẩn Jira. Điểm đặc biệt của dự án này là toàn bộ quá trình từ phân tích nghiệp vụ, thiết kế CSDL, lập trình Fullstack, tối ưu đám mây cho tới kiểm thử tự động E2E đều được tôi điều phối thông qua AI Agent theo một quy trình kỹ thuật phần mềm nghiêm ngặt."*

---

### Slide 2: Phương Pháp Điều Phối AI — Vòng Lặp 5 Bước Software House
- **Tiêu đề:** Phương Pháp Điều Phối AI: Vòng Lặp 5 Bước "Plan & Confirm"
- **Nội dung chính trên Slide:**
  1. **Bước 1 — Khảo sát & Đưa Option:** AI bắt buộc đọc tài liệu và code hiện tại, đề xuất 2–3 phương án kèm 1 phương án khuyến nghị (Recommended).
  2. **Bước 2 — Lắng nghe & Điều chỉnh:** Tôi (PO) chọn phương án, bổ sung các yêu cầu nghiệp vụ sát thực tế.
  3. **Bước 3 — Chốt Kế Hoạch (Synthesis Checklist):** AI lập bảng Checklist minh bạch; **tuyệt đối không được tự ý viết code** khi chưa có lệnh duyệt.
  4. **Bước 4 — Thực thi & Tự Chữa Lành (Self-Healing):** AI viết code, tự chạy `npm run build` kiểm tra TypeScript và tự sửa nếu có lỗi.
  5. **Bước 5 — Báo cáo Nghiệm thu (Proof of Work):** Kiểm chứng trên môi trường Live qua kịch bản chuẩn, kịch bản chặn và dữ liệu phá hoại.
- **Lời dẫn thuyết trình (Speaker Notes):**
  > *"Sai lầm phổ biến nhất khi dùng AI lập trình là để AI tự do sinh code dẫn đến lệch nghiệp vụ và vỡ kiến trúc. Để khắc phục, tôi đã áp đặt bộ Quy chuẩn Software House 5 bước bắt buộc: AI phải khảo sát, đưa ra các Option để tôi chọn, lập Checklist chờ tôi duyệt rồi mới được code, và code xong phải tự build kiểm tra mới được báo cáo."*

---

### Slide 3: Quyết Định Chiến Lược — Tinh Gọn Phạm Vi & Tối Ưu Trải Nghiệm
- **Tiêu đề:** Quyết Định Chiến Lược Của PO: Tinh Gọn Để Đạt Tốc Độ Tối Đa
- **Nội dung chính trên Slide:**
  - ✂️ **Cắt bỏ Video Meeting & Kênh Chat rườm rà:** Giảm 40% độ phức tạp hạ tầng, tập trung hoàn toàn vào quản lý tiến độ công việc.
  - ⚡ **Loại bỏ gửi Email OTP chậm chạp:** Thay bằng **Đăng ký trực tiếp**, **Link mời 1 lần (`/accept-invite`)** và **Chuông thông báo In-App 🔔**.
  - 🎨 **Chuẩn hóa Giao diện & Bộ Icon:** Tôi trực tiếp rà soát UI, yêu cầu thay thế toàn bộ icon thô bằng **Font Awesome 6 Free** kết hợp dải màu Gradient hiện đại và ẩn thanh cuộn dư thừa.
  - 🎯 **Mục tiêu cốt lõi:** Mọi thao tác chuyển trang, lọc, sắp xếp và đổi trạng thái phải phản hồi tức thì dưới `200ms`.
- **Lời dẫn thuyết trình (Speaker Notes):**
  > *"Trong quá trình phát triển, tôi đóng vai trò người cầm lái sản phẩm: cái gì làm hệ thống nặng nề hoặc trải nghiệm xấu là tôi yêu cầu cắt bỏ hoặc làm lại ngay. Ví dụ tôi cho cắt bỏ Video Meeting, bỏ xác thực Gmail OTP rườm rà để chuyển sang Link mời 1 lần và Chuông thông báo trực tiếp trong ứng dụng, đồng thời yêu cầu thiết kế lại toàn bộ icon dự án cho thật sắc nét."*

---

### Slide 4: Kiến Trúc Tam Giác 3 Đám Mây (3-Cloud Architecture)
- **Tiêu đề:** Kiến Trúc Tam Giác 3 Đám Mây: Vercel + Render v2.0 + Supabase
- **Nội dung chính trên Slide:**
  - ☁️ **Vercel Production (`bom1`):** Vận hành Fullstack Next.js 16 (App Router, React 19, TypeScript) và toàn bộ tầng xử lý nghiệp vụ Server Actions.
  - 🔄 **Render Web Service (`Realtime v2.0`):** Máy chủ Node.js + Express + Socket.io độc lập xử lý đồng bộ thời gian thực đa thiết bị (`project_<id>` và `user_<id>`).
  - 🗄️ **Supabase PostgreSQL Cloud (`ap-south-1`):** Quản lý CSDL quan hệ qua Prisma ORM với kết nối IPv4 Transaction Pooler (`6543`).
  - 🚀 **CI/CD Tự động 100%:** Mọi bản vá đẩy lên nhánh `main` của GitHub tự động kích hoạt build và deploy đồng thời trên cả Vercel và Render.
- **Lời dẫn thuyết trình (Speaker Notes):**
  > *"Về mặt hạ tầng, tôi yêu cầu vận hành hoàn toàn trên Cloud thật chứ không chỉ chạy dưới máy cá nhân. Hệ thống kết hợp 3 đám mây: Vercel xử lý giao diện và Server Actions, Supabase lưu trữ PostgreSQL, và Render chạy máy chủ Socket.io v2.0 để đồng bộ thời gian thực cũng như mở rộng các tính năng về sau."*

---

### Slide 5: Xác Thực Bảo Mật & Quản Lý Đa Dự Án (`/spaces`)
- **Tiêu đề:** Xác Thực Bảo Mật & Không Gian Đa Dự Án (`/spaces`)
- **Nội dung chính trên Slide:**
  - 🔐 **Bảo mật Phiên (`HttpOnly` HMAC-SHA256):** Mật khẩu băm `scrypt` kèm salt; cookie phiên chống đánh cắp qua XSS và chống sửa đổi.
  - 🛡️ **Whitelist Demo Login:** Chỉ hiển thị đúng 4 tài khoản mẫu `@company.com` trên trang `/login` để test nhanh 4 Role; ẩn và bảo vệ tuyệt đối tài khoản cá nhân thật.
  - 🔗 **Cơ chế Link Mời 1 Lần (`/accept-invite`):** Thành viên mới chưa có tài khoản nhận link riêng (hết hạn sau 24h) để tự đặt mật khẩu và vào thẳng dự án.
  - 📊 **Spaces Dashboard:** Tự gợi ý mã `Project Key` (VD: `TASK`, `OMNI`), tự tạo sẵn 4 cột Kanban + Sprint 1 và hiển thị thanh tiến độ `% Hoàn thành` thực tế.
- **Lời dẫn thuyết trình (Speaker Notes):**
  > *"Ở tầng xác thực, ngoài việc bảo mật bằng Cookie HttpOnly ký số HMAC-SHA256, trong lúc rà soát tôi và AI đã khóa chặt danh sách Demo Login chỉ cho phép 4 tài khoản mẫu @company.com, không để lộ bất kỳ tài khoản người dùng thật nào ra màn hình đăng nhập."*

---

### Slide 6: Không Gian Làm Việc 5 Góc Nhìn Chuẩn Jira (Multi-Views)
- **Tiêu đề:** Không Gian Làm Việc 5 Góc Nhìn Chuẩn Jira
- **Nội dung chính trên Slide:**
  1. 📈 **Summary View:** 4 thẻ KPI tổng quan + biểu đồ phân bổ Trạng thái, Độ ưu tiên và Khối lượng công việc của từng nhân sự.
  2. 📋 **List View:** Bảng công việc hỗ trợ **Sort 3 trạng thái trên cả 7 cột**, Filter theo Avatar/Priority/Milestone, **Group by** (`Status`, `Priority`, `Assignee`) và tạo nhanh Inline `+ Create`.
  3. 🗂️ **Board View (Kanban):** Kéo thả thẻ mượt mà qua 4 cột trạng thái kèm 4 bộ lọc nhanh (*Việc của tôi, Rủi ro cao, Có hạn chót, Giai đoạn*).
  4. 📅 **Timeline View:** Quản lý các Giai đoạn / Sprints (`UPCOMING`, `IN_PROGRESS`, `COMPLETED`) và tiến độ từng chặng.
  5. 👥 **Members View (Có Check Tài Khoản Theo Email):** Tôi yêu cầu bổ sung bước **Kiểm tra Email đã tạo tài khoản chưa** trước khi thêm người (`✅ Đã có tài khoản` / `⚠️ Đã trong dự án` / `❌ Chưa tạo tài khoản`).
- **Lời dẫn thuyết trình (Speaker Notes):**
  > *"Khi đi vào từng dự án, người dùng có đủ 5 góc nhìn chuẩn Jira. Đặc biệt ở tab Members, tôi đã yêu cầu AI bổ sung tính năng kiểm tra Email xem người đó đã tạo tài khoản trên hệ thống chưa trước khi thêm, giúp phân biệt rõ người đã có tài khoản và người mới cần tạo link mời."*

---

### Slide 7: Quản Lý Task Chuyên Sâu & Tạo Danh Sách Task Hàng Loạt
- **Tiêu đề:** Quản Lý Task Chuyên Sâu & Tạo Hàng Loạt (Bulk Create)
- **Nội dung chính trên Slide:**
  - ⚡ **Tạo Task Hàng Loạt qua Dán Danh Sách (Smart Paste):** Dán nhiều dòng cùng lúc, tự động nhận diện và bóc tách nhãn `[STORY]`, `[BUG]`, `[TASK]` ở đầu dòng cùng độ ưu tiên `| [HIGH]`, `| [BLOCKER]`, `| [LOW]` ở cuối dòng.
  - 📄 **Import File `.CSV` (Excel):** Hỗ trợ tải file CSV mẫu và import tới **100 công việc** chỉ trong 1 Transaction CSDL.
  - 📑 **Slide-over Task Drawer:** Bấm sửa trực tiếp **Tiêu đề**, **Mô tả**, **Giai đoạn (Milestone)**, **Assignee**, **Priority**, **Risk Level (`🔥 Critical`)** và **Due Date**.
  - ☑️ **Action Checklist & Activity Logs:** Thêm bước cần làm, xóa mục gõ nhầm, tích chọn tự nhảy thanh tiến độ `0% ➔ 100%` và lưu vết lịch sử thao tác.
- **Lời dẫn thuyết trình (Speaker Notes):**
  > *"Để giải quyết bài toán tạo dự án thực tế có hàng chục đầu việc mà không phải bấm tạo từng cái, tôi đã yêu cầu thêm tính năng Tạo Task Hàng Loạt. Chỉ cần dán một danh sách có gắn thẻ [STORY] hoặc [BUG] kèm mức ưu tiên | [HIGH], hệ thống tự động tách sạch thẻ và phân loại đúng chuẩn Jira."*

---

### Slide 8: Phân Quyền RBAC 4 Vai Trò & Chuông Thông Báo Realtime
- **Tiêu đề:** Ma Trận Phân Quyền RBAC 4 Vai Trò & Thông Báo Realtime
- **Nội dung chính trên Slide:**
  - 👑 **ADMIN (Chủ dự án):** Toàn quyền tạo/xóa dự án, thêm/gỡ thành viên, đổi Role và quản lý mọi công việc.
  - 🎯 **PM (Quản lý dự án):** Thêm thành viên, tạo Sprint, giao việc và chốt duyệt Task sang cột `Hoàn thành (Done)`, nhưng không có quyền xóa dự án.
  - 🛠️ **MEMBER (Thành viên):** Chỉ được đổi trạng thái các Task giao cho mình; **bị khóa cứng mục `Hoàn thành (Done)` (`🔒`)** để bắt buộc đưa qua bước `Chờ duyệt (In Review)`.
  - 👁️ **VIEWER (Khách) & Chuông Thông báo 🔔:** Chế độ `Read-only` 100% (ẩn mọi nút tạo/sửa); Chuông thông báo tự nhảy số đỏ realtime qua **Render Server v2.0** khi được mời vào dự án hoặc giao việc mới.
- **Lời dẫn thuyết trình (Speaker Notes):**
  > *"Hệ thống áp dụng phân quyền RBAC 4 cấp chặt chẽ ở cả giao diện lẫn Server Actions. Ví dụ nhân viên (MEMBER) chỉ được thao tác trên việc của mình và chỉ được chuyển tối đa tới cột Chờ duyệt (In Review), còn mục Hoàn thành (Done) bị khóa ổ khóa để chờ PM hoặc Admin nghiệm thu."*

---

### Slide 9: Tối Ưu Hiệu Năng Cloud & Kiểm Thử Tự Động E2E Bằng AI
- **Tiêu đề:** Tối Ưu Hiệu Năng Cloud & AI Browser Kiểm Thử Tự Động E2E
- **Nội dung chính trên Slide:**
  - 🚀 **Xử lý triệt để độ trễ Cloud:**
    - Tự động chuyển kết nối Supabase sang **IPv4 Transaction Pooler (`6543`)** tương thích 100% với Vercel AWS Lambda.
    - Ghim Region Vercel tại **Mumbai (`bom1`)** sát cạnh CSDL Singapore và gộp truy vấn SQL bằng `Promise.all`.
    - Thiết kế **Socket Non-Blocking** (trì hoãn ngầm `1.2s`) giúp web luôn mở nhanh tức thì kể cả khi Render Free Tier đang khởi động lại.
  - 🤖 **Điều khiển AI Browser Agent chạy E2E trực tiếp trên Live:**
    - Tôi yêu cầu AI tự mở trình duyệt thực thi **20/20 kịch bản QA** ngay trên link Vercel thật.
    - Kiểm thử cả luồng chuẩn, luồng phân quyền RBAC, chống truy cập trái phép **IDOR** qua URL, chống **XSS Injection** và tự động phát hiện, vá lỗi hiển thị (*Self-Healing*).
- **Lời dẫn thuyết trình (Speaker Notes):**
  > *"Không chỉ dừng ở viết code, khi thấy trang web trên Vercel phản hồi chậm, tôi đã yêu cầu AI chẩn đoán và tối ưu từ việc ghim vùng máy chủ, đổi cổng Pooler cho đến kết nối Socket chạy ngầm. Sau đó, tôi yêu cầu AI dùng trình duyệt tự động bấm test trực tiếp toàn bộ 20 kịch bản trên trang Live để tôi quan sát và nghiệm thu."*

---

### Slide 10: Kết Quả Nghiệm Thu Thực Tế & Tổng Kết
- **Tiêu đề:** Kết Quả Nghiệm Thu Thực Tế & Giá Trị Hợp Tác Cùng AI
- **Nội dung chính trên Slide:**
  - ✅ **Chỉ số Kỹ thuật & Chất lượng:** Build Production đạt `1.38s` (`0` lỗi TypeScript), vượt qua **20/20 kịch bản kiểm thử E2E & Bảo mật (PASS 100%)**.
  - 🏢 **2 Dự án Thực tế Đang Vận hành Sống động trên Hệ thống:**
    1. **Dự án `TASK` (Website Quản lý Công việc):** `15` công việc, `4` thành viên (đủ 4 Role), `4` giai đoạn.
    2. **Dự án `OMNI` (Hệ thống Thương Mại Điện Tử OmniShop):** Được AI Browser tạo mới hoàn toàn từ bước đăng ký tài khoản mới với **`10` công việc thực tế**, **`5` thành viên**, **`3` Sprints**, hoàn thành Checklist `100%` và ghi nhận **`68` sự kiện Realtime** trên Render v2.0.
  - 💡 **Kết luận:** AI là một Đội ngũ Kỹ thuật tốc độ cao, nhưng chất lượng sản phẩm cuối cùng phụ thuộc vào **Tư duy Sản phẩm, Kiến trúc và Sự kiểm tra khắt khe của Con người (Product Owner)**.
- **Lời dẫn thuyết trình (Speaker Notes):**
  > *"Kết quả cuối cùng là một hệ thống hoàn chỉnh vận hành 24/7 trên Cloud với 2 dự án mẫu sống động gồm 25 đầu việc thực tế và 68 sự kiện đồng bộ thời gian thực. Qua dự án này, bài học lớn nhất là khi chúng ta có quy trình kiểm soát chặt chẽ và kiểm thử thực tế gắt gao, AI sẽ trở thành một đội ngũ kỹ thuật đắc lực giúp biến ý tưởng thành sản phẩm hoàn chỉnh với tốc độ vượt trội. Xin cảm ơn!"*
