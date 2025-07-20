// 사용자 데이터를 로컬 스토리지에 저장
let currentUser = JSON.parse(localStorage.getItem('kbSecCurrentUser')) || null;
let contracts = {};
let contractNumbers = {};

// 전역 변수로 페이지네이션 상태 관리
let currentPage = 1;
const itemsPerPage = 30;

// 페이지 로드 시 실행
document.addEventListener('DOMContentLoaded', function() {
    console.log('대시보드 페이지 로드됨');
    
    // Firebase 인증 상태 확인
    firebase.auth().onAuthStateChanged(function(user) {
        if (user) {
            console.log('Firebase 인증 상태:', user.uid);
            // 사용자 정보 가져오기
            firebase.firestore().collection('users').doc(user.uid).get()
                .then((doc) => {
                    if (doc.exists) {
                        const userData = doc.data();
                        console.log('Firebase 사용자 데이터:', userData);
                        
                        // 로컬 스토리지에 사용자 정보 업데이트
                        currentUser = {
                            id: userData.username,
                            department: userData.department,
                            name: userData.name,
                            isAdmin: userData.isAdmin || false,
                            uid: user.uid
                        };
                        localStorage.setItem('kbSecCurrentUser', JSON.stringify(currentUser));
                        
                        // 사용자 이름 표시
                        document.getElementById('user-name').textContent = userData.name + ' (' + userData.department + ')';
                        
                        // 계약 데이터 로드
                        loadContractsFromFirestore();
                    } else {
                        console.log('사용자 데이터가 없음');
                        logout();
                    }
                })
                .catch((error) => {
                    console.error('사용자 데이터 로드 오류:', error);
                    logout();
                });
        } else {
            console.log('로그인되지 않음');
            window.location.href = 'index.html';
        }
    });
    
    // 이벤트 리스너 설정
    setupEventListeners();
});

// 이벤트 리스너 설정
function setupEventListeners() {
    // 로그아웃 버튼 이벤트 설정
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', logout);
    }
    
    // 계약 검색 이벤트 설정
    const searchBtn = document.getElementById('search-btn');
    if (searchBtn) {
        searchBtn.addEventListener('click', searchContracts);
    }
    
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
        searchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                searchContracts();
            }
        });
    }
    
    // 필터 적용 버튼 이벤트 설정
    const applyFiltersBtn = document.getElementById('apply-filters-btn');
    if (applyFiltersBtn) {
        applyFiltersBtn.addEventListener('click', applyFilters);
    }
    
    // 필터 초기화 버튼 이벤트 설정
    const resetFiltersBtn = document.getElementById('reset-filters-btn');
    if (resetFiltersBtn) {
        resetFiltersBtn.addEventListener('click', resetFilters);
    }
    
    // 계약 추가 버튼 이벤트 설정
    const addContractBtn = document.getElementById('add-contract-btn');
    if (addContractBtn) {
        addContractBtn.addEventListener('click', showAddContractModal);
    }
    
    // 계약 추가 모달 닫기 버튼 이벤트 설정
    const closeAddContractModalBtn = document.getElementById('close-add-contract-modal');
    if (closeAddContractModalBtn) {
        closeAddContractModalBtn.addEventListener('click', closeAddContractModal);
    }
    
    // 계약 추가 폼 제출 이벤트 설정
    const addContractForm = document.getElementById('add-contract-form');
    if (addContractForm) {
        addContractForm.addEventListener('submit', function(e) {
            e.preventDefault();
            addContract();
        });
    }
    
    // 계약 상세 모달 닫기 버튼 이벤트 설정
    const closeContractDetailModalBtn = document.getElementById('close-contract-detail-modal');
    if (closeContractDetailModalBtn) {
        closeContractDetailModalBtn.addEventListener('click', closeContractDetailModal);
    }
    
    // 계약 수정 버튼 이벤트 설정
    const editContractBtn = document.getElementById('edit-contract-btn');
    if (editContractBtn) {
        editContractBtn.addEventListener('click', function() {
            const modal = document.getElementById('contract-detail-modal');
            const contractId = modal.getAttribute('data-contract-id');
            const year = modal.getAttribute('data-contract-year');
            showEditContractModal(contractId, year);
        });
    }
    
    // 계약 삭제 버튼 이벤트 설정
    const deleteContractBtn = document.getElementById('delete-contract-btn');
    if (deleteContractBtn) {
        deleteContractBtn.addEventListener('click', function() {
            const modal = document.getElementById('contract-detail-modal');
            const contractId = modal.getAttribute('data-contract-id');
            const year = modal.getAttribute('data-contract-year');
            deleteContract(contractId, year);
        });
    }
    
    // 계약 수정 모달 닫기 버튼 이벤트 설정
    const closeEditContractModalBtn = document.getElementById('close-edit-contract-modal');
    if (closeEditContractModalBtn) {
        closeEditContractModalBtn.addEventListener('click', function() {
            document.getElementById('edit-contract-modal').style.display = 'none';
        });
    }
    
    // 계약 수정 폼 제출 이벤트 설정
    const editContractForm = document.getElementById('edit-contract-form');
    if (editContractForm) {
        editContractForm.addEventListener('submit', function(e) {
            e.preventDefault();
            updateContract();
        });
    }
    
    // 파일 업로드 영역 설정
    setupFileUploadArea();
}

// Firestore에서 계약 데이터 로드
function loadContractsFromFirestore() {
    console.log('Firestore에서 계약 데이터 로드 시작');
    
    // 계약 데이터 초기화
    contracts = {};
    
    // 계약 번호 데이터 로드
    firebase.firestore().collection('contractNumbers').doc('numbers').get()
        .then((doc) => {
            if (doc.exists) {
                contractNumbers = doc.data();
                console.log('계약 번호 데이터 로드 완료');
            } else {
                contractNumbers = {};
                console.log('계약 번호 데이터 없음, 초기화');
                
                // 계약 번호 데이터 생성
                firebase.firestore().collection('contractNumbers').doc('numbers').set({});
            }
        })
        .catch((error) => {
            console.error('계약 번호 데이터 로드 오류:', error);
            contractNumbers = {};
        });
    
    // 계약 데이터 로드
    firebase.firestore().collection('contracts')
        .where('department', '==', currentUser.department)
        .get()
        .then((querySnapshot) => {
            querySnapshot.forEach((doc) => {
                const contract = doc.data();
                const year = new Date(contract.date).getFullYear().toString();
                
                // 해당 연도의 배열이 없으면 초기화
                if (!contracts[year]) {
                    contracts[year] = [];
                }
                
                // 계약 데이터에 ID 추가
                contract.id = doc.id;
                
                // 계약 배열에 추가
                contracts[year].push(contract);
            });
            
            console.log('계약 데이터 로드 완료');
            
            // 연도 목록 생성
            createYearList();
            
            // 최신 연도 선택
            const years = Object.keys(contracts).sort((a, b) => b - a);
            if (years.length > 0) {
                loadContractsByYear(years[0]);
            } else {
                loadContractsByYear(new Date().getFullYear().toString());
            }
        })
        .catch((error) => {
            console.error('계약 데이터 로드 오류:', error);
        });
}

// 로그아웃 처리
function logout() {
    firebase.auth().signOut()
        .then(() => {
            localStorage.removeItem('kbSecCurrentUser');
            window.location.href = 'index.html';
        })
        .catch((error) => {
            console.error('로그아웃 오류:', error);
            alert('로그아웃 중 오류가 발생했습니다.');
        });
}

// 계약 추가 처리
function addContract() {
    console.log('계약 추가 시작');
    
    // 폼 데이터 가져오기
    const name = document.getElementById('add-contract-name').value;
    const type = document.getElementById('add-contract-type').value;
    const company = document.getElementById('add-contract-company').value;
    const date = document.getElementById('add-contract-date').value;
    const status = document.getElementById('add-contract-status').value;
    const details = document.getElementById('add-contract-details').value;
    const fileInput = document.getElementById('contract-file-input');
    
    // 필수 입력 확인
    if (!name || !company || !date) {
        alert('계약명, 거래 상대방, 체결일자는 필수 입력 항목입니다.');
        return;
    }
    
    // 계약 날짜에서 연도 추출
    const contractYear = new Date(date).getFullYear();
    
    // 해당 연도의 계약 배열이 없으면 초기화
    if (!contracts[contractYear]) {
        contracts[contractYear] = [];
    }
    
    // 계약 번호 생성
    const contractNumber = generateContractNumber(date);
    
    console.log('파일 입력 확인:', fileInput ? '있음' : '없음');
    console.log('파일 존재 확인:', fileInput && fileInput.files && fileInput.files.length > 0 ? '있음' : '없음');
    
    if (fileInput) {
        console.log('파일 입력 정보:', fileInput.id, fileInput.type, fileInput.files?.length);
    }
    
    // 계약 객체 생성 (기본 정보)
    const contract = {
        contractNumber: contractNumber,
        name: name,
        type: type,
        company: company,
        date: date,
        status: status,
        details: details,
        department: currentUser.department,
        createdBy: currentUser.uid,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    };
    
    // 파일 데이터 처리
    if (fileInput && fileInput.files && fileInput.files.length > 0) {
        const file = fileInput.files[0];
        console.log('파일 선택됨:', file.name, file.type, file.size);
        
        // 파일 유효성 검사
        if (!validateFile(file)) {
            return;
        }
        
        // 계약 ID 생성 (현재 시간 기준)
        const contractId = Date.now().toString();
        
        // 파일을 Base64로 인코딩하여 Firestore에 저장
        const reader = new FileReader();
        reader.onload = function(e) {
            // 파일 데이터 저장 (Base64 형식)
            contract.file = {
                name: file.name,
                type: file.type,
                size: file.size,
                data: e.target.result
            };
            
            // Firestore에 계약 정보 저장
            saveContractToFirestore(contract)
                .then(docRef => {
                    console.log('계약 추가 완료 (파일 포함):', docRef.id);
                    
                    // 계약 객체에 ID 추가
                    contract.id = docRef.id;
                    
                    // 계약 배열에 추가
                    contracts[contractYear].push(contract);
                    
                    // 모달 닫기
                    closeAddContractModal();
                    
                    // 현재 연도의 계약 목록 다시 로드
                    loadContractsByYear(contractYear.toString());
                    
                    // 성공 메시지
                    alert('계약이 추가되었습니다.');
                })
                .catch(error => {
                    console.error('계약 추가 오류:', error);
                    alert('계약 추가 중 오류가 발생했습니다.');
                });
        };
        
        reader.onerror = function(error) {
            console.error('파일 읽기 오류:', error);
            alert('파일 읽기 중 오류가 발생했습니다.');
        };
        
        // 파일을 Base64로 인코딩
        reader.readAsDataURL(file);
    } else {
        // 파일 없이 계약 추가
        saveContractToFirestore(contract)
            .then(docRef => {
                console.log('계약 추가 완료 (파일 없음):', docRef.id);
                
                // 계약 객체에 ID 추가
                contract.id = docRef.id;
                
                // 계약 배열에 추가
                contracts[contractYear].push(contract);
                
                // 모달 닫기
                closeAddContractModal();
                
                // 현재 연도의 계약 목록 다시 로드
                loadContractsByYear(contractYear.toString());
                
                // 성공 메시지
                alert('계약이 추가되었습니다.');
            })
            .catch(error => {
                console.error('계약 추가 오류:', error);
                alert('계약 추가 중 오류가 발생했습니다.');
            });
    }
}

// Firestore에 계약 정보 저장
function saveContractToFirestore(contract) {
    return firebase.firestore().collection('contracts').add(contract)
        .then(docRef => {
            console.log('Firestore에 계약 저장 완료:', docRef.id);
            
            // 계약 번호 데이터 업데이트
            return firebase.firestore().collection('contractNumbers').doc('numbers').set(contractNumbers, { merge: true })
                .then(() => {
                    console.log('계약 번호 데이터 업데이트 완료');
                    return docRef;
                });
        });
}

// 계약 수정 처리
function updateContract() {
    console.log('계약 수정 시작');
    
    // 수정할 계약 찾기
    const contractIndex = contracts[selectedYear].findIndex(c => c.id === contractId);
    if (contractIndex === -1) {
        console.error('수정할 계약을 찾을 수 없음');
        alert('수정할 계약을 찾을 수 없습니다.');
        return;
    }
    
    const oldContract = contracts[selectedYear][contractIndex];
    console.log('기존 계약 정보:', oldContract);
    
    // 폼 데이터 가져오기
    const name = document.getElementById('add-contract-name').value;
    const type = document.getElementById('add-contract-type').value;
    const company = document.getElementById('add-contract-company').value;
    const date = document.getElementById('add-contract-date').value;
    const status = document.getElementById('add-contract-status').value;
    const details = document.getElementById('add-contract-details').value;
    const fileInput = document.getElementById('contract-file-input');
    
    // 필수 입력 확인
    if (!name || !company || !date) {
        alert('계약명, 거래 상대방, 체결일자는 필수 입력 항목입니다.');
        return;
    }
    
    // 날짜에서 연도 추출
    const newYear = new Date(date).getFullYear();
    
    // 파일 데이터 처리
    if (fileInput && fileInput.files && fileInput.files.length > 0) {
        // 새 파일이 선택된 경우
        const file = fileInput.files[0];
        console.log('새 파일 선택됨:', file.name);
        
        // 파일 유효성 검사
        if (!validateFile(file)) {
            return;
        }
        
        // 파일 읽기
        const reader = new FileReader();
        reader.onload = function(e) {
            // 파일 데이터를 base64로 저장
            const fileData = {
                name: file.name,
                type: file.type,
                size: file.size,
                data: e.target.result
            };
            
            console.log('파일 데이터 생성 완료:', file.name);
            
            // 수정된 계약 객체
            const updatedContract = {
                ...oldContract,
                name: name,
                type: type,
                company: company,
                date: date,
                status: status,
                details: details,
                file: fileData,
                updatedAt: new Date().toISOString()
            };
            
            console.log('업데이트된 계약 정보:', updatedContract);
            console.log('파일 정보:', updatedContract.file ? updatedContract.file.name : '없음');
            finishUpdateContract(updatedContract, contractIndex, selectedYear, newYear);
        };
        
        reader.onerror = function(error) {
            console.error('파일 읽기 오류:', error);
            alert('파일 읽기 중 오류가 발생했습니다.');
        };
        
        // 파일을 base64로 읽기
        reader.readAsDataURL(file);
    } else {
        // 파일이 선택되지 않은 경우, 기존 파일 유지
        const updatedContract = {
            ...oldContract,
            name: name,
            type: type,
            company: company,
            date: date,
            status: status,
            details: details,
            updatedAt: new Date().toISOString()
        };
        
        console.log('기존 파일 유지, 업데이트된 계약 정보:', updatedContract);
        console.log('파일 정보:', updatedContract.file ? updatedContract.file.name : '없음');
        finishUpdateContract(updatedContract, contractIndex, selectedYear, newYear);
    }
}

// 계약 수정 완료 처리
function finishUpdateContract(updatedContract, contractIndex, oldYear, newYear) {
    console.log('계약 수정 완료 처리 시작');
    console.log('업데이트된 계약 정보:', updatedContract);
    console.log('파일 정보:', updatedContract.file);
    
    // 연도가 변경된 경우
    if (oldYear !== newYear) {
        // 기존 연도에서 계약 제거
        contracts[oldYear].splice(contractIndex, 1);
        
        // 새 연도 배열이 없으면 초기화
        if (!contracts[newYear]) {
            contracts[newYear] = [];
        }
        
        // 새 연도에 계약 추가
        contracts[newYear].push(updatedContract);
    } else {
        // 같은 연도 내에서 업데이트
        contracts[oldYear][contractIndex] = updatedContract;
    }
    
    // 로컬 스토리지에 저장
    localStorage.setItem('kbSecContracts', JSON.stringify(contracts));
    
    console.log('계약 수정 완료:', updatedContract);
    
    // 모달 닫기
    document.getElementById('add-contract-modal').style.display = 'none';
    
    // 현재 연도의 계약 목록 다시 로드
    loadContractsByYear(newYear);
    
    // 연도가 변경된 경우 이전 연도의 목록도 다시 로드
    if (oldYear !== newYear) {
        loadContractsByYear(oldYear);
    }
    
    // 성공 메시지
    alert('계약이 수정되었습니다.');
}

// 계약 상세 모달에서 수정 버튼 클릭 시 처리
function editContract() {
    console.log('계약 상세 모달에서 수정 버튼 클릭');
    
    try {
        const modal = document.getElementById('contract-detail-modal');
        const contractId = modal.getAttribute('data-contract-id');
        const year = modal.getAttribute('data-contract-year');
        
        if (!contractId || !year) {
            console.error('계약 ID 또는 연도 정보가 없습니다.');
            alert('수정할 계약 정보를 찾을 수 없습니다.');
            return;
        }
        
        console.log('수정할 계약 정보:', { contractId, year });
        
        // 상세 모달 닫기
        closeContractDetailModal();
        
        // 수정 모달 열기
        showEditContractModal(contractId, year);
    } catch (error) {
        console.error('계약 수정 버튼 처리 중 오류:', error);
        alert('계약 수정 버튼 처리 중 오류가 발생했습니다.');
    }
}

// 계약 삭제
function deleteContract(contractId, year) {
    console.log('계약 삭제 시작:', { contractId, year });
    
    try {
        // 계약 ID와 연도가 전달되지 않은 경우 모달에서 가져오기
        if (!contractId || !year) {
            const modal = document.getElementById('contract-detail-modal');
            contractId = modal.getAttribute('data-contract-id');
            year = modal.getAttribute('data-contract-year');
            
            if (!contractId || !year) {
                console.error('삭제할 계약 정보를 찾을 수 없음');
                alert('삭제할 계약 정보를 찾을 수 없습니다.');
                return;
            }
        }
        
        // 로컬 계약 데이터에서 계약 찾기
        const contractIndex = contracts[year].findIndex(c => c.id === contractId);
        if (contractIndex === -1) {
            console.error('삭제할 계약을 찾을 수 없음');
            alert('삭제할 계약을 찾을 수 없습니다.');
            return;
        }
        
        const contract = contracts[year][contractIndex];
        
        // 관리자이거나 자신의 부서 계약만 삭제 가능
        if (!currentUser.isAdmin && contract.department !== currentUser.department) {
            alert('권한이 없습니다.');
            return;
        }
        
        if (confirm('정말로 이 계약을 삭제하시겠습니까?')) {
            console.log('계약 삭제 확인됨');
            
            // Firestore에서 계약 삭제
            firebase.firestore().collection('contracts').doc(contractId).delete()
                .then(() => {
                    console.log('Firestore에서 계약 삭제 완료');
                    
                    // 로컬 계약 데이터에서 삭제
                    contracts[year].splice(contractIndex, 1);
                    
                    // 계약 목록 새로고침
                    loadContractsByYear(year);
                    
                    // 상세 모달이 열려있는 경우 닫기
                    closeContractDetailModal();
                    
                    alert('계약이 삭제되었습니다.');
                })
                .catch(error => {
                    console.error('계약 삭제 오류:', error);
                    alert('계약 삭제 중 오류가 발생했습니다.');
                });
        }
    } catch (error) {
        console.error('계약 삭제 처리 중 오류:', error);
        alert('계약 삭제 처리 중 오류가 발생했습니다.');
    }
}

// 계약 검색
function searchContracts() {
    const selectedYear = document.querySelector('#year-list a.active')?.getAttribute('data-year');
    if (!selectedYear) return;
    
    displayContracts(selectedYear);
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

// 파일 업로드 영역 설정
function setupFileUploadArea() {
    console.log('파일 업로드 영역 설정 시작');
    
    const fileArea = document.getElementById('add-contract-file-area');
    if (!fileArea) {
        console.error('파일 업로드 영역을 찾을 수 없음');
        return;
    }
    
    // 기존 파일 입력 요소 제거
    const oldFileInput = document.getElementById('contract-file-input');
    if (oldFileInput) {
        oldFileInput.remove();
    }
    
    // 파일 입력 요소 생성
    const fileInput = createFileInput();
    fileArea.appendChild(fileInput);
    
    // 계약명 입력 요소
    const contractNameInput = document.getElementById('add-contract-name');
    
    // 파일 선택 이벤트 처리
    fileInput.onchange = function(e) {
        if (this.files && this.files.length > 0) {
            const file = this.files[0];
            console.log('파일 선택됨:', file.name);
            
            // 파일 유효성 검사
            if (validateFile(file)) {
                // 파일 정보 표시
                displayFileInfo(fileArea, file);
                
                // 계약명 자동 입력
                if (contractNameInput && (!contractNameInput.value || contractNameInput.value.trim() === '')) {
                    const fileName = file.name.replace(/\.[^/.]+$/, "");
                    contractNameInput.value = fileName;
                    console.log('계약명 자동 입력:', fileName);
                }
            }
        }
    };
    
    // 드래그 앤 드롭 이벤트 처리
    fileArea.ondragover = function(e) {
        e.preventDefault();
        e.stopPropagation();
        this.classList.add('drag-over');
        console.log('드래그 오버');
        return false;
    };
    
    fileArea.ondragleave = function(e) {
        e.preventDefault();
        e.stopPropagation();
        this.classList.remove('drag-over');
        console.log('드래그 리브');
        return false;
    };
    
    fileArea.ondrop = function(e) {
        e.preventDefault();
        e.stopPropagation();
        this.classList.remove('drag-over');
        console.log('드롭 이벤트 발생');
        
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            const file = e.dataTransfer.files[0];
            console.log('파일 드롭됨:', file.name);
            
            // 파일 유효성 검사
            if (validateFile(file)) {
                try {
                    // DataTransfer 객체 생성
                    const dataTransfer = new DataTransfer();
                    dataTransfer.items.add(file);
                    
                    // 새 파일 입력 요소 생성
                    const newFileInput = createFileInput();
                    
                    // 파일 입력 요소에 파일 설정
                    newFileInput.files = dataTransfer.files;
                    
                    // 기존 파일 입력 요소 교체
                    fileInput.parentNode.replaceChild(newFileInput, fileInput);
                    
                    // 파일 정보 표시
                    displayFileInfo(fileArea, file);
                    
                    // 계약명 자동 입력
                    if (contractNameInput && (!contractNameInput.value || contractNameInput.value.trim() === '')) {
                        const fileName = file.name.replace(/\.[^/.]+$/, "");
                        contractNameInput.value = fileName;
                        console.log('계약명 자동 입력:', fileName);
                    }
                } catch (error) {
                    console.error('파일 드롭 처리 오류:', error);
                    alert('파일 업로드 중 오류가 발생했습니다.');
                    
                    // 대체 방법: 파일 정보만 표시하고 사용자에게 파일 선택 요청
                    fileArea.innerHTML = `
                        <div class="file-info">
                            <i class="fas fa-exclamation-triangle" style="color: #f57c00; font-size: 32px; margin-bottom: 8px;"></i>
                            <span class="file-name">파일을 다시 선택해주세요</span>
                        </div>
                    `;
                    
                    // 파일 입력 요소 추가
                    fileArea.appendChild(createFileInput());
                }
            }
        }
        
        return false;
    };
    
    // 클릭 이벤트 처리
    fileArea.onclick = function(e) {
        // 이미 input 요소를 클릭한 경우 중복 실행 방지
        if (e.target !== fileInput) {
            console.log('파일 영역 클릭됨');
            fileInput.click();
        }
    };
    
    console.log('파일 업로드 영역 설정 완료');
}

// 파일 유효성 검사
function validateFile(file) {
    console.log('파일 유효성 검사:', file.name);
    
    // 파일 확장자 확인
    const fileExt = file.name.split('.').pop().toLowerCase();
    const allowedExtensions = ['docx', 'doc', 'pdf', 'xls', 'xlsx', 'ppt', 'pptx', 'hwp', 'txt'];
    
    if (!allowedExtensions.includes(fileExt)) {
        alert('지원되는 파일 형식: docx, doc, pdf, xls, xlsx, ppt, pptx, hwp, txt');
        return false;
    }
    
    // 파일 크기 제한 (20MB)
    if (file.size > 20 * 1024 * 1024) {
        alert('파일 크기는 20MB를 초과할 수 없습니다.');
        return false;
    }
    
    console.log('파일 유효성 검사 통과');
    return true;
}

// 파일 정보 표시
function displayFileInfo(fileArea, file) {
    console.log('파일 정보 표시:', file.name);
    
    // 파일 아이콘 정보 가져오기
    const iconInfo = getFileIconInfo(file.name);
    
    // 파일 크기 포맷팅
    const fileSize = formatFileSize(file.size);
    
    // 파일 확장자 추출
    const fileExt = file.name.split('.').pop().toLowerCase();
    
    // 파일 정보 HTML 생성
    const fileInfoHtml = `
        <div class="file-info">
            <i class="${iconInfo.className}" style="color: ${iconInfo.color}; font-size: 38px; margin-bottom: 10px;"></i>
            <span class="file-name" style="font-weight: 500; font-size: 14px; margin-bottom: 5px; display: block; text-align: center;">${file.name}</span>
            <span class="file-ext" style="font-weight: bold; font-size: 12px; color: #0a2e5c; background-color: #f0f7ff; padding: 2px 6px; border-radius: 4px; margin-bottom: 5px;">${fileExt.toUpperCase()}</span>
            <span class="file-size" style="color: #666; font-size: 12px;">${fileSize}</span>
        </div>
    `;
    
    // 파일 영역에 정보 표시
    fileArea.innerHTML = fileInfoHtml;
    
    // 파일 입력 요소 추가 (숨김)
    const input = document.createElement('input');
    input.type = 'file';
    input.id = 'contract-file-input';
    input.className = 'file-upload-input';
    input.style.display = 'none';
    input.accept = '.docx,.doc,.pdf,.xls,.xlsx,.ppt,.pptx,.hwp,.txt';
    
    // 선택된 파일 설정
    try {
        // DataTransfer 객체를 사용하여 파일 설정
        const dataTransfer = new DataTransfer();
        dataTransfer.items.add(file);
        input.files = dataTransfer.files;
        console.log('파일 입력 요소에 파일 설정 완료:', file.name);
    } catch (error) {
        console.error('파일 설정 오류:', error);
    }
    
    fileArea.appendChild(input);
    console.log('파일 정보 표시 완료');
    
    return input;
}

// 파일 크기 포맷팅 함수
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// 파일 입력 요소 생성
function createFileInput() {
    const input = document.createElement('input');
    input.type = 'file';
    input.id = 'contract-file-input';
    input.className = 'file-upload-input';
    input.accept = '.docx,.doc,.pdf,.xls,.xlsx,.ppt,.pptx,.hwp,.txt';
    return input;
} 

// 파일 형식에 따른 아이콘 클래스와 색상 반환
function getFileIconInfo(fileName) {
    if (!fileName) return { className: 'far fa-file', color: '#aaa' };
    
    const ext = fileName.split('.').pop().toLowerCase();
    
    switch (ext) {
        case 'pdf':
            return { className: 'far fa-file-pdf', color: '#f40f02' }; // Adobe PDF 색상
        case 'doc':
        case 'docx':
            return { className: 'far fa-file-word', color: '#2b579a' }; // Microsoft Word 색상
        case 'xls':
        case 'xlsx':
            return { className: 'far fa-file-excel', color: '#217346' }; // Microsoft Excel 색상
        case 'ppt':
        case 'pptx':
            return { className: 'far fa-file-powerpoint', color: '#d24726' }; // Microsoft PowerPoint 색상
        case 'hwp':
            return { className: 'far fa-file-alt', color: '#0048ff' }; // 한글 파일 색상
        case 'txt':
            return { className: 'far fa-file-alt', color: '#333333' };
        case 'zip':
        case 'rar':
        case '7z':
            return { className: 'far fa-file-archive', color: '#ffa000' };
        case 'jpg':
        case 'jpeg':
        case 'png':
        case 'gif':
        case 'bmp':
            return { className: 'far fa-file-image', color: '#26a69a' };
        default:
            return { className: 'far fa-file', color: '#666' };
    }
} 

// 테이블 열 너비 조절 기능 초기화
function initializeTableResizing() {
    console.log('테이블 열 너비 조절 기능 초기화 시작');
    const table = document.getElementById('contract-table');
    if (!table) {
        console.error('테이블 요소를 찾을 수 없음');
        return;
    }
    
    const headers = table.querySelectorAll('th');
    if (headers.length === 0) {
        console.error('테이블 헤더를 찾을 수 없음');
        return;
    }
    
    console.log('테이블 헤더 수:', headers.length);
    
    // 이미 추가된 리사이저 제거
    const existingResizers = table.querySelectorAll('.column-resizer');
    existingResizers.forEach(resizer => resizer.remove());
    
    headers.forEach((header, index) => {
        if (index < headers.length - 1) { // 마지막 열에는 리사이저를 추가하지 않음
            // 리사이저 요소 생성
            const resizer = document.createElement('div');
            resizer.classList.add('column-resizer');
            resizer.style.position = 'absolute';
            resizer.style.right = '0';
            resizer.style.top = '0';
            resizer.style.width = '8px';
            resizer.style.height = '100%';
            resizer.style.cursor = 'col-resize';
            resizer.style.zIndex = '1';
            resizer.style.backgroundColor = 'transparent';
            
            // 헤더에 상대 위치 설정
            header.style.position = 'relative';
            header.appendChild(resizer);
            
            // 리사이저에 이벤트 리스너 추가
            let startX, startWidth, nextStartWidth;
            
            resizer.addEventListener('mousedown', function(e) {
                startX = e.pageX;
                startWidth = header.offsetWidth;
                
                // 다음 열의 시작 너비
                const nextHeader = headers[index + 1];
                if (nextHeader) {
                    nextStartWidth = nextHeader.offsetWidth;
                }
                
                // 마우스 이동 및 마우스 업 이벤트 추가
                document.addEventListener('mousemove', onMouseMove);
                document.addEventListener('mouseup', onMouseUp);
                
                // 텍스트 선택 방지
                e.preventDefault();
                
                // 리사이저 스타일 변경
                resizer.style.backgroundColor = 'rgba(0, 123, 255, 0.5)';
            });
            
            // 마우스 이동 이벤트 핸들러
            function onMouseMove(e) {
                const diffX = e.pageX - startX;
                
                // 현재 열 너비 조정
                const newWidth = Math.max(50, startWidth + diffX);
                header.style.width = newWidth + 'px';
                
                console.log('열 너비 조정:', index, newWidth);
                
                // 다음 열 너비 조정 (선택 사항)
                // const nextHeader = headers[index + 1];
                // if (nextHeader && nextStartWidth) {
                //     const newNextWidth = Math.max(50, nextStartWidth - diffX);
                //     nextHeader.style.width = newNextWidth + 'px';
                // }
            }
            
            // 마우스 업 이벤트 핸들러
            function onMouseUp() {
                document.removeEventListener('mousemove', onMouseMove);
                document.removeEventListener('mouseup', onMouseUp);
                
                // 리사이저 스타일 복원
                resizer.style.backgroundColor = 'transparent';
                
                // 열 너비 저장 (선택 사항)
                // localStorage.setItem('columnWidth_' + index, header.offsetWidth);
            }
            
            // 호버 효과
            resizer.addEventListener('mouseover', function() {
                this.style.backgroundColor = 'rgba(0, 123, 255, 0.3)';
            });
            
            resizer.addEventListener('mouseout', function() {
                if (!this.isResizing) {
                    this.style.backgroundColor = 'transparent';
                }
            });
        }
    });
    
    console.log('테이블 열 너비 조절 기능 초기화 완료');
} 

// 계약 저장 (수정하지 않고 저장만 하는 기능)
function saveContract(contract, year) {
    console.log('계약 저장 시작:', contract);
    
    try {
        // 저장할 계약 데이터 복사
        const savedContract = JSON.parse(JSON.stringify(contract));
        
        // 저장 시간 추가
        savedContract.savedAt = new Date().toISOString();
        
        // 로컬 스토리지에서 저장된 계약 목록 가져오기
        let savedContracts = JSON.parse(localStorage.getItem('kbSecSavedContracts')) || {};
        
        // 해당 연도의 저장된 계약 목록이 없으면 생성
        if (!savedContracts[year]) {
            savedContracts[year] = [];
        }
        
        // 이미 저장된 계약인지 확인
        const existingIndex = savedContracts[year].findIndex(c => c.id === savedContract.id);
        
        if (existingIndex !== -1) {
            // 이미 저장된 계약이면 업데이트
            savedContracts[year][existingIndex] = savedContract;
        } else {
            // 새로 저장
            savedContracts[year].push(savedContract);
        }
        
        // 로컬 스토리지에 저장
        localStorage.setItem('kbSecSavedContracts', JSON.stringify(savedContracts));
        
        console.log('계약 저장 완료');
        alert('계약이 저장되었습니다.');
    } catch (error) {
        console.error('계약 저장 중 오류:', error);
        alert('계약 저장 중 오류가 발생했습니다.');
    }
} 

// 모달에서 계약 저장 (수정하지 않고 저장만 하는 기능)
function saveContractFromModal(originalContract, year) {
    console.log('모달에서 계약 저장 시작');
    
    try {
        // 폼 데이터 가져오기
        const name = document.getElementById('add-contract-name').value;
        const type = document.getElementById('add-contract-type').value;
        const company = document.getElementById('add-contract-company').value;
        const date = document.getElementById('add-contract-date').value;
        const status = document.getElementById('add-contract-status').value;
        const details = document.getElementById('add-contract-details').value;
        const fileInput = document.getElementById('contract-file-input');
        
        // 필수 입력 확인
        if (!name || !company || !date) {
            alert('계약명, 거래 상대방, 체결일자는 필수 입력 항목입니다.');
            return;
        }
        
        // 저장할 계약 데이터 생성
        const savedContract = {
            ...originalContract,
            name: name,
            type: type,
            company: company,
            date: date,
            status: status,
            details: details,
            savedAt: new Date().toISOString()
        };
        
        // 파일 데이터 처리
        if (fileInput && fileInput.files && fileInput.files.length > 0) {
            // 새 파일이 선택된 경우
            const file = fileInput.files[0];
            console.log('새 파일 선택됨:', file.name);
            
            // 파일 읽기
            const reader = new FileReader();
            reader.onload = function(e) {
                // 파일 데이터를 base64로 저장
                savedContract.file = {
                    name: file.name,
                    type: file.type,
                    data: e.target.result
                };
                
                // 저장 완료
                finishSaveContractFromModal(savedContract, year);
            };
            
            // 파일을 base64로 읽기
            reader.readAsDataURL(file);
        } else {
            // 파일이 선택되지 않은 경우, 기존 파일 유지
            finishSaveContractFromModal(savedContract, year);
        }
    } catch (error) {
        console.error('계약 저장 중 오류:', error);
        alert('계약 저장 중 오류가 발생했습니다.');
    }
}

// 모달에서 계약 저장 완료 처리
function finishSaveContractFromModal(savedContract, year) {
    // 로컬 스토리지에서 저장된 계약 목록 가져오기
    let savedContracts = JSON.parse(localStorage.getItem('kbSecSavedContracts')) || {};
    
    // 해당 연도의 저장된 계약 목록이 없으면 생성
    if (!savedContracts[year]) {
        savedContracts[year] = [];
    }
    
    // 이미 저장된 계약인지 확인
    const existingIndex = savedContracts[year].findIndex(c => c.id === savedContract.id);
    
    if (existingIndex !== -1) {
        // 이미 저장된 계약이면 업데이트
        savedContracts[year][existingIndex] = savedContract;
    } else {
        // 새로 저장
        savedContracts[year].push(savedContract);
    }
    
    // 로컬 스토리지에 저장
    localStorage.setItem('kbSecSavedContracts', JSON.stringify(savedContracts));
    
    console.log('계약 저장 완료');
    alert('계약이 저장되었습니다.');
    
    // 모달 닫기
    closeAddContractModal();
} 

// 임시저장 처리
function tempSaveContract() {
    console.log('계약 임시저장 시작');
    
    // 폼 데이터 가져오기
    const name = document.getElementById('add-contract-name').value;
    const type = document.getElementById('add-contract-type').value;
    const company = document.getElementById('add-contract-company').value;
    const date = document.getElementById('add-contract-date').value;
    const status = document.getElementById('add-contract-status').value;
    const details = document.getElementById('add-contract-details').value;
    const fileInput = document.getElementById('contract-file-input');
    
    // 계약 ID 생성 (현재 시간 기준)
    const contractId = 'temp_' + Date.now().toString();
    
    // 임시저장 계약 객체 생성
    const tempContract = {
        id: contractId,
        name: name || '(제목 없음)',
        type: type || '',
        company: company || '',
        date: date || '',
        status: status || '',
        details: details || '',
        department: currentUser.department,
        createdAt: new Date().toISOString(),
        isTemp: true
    };
    
    // 파일 데이터 처리
    if (fileInput && fileInput.files && fileInput.files.length > 0) {
        const file = fileInput.files[0];
        
        // 파일 읽기
        const reader = new FileReader();
        reader.onload = function(e) {
            // 파일 데이터를 base64로 저장
            tempContract.file = {
                name: file.name,
                type: file.type,
                size: file.size,
                data: e.target.result
            };
            
            finishTempSave(tempContract);
        };
        
        // 파일을 base64로 읽기
        reader.readAsDataURL(file);
    } else {
        finishTempSave(tempContract);
    }
}

// 임시저장 완료 처리
function finishTempSave(tempContract) {
    // 로컬 스토리지에서 임시저장 계약 목록 가져오기
    let tempContracts = JSON.parse(localStorage.getItem('kbSecTempContracts')) || [];
    
    // 임시저장 계약 추가
    tempContracts.push(tempContract);
    
    // 로컬 스토리지에 저장
    localStorage.setItem('kbSecTempContracts', JSON.stringify(tempContracts));
    
    console.log('계약 임시저장 완료:', tempContract);
    
    // 모달 닫기
    document.getElementById('add-contract-modal').style.display = 'none';
    
    // 성공 메시지
    alert('계약이 임시저장되었습니다.');
} 

// 로컬 스토리지 초기화 함수
function resetLocalStorage() {
    console.log('로컬 스토리지 초기화 시작');
    
    // 기존 데이터 백업
    const oldContracts = localStorage.getItem('kbSecContracts');
    
    // 로컬 스토리지 초기화
    localStorage.removeItem('kbSecContracts');
    localStorage.removeItem('kbSecContractNumbers');
    
    // 초기 데이터 설정
    contracts = {};
    contractNumbers = {};
    
    console.log('로컬 스토리지 초기화 완료');
    
    // 현재 연도 계약 목록 다시 로드
    loadContractsByYear(new Date().getFullYear());
    
    alert('계약 데이터가 초기화되었습니다.');
}

// 로그인 체크 함수
function checkLogin() {
    console.log('로그인 체크');
    
    // 로컬 스토리지에서 현재 사용자 정보 로드
    const userData = localStorage.getItem('kbSecCurrentUser');
    if (userData) {
        currentUser = JSON.parse(userData);
        console.log('로그인 사용자:', currentUser.department);
        
        // 사용자 정보 표시
        document.getElementById('user-name').textContent = currentUser.department + ' 계정';
        
        // 연도 목록 생성 (2025년부터 15년 전까지)
        const yearList = document.getElementById('year-list');
        const currentYear = 2025;
        
        console.log('연도 목록 생성 시작');
        
        for (let i = 0; i < 15; i++) {
            const year = currentYear - i;
            const li = document.createElement('li');
            const a = document.createElement('a');
            a.href = '#';
            a.textContent = year + '년';
            a.setAttribute('data-year', year);
            a.addEventListener('click', function(e) {
                e.preventDefault();
                loadContractsByYear(year);
            });
            li.appendChild(a);
            yearList.appendChild(li);
            
            // 해당 연도의 계약 데이터가 없으면 초기화
            if (!contracts[year]) {
                contracts[year] = [];
            }
        }
        
        console.log('연도 목록 생성 완료');
        
        // 기본적으로 최신 연도(2025년) 계약 목록 로드
        loadContractsByYear(currentYear);
    } else {
        console.log('로그인되지 않음, 로그인 페이지로 이동');
        window.location.href = 'index.html';
    }
} 