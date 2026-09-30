const express = require('express');
const cors = require('cors');
const path = require('path');
const QRCode = require('qrcode');
const store = require('./data/store');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// ================= HỆ THỐNG XÁC THỰC ADMIN ================= //

// Tài khoản Admin mặc định (trong thực tế nên lưu DB + mã hóa bcrypt)
const ADMIN_ACCOUNTS = [
  { username: 'admin', password: 'admin123', role: 'admin', fullName: 'Quản trị viên Shinzxe' }
];

// Bộ lưu trữ token phiên đăng nhập (in-memory)
const activeSessions = new Map();

// Hàm sinh token ngẫu nhiên
function generateToken() {
  return 'tk-' + Date.now().toString(36) + '-' + Math.random().toString(36).substring(2, 12);
}

// Middleware kiểm tra quyền Admin — chặn truy cập trái phép
function requireAdmin(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Bạn chưa đăng nhập! Vui lòng đăng nhập tài khoản Admin.' });
  }
  const token = authHeader.split(' ')[1];
  const session = activeSessions.get(token);
  if (!session) {
    return res.status(401).json({ success: false, message: 'Phiên đăng nhập đã hết hạn hoặc không hợp lệ. Vui lòng đăng nhập lại.' });
  }
  req.adminUser = session;
  next();
}

// API Đăng nhập Admin
app.post('/api/admin/login', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ success: false, message: 'Vui lòng nhập đầy đủ tên đăng nhập và mật khẩu!' });
  }
  const account = ADMIN_ACCOUNTS.find(
    a => a.username === username.trim() && a.password === password
  );
  if (!account) {
    return res.status(401).json({ success: false, message: 'Sai tên đăng nhập hoặc mật khẩu! Vui lòng thử lại.' });
  }
  const token = generateToken();
  activeSessions.set(token, { username: account.username, role: account.role, fullName: account.fullName });
  res.json({
    success: true,
    message: `Xin chào, ${account.fullName}! Đăng nhập thành công.`,
    data: { token, fullName: account.fullName, role: account.role }
  });
});

// API Đăng xuất Admin
app.post('/api/admin/logout', (req, res) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    activeSessions.delete(authHeader.split(' ')[1]);
  }
  res.json({ success: true, message: 'Đăng xuất thành công!' });
});

// API Kiểm tra phiên đăng nhập còn hiệu lực
app.get('/api/admin/me', requireAdmin, (req, res) => {
  res.json({ success: true, data: req.adminUser });
});

// ================= API ENDPOINTS ================= //

// 1. Lấy danh mục dịch vụ
app.get('/api/categories', (req, res) => {
  res.json({ success: true, data: store.getCategories() });
});

// 2. Lấy danh sách dịch vụ (hỗ trợ lọc theo danh mục)
app.get('/api/services', (req, res) => {
  let services = store.getServices();
  const categoryId = req.query.category;
  if (categoryId && categoryId !== 'all') {
    services = services.filter(s => s.categoryId === parseInt(categoryId));
  }
  res.json({ success: true, data: services });
});

// Thêm dịch vụ mới (Admin - Yêu cầu đăng nhập)
app.post('/api/services', requireAdmin, (req, res) => {
  const { name, categoryId, price, duration, image, description } = req.body;
  if (!name || !price) {
    return res.status(400).json({ success: false, message: 'Vui lòng điền đầy đủ tên và giá dịch vụ!' });
  }
  const created = store.createService({ name, categoryId, price, duration, image, description });
  res.json({ success: true, data: created, message: 'Thêm dịch vụ mới thành công!' });
});

// Xóa dịch vụ (Admin - Yêu cầu đăng nhập)
app.delete('/api/services/:id', requireAdmin, (req, res) => {
  store.deleteService(req.params.id);
  res.json({ success: true, message: 'Đã xóa dịch vụ thành công!' });
});

// 3. Lấy danh sách chuyên viên / nhân viên
app.get('/api/staff', (req, res) => {
  res.json({ success: true, data: store.getStaff() });
});

// 4. Lấy khung giờ còn trống (Time-slot availability)
app.get('/api/slots', (req, res) => {
  const { date, staffId } = req.query;
  if (!date) {
    return res.status(400).json({ success: false, message: 'Vui lòng cung cấp ngày hẹn!' });
  }
  const slots = store.getAvailableSlots(date, staffId);
  res.json({ success: true, data: slots });
});

// 4.1 Kiểm tra và áp dụng mã giảm giá
app.post('/api/coupons/validate', (req, res) => {
  const { code, serviceId } = req.body;
  const result = store.validateCoupon(code, serviceId);
  if (!result.success) {
    return res.status(400).json(result);
  }
  res.json(result);
});

// 5. Đặt lịch mới (Tự động sinh mã QR Base64 trực tiếp)
app.post('/api/bookings', async (req, res) => {
  try {
    const { 
      customerName, 
      customerPhone, 
      customerEmail, 
      serviceId, 
      staffId, 
      date, 
      time, 
      note,
      discountCode,
      discountAmount,
      finalPrice
    } = req.body;
    
    if (!customerName || !customerPhone || !date || !time) {
      return res.status(400).json({ 
        success: false, 
        message: 'Vui lòng điền đầy đủ họ tên, số điện thoại, ngày và giờ hẹn!' 
      });
    }

    const booking = store.createBooking({
      customerName,
      customerPhone,
      customerEmail,
      serviceId,
      staffId,
      date,
      time,
      note,
      discountCode,
      discountAmount,
      finalPrice
    });

    // Tạo mã QR Code dạng Data URL (Base64) chứa thông tin Check-in
    const qrData = JSON.stringify({
      code: booking.bookingCode,
      name: booking.customerName,
      service: booking.serviceName,
      time: `${booking.time} ${booking.date}`
    });
    
    const qrCodeUrl = await QRCode.toDataURL(qrData, {
      width: 280,
      margin: 2,
      color: {
        dark: '#0f382c',
        light: '#ffffff'
      }
    });

    res.json({
      success: true,
      message: 'Đặt lịch thành công! Hệ thống đã gửi email xác nhận.',
      data: {
        ...booking,
        qrCode: qrCodeUrl
      }
    });
  } catch (error) {
    console.error('Error creating booking:', error);
    res.status(500).json({ success: false, message: 'Đã có lỗi xảy ra khi tạo lịch hẹn!' });
  }
});

// 6. Tra cứu lịch hẹn của khách theo SĐT hoặc Mã đặt chỗ
app.get('/api/bookings/lookup', async (req, res) => {
  const { query } = req.query;
  if (!query) {
    return res.status(400).json({ success: false, message: 'Vui lòng nhập mã hoặc số điện thoại!' });
  }
  const results = store.lookupBooking(query);
  
  // Kèm theo mã QR cho mỗi lịch tìm thấy
  const enriched = await Promise.all(results.map(async (b) => {
    const qrData = JSON.stringify({
      code: b.bookingCode,
      name: b.customerName,
      time: `${b.time} ${b.date}`
    });
    const qrCode = await QRCode.toDataURL(qrData, { width: 220, margin: 1 });
    return { ...b, qrCode };
  }));

  res.json({ success: true, data: enriched });
});

// 7. Lấy danh sách tất cả lịch hẹn (cho Admin - Yêu cầu đăng nhập)
app.get('/api/bookings', requireAdmin, (req, res) => {
  const { status, date } = req.query;
  const data = store.readData();
  let list = data.bookings || [];

  if (status && status !== 'all') {
    list = list.filter(b => b.status === status);
  }
  if (date) {
    list = list.filter(b => b.date === date);
  }
  res.json({ success: true, data: list });
});

// 8. Cập nhật trạng thái lịch hẹn (Admin - Yêu cầu đăng nhập)
app.patch('/api/bookings/:id/status', requireAdmin, (req, res) => {
  const { status } = req.body;
  const updated = store.updateBookingStatus(req.params.id, status);
  if (!updated) {
    return res.status(404).json({ success: false, message: 'Không tìm thấy lịch hẹn!' });
  }
  res.json({ success: true, data: updated, message: 'Cập nhật trạng thái thành công!' });
});

// 9. Check-in nhanh bằng mã QR / Mã code (Admin - Yêu cầu đăng nhập)
app.post('/api/bookings/checkin', requireAdmin, (req, res) => {
  const { bookingCode } = req.body;
  if (!bookingCode) {
    return res.status(400).json({ success: false, message: 'Vui lòng nhập mã đặt chỗ!' });
  }
  const result = store.checkInByCode(bookingCode);
  res.json(result);
});

// 10. Lấy thống kê Dashboard cho Admin (Yêu cầu đăng nhập)
app.get('/api/dashboard/stats', requireAdmin, (req, res) => {
  const stats = store.getDashboardStats();
  res.json({ success: true, data: stats });
});

// 11. Đánh giá (Reviews)
app.get('/api/reviews', (req, res) => {
  res.json({ success: true, data: store.getReviews() });
});

app.post('/api/reviews', (req, res) => {
  const { customerName, serviceName, rating, comment } = req.body;
  if (!comment) {
    return res.status(400).json({ success: false, message: 'Vui lòng nhập nội dung đánh giá!' });
  }
  const created = store.addReview({ customerName, serviceName, rating, comment });
  res.json({ success: true, data: created, message: 'Cảm ơn bạn đã gửi đánh giá!' });
});

// 12. Chi tiết dịch vụ & Quy trình 5 bước
app.get('/api/services/:id/detail', (req, res) => {
  const detail = store.getServiceDetails(req.params.id);
  if (!detail) {
    return res.status(404).json({ success: false, message: 'Không tìm thấy dịch vụ này!' });
  }
  res.json({ success: true, data: detail });
});

// 13. Gian hàng sản phẩm (Boutique)
app.get('/api/products', (req, res) => {
  const { category } = req.query;
  const products = store.getProducts(category);
  res.json({ success: true, data: products });
});

app.get('/api/products/:id', (req, res) => {
  const product = store.getProductById(req.params.id);
  if (!product) {
    return res.status(404).json({ success: false, message: 'Không tìm thấy sản phẩm!' });
  }
  res.json({ success: true, data: product });
});

app.post('/api/orders', (req, res) => {
  const { customerName, customerPhone, customerAddress, items, totalAmount, note } = req.body;
  if (!customerName || !customerPhone || !customerAddress || !items || !items.length) {
    return res.status(400).json({ success: false, message: 'Vui lòng điền đầy đủ tên, số điện thoại, địa chỉ và chọn sản phẩm!' });
  }
  const order = store.createOrder({ customerName, customerPhone, customerAddress, items, totalAmount, note });
  res.json({ success: true, data: order, message: `Đặt hàng thành công! Mã đơn: ${order.orderCode}. Nhân viên Shinzxe sẽ liên hệ giao hàng sớm nhất!` });
});

// 14. Hệ thống Thành viên VIP (Member Privilege Club)
app.post('/api/member/login', (req, res) => {
  const { account, password } = req.body;
  if (!account || !password) {
    return res.status(400).json({ success: false, message: 'Vui lòng nhập tài khoản và mật khẩu!' });
  }
  const result = store.memberLogin(account, password);
  res.json(result);
});

app.post('/api/member/register', (req, res) => {
  const { name, phone, email, password } = req.body;
  if (!name || !phone || !email) {
    return res.status(400).json({ success: false, message: 'Vui lòng điền đủ tên, số điện thoại và email!' });
  }
  const result = store.memberRegister({ name, phone, email, password });
  res.json(result);
});

app.get('/api/member/bookings', (req, res) => {
  const { phone } = req.query;
  if (!phone) return res.json({ success: true, data: [] });
  const list = store.getMemberBookings(phone);
  res.json({ success: true, data: list });
});

// 12. Trợ lý ảo AI Concierge tư vấn thông minh (Smart Assistant)
app.post('/api/ai-chat', async (req, res) => {
  const { message } = req.body;
  if (!message) {
    return res.status(400).json({ success: false, reply: 'Bạn cần hỗ trợ tư vấn dịch vụ gì ạ?' });
  }

  const userText = message.toLowerCase().trim();
  const services = store.getServices();

  // Kịch bản AI tư vấn chuyên nghiệp, phản hồi tự nhiên theo phong cách Spa cao cấp
  let reply = "";
  let suggestedServiceId = null;

  if (userText.includes("mụn") || userText.includes("nhân mụn") || userText.includes("viêm da")) {
    reply = "Chào bạn! Nếu bạn đang gặp tình trạng mụn hoặc bít tắc lỗ chân lông, chuyên gia Shinzxe khuyên bạn nên chọn **Trị liệu Mụn Chuyên sâu & Kháng khuẩn Ánh sáng (550.000đ)**. Liệu trình chuẩn y khoa kết hợp diệt khuẩn bằng tia Plasma lạnh sẽ giúp làm xẹp ổ viêm nhanh chóng và không để lại thâm sẹo ạ!";
    suggestedServiceId = 3;
  } else if (userText.includes("da khô") || userText.includes("sạm") || userText.includes("lão hóa") || userText.includes("trẻ hóa") || userText.includes("căng bóng")) {
    reply = "Dạ chào bạn! Để phục hồi độ ẩm và độ đàn hồi cho da, liệu trình **Trẻ hóa Da Căng bóng Collagen (750.000đ)** hoặc **Hydro-Facial Oxy Tươi (450.000đ)** là lựa chọn hoàn hảo nhất. Tinh chất collagen tươi sẽ được điện di lạnh thẩm thấu sâu, mang lại làn da căng mướt ngay sau 60 phút!";
    suggestedServiceId = 2;
  } else if (userText.includes("mỏi") || userText.includes("vai gáy") || userText.includes("văn phòng") || userText.includes("đau lưng")) {
    reply = "Chào bạn! Tình trạng căng cơ mỏi cổ vai gáy do ngồi làm việc nhiều rất phổ biến. Bạn nên trải nghiệm gói **Trị liệu Cổ Vai Gáy & Giảm Đau Cột Sống (380.000đ / 45 phút)** do Master Trần Anh Vũ trực tiếp bấm huyệt giải cơ, đảm bảo nhẹ nhõm ngay sau buổi đầu tiên ạ!";
    suggestedServiceId = 5;
  } else if (userText.includes("massage") || userText.includes("thư giãn") || userText.includes("body") || userText.includes("mệt")) {
    reply = "Dạ, để giải tỏa áp lực và ngủ sâu giấc hơn, gói **Massage Toàn thân Đá nóng Thụy Điển (520.000đ / 60 phút)** với tinh dầu thảo mộc lavender thiên nhiên là dịch vụ được khách hàng yêu thích nhất tại Shinzxe Spa ạ!";
    suggestedServiceId = 4;
  } else if (userText.includes("tóc") || userText.includes("gội") || userText.includes("dưỡng sinh")) {
    reply = "Chào bạn! Tiệm có dịch vụ **Gội đầu Dưỡng sinh Hoàng Gia & Tạo kiểu (300.000đ)** nấu từ bồ kết tươi thảo dược, kết hợp bấm huyệt vùng đầu rất thư giãn, hoặc **Phục hồi Keratin Nano (680.000đ)** cho tóc hư tổn ạ!";
    suggestedServiceId = 6;
  } else if (userText.includes("giá") || userText.includes("bảng giá") || userText.includes("bao nhiêu tiền")) {
    reply = "Dạ bảng giá dịch vụ tại Shinzxe Spa dao động từ **300.000đ - 750.000đ** tùy theo gói chăm sóc da, massage trị liệu hay phục hồi tóc. Bạn có thể nhấn trực tiếp vào nút 'Đặt lịch ngay' ở mỗi dịch vụ để xem chi tiết thời gian và chi phí nhé!";
  } else if (userText.includes("giờ mở cửa") || userText.includes("địa chỉ") || userText.includes("ở đâu")) {
    reply = "Shinzxe Wellness & Beauty mở cửa phục vụ từ **08:30 đến 20:00 hàng ngày** (cả Thứ 7 & Chủ Nhật) tại địa chỉ: **Tầng 3, Tòa nhà Shinzxe Center, Q.1, TP.HCM**. Bạn vui lòng đặt lịch trước để được phục vụ chu đáo nhất không phải chờ đợi nhé!";
  } else {
    reply = "Xin chào bạn! Mình là Shinzxe AI - Trợ lý tư vấn sắc đẹp & chăm sóc sức khỏe. Bạn đang muốn tìm gói chăm sóc da mặt, massage thư giãn cổ vai gáy, hay phục hồi tóc dưỡng sinh? Hãy chia sẻ nhu cầu, mình sẽ gợi ý gói phù hợp nhất cho bạn nhé!";
  }

  res.json({
    success: true,
    reply,
    suggestedServiceId
  });
});

// Khởi động Server
app.listen(PORT, () => {
  console.log(`\n======================================================`);
  console.log(`  SHINZXE SPA & CLINIC - HỆ THỐNG ĐẶT LỊCH TRỰC TUYẾN`);
  console.log(`======================================================`);
  console.log(`  🌐 Website Khách hàng: http://localhost:${PORT}`);
  console.log(`  ⚙️  Trang Quản trị Admin: http://localhost:${PORT}/admin.html`);
  console.log(`======================================================\n`);
});
