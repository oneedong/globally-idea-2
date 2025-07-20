// Firebase 인증 상태 변경 감지
firebase.auth().onAuthStateChanged(function(user) {
    if (user) {
        // 사용자가 로그인한 상태
        console.log('로그인 상태:', user.uid);
        
        // 대시보드 페이지에 있지 않은 경우 리디렉션
        if (!window.location.href.includes('dashboard.html')) {
            window.location.href = 'dashboard.html';
        }
    } else {
        // 사용자가 로그아웃한 상태
        console.log('로그아웃 상태');
        
        // 대시보드 페이지에 있는 경우 로그인 페이지로 리디렉션
        if (window.location.href.includes('dashboard.html')) {
            window.location.href = 'index.html';
        }
    }
});

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
    
    // 회원가입 폼 이벤트 리스너
    const registerForm = document.getElementById('register-form');
    if (registerForm) {
        registerForm.addEventListener('submit', function(e) {
            e.preventDefault();
            register();
        });
    }
    
    // 회원가입 링크 클릭 이벤트
    const registerLink = document.getElementById('register-link');
    if (registerLink) {
        registerLink.addEventListener('click', function(e) {
            e.preventDefault();
            document.getElementById('login-form').style.display = 'none';
            document.getElementById('register-form').style.display = 'block';
        });
    }
    
    // 로그인 링크 클릭 이벤트
    const loginLink = document.getElementById('login-link');
    if (loginLink) {
        loginLink.addEventListener('click', function(e) {
            e.preventDefault();
            document.getElementById('register-form').style.display = 'none';
            document.getElementById('login-form').style.display = 'block';
        });
    }
    
    // 저장된 아이디가 있으면 입력
    const savedId = localStorage.getItem('kbSecSavedId');
    if (savedId) {
        const usernameInput = document.getElementById('username');
        const rememberIdCheckbox = document.getElementById('remember-id');
        
        if (usernameInput) usernameInput.value = savedId;
        if (rememberIdCheckbox) rememberIdCheckbox.checked = true;
    }
});

// 로그인 처리
function login() {
    console.log('로그인 시도');
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const department = document.getElementById('department-select').value;
    
    console.log('입력된 아이디:', username);
    console.log('선택된 부서:', department);
    
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
    
    // Firebase 이메일 인증 (username을 이메일 형식으로 변환)
    const email = `${username}@kb-contract-system.com`;
    
    firebase.auth().signInWithEmailAndPassword(email, password)
        .then((userCredential) => {
            // 로그인 성공
            const user = userCredential.user;
            console.log('Firebase 로그인 성공:', user.uid);
            
            // 사용자 정보 가져오기
            return firebase.firestore().collection('users').doc(user.uid).get();
        })
        .then((doc) => {
            if (doc.exists) {
                const userData = doc.data();
                console.log('사용자 데이터:', userData);
                
                // 부서 확인
                if (department && userData.department !== department) {
                    firebase.auth().signOut();
                    alert('선택한 부서가 일치하지 않습니다.');
                    return;
                }
                
                // 로컬 스토리지에 사용자 정보 저장
                localStorage.setItem('kbSecCurrentUser', JSON.stringify({
                    id: userData.username,
                    department: userData.department,
                    name: userData.name,
                    isAdmin: userData.isAdmin || false,
                    uid: user.uid
                }));
                
                // 대시보드로 이동
                window.location.href = 'dashboard.html';
            } else {
                console.log('사용자 데이터가 없음');
                firebase.auth().signOut();
                alert('사용자 정보를 찾을 수 없습니다.');
            }
        })
        .catch((error) => {
            console.error('로그인 오류:', error);
            
            // 오류 메시지 처리
            let errorMessage = '로그인에 실패했습니다.';
            if (error.code === 'auth/user-not-found') {
                errorMessage = '존재하지 않는 아이디입니다.';
            } else if (error.code === 'auth/wrong-password') {
                errorMessage = '비밀번호가 일치하지 않습니다.';
            } else if (error.code === 'auth/invalid-email') {
                errorMessage = '유효하지 않은 이메일 형식입니다.';
            } else if (error.code === 'auth/too-many-requests') {
                errorMessage = '너무 많은 로그인 시도로 인해 계정이 일시적으로 잠겼습니다. 잠시 후 다시 시도해주세요.';
            }
            
            alert(errorMessage);
        });
}

// 회원가입 처리
function register() {
    const name = document.getElementById('register-name').value;
    const username = document.getElementById('register-username').value;
    const password = document.getElementById('register-password').value;
    const confirmPassword = document.getElementById('register-confirm-password').value;
    const department = document.getElementById('register-department').value;
    
    // 유효성 검사
    if (!username || !password || !name || !department) {
        alert('모든 필드를 입력해주세요.');
        return;
    }
    
    if (password !== confirmPassword) {
        alert('비밀번호가 일치하지 않습니다.');
        return;
    }
    
    // Firebase 이메일 인증 (username을 이메일 형식으로 변환)
    const email = `${username}@kb-contract-system.com`;
    
    // 회원가입 처리
    firebase.auth().createUserWithEmailAndPassword(email, password)
        .then((userCredential) => {
            // 회원가입 성공
            const user = userCredential.user;
            console.log('Firebase 회원가입 성공:', user.uid);
            
            // Firestore에 사용자 정보 저장
            return firebase.firestore().collection('users').doc(user.uid).set({
                username: username,
                name: name,
                department: department,
                isAdmin: false,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });
        })
        .then(() => {
            console.log('사용자 정보 저장 완료');
            alert('회원가입이 완료되었습니다. 로그인해주세요.');
            
            // 로그아웃 처리
            return firebase.auth().signOut();
        })
        .then(() => {
            // 로그인 폼으로 전환
            document.getElementById('register-form').style.display = 'none';
            document.getElementById('login-form').style.display = 'block';
            
            // 폼 초기화
            document.getElementById('register-form').reset();
        })
        .catch((error) => {
            console.error('회원가입 오류:', error);
            
            // 오류 메시지 처리
            let errorMessage = '회원가입에 실패했습니다.';
            if (error.code === 'auth/email-already-in-use') {
                errorMessage = '이미 사용 중인 아이디입니다.';
            } else if (error.code === 'auth/invalid-email') {
                errorMessage = '유효하지 않은 이메일 형식입니다.';
            } else if (error.code === 'auth/weak-password') {
                errorMessage = '비밀번호가 너무 약합니다. 6자 이상의 비밀번호를 사용해주세요.';
            }
            
            alert(errorMessage);
        });
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