# Adaptive Talk Buddy

ĐỀ TÀI: 

Hệ thống AAC thích nghi tích hợp trí tuệ nhân tạo (Adaptive AI-AAC) hỗ trợ giao tiếp và thúc đẩy phát triển ngôn ngữ cho trẻ khiếm khuyết ngôn ngữ.

1. MỤC TIÊU NGHIÊN CỨU (The Core Research)

Xây dựng một hệ thống giao tiếp thông minh không chỉ đóng vai trò "công cụ thay thế" mà còn là "giàn giáo" (Scaffolding) giúp trẻ mở rộng vốn từ và cấu trúc ngữ pháp thông qua thuật toán gợi ý tăng dần theo ngữ cảnh và lịch sử cá nhân.

2. KIẾN TRÚC HỆ THỐNG (Technical Core)

Hệ thống được vận hành dựa trên 3 trụ cột AI cốt lõi:

A. Công cụ Giao tiếp Thích nghi (Adaptive Interface)

Thuật toán Smart Grid: Sử dụng mô hình N-gram kết hợp Time-series Analysis để tối ưu giao diện.

Dự đoán ngữ cảnh: Tự động làm nổi bật (Highlight) các thẻ hình dựa trên thời gian (sáng/trưa/tối) và thói quen lặp lại.

Cơ chế Ghost Buttons: Giữ nguyên vị trí các nút (bảo tồn trí nhớ cơ bắp) nhưng thay đổi kích thước/độ sáng để điều hướng sự chú ý của trẻ mà không gây rối loạn không gian.

Human-in-the-loop: AI tự lùi về chế độ tĩnh nếu dự đoán sai 3 lần liên tiếp để tránh gây ức chế (Frustration) cho trẻ.

B. Công cụ Số hóa và Chụp ảnh Thực tế (Vision AI)

Instant Digitization: Tích hợp mô hình Computer Vision (như MobileNet).

Phụ huynh chụp ảnh vật thể thật → AI tự động tách nền → Phân loại vật thể vào danh mục phù hợp.

Giá trị nghiên cứu: Giảm sự cách biệt giữa biểu tượng (icon) và vật thể thực, giúp trẻ tăng khả năng liên tưởng và khái quát hóa ngôn ngữ.

C. Công cụ Phản hồi Thấu cảm (Affective Computing)

Empathy Voice: Sử dụng Text-to-Speech (TTS) với công nghệ Voice Cloning.

Tái tạo giọng nói của người thân để tạo sự an tâm.

Đa dạng hóa ngữ điệu theo cảm xúc của thẻ (Vui/Buồn/Đau) để trẻ học cách biểu cảm qua giọng nói.

3. THUẬT TOÁN ĐỘC QUYỀN: AI GIÀN GIÁO (Scaffolding AI)

Đây là phần "linh hồn" biến dự án thành một công trình nghiên cứu:

Cơ chế: AI không chỉ dừng lại ở việc giúp trẻ nói một từ đơn. Khi trẻ đạt đến một ngưỡng sử dụng nhất định (Threshold), AI sẽ kích hoạt chế độ Gợi ý ngôn ngữ tăng dần (Progressive Language Suggestion):

Mức 1 (Danh từ): "Sữa".

Mức 2 (Động từ + Danh từ): "Uống" + "Sữa".

Mức 3 (Tính từ + Danh từ): "Sữa" + "Nóng".

Mức 4 (Cụm chức năng): "Con muốn" + "uống sữa".

Mục tiêu: Khảo sát sự thay đổi của chỉ số MLU (Mean Length of Utterance - Chiều dài trung bình câu nói) của trẻ sau một thời gian tương tác với thuật toán gợi ý.

4. HỆ THỐNG PHÂN TÍCH VÀ KẾT NỐI (Parent-Bridge)

AI đóng vai trò "chuyên gia giám sát" thông qua Data-Driven Insights:

Phát hiện mẫu phát triển (Pattern Detection): AI cảnh báo nếu trẻ bị "kẹt" ở danh từ quá lâu mà không tiến triển sang động từ.

Gợi ý tương tác ngoại tuyến (Offline Suggestion): Gửi thông báo cho cha mẹ dựa trên dữ liệu thực: "Bé đang dùng thẻ 'Táo' rất tốt, hãy tạo cơ hội cho bé cầm táo thật và phát âm từ này ngay bây giờ".

5. BẢNG TỔNG KẾT GIÁ TRỊ NGHIÊN CỨU

Tính năng

Phương pháp AI

Ý nghĩa Khoa học/Giáo dục

Smart Grid

N-gram & Time-series

Nghiên cứu tính thích nghi của giao diện với hành vi người dùng đặc biệt.

Instant Digitization

Computer Vision

Ứng dụng nhận diện vật thể để cá nhân hóa dữ liệu học tập.

Scaffolding AI

Reinforcement Learning

Nghiên cứu phương pháp thúc đẩy sự phát triển của ngữ pháp tự động.

Data Analytics

Data Mining

Chuyển đổi dữ liệu tương tác thành báo cáo tiến độ lâm sàng.

6. KẾT LUẬN VỀ TÍNH KHẢ THI & ĐẠO ĐỨC

Tính khả thi: Dự án tận dụng các API sẵn có (Google Vision, FPT TTS, Firebase) để triển khai trên môi trường Mobile/Web với chi phí thấp.

Đạo đức: Cơ chế Human-in-the-loop đảm bảo quyền kiểm soát tối cao thuộc về trẻ và phụ huynh.

Dữ liệu được mã hóa để bảo vệ quyền riêng tư của trẻ em.

Khẳng định vai trò: AI là trợ lý, không thay thế trị liệu viên và sự tương tác giữa người với người.

1. Chiến lược "Smart Grid" (Ô lưới thông minh)

Thay vì một danh sách hình ảnh cố định, AI sẽ làm cho giao diện trở nên "sống".

AI dự đoán (Predictive AAC): Sử dụng thuật toán Markov hoặc mô hình ngôn ngữ nhỏ (N-gram) để đoán từ tiếp theo.

Ví dụ: Nếu trẻ bấm "Con muốn", AI sẽ tự động đẩy các ô "Ăn", "Uống", "Đi chơi" lên hàng đầu và phóng to hơn các ô khác.

Thích nghi theo thời gian (Time-based Adaptation):

Sáng sớm: Ưu tiên thẻ "Đánh răng", "Ăn sáng", "Chào buổi sáng".

Chiều tối: Ưu tiên thẻ "Tắm", "Đi ngủ", "Đọc truyện".

Học máy theo thói quen (Pattern Recognition): Nếu AI nhận thấy cứ sau khi bấm "Ăn", trẻ thường bấm "Xong rồi", nó sẽ học được trình tự này và chuẩn bị sẵn nút "Xong rồi" để trẻ không phải tìm kiếm lâu.

2. Chiến lược "Instant Digitization" (Số hóa tức thời)

Đây là tính năng dùng AI để giải quyết rào cản về việc thiếu hình ảnh thực tế.

Tích hợp Computer Vision (Thị giác máy tính):

Cha mẹ dùng camera điện thoại chụp ảnh một món đồ vật mới (ví dụ: một con gấu bông mới mua).

AI (Sử dụng API như Google Vision hoặc MobileNet) sẽ:

Tự động tách nền (Remove background) để hình ảnh rõ ràng, không gây xao nhãng.

Nhận diện vật thể đó là "gấu bông".

Tự động tạo một thẻ hình mới vào đúng thư mục "Đồ chơi".

Lợi ích: Trẻ được giao tiếp bằng chính những đồ vật thật trong nhà mình, giúp tăng khả năng liên tưởng tốt hơn so với hình vẽ hoạt hình.

3. Chiến lược "Empathy Voice" (Giọng nói thấu cảm)

Khắc phục nhược điểm giọng nói robot khô khan của các app hiện tại.

AI Voice Cloning (Nhân bản giọng nói): Bạn có thể tích hợp API của ElevenLabs hoặc FPT AI.

Cho phép cha mẹ ghi âm khoảng 1 phút giọng nói của họ. AI sẽ tạo ra một bộ đọc có âm sắc giống hệt mẹ hoặc bố.

Khi trẻ bấm nút, máy sẽ phát ra tiếng của mẹ. Điều này tạo cảm giác gần gũi, an toàn và tăng động lực giao tiếp cho trẻ.

Đa dạng ngữ điệu: AI có thể điều chỉnh giọng đọc theo cảm xúc của thẻ hình (ví dụ: thẻ "Vui" giọng sẽ cao và nhanh, thẻ "Đau" giọng sẽ trầm và chậm lại).

4. Chiến lược "Data-Driven Insights" (Phân tích dữ liệu cho cha mẹ)

Đây là phần giúp dự án của bạn có giá trị y khoa/giáo dục.

AI Analytics Dashboard: AI ghi lại mọi tương tác của trẻ và tổng hợp thành biểu đồ:

Biểu đồ nhu cầu: Trẻ quan tâm đến điều gì nhất trong tuần qua? (Thức ăn, đồ chơi hay giao tiếp xã hội).

Biểu đồ thời gian: Trẻ chủ động giao tiếp nhiều nhất vào lúc nào?

Phát hiện bất thường: Nếu bỗng nhiên trẻ bấm nút "Đau" hoặc "Khó chịu" với tần suất cao hơn bình thường, ứng dụng sẽ gửi cảnh báo sớm cho cha mẹ.

1. Nâng tầm nghiên cứu: Từ "Dự đoán" sang "Gợi ý mang tính giáo dục"

Thay vì AI đoán đúng 100% cái trẻ muốn (làm trẻ lười suy nghĩ), hãy biến nó thành AI Giàn giáo (Scaffolding AI).

Vấn đề: Trẻ luôn chọn "Sữa" vì nó nằm ở đầu.

Giải pháp AI Nghiên cứu: Thuật toán Củng cố ngôn ngữ (Language Reinforcement Algorithm).

AI sẽ theo dõi tần suất sử dụng từ. (tần suất lặp lại của một từ, mức độ đa dạng vốn từ, mức độ phức tạp của chuỗi giao tiếp). Nếu trẻ dùng từ "Sữa" quá nhiều, AI sẽ chủ động gợi ý thêm một thẻ Tính từ hoặc Động từ đi kèm (ví dụ: "Sữa ngon", "Sữa nóng", "Uống sữa").

Mục tiêu nghiên cứu: "Tối ưu hóa khả năng mở rộng vốn từ của trẻ thông qua thuật toán gợi ý ngữ pháp tăng dần". Khảo sát liệu thuật toán gợi ý ngôn ngữ tăng dần theo lịch sử sử dụng cá nhân có giúp tăng mức độ đa dạng vốn từ và chiều dài biểu đạt chức năng ở trẻ chậm nói hay không.

Cần được thiết kế theo nguyên tắc tăng dần từng nấc nhỏ, phù hợp với mức phát triển ngôn ngữ thực tế của từng trẻ: 

Mức 1: từ đơn

Mức 2: động từ + danh từ

Mức 3: tính từ + danh từ

Mức 4: cụm chức năng ngắn

2. Giải quyết rủi ro "AI gợi ý sai gây ức chế"

Trẻ chậm nói rất nhạy cảm với sự thất bại. Để AI không làm phiền trẻ, bạn cần cơ chế "Bóng ma" (Ghost Buttons).

Kỹ thuật: Thay vì thay đổi toàn bộ vị trí các nút (khiến trẻ bị loạn), AI chỉ làm nổi bật (Highlight) hoặc phóng to nhẹ những nút nó dự đoán. Các nút khác vẫn nằm ở vị trí cũ (vị trí ghi nhớ cơ bắp - Motor Memory).

Cơ chế xác thực: Nếu AI gợi ý 3 lần mà trẻ không chọn, nó sẽ tự động "lùi bước" và quay về chế độ bảng tĩnh tiêu chuẩn. Đây gọi là "Human-in-the-loop" (Con người kiểm soát AI), một điểm cộng rất lớn trong các báo cáo khoa học.

3. Biến AI thành "Cầu nối" phát triển ngôn ngữ (Thay vì chỉ là công cụ thay thế)

Để thuyết phục ban giám khảo rằng app này giúp trẻ phát triển chứ không phải làm trẻ lười nói:

Tính năng "Gợi ý tương tác cho cha mẹ": Đây là phần AI dành cho người lớn. AI phân tích dữ liệu và nhắn tin cho mẹ: "Hôm nay bé dùng thẻ 'Quả táo' nhiều, mẹ hãy thử cho bé chạm vào quả táo thật và lặp lại từ này nhé!".

AI phát hiện mẫu phát triển ngôn ngữ, không chỉ đếm từ. Ví dụ AI nhận ra:

trẻ dùng nhiều danh từ nhưng gần như không dùng động từ

trẻ chủ yếu giao tiếp để yêu cầu, ít phản hồi

trẻ dùng lặp lại vài từ mà chưa mở rộng

4. Tổng kết các điểm "Nghiên cứu" để bạn đưa vào thuyết trình:

Tính năng

Từ góc độ App tiện ích

Từ góc độ Đề tài Nghiên cứu AI

Gợi ý từ

Giúp trẻ chọn nhanh.

Nghiên cứu mô hình dự đoán nhu cầu dựa trên chuỗi thời gian (Time-series) và ngữ cảnh (Contextual).

Thêm hình bằng Camera

Cho tiện lợi.

Ứng dụng Computer Vision để tự động phân loại và gắn nhãn (Labeling) dữ liệu ngôn ngữ thực tế.

Báo cáo cho cha mẹ

Để biết trẻ làm gì.

Phân tích xu hướng phát triển ngôn ngữ thông qua dữ liệu tương tác (Data Analytics).

Ngoài ra thì thêm một phần để nhập thêm từ mới. Cho giao diện home (tạo tài khoản). Giọng đọc có hai giọng, giọng nữ và nam, người việt nam.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://ai-vnvoice-kid.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/696ca48a-447e-4ea7-82a7-a52238acd4f3).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
