const fs = require('fs');
const path = require('path');

const DB_FILE = path.join(__dirname, 'db.json');

// Dữ liệu mẫu khởi tạo phong phú phục vụ demo
const initialData = {
  categories: [
    { id: 1, name: "Chăm sóc Da & Điều trị", icon: "sparkles", description: "Liệu trình trẻ hóa, phục hồi và làm sáng da chuyên sâu" },
    { id: 2, name: "Massage & Trị liệu Thư giãn", icon: "heart", description: "Giải tỏa căng thẳng cơ khớp với thảo mộc tự nhiên" },
    { id: 3, name: "Tóc & Tạo mẫu Cao cấp", icon: "scissors", description: "Cắt tạo kiểu, phục hồi keratin và uốn nhuộm thời thượng" },
    { id: 4, name: "Nail Care & Spa Thảo dược", icon: "flower", description: "Chăm sóc móng chuẩn organic và ngâm chân thảo mộc" }
  ],
  services: [
    {
      id: 1,
      categoryId: 1,
      name: "Chăm sóc da Oxy Tươi Hydro-Facial",
      price: 450000,
      duration: 60,
      image: "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&w=600&q=80",
      description: "Làm sạch sâu từng lỗ chân lông bằng áp lực oxy tươi, đẩy lùi sợi bã nhờn và cấp ẩm tức thì.",
      popular: true
    },
    {
      id: 2,
      categoryId: 1,
      name: "Liệu trình Trẻ hóa Da Căng bóng Collagen",
      price: 750000,
      duration: 75,
      image: "https://images.unsplash.com/photo-1512290900672-1f55a153243f?auto=format&fit=crop&w=600&q=80",
      description: "Cấy tinh chất collagen tươi kết hợp điện di lạnh giúp da căng mướt, thu nhỏ chân lông và đàn hồi.",
      popular: true
    },
    {
      id: 3,
      categoryId: 1,
      name: "Trị liệu Mụn Chuyên sâu & Kháng khuẩn Ánh sáng",
      price: 550000,
      duration: 90,
      image: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=600&q=80",
      description: "Lấy nhân mụn chuẩn y khoa, diệt khuẩn bằng tia Plasma lạnh và đắp mặt nạ thảo dược làm dịu.",
      popular: false
    },
    {
      id: 4,
      categoryId: 2,
      name: "Massage Toàn thân Đá nóng Thụy Điển",
      price: 520000,
      duration: 60,
      image: "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?auto=format&fit=crop&w=600&q=80",
      description: "Kết hợp tinh dầu lavender thiên nhiên và đá bazan nóng giúp đả thông kinh lạc, ngủ ngon.",
      popular: true
    },
    {
      id: 5,
      categoryId: 2,
      name: "Trị liệu Cổ Vai Gáy & Giảm Đau Cột sống",
      price: 380000,
      duration: 45,
      image: "https://images.unsplash.com/photo-1600334129128-685c5582fd35?auto=format&fit=crop&w=600&q=80",
      description: "Tập trung khai thông các điểm tắc nghẽn cơ vùng gáy, đặc biệt thích hợp cho người làm việc văn phòng.",
      popular: true
    },
    {
      id: 6,
      categoryId: 3,
      name: "Cắt tạo kiểu & Gội đầu Dưỡng sinh Hoàng Gia",
      price: 300000,
      duration: 60,
      image: "https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=600&q=80",
      description: "Gội đầu bằng nước bồ kết nấu tươi, mát-xa bấm huyệt da đầu, kết hợp sấy tạo mẫu chuyên nghiệp.",
      popular: false
    },
    {
      id: 7,
      categoryId: 3,
      name: "Phục hồi Tóc Chuyên sâu Keratin Nano",
      price: 680000,
      duration: 90,
      image: "https://images.unsplash.com/photo-1562322140-8baeececf3df?auto=format&fit=crop&w=600&q=80",
      description: "Bù đắp protein và độ ẩm cho tóc xơ rối gãy rụng do uốn nhuộm nhiều lần, trả lại mái tóc suôn mượt.",
      popular: false
    },
    {
      id: 8,
      categoryId: 4,
      name: "Combo Spa Chân Thảo mộc & Sơn Gel Cao cấp",
      price: 320000,
      duration: 50,
      image: "https://images.unsplash.com/photo-1519014816548-bf5fe059798b?auto=format&fit=crop&w=600&q=80",
      description: "Ngâm chân muối khoáng gừng sả, tẩy da chết nhẹ nhàng và sơn gel móng tay/chân bền đẹp chuẩn Hàn.",
      popular: false
    }
  ],
  staff: [
    {
      id: 1,
      name: "Elena Nguyễn",
      title: "Chuyên gia Da liễu & Thẩm mỹ",
      experience: "7 năm kinh nghiệm",
      rating: 4.9,
      avatar: "https://images.unsplash.com/photo-1594744803329-e58b31de8bf5?auto=format&fit=crop&w=300&q=80"
    },
    {
      id: 2,
      name: "Trần Anh Vũ",
      title: "Master Trị liệu Cổ vai gáy & Massage",
      experience: "5 năm kinh nghiệm",
      rating: 4.8,
      avatar: "https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&w=300&q=80"
    },
    {
      id: 3,
      name: "Hà My Phạm",
      title: "Chuyên viên Dưỡng sinh & Skincare",
      experience: "4 năm kinh nghiệm",
      rating: 5.0,
      avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=300&q=80"
    },
    {
      id: 4,
      name: "Bảo Long",
      title: "Hair Stylist & Phục hồi tóc",
      experience: "6 năm kinh nghiệm",
      rating: 4.9,
      avatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=300&q=80"
    }
  ],
  bookings: [
    {
      id: 1,
      bookingCode: "LM-8421",
      customerName: "Nguyễn Thu Trang",
      customerPhone: "0912345678",
      customerEmail: "thutrang@gmail.com",
      serviceId: 1,
      serviceName: "Chăm sóc da Oxy Tươi Hydro-Facial",
      staffId: 1,
      staffName: "Elena Nguyễn",
      date: "2026-09-28",
      time: "09:00",
      price: 450000,
      status: "completed",
      note: "Khách da nhạy cảm nhẹ",
      createdAt: "2026-09-27T10:00:00Z"
    },
    {
      id: 2,
      bookingCode: "LM-9032",
      customerName: "Lê Hoàng Quân",
      customerPhone: "0988776655",
      customerEmail: "quan.le@gmail.com",
      serviceId: 4,
      serviceName: "Massage Toàn thân Đá nóng Thụy Điển",
      staffId: 2,
      staffName: "Trần Anh Vũ",
      date: "2026-09-29",
      time: "14:00",
      price: 520000,
      status: "completed",
      note: "Yêu cầu ấn lực mạnh vùng vai",
      createdAt: "2026-09-28T11:15:00Z"
    },
    {
      id: 3,
      bookingCode: "LM-1156",
      customerName: "Đỗ Mai Linh",
      customerPhone: "0905123987",
      customerEmail: "mailinh.do@gmail.com",
      serviceId: 2,
      serviceName: "Liệu trình Trẻ hóa Da Căng bóng Collagen",
      staffId: 3,
      staffName: "Hà My Phạm",
      date: "2026-09-30",
      time: "10:30",
      price: 750000,
      status: "confirmed",
      note: "Khách hẹn đúng giờ",
      createdAt: "2026-09-29T16:20:00Z"
    },
    {
      id: 4,
      bookingCode: "LM-6789",
      customerName: "Phạm Quốc Huy",
      customerPhone: "0934567890",
      customerEmail: "huy.pham@gmail.com",
      serviceId: 5,
      serviceName: "Trị liệu Cổ Vai Gáy & Giảm Đau Cột sống",
      staffId: 2,
      staffName: "Trần Anh Vũ",
      date: "2026-09-30",
      time: "15:00",
      price: 380000,
      status: "pending",
      note: "Đặt qua website",
      createdAt: "2026-09-30T08:00:00Z"
    }
  ],
  reviews: [
    {
      id: 1,
      customerName: "Chị Minh Thư (Hà Nội)",
      serviceName: "Chăm sóc da Oxy Tươi Hydro-Facial",
      rating: 5,
      date: "2 ngày trước",
      comment: "Dịch vụ cực kỳ êm ái, bạn Elena tư vấn rất kỹ về cách chăm sóc da tại nhà. Da làm xong mướt mịn trông thấy!"
    },
    {
      id: 2,
      customerName: "Anh Tuấn Minh",
      serviceName: "Trị liệu Cổ Vai Gáy",
      rating: 5,
      date: "Hôm qua",
      comment: "Dân IT ngồi máy tính nhiều đau ê ẩm vai gáy, đi trị liệu 45 phút về nhẹ hẳn cả người. Rất đáng tiền!"
    },
    {
      id: 3,
      customerName: "Bạn Thảo Vy",
      serviceName: "Cắt tạo kiểu & Gội dưỡng sinh",
      rating: 5,
      date: "Hôm nay",
      comment: "Không gian spa thơm mùi tinh dầu sả chanh thư giãn vô cùng, đặt lịch online nhanh chóng không phải chờ đợi."
    }
  ],
  products: [
    {
      id: 1,
      name: "Tinh Dầu Oải Hương Pháp Hữu Cơ",
      subName: "Organic French Lavender Essential Oil",
      price: 390000,
      originalPrice: 480000,
      volume: "30ml",
      rating: 5.0,
      reviewsCount: 38,
      category: "aroma",
      image: "https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?auto=format&fit=crop&w=500&q=80",
      description: "Chiết xuất 100% từ hoa oải hương Provence Pháp thuần khiết, giúp giải tỏa âu lo, ngủ sâu giấc và cân bằng năng lượng cơ thể.",
      inStock: true
    },
    {
      id: 2,
      name: "Serum Sinh Học Phục Hồi B5 & Multi-HA",
      subName: "Hydra-Repair B5 Ampoule Serum",
      price: 680000,
      originalPrice: 850000,
      volume: "50ml",
      rating: 4.9,
      reviewsCount: 52,
      category: "skincare",
      image: "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=500&q=80",
      description: "Công thức độc quyền kết hợp B5 tinh khiết và 5 phân tử Hyaluronic Acid, cấp ẩm tức thì và tái sinh hàng rào bảo vệ da sau 7 ngày.",
      inStock: true
    },
    {
      id: 3,
      name: "Nến Thơm Trầm Hương & Hoa Hoàng Lan",
      subName: "Botanical Soy Wax Relaxing Candle",
      price: 350000,
      originalPrice: 420000,
      volume: "220g",
      rating: 4.9,
      reviewsCount: 29,
      category: "aroma",
      image: "https://images.unsplash.com/photo-1603006905003-be475563bc59?auto=format&fit=crop&w=500&q=80",
      description: "Làm từ 100% sáp đậu nành thiên nhiên và bấc gỗ, tỏa hương ấm áp của trầm hương cổ thụ và hoàng lan dịu ngọt, thanh lọc không gian.",
      inStock: true
    },
    {
      id: 4,
      name: "Muối Biển Chết Ngâm Chân Thảo Dược",
      subName: "Dead Sea Herbal Mineral Foot Soak",
      price: 250000,
      originalPrice: 300000,
      volume: "500g",
      rating: 4.8,
      reviewsCount: 44,
      category: "wellness",
      image: "https://images.unsplash.com/photo-1515377905703-c4788e51af15?auto=format&fit=crop&w=500&q=80",
      description: "Muối khoáng tự nhiên giàu magie kết hợp gừng già, quế khâu và ngải cứu, hỗ trợ giảm nhức mỏi chân, thúc đẩy tuần hoàn máu.",
      inStock: true
    },
    {
      id: 5,
      name: "Bộ Gội & Xả Dưỡng Sinh Bồ Kết Hà Thủ Ô",
      subName: "Revitalizing Herbal Hair Care Duo",
      price: 450000,
      originalPrice: 560000,
      volume: "Set 2x300ml",
      rating: 5.0,
      reviewsCount: 67,
      category: "haircare",
      image: "https://images.unsplash.com/photo-1535585209827-a15fcdbc4c2d?auto=format&fit=crop&w=500&q=80",
      description: "Chưng cất cô đặc từ bồ kết nướng than hoa, hà thủ ô đỏ và vỏ bưởi da xanh, giúp phục hồi tóc hư tổn, làm phồng chân tóc tự nhiên.",
      inStock: true
    },
    {
      id: 6,
      name: "Mặt Nạ Đất Sét Khoáng Hồng Pháp Thải Độc",
      subName: "French Pink Clay Gentle Detox Mask",
      price: 380000,
      originalPrice: 460000,
      volume: "100ml",
      rating: 4.9,
      reviewsCount: 31,
      category: "skincare",
      image: "https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?auto=format&fit=crop&w=500&q=80",
      description: "Thanh lọc nhẹ nhàng bụi mịn và bã nhờn sâu trong nang lông mà không gây khô căng da, bổ sung khoáng chất làm sáng da hồng hào.",
      inStock: true
    }
  ],
  orders: [],
  members: [
    {
      id: 1,
      name: "Trương Tấn Phát",
      phone: "0901234567",
      email: "member@shinzxe.vn",
      password: "123",
      tier: "Thành Viên Vàng (VIP)",
      points: 450,
      joinDate: "01/2026"
    }
  ]
};

// Đọc dữ liệu từ file JSON, nếu chưa có thì tạo mới
function readData() {
  try {
    if (!fs.existsSync(DB_FILE)) {
      fs.mkdirSync(path.dirname(DB_FILE), { recursive: true });
      fs.writeFileSync(DB_FILE, JSON.stringify(initialData, null, 2), 'utf-8');
      return initialData;
    }
    const raw = fs.readFileSync(DB_FILE, 'utf-8');
    const data = JSON.parse(raw);
    let needUpdate = false;
    if (!data.products || !data.products.length) {
      data.products = initialData.products;
      needUpdate = true;
    }
    if (!data.orders) {
      data.orders = [];
      needUpdate = true;
    }
    if (!data.members || !data.members.length) {
      data.members = initialData.members;
      needUpdate = true;
    }
    if (needUpdate) {
      writeData(data);
    }
    return data;
  } catch (err) {
    console.error('Error reading db.json:', err);
    return initialData;
  }
}

// Lưu dữ liệu vào file JSON
function writeData(data) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error writing db.json:', err);
  }
}

const store = {
  // Lấy danh mục & dịch vụ
  getCategories: () => readData().categories,
  getServices: () => readData().services,
  getStaff: () => readData().staff,
  getReviews: () => readData().reviews,

  // Lấy chi tiết 1 dịch vụ
  getServiceById: (id) => {
    const data = readData();
    return data.services.find(s => s.id === parseInt(id));
  },

  // Lấy danh sách khung giờ khả dụng cho 1 ngày và 1 chuyên viên
  getAvailableSlots: (date, staffId) => {
    const data = readData();
    const allSlots = [
      "08:30", "09:30", "10:30", "11:30",
      "13:30", "14:30", "15:30", "16:30", "17:30", "18:30"
    ];

    // Lọc các lịch đã được đặt trong ngày đó (với chuyên viên đó hoặc bất kỳ)
    const bookedTimes = data.bookings
      .filter(b => b.date === date && b.status !== 'cancelled' && (!staffId || b.staffId === parseInt(staffId)))
      .map(b => b.time);

    return allSlots.map(time => ({
      time,
      isAvailable: !bookedTimes.includes(time)
    }));
  },

  // Tạo đặt lịch mới
  createBooking: (bookingInput) => {
    const data = readData();
    const service = data.services.find(s => s.id === parseInt(bookingInput.serviceId));
    const staff = data.staff.find(s => s.id === parseInt(bookingInput.staffId));

    // Sinh mã ngẫu nhiên dạng LM-XXXX
    const randomCode = 'LM-' + Math.floor(1000 + Math.random() * 9000);

    const newBooking = {
      id: data.bookings.length ? Math.max(...data.bookings.map(b => b.id)) + 1 : 1,
      bookingCode: randomCode,
      customerName: bookingInput.customerName,
      customerPhone: bookingInput.customerPhone,
      customerEmail: bookingInput.customerEmail || 'khachhang@example.com',
      serviceId: service ? service.id : null,
      serviceName: service ? service.name : 'Dịch vụ chọn tại chỗ',
      staffId: staff ? staff.id : null,
      staffName: staff ? staff.name : 'Chuyên viên ngẫu nhiên',
      date: bookingInput.date,
      time: bookingInput.time,
      price: service ? (bookingInput.finalPrice != null ? bookingInput.finalPrice : service.price) : 0,
      originalPrice: service ? service.price : 0,
      discountAmount: bookingInput.discountAmount || 0,
      discountCode: bookingInput.discountCode || null,
      status: 'confirmed', // Tự động xác nhận
      note: bookingInput.note || '',
      createdAt: new Date().toISOString()
    };

    data.bookings.unshift(newBooking);
    writeData(data);
    return newBooking;
  },

  // Kiểm tra & áp dụng mã giảm giá
  validateCoupon: (code, serviceId) => {
    const data = readData();
    const cleanCode = String(code || '').trim().toUpperCase();
    const service = data.services.find(s => s.id === parseInt(serviceId));
    const basePrice = service ? service.price : 0;

    if (!cleanCode) {
      return { success: false, message: 'Vui lòng nhập mã giảm giá!' };
    }

    if (cleanCode === 'SHINZXEVIP10') {
      const discountAmount = Math.round(basePrice * 0.1);
      return {
        success: true,
        code: cleanCode,
        discountType: 'percent',
        percent: 10,
        discountAmount,
        originalPrice: basePrice,
        finalPrice: Math.max(0, basePrice - discountAmount),
        message: 'Áp dụng mã VIP thành công: Giảm 10% tổng hóa đơn!'
      };
    } else if (cleanCode === 'SHINZXE100K') {
      const discountAmount = Math.min(100000, basePrice);
      return {
        success: true,
        code: cleanCode,
        discountType: 'fixed',
        discountAmount,
        originalPrice: basePrice,
        finalPrice: Math.max(0, basePrice - discountAmount),
        message: 'Áp dụng Voucher thành công: Giảm ngay 100.000đ!'
      };
    } else if (cleanCode === 'WELLNESS20') {
      const discountAmount = Math.round(basePrice * 0.2);
      return {
        success: true,
        code: cleanCode,
        discountType: 'percent',
        percent: 20,
        discountAmount,
        originalPrice: basePrice,
        finalPrice: Math.max(0, basePrice - discountAmount),
        message: 'Áp dụng mã Tri Ân thành công: Giảm 20%!'
      };
    }

    return { success: false, message: 'Mã giảm giá không hợp lệ hoặc đã hết hạn!' };
  },

  // Tra cứu lịch theo mã hoặc số điện thoại
  lookupBooking: (codeOrPhone) => {
    const data = readData();
    const query = String(codeOrPhone).trim().toLowerCase();
    return data.bookings.filter(b => 
      b.bookingCode.toLowerCase() === query || 
      b.customerPhone.includes(query)
    );
  },

  // Cập nhật trạng thái lịch hẹn (pending, confirmed, completed, cancelled)
  updateBookingStatus: (id, newStatus) => {
    const data = readData();
    const booking = data.bookings.find(b => b.id === parseInt(id));
    if (booking) {
      booking.status = newStatus;
      writeData(data);
      return booking;
    }
    return null;
  },

  // Check-in nhanh bằng mã QR / mã booking code
  checkInByCode: (bookingCode) => {
    const data = readData();
    const cleanCode = String(bookingCode).trim().toUpperCase();
    const booking = data.bookings.find(b => b.bookingCode.toUpperCase() === cleanCode);
    if (!booking) return { success: false, message: "Không tìm thấy mã lịch hẹn này!" };
    
    if (booking.status === 'cancelled') {
      return { success: false, message: "Lịch hẹn này đã bị hủy trước đó!" };
    }
    
    booking.status = 'completed';
    writeData(data);
    return { success: true, booking, message: `Check-in thành công cho khách: ${booking.customerName}` };
  },

  // Thêm đánh giá mới
  addReview: (review) => {
    const data = readData();
    const newRev = {
      id: data.reviews.length + 1,
      customerName: review.customerName || "Khách hàng ẩn danh",
      serviceName: review.serviceName || "Dịch vụ Spa",
      rating: parseInt(review.rating) || 5,
      date: "Vừa xong",
      comment: review.comment
    };
    data.reviews.unshift(newRev);
    writeData(data);
    return newRev;
  },

  // Thống kê số liệu cho Dashboard Admin (Biểu đồ, tổng doanh thu, tỷ lệ)
  getDashboardStats: () => {
    const data = readData();
    const totalBookings = data.bookings.length;
    const completedBookings = data.bookings.filter(b => b.status === 'completed');
    const totalRevenue = completedBookings.reduce((sum, b) => sum + (b.price || 0), 0);
    const activeStaff = data.staff.length;
    const activeServices = data.services.length;

    // Doanh thu theo loại dịch vụ
    const categoryStats = {};
    data.services.forEach(s => {
      const cat = data.categories.find(c => c.id === s.categoryId);
      const catName = cat ? cat.name : 'Khác';
      if (!categoryStats[catName]) categoryStats[catName] = 0;
    });

    data.bookings.forEach(b => {
      if (b.status === 'completed') {
        const s = data.services.find(srv => srv.id === b.serviceId);
        if (s) {
          const cat = data.categories.find(c => c.id === s.categoryId);
          const catName = cat ? cat.name : 'Khác';
          categoryStats[catName] = (categoryStats[catName] || 0) + (b.price || 0);
        }
      }
    });

    // Số lượt đặt trong 7 ngày gần đây
    const last7Days = [];
    const today = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(today.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const count = data.bookings.filter(b => b.date === dateStr).length;
      last7Days.push({
        date: `${d.getDate()}/${d.getMonth() + 1}`,
        count
      });
    }

    return {
      totalBookings,
      totalCompleted: completedBookings.length,
      totalRevenue,
      activeStaff,
      activeServices,
      categoryStats,
      last7Days,
      recentBookings: data.bookings.slice(0, 8)
    };
  },

  // Thêm dịch vụ mới (cho Admin)
  createService: (serviceData) => {
    const data = readData();
    const newService = {
      id: data.services.length ? Math.max(...data.services.map(s => s.id)) + 1 : 1,
      categoryId: parseInt(serviceData.categoryId) || 1,
      name: serviceData.name,
      price: parseInt(serviceData.price) || 200000,
      duration: parseInt(serviceData.duration) || 60,
      image: serviceData.image || "https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=600&q=80",
      description: serviceData.description || "Dịch vụ chất lượng cao tại Shinzxe Spa",
      popular: false
    };
    data.services.push(newService);
    writeData(data);
    return newService;
  },

  // Xóa dịch vụ
  deleteService: (id) => {
    const data = readData();
    data.services = data.services.filter(s => s.id !== parseInt(id));
    writeData(data);
    return true;
  },

  // ===== GIAN HÀNG SẢN PHẨM (BOUTIQUE) ===== //
  getProducts: (category) => {
    const data = readData();
    let list = data.products || [];
    if (category && category !== 'all') {
      list = list.filter(p => p.category === category);
    }
    return list;
  },

  getProductById: (id) => {
    const data = readData();
    return (data.products || []).find(p => p.id === parseInt(id));
  },

  createOrder: (orderData) => {
    const data = readData();
    const newOrder = {
      id: (data.orders.length ? Math.max(...data.orders.map(o => o.id)) : 0) + 1,
      orderCode: 'OD-' + Math.floor(1000 + Math.random() * 9000),
      customerName: orderData.customerName,
      customerPhone: orderData.customerPhone,
      customerAddress: orderData.customerAddress,
      note: orderData.note || '',
      items: orderData.items || [],
      totalAmount: orderData.totalAmount || 0,
      status: 'pending',
      createdAt: new Date().toISOString()
    };
    data.orders.unshift(newOrder);
    writeData(data);
    return newOrder;
  },

  // ===== CHI TIẾT DỊCH VỤ & QUY TRÌNH 5 BƯỚC ===== //
  getServiceDetails: (id) => {
    const data = readData();
    const service = (data.services || []).find(s => s.id === parseInt(id));
    if (!service) return null;

    const cat = (data.categories || []).find(c => c.id === service.categoryId);

    const protocolSteps = [
      { step: 1, title: "Thăm Khám & Tư Vấn Chuyên Sâu", time: "10 phút", desc: "Soi da quang học vi điểm hoặc phân tích điểm tắc nghẽn cơ thể, lắng nghe mong muốn của quý khách." },
      { step: 2, title: "Khai Mở Giác Quan Bằng Hương Trầm", time: "10 phút", desc: "Rửa sạch bụi mịn, ngâm chân muối khoáng thảo dược và hít thở sâu với tinh dầu oải hương organic." },
      { step: 3, title: "Thực Hiện Kỹ Thuật Trị Liệu Trọng Tâm", time: `${Math.max(25, service.duration - 35)} phút`, desc: "Ứng dụng kỹ thuật độc quyền kết hợp dược mỹ phẩm cao cấp hoặc đá bazan núi lửa đả thông kinh lạc." },
      { step: 4, title: "Đắp Mặt Nạ / Chườm Thảo Mộc Phục Hồi", time: "15 phút", desc: "Cấp dưỡng chất sinh học tầng sâu, khóa ẩm và làm dịu toàn diện các vùng cơ bắp căng thẳng." },
      { step: 5, title: "Thưởng Trà Dưỡng Nhan & Chăm Sóc Tại Nhà", time: "10 phút", desc: "Thưởng thức trà thảo mộc tuyết yến ấm nóng tại sảnh tĩnh lặng và nhận lời khuyên chế độ sinh hoạt." }
    ];

    const benefits = [
      "Giải tỏa 100% căng cứng cơ khớp, xua tan áp lực tinh thần",
      "Kích thích tuần hoàn máu và tái tạo tế bào da tươi sáng tự nhiên",
      "100% thảo mộc hữu cơ thiên nhiên & dược mỹ phẩm an toàn tuyệt đối",
      "Trực tiếp thực hiện bởi chuyên viên được cấp chứng chỉ quốc tế 5 sao"
    ];

    return {
      ...service,
      categoryName: cat ? cat.name : "Dịch vụ Spa & Wellness",
      suitableFor: "Thích hợp cho mọi quý khách hàng mong muốn phục hồi sinh lực, thư giãn tinh thần và nuôi dưỡng vẻ đẹp tự nhiên.",
      steps: protocolSteps,
      benefits: benefits
    };
  },

  // ===== HỆ THỐNG THÀNH VIÊN VIP ===== //
  memberLogin: (account, password) => {
    const data = readData();
    const cleanAcc = String(account).trim().toLowerCase();
    const member = (data.members || []).find(m => 
      (m.email.toLowerCase() === cleanAcc || m.phone === cleanAcc) && m.password === password
    );
    if (!member) {
      return { success: false, message: "Tài khoản hoặc mật khẩu không chính xác!" };
    }
    const { password: _, ...safeData } = member;
    return { success: true, member: safeData, message: `Chào mừng quý khách ${member.name} trở lại!` };
  },

  memberRegister: (memberData) => {
    const data = readData();
    const phone = String(memberData.phone).trim();
    const email = String(memberData.email).trim().toLowerCase();

    const existed = (data.members || []).find(m => m.phone === phone || m.email.toLowerCase() === email);
    if (existed) {
      return { success: false, message: "Số điện thoại hoặc email này đã đăng ký thành viên!" };
    }

    const newMember = {
      id: (data.members.length ? Math.max(...data.members.map(m => m.id)) : 0) + 1,
      name: memberData.name.trim(),
      phone: phone,
      email: email,
      password: memberData.password || "123456",
      tier: "Thành Viên Thân Thiết (Silver)",
      points: 100, // Tặng ngay 100 điểm khi gia nhập
      joinDate: new Date().toLocaleDateString('vi-VN')
    };

    data.members.push(newMember);
    writeData(data);

    const { password: _, ...safeData } = newMember;
    return { success: true, member: safeData, message: "Chúc mừng bạn đã trở thành thành viên Shinzxe Privilege Club! Bạn được tặng 100 điểm thưởng." };
  },

  getOrders: () => {
    const data = readData();
    return data.orders || [];
  },

  updateOrderStatus: (id, status) => {
    const data = readData();
    const order = (data.orders || []).find(o => o.id === parseInt(id));
    if (order) {
      order.status = status;
      writeData(data);
    }
    return order;
  },

  getMemberOrders: (phone) => {
    const data = readData();
    const cleanPhone = String(phone).trim();
    return (data.orders || []).filter(o => o.customerPhone === cleanPhone);
  },

  getMemberBookings: (phone) => {
    const data = readData();
    const cleanPhone = String(phone).trim();
    const list = (data.bookings || []).filter(b => b.customerPhone === cleanPhone);
    return list;
  }
};

module.exports = { ...store, readData };
