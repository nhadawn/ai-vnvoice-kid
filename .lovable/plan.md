# Đề xuất cải thiện AI VNVoice Kid

Sau khi rà soát codebase, tôi nhóm các hướng cải thiện thành 6 mảng chính. Mỗi mảng đều có thể triển khai thành các tính năng cụ thể trong 1-2 lượt chỉnh sửa.

## 1. Trải nghiệm bé (Kid Mode & AAC Board)

- **Chế độ trẻ riêng**: một toggle để ẩn toàn bộ nút quản trị (Thêm thẻ, Sửa/Ghi âm, Báo cáo, Địa điểm, Khoá lưới), chỉ để lại lưới thẻ, thanh câu, nút Nghe và SOS. Giảm nhầm lẫn và tăng tập trung cho bé.
- **Điều chỉnh hiển thị**: cho phụ huynh chọn kích thước thẻ lớn/vừa/nhỏ, số cột lưới, ẩn/hiện chữ dưới ảnh. Phù hợp trẻ ở các giai đoạn khác nhau.
- **Tốc độ đọc theo nhu cầu**: thêm slider tốc độ TTS riêng cho từng hồ sơ trẻ, vì mỗi bé tiếp thu nhịp khác nhau.
- **Phản hồi khi bé bấm**: thêm hiệu ứng âm thanh / rung nhẹ / animation rõ hơn để bé biết thao tác được ghi nhận.

## 2. Trí tuệ giàn giáo (Scaffolding AI)

- **Câu gợi ý thông minh hơn**: cải thiện `buildScaffold` để xử lý tốt hơn các trường hợp đặc thù tiếng Việt (ví dụ: "Con muốn ăn cơm" thay vì chỉ ghép từng từ đơn lẻ).
- **Học từ phản hồi phụ huynh**: hiện tại đã có nút Hữu ích / Bỏ qua, nhưng chưa dùng để điều chỉnh trọng số lâu dài. Có thể lưu tỷ lệ chấp nhận vào bảng `interactions` và dùng làm tín hiệu xếp hạng.
- **Gợi ý đa dạng hơn**: khi bé bỏ qua 1 lần, AI đổi candidate tiếp theo thay vì lặp lại; tránh gợi ý trùng từ đã dùng trong câu hiện tại.
- **Milestone / động viên**: khi bé hoàn thành câu ở mức cao hơn mức quen thuộc, hiện animation + âm thanh cổ vũ ngay trên board.

## 3. Khả năng tiếp cận (Accessibility)

- **TTS mạnh mẽ hơn**: Web Speech API trên một số thiết bị di động thiếu giọng vi-VN. Có thể tích hợp dịch vụ TTS cloud (Lovable AI Gateway) hoặc cảnh báo rõ khi thiếu giọng và hướng dẫn cài đặt.
- **Lable alt text**: đảm bảo mọi thẻ ảnh đều có `alt` mô tả để screen reader đọc đúng.
- **Chế độ tương phản cao**: một preset màu dành cho trẻ rối loạn thị giác hoặc khó phân biệt màu.
- **Nút lớn cho người vận động khó khăn**: tăng vùng chạm và khoảng cách giữa các thẻ.

## 4. Dashboard & Phân tích cho phụ huynh

- **Báo cáo có thời gian**: cho phép chọn khoảng thời gian (7 ngày, 30 ngày, toàn bộ) thay vì luôn hiển thị 14 ngày gần nhất.
- **Gợi ý hành động cụ thể**: thay vì chỉ liệt kê insight, dashboard có thể đề xuất "Thêm thẻ động từ", "Luyện cụm chức năng" và link trực tiếp đến chức năng tương ứng.
- **Từ vựng ít dùng**: liệt kê các thẻ bé chưa chạm để phụ huynh biết nên khuyến khích.
- **So sánh tiến triển**: biểu đồ MLU theo tuần/tháng và tỷ lệ chấp nhận gợi ý AI theo thời gian.
- **Xuất báo cáo**: nút in / xuất PDF để đem đến trị liệu ngôn ngữ.

## 5. Quản lý dữ liệu & đồng bộ

- **Đồng bộ địa điểm lên cloud**: hiện tại địa điểm chỉ lưu localStorage. Nếu phụ huynh dùng nhiều thiết bị, địa điểm sẽ mất. Có thể lưu vào bảng `children` hoặc bảng mới trong Lovable Cloud.
- **Backup / khôi phục**: cho phép xuất toàn bộ thẻ, ghi âm, câu đã tạo của trẻ ra file và nhập lại.
- **Xóa mềm (soft delete)**: hiện tại xóa hồ sơ trẻ có undo 8 giây. Có thể bổ sung soft-delete thực sự trong DB để phụ huynh có thể khôi phục sau này từ thùng rác.

## 6. Tạo thẻ & Computer Vision

- **Khôi phục từ vựng có sẵn**: cung cấp thư viện thẻ tiếng Việt chuẩn (gồm cả hình + icon) để phụ huynh không phải tự tạo từ đầu.
- **Cải thiện tách nền**: cho phép chỉnh sửa độ mờ viền (halo) và độ feather sau khi tách nền; thêm xem trước trước khi lưu.
- **Gợi ý từ vựng từ ảnh**: khi chụp ảnh vật thể, AI có thể gợi ý tên tiếng Việt phù hợp (dùng vision model qua Lovable AI Gateway).
- **Import nhiều thẻ cùng lúc**: hỗ trợ CSV/Excel để phụ huynh nhập danh sách từ từ giáo viên.

## Bước tiếp theo đề xuất

1. Chọn 1-2 nhóm ưu tiên nhất để bắt đầu.
2. Với mỗi nhóm, tôi sẽ viết kế hoạch chi tiết gồm: tính năng cụ thể, file cần sửa, và cách kiểm thử.
3. Triển khai từng phần và chạy preview sau mỗi lượt thay đổi.
