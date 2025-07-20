// 사용자 데이터 초기화
let users = [
    { id: 'admin', password: 'admin', department: '관리자', isAdmin: true },
    { id: 'legal', password: 'legal', department: '법무팀', isAdmin: false },
    { id: 'sales1', password: 'sales1', department: '영업1팀', isAdmin: false },
    { id: 'sales2', password: 'sales2', department: '영업2팀', isAdmin: false },
    { id: 'sales3', password: 'sales3', department: '영업3팀', isAdmin: false }
];

// 로컬 스토리지에 사용자 데이터 저장 (최초 1회만)
if (!localStorage.getItem('kbSecUsers')) {
    localStorage.setItem('kbSecUsers', JSON.stringify(users));
} else {
    // 로컬 스토리지에서 사용자 데이터 가져오기
    users = JSON.parse(localStorage.getItem('kbSecUsers'));
}

// 샘플 계약 데이터 초기화
let sampleContracts = {
    "2023": [
        {
            id: "1",
            contractNumber: "KB-20230101-001",
            name: "시스템 유지보수 계약",
            type: "유지보수",
            company: "테크솔루션",
            date: "2023-01-15",
            status: "체결 완료",
            manager: "김영업"
        }
    ],
    "2024": [
        {
            id: "2",
            contractNumber: "KB-20240305-001",
            name: "소프트웨어 라이센스 계약",
            type: "라이센스",
            company: "소프트코리아",
            date: "2024-03-05",
            status: "법무검토 완료",
            manager: "박담당"
        },
        {
            id: "3",
            contractNumber: "KB-20240610-001",
            name: "클라우드 서비스 계약",
            type: "서비스",
            company: "클라우드테크",
            date: "2024-06-10",
            status: "체결 진행중",
            manager: "이매니저"
        }
    ]
};

// 로컬 스토리지에 샘플 계약 데이터 저장
if (!localStorage.getItem('kbSecContracts')) {
    localStorage.setItem('kbSecContracts', JSON.stringify(sampleContracts));
}

// 페이지 로드 시 초기화
document.addEventListener('DOMContentLoaded', function() {
    console.log('로그인 페이지 로드');
    
    // 로그인 폼 이벤트 리스너 (폼 제출 방식)
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        console.log('로그인 폼 이벤트 리스너 등록');
        loginForm.addEventListener('submit', function(e) {
            e.preventDefault();
            console.log('폼 제출 이벤트 발생');
            login();
        });
    }
    
    // 로그인 버튼 클릭 이벤트는 제거 (폼 제출 이벤트로 처리)
    
    // 회원가입 폼 이벤트 리스너
    const registerForm = document.getElementById('register-form');
    if (registerForm) {
        registerForm.addEventListener('submit', function(e) {
            e.preventDefault();
            register();
        });
    }
    
    // 계약 조회 버튼 클릭 이벤트 - 직접 이벤트 추가
    const checkContractBtn = document.querySelector('.check-contract-btn');
    if (checkContractBtn) {
        checkContractBtn.addEventListener('click', function(e) {
            e.preventDefault();
            quickCheckContract();
        });
    }
    
    // 엔터키로 계약 조회
    const quickContractNumber = document.getElementById('quick-contract-number');
    if (quickContractNumber) {
        quickContractNumber.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                quickCheckContract();
            }
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
        closeRegisterModalBtn.addEventListener('click', function() {
            closeRegisterModal();
        });
    }
    
    // 계약 상태 조회 모달 닫기 버튼 이벤트
    const closeContractCheckModalBtn = document.getElementById('close-contract-check-modal');
    if (closeContractCheckModalBtn) {
        closeContractCheckModalBtn.addEventListener('click', function() {
            closeContractCheckModal();
        });
    }
    
    // 저장된 아이디가 있으면 입력
    const savedId = localStorage.getItem('kbSecSavedId');
    if (savedId) {
        const loginIdInput = document.getElementById('login-id');
        const rememberIdCheckbox = document.getElementById('remember-id');
        
        if (loginIdInput) loginIdInput.value = savedId;
        if (rememberIdCheckbox) rememberIdCheckbox.checked = true;
    }
});

// 로그인 처리
function login() {
    console.log('로그인 시도');
    const id = document.getElementById('login-id').value;
    const password = document.getElementById('login-password').value;
    
    console.log('입력된 아이디:', id);
    console.log('입력된 비밀번호:', password);
    
    // 사용자 데이터 가져오기
    let users;
    try {
        users = JSON.parse(localStorage.getItem('kbSecUsers')) || [];
        console.log('저장된 사용자 목록:', users);
    } catch (error) {
        console.error('사용자 데이터 파싱 오류:', error);
        users = [];
    }
    
    // 사용자 데이터가 없으면 기본 사용자 추가
    if (!users || users.length === 0) {
        console.log('사용자 데이터가 없어 기본 사용자 추가');
        users = [
            { id: 'admin', password: 'admin', department: '관리자', isAdmin: true },
            { id: 'legal', password: 'legal', department: '법무팀', isAdmin: false },
            { id: 'sales1', password: 'sales1', department: '영업1팀', isAdmin: false },
            { id: 'sales2', password: 'sales2', department: '영업2팀', isAdmin: false },
            { id: 'sales3', password: 'sales3', department: '영업3팀', isAdmin: false }
        ];
        localStorage.setItem('kbSecUsers', JSON.stringify(users));
    }
    
    // 아이디 저장 처리
    const rememberIdCheckbox = document.getElementById('remember-id');
    if (rememberIdCheckbox && rememberIdCheckbox.checked) {
        localStorage.setItem('kbSecSavedId', id);
    } else {
        localStorage.removeItem('kbSecSavedId');
    }
    
    // 사용자 확인 - 부서 체크 없이 아이디와 비밀번호만 확인
    const user = users.find(u => u.id === id && u.password === password);
    console.log('찾은 사용자:', user);
    
    if (user) {
        // 로그인 성공
        console.log('로그인 성공!');
        localStorage.setItem('kbSecCurrentUser', JSON.stringify(user));
        window.location.href = 'dashboard.html';
    } else {
        // 로그인 실패
        console.log('로그인 실패!');
        alert('아이디 또는 비밀번호가 일치하지 않습니다.');
    }
}

// 회원가입 처리
function register() {
    const id = document.getElementById('register-id').value;
    const password = document.getElementById('register-password').value;
    const passwordConfirm = document.getElementById('register-password-confirm').value;
    const department = document.getElementById('register-department').value;
    
    // 유효성 검사
    if (!id || !password || !department) {
        alert('모든 필드를 입력해주세요.');
        return;
    }
    
    if (password !== passwordConfirm) {
        alert('비밀번호가 일치하지 않습니다.');
        return;
    }
    
    // 아이디 중복 확인
    if (users.some(user => user.id === id)) {
        alert('이미 사용 중인 아이디입니다.');
        return;
    }
    
    // 새 사용자 추가
    const newUser = {
        id: id,
        password: password,
        department: department,
        isAdmin: false
    };
    
    users.push(newUser);
    localStorage.setItem('kbSecUsers', JSON.stringify(users));
    
    alert('회원가입이 완료되었습니다. 로그인해주세요.');
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
        const contractInfo = document.getElementById('contract-info');
        contractInfo.innerHTML = `
            <p><strong>계약번호:</strong> ${foundContract.contractNumber}</p>
            <p><strong>계약명:</strong> ${foundContract.name}</p>
            <p><strong>계약 종류:</strong> ${foundContract.type || '-'}</p>
            <p><strong>거래 상대방:</strong> ${foundContract.company}</p>
            <p><strong>체결일자:</strong> ${formatDate(foundContract.date)}</p>
            <p><strong>체결 현황:</strong> ${foundContract.status}</p>
        `;
        
        // 진행 상태 표시
        updateProgressBar(foundContract.status);
        
        // 모달 표시
        document.getElementById('contract-check-modal').style.display = 'block';
    } else {
        alert('해당 계약번호의 계약을 찾을 수 없습니다.');
    }
}

// 계약 상태 조회
function checkContractStatus() {
    const contractNumber = document.getElementById('contract-number').value;
    
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
        const contractInfo = document.getElementById('contract-info');
        contractInfo.innerHTML = `
            <p><strong>계약번호:</strong> ${foundContract.contractNumber}</p>
            <p><strong>계약명:</strong> ${foundContract.name}</p>
            <p><strong>계약 종류:</strong> ${foundContract.type || '-'}</p>
            <p><strong>거래 상대방:</strong> ${foundContract.company}</p>
            <p><strong>체결일자:</strong> ${formatDate(foundContract.date)}</p>
            <p><strong>체결 현황:</strong> ${foundContract.status}</p>
        `;
        
        // 진행 상태 표시
        updateProgressBar(foundContract.status);
        
        // 결과 표시
        document.getElementById('contract-check-result').style.display = 'block';
    } else {
        alert('해당 계약번호의 계약을 찾을 수 없습니다.');
        document.getElementById('contract-check-result').style.display = 'none';
    }
}

// 진행 상태 표시 업데이트
function updateProgressBar(status) {
    const step1 = document.getElementById('step1');
    const step2 = document.getElementById('step2');
    const step3 = document.getElementById('step3');
    const line1 = document.getElementById('line1');
    const line2 = document.getElementById('line2');
    
    // 모든 단계 초기화
    step1.classList.remove('active');
    step2.classList.remove('active');
    step3.classList.remove('active');
    line1.classList.remove('active');
    line2.classList.remove('active');
    
    // 상태에 따라 활성화
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

// 날짜 포맷팅 (YYYY-MM-DD 또는 YYYY-MM)
function formatDate(dateString) {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    
    // 일자가 1일(기본값)인 경우 연-월 형식으로 표시
    if (date.getDate() === 1 && dateString.length <= 7) {
        return `${year}-${month}`;
    }
    
    // 그 외의 경우 연-월-일 형식으로 표시
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