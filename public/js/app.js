// Trạng thái ứng dụng Frontend
let state = {
  categories: [],
  services: [],
  staff: [],
  reviews: [],
  products: [],
  cart: JSON.parse(localStorage.getItem('shinzxeCart') || '[]'),
  currentMember: JSON.parse(localStorage.getItem('shinzxeMember') || 'null'),
  currentCategory: 'all',
  currentProductCategory: 'all',
  selectedServiceId: null,
  selectedSlotTime: null,
  appliedBookingCoupon: null,
  appliedOrderCoupon: null,
  memberCoupons: null,
  pendingAction: null
};

// Tiện ích format tiền tệ VNĐ
function formatVND(amount) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount || 0);
}

// Khởi chạy khi tải trang
document.addEventListener('DOMContentLoaded', () => {
  initApp();
  setupDateConstraints();
  setupScrollEffects();
});

// Thiết lập hiệu ứng cuộn trang & Sticky Header
function setupScrollEffects() {
  // 1. Sticky header elevation effect
  const header = document.getElementById('siteHeader');
  window.addEventListener('scroll', () => {
    if (window.scrollY > 30) {
      header?.classList.add('scrolled');
    } else {
      header?.classList.remove('scrolled');
    }
  });

  // 2. Scroll Reveal IntersectionObserver
  const observerOptions = {
    root: null,
    rootMargin: '0px',
    threshold: 0.12
  };

  const observer = new IntersectionObserver((entries, obs) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('active');
        obs.unobserve(entry.target);
      }
    });
  }, observerOptions);

  document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
}

// Bật/tắt Menu di động (Mobile Drawer)
function toggleMobileMenu() {
  const drawer = document.getElementById('mobileDrawer');
  const backdrop = document.getElementById('mobileBackdrop');
  if (drawer && backdrop) {
    drawer.classList.toggle('open');
    backdrop.classList.toggle('open');
  }
}

async function initApp() {
  try {
    await Promise.all([
      fetchCategories(),
      fetchServices(),
      fetchProducts(),
      fetchStaff(),
      fetchReviews()
    ]);
    
    if (state.currentMember && (state.currentMember.name === 'Nguyễn Minh Châu' || state.currentMember.phone === '0901234567')) {
      state.currentMember.name = 'Trương Tấn Phát';
      localStorage.setItem('shinzxeMember', JSON.stringify(state.currentMember));
    }

    updateCartUI();
    updateMemberNavUI();

    // Kích hoạt animation cho các thành phần mới render
    setTimeout(() => {
      document.querySelectorAll('.reveal:not(.active)').forEach(el => {
        el.classList.add('active');
      });
    }, 100);
  } catch (err) {
    console.error('Initialization error:', err);
    showToast('Lỗi khi tải dữ liệu từ máy chủ', 'error');
  }
}

// Giới hạn chỉ được chọn ngày từ hôm nay trở đi
function setupDateConstraints() {
  const dateInput = document.getElementById('bookingDateInput');
  if (dateInput) {
    const today = new Date().toISOString().split('T')[0];
    dateInput.min = today;
    dateInput.value = today;
  }
}

// ================= API CALLS ================= //
async function fetchCategories() {
  const res = await fetch('/api/categories');
  const json = await res.json();
  if (json.success) {
    state.categories = json.data;
    renderCategories();
  }
}

async function fetchServices(categoryId = 'all') {
  const url = categoryId === 'all' ? '/api/services' : `/api/services?category=${categoryId}`;
  const res = await fetch(url);
  const json = await res.json();
  if (json.success) {
    state.services = json.data;
    renderServices(state.services);
    populateServiceSelects();
  }
}

async function fetchStaff() {
  const res = await fetch('/api/staff');
  const json = await res.json();
  if (json.success) {
    state.staff = json.data;
    renderStaff(state.staff);
    populateStaffSelect();
  }
}

async function fetchReviews() {
  const res = await fetch('/api/reviews');
  const json = await res.json();
  if (json.success) {
    state.reviews = json.data;
    renderReviews(state.reviews);
  }
}

// ================= RENDERING ================= //
function renderCategories() {
  const container = document.getElementById('categoryTabs');
  if (!container) return;

  let html = `<button class="filter-btn active" onclick="filterServices('all', this)">Tất cả dịch vụ</button>`;
  state.categories.forEach(cat => {
    html += `<button class="filter-btn" onclick="filterServices(${cat.id}, this)">${cat.name}</button>`;
  });
  container.innerHTML = html;
}

function filterServices(catId, btnElement) {
  document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
  if (btnElement) btnElement.classList.add('active');
  fetchServices(catId);
}

function renderServices(services) {
  const grid = document.getElementById('servicesGrid');
  if (!grid) return;

  if (!services.length) {
    grid.innerHTML = `<div style="grid-column: 1/-1; text-align: center; padding: 40px; color: var(--text-muted);">Không tìm thấy dịch vụ nào trong mục này.</div>`;
    return;
  }

  grid.innerHTML = services.map((s, index) => `
    <div class="service-card reveal delay-${(index % 4) + 1} active">
      <div class="service-img-wrapper">
        <img src="${s.image}" alt="${s.name}" class="service-img" loading="lazy">
        ${s.popular ? '<span class="badge-popular">★ Nổi Bật</span>' : ''}
        <span class="service-duration-badge"><i class="fa-regular fa-clock"></i> ${s.duration} phút</span>
      </div>
      <div class="service-content">
        <h3 class="service-name">${s.name}</h3>
        <p class="service-desc">${s.description}</p>
        <div class="service-footer" style="flex-direction: column; align-items: stretch; gap: 10px; margin-top: auto; padding-top: 14px;">
          <div style="display: flex; justify-content: space-between; align-items: baseline;">
            <span style="font-size: 0.8rem; color: var(--text-muted); font-weight: 500;">Giá trải nghiệm:</span>
            <div class="service-price">${formatVND(s.price)}</div>
          </div>
          <div class="service-actions-row">
            <button class="btn-detail-link" onclick="openServiceDetailModal(${s.id})">
              <i class="fa-solid fa-circle-info"></i> Xem liệu trình
            </button>
            <button class="btn-book-quick" onclick="openBookingModal(${s.id})">
              <i class="fa-solid fa-calendar-check"></i> Đặt lịch ngay
            </button>
          </div>
        </div>
      </div>
    </div>
  `).join('');
}

// ================= GIAN HÀNG SẢN PHẨM BOUTIQUE ================= //
async function fetchProducts(category = 'all') {
  try {
    const url = category === 'all' ? '/api/products' : `/api/products?category=${category}`;
    const res = await fetch(url);
    const json = await res.json();
    if (json.success) {
      state.products = json.data;
      renderProducts(state.products);
    }
  } catch (err) {
    console.error('Error fetching products:', err);
  }
}

function filterProducts(category, btnElement) {
  document.querySelectorAll('#productCategoryTabs .filter-btn').forEach(b => b.classList.remove('active'));
  if (btnElement) btnElement.classList.add('active');
  state.currentProductCategory = category;
  fetchProducts(category);
}

function renderProducts(products) {
  const grid = document.getElementById('productsGrid');
  if (!grid) return;

  if (!products.length) {
    grid.innerHTML = `<div style="grid-column: 1/-1; text-align: center; padding: 40px; color: var(--text-muted);">Chưa có sản phẩm nào trong danh mục này.</div>`;
    return;
  }

  grid.innerHTML = products.map((p, index) => `
    <div class="product-card reveal delay-${(index % 4) + 1} active">
      <div class="product-img-wrapper">
        <img src="${p.image}" alt="${p.name}" class="product-img" loading="lazy">
        <span class="product-volume-badge">${p.volume}</span>
        <span class="product-rating-badge"><i class="fa-solid fa-star"></i> ${p.rating}</span>
      </div>
      <div class="product-content">
        <h4 class="product-name">${p.name}</h4>
        <div class="product-subname">${p.subName}</div>
        <p class="product-desc">${p.description}</p>
        <div class="product-footer">
          <div class="product-price-box">
            <span class="product-price">${formatVND(p.price)}</span>
            ${p.originalPrice ? `<span class="product-original-price">${formatVND(p.originalPrice)}</span>` : ''}
          </div>
          <button class="btn-add-cart" onclick="addToCart(${p.id})">
            <i class="fa-solid fa-cart-plus"></i> Thêm vào giỏ
          </button>
        </div>
      </div>
    </div>
  `).join('');
}

function renderStaff(staffList) {
  const grid = document.getElementById('staffGrid');
  if (!grid) return;

  grid.innerHTML = staffList.map((st, index) => `
    <div class="staff-card reveal delay-${(index % 4) + 1} active">
      <div class="staff-avatar-wrapper">
        <img src="${st.avatar}" alt="${st.name}" class="staff-avatar">
      </div>
      <h4 class="staff-name">${st.name}</h4>
      <div class="staff-title">${st.title}</div>
      <div class="staff-exp"><i class="fa-solid fa-briefcase"></i> ${st.experience}</div>
      <div class="staff-rating"><i class="fa-solid fa-star"></i> ${st.rating} / 5.0</div>
    </div>
  `).join('');
}

function renderReviews(reviews) {
  const grid = document.getElementById('reviewsGrid');
  if (!grid) return;

  grid.innerHTML = reviews.map((r, index) => `
    <div class="review-card reveal delay-${(index % 3) + 1} active">
      <div class="review-header">
        <div class="review-author">${r.customerName}</div>
        <div class="review-stars">${'★'.repeat(r.rating || 5)}</div>
      </div>
      <div class="review-service"><i class="fa-solid fa-spa"></i> ${r.serviceName}</div>
      <div class="review-comment">"${r.comment}"</div>
      <div style="font-size: 0.76rem; color: var(--text-light); margin-top: 14px;">${r.date || 'Gần đây'}</div>
    </div>
  `).join('');
}

function populateServiceSelects() {
  const modalSelect = document.getElementById('modalServiceSelect');
  const reviewSelect = document.getElementById('reviewServiceSelect');
  
  const options = state.services.map(s => `<option value="${s.id}">${s.name} - ${formatVND(s.price)} (${s.duration}p)</option>`).join('');
  
  if (modalSelect) modalSelect.innerHTML = `<option value="">-- Chọn gói dịch vụ bạn muốn --</option>` + options;
  if (reviewSelect) reviewSelect.innerHTML = options;
}

function populateStaffSelect() {
  const staffSelect = document.getElementById('modalStaffSelect');
  if (!staffSelect) return;

  const options = state.staff.map(st => `<option value="${st.id}">${st.name} (${st.title})</option>`).join('');
  staffSelect.innerHTML = `<option value="">-- Bất kỳ chuyên viên nào (Phục vụ nhanh nhất) --</option>` + options;
}

// Lấy dữ liệu danh sách mã giảm giá của thành viên (xem mã nào đã dùng, mã nào khả dụng)
async function fetchMemberCoupons(phone) {
  if (!phone) return null;
  try {
    const res = await fetch(`/api/member/coupons?phone=${encodeURIComponent(phone)}`);
    const json = await res.json();
    if (json.success) {
      state.memberCoupons = json.data;
      return json.data;
    }
  } catch (err) {
    console.error('Lỗi khi tải mã giảm giá thành viên:', err);
  }
  return null;
}

// Cập nhật gợi ý mã giảm giá trên form đặt lịch
async function updateBookingCouponBadge() {
  const badge = document.getElementById('couponHintBadge');
  if (!badge) return;

  if (!state.currentMember) {
    badge.innerHTML = `Gợi ý: SHINZXEVIP10, SHINZXE100K`;
    return;
  }

  const couponsData = await fetchMemberCoupons(state.currentMember.phone);
  if (!couponsData) return;

  const available = couponsData.availableCoupons || [];
  if (available.length > 0) {
    badge.innerHTML = `Khả dụng: ` + available.map(c => `
      <span onclick="setBookingCoupon('${c.code}')" 
            style="text-decoration: underline; cursor: pointer; font-weight: 700; margin-right: 4px;" title="Bấm để áp dụng">
        ${c.code}
      </span>
    `).join(', ');
  } else {
    badge.innerHTML = `<span style="color: #b91c1c; font-weight: 600;"><i class="fa-solid fa-lock"></i> Đã dùng hết mã ưu đãi</span>`;
  }
}

function setBookingCoupon(code) {
  const input = document.getElementById('bookingCouponInput');
  if (input) {
    input.value = code;
    applyBookingCoupon();
  }
}

// ================= MODAL ĐẶT LỊCH ================= //
async function openBookingModal(serviceId = null, couponCode = null) {
  if (!state.currentMember) {
    showToast('Vui lòng đăng nhập tài khoản thành viên để đặt lịch hẹn!', 'info');
    state.pendingAction = { action: 'booking', serviceId, couponCode };
    openMemberModal('login');
    return;
  }

  const modal = document.getElementById('bookingModal');
  if (!modal) return;
  modal.classList.add('active');

  resetBookingForm();

  if (serviceId) {
    const select = document.getElementById('modalServiceSelect');
    if (select) select.value = serviceId;
  }

  // Tự động điền thông tin thành viên đang đăng nhập
  const nameInput = document.getElementById('customerNameInput');
  const phoneInput = document.getElementById('customerPhoneInput');
  const emailInput = document.getElementById('customerEmailInput');
  if (nameInput) nameInput.value = state.currentMember.name || '';
  if (phoneInput) phoneInput.value = state.currentMember.phone || '';
  if (emailInput && state.currentMember.email) emailInput.value = state.currentMember.email;

  // Lấy danh sách ưu đãi của thành viên để chọn mã khả dụng
  let codeToApply = couponCode || '';
  if (!codeToApply && state.currentMember) {
    const couponsData = await fetchMemberCoupons(state.currentMember.phone);
    if (couponsData && couponsData.availableCoupons && couponsData.availableCoupons.length > 0) {
      codeToApply = couponsData.availableCoupons[0].code;
    }
  }

  const couponInput = document.getElementById('bookingCouponInput');
  if (couponInput && codeToApply) {
    couponInput.value = codeToApply;
  }

  updateBookingCouponBadge();
  fetchAvailableSlots();
  updateBookingPriceBreakdown();

  if (codeToApply) {
    setTimeout(() => {
      applyBookingCoupon();
    }, 150);
  }
}

function closeBookingModal() {
  document.getElementById('bookingModal')?.classList.remove('active');
}

function handleServiceSelectionChange() {
  fetchAvailableSlots();
  // Nếu đã áp dụng coupon, tự động tính lại chiết khấu theo dịch vụ mới
  if (state.appliedBookingCoupon) {
    applyBookingCoupon();
  } else {
    updateBookingPriceBreakdown();
  }
}

// Kiểm tra & áp dụng mã giảm giá (Gửi kèm số điện thoại để kiểm tra tài khoản đã dùng chưa)
async function applyBookingCoupon() {
  const input = document.getElementById('bookingCouponInput');
  const code = (input ? input.value : '').trim().toUpperCase();
  const serviceId = document.getElementById('modalServiceSelect')?.value;
  const feedback = document.getElementById('couponFeedback');
  const btn = document.getElementById('btnApplyCoupon');

  if (!serviceId) {
    if (feedback) {
      feedback.style.display = 'block';
      feedback.style.color = '#d97706';
      feedback.innerHTML = '<i class="fa-solid fa-circle-exclamation"></i> Vui lòng chọn gói dịch vụ ở mục trên trước!';
    }
    return;
  }

  if (!code) {
    state.appliedBookingCoupon = null;
    if (feedback) {
      feedback.style.display = 'none';
      feedback.innerText = '';
    }
    updateBookingPriceBreakdown();
    return;
  }

  try {
    if (btn) btn.disabled = true;
    const res = await fetch('/api/coupons/validate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        code, 
        serviceId,
        phone: state.currentMember ? state.currentMember.phone : ''
      })
    });
    const json = await res.json();

    if (json.success) {
      state.appliedBookingCoupon = json;
      if (feedback) {
        feedback.style.display = 'block';
        feedback.style.color = '#15803d';
        feedback.innerHTML = `<i class="fa-solid fa-circle-check"></i> ${json.message}`;
      }
      showToast('Áp dụng mã giảm giá thành công!', 'success');
    } else {
      state.appliedBookingCoupon = null;
      if (feedback) {
        feedback.style.display = 'block';
        feedback.style.color = '#b91c1c';
        feedback.innerHTML = `<i class="fa-solid fa-circle-xmark"></i> ${json.message || 'Mã giảm giá không hợp lệ'}`;
      }
      showToast(json.message || 'Mã không hợp lệ', 'error');
    }
  } catch (err) {
    showToast('Lỗi khi kiểm tra mã giảm giá', 'error');
  } finally {
    if (btn) btn.disabled = false;
    updateBookingPriceBreakdown();
  }
}

// Cập nhật bảng tính giá (Giá gốc - Giảm giá = Tổng thanh toán)
function updateBookingPriceBreakdown() {
  const serviceSelect = document.getElementById('modalServiceSelect');
  const serviceId = parseInt(serviceSelect?.value);
  const service = state.services.find(s => s.id === serviceId);

  const originalEl = document.getElementById('bookingOriginalPriceText');
  const discountRow = document.getElementById('bookingDiscountRow');
  const discountLabel = document.getElementById('bookingDiscountLabel');
  const discountEl = document.getElementById('bookingDiscountAmountText');
  const finalEl = document.getElementById('bookingFinalPriceText');

  if (!service) {
    if (originalEl) originalEl.innerText = '0 đ';
    if (discountRow) discountRow.style.display = 'none';
    if (finalEl) finalEl.innerText = '0 đ';
    return;
  }

  const basePrice = service.price;
  if (originalEl) originalEl.innerText = formatVND(basePrice);

  if (state.appliedBookingCoupon) {
    let discountAmount = 0;
    if (state.appliedBookingCoupon.discountType === 'percent') {
      discountAmount = Math.round(basePrice * (state.appliedBookingCoupon.percent / 100));
    } else {
      discountAmount = Math.min(state.appliedBookingCoupon.discountAmount, basePrice);
    }
    const finalPrice = Math.max(0, basePrice - discountAmount);

    if (discountRow) {
      discountRow.style.display = 'flex';
      discountLabel.innerText = `Giảm giá (${state.appliedBookingCoupon.code}):`;
      discountEl.innerText = `-${formatVND(discountAmount)}`;
    }
    if (finalEl) finalEl.innerText = formatVND(finalPrice);
  } else {
    if (discountRow) discountRow.style.display = 'none';
    if (finalEl) finalEl.innerText = formatVND(basePrice);
  }
}

// Lấy danh sách khung giờ trống từ Backend theo ngày & nhân viên
async function fetchAvailableSlots() {
  const dateInput = document.getElementById('bookingDateInput');
  const staffSelect = document.getElementById('modalStaffSelect');
  const container = document.getElementById('timeSlotsContainer');

  if (!dateInput || !dateInput.value) return;

  container.innerHTML = `<div style="grid-column: 1/-1; text-align: center; color: var(--text-muted); font-size: 0.85rem;"><i class="fa-solid fa-spinner fa-spin"></i> Đang tải giờ trống...</div>`;

  try {
    const staffId = staffSelect ? staffSelect.value : '';
    const res = await fetch(`/api/slots?date=${dateInput.value}&staffId=${staffId}`);
    const json = await res.json();

    if (json.success && json.data) {
      state.selectedSlotTime = null;
      document.getElementById('selectedTimeInput').value = '';

      container.innerHTML = json.data.map(slot => `
        <button 
          type="button" 
          class="slot-btn ${slot.isAvailable ? '' : 'disabled'}" 
          ${slot.isAvailable ? `onclick="selectTimeSlot('${slot.time}', this)"` : 'disabled title="Đã có khách đặt"'}
        >
          ${slot.time}
        </button>
      `).join('');
    }
  } catch (err) {
    container.innerHTML = `<div style="color: var(--danger); font-size: 0.85rem;">Không thể kiểm tra khung giờ</div>`;
  }
}

function selectTimeSlot(time, element) {
  state.selectedSlotTime = time;
  document.getElementById('selectedTimeInput').value = time;

  document.querySelectorAll('.slot-btn').forEach(btn => btn.classList.remove('selected'));
  element.classList.add('selected');
}

// Gửi form đặt lịch lên server
async function handleBookingSubmit(event) {
  event.preventDefault();

  if (!state.currentMember) {
    showToast('Vui lòng đăng nhập tài khoản thành viên để hoàn tất đặt lịch!', 'error');
    state.pendingAction = { action: 'booking' };
    closeBookingModal();
    openMemberModal('login');
    return;
  }

  const serviceId = document.getElementById('modalServiceSelect').value;
  const staffId = document.getElementById('modalStaffSelect').value;
  const date = document.getElementById('bookingDateInput').value;
  const time = document.getElementById('selectedTimeInput').value;
  const customerName = document.getElementById('customerNameInput').value;
  const customerPhone = document.getElementById('customerPhoneInput').value;
  const customerEmail = document.getElementById('customerEmailInput').value;
  const note = document.getElementById('bookingNoteInput').value;

  if (!time) {
    showToast('Vui lòng bấm chọn một khung giờ bên dưới!', 'error');
    return;
  }

  const service = state.services.find(s => s.id === parseInt(serviceId));
  const basePrice = service ? service.price : 0;
  
  let discountCode = null;
  let discountAmount = 0;
  let finalPrice = basePrice;

  if (state.appliedBookingCoupon) {
    discountCode = state.appliedBookingCoupon.code;
    if (state.appliedBookingCoupon.discountType === 'percent') {
      discountAmount = Math.round(basePrice * (state.appliedBookingCoupon.percent / 100));
    } else {
      discountAmount = Math.min(state.appliedBookingCoupon.discountAmount, basePrice);
    }
    finalPrice = Math.max(0, basePrice - discountAmount);
  }

  const btnSubmit = document.getElementById('btnSubmitBooking');
  btnSubmit.disabled = true;
  btnSubmit.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Đang xác nhận...`;

  try {
    const res = await fetch('/api/bookings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        serviceId,
        staffId,
        date,
        time,
        customerName,
        customerPhone,
        customerEmail,
        note,
        discountCode,
        discountAmount,
        finalPrice
      })
    });

    const json = await res.json();

    if (json.success) {
      state.appliedBookingCoupon = null;
      if (state.currentMember) {
        fetchMemberCoupons(state.currentMember.phone);
      }
      showToast('Đặt lịch thành công!', 'success');
      showBookingSuccessTicket(json.data);
    } else {
      showToast(json.message || 'Có lỗi xảy ra', 'error');
    }
  } catch (err) {
    showToast('Lỗi kết nối máy chủ', 'error');
  } finally {
    btnSubmit.disabled = false;
    btnSubmit.innerHTML = `<i class="fa-solid fa-check"></i> Xác Nhận Đặt Lịch`;
  }
}

// Hiển thị vé kết quả kèm mã QR Code trực tiếp
function showBookingSuccessTicket(booking) {
  document.getElementById('bookingForm').style.display = 'none';
  const resultArea = document.getElementById('bookingResultArea');
  resultArea.style.display = 'block';

  document.getElementById('resultBookingCode').innerText = booking.bookingCode;
  document.getElementById('resultQrCode').src = booking.qrCode;

  const discountHtml = booking.discountAmount > 0 
    ? `
      <div class="ticket-row" style="color: var(--text-muted); font-size: 0.88rem;"><span>Giá dịch vụ gốc:</span><span style="text-decoration: line-through;">${formatVND(booking.originalPrice || (booking.price + booking.discountAmount))}</span></div>
      <div class="ticket-row" style="color: var(--success); font-weight: 600;"><span>Ưu đãi (${booking.discountCode || 'Voucher'}):</span><strong>-${formatVND(booking.discountAmount)}</strong></div>
    `
    : '';

  const infoList = document.getElementById('resultTicketInfo');
  infoList.innerHTML = `
    <div class="ticket-row"><span>Khách hàng:</span><strong>${booking.customerName}</strong></div>
    <div class="ticket-row"><span>Số điện thoại:</span><strong>${booking.customerPhone}</strong></div>
    <div class="ticket-row"><span>Dịch vụ:</span><strong style="color: var(--primary);">${booking.serviceName}</strong></div>
    <div class="ticket-row"><span>Chuyên viên:</span><strong>${booking.staffName}</strong></div>
    <div class="ticket-row"><span>Thời gian hẹn:</span><strong>${booking.time} - Ngày ${booking.date}</strong></div>
    ${discountHtml}
    <div class="ticket-row"><span>Tổng thanh toán:</span><strong style="color: var(--accent-hover); font-size: 1.15rem;">${formatVND(booking.price)}</strong></div>
  `;
}

function resetBookingForm() {
  document.getElementById('bookingForm').reset();
  state.appliedBookingCoupon = null;
  const feedback = document.getElementById('couponFeedback');
  if (feedback) {
    feedback.style.display = 'none';
    feedback.innerText = '';
  }
  document.getElementById('bookingForm').style.display = 'block';
  document.getElementById('bookingResultArea').style.display = 'none';
  setupDateConstraints();
  fetchAvailableSlots();
  updateBookingPriceBreakdown();
}

// ================= MODAL TRA CỨU ================= //
function openLookupModal() {
  document.getElementById('lookupModal').classList.add('active');
}

function closeLookupModal() {
  document.getElementById('lookupModal').classList.remove('active');
}

async function handleLookupSubmit() {
  const query = document.getElementById('lookupInput').value.trim();
  const area = document.getElementById('lookupResultsArea');

  if (!query) {
    showToast('Vui lòng nhập số điện thoại hoặc mã đặt chỗ!', 'error');
    return;
  }

  area.innerHTML = `<div style="text-align: center; padding: 24px;"><i class="fa-solid fa-spinner fa-spin fa-2x"></i><p style="margin-top: 10px;">Đang tra cứu hệ thống...</p></div>`;

  try {
    const res = await fetch(`/api/bookings/lookup?query=${encodeURIComponent(query)}`);
    const json = await res.json();

    if (json.success && json.data.length > 0) {
      area.innerHTML = json.data.map(b => `
        <div style="border: 1px solid var(--border); border-radius: var(--radius-md); padding: 20px; margin-bottom: 16px; background: #faf8f5;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px;">
            <span style="font-weight: 800; font-size: 1.2rem; color: var(--primary); letter-spacing: 1px;">${b.bookingCode}</span>
            <span style="padding: 5px 14px; border-radius: 999px; font-size: 0.8rem; font-weight: 700; ${getStatusBadgeStyle(b.status)}">
              ${getStatusText(b.status)}
            </span>
          </div>
          <div style="display: flex; gap: 18px; align-items: center;">
            <img src="${b.qrCode}" alt="QR" style="width: 105px; height: 105px; border-radius: 10px; border: 1px solid #ddd; background: #fff; padding: 4px;">
            <div style="font-size: 0.9rem; line-height: 1.65;">
              <div><strong>Dịch vụ:</strong> ${b.serviceName}</div>
              <div><strong>Khách hàng:</strong> ${b.customerName} (${b.customerPhone})</div>
              <div><strong>Lịch hẹn:</strong> ${b.time} - ${b.date}</div>
              <div><strong>Chuyên viên:</strong> ${b.staffName}</div>
              <div><strong>Chi phí:</strong> ${formatVND(b.price)} ${b.discountAmount > 0 ? `<span style="color: var(--success); font-size: 0.8rem; font-weight: 600;">(Đã giảm ${formatVND(b.discountAmount)} qua mã ${b.discountCode || ''})</span>` : ''}</div>
            </div>
          </div>
        </div>
      `).join('');
    } else {
      area.innerHTML = `<div style="text-align: center; color: var(--danger); padding: 24px;">Không tìm thấy lịch hẹn nào khớp với "${query}". Vui lòng kiểm tra lại!</div>`;
    }
  } catch (err) {
    area.innerHTML = `<div style="text-align: center; color: var(--danger); padding: 20px;">Lỗi khi tra cứu dữ liệu.</div>`;
  }
}

function getStatusText(status) {
  switch (status) {
    case 'confirmed': return 'Đã xác nhận';
    case 'completed': return 'Đã hoàn thành';
    case 'cancelled': return 'Đã hủy';
    default: return 'Chờ xử lý';
  }
}

function getStatusBadgeStyle(status) {
  switch (status) {
    case 'confirmed': return 'background: #dcfce7; color: #166534;';
    case 'completed': return 'background: #e0f2fe; color: #075985;';
    case 'cancelled': return 'background: #fee2e2; color: #991b1b;';
    default: return 'background: #fef3c7; color: #92400e;';
  }
}

// ================= MODAL VIẾT ĐÁNH GIÁ ================= //
function openReviewModal() {
  document.getElementById('reviewModal').classList.add('active');
}

function closeReviewModal() {
  document.getElementById('reviewModal').classList.remove('active');
}

async function handleReviewSubmit(e) {
  e.preventDefault();
  const customerName = document.getElementById('reviewName').value;
  const select = document.getElementById('reviewServiceSelect');
  const serviceName = select.options[select.selectedIndex]?.text.split(' - ')[0] || "Dịch vụ Spa";
  const rating = document.getElementById('reviewRating').value;
  const comment = document.getElementById('reviewComment').value;

  try {
    const res = await fetch('/api/reviews', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ customerName, serviceName, rating, comment })
    });
    const json = await res.json();
    if (json.success) {
      showToast('Cảm ơn bạn đã gửi đánh giá!', 'success');
      closeReviewModal();
      fetchReviews();
    }
  } catch (err) {
    showToast('Lỗi khi gửi đánh giá', 'error');
  }
}

// ================= AI CHAT CONCIERGE ================= //
function toggleAiChat() {
  const box = document.getElementById('aiChatBox');
  box.classList.toggle('open');
  if (box.classList.contains('open')) {
    document.getElementById('aiInput').focus();
  }
}

function askAiChip(text) {
  document.getElementById('aiInput').value = text;
  sendAiMessage();
}

async function sendAiMessage() {
  const input = document.getElementById('aiInput');
  const message = input.value.trim();
  if (!message) return;

  const area = document.getElementById('aiMessagesArea');

  // Thêm tin nhắn của user
  area.innerHTML += `<div class="chat-bubble bubble-user">${message}</div>`;
  input.value = '';

  // Thêm typing indicator
  const typingId = 'typing-' + Date.now();
  area.innerHTML += `<div class="chat-bubble bubble-ai" id="${typingId}"><i class="fa-solid fa-spinner fa-spin"></i> Shinzxe AI đang phản hồi...</div>`;
  area.scrollTop = area.scrollHeight;

  try {
    const res = await fetch('/api/ai-chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message })
    });
    const json = await res.json();

    const typingElem = document.getElementById(typingId);
    if (typingElem) typingElem.remove();

    if (json.success) {
      let extraBtn = '';
      if (json.suggestedServiceId) {
        extraBtn = `
          <div style="margin-top: 10px;">
            <button class="btn btn-primary" style="padding: 6px 16px; font-size: 0.82rem;" onclick="openBookingModal(${json.suggestedServiceId})">
              <i class="fa-solid fa-calendar-check"></i> Đặt gói này ngay
            </button>
          </div>
        `;
      }

      area.innerHTML += `<div class="chat-bubble bubble-ai">${json.reply.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')}${extraBtn}</div>`;
    }
  } catch (err) {
    const typingElem = document.getElementById(typingId);
    if (typingElem) typingElem.remove();
    area.innerHTML += `<div class="chat-bubble bubble-ai">Xin lỗi bạn, kết nối trợ lý ảo đang gián đoạn. Bạn vui lòng liên hệ hotline 1900 8899 nhé!</div>`;
  }

  area.scrollTop = area.scrollHeight;
}

// ================= TOAST NOTIFICATION HELPER ================= //
function showToast(message, type = 'info') {
  const container = document.getElementById('toastContainer');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  const icon = type === 'success' ? 'fa-circle-check' : (type === 'error' ? 'fa-triangle-exclamation' : 'fa-info-circle');
  toast.innerHTML = `<i class="fa-solid ${icon}"></i> <span>${message}</span>`;

  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(100%)';
    toast.style.transition = 'all 0.35s ease';
    setTimeout(() => toast.remove(), 350);
  }, 3500);
}

// ================= CHI TIẾT DỊCH VỤ & QUY TRÌNH 5 BƯỚC ================= //
async function openServiceDetailModal(serviceId) {
  const modal = document.getElementById('serviceDetailModal');
  const body = document.getElementById('serviceDetailBody');
  if (!modal || !body) return;

  body.innerHTML = `
    <div style="padding: 40px; text-align: center;">
      <i class="fa-solid fa-spinner fa-spin fa-2x" style="color: var(--accent);"></i>
      <p style="margin-top: 10px; color: var(--text-muted);">Đang tải chi tiết liệu trình...</p>
    </div>
  `;
  modal.classList.add('active');

  try {
    const res = await fetch(`/api/services/${serviceId}/detail`);
    const json = await res.json();
    if (!json.success || !json.data) {
      body.innerHTML = `<div style="padding: 30px; text-align: center;">Không tìm thấy thông tin dịch vụ.</div>`;
      return;
    }

    const s = json.data;
    body.innerHTML = `
      <div class="service-detail-hero">
        <img src="${s.image}" alt="${s.name}">
        <div class="service-detail-hero-overlay">
          <div style="display: flex; gap: 8px; margin-bottom: 8px;">
            <span style="background: rgba(255,255,255,0.2); backdrop-filter: blur(6px); padding: 3px 12px; border-radius: 999px; font-size: 0.78rem; font-weight: 600;">${s.categoryName}</span>
            <span style="background: rgba(197,160,89,0.9); padding: 3px 12px; border-radius: 999px; font-size: 0.78rem; font-weight: 700; color: #fff;"><i class="fa-regular fa-clock"></i> ${s.duration} phút</span>
          </div>
          <h2 style="font-family: 'Playfair Display', serif; font-size: 1.65rem; font-weight: 700; line-height: 1.3;">${s.name}</h2>
          <div style="font-size: 1.25rem; font-weight: 700; color: #f7d283; margin-top: 4px;">${formatVND(s.price)}</div>
        </div>
        <button onclick="closeServiceDetailModal()" style="position: absolute; top: 14px; right: 14px; background: rgba(0,0,0,0.5); color: #fff; border: none; width: 32px; height: 32px; border-radius: 50%; font-size: 1.1rem; cursor: pointer;">&times;</button>
      </div>

      <div style="padding: 24px 28px; max-height: calc(90vh - 240px); overflow-y: auto;">
        <p style="font-size: 0.95rem; color: var(--text-main); line-height: 1.65; margin-bottom: 20px;">
          ${s.description}
        </p>

        <div style="background: var(--bg-alt); padding: 14px 18px; border-radius: var(--radius-md); margin-bottom: 22px;">
          <div style="font-size: 0.82rem; font-weight: 700; color: var(--primary); text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px;">
            <i class="fa-solid fa-users" style="color: var(--accent);"></i> Đối tượng phù hợp:
          </div>
          <div style="font-size: 0.88rem; color: var(--text-muted); line-height: 1.5;">${s.suitableFor}</div>
        </div>

        <h4 style="font-family: 'Playfair Display', serif; font-size: 1.15rem; color: var(--primary); margin-bottom: 12px;">
          <i class="fa-solid fa-spa" style="color: var(--accent);"></i> Quy Trình 5 Bước Thư Giãn Chuẩn 5 Sao
        </h4>
        <div class="protocol-timeline">
          ${s.steps.map(step => `
            <div class="protocol-step-item">
              <div class="protocol-step-dot"></div>
              <div class="protocol-step-title">
                <span>Bước ${step.step}: ${step.title}</span>
                <span style="font-size: 0.75rem; background: var(--bg-alt); color: var(--text-muted); padding: 2px 8px; border-radius: 999px; font-weight: 500;">${step.time}</span>
              </div>
              <div class="protocol-step-desc">${step.desc}</div>
            </div>
          `).join('')}
        </div>

        <h4 style="font-family: 'Playfair Display', serif; font-size: 1.15rem; color: var(--primary); margin: 24px 0 12px;">
          <i class="fa-solid fa-circle-check" style="color: var(--success);"></i> Hiệu Quả & Cam Kết
        </h4>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 26px;">
          ${s.benefits.map(b => `
            <div style="display: flex; align-items: flex-start; gap: 8px; font-size: 0.85rem; color: var(--text-muted);">
              <i class="fa-solid fa-check" style="color: var(--accent); margin-top: 3px;"></i>
              <span>${b}</span>
            </div>
          `).join('')}
        </div>

        <div style="display: flex; gap: 12px; padding-top: 14px; border-top: 1px solid var(--border-light);">
          <button type="button" class="btn btn-outline" style="flex: 1;" onclick="closeServiceDetailModal()">Đóng</button>
          <button type="button" class="btn btn-primary" style="flex: 2;" onclick="openBookingModal(${s.id}); closeServiceDetailModal();">
            <i class="fa-solid fa-calendar-check"></i> Đặt Lịch Gói Này Ngay
          </button>
        </div>
      </div>
    `;
  } catch (err) {
    body.innerHTML = `<div style="padding: 30px; text-align: center; color: red;">Lỗi tải chi tiết dịch vụ.</div>`;
  }
}

function closeServiceDetailModal() {
  document.getElementById('serviceDetailModal')?.classList.remove('active');
}

// ================= GIỎ HÀNG BOUTIQUE & THANH TOÁN ================= //
function addToCart(productId) {
  const p = state.products.find(item => item.id === productId);
  if (!p) return;

  const existing = state.cart.find(item => item.id === productId);
  if (existing) {
    existing.qty += 1;
  } else {
    state.cart.push({
      id: p.id,
      name: p.name,
      price: p.price,
      image: p.image,
      volume: p.volume,
      qty: 1
    });
  }

  saveCart();
  updateCartUI();
  showToast(`Đã thêm "${p.name}" vào giỏ hàng!`, 'success');
}

function updateCartQty(productId, delta) {
  const item = state.cart.find(i => i.id === productId);
  if (!item) return;

  item.qty += delta;
  if (item.qty <= 0) {
    state.cart = state.cart.filter(i => i.id !== productId);
  }

  saveCart();
  updateCartUI();
  renderCart();
}

function saveCart() {
  localStorage.setItem('shinzxeCart', JSON.stringify(state.cart));
}

function updateCartUI() {
  const totalCount = state.cart.reduce((sum, item) => sum + item.qty, 0);
  const headerBadge = document.getElementById('headerCartCount');
  const mobileBadge = document.getElementById('mobileCartCount');
  const floatingBadge = document.getElementById('floatingCartCount');

  if (headerBadge) headerBadge.innerText = totalCount;
  if (mobileBadge) mobileBadge.innerText = totalCount;
  if (floatingBadge) floatingBadge.innerText = totalCount;
}

function renderCart() {
  const list = document.getElementById('cartItemsList');
  const totalElem = document.getElementById('cartTotalPrice');
  if (!list || !totalElem) return;

  if (!state.cart.length) {
    list.innerHTML = `
      <div style="text-align: center; padding: 60px 20px; color: var(--text-muted);">
        <i class="fa-solid fa-basket-shopping fa-3x" style="color: var(--border); margin-bottom: 14px;"></i>
        <p style="font-weight: 600; font-size: 1rem;">Giỏ hàng của bạn đang trống</p>
        <p style="font-size: 0.85rem; margin-top: 6px;">Hãy khám phá các sản phẩm tinh dầu & dược mỹ phẩm cao cấp bên dưới nhé!</p>
      </div>
    `;
    totalElem.innerText = '0 đ';
    return;
  }

  let total = 0;
  list.innerHTML = state.cart.map(item => {
    const itemTotal = item.price * item.qty;
    total += itemTotal;
    return `
      <div class="cart-item">
        <img src="${item.image}" alt="${item.name}" class="cart-item-img">
        <div class="cart-item-info">
          <div class="cart-item-title">${item.name}</div>
          <div class="cart-item-price">${formatVND(item.price)} <span style="font-size: 0.75rem; color: var(--text-muted); font-weight: normal;">(${item.volume})</span></div>
          <div class="cart-qty-ctrl">
            <button class="btn-qty" onclick="updateCartQty(${item.id}, -1)">-</button>
            <span style="font-size: 0.88rem; font-weight: 600; min-width: 20px; text-align: center;">${item.qty}</span>
            <button class="btn-qty" onclick="updateCartQty(${item.id}, 1)">+</button>
          </div>
        </div>
        <button onclick="updateCartQty(${item.id}, -999)" style="background: none; border: none; color: #94a3b8; cursor: pointer; padding: 6px;" title="Xóa món này">
          <i class="fa-solid fa-trash-can"></i>
        </button>
      </div>
    `;
  }).join('');

  totalElem.innerText = formatVND(total);
}

function openCartDrawer() {
  renderCart();
  document.getElementById('cartDrawerBackdrop')?.classList.add('open');
  document.getElementById('cartDrawer')?.classList.add('open');
}

function closeCartDrawer() {
  document.getElementById('cartDrawerBackdrop')?.classList.remove('open');
  document.getElementById('cartDrawer')?.classList.remove('open');
}

// Cập nhật gợi ý mã giảm giá trên form đặt mua sản phẩm
async function updateOrderCouponBadge() {
  const badge = document.getElementById('orderCouponHintBadge');
  if (!badge) return;

  if (!state.currentMember) {
    badge.innerHTML = `Gợi ý: SHINZXEVIP10, SHINZXE100K`;
    return;
  }

  const couponsData = await fetchMemberCoupons(state.currentMember.phone);
  if (!couponsData) return;

  const available = couponsData.availableCoupons || [];
  if (available.length > 0) {
    badge.innerHTML = `Khả dụng: ` + available.map(c => `
      <span onclick="setOrderCoupon('${c.code}')" 
            style="text-decoration: underline; cursor: pointer; font-weight: 700; margin-right: 4px;" title="Bấm để áp dụng">
        ${c.code}
      </span>
    `).join(', ');
  } else {
    badge.innerHTML = `<span style="color: #b91c1c; font-weight: 600;"><i class="fa-solid fa-lock"></i> Đã dùng hết mã ưu đãi</span>`;
  }
}

function setOrderCoupon(code) {
  const input = document.getElementById('orderCouponInput');
  if (input) {
    input.value = code;
    applyOrderCoupon();
  }
}

function updateOrderPriceBreakdown() {
  const totalItems = state.cart.reduce((sum, i) => sum + i.qty, 0);
  const subtotal = state.cart.reduce((sum, i) => sum + (i.price * i.qty), 0);

  const itemCountEl = document.getElementById('orderItemCount');
  if (itemCountEl) itemCountEl.innerText = `${totalItems} sản phẩm`;

  const subtotalEl = document.getElementById('orderSubtotalAmount');
  if (subtotalEl) subtotalEl.innerText = formatVND(subtotal);

  const discountRow = document.getElementById('orderDiscountRow');
  const discountLabel = document.getElementById('orderDiscountLabel');
  const discountAmountText = document.getElementById('orderDiscountAmountText');
  const finalAmountEl = document.getElementById('orderFinalAmount');

  let discountAmount = 0;
  if (state.appliedOrderCoupon) {
    if (state.appliedOrderCoupon.discountType === 'percent') {
      discountAmount = Math.round(subtotal * (state.appliedOrderCoupon.percent / 100));
    } else {
      discountAmount = Math.min(state.appliedOrderCoupon.discountAmount, subtotal);
    }

    if (discountRow) {
      discountRow.style.display = 'flex';
      discountLabel.innerText = `Ưu đãi (${state.appliedOrderCoupon.code}):`;
      discountAmountText.innerText = `-${formatVND(discountAmount)}`;
    }
  } else {
    if (discountRow) discountRow.style.display = 'none';
  }

  const finalAmount = Math.max(0, subtotal - discountAmount);
  if (finalAmountEl) finalAmountEl.innerText = formatVND(finalAmount);
}

async function applyOrderCoupon() {
  const input = document.getElementById('orderCouponInput');
  const code = (input ? input.value : '').trim().toUpperCase();
  const feedback = document.getElementById('orderCouponFeedback');
  const btn = document.getElementById('btnApplyOrderCoupon');
  const subtotal = state.cart.reduce((sum, i) => sum + (i.price * i.qty), 0);

  if (!code) {
    state.appliedOrderCoupon = null;
    if (feedback) {
      feedback.style.display = 'none';
      feedback.innerText = '';
    }
    updateOrderPriceBreakdown();
    return;
  }

  try {
    if (btn) btn.disabled = true;
    const res = await fetch('/api/coupons/validate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        code,
        orderAmount: subtotal,
        phone: state.currentMember ? state.currentMember.phone : ''
      })
    });
    const json = await res.json();

    if (json.success) {
      state.appliedOrderCoupon = json;
      if (feedback) {
        feedback.style.display = 'block';
        feedback.style.color = '#15803d';
        feedback.innerHTML = `<i class="fa-solid fa-circle-check"></i> ${json.message}`;
      }
      showToast('Áp dụng mã giảm giá đơn hàng thành công!', 'success');
    } else {
      state.appliedOrderCoupon = null;
      if (feedback) {
        feedback.style.display = 'block';
        feedback.style.color = '#b91c1c';
        feedback.innerHTML = `<i class="fa-solid fa-circle-xmark"></i> ${json.message || 'Mã giảm giá không hợp lệ'}`;
      }
      showToast(json.message || 'Mã không hợp lệ', 'error');
    }
  } catch (err) {
    showToast('Lỗi khi kiểm tra mã giảm giá', 'error');
  } finally {
    if (btn) btn.disabled = false;
    updateOrderPriceBreakdown();
  }
}

async function openOrderModal() {
  if (!state.cart.length) {
    showToast('Giỏ hàng trống! Vui lòng chọn sản phẩm trước.', 'info');
    return;
  }

  if (!state.currentMember) {
    showToast('Vui lòng đăng nhập tài khoản thành viên để đặt mua sản phẩm!', 'info');
    state.pendingAction = { action: 'order' };
    closeCartDrawer();
    openMemberModal('login');
    return;
  }

  closeCartDrawer();

  state.appliedOrderCoupon = null;
  const couponInput = document.getElementById('orderCouponInput');
  if (couponInput) couponInput.value = '';
  const feedback = document.getElementById('orderCouponFeedback');
  if (feedback) {
    feedback.style.display = 'none';
    feedback.innerText = '';
  }

  updateOrderPriceBreakdown();

  // Điền trước thông tin nếu đã đăng nhập thành viên
  const nameInput = document.getElementById('orderCustomerName');
  const phoneInput = document.getElementById('orderCustomerPhone');
  if (nameInput) nameInput.value = state.currentMember.name || '';
  if (phoneInput) phoneInput.value = state.currentMember.phone || '';

  document.getElementById('orderModal')?.classList.add('active');
  updateOrderCouponBadge();
}

function closeOrderModal() {
  document.getElementById('orderModal')?.classList.remove('active');
}

async function handleOrderSubmit(e) {
  e.preventDefault();

  if (!state.currentMember) {
    showToast('Vui lòng đăng nhập tài khoản thành viên để hoàn tất mua hàng!', 'error');
    closeOrderModal();
    openMemberModal('login');
    return;
  }

  const btn = document.getElementById('btnSubmitOrder');
  btn.disabled = true;
  btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Đang gửi đơn...';

  const customerName = document.getElementById('orderCustomerName').value.trim();
  const customerPhone = document.getElementById('orderCustomerPhone').value.trim();
  const customerAddress = document.getElementById('orderCustomerAddress').value.trim();
  const note = document.getElementById('orderNote').value.trim();
  const subtotal = state.cart.reduce((sum, i) => sum + (i.price * i.qty), 0);

  let discountCode = null;
  let discountAmount = 0;
  if (state.appliedOrderCoupon) {
    discountCode = state.appliedOrderCoupon.code;
    if (state.appliedOrderCoupon.discountType === 'percent') {
      discountAmount = Math.round(subtotal * (state.appliedOrderCoupon.percent / 100));
    } else {
      discountAmount = Math.min(state.appliedOrderCoupon.discountAmount, subtotal);
    }
  }

  const finalAmount = Math.max(0, subtotal - discountAmount);

  try {
    const res = await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customerName,
        customerPhone,
        customerAddress,
        note,
        items: state.cart,
        totalAmount: finalAmount,
        originalAmount: subtotal,
        discountCode,
        discountAmount
      })
    });
    const json = await res.json();

    if (json.success) {
      state.cart = [];
      state.appliedOrderCoupon = null;
      if (state.currentMember) {
        fetchMemberCoupons(state.currentMember.phone);
      }
      saveCart();
      updateCartUI();
      closeOrderModal();
      showToast(`🎉 ${json.message}`, 'success');
      alert(`✅ ĐẶT HÀNG THÀNH CÔNG!\n\nMã đơn: ${json.data.orderCode}\nTổng tiền: ${formatVND(finalAmount)}${discountAmount > 0 ? ` (Đã giảm: -${formatVND(discountAmount)} qua mã ${discountCode})` : ''}\nĐịa chỉ giao: ${customerAddress}\n\nChuyên viên Shinzxe sẽ gọi xác nhận và đóng gói gửi tới quý khách trong thời gian sớm nhất.`);
    } else {
      showToast(json.message || 'Lỗi khi tạo đơn hàng', 'error');
    }
  } catch (err) {
    showToast('Lỗi kết nối máy chủ', 'error');
  } finally {
    btn.disabled = false;
    btn.innerHTML = '<i class="fa-solid fa-check"></i> Xác Nhận Mua Hàng';
  }
}

// ================= HỆ THỐNG THÀNH VIÊN VIP (PRIVILEGE CLUB) ================= //
function openMemberModal() {
  renderMemberModal();
  document.getElementById('memberModal')?.classList.add('active');
}

function closeMemberModal() {
  document.getElementById('memberModal')?.classList.remove('active');
}

function renderMemberModal(view = 'card') {
  const body = document.getElementById('memberModalBody');
  if (!body) return;

  if (state.currentMember) {
    const m = state.currentMember;
    
    // Header Navigation Tabs cho thành viên đã đăng nhập
    let navTabs = `
      <div style="display: flex; gap: 6px; margin-bottom: 18px; border-bottom: 1px solid var(--border); padding-bottom: 10px; overflow-x: auto;">
        <button onclick="renderMemberModal('card')" class="btn ${view === 'card' ? 'btn-primary' : 'btn-outline'}" style="padding: 7px 14px; font-size: 0.84rem; border-radius: 999px;">
          <i class="fa-solid fa-crown"></i> Thẻ VIP
        </button>
        <button onclick="renderMemberModal('bookings')" class="btn ${view === 'bookings' ? 'btn-primary' : 'btn-outline'}" style="padding: 7px 14px; font-size: 0.84rem; border-radius: 999px;">
          <i class="fa-solid fa-calendar-check"></i> Lịch Sử Đặt Lịch
        </button>
        <button onclick="renderMemberModal('orders')" class="btn ${view === 'orders' ? 'btn-primary' : 'btn-outline'}" style="padding: 7px 14px; font-size: 0.84rem; border-radius: 999px;">
          <i class="fa-solid fa-bag-shopping"></i> Đơn Mua Hàng
        </button>
      </div>
    `;

    if (view === 'card') {
      body.innerHTML = navTabs + `
        <div class="vip-card-preview">
          <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px;">
            <div>
              <div style="font-size: 0.75rem; letter-spacing: 1.5px; text-transform: uppercase; color: #f7d283;">SHINZXE PRIVILEGE CLUB</div>
              <h3 style="font-family: 'Playfair Display', serif; font-size: 1.45rem; font-weight: 700; margin-top: 2px;">${m.name}</h3>
            </div>
            <span style="background: rgba(197,160,89,0.3); border: 1px solid rgba(197,160,89,0.6); padding: 4px 12px; border-radius: 999px; font-size: 0.78rem; font-weight: 700; color: #f7d283;">
              <i class="fa-solid fa-gem"></i> ${m.tier}
            </span>
          </div>
          <div style="display: flex; justify-content: space-between; align-items: flex-end;">
            <div>
              <div style="font-size: 0.78rem; color: #cbd5e1;">Số điện thoại</div>
              <div style="font-weight: 600; font-size: 0.95rem;">${m.phone}</div>
            </div>
            <div style="text-align: right;">
              <div style="font-size: 0.78rem; color: #cbd5e1;">Điểm thưởng tích lũy</div>
              <div style="font-size: 1.3rem; font-weight: 700; color: #f7d283;">${m.points || 100} <span style="font-size: 0.8rem;">pts</span></div>
            </div>
          </div>
        </div>

        <div style="background: #fdfbf7; border: 1px dashed var(--accent); padding: 14px 16px; border-radius: var(--radius-md); margin-bottom: 20px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
            <div style="font-weight: 700; color: var(--primary); font-size: 0.92rem;">
              <i class="fa-solid fa-gift" style="color: var(--accent);"></i> Ưu Đãi Độc Quyền (Mỗi mã dùng 1 lần):
            </div>
            <span style="font-size: 0.75rem; color: var(--text-muted);">Tài khoản: ${m.phone}</span>
          </div>
          <div id="memberVouchersList" style="display: flex; flex-direction: column; gap: 8px;">
            <div style="text-align: center; color: var(--text-muted); font-size: 0.85rem; padding: 10px;">
              <i class="fa-solid fa-spinner fa-spin"></i> Đang tải danh sách ưu đãi...
            </div>
          </div>
        </div>

        <div style="display: flex; gap: 10px;">
          <button class="btn btn-outline" style="flex: 1;" onclick="handleMemberLogout()">
            <i class="fa-solid fa-right-from-bracket"></i> Đăng Xuất
          </button>
          <button class="btn btn-primary" style="flex: 2;" onclick="closeMemberModal(); openBookingModal();">
            <i class="fa-solid fa-calendar-check"></i> Đặt Lịch Hẹn Ngay
          </button>
        </div>
      `;
      fetchAndRenderMemberCoupons(m.phone);
      return;
    } else if (view === 'bookings') {
      body.innerHTML = navTabs + `
        <div id="memberBookingsList" style="min-height: 180px; max-height: 52vh; overflow-y: auto;">
          <div style="text-align: center; padding: 30px; color: var(--text-muted);">
            <i class="fa-solid fa-spinner fa-spin fa-2x"></i>
            <p style="margin-top: 10px;">Đang tải lịch sử đặt lịch...</p>
          </div>
        </div>
        <div style="margin-top: 16px; display: flex; justify-content: space-between; align-items: center;">
          <button class="btn btn-outline" style="font-size: 0.85rem;" onclick="renderMemberModal('card')">
            <i class="fa-solid fa-arrow-left"></i> Quay lại thẻ
          </button>
          <button class="btn btn-primary" style="font-size: 0.85rem;" onclick="closeMemberModal(); openBookingModal();">
            <i class="fa-solid fa-plus"></i> Đặt Lịch Mới
          </button>
        </div>
      `;
      fetchAndRenderMemberBookings(m.phone);
      return;
    } else if (view === 'orders') {
      body.innerHTML = navTabs + `
        <div id="memberOrdersList" style="min-height: 180px; max-height: 52vh; overflow-y: auto;">
          <div style="text-align: center; padding: 30px; color: var(--text-muted);">
            <i class="fa-solid fa-spinner fa-spin fa-2x"></i>
            <p style="margin-top: 10px;">Đang tải lịch sử mua hàng...</p>
          </div>
        </div>
        <div style="margin-top: 16px; display: flex; justify-content: space-between; align-items: center;">
          <button class="btn btn-outline" style="font-size: 0.85rem;" onclick="renderMemberModal('card')">
            <i class="fa-solid fa-arrow-left"></i> Quay lại thẻ
          </button>
          <button class="btn btn-primary" style="font-size: 0.85rem;" onclick="closeMemberModal(); window.location.hash='#products';">
            <i class="fa-solid fa-bag-shopping"></i> Mua Thêm Sản Phẩm
          </button>
        </div>
      `;
      fetchAndRenderMemberOrders(m.phone);
      return;
    }
  }

  // Nếu chưa đăng nhập: hiển thị Tabs Đăng nhập & Đăng ký
  body.innerHTML = `
    <div style="display: flex; border-bottom: 1px solid var(--border); margin-bottom: 20px;">
      <button onclick="switchMemberTab('login')" id="tabBtnLogin" style="flex: 1; padding: 12px; border: none; background: none; font-weight: 700; font-size: 0.95rem; cursor: pointer; color: ${view === 'login' ? 'var(--primary)' : 'var(--text-muted)'}; border-bottom: 2px solid ${view === 'login' ? 'var(--primary)' : 'transparent'};">
        Đăng Nhập Thành Viên
      </button>
      <button onclick="switchMemberTab('register')" id="tabBtnRegister" style="flex: 1; padding: 12px; border: none; background: none; font-weight: 700; font-size: 0.95rem; cursor: pointer; color: ${view === 'register' ? 'var(--primary)' : 'var(--text-muted)'}; border-bottom: 2px solid ${view === 'register' ? 'var(--primary)' : 'transparent'};">
        Đăng Ký VIP Club
      </button>
    </div>

    ${view === 'login' ? `
      <form onsubmit="handleMemberLogin(event)">
        <div class="form-group">
          <label class="form-label"><i class="fa-solid fa-user" style="color: var(--accent);"></i> Số điện thoại hoặc Email:</label>
          <input type="text" id="memberLoginAccount" class="form-control" required placeholder="Nhập số điện thoại hoặc email...">
        </div>
        <div class="form-group">
          <label class="form-label"><i class="fa-solid fa-lock" style="color: var(--accent);"></i> Mật khẩu:</label>
          <input type="password" id="memberLoginPassword" class="form-control" required placeholder="Nhập mật khẩu...">
        </div>
        <button type="submit" class="btn btn-primary" style="width: 100%; padding: 12px; margin-top: 10px;" id="btnMemberLogin">
          <i class="fa-solid fa-right-to-bracket"></i> Đăng Nhập
        </button>
      </form>
    ` : `
      <form onsubmit="handleMemberRegister(event)">
        <div class="form-group">
          <label class="form-label"><i class="fa-solid fa-signature" style="color: var(--accent);"></i> Họ và tên (*):</label>
          <input type="text" id="memberRegName" class="form-control" required placeholder="Nhập họ và tên...">
        </div>
        <div class="form-group">
          <label class="form-label"><i class="fa-solid fa-phone" style="color: var(--accent);"></i> Số điện thoại (*):</label>
          <input type="tel" id="memberRegPhone" class="form-control" required placeholder="Nhập số điện thoại...">
        </div>
        <div class="form-group">
          <label class="form-label"><i class="fa-solid fa-envelope" style="color: var(--accent);"></i> Email (*):</label>
          <input type="email" id="memberRegEmail" class="form-control" required placeholder="Nhập địa chỉ email...">
        </div>
        <div class="form-group">
          <label class="form-label"><i class="fa-solid fa-lock" style="color: var(--accent);"></i> Mật khẩu (*):</label>
          <input type="password" id="memberRegPassword" class="form-control" required placeholder="Tạo mật khẩu (tối thiểu 6 ký tự)...">
        </div>
        <button type="submit" class="btn btn-accent" style="width: 100%; padding: 12px; margin-top: 10px;" id="btnMemberRegister">
          <i class="fa-solid fa-gift"></i> Đăng Ký & Nhận 100 Điểm Thưởng
        </button>
      </form>
    `}
  `;
}

async function fetchAndRenderMemberBookings(phone) {
  const container = document.getElementById('memberBookingsList');
  if (!container) return;

  try {
    const res = await fetch(`/api/member/bookings?phone=${encodeURIComponent(phone)}`);
    const json = await res.json();

    if (json.success && json.data && json.data.length > 0) {
      container.innerHTML = json.data.map(b => `
        <div style="background: #faf8f5; border: 1px solid var(--border); border-radius: var(--radius-md); padding: 14px 16px; margin-bottom: 12px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
            <strong style="color: var(--primary); font-size: 1.05rem;">${b.bookingCode}</strong>
            <span style="padding: 3px 10px; border-radius: 999px; font-size: 0.75rem; font-weight: 700; ${getStatusBadgeStyle(b.status)}">
              ${getStatusText(b.status)}
            </span>
          </div>
          <div style="font-size: 0.88rem; color: var(--text-main); line-height: 1.6;">
            <div><strong>Dịch vụ:</strong> ${b.serviceName}</div>
            <div><strong>Thời gian:</strong> ${b.time} ngày ${b.date}</div>
            <div><strong>Chuyên viên:</strong> ${b.staffName || 'Ngẫu nhiên'}</div>
            <div><strong>Thanh toán:</strong> <span style="color: var(--accent-hover); font-weight: 700;">${formatVND(b.price)}</span> ${b.discountAmount > 0 ? `<span style="font-size: 0.78rem; color: var(--success); font-weight: 600;">(Đã giảm -${formatVND(b.discountAmount)})</span>` : ''}</div>
          </div>
        </div>
      `).join('');
    } else {
      container.innerHTML = `
        <div style="text-align: center; padding: 36px 20px; color: var(--text-muted);">
          <i class="fa-regular fa-calendar-xmark fa-2x" style="color: #cbd5e1; margin-bottom: 10px;"></i>
          <p>Bạn chưa có lịch hẹn nào tại Shinzxe.</p>
        </div>
      `;
    }
  } catch (err) {
    container.innerHTML = `<div style="text-align: center; color: var(--danger); padding: 20px;">Lỗi khi tải dữ liệu lịch hẹn.</div>`;
  }
}

async function fetchAndRenderMemberOrders(phone) {
  const container = document.getElementById('memberOrdersList');
  if (!container) return;

  try {
    const res = await fetch(`/api/member/orders?phone=${encodeURIComponent(phone)}`);
    const json = await res.json();

    if (json.success && json.data && json.data.length > 0) {
      container.innerHTML = json.data.map(o => {
        const itemsText = (o.items || []).map(i => `${i.name} (x${i.quantity || 1})`).join(', ');
        return `
          <div style="background: #faf8f5; border: 1px solid var(--border); border-radius: var(--radius-md); padding: 14px 16px; margin-bottom: 12px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
              <strong style="color: var(--primary); font-size: 1.05rem;">${o.orderCode || 'OD-' + o.id}</strong>
              <span style="padding: 3px 10px; border-radius: 999px; font-size: 0.75rem; font-weight: 700; background: #e0f2fe; color: #0369a1;">
                ${o.status === 'completed' ? 'Đã giao' : (o.status === 'shipping' ? 'Đang giao' : (o.status === 'cancelled' ? 'Đã hủy' : 'Chờ xử lý'))}
              </span>
            </div>
            <div style="font-size: 0.88rem; color: var(--text-main); line-height: 1.6;">
              <div><strong>Sản phẩm:</strong> ${itemsText || 'Sản phẩm boutique'}</div>
              <div><strong>Địa chỉ:</strong> ${o.customerAddress || 'Giao tại chỗ'}</div>
              <div><strong>Tổng tiền:</strong> <span style="color: var(--accent-hover); font-weight: 700;">${formatVND(o.totalAmount)}</span> ${o.discountAmount > 0 ? `<span style="font-size: 0.78rem; color: var(--success); font-weight: 600;">(Đã giảm -${formatVND(o.discountAmount)} qua mã ${o.discountCode || ''})</span>` : ''}</div>
            </div>
          </div>
        `;
      }).join('');
    } else {
      container.innerHTML = `
        <div style="text-align: center; padding: 36px 20px; color: var(--text-muted);">
          <i class="fa-solid fa-box-open fa-2x" style="color: #cbd5e1; margin-bottom: 10px;"></i>
          <p>Bạn chưa có đơn mua sản phẩm nào.</p>
        </div>
      `;
    }
  } catch (err) {
    container.innerHTML = `<div style="text-align: center; color: var(--danger); padding: 20px;">Lỗi khi tải dữ liệu đơn hàng.</div>`;
  }
}

async function fetchAndRenderMemberCoupons(phone) {
  const container = document.getElementById('memberVouchersList');
  if (!container) return;

  try {
    const couponsData = await fetchMemberCoupons(phone);
    if (!couponsData || !couponsData.allCoupons) {
      container.innerHTML = `<div style="font-size: 0.85rem; color: var(--text-muted);">Không thể tải danh sách ưu đãi.</div>`;
      return;
    }

    container.innerHTML = couponsData.allCoupons.map(c => `
      <div style="display: flex; justify-content: space-between; align-items: center; background: #ffffff; border: 1px solid var(--border); border-radius: 8px; padding: 10px 14px; margin-bottom: 4px;">
        <div>
          <div style="font-weight: 700; font-size: 0.88rem; color: var(--primary);">
            <code style="background: #faf8f5; padding: 2px 6px; border-radius: 4px; color: var(--accent-hover); font-size: 0.88rem;">${c.code}</code>
            <span style="font-size: 0.84rem; color: var(--text-main); font-weight: 600; margin-left: 6px;">${c.name}</span>
          </div>
          <div style="font-size: 0.78rem; color: var(--text-muted); margin-top: 2px;">${c.description}</div>
        </div>
        <div>
          ${c.isUsed ? `
            <span style="background: #f1f5f9; color: #64748b; font-size: 0.78rem; font-weight: 600; padding: 5px 12px; border-radius: 999px; display: inline-flex; align-items: center; gap: 4px;">
              <i class="fa-solid fa-lock"></i> Đã dùng
            </span>
          ` : `
            <button class="btn btn-primary" style="padding: 5px 14px; font-size: 0.78rem; font-weight: 700; border-radius: 6px;" onclick="closeMemberModal(); openBookingModal(null, '${c.code}')">
              Dùng ngay
            </button>
          `}
        </div>
      </div>
    `).join('');
  } catch (err) {
    container.innerHTML = `<div style="font-size: 0.85rem; color: var(--danger);">Lỗi khi tải mã ưu đãi.</div>`;
  }
}

function switchMemberTab(tab) {
  renderMemberModal(tab);
}

async function handleMemberLogin(e) {
  e.preventDefault();
  const account = document.getElementById('memberLoginAccount').value.trim();
  const password = document.getElementById('memberLoginPassword').value;
  const btn = document.getElementById('btnMemberLogin');
  btn.disabled = true;

  try {
    const res = await fetch('/api/member/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ account, password })
    });
    const json = await res.json();
    if (json.success && json.member) {
      state.currentMember = json.member;
      localStorage.setItem('shinzxeMember', JSON.stringify(json.member));
      updateMemberNavUI();
      showToast(json.message, 'success');

      if (state.pendingAction) {
        const pending = state.pendingAction;
        state.pendingAction = null;
        closeMemberModal();
        if (pending.action === 'booking') {
          setTimeout(() => openBookingModal(pending.serviceId, pending.couponCode), 250);
        } else if (pending.action === 'order') {
          setTimeout(() => openOrderModal(), 250);
        }
        return;
      }

      renderMemberModal('card');
    } else {
      showToast(json.message || 'Sai thông tin đăng nhập', 'error');
    }
  } catch {
    showToast('Lỗi kết nối máy chủ', 'error');
  } finally {
    btn.disabled = false;
  }
}

async function handleMemberRegister(e) {
  e.preventDefault();
  const name = document.getElementById('memberRegName').value.trim();
  const phone = document.getElementById('memberRegPhone').value.trim();
  const email = document.getElementById('memberRegEmail').value.trim();
  const password = document.getElementById('memberRegPassword').value;
  const btn = document.getElementById('btnMemberRegister');

  if (!password || password.length < 6) {
    showToast('Mật khẩu cần tối thiểu 6 ký tự để bảo mật!', 'error');
    return;
  }

  btn.disabled = true;

  try {
    const res = await fetch('/api/member/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, phone, email, password })
    });
    const json = await res.json();
    if (json.success && json.member) {
      state.currentMember = json.member;
      localStorage.setItem('shinzxeMember', JSON.stringify(json.member));
      updateMemberNavUI();
      showToast(json.message, 'success');

      if (state.pendingAction) {
        const pending = state.pendingAction;
        state.pendingAction = null;
        closeMemberModal();
        if (pending.action === 'booking') {
          setTimeout(() => openBookingModal(pending.serviceId, pending.couponCode), 250);
        } else if (pending.action === 'order') {
          setTimeout(() => openOrderModal(), 250);
        }
        return;
      }

      renderMemberModal('card');
    } else {
      showToast(json.message || 'Đăng ký thất bại', 'error');
    }
  } catch {
    showToast('Lỗi kết nối máy chủ', 'error');
  } finally {
    btn.disabled = false;
  }
}

function handleMemberLogout() {
  state.currentMember = null;
  localStorage.removeItem('shinzxeMember');
  updateMemberNavUI();
  renderMemberModal('login');
  showToast('Đã đăng xuất tài khoản thành viên', 'info');
}

function updateMemberNavUI() {
  const btnText = document.getElementById('navMemberText');
  if (btnText) {
    if (state.currentMember) {
      btnText.innerHTML = `<strong>${state.currentMember.name.split(' ').pop()}</strong> <span style="font-size:0.75rem; color:var(--accent);">(VIP)</span>`;
    } else {
      btnText.innerText = 'Thành Viên';
    }
  }
}
