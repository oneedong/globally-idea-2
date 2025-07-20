// 페이지 로드 시 초기화
document.addEventListener('DOMContentLoaded', function() {
    console.log('로그인 페이지 로드');
    
    // 로그인 폼 이벤트 리스너
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        console.log('로그인 폼 이벤트 리스너 등록');
        loginForm.addEventListener('submit', function(e) {
            e.preventDefault();
            console.log('폼 제출 이벤트 발생');
            login();
        });
    }
    
    // 회원가입 링크 클릭 이벤트
    const registerLink = document.getElementById('register-link');
    if (registerLink) {
        registerLink.addEventListener('click', function(e) {
            e.preventDefault();
            showRegisterModal();
        });
    }
    
    // 회원가입 모달 닫기 버튼 이벤트
    const closeRegisterModalBtn = document.getElementById('close-register-modal');
    if (closeRegisterModalBtn) {
        closeRegisterModalBtn.addEventListener('click', closeRegisterModal);
    }
    
    // 회원가입 폼 제출 이벤트
    const registerForm = document.getElementById('register-form');
    if (registerForm) {
        registerForm.addEventListener('submit', function(e) {
            e.preventDefault();
            register();
        });
    }
    
    // 계약 상태 조회 버튼 이벤트
    const checkContractBtn = document.querySelector('.check-contract-btn');
    if (checkContractBtn) {
        checkContractBtn.addEventListener('click', quickCheckContract);
    }
    
    // 계약 상태 조회 모달 닫기 버튼 이벤트
    const closeContractCheckModalBtn = document.getElementById('close-contract-check-modal');
    if (closeContractCheckModalBtn) {
        closeContractCheckModalBtn.addEventListener('click', closeContractCheckModal);
    }
    
    // 저장된 아이디가 있으면 입력
    const savedId = localStorage.getItem('kbSecSavedId');
    if (savedId) {
        const usernameInput = document.getElementById('login-id');
        const rememberIdCheckbox = document.getElementById('remember-id');
        
        if (usernameInput) usernameInput.value = savedId;
        if (rememberIdCheckbox) rememberIdCheckbox.checked = true;
    }
});

// 로그인 처리
function login() {
    console.log('로그인 시도');
    const username = document.getElementById('login-id').value;
    const password = document.getElementById('login-password').value;
    
    console.log('입력된 아이디:', username);
    
    // 유효성 검사
    if (!username || !password) {
        alert('아이디와 비밀번호를 입력해주세요.');
        return;
    }
    
    // 아이디 저장 처리
    const rememberIdCheckbox = document.getElementById('remember-id');
    if (rememberIdCheckbox && rememberIdCheckbox.checked) {
        localStorage.setItem('kbSecSavedId', username);
    } else {
        localStorage.removeItem('kbSecSavedId');
    }
    
    // 간단한 로그인 처리 (예시 계정)
    if (username === 'admin' && password === 'admin123') {
        // 로컬 스토리지에 사용자 정보 저장
        localStorage.setItem('kbSecCurrentUser', JSON.stringify({
            id: 'admin',
            department: '영업부',
            name: '관리자',
            isAdmin: true
        }));
        
        // 대시보드로 이동
        window.location.href = 'dashboard.html';
        return;
    }
    
    // 사용자 등록 여부 확인 (로컬 스토리지에서)
    const users = JSON.parse(localStorage.getItem('kbSecUsers')) || {};
    
    if (users[username]) {
        // 비밀번호 확인
        if (users[username].password === password) {
            // 로그인 성공
            localStorage.setItem('kbSecCurrentUser', JSON.stringify({
                id: username,
                department: users[username].department,
                name: users[username].name
            }));
            
            // 대시보드로 이동
            window.location.href = 'dashboard.html';
        } else {
            alert('비밀번호가 일치하지 않습니다.');
        }
    } else {
        alert('존재하지 않는 아이디입니다.');
    }
}

// 회원가입 처리
function register() {
    const department = document.getElementById('register-department').value;
    const username = document.getElementById('register-id').value;
    const password = document.getElementById('register-password').value;
    const confirmPassword = document.getElementById('register-password-confirm').value;
    
    // 유효성 검사
    if (!department || !username || !password) {
        alert('모든 필드를 입력해주세요.');
        return;
    }
    
    if (password !== confirmPassword) {
        alert('비밀번호가 일치하지 않습니다.');
        return;
    }
    
    // 사용자 데이터 가져오기
    const users = JSON.parse(localStorage.getItem('kbSecUsers')) || {};
    
    // 아이디 중복 확인
    if (users[username]) {
        alert('이미 사용 중인 아이디입니다.');
        return;
    }
    
    // 사용자 정보 저장
    users[username] = {
        department: department,
        name: username,
        password: password,
        createdAt: new Date().toISOString()
    };
    
    // 로컬 스토리지에 저장
    localStorage.setItem('kbSecUsers', JSON.stringify(users));
    
    alert('회원가입이 완료되었습니다. 로그인해주세요.');
    
    // 모달 닫기
    closeRegisterModal();
}

// 빠른 계약 상태 조회 (로그인 페이지에서)
function quickCheckContract() {
    console.log('계약 상태 조회 시도');
    const contractNumber = document.getElementById('quick-contract-number').value;
    
    if (!contractNumber) {
        alert('계약번호를 입력해주세요.');
        return;
    }
    
    // 계약 데이터 가져오기
    const allContracts = JSON.parse(localStorage.getItem('kbSecContracts')) || {};
    let foundContract = null;
    
    // 모든 연도의 계약 검색
    Object.values(allContracts).forEach(yearContracts => {
        const found = yearContracts.find(contract => contract.contractNumber === contractNumber);
        if (found) foundContract = found;
    });
    
    if (foundContract) {
        // 계약 정보 표시
        showContractCheckModal();
        displayContractInfo(foundContract);
    } else {
        alert('해당 계약번호의 계약을 찾을 수 없습니다.');
    }
}

// 계약 정보 표시
function displayContractInfo(contract) {
    const contractInfo = document.getElementById('contract-info');
    if (!contractInfo) return;
    
    contractInfo.innerHTML = `
        <p><strong>계약번호:</strong> ${contract.contractNumber || '없음'}</p>
        <p><strong>계약명:</strong> ${contract.name || '없음'}</p>
        <p><strong>계약 종류:</strong> ${contract.type || '없음'}</p>
        <p><strong>거래 상대방:</strong> ${contract.company || '없음'}</p>
        <p><strong>체결일자:</strong> ${formatDate(contract.date) || '없음'}</p>
        <p><strong>체결 현황:</strong> ${contract.status || '없음'}</p>
    `;
    
    // 진행 상태 표시
    updateProgressBar(contract.status);
}

// 진행 상태 표시
function updateProgressBar(status) {
    const step1 = document.getElementById('step1');
    const step2 = document.getElementById('step2');
    const step3 = document.getElementById('step3');
    const line1 = document.getElementById('line1');
    const line2 = document.getElementById('line2');
    
    // 초기화
    step1.classList.remove('active');
    step2.classList.remove('active');
    step3.classList.remove('active');
    line1.classList.remove('active');
    line2.classList.remove('active');
    
    // 상태에 따라 진행 상태 표시
    if (status === '법무검토 완료') {
        step1.classList.add('active');
    } else if (status === '체결 진행중') {
        step1.classList.add('active');
        step2.classList.add('active');
        line1.classList.add('active');
    } else if (status === '체결 완료') {
        step1.classList.add('active');
        step2.classList.add('active');
        step3.classList.add('active');
        line1.classList.add('active');
        line2.classList.add('active');
    }
}

// 날짜 포맷팅
function formatDate(dateString) {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    
    return `${year}-${month}-${day}`;
}

// 회원가입 모달 표시
function showRegisterModal() {
    document.getElementById('register-modal').style.display = 'block';
}

// 회원가입 모달 닫기
function closeRegisterModal() {
    document.getElementById('register-modal').style.display = 'none';
}

// 계약 상태 조회 모달 표시
function showContractCheckModal() {
    document.getElementById('contract-check-modal').style.display = 'block';
}

// 계약 상태 조회 모달 닫기
function closeContractCheckModal() {
    document.getElementById('contract-check-modal').style.display = 'none';
} 