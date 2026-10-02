# BÁO CÁO & ĐỒ ÁN MÔN HỌC: LẬP TRÌNH WEB
# ĐỀ TÀI: HỆ THỐNG ĐẶT LỊCH DỊCH VỤ TRỰC TUYẾN & QUẢN TRỊ THÔNG MINH
**Thương hiệu Demo:** Shinzxe Wellness & Beauty Spa  
**Công nghệ:** Full-stack JavaScript (Node.js, Express, Chart.js, QR Code Generator, RESTful API, Responsive Vanilla CSS/JS)

---

## 1. HƯỚNG DẪN KHỞI CHẠY (QUICK START)

1. Mở cửa sổ dòng lệnh (Terminal / PowerShell) tại thư mục dự án `c:\Users\p\Downloads\ltw`.
2. Khởi động máy chủ:
   ```bash
   node server.js
   ```
3. Truy cập vào trình duyệt:
   * **Trang Khách hàng (Đặt lịch, Tra cứu vé QR, Chatbot AI):** [http://localhost:3000](http://localhost:3000](https://shinzxespa.onrender.com/)
   * **Trang Quản trị Admin (Dashboard biểu đồ, Duyệt lịch, Quét QR Check-in):** 

---

## 2. KIẾN TRÚC HỆ THỐNG & CƠ SỞ DỮ LIỆU

Hệ thống được thiết kế theo mô hình **RESTful Architecture** với cơ sở dữ liệu phi tập trung lưu trữ dạng JSON (tại `data/db.json`), đảm bảo ứng dụng chạy độc lập không phụ thuộc vào việc cấu hình MySQL/MongoDB bên ngoài:

### Các thực thể dữ liệu chính:
1. **Categories (`categories`):** Phân loại dịch vụ (Chăm sóc Da, Massage Trị liệu, Tóc, Nail Care).
2. **Services (`services`):** Tên dịch vụ, giá tiền, thời lượng (phút), mô tả, ảnh đại diện, huy hiệu nổi bật.
3. **Staff (`staff`):** Đội ngũ chuyên gia/bác sĩ, kinh nghiệm, điểm đánh giá 5 sao, ảnh đại diện.
4. **Bookings (`bookings`):** Mã đặt chỗ duy nhất (VD: `LM-8421`), thông tin khách hàng (Tên, SĐT, Email), ngày giờ hẹn, trạng thái (`pending`, `confirmed`, `completed`, `cancelled`), tổng tiền.
5. **Reviews (`reviews`):** Đánh giá trải nghiệm thực tế của khách hàng (1-5 sao).

---

## 3. CÁC TÍNH NĂNG NỔI BẬT GHI ĐIỂM VỚI GIẢNG VIÊN

### 🌟 1. Thuật toán chọn khung giờ thông minh (Time-Slot Picker)
* Hệ thống tự động chia ngày làm việc thành các khung giờ (08:30 - 18:30).
* API `/api/slots?date=...&staffId=...` kiểm tra lịch trùng trong thời gian thực.
* Khung giờ nào đã có khách đặt sẽ tự động bị khóa (Disabled) và hiển thị gạch ngang.

### 🌟 2. Sinh mã QR Code Check-in Tức Thì (Instant QR Ticket)
* Sử dụng thư viện `qrcode` để mã hóa thông tin đặt lịch thành định dạng ảnh Base64.
* Khách hàng có thể lưu vé, in trực tiếp hoặc xem lại bất cứ lúc nào qua tính năng **Tra cứu lịch hẹn**.

### 🌟 3. Check-in Siêu Tốc Cho Lễ Tân (Quick Check-in)
* Tại trang Quản trị (`admin.html`), lễ tân chỉ cần nhập hoặc quét mã `LM-XXXX` là hệ thống tự động đổi trạng thái sang **"Đã hoàn thành"** và cộng dồn vào biểu đồ doanh thu.

### 🌟 4. Biểu đồ Thống kê Trực quan (Chart.js Dashboard)
* **Biểu đồ Cột:** Thống kê doanh thu thực tế phân bổ theo từng loại dịch vụ.
* **Biểu đồ Đường:** Theo dõi xu hướng và số lượng lượt đặt chỗ theo chu kỳ 7 ngày gần nhất.

### 🌟 5. Trợ lý ảo AI Concierge Tư vấn Dịch vụ
* Khung chat nổi ở góc phải màn hình đóng vai trò nhân viên tư vấn spa 24/7.
* Phân tích nhu cầu của khách (da mụn, đau mỏi vai gáy, phục hồi tóc...) để đưa ra lời khuyên chuyên môn kèm nút bấm đặt ngay gói dịch vụ tương ứng.

---

## 4. KỊCH BẢN THUYẾT TRÌNH DEMO (ĐẠT ĐIỂM 10)

1. **Bước 1:** Trình chiếu trang chủ [http://localhost:3000](http://localhost:3000) $\rightarrow$ Nhấn phím `F12` chuyển sang chế độ Mobile để khoe giao diện tương thích 100% với điện thoại di động.
2. **Bước 2:** Bấm vào widget **"✦ Trợ lý AI Tư Vấn"** ở góc phải $\rightarrow$ Hỏi: *"Mình bị đau mỏi vai gáy do làm văn phòng thì nên chọn gói nào?"* $\rightarrow$ AI trả lời và hiển thị nút **"Đặt gói này ngay"**.
3. **Bước 3:** Nhấn nút đặt lịch $\rightarrow$ Chọn ngày mai $\rightarrow$ Chọn khung giờ còn trống (giải thích cho giảng viên về cơ chế disable giờ đã trùng) $\rightarrow$ Điền thông tin $\rightarrow$ Bấm Xác nhận.
4. **Bước 4:** Giao diện hiển thị ngay **Vé hẹn điện tử kèm Mã QR và Mã Code** (VD: `LM-2850`).
5. **Bước 5:** Mở trang Quản trị [http://localhost:3000/admin.html](http://localhost:3000/admin.html) $\rightarrow$ Cho giảng viên thấy cuộc hẹn vừa tạo xuất hiện ngay ở đầu bảng danh sách.
6. **Bước 6:** Nhập mã vừa tạo vào ô **"Quét / Check-in Nhanh Cho Khách"** $\rightarrow$ Bấm Check-in $\rightarrow$ Cuộc hẹn chuyển sang trạng thái "Đã xong" và Biểu đồ Doanh thu lập tức cập nhật số tiền mới!
