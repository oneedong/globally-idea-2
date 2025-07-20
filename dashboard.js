// 사용자 데이터를 로컬 스토리지에 저장
let users = JSON.parse(localStorage.getItem('kbSecUsers')) || [];
let currentUser = JSON.parse(localStorage.getItem('kbSecCurrentUser')) || null;
let contracts = JSON.parse(localStorage.getItem('kbSecContracts')) || {};

// 페이지 로드 시 초기화
document.addEventListener('DOMContentLoaded', function() {
    console.log('페이지 로드 시작');
    
    // 로그인 확인
    if (!currentUser) {
        console.log('로그인되지 않음, 로그인 페이지로 이동');
        window.location.href = 'index.html';
        return;
    }
    
    console.log('로그인 사용자:', currentUser.department);
    
    // 사용자 정보 표시
    document.getElementById('user-name').textContent = currentUser.department + ' 계정';
    
    // 연도 목록 생성 (2025년부터 15년 전까지)
    const yearList = document.getElementById('year-list');
    const currentYear = 2025;
    
    console.log('연도 목록 생성 시작');
    
    // 기존 이벤트 리스너 제거 (중복 방지)
    const oldForm = document.getElementById('add-contract-form');
    const newForm = oldForm.cloneNode(true);
    oldForm.parentNode.replaceChild(newForm, oldForm);
    
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
    
    // 계약 추가 폼 이벤트 리스너
    document.getElementById('add-contract-form').addEventListener('submit', function(e) {
        e.preventDefault();
        console.log('계약 추가 폼 제출');
        addContract();
    });
    
    // 파일 업로드 영역 드래그 앤 드롭 이벤트 설정
    setupFileUploadArea();
    
    // 기본적으로 최신 연도(2025년) 계약 목록 로드
    loadContractsByYear(currentYear);
    
    console.log('페이지 로드 완료');
});

// 로그아웃 처리
function logout() {
    localStorage.removeItem('kbSecCurrentUser');
    window.location.href = 'index.html';
}

// 연도별 계약 목록 로드
function loadContractsByYear(year) {
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
    
    // 필터 옵션 업데이트
    updateFilterOptions(year);
    
    // 계약 목록 표시
    displayContracts(year);
}

// 필터 옵션 업데이트
function updateFilterOptions(year) {
    const contractsForYear = contracts[year] || [];
    
    // 계약명 필터 옵션 업데이트
    const nameFilter = document.getElementById('filter-name');
    nameFilter.innerHTML = '<option value="">전체</option>';
    
    // 거래 상대방 필터 옵션 업데이트
    const companyFilter = document.getElementById('filter-company');
    companyFilter.innerHTML = '<option value="">전체</option>';
    
    // 중복 제거를 위한 Set 생성
    const nameSet = new Set();
    const companySet = new Set();
    
    // 각 계약에서 고유한 값 추출
    contractsForYear.forEach(contract => {
        if (contract.name) nameSet.add(contract.name);
        if (contract.company) companySet.add(contract.company);
    });
    
    // 계약명 옵션 추가
    nameSet.forEach(name => {
        const option = document.createElement('option');
        option.value = name;
        option.textContent = name;
        nameFilter.appendChild(option);
    });
    
    // 거래 상대방 옵션 추가
    companySet.forEach(company => {
        const option = document.createElement('option');
        option.value = company;
        option.textContent = company;
        companyFilter.appendChild(option);
    });
}

// 필터 적용
function applyFilters() {
    const selectedYear = document.querySelector('#year-list a.active')?.getAttribute('data-year');
    if (!selectedYear) return;
    
    displayContracts(selectedYear);
}

// 필터 초기화
function resetFilters() {
    document.getElementById('filter-name').value = '';
    document.getElementById('filter-company').value = '';
    document.getElementById('filter-status').value = '';
    document.getElementById('search-input').value = '';
    
    const selectedYear = document.querySelector('#year-list a.active')?.getAttribute('data-year');
    if (selectedYear) {
        displayContracts(selectedYear);
    }
}

// 계약 목록 표시
function displayContracts(year) {
    const contractList = document.getElementById('contract-list');
    contractList.innerHTML = '';
    
    // 관리자는 모든 계약을 볼 수 있고, 일반 사용자는 자신의 부서 계약만 볼 수 있음
    let filteredContracts = [];
    
    if (currentUser.isAdmin) {
        filteredContracts = contracts[year] || [];
    } else {
        filteredContracts = (contracts[year] || []).filter(contract => 
            contract.department === currentUser.department
        );
    }
    
    // 필터 적용
    const nameFilter = document.getElementById('filter-name').value;
    const companyFilter = document.getElementById('filter-company').value;
    const statusFilter = document.getElementById('filter-status').value;
    const searchQuery = document.getElementById('search-input').value.toLowerCase();
    
    if (nameFilter || companyFilter || statusFilter || searchQuery) {
        filteredContracts = filteredContracts.filter(contract => {
            const matchesName = !nameFilter || contract.name === nameFilter;
            const matchesCompany = !companyFilter || contract.company === companyFilter;
            const matchesStatus = !statusFilter || contract.status === statusFilter;
            const matchesSearch = !searchQuery || 
                contract.name.toLowerCase().includes(searchQuery) || 
                contract.company.toLowerCase().includes(searchQuery) ||
                contract.status.toLowerCase().includes(searchQuery);
                
            return matchesName && matchesCompany && matchesStatus && matchesSearch;
        });
    }
    
    if (filteredContracts.length === 0) {
        const tr = document.createElement('tr');
        const td = document.createElement('td');
        td.colSpan = 8; // 컬럼 수 증가 (번호 열 추가)
        td.textContent = '등록된 계약이 없습니다.';
        td.style.textAlign = 'center';
        tr.appendChild(td);
        contractList.appendChild(tr);
        return;
    }
    
    // 번호 매기기를 위해 정렬 (최신 등록순)
    filteredContracts.sort((a, b) => {
        return new Date(b.createdAt) - new Date(a.createdAt);
    });
    
    // 계약 목록 표시
    filteredContracts.forEach((contract, index) => {
        const tr = document.createElement('tr');
        
        // 번호 열 추가
        const noTd = document.createElement('td');
        noTd.textContent = index + 1;
        tr.appendChild(noTd);
        
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
        
        // 파일 열 생성
        const fileTd = document.createElement('td');
        
        if (contract.file) {
            // 파일이 이미 있는 경우 파일 아이콘만 표시
            const fileContainer = document.createElement('div');
            fileContainer.className = 'file-container';
            fileContainer.style.cursor = 'pointer';
            fileContainer.title = contract.file.name; // 파일명은 툴팁으로 표시
            
            // 파일 아이콘 생성
            const fileIcon = document.createElement('img');
            fileIcon.className = 'file-icon';
            
            if (contract.file.name.endsWith('.docx')) {
                fileIcon.src = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAzODQgNTEyIj48cGF0aCBmaWxsPSIjMmI1NzlhIiBkPSJNMzY1LjMgOTMuMzhsLTc0LjYzLTc0LjY0QzI3OC42IDYuNzQyIDI2Mi4zIDAgMjQ1LjQgMEg2NEMyOC42NSAwIDAgMjguNjUgMCA2NFY0NDhjMCAzNS4zNCAyOC42NSA2NCA2NCA2NEgzMjBjMzUuMzUgMCA2NC0yOC42NiA2NC02NFYxMjEuNkMzODQgMTA0LjggMzc3LjMgODguMzYgMzY1LjMgOTMuMzh6TTMzNiAxMjhINTZWNjRIMjQwdjQ4QzI0MCA1OS4zOSAyNDcuNCAxMjggMzM2IDEyOHpNMzA0IDQxNkgxNDRWMzc2aDE2MFY0MTZ6TTI0MCAzNDRIMTQ0VjMwNGg5NlYzNDR6TTI0MCAyNzJIMTQ0VjIzMmg5NlYyNzJ6Ii8+PC9zdmc+';
            } else if (contract.file.name.endsWith('.pdf')) {
                fileIcon.src = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAzODQgNTEyIj48cGF0aCBmaWxsPSIjZjQwZjAyIiBkPSJNMTgxLjkgMjU2LjFjLTUtOS43LTgtMTcuNy04LTI2LjRjMC0zOC4xIDM1LjItNTEuMSA0MS4yLTU0LjZjMS43LS45IDIuNy0yLjggMi43LTQuOFYxMjRIMTI4djI1LjNjMCAyLjgtMS40IDUuNS0zLjggNy4yYy0yLjQgMS42LTUuNCAyLjItOC4yIDEuMmMtOS4xLTMuMy0yMS4yLTYuNy0yOS4zLTYuN0M0OC4zIDE1MSAzMiAxNjYuNiAzMiAxODUuN2MwIDM5LjEgNDMuMiA1Ni45IDc1LjEgNjUuMWMyMi4zIDUuNyAyMyAxOC42IDIzIDIwLjhjMCA1LjEtMi4xIDEyLjUtOS42IDI1LjVjLTEuNCAyLjUtMS44IDUuNS0xIDguM2MuOCAyLjggMi43IDUuMiA1LjMgNi41YzIuOSAxLjUgNy40IDMuOCAxNC44IDMuOGMxNS42IDAgMzcuMS0xMC41IDU4LjUtMzkuMWMyMS40LTI4LjYgNDAuNi02Ni41IDQwLjYtNjYuNWM4LjEtMTguNSAyNC40LTI5LjEgMjQuNC01Ny41QzI2My4yIDEyNS45IDIwNy4zIDkzLjYgMTgxLjkgMjU2LjF6TTM2NS4zIDkzLjM4bC03NC42My03NC42NEMyNzguNiA2Ljc0MiAyNjIuMyAwIDI0NS40IDBINjRDMjguNjUgMCAwIDI4LjY1IDAgNjRWNDQ4YzAgMzUuMzQgMjguNjUgNjQgNjQgNjRIMzIwYzM1LjM1IDAgNjQtMjguNjYgNjQtNjRWMTIxLjZDMzg0IDEwNC44IDM3Ny4zIDg4LjM2IDM2NS4zIDkzLjM4ek0zMzYgNDQ4YzAgOC44MzYtNy4xNjQgMTYtMTYgMTZINjRjLTguODM2IDAtMTYtNy4xNjQtMTYtMTZWNjRjMC04LjgzOCA3LjE2NC0xNiAxNi0xNkgyNDV2NDhDMjQ1IDExMi44IDI2MS4yIDEyOCAyNzIgMTI4SDMzNlY0NDh6Ii8+PC9zdmc+';
            } else {
                fileIcon.src = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAzODQgNTEyIj48cGF0aCBmaWxsPSIjNjY2IiBkPSJNMzY1LjMgOTMuMzhsLTc0LjYzLTc0LjY0QzI3OC42IDYuNzQyIDI2Mi4zIDAgMjQ1LjQgMEg2NEMyOC42NSAwIDAgMjguNjUgMCA2NFY0NDhjMCAzNS4zNCAyOC42NSA2NCA2NCA2NEgzMjBjMzUuMzUgMCA2NC0yOC42NiA2NC02NFYxMjEuNkMzODQgMTA0LjggMzc3LjMgODguMzYgMzY1LjMgOTMuMzh6TTMzNiA0NDhjMCA4LjgzNi03LjE2NCAxNi0xNiAxNkg2NGMtOC44MzYgMC0xNi03LjE2NC0xNi0xNlY2NGMwLTguODM4IDcuMTY0LTE2IDE2LTE2SDI0NXY0OEMyNDUgMTEyLjggMjYxLjIgMTI4IDI3MiAxMjhIMzM2VjQ0OHoiLz48L3N2Zz4=';
            }
            
            // 파일 아이콘만 컨테이너에 추가
            fileContainer.appendChild(fileIcon);
            
            // 파일 컨테이너 클릭 시 다운로드
            fileContainer.addEventListener('click', function() {
                downloadFile(contract.file);
            });
            
            // 파일 삭제 버튼 생성
            const deleteFileBtn = document.createElement('button');
            deleteFileBtn.className = 'delete-file-btn';
            deleteFileBtn.innerHTML = '&times;';
            deleteFileBtn.title = '파일 삭제';
            deleteFileBtn.addEventListener('click', function(e) {
                e.stopPropagation();
                deleteFile(contract.id, year);
            });
            
            // 삭제 버튼을 파일 컨테이너에 추가
            fileContainer.appendChild(deleteFileBtn);
            
            // 파일 컨테이너를 td에 추가
            fileTd.appendChild(fileContainer);
        } else {
            // 파일이 없는 경우 "파일 없음" 텍스트 표시
            const noFileText = document.createElement('span');
            noFileText.textContent = '파일 없음';
            noFileText.style.color = '#999';
            noFileText.style.fontSize = '0.9rem';
            fileTd.appendChild(noFileText);
            
            // 파일 추가 버튼 생성
            const addFileBtn = document.createElement('button');
            addFileBtn.className = 'add-file-btn';
            addFileBtn.textContent = '파일 추가';
            addFileBtn.style.marginLeft = '10px';
            addFileBtn.style.fontSize = '0.8rem';
            addFileBtn.style.padding = '3px 8px';
            
            // 파일 추가 버튼 클릭 시 파일 선택 다이얼로그 열기
            addFileBtn.addEventListener('click', function() {
                const fileInput = document.createElement('input');
                fileInput.type = 'file';
                fileInput.accept = '.docx,.pdf';
                fileInput.style.display = 'none';
                
                fileInput.addEventListener('change', function(e) {
                    if (e.target.files && e.target.files[0]) {
                        handleFileUpload(e.target.files[0], contract.id, year);
                    }
                });
                
                document.body.appendChild(fileInput);
                fileInput.click();
                document.body.removeChild(fileInput);
            });
            
            fileTd.appendChild(addFileBtn);
        }
        
        tr.appendChild(fileTd);
        
        // 수정 버튼 열 생성
        const editTd = document.createElement('td');
        const editBtn = document.createElement('button');
        editBtn.className = 'edit-btn';
        editBtn.textContent = '수정';
        editBtn.addEventListener('click', function() {
            showEditContractModal(contract.id, year);
        });
        
        editTd.appendChild(editBtn);
        tr.appendChild(editTd);
        
        // 삭제 버튼 열 생성
        const deleteTd = document.createElement('td');
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'delete-btn';
        deleteBtn.textContent = '삭제';
        deleteBtn.addEventListener('click', function() {
            if (confirm('계약을 삭제하시겠습니까?')) {
                contracts[year] = contracts[year].filter(c => c.id !== contract.id);
                localStorage.setItem('kbSecContracts', JSON.stringify(contracts));
                loadContractsByYear(year);
                alert('계약이 삭제되었습니다.');
            }
        });
        
        deleteTd.appendChild(deleteBtn);
        tr.appendChild(deleteTd);
        
        contractList.appendChild(tr);
    });
}

// 파일 업로드 처리
function handleFileUpload(file, contractId, year) {
    if (!file) return;
    
    // 파일 확장자 확인
    const fileExt = file.name.split('.').pop().toLowerCase();
    if (fileExt !== 'docx' && fileExt !== 'pdf') {
        alert('docx 또는 pdf 파일만 업로드 가능합니다.');
        return;
    }
    
    // 파일 크기 제한 (10MB)
    if (file.size > 10 * 1024 * 1024) {
        alert('파일 크기는 10MB를 초과할 수 없습니다.');
        return;
    }
    
    // 파일을 Base64로 인코딩하여 저장
    const reader = new FileReader();
    reader.onload = function(e) {
        const fileData = {
            name: file.name,
            type: file.type,
            size: file.size,
            data: e.target.result
        };
        
        // 해당 계약에 파일 정보 저장
        const contractIndex = contracts[year].findIndex(c => c.id === contractId);
        if (contractIndex !== -1) {
            contracts[year][contractIndex].file = fileData;
            localStorage.setItem('kbSecContracts', JSON.stringify(contracts));
            
            // 계약 목록 새로고침
            loadContractsByYear(year);
        }
    };
    reader.readAsDataURL(file);
}

// 파일 다운로드
function downloadFile(fileData) {
    const link = document.createElement('a');
    link.href = fileData.data;
    link.download = fileData.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// 파일 삭제
function deleteFile(contractId, year) {
    if (confirm('파일을 삭제하시겠습니까?')) {
        const contractIndex = contracts[year].findIndex(c => c.id === contractId);
        if (contractIndex !== -1) {
            delete contracts[year][contractIndex].file;
            localStorage.setItem('kbSecContracts', JSON.stringify(contracts));
            
            // 계약 목록 새로고침
            loadContractsByYear(year);
        }
    }
}

// 계약 추가 모달 표시
function showAddContractModal() {
    // 모달 초기화
    const modal = document.getElementById('add-contract-modal');
    const modalTitle = modal.querySelector('h2');
    const form = document.getElementById('add-contract-form');
    
    // 모달 제목 설정
    modalTitle.textContent = '계약 추가';
    
    // 폼 필드 초기화
    form.reset();
    
    // 파일 영역 초기화
    const fileArea = document.getElementById('add-contract-file-area');
    fileArea.innerHTML = '<span>파일을 드래그하거나 클릭하여 업로드</span>';
    
    // 폼 제출 이벤트 핸들러 설정
    form.onsubmit = function(e) {
        e.preventDefault();
        addContract();
    };
    
    // 버튼 텍스트 설정
    const submitBtn = form.querySelector('button[type="submit"]');
    submitBtn.textContent = '추가';
    
    // 데이터 속성 설정
    modal.setAttribute('data-mode', 'add');
    modal.removeAttribute('data-contract-id');
    modal.removeAttribute('data-contract-year');
    
    // 모달 표시
    modal.style.display = 'block';
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

// 계약 추가 처리
function addContract() {
    try {
        console.log('계약 추가 시작');
        
        const name = document.getElementById('contract-name').value;
        const company = document.getElementById('contract-company').value;
        const date = document.getElementById('contract-date').value;
        const status = document.getElementById('contract-status').value;
        const fileInput = document.getElementById('contract-file');
        
        console.log('입력 값:', { name, company, date, status });
        
        // 날짜에서 연도 추출 (날짜가 입력되지 않은 경우 현재 연도 사용)
        const year = date ? new Date(date).getFullYear() : new Date().getFullYear();
        console.log('추출된 연도:', year);
        
        // 연도가 범위 내인지 확인 (2011-2025)
        if (date && (year < 2011 || year > 2025)) {
            alert('계약 날짜는 2011년부터 2025년 사이여야 합니다.');
            return;
        }
        
        // 해당 연도의 계약 배열이 없으면 초기화
        if (!contracts[year]) {
            contracts[year] = [];
            console.log(`${year}년 계약 배열 초기화`);
        }
        
        // 새 계약 객체 생성
        const newContract = {
            id: Date.now().toString(), // 고유 ID 생성
            name: name || '(제목 없음)',
            company: company || '(거래 상대방 없음)',
            date: date || new Date().toISOString().split('T')[0],
            status: status || '법무검토 완료',
            department: currentUser.department,
            createdBy: currentUser.id,
            createdAt: new Date().toISOString()
        };
        
        console.log('생성된 계약 객체:', newContract);
        
        // 파일이 선택된 경우 파일 처리
        if (fileInput && fileInput.files && fileInput.files[0]) {
            console.log('파일 처리 시작');
            const file = fileInput.files[0];
            console.log('선택된 파일:', file.name);
            
            const reader = new FileReader();
            
            reader.onload = function(e) {
                newContract.file = {
                    name: file.name,
                    type: file.type,
                    size: file.size,
                    data: e.target.result
                };
                
                console.log('파일 정보 추가 완료');
                
                // 계약 추가 완료
                finishAddContract(newContract, year);
            };
            
            reader.readAsDataURL(file);
        } else {
            console.log('파일 없음');
            // 파일 없이 계약 추가 완료
            finishAddContract(newContract, year);
        }
    } catch (error) {
        console.error('계약 추가 중 오류 발생:', error);
        alert('계약 추가 중 오류가 발생했습니다.');
    }
}

// 계약 추가 완료 처리
function finishAddContract(newContract, year) {
    try {
        console.log(`${year}년 계약 추가 완료 처리 시작`);
        console.log(`현재 ${year}년 계약 수:`, contracts[year].length);
        
        // 계약 추가
        contracts[year].push(newContract);
        console.log(`추가 후 ${year}년 계약 수:`, contracts[year].length);
        
        // 로컬 스토리지 업데이트
        localStorage.setItem('kbSecContracts', JSON.stringify(contracts));
        console.log('로컬 스토리지 업데이트 완료');
        
        alert('계약이 추가되었습니다.');
        closeAddContractModal();
        
        // 폼 초기화
        document.getElementById('add-contract-form').reset();
        
        // 계약 목록 새로고침
        loadContractsByYear(year);
    } catch (error) {
        console.error('계약 추가 완료 처리 중 오류 발생:', error);
        alert('계약 추가 완료 처리 중 오류가 발생했습니다.');
    }
}

// 계약 수정 모달 표시
function showEditContractModal(contractId, year) {
    console.log('계약 수정 모달 표시 시작:', { contractId, year });
    
    const contract = contracts[year].find(c => c.id === contractId);
    if (!contract) {
        console.error('계약을 찾을 수 없음');
        return;
    }
    
    console.log('수정할 계약 정보:', contract);
    
    // 기존 모달 요소 재활용
    const modal = document.getElementById('add-contract-modal');
    const modalTitle = modal.querySelector('h2');
    const form = document.getElementById('add-contract-form');
    
    // 모달 제목 변경
    modalTitle.textContent = '계약 수정';
    
    // 폼 필드에 기존 값 설정
    document.getElementById('contract-name').value = contract.name;
    document.getElementById('contract-company').value = contract.company;
    document.getElementById('contract-date').value = contract.date;
    document.getElementById('contract-status').value = contract.status;
    
    // 파일 영역 업데이트
    const fileArea = document.getElementById('add-contract-file-area');
    if (contract.file) {
        updateFileAreaDisplay(fileArea, {
            name: contract.file.name,
            type: contract.file.type
        });
    } else {
        fileArea.innerHTML = '<span>파일을 드래그하거나 클릭하여 업로드</span>';
    }
    
    // 기존 이벤트 리스너 제거 (중복 방지)
    const oldForm = form;
    const newForm = oldForm.cloneNode(true);
    oldForm.parentNode.replaceChild(newForm, oldForm);
    
    // 새 폼에 이벤트 리스너 추가
    newForm.addEventListener('submit', function(e) {
        e.preventDefault();
        console.log('수정 폼 제출');
        updateContract(contractId, year);
    });
    
    // 버튼 텍스트 변경
    const submitBtn = newForm.querySelector('button[type="submit"]');
    submitBtn.textContent = '수정';
    
    // 모달 표시
    modal.style.display = 'block';
    
    // 데이터 속성 추가
    modal.setAttribute('data-mode', 'edit');
    modal.setAttribute('data-contract-id', contractId);
    modal.setAttribute('data-contract-year', year);
    
    console.log('계약 수정 모달 표시 완료');
}

// 계약 수정 처리
function updateContract(contractId, year) {
    console.log('계약 수정 처리 시작:', { contractId, year });
    
    try {
        const name = document.getElementById('contract-name').value;
        const company = document.getElementById('contract-company').value;
        const date = document.getElementById('contract-date').value;
        const status = document.getElementById('contract-status').value;
        const fileInput = document.getElementById('contract-file');
        
        console.log('수정 입력 값:', { name, company, date, status });
        
        // 날짜에서 연도 추출
        const newYear = date ? new Date(date).getFullYear() : year;
        console.log('추출된 연도:', newYear);
        
        // 연도가 범위 내인지 확인 (2011-2025)
        if (date && (newYear < 2011 || newYear > 2025)) {
            alert('계약 날짜는 2011년부터 2025년 사이여야 합니다.');
            return;
        }
        
        // 계약 객체 찾기
        const contractIndex = contracts[year].findIndex(c => c.id === contractId);
        if (contractIndex === -1) {
            console.error('계약을 찾을 수 없음:', contractId);
            alert('계약을 찾을 수 없습니다.');
            return;
        }
        
        console.log('찾은 계약 인덱스:', contractIndex);
        
        // 계약 객체 복사
        const updatedContract = { ...contracts[year][contractIndex] };
        
        // 필드 업데이트
        updatedContract.name = name || '(제목 없음)';
        updatedContract.company = company || '(거래 상대방 없음)';
        updatedContract.date = date || updatedContract.date;
        updatedContract.status = status || updatedContract.status;
        updatedContract.updatedAt = new Date().toISOString();
        
        console.log('업데이트된 계약 객체:', updatedContract);
        
        // 파일이 선택된 경우 파일 처리
        if (fileInput && fileInput.files && fileInput.files[0]) {
            console.log('새 파일 처리 시작');
            const file = fileInput.files[0];
            console.log('선택된 파일:', file.name);
            
            const reader = new FileReader();
            
            reader.onload = function(e) {
                updatedContract.file = {
                    name: file.name,
                    type: file.type,
                    size: file.size,
                    data: e.target.result
                };
                
                console.log('파일 정보 업데이트 완료');
                
                finishUpdateContract(updatedContract, contractId, year, newYear, contractIndex);
            };
            
            reader.readAsDataURL(file);
        } else {
            console.log('파일 변경 없음');
            // 파일 없이 계약 업데이트 완료
            finishUpdateContract(updatedContract, contractId, year, newYear, contractIndex);
        }
    } catch (error) {
        console.error('계약 수정 중 오류 발생:', error);
        alert('계약 수정 중 오류가 발생했습니다.');
    }
}

// 계약 수정 완료 처리
function finishUpdateContract(updatedContract, contractId, oldYear, newYear, contractIndex) {
    console.log('계약 수정 완료 처리 시작:', { oldYear, newYear, contractIndex });
    
    try {
        // 연도가 변경된 경우
        if (oldYear !== newYear) {
            console.log(`연도 변경: ${oldYear} -> ${newYear}`);
            
            // 해당 연도의 계약 배열이 없으면 초기화
            if (!contracts[newYear]) {
                contracts[newYear] = [];
                console.log(`${newYear}년 계약 배열 초기화`);
            }
            
            console.log(`수정 전 ${oldYear}년 계약 수:`, contracts[oldYear].length);
            console.log(`수정 전 ${newYear}년 계약 수:`, contracts[newYear].length);
            
            // 새 연도에 계약 추가
            contracts[newYear].push(updatedContract);
            
            // 기존 연도에서 계약 제거
            contracts[oldYear].splice(contractIndex, 1);
            
            console.log(`수정 후 ${oldYear}년 계약 수:`, contracts[oldYear].length);
            console.log(`수정 후 ${newYear}년 계약 수:`, contracts[newYear].length);
        } else {
            console.log(`같은 연도 내 수정: ${oldYear}, 인덱스: ${contractIndex}`);
            
            // 같은 연도 내에서 계약 업데이트
            contracts[oldYear][contractIndex] = updatedContract;
            
            console.log(`${oldYear}년 ${contractIndex}번 계약 업데이트 완료`);
        }
        
        // 로컬 스토리지 업데이트
        localStorage.setItem('kbSecContracts', JSON.stringify(contracts));
        console.log('로컬 스토리지 업데이트 완료');
        
        alert('계약이 수정되었습니다.');
        closeAddContractModal();
        
        // 연도가 변경된 경우 새 연도의 계약 목록 로드, 아니면 기존 연도 로드
        loadContractsByYear(newYear);
        
        console.log('계약 수정 완료 처리 완료');
    } catch (error) {
        console.error('계약 수정 완료 처리 중 오류 발생:', error);
        alert('계약 수정 완료 처리 중 오류가 발생했습니다.');
    }
}

// 계약 상세 모달에서 수정 버튼 클릭 시 처리
function editContract() {
    console.log('계약 상세 모달에서 수정 버튼 클릭');
    
    const modal = document.getElementById('contract-detail-modal');
    const contractId = modal.getAttribute('data-contract-id');
    const year = modal.getAttribute('data-contract-year');
    
    if (!contractId || !year) {
        console.error('계약 ID 또는 연도 정보가 없습니다.');
        return;
    }
    
    console.log('수정할 계약 정보:', { contractId, year });
    
    // 상세 모달 닫기
    closeContractDetailModal();
    
    // 수정 모달 열기
    showEditContractModal(contractId, year);
}

// 계약 삭제
function deleteContract() {
    const modal = document.getElementById('contract-detail-modal');
    const contractId = modal.getAttribute('data-contract-id');
    const year = modal.getAttribute('data-contract-year');
    
    const contract = contracts[year].find(c => c.id === contractId);
    
    // 관리자이거나 자신의 부서 계약만 삭제 가능
    if (!currentUser.isAdmin && contract.department !== currentUser.department) {
        alert('권한이 없습니다.');
        return;
    }
    
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
    const fileArea = document.getElementById('add-contract-file-area');
    const fileInput = document.getElementById('contract-file');
    
    if (!fileArea || !fileInput) return;
    
    // 파일 선택 시 이벤트
    fileInput.addEventListener('change', function() {
        updateFileAreaDisplay(fileArea, this.files[0]);
    });
    
    // 드래그 앤 드롭 이벤트
    fileArea.addEventListener('dragover', function(e) {
        e.preventDefault();
        e.stopPropagation();
        this.classList.add('drag-over');
    });
    
    fileArea.addEventListener('dragleave', function(e) {
        e.preventDefault();
        e.stopPropagation();
        this.classList.remove('drag-over');
    });
    
    fileArea.addEventListener('drop', function(e) {
        e.preventDefault();
        e.stopPropagation();
        this.classList.remove('drag-over');
        
        if (e.dataTransfer.files.length) {
            fileInput.files = e.dataTransfer.files;
            updateFileAreaDisplay(fileArea, e.dataTransfer.files[0]);
        }
    });
    
    // 클릭 시 파일 선택 다이얼로그 열기
    fileArea.addEventListener('click', function() {
        fileInput.click();
    });
}

// 파일 업로드 영역 표시 업데이트
function updateFileAreaDisplay(fileArea, file) {
    if (!file) return;
    
    // 파일 확장자 확인
    const fileExt = file.name.split('.').pop().toLowerCase();
    if (fileExt !== 'docx' && fileExt !== 'pdf') {
        alert('docx 또는 pdf 파일만 업로드 가능합니다.');
        return;
    }
    
    // 파일 크기 제한 (10MB)
    if (file.size > 10 * 1024 * 1024) {
        alert('파일 크기는 10MB를 초과할 수 없습니다.');
        return;
    }
    
    // 파일 정보 표시
    fileArea.innerHTML = '';
    
    const fileIcon = document.createElement('img');
    fileIcon.className = 'file-icon';
    
    if (fileExt === 'docx') {
        fileIcon.src = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAzODQgNTEyIj48cGF0aCBmaWxsPSIjMmI1NzlhIiBkPSJNMzY1LjMgOTMuMzhsLTc0LjYzLTc0LjY0QzI3OC42IDYuNzQyIDI2Mi4zIDAgMjQ1LjQgMEg2NEMyOC42NSAwIDAgMjguNjUgMCA2NFY0NDhjMCAzNS4zNCAyOC42NSA2NCA2NCA2NEgzMjBjMzUuMzUgMCA2NC0yOC42NiA2NC02NFYxMjEuNkMzODQgMTA0LjggMzc3LjMgODguMzYgMzY1LjMgOTMuMzh6TTMzNiAxMjhINTZWNjRIMjQwdjQ4QzI0MCA1OS4zOSAyNDcuNCAxMjggMzM2IDEyOHpNMzA0IDQxNkgxNDRWMzc2aDE2MFY0MTZ6TTI0MCAzNDRIMTQ0VjMwNGg5NlYzNDR6TTI0MCAyNzJIMTQ0VjIzMmg5NlYyNzJ6Ii8+PC9zdmc+';
    } else if (fileExt === 'pdf') {
        fileIcon.src = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAzODQgNTEyIj48cGF0aCBmaWxsPSIjZjQwZjAyIiBkPSJNMTgxLjkgMjU2LjFjLTUtOS43LTgtMTcuNy04LTI2LjRjMC0zOC4xIDM1LjItNTEuMSA0MS4yLTU0LjZjMS43LS45IDIuNy0yLjggMi43LTQuOFYxMjRIMTI4djI1LjNjMCAyLjgtMS40IDUuNS0zLjggNy4yYy0yLjQgMS42LTUuNCAyLjItOC4yIDEuMmMtOS4xLTMuMy0yMS4yLTYuNy0yOS4zLTYuN0M0OC4zIDE1MSAzMiAxNjYuNiAzMiAxODUuN2MwIDM5LjEgNDMuMiA1Ni45IDc1LjEgNjUuMWMyMi4zIDUuNyAyMyAxOC42IDIzIDIwLjhjMCA1LjEtMi4xIDEyLjUtOS42IDI1LjVjLTEuNCAyLjUtMS44IDUuNS0xIDguM2MuOCAyLjggMi43IDUuMiA1LjMgNi41YzIuOSAxLjUgNy40IDMuOCAxNC44IDMuOGMxNS42IDAgMzcuMS0xMC41IDU4LjUtMzkuMWMyMS40LTI4LjYgNDAuNi02Ni41IDQwLjYtNjYuNWM4LjEtMTguNSAyNC40LTI5LjEgMjQuNC01Ny41QzI2My4yIDEyNS45IDIwNy4zIDkzLjYgMTgxLjkgMjU2LjF6TTM2NS4zIDkzLjM4bC03NC42My03NC42NEMyNzguNiA2Ljc0MiAyNjIuMyAwIDI0NS40IDBINjRDMjguNjUgMCAwIDI4LjY1IDAgNjRWNDQ4YzAgMzUuMzQgMjguNjUgNjQgNjQgNjRIMzIwYzM1LjM1IDAgNjQtMjguNjYgNjQtNjRWMTIxLjZDMzg0IDEwNC44IDM3Ny4zIDg4LjM2IDM2NS4zIDkzLjM4ek0zMzYgNDQ4YzAgOC44MzYtNy4xNjQgMTYtMTYgMTZINjRjLTguODM2IDAtMTYtNy4xNjQtMTYtMTZWNjRjMC04LjgzOCA3LjE2NC0xNiAxNi0xNkgyNDV2NDhDMjQ1IDExMi44IDI2MS4yIDEyOCAyNzIgMTI4SDMzNlY0NDh6Ii8+PC9zdmc+';
    }
    
    const fileName = document.createElement('span');
    fileName.className = 'file-name';
    fileName.textContent = file.name;
    
    fileArea.appendChild(fileIcon);
    fileArea.appendChild(fileName);
} 