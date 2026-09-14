# Kế hoạch: Xuất toàn bộ code AI VNVoice Kid để tự phát triển

## Mục tiêu
Cung cấp đường dẫn và các bước rõ ràng để bạn tải toàn bộ codebase của dự án AI VNVoice Kid về máy, chạy local và tự chỉnh sửa.

## Các bước thực hiện

### 1. Xuất codebase khỏi Lovable
```text
Cách khuyên dùng: đồng bộ GitHub
- Trong Lovable, bấm nút "+" ở góc dưới bên trái khung chat.
- Chọn GitHub -> Connect project.
- Liên kết tài khoản GitHub của bạn và tạo repository mới.
- Sau khi đồng bộ, bạn sẽ có URL repo trên GitHub, có thể clone về máy.

Cách thay thế: tải trực tiếp từ Code Editor
- Chuyển sang Code Editor (góc trên bên trái).
- Chọn Download codebase (nếu có sẵn trong giao diện) hoặc copy từng file.
```

### 2. Clone và chạy local
```text
Sau khi có repo GitHub:
- git clone <URL_REPO>
- cd <TEN_REPO>
- Cài dependencies: bun install hoặc npm install
- Chạy dev server: bun run dev hoặc npm run dev (mặc định http://localhost:8080)
```

### 3. Lấy biến môi trường cần thiết
```text
Dự án dùng Lovable Cloud (backend Supabase). Bạn cần các giá trị sau trong file .env hoặc .env.local:
- VITE_SUPABASE_URL
- VITE_SUPABASE_PUBLISHABLE_KEY (anon key)
- VITE_SUPABASE_PROJECT_ID

Các giá trị này hiện có trong file .env của dự án trên Lovable.
Không dùng service_role_key hoặc database password vì Lovable Cloud không cung cấp.
Nếu tự triển khai backend bên ngoài, bạn phải tạo lại database, auth và storage tương ứng.
```

### 4. Cấu trúc code quan trọng cần nắm
```text
src/routes/               - Định nghĩa trang: board, dashboard, auth, app
src/components/           - Các thành phần UI: thẻ AAC, panel gợi ý, nút SOS, dialog...
src/lib/                  - Logic chính:
  scaffolding.ts          - AI gợi ý câu tiến tiến (4 mức)
  vi-grammar.ts           - Sắp xếp từ theo ngữ pháp tiếng Việt
  smart-grid.ts           - Ưu tiên thẻ theo thời gian, địa điểm, thói quen
  context-memory.ts       - Lưu địa điểm và ngữ cảnh của trẻ
  theme.ts                - Bảng màu và preset giao diện
  tts.ts                  - Giọng đọc Web Speech API tiếng Việt
  image-bg.ts             - Tách nền ảnh thẻ
  audio-trim.ts           - Cắt khoảng lặng ghi âm
supabase/migrations/      - Schema database, RLS policies, seed dữ liệu
```

### 5. Kiểm tra sau khi chạy local
```text
- Trang chủ hiện danh sách hồ sơ trẻ.
- Vào board của một trẻ: hiển thị lưới thẻ, thanh câu, nút Nghe, nút SOS.
- Bấm một thẻ: panel AI giàn giáo hiện gợi ý.
- Chế độ trẻ mặc định bật; giữ nút khoá để về phụ huynh.
- Thêm thẻ mới bằng upload ảnh hoặc paste.
```

## Lưu ý
- Nếu bạn rời hoàn toàn khỏi Lovable Cloud, cần tự cài backend (Supabase hoặc tương đương) và sửa các file trong src/integrations/supabase/ cho đúng endpoint/key.
- TTS hiện tại dùng Web Speech API của trình duyệt, không cần API key riêng.
- Giọng phụ huynh lưu dưới dạng file audio trên storage; tính năng này cần storage bucket `card-audio` với policy phù hợp.
