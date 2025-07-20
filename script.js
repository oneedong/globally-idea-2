// 사용자 데이터를 로컬 스토리지에 저장
let users = JSON.parse(localStorage.getItem('kbSecUsers')) || [];
let currentUser = JSON.parse(localStorage.getItem('kbSecCurrentUser')) || null;
let contracts = JSON.parse(localStorage.getItem('kbSecContracts')) || {};
let contractNumbers = JSON.parse(localStorage.getItem('kbSecContractNumbers')) || {};

// 페이지 로드 시 초기화
document.addEventListener('DOMContentLoaded', function() {
    // 회원가입 링크 이벤트 리스너
    const findIdPwElement = document.getElementById('find-id-pw');
    if (findIdPwElement) {
        findIdPwElement.addEventListener('click', function(e) {
            e.preventDefault();
            showRegisterModal();
        });
    }
    
    // 로그인 버튼 이벤트 리스너
    const loginButtonElement = document.getElementById('login-button');
    if (loginButtonElement) {
        loginButtonElement.addEventListener('click', function() {
            login();
        });
    }
    
    // 회원가입 폼 이벤트 리스너
    const registerFormElement = document.getElementById('register-form');
    if (registerFormElement) {
        registerFormElement.addEventListener('submit', function(e) {
            e.preventDefault();
            register();
        });
    }
    
    // 아이디 저장 기능
    const savedId = localStorage.getItem('kbSecSavedId');
    const loginIdElement = document.getElementById('login-id');
    if (savedId && loginIdElement) {
        loginIdElement.value = savedId;
        const saveIdElement = document.getElementById('save-id');
        if (saveIdElement) {
            saveIdElement.checked = true;
        }
    }
    
    // 엔터 키로 로그인
    const loginPasswordElement = document.getElementById('login-password');
    if (loginPasswordElement) {
        loginPasswordElement.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                login();
            }
        });
    }
    
    // 계약 상황 조회 버튼 이벤트 리스너
    const checkContractButtonElement = document.getElementById('check-contract-button');
    if (checkContractButtonElement) {
        checkContractButtonElement.addEventListener('click', function() {
            checkContractStatus();
        });
    }
    
    // 계약번호로 조회 시 엔터 키 이벤트
    const contractNumberElement = document.getElementById('contract-number');
    if (contractNumberElement) {
        contractNumberElement.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                checkContractStatus();
            }
        });
    }
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

// 계약 상태 조회 모달 닫기
function closeContractStatusModal() {
    document.getElementById('contract-status-modal').style.display = 'none';
}

// 계약 상태 조회
function checkContractStatus() {
    const contractNumber = document.getElementById('contract-number').value.trim();
    
    if (!contractNumber) {
        alert('계약번호를 입력해주세요.');
        return;
    }
    
    // 계약번호로 계약 정보 조회
    let foundContract = null;
    let contractYear = null;
    
    // 모든 연도의 계약을 검색
    for (const year in contracts) {
        if (contracts.hasOwnProperty(year)) {
            const foundInYear = contracts[year].find(contract => contract.contractNumber === contractNumber);
            if (foundInYear) {
                foundContract = foundInYear;
                contractYear = year;
                break;
            }
        }
    }
    
    if (foundContract) {
        // 계약 정보 표시
        document.getElementById('status-contract-number').textContent = foundContract.contractNumber;
        document.getElementById('status-contract-name').textContent = foundContract.name;
        document.getElementById('status-client-name').textContent = foundContract.company;
        document.getElementById('status-contract-date').textContent = formatDate(foundContract.date);
        
        // 계약 상태에 따라 진행 단계 표시
        let statusText = '';
        let statusStep = 1;
        
        switch(foundContract.status) {
            case '계약 체결':
                statusText = '계약이 체결되었습니다.';
                statusStep = 1;
                break;
            case '검토 중':
                statusText = '계약이 검토 중입니다.';
                statusStep = 2;
                break;
            case '완료':
                statusText = '계약이 완료되었습니다.';
                statusStep = 3;
                break;
            default:
                statusText = '계약이 체결되었습니다.';
                statusStep = 1;
        }
        
        document.getElementById('status-contract-status').textContent = statusText;
        
        // 진행 단계 표시
        const stepCircles = document.querySelectorAll('.step-circle');
        const progressLines = document.querySelectorAll('.progress-line');
        
        stepCircles.forEach((circle, index) => {
            if (index < statusStep) {
                circle.classList.add('active');
            } else {
                circle.classList.remove('active');
            }
        });
        
        progressLines.forEach((line, index) => {
            if (index < statusStep - 1) {
                line.classList.add('active');
            } else {
                line.classList.remove('active');
            }
        });
        
        // 모달 표시
        document.getElementById('contract-status-modal').style.display = 'block';
    } else {
        alert('해당 계약번호로 등록된 계약을 찾을 수 없습니다.');
    }
}

// 계약 추가 처리 - 계약번호 생성 기능 추가
function addContract() {
    if (!currentUser) return;
    
    const name = document.getElementById('add-contract-name').value;
    const company = document.getElementById('add-contract-company').value;
    const date = document.getElementById('add-contract-date').value;
    const status = document.getElementById('add-contract-status').value;
    const manager = document.getElementById('add-contract-manager').value;
    const details = document.getElementById('add-contract-details').value;
    
    if (!name || !company || !date || !status || !manager) {
        alert('필수 항목을 모두 입력해주세요.');
        return;
    }
    
    // 계약번호 생성
    const contractNumber = generateContractNumber(date);
    
    const contractDate = new Date(date);
    const year = contractDate.getFullYear();
    
    // 해당 연도의 계약 목록이 없으면 생성
    if (!contracts[year]) {
        contracts[year] = [];
    }
    
    // 새 계약 추가
    const newContract = {
        id: Date.now().toString(),
        name,
        company,
        date,
        status,
        manager,
        details,
        contractNumber, // 계약번호 추가
        files: []
    };
    
    contracts[year].push(newContract);
    localStorage.setItem('kbSecContracts', JSON.stringify(contracts));
    
    // 계약 목록 업데이트
    displayContracts(year);
    
    // 모달 닫기
    closeAddContractModal();
    
    // 폼 초기화
    document.getElementById('add-contract-form').reset();
    
    alert(`계약이 추가되었습니다.\n계약번호: ${contractNumber}`);
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

// 계약번호 생성 함수
function generateContractNumber(date) {
    const contractDate = new Date(date);
    const year = contractDate.getFullYear();
    const month = String(contractDate.getMonth() + 1).padStart(2, '0');
    const day = String(contractDate.getDate()).padStart(2, '0');
    
    // 해당 날짜의 일련번호 관리
    const dateKey = `${year}${month}${day}`;
    if (!contractNumbers[dateKey]) {
        contractNumbers[dateKey] = 0;
    }
    
    // 일련번호 증가
    contractNumbers[dateKey]++;
    const serialNumber = String(contractNumbers[dateKey]).padStart(3, '0');
    
    // 계약번호 형식: KB-YYYYMMDD-001
    const contractNumber = `KB-${year}${month}${day}-${serialNumber}`;
    
    // 일련번호 저장
    localStorage.setItem('kbSecContractNumbers', JSON.stringify(contractNumbers));
    
    return contractNumber;
} 