// 사용자 데이터를 로컬 스토리지에 저장
let users = JSON.parse(localStorage.getItem('kbSecUsers')) || [];
let currentUser = JSON.parse(localStorage.getItem('kbSecCurrentUser')) || null;
let contracts = JSON.parse(localStorage.getItem('kbSecContracts')) || {};

// 페이지 로드 시 초기화
document.addEventListener('DOMContentLoaded', function() {
    // 회원가입 링크 이벤트 리스너
    document.getElementById('find-id-pw').addEventListener('click', function(e) {
        e.preventDefault();
        showRegisterModal();
    });
    
    // 로그인 버튼 이벤트 리스너
    document.getElementById('login-button').addEventListener('click', function() {
        login();
    });
    
    // 회원가입 폼 이벤트 리스너
    document.getElementById('register-form').addEventListener('submit', function(e) {
        e.preventDefault();
        register();
    });
    
    // 아이디 저장 기능
    const savedId = localStorage.getItem('kbSecSavedId');
    if (savedId) {
        document.getElementById('login-id').value = savedId;
        document.getElementById('save-id').checked = true;
    }
    
    // 엔터 키로 로그인
    document.getElementById('login-password').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            login();
        }
    });
});

// 로그인 상태 확인
function checkLoginStatus() {
    if (currentUser) {
        document.getElementById('user-name').textContent = currentUser.department + ' 계정';
        document.getElementById('login-btn').style.display = 'none';
        document.getElementById('register-btn').style.display = 'none';
        document.getElementById('logout-btn').style.display = 'inline-block';
        document.getElementById('login-required').style.display = 'none';
        document.getElementById('contract-list-container').style.display = 'block';
    } else {
        document.getElementById('user-name').textContent = '로그인이 필요합니다';
        document.getElementById('login-btn').style.display = 'inline-block';
        document.getElementById('register-btn').style.display = 'inline-block';
        document.getElementById('logout-btn').style.display = 'none';
        document.getElementById('login-required').style.display = 'block';
        document.getElementById('contract-list-container').style.display = 'none';
    }
}

// 로그인 모달 표시
function showLoginModal() {
    document.getElementById('login-modal').style.display = 'block';
}

// 로그인 모달 닫기
function closeLoginModal() {
    document.getElementById('login-modal').style.display = 'none';
}

// 회원가입 모달 표시
function showRegisterModal() {
    document.getElementById('register-modal').style.display = 'block';
}

// 회원가입 모달 닫기
function closeRegisterModal() {
    document.getElementById('register-modal').style.display = 'none';
}

// 계약 추가 모달 표시
function showAddContractModal() {
    document.getElementById('add-contract-modal').style.display = 'block';
}

// 계약 추가 모달 닫기
function closeAddContractModal() {
    document.getElementById('add-contract-modal').style.display = 'none';
}

// 계약 상세 모달 표시
function showContractDetailModal(contractId, year) {
    const contract = contracts[year].find(c => c.id === contractId);
    if (contract) {
        document.getElementById('detail-contract-name').textContent = contract.name;
        document.getElementById('detail-company').textContent = contract.company;
        document.getElementById('detail-date').textContent = formatDate(contract.date);
        document.getElementById('detail-status').textContent = contract.status;
        document.getElementById('detail-manager').textContent = contract.manager;
        document.getElementById('detail-content').textContent = contract.details || '상세 내용이 없습니다.';
        
        // 수정 및 삭제를 위한 데이터 속성 추가
        const modal = document.getElementById('contract-detail-modal');
        modal.setAttribute('data-contract-id', contractId);
        modal.setAttribute('data-contract-year', year);
        
        modal.style.display = 'block';
    }
}

// 계약 상세 모달 닫기
function closeContractDetailModal() {
    document.getElementById('contract-detail-modal').style.display = 'none';
}

// 로그인 처리
function login() {
    const id = document.getElementById('login-id').value;
    const password = document.getElementById('login-password').value;
    
    if (!id || !password) {
        alert('아이디와 비밀번호를 입력해주세요.');
        return;
    }
    
    // 회원가입된 사용자 확인
    const user = users.find(u => u.id === id && u.password === password);
    
    if (user) {
        // 회원가입된 사용자로 로그인
        currentUser = user;
        localStorage.setItem('kbSecCurrentUser', JSON.stringify(currentUser));
        
        // 대시보드 페이지로 이동
        window.location.href = 'dashboard.html';
        return;
    }
    
    // 기본 사용자로 로그인 (KBSEC25 또는 AV1)
    if ((id === 'KBSEC25' && password === 'KBSEC25') || (id === 'AV1' && password === 'AV1')) {
        const defaultUser = {
            id: id,
            password: password,
            department: id === 'AV1' ? '글로벌상품영업부' : '세일즈팀',
            isAdmin: true
        };
        
        currentUser = defaultUser;
        localStorage.setItem('kbSecCurrentUser', JSON.stringify(currentUser));
        
        // 대시보드 페이지로 이동
        window.location.href = 'dashboard.html';
        return;
    }
    
    alert('아이디 또는 비밀번호가 일치하지 않습니다.');
}

// 회원가입 처리
function register() {
    const id = document.getElementById('register-id').value;
    const password = document.getElementById('register-password').value;
    const passwordConfirm = document.getElementById('register-password-confirm').value;
    const department = document.getElementById('register-department').value;
    
    // 유효성 검사
    if (!id || !password || !passwordConfirm || !department) {
        alert('모든 항목을 입력해주세요.');
        return;
    }
    
    if (password !== passwordConfirm) {
        alert('비밀번호가 일치하지 않습니다.');
        return;
    }
    
    if (users.some(u => u.id === id)) {
        alert('이미 사용 중인 아이디입니다.');
        return;
    }
    
    // 새 사용자 추가
    const newUser = {
        id,
        password,
        department,
        isAdmin: false
    };
    
    users.push(newUser);
    localStorage.setItem('kbSecUsers', JSON.stringify(users));
    
    alert('회원가입이 완료되었습니다. 로그인해주세요.');
    closeRegisterModal();
}

// 로그아웃 처리
function logout() {
    currentUser = null;
    localStorage.removeItem('kbSecCurrentUser');
    checkLoginStatus();
    alert('로그아웃되었습니다.');
}

// 연도별 계약 목록 로드
function loadContractsByYear(year) {
    if (!currentUser) return;
    
    // 모든 연도 링크에서 active 클래스 제거
    const yearLinks = document.querySelectorAll('#year-list a');
    yearLinks.forEach(link => link.classList.remove('active'));
    
    // 선택된 연도 링크에 active 클래스 추가
    const selectedYearLink = document.querySelector(`#year-list a[data-year="${year}"]`);
    if (selectedYearLink) {
        selectedYearLink.classList.add('active');
    }
    
    // 선택된 연도 표시
    document.getElementById('selected-year').textContent = year + '년 계약 목록';
    
    // 계약 목록 표시
    displayContracts(year);
}

// 계약 목록 표시
function displayContracts(year) {
    const contractList = document.getElementById('contract-list');
    contractList.innerHTML = '';
    
    if (!contracts[year] || contracts[year].length === 0) {
        const tr = document.createElement('tr');
        const td = document.createElement('td');
        td.colSpan = 6;
        td.textContent = '등록된 계약이 없습니다.';
        td.style.textAlign = 'center';
        tr.appendChild(td);
        contractList.appendChild(tr);
        return;
    }
    
    contracts[year].forEach(contract => {
        const tr = document.createElement('tr');
        
        const nameTd = document.createElement('td');
        nameTd.textContent = contract.name;
        tr.appendChild(nameTd);
        
        const companyTd = document.createElement('td');
        companyTd.textContent = contract.company;
        tr.appendChild(companyTd);
        
        const dateTd = document.createElement('td');
        dateTd.textContent = formatDate(contract.date);
        tr.appendChild(dateTd);
        
        const statusTd = document.createElement('td');
        statusTd.textContent = contract.status;
        tr.appendChild(statusTd);
        
        const managerTd = document.createElement('td');
        managerTd.textContent = contract.manager;
        tr.appendChild(managerTd);
        
        const actionTd = document.createElement('td');
        const detailBtn = document.createElement('button');
        detailBtn.textContent = '상세보기';
        detailBtn.className = 'detail-btn';
        detailBtn.addEventListener('click', function() {
            showContractDetailModal(contract.id, year);
        });
        actionTd.appendChild(detailBtn);
        tr.appendChild(actionTd);
        
        contractList.appendChild(tr);
    });
}

// 계약 추가 처리
function addContract() {
    if (!currentUser) return;
    
    const name = document.getElementById('contract-name').value;
    const company = document.getElementById('contract-company').value;
    const date = document.getElementById('contract-date').value;
    const status = document.getElementById('contract-status').value;
    const manager = document.getElementById('contract-manager').value;
    const details = document.getElementById('contract-details').value;
    
    // 날짜에서 연도 추출
    const year = new Date(date).getFullYear();
    
    // 유효성 검사
    if (!name || !company || !date || !status || !manager) {
        alert('필수 항목을 모두 입력해주세요.');
        return;
    }
    
    // 연도가 범위 내인지 확인 (2011-2025)
    if (year < 2011 || year > 2025) {
        alert('계약 날짜는 2011년부터 2025년 사이여야 합니다.');
        return;
    }
    
    // 해당 연도의 계약 배열이 없으면 초기화
    if (!contracts[year]) {
        contracts[year] = [];
    }
    
    // 새 계약 추가
    const newContract = {
        id: Date.now().toString(), // 고유 ID 생성
        name,
        company,
        date,
        status,
        manager,
        details,
        createdBy: currentUser.id,
        createdAt: new Date().toISOString()
    };
    
    contracts[year].push(newContract);
    localStorage.setItem('kbSecContracts', JSON.stringify(contracts));
    
    alert('계약이 추가되었습니다.');
    closeAddContractModal();
    loadContractsByYear(year);
    
    // 폼 초기화
    document.getElementById('add-contract-form').reset();
}

// 계약 수정
function editContract() {
    const modal = document.getElementById('contract-detail-modal');
    const contractId = modal.getAttribute('data-contract-id');
    const year = modal.getAttribute('data-contract-year');
    
    // 여기에 계약 수정 로직 구현 (간단하게 생략)
    alert('계약 수정 기능은 추후 업데이트 예정입니다.');
}

// 계약 삭제
function deleteContract() {
    if (!currentUser) return;
    
    const modal = document.getElementById('contract-detail-modal');
    const contractId = modal.getAttribute('data-contract-id');
    const year = modal.getAttribute('data-contract-year');
    
    if (confirm('정말로 이 계약을 삭제하시겠습니까?')) {
        contracts[year] = contracts[year].filter(c => c.id !== contractId);
        localStorage.setItem('kbSecContracts', JSON.stringify(contracts));
        
        closeContractDetailModal();
        loadContractsByYear(year);
        alert('계약이 삭제되었습니다.');
    }
}

// 계약 검색
function searchContracts() {
    const searchTerm = document.getElementById('search-input').value.toLowerCase();
    const yearLinks = document.querySelectorAll('#year-list a');
    let activeYear = 2025; // 기본값
    
    // 현재 활성화된 연도 찾기
    yearLinks.forEach(link => {
        if (link.classList.contains('active')) {
            activeYear = parseInt(link.getAttribute('data-year'));
        }
    });
    
    if (!contracts[activeYear]) return;
    
    // 검색어가 없으면 모든 계약 표시
    if (!searchTerm.trim()) {
        displayContracts(activeYear);
        return;
    }
    
    // 검색 결과 필터링
    const filteredContracts = contracts[activeYear].filter(contract => 
        contract.name.toLowerCase().includes(searchTerm) || 
        contract.company.toLowerCase().includes(searchTerm)
    );
    
    // 임시 배열로 결과 표시
    const tempContracts = {};
    tempContracts[activeYear] = filteredContracts;
    
    const originalContracts = contracts;
    contracts = tempContracts;
    displayContracts(activeYear);
    contracts = originalContracts; // 원래 데이터 복원
}

// 날짜 포맷팅 (YYYY-MM-DD)
function formatDate(dateString) {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
} 