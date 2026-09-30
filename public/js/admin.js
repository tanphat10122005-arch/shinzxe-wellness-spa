let adminState = {
  stats: null,
  bookings: [],
  orders: [],
  services: [],
  categoryChart: null,
  trendChart: null,
  authToken: null // Token xác thực phiên đăng nhập
};

function formatVND(amount) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount || 0);
}

// Hàm gọi API có kèm token xác thực (Authorization header)
async function adminFetch(url, options = {}) {
  const token = adminState.authToken || localStorage.getItem('adminToken');
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
  };

  const res = await fetch(url, { ...options, headers });

  // Nếu server trả về 401 (chưa đăng nhập hoặc hết hạn) → đá ra màn hình login
  if (res.status === 401) {
    localStorage.removeItem('adminToken');
    adminState.authToken = null;
    showLoginScreen();
    return null;
  }

  return res.json();
}

// ================= XÁC THỰC ADMIN ================= //

document.addEventListener('DOMContentLoaded', () => {
  // Kiểm tra nếu đã có token lưu từ trước → tự động xác minh phiên
  const savedToken = localStorage.getItem('adminToken');
  if (savedToken) {
    adminState.authToken = savedToken;
    verifySession();
  } else {
    showLoginScreen();
  }
});

function showLoginScreen() {
  document.getElementById('loginScreen').style.display = 'flex';
  document.getElementById('adminDashboard').style.display = 'none';
}

function showDashboard() {
  document.getElementById('loginScreen').style.display = 'none';
  document.getElementById('adminDashboard').style.display = '';
  // Sau khi hiện Dashboard, bắt đầu tải dữ liệu
  initAdmin();
  updateLiveClock();
  setInterval(updateLiveClock, 1000);
}

// Kiểm tra token cũ còn hợp lệ hay không
async function verifySession() {
  try {
    const res = await fetch('/api/admin/me', {
      headers: { 'Authorization': `Bearer ${adminState.authToken}` }
    });
    if (res.ok) {
      showDashboard();
    } else {
      localStorage.removeItem('adminToken');
      adminState.authToken = null;
      showLoginScreen();
    }
  } catch {
    showLoginScreen();
  }
}

// Xử lý form Đăng nhập
async function handleAdminLogin(e) {
  e.preventDefault();
  const username = document.getElementById('loginUsername').value.trim();
  const password = document.getElementById('loginPassword').value;
  const loginBtn = document.getElementById('loginBtn');
  const errorBox = document.getElementById('loginError');
  const errorMsg = document.getElementById('loginErrorMsg');

  loginBtn.disabled = true;
  loginBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Đang xác thực...';
  errorBox.style.display = 'none';

  try {
    const res = await fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    const json = await res.json();

    if (json.success && json.data?.token) {
      adminState.authToken = json.data.token;
      localStorage.setItem('adminToken', json.data.token);
      showDashboard();
    } else {
      errorMsg.innerText = json.message || 'Sai tên đăng nhập hoặc mật khẩu!';
      errorBox.style.display = 'block';
    }
  } catch (err) {
    errorMsg.innerText = 'Không thể kết nối đến máy chủ. Hãy kiểm tra server đang chạy!';
    errorBox.style.display = 'block';
  } finally {
    loginBtn.disabled = false;
    loginBtn.innerHTML = '<i class="fa-solid fa-right-to-bracket"></i> Đăng Nhập';
  }
}

// Đăng xuất
async function handleAdminLogout() {
  if (!confirm('Bạn có chắc muốn đăng xuất khỏi hệ thống quản trị?')) return;

  try {
    await fetch('/api/admin/logout', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${adminState.authToken}` }
    });
  } catch { /* ignore */ }

  localStorage.removeItem('adminToken');
  adminState.authToken = null;
  showLoginScreen();
}

// ================= CÁC HÀM DASHBOARD ================= //

function updateLiveClock() {
  const clock = document.getElementById('currentDateTime');
  if (clock) {
    const now = new Date();
    clock.innerText = now.toLocaleDateString('vi-VN') + ' ' + now.toLocaleTimeString('vi-VN');
  }
}

async function initAdmin() {
  await Promise.all([
    loadDashboardStats(),
    loadBookingsTable(),
    loadOrdersTable(),
    loadServicesTable()
  ]);
}

// Chuyển đổi các Tab
function switchTab(tabName, linkElement) {
  document.querySelectorAll('.sidebar-link').forEach(l => l.classList.remove('active'));
  if (linkElement) linkElement.classList.add('active');

  const tabDashboard = document.getElementById('tabDashboard');
  const tabBookings = document.getElementById('tabBookings');
  const tabOrders = document.getElementById('tabOrders');
  const tabServices = document.getElementById('tabServices');
  const pageTitle = document.getElementById('pageTitle');

  if (tabName === 'dashboard') {
    tabDashboard.style.display = 'block';
    tabBookings.style.display = 'block';
    if (tabOrders) tabOrders.style.display = 'none';
    tabServices.style.display = 'none';
    pageTitle.innerText = 'Trung Tâm Quản Trị & Thống Kê';
  } else if (tabName === 'bookings') {
    tabDashboard.style.display = 'none';
    tabBookings.style.display = 'block';
    if (tabOrders) tabOrders.style.display = 'none';
    tabServices.style.display = 'none';
    pageTitle.innerText = 'Quản Lý Danh Sách Cuộc Hẹn';
  } else if (tabName === 'orders') {
    tabDashboard.style.display = 'none';
    tabBookings.style.display = 'none';
    if (tabOrders) tabOrders.style.display = 'block';
    tabServices.style.display = 'none';
    pageTitle.innerText = 'Quản Lý Đơn Hàng Sản Phẩm Boutique';
    loadOrdersTable();
  } else if (tabName === 'services') {
    tabDashboard.style.display = 'none';
    tabBookings.style.display = 'none';
    if (tabOrders) tabOrders.style.display = 'none';
    tabServices.style.display = 'block';
    pageTitle.innerText = 'Quản Lý Dịch Vụ Spa';
  }
}

// ================= THỐNG KÊ & VẼ BIỂU ĐỒ (CHART.JS) ================= //
async function loadDashboardStats() {
  try {
    const json = await adminFetch('/api/dashboard/stats');
    if (!json || !json.success) return;

    adminState.stats = json.data;

    // Cập nhật 4 thẻ KPI
    document.getElementById('kpiRevenue').innerText = formatVND(json.data.totalRevenue);
    document.getElementById('kpiTotalBookings').innerText = json.data.totalBookings;
    document.getElementById('kpiCompleted').innerText = json.data.totalCompleted;
    document.getElementById('kpiActiveStaff').innerText = json.data.activeStaff;

    // Vẽ 2 biểu đồ
    renderCategoryChart(json.data.categoryStats);
    renderTrendChart(json.data.last7Days);
  } catch (err) {
    console.error('Error loading stats:', err);
  }
}

// Biểu đồ Doanh thu theo loại dịch vụ
function renderCategoryChart(categoryStats) {
  const ctx = document.getElementById('categoryRevenueChart');
  if (!ctx) return;

  const labels = Object.keys(categoryStats || {});
  const data = Object.values(categoryStats || {});

  if (adminState.categoryChart) {
    adminState.categoryChart.destroy();
  }

  adminState.categoryChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: labels.length ? labels : ['Chăm sóc Da', 'Massage Trị liệu', 'Tóc & Styling', 'Nail Care'],
      datasets: [{
        label: 'Doanh thu (VNĐ)',
        data: data.length ? data : [1200000, 900000, 600000, 320000],
        backgroundColor: [
          'rgba(10, 37, 30, 0.85)',
          'rgba(197, 160, 89, 0.85)',
          'rgba(59, 130, 246, 0.85)',
          'rgba(234, 179, 8, 0.85)'
        ],
        borderRadius: 8
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false }
      },
      scales: {
        y: {
          ticks: {
            callback: (value) => value.toLocaleString('vi-VN') + ' đ'
          }
        }
      }
    }
  });
}

// Biểu đồ Xu hướng Đặt lịch (7 ngày)
function renderTrendChart(last7Days) {
  const ctx = document.getElementById('bookingTrendChart');
  if (!ctx) return;

  const labels = (last7Days || []).map(d => d.date);
  const data = (last7Days || []).map(d => d.count);

  if (adminState.trendChart) {
    adminState.trendChart.destroy();
  }

  adminState.trendChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: labels,
      datasets: [{
        label: 'Lượt hẹn',
        data: data,
        borderColor: '#0a251e',
        backgroundColor: 'rgba(10, 37, 30, 0.1)',
        tension: 0.35,
        fill: true,
        pointBackgroundColor: '#c5a059',
        pointRadius: 5
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          beginAtZero: true,
          ticks: { stepSize: 1 }
        }
      }
    }
  });
}

// ================= QUẢN LÝ LỊCH HẸN ================= //
async function loadBookingsTable() {
  try {
    const json = await adminFetch('/api/bookings');
    if (!json || !json.success) return;

    adminState.bookings = json.data;
    renderBookingsTable(adminState.bookings);
  } catch (err) {
    console.error('Error loading bookings:', err);
  }
}

function renderBookingsTable(bookings) {
  const tbody = document.getElementById('bookingsTableBody');
  if (!tbody) return;

  if (!bookings.length) {
    tbody.innerHTML = `<tr><td colspan="9" style="text-align: center; padding: 24px; color: var(--admin-muted);">Chưa có cuộc hẹn nào trong hệ thống.</td></tr>`;
    return;
  }

  tbody.innerHTML = bookings.map(b => `
    <tr>
      <td><strong style="color: var(--admin-primary);">${b.bookingCode}</strong></td>
      <td><strong>${b.customerName}</strong></td>
      <td>${b.customerPhone}</td>
      <td>${b.serviceName}</td>
      <td>${b.staffName || 'Chưa chỉ định'}</td>
      <td>${b.time} <br><span style="font-size: 0.78rem; color: var(--admin-muted);">${b.date}</span></td>
      <td>
        <strong>${formatVND(b.price)}</strong>
        ${b.discountAmount > 0 ? `<br><span style="font-size: 0.75rem; color: #16a34a; font-weight: 600;"><i class="fa-solid fa-tag"></i> -${formatVND(b.discountAmount)} (${b.discountCode || 'Mã'})</span>` : ''}
      </td>
      <td>
        <span class="badge-status badge-${b.status}">
          ${getStatusText(b.status)}
        </span>
      </td>
      <td>
        <div style="display: flex; gap: 6px;">
          ${b.status !== 'completed' ? `
            <button class="btn-action success" title="Đánh dấu hoàn thành / Check-in" onclick="changeBookingStatus(${b.id}, 'completed')">
              <i class="fa-solid fa-check"></i>
            </button>
          ` : ''}
          ${b.status !== 'cancelled' ? `
            <button class="btn-action danger" title="Hủy cuộc hẹn" onclick="changeBookingStatus(${b.id}, 'cancelled')">
              <i class="fa-solid fa-xmark"></i>
            </button>
          ` : ''}
        </div>
      </td>
    </tr>
  `).join('');
}

function getStatusText(status) {
  switch (status) {
    case 'confirmed': return 'Đã xác nhận';
    case 'completed': return 'Đã xong';
    case 'cancelled': return 'Đã hủy';
    default: return 'Chờ xử lý';
  }
}

function filterBookingsTable() {
  const query = document.getElementById('bookingSearchInput').value.toLowerCase().trim();
  const statusFilter = document.getElementById('bookingStatusFilter').value;

  const filtered = adminState.bookings.filter(b => {
    const matchesSearch = b.customerName.toLowerCase().includes(query) ||
                          b.customerPhone.includes(query) ||
                          b.bookingCode.toLowerCase().includes(query);
    const matchesStatus = statusFilter === 'all' || b.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  renderBookingsTable(filtered);
}

async function changeBookingStatus(bookingId, newStatus) {
  if (newStatus === 'cancelled' && !confirm('Bạn có chắc chắn muốn hủy lịch hẹn này?')) {
    return;
  }

  try {
    const json = await adminFetch(`/api/bookings/${bookingId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status: newStatus })
    });
    if (json && json.success) {
      alert(`Đã cập nhật trạng thái thành: ${getStatusText(newStatus)}`);
      loadBookingsTable();
      loadDashboardStats();
    }
  } catch (err) {
    alert('Lỗi cập nhật trạng thái');
  }
}

// CHECK-IN NHANH BẰNG MÃ CODE / QR
async function executeQuickCheckin() {
  const input = document.getElementById('quickCheckinInput');
  const code = input.value.trim();
  if (!code) {
    alert('Vui lòng nhập mã đặt chỗ (VD: LM-8421)');
    return;
  }

  try {
    const json = await adminFetch('/api/bookings/checkin', {
      method: 'POST',
      body: JSON.stringify({ bookingCode: code })
    });

    if (json && json.success) {
      alert(`✅ ${json.message}`);
      input.value = '';
      loadBookingsTable();
      loadDashboardStats();
    } else if (json) {
      alert(`❌ ${json.message}`);
    }
  } catch (err) {
    alert('Lỗi khi thực hiện check-in');
  }
}

// ================= QUẢN LÝ DỊCH VỤ ================= //
async function loadServicesTable() {
  try {
    const res = await fetch('/api/services');
    const json = await res.json();
    if (json.success) {
      adminState.services = json.data;
      renderServicesTable(adminState.services);
    }
  } catch (err) {
    console.error('Error loading services:', err);
  }
}

function renderServicesTable(services) {
  const tbody = document.getElementById('servicesTableBody');
  if (!tbody) return;

  tbody.innerHTML = services.map(s => `
    <tr>
      <td>
        <img src="${s.image}" alt="${s.name}" style="width: 50px; height: 50px; object-fit: cover; border-radius: 6px;">
      </td>
      <td><strong>${s.name}</strong></td>
      <td><span style="color: var(--admin-primary); font-weight: 700;">${formatVND(s.price)}</span></td>
      <td>${s.duration} phút</td>
      <td style="max-width: 300px; color: var(--admin-muted); font-size: 0.82rem;">${s.description}</td>
      <td>
        <button class="btn-action danger" onclick="deleteService(${s.id})">
          <i class="fa-solid fa-trash"></i> Xóa
        </button>
      </td>
    </tr>
  `).join('');
}

function openAddServiceModal() {
  document.getElementById('addServiceModal').style.display = 'flex';
}

function closeAddServiceModal() {
  document.getElementById('addServiceModal').style.display = 'none';
}

async function handleAddServiceSubmit(e) {
  e.preventDefault();
  const name = document.getElementById('newServiceName').value;
  const categoryId = document.getElementById('newServiceCategory').value;
  const price = document.getElementById('newServicePrice').value;
  const duration = document.getElementById('newServiceDuration').value;
  const image = document.getElementById('newServiceImage').value;
  const description = document.getElementById('newServiceDesc').value;

  try {
    const json = await adminFetch('/api/services', {
      method: 'POST',
      body: JSON.stringify({ name, categoryId, price, duration, image, description })
    });
    if (json && json.success) {
      alert('Thêm dịch vụ mới thành công!');
      closeAddServiceModal();
      loadServicesTable();
    }
  } catch (err) {
    alert('Lỗi khi thêm dịch vụ');
  }
}

async function deleteService(id) {
  if (!confirm('Bạn có chắc muốn xóa dịch vụ này khỏi danh sách?')) return;

  try {
    const json = await adminFetch(`/api/services/${id}`, { method: 'DELETE' });
    if (json && json.success) {
      alert('Đã xóa dịch vụ');
      loadServicesTable();
    }
  } catch (err) {
    alert('Lỗi xóa dịch vụ');
  }
}

// ================= QUẢN LÝ ĐƠN HÀNG BOUTIQUE ================= //
async function loadOrdersTable() {
  try {
    const json = await adminFetch('/api/orders');
    if (!json || !json.success) return;
    adminState.orders = json.data;
    renderOrdersTable(adminState.orders);
  } catch (err) {
    console.error('Error loading orders:', err);
  }
}

function renderOrdersTable(orders) {
  const tbody = document.getElementById('ordersTableBody');
  if (!tbody) return;

  if (!orders || !orders.length) {
    tbody.innerHTML = `<tr><td colspan="9" style="text-align: center; padding: 24px; color: var(--admin-muted);">Chưa có đơn đặt hàng nào trong hệ thống.</td></tr>`;
    return;
  }

  tbody.innerHTML = orders.map(o => {
    const itemsHtml = (o.items || []).map(item => `
      <div style="font-size: 0.85rem; margin-bottom: 2px;">
        • <strong>${item.name}</strong> x${item.quantity || 1} (${formatVND(item.price)})
      </div>
    `).join('');

    return `
      <tr>
        <td><strong style="color: var(--admin-primary);">${o.orderCode || 'OD-' + o.id}</strong></td>
        <td><strong>${o.customerName}</strong></td>
        <td><a href="tel:${o.customerPhone}" style="color: var(--admin-primary); font-weight: 600;">${o.customerPhone}</a></td>
        <td style="max-width: 200px; font-size: 0.85rem; line-height: 1.4;">${o.customerAddress || 'Chưa cung cấp'}</td>
        <td style="min-width: 180px;">${itemsHtml || 'Sản phẩm lẻ'}</td>
        <td>
          <strong style="color: #c5a059; font-size: 1rem;">${formatVND(o.totalAmount)}</strong>
          ${o.discountAmount > 0 ? `<br><span style="font-size: 0.75rem; color: #16a34a; font-weight: 600;"><i class="fa-solid fa-tag"></i> -${formatVND(o.discountAmount)} (${o.discountCode || 'Mã'})</span>` : ''}
        </td>
        <td style="font-size: 0.82rem; color: var(--admin-muted);">${o.note || 'Không có'}</td>
        <td>
          <span class="badge-status badge-${o.status || 'pending'}">
            ${getOrderStatusText(o.status)}
          </span>
        </td>
        <td>
          <div style="display: flex; gap: 6px; flex-wrap: wrap;">
            ${o.status === 'pending' ? `
              <button class="btn-action" title="Xác nhận giao hàng" onclick="changeOrderStatus(${o.id}, 'shipping')" style="background: #e0f2fe; color: #0369a1; padding: 4px 8px; font-size: 0.78rem;">
                <i class="fa-solid fa-truck"></i> Giao
              </button>
            ` : ''}
            ${o.status !== 'completed' ? `
              <button class="btn-action success" title="Đánh dấu đã hoàn thành" onclick="changeOrderStatus(${o.id}, 'completed')">
                <i class="fa-solid fa-check"></i>
              </button>
            ` : ''}
            ${o.status !== 'cancelled' ? `
              <button class="btn-action danger" title="Hủy đơn" onclick="changeOrderStatus(${o.id}, 'cancelled')">
                <i class="fa-solid fa-xmark"></i>
              </button>
            ` : ''}
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

function getOrderStatusText(status) {
  switch (status) {
    case 'shipping': return 'Đang giao hàng';
    case 'completed': return 'Đã giao thành công';
    case 'cancelled': return 'Đã hủy đơn';
    default: return 'Chờ xử lý';
  }
}

async function changeOrderStatus(id, newStatus) {
  if (!confirm(`Bạn có chắc muốn chuyển trạng thái đơn hàng sang "${getOrderStatusText(newStatus)}"?`)) return;

  try {
    const json = await adminFetch(`/api/orders/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status: newStatus })
    });
    if (json && json.success) {
      loadOrdersTable();
    }
  } catch (err) {
    alert('Lỗi khi cập nhật trạng thái đơn hàng');
  }
}

function filterOrdersTable() {
  const query = (document.getElementById('orderSearchInput')?.value || '').toLowerCase().trim();
  const statusFilter = document.getElementById('orderStatusFilter')?.value || 'all';

  const filtered = (adminState.orders || []).filter(o => {
    const matchesSearch = (o.customerName || '').toLowerCase().includes(query) ||
                          (o.customerPhone || '').includes(query) ||
                          (o.orderCode || '').toLowerCase().includes(query) ||
                          (o.customerAddress || '').toLowerCase().includes(query);
    const matchesStatus = statusFilter === 'all' || o.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  renderOrdersTable(filtered);
}
