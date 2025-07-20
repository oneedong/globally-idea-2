// 사용자 데이터를 로컬 스토리지에 저장
let users = JSON.parse(localStorage.getItem('kbSecUsers')) || [];
let currentUser = JSON.parse(localStorage.getItem('kbSecCurrentUser')) || null;
let contracts = JSON.parse(localStorage.getItem('kbSecContracts')) || {};
let contractNumbers = JSON.parse(localStorage.getItem('kbSecContractNumbers')) || {};

// 전역 변수로 페이지네이션 상태 관리
let currentPage = 1;
const itemsPerPage = 30;

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
    const addContractForm = document.getElementById('add-contract-form');
    if (addContractForm) {
        addContractForm.addEventListener('submit', function(e) {
            e.preventDefault();
            console.log('계약 추가 폼 제출');
            addContract();
        });
    }
    
    // 파일 업로드 영역 설정
    setupFileUploadArea();
    
    // 계약 추가 버튼 클릭 시 파일 업로드 영역 재설정
    const addContractBtn = document.querySelector('.add-contract-btn');
    if (addContractBtn) {
        addContractBtn.addEventListener('click', function() {
            // 모달이 표시된 후에 파일 업로드 영역 설정
            setTimeout(setupFileUploadArea, 100);
        });
    }
    
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
    
    // 계약 종류 필터 옵션은 고정값이므로 업데이트하지 않음
    
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
    const typeFilter = document.getElementById('filter-type').value;
    const companyFilter = document.getElementById('filter-company').value;
    const statusFilter = document.getElementById('filter-status').value;
    const searchQuery = document.getElementById('search-input').value.toLowerCase();
    
    if (nameFilter || typeFilter || companyFilter || statusFilter || searchQuery) {
        filteredContracts = filteredContracts.filter(contract => {
            const matchesName = !nameFilter || contract.name === nameFilter;
            const matchesType = !typeFilter || contract.type === typeFilter;
            const matchesCompany = !companyFilter || contract.company === companyFilter;
            const matchesStatus = !statusFilter || contract.status === statusFilter;
            const matchesSearch = !searchQuery || 
                contract.name.toLowerCase().includes(searchQuery) || 
                (contract.type && contract.type.toLowerCase().includes(searchQuery)) ||
                contract.company.toLowerCase().includes(searchQuery) ||
                contract.status.toLowerCase().includes(searchQuery) ||
                (contract.contractNumber && contract.contractNumber.toLowerCase().includes(searchQuery));
                
            return matchesName && matchesType && matchesCompany && matchesStatus && matchesSearch;
        });
    }
    
    if (filteredContracts.length === 0) {
        const tr = document.createElement('tr');
        const td = document.createElement('td');
        td.colSpan = 10; // 컬럼 수 증가 (계약 종류 열 추가)
        td.textContent = '등록된 계약이 없습니다.';
        td.style.textAlign = 'center';
        tr.appendChild(td);
        contractList.appendChild(tr);
        
        // 페이지네이션 숨기기
        document.querySelector('.pagination-container').style.display = 'none';
        return;
    }
    
    // 페이지네이션 표시
    document.querySelector('.pagination-container').style.display = 'flex';
    
    // 번호 매기기를 위해 정렬 (최신 등록순)
    filteredContracts.sort((a, b) => {
        return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
    });
    
    // 전체 페이지 수 계산
    const totalPages = Math.ceil(filteredContracts.length / itemsPerPage);
    
    // 현재 페이지가 전체 페이지 수를 초과하지 않도록 조정
    if (currentPage > totalPages) {
        currentPage = 1;
    }
    
    // 현재 페이지에 해당하는 계약만 표시
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = Math.min(startIndex + itemsPerPage, filteredContracts.length);
    const currentPageContracts = filteredContracts.slice(startIndex, endIndex);
    
    // 계약 목록 표시
    currentPageContracts.forEach((contract, index) => {
        const tr = document.createElement('tr');
        
        // 번호 열 추가 (전체 인덱스 계산)
        const noTd = document.createElement('td');
        noTd.textContent = startIndex + index + 1;
        noTd.style.textAlign = 'center';
        tr.appendChild(noTd);
        
        // 계약번호 열 추가
        const contractNumberTd = document.createElement('td');
        contractNumberTd.textContent = contract.contractNumber || '-';
        contractNumberTd.style.textAlign = 'center';
        tr.appendChild(contractNumberTd);
        
        const nameTd = document.createElement('td');
        nameTd.textContent = contract.name;
        nameTd.style.textAlign = 'center';
        tr.appendChild(nameTd);
        
        // 계약 종류 열 추가
        const typeTd = document.createElement('td');
        typeTd.textContent = contract.type || '-';
        typeTd.style.textAlign = 'center';
        tr.appendChild(typeTd);
        
        const companyTd = document.createElement('td');
        companyTd.textContent = contract.company;
        companyTd.style.textAlign = 'center';
        tr.appendChild(companyTd);
        
        const dateTd = document.createElement('td');
        dateTd.textContent = formatDate(contract.date);
        dateTd.style.textAlign = 'center';
        tr.appendChild(dateTd);
        
        const statusTd = document.createElement('td');
        statusTd.textContent = contract.status;
        statusTd.style.textAlign = 'center';
        tr.appendChild(statusTd);
        
        // 파일 열 생성
        const fileTd = document.createElement('td');
        fileTd.style.textAlign = 'center';
        
        if (contract.file) {
            // 파일이 이미 있는 경우 파일 아이콘만 표시
            const fileContainer = document.createElement('div');
            fileContainer.className = 'file-container';
            fileContainer.style.cursor = 'pointer';
            fileContainer.title = contract.file.name; // 파일명은 툴팁으로 표시
            
            // 파일 아이콘 생성
            const fileIcon = document.createElement('i');
            const iconInfo = getFileIconInfo(contract.file.name);
            fileIcon.className = `file-icon fas ${iconInfo.className}`;
            fileIcon.style.color = iconInfo.color;
            
            fileContainer.appendChild(fileIcon);
            
            // 간략한 파일명 표시
            const fileName = document.createElement('span');
            fileName.className = 'file-name';
            fileName.textContent = contract.file.name.length > 15 
                ? contract.file.name.substring(0, 12) + '...' 
                : contract.file.name;
            fileContainer.appendChild(fileName);
            
            // 파일 다운로드 이벤트
            fileContainer.addEventListener('click', function() {
                downloadFile(contract.file);
            });
            
            fileTd.appendChild(fileContainer);
        } else {
            // 파일이 없는 경우에도 빈 파일 아이콘 표시
            const fileContainer = document.createElement('div');
            fileContainer.className = 'file-container';
            fileContainer.title = '파일 없음';
            
            const fileIcon = document.createElement('i');
            fileIcon.className = 'file-icon fas fa-file-alt';
            fileIcon.style.color = '#aaa';
            
            fileContainer.appendChild(fileIcon);
            
            const noFileText = document.createElement('span');
            noFileText.className = 'file-name';
            noFileText.textContent = '파일 없음';
            fileContainer.appendChild(noFileText);
            
            fileTd.appendChild(fileContainer);
        }
        
        tr.appendChild(fileTd);
        
        // 수정 버튼 열 생성
        const editTd = document.createElement('td');
        editTd.style.textAlign = 'center';
        
        const editBtn = document.createElement('button');
        editBtn.className = 'edit-btn';
        editBtn.innerHTML = '<i class="fas fa-edit"></i>';
        editBtn.title = '계약 수정';
        editBtn.addEventListener('click', function() {
            showEditContractModal(contract.id, year);
        });
        
        editTd.appendChild(editBtn);
        tr.appendChild(editTd);
        
        // 삭제 버튼 열 생성
        const deleteTd = document.createElement('td');
        deleteTd.style.textAlign = 'center';
        
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'delete-btn';
        deleteBtn.innerHTML = '<i class="fas fa-trash-alt"></i>';
        deleteBtn.title = '계약 삭제';
        deleteBtn.addEventListener('click', function() {
            if (confirm('정말로 이 계약을 삭제하시겠습니까?')) {
                deleteContract(contract.id, year);
            }
        });
        
        deleteTd.appendChild(deleteBtn);
        tr.appendChild(deleteTd);
        
        contractList.appendChild(tr);
    });
    
    // 페이지네이션 생성
    createPagination(totalPages, year);
}

// 페이지네이션 생성
function createPagination(totalPages, year) {
    const pagination = document.getElementById('pagination');
    pagination.innerHTML = '';
    
    if (totalPages <= 1) {
        return;
    }
    
    // 이전 버튼
    const prevButton = document.createElement('button');
    prevButton.className = 'pagination-button' + (currentPage === 1 ? ' disabled' : '');
    prevButton.textContent = '이전';
    prevButton.addEventListener('click', function() {
        if (currentPage > 1) {
            currentPage--;
            displayContracts(year);
        }
    });
    pagination.appendChild(prevButton);
    
    // 페이지 번호
    const maxVisiblePages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
    
    // 시작 페이지 조정
    if (endPage - startPage + 1 < maxVisiblePages) {
        startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }
    
    // 첫 페이지 버튼
    if (startPage > 1) {
        const firstPageButton = document.createElement('button');
        firstPageButton.className = 'pagination-button';
        firstPageButton.textContent = '1';
        firstPageButton.addEventListener('click', function() {
            currentPage = 1;
            displayContracts(year);
        });
        pagination.appendChild(firstPageButton);
        
        if (startPage > 2) {
            const ellipsis = document.createElement('span');
            ellipsis.className = 'pagination-ellipsis';
            ellipsis.textContent = '...';
            pagination.appendChild(ellipsis);
        }
    }
    
    // 페이지 번호 버튼
    for (let i = startPage; i <= endPage; i++) {
        const pageButton = document.createElement('button');
        pageButton.className = 'pagination-button' + (i === currentPage ? ' active' : '');
        pageButton.textContent = i;
        pageButton.addEventListener('click', function() {
            currentPage = i;
            displayContracts(year);
        });
        pagination.appendChild(pageButton);
    }
    
    // 마지막 페이지 버튼
    if (endPage < totalPages) {
        if (endPage < totalPages - 1) {
            const ellipsis = document.createElement('span');
            ellipsis.className = 'pagination-ellipsis';
            ellipsis.textContent = '...';
            pagination.appendChild(ellipsis);
        }
        
        const lastPageButton = document.createElement('button');
        lastPageButton.className = 'pagination-button';
        lastPageButton.textContent = totalPages;
        lastPageButton.addEventListener('click', function() {
            currentPage = totalPages;
            displayContracts(year);
        });
        pagination.appendChild(lastPageButton);
    }
    
    // 다음 버튼
    const nextButton = document.createElement('button');
    nextButton.className = 'pagination-button' + (currentPage === totalPages ? ' disabled' : '');
    nextButton.textContent = '다음';
    nextButton.addEventListener('click', function() {
        if (currentPage < totalPages) {
            currentPage++;
            displayContracts(year);
        }
    });
    pagination.appendChild(nextButton);
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
    console.log('계약 추가 모달 표시 시작');
    
    // 모달 요소
    const modal = document.getElementById('add-contract-modal');
    const modalTitle = modal.querySelector('h2');
    
    // 모달 제목 설정
    modalTitle.textContent = '계약 추가';
    
    // 폼 초기화
    const form = document.getElementById('add-contract-form');
    if (form) {
        form.reset();
    }
    
    // 파일 영역 초기화
    const fileArea = document.getElementById('add-contract-file-area');
    if (fileArea) {
        fileArea.innerHTML = `
            <i class="fas fa-cloud-upload-alt"></i>
            <span>파일을 드래그하거나 클릭하여 업로드</span>
            <input type="file" id="contract-file-input" class="file-upload-input" accept=".docx,.doc,.pdf,.xls,.xlsx,.ppt,.pptx,.hwp,.txt">
        `;
    }
    
    // 기존 이벤트 리스너 제거 (중복 방지)
    if (form) {
        const newForm = form.cloneNode(true);
        form.parentNode.replaceChild(newForm, form);
        
        // 새 폼에 이벤트 리스너 추가
        newForm.addEventListener('submit', function(e) {
            e.preventDefault();
            console.log('추가 폼 제출');
            addContract();
        });
    }
    
    // 모달 표시
    modal.style.display = 'block';
    
    // 데이터 속성 설정
    modal.setAttribute('data-mode', 'add');
    modal.removeAttribute('data-contract-id');
    modal.removeAttribute('data-contract-year');
    
    // 파일 업로드 영역 이벤트 재설정
    setTimeout(setupFileUploadArea, 100);
    
    console.log('계약 추가 모달 표시 완료');
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
        document.getElementById('detail-contract-number').textContent = contract.contractNumber || '-';
        document.getElementById('detail-contract-type').textContent = contract.type || '-';
        document.getElementById('detail-company').textContent = contract.company;
        document.getElementById('detail-date').textContent = formatDate(contract.date);
        document.getElementById('detail-status').textContent = contract.status;
        document.getElementById('detail-content').textContent = contract.details || '메모가 없습니다.';
        
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

// 계약 추가 처리
function addContract() {
    console.log('계약 추가 시작');
    
    try {
        const name = document.getElementById('add-contract-name').value;
        const type = document.getElementById('add-contract-type').value;
        const company = document.getElementById('add-contract-company').value;
        const date = document.getElementById('add-contract-date').value;
        const status = document.getElementById('add-contract-status').value;
        const details = document.getElementById('add-contract-details').value;
        
        console.log('입력된 계약 정보:', { name, type, company, date, status });
        
        // 유효성 검사
        if (!name || !type || !company || !date || !status) {
            alert('필수 항목을 모두 입력해주세요.');
            return;
        }
        
        // 날짜에서 연도 추출
        const year = new Date(date).getFullYear();
        
        // 계약번호 생성
        const contractNumber = generateContractNumber(date);
        console.log('생성된 계약번호:', contractNumber);
        
        // 해당 연도의 계약 배열이 없으면 초기화
        if (!contracts[year]) {
            contracts[year] = [];
        }
        
        // 새 계약 객체 생성
        const newContract = {
            id: Date.now().toString(),
            name,
            type,
            company,
            date,
            status,
            details,
            contractNumber,
            createdBy: currentUser.id,
            createdAt: new Date().toISOString(),
            files: []
        };
        
        console.log('새 계약 객체 생성:', newContract);
        
        // 파일 업로드 처리
        const fileInput = document.getElementById('contract-file-input');
        if (fileInput && fileInput.files && fileInput.files.length > 0) {
            const file = fileInput.files[0];
            console.log('파일 업로드 처리:', file.name);
            
            const reader = new FileReader();
            
            reader.onload = function(e) {
                try {
                    const fileData = {
                        name: file.name,
                        type: file.type,
                        size: file.size,
                        data: e.target.result
                    };
                    
                    newContract.file = fileData;
                    console.log('파일 정보 추가 완료');
                    finishAddContract(newContract, year);
                } catch (error) {
                    console.error('파일 처리 중 오류:', error);
                    alert('파일 처리 중 오류가 발생했습니다.');
                }
            };
            
            reader.onerror = function() {
                console.error('파일 읽기 오류');
                alert('파일을 읽는 중 오류가 발생했습니다.');
            };
            
            reader.readAsDataURL(file);
        } else {
            console.log('파일 없이 계약 추가');
            finishAddContract(newContract, year);
        }
    } catch (error) {
        console.error('계약 추가 중 오류:', error);
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
        alert('수정할 계약을 찾을 수 없습니다.');
        return;
    }
    
    console.log('수정할 계약 정보:', contract);
    
    // 모달 요소
    const modal = document.getElementById('add-contract-modal');
    const modalTitle = modal.querySelector('h2');
    
    // 모달 제목 변경
    modalTitle.textContent = '계약 수정';
    
    // 폼 필드에 기존 값 설정
    document.getElementById('add-contract-name').value = contract.name || '';
    document.getElementById('add-contract-type').value = contract.type || '매매계약';
    document.getElementById('add-contract-company').value = contract.company || '';
    document.getElementById('add-contract-date').value = contract.date || '';
    document.getElementById('add-contract-status').value = contract.status || '법무검토 완료';
    document.getElementById('add-contract-details').value = contract.details || '';
    
    // 파일 영역 업데이트
    const fileArea = document.getElementById('add-contract-file-area');
    if (fileArea) {
        if (contract.file) {
            // 파일 아이콘 정보 가져오기
            const iconInfo = getFileIconInfo(contract.file.name);
            
            // 파일 정보 HTML 생성
            fileArea.innerHTML = `
                <i class="fas ${iconInfo.className}" style="color: ${iconInfo.color}; font-size: 36px; margin-bottom: 10px;"></i>
                <span class="file-name">${contract.file.name}</span>
                <input type="file" id="contract-file-input" class="file-upload-input" accept=".docx,.pdf,.xlsx,.pptx,.hwp">
            `;
        } else {
            fileArea.innerHTML = `
                <i class="fas fa-cloud-upload-alt"></i>
                <span>파일을 드래그하거나 클릭하여 업로드</span>
                <input type="file" id="contract-file-input" class="file-upload-input" accept=".docx,.pdf,.xlsx,.pptx,.hwp">
            `;
        }
    }
    
    // 기존 이벤트 리스너 제거 및 새로운 이벤트 리스너 추가
    const form = document.getElementById('add-contract-form');
    if (form) {
        // 기존 이벤트 리스너 제거
        const newForm = form.cloneNode(true);
        form.parentNode.replaceChild(newForm, form);
        
        // 새 폼에 이벤트 리스너 추가
        newForm.addEventListener('submit', function(e) {
            e.preventDefault();
            console.log('수정 폼 제출');
            updateContract(contractId, year);
        });
        
        // 버튼 텍스트 변경
        const submitBtn = newForm.querySelector('button[type="submit"]');
        if (submitBtn) {
            submitBtn.textContent = '수정';
        }
    }
    
    // 모달 표시
    modal.style.display = 'block';
    
    // 데이터 속성 추가
    modal.setAttribute('data-mode', 'edit');
    modal.setAttribute('data-contract-id', contractId);
    modal.setAttribute('data-contract-year', year);
    
    // 파일 업로드 영역 이벤트 재설정
    setTimeout(setupFileUploadArea, 100);
    
    console.log('계약 수정 모달 표시 완료');
}

// 계약 수정 처리
function updateContract(contractId, year) {
    console.log('계약 수정 처리 시작:', { contractId, year });
    
    try {
        // 입력 값 가져오기
        const name = document.getElementById('add-contract-name').value;
        const type = document.getElementById('add-contract-type').value;
        const company = document.getElementById('add-contract-company').value;
        const date = document.getElementById('add-contract-date').value;
        const status = document.getElementById('add-contract-status').value;
        const details = document.getElementById('add-contract-details').value;
        
        console.log('수정 입력 값:', { name, type, company, date, status, details });
        
        // 유효성 검사
        if (!name || !type || !company || !date || !status) {
            alert('필수 항목을 모두 입력해주세요.');
            return;
        }
        
        // 계약 찾기
        const contractIndex = contracts[year].findIndex(c => c.id === contractId);
        if (contractIndex === -1) {
            console.error('수정할 계약을 찾을 수 없음');
            alert('수정할 계약을 찾을 수 없습니다.');
            return;
        }
        
        // 기존 계약 정보
        const oldContract = contracts[year][contractIndex];
        console.log('기존 계약 정보:', oldContract);
        
        // 날짜에서 연도 추출
        const newYear = new Date(date).getFullYear();
        console.log('새 연도:', newYear);
        
        // 업데이트된 계약 정보
        const updatedContract = {
            ...oldContract,
            name,
            type,
            company,
            date,
            status,
            details,
            updatedAt: new Date().toISOString()
        };
        
        console.log('업데이트된 계약 정보:', updatedContract);
        
        // 파일 업로드 처리
        const fileInput = document.getElementById('contract-file-input');
        if (fileInput && fileInput.files && fileInput.files.length > 0) {
            console.log('새 파일 업로드 처리');
            const file = fileInput.files[0];
            const reader = new FileReader();
            
            reader.onload = function(e) {
                try {
                    const fileData = {
                        name: file.name,
                        type: file.type,
                        size: file.size,
                        data: e.target.result
                    };
                    
                    updatedContract.file = fileData;
                    console.log('파일 정보 업데이트 완료');
                    finishUpdateContract(updatedContract, contractId, year, newYear, contractIndex);
                } catch (error) {
                    console.error('파일 처리 중 오류:', error);
                    alert('파일 처리 중 오류가 발생했습니다.');
                }
            };
            
            reader.onerror = function() {
                console.error('파일 읽기 오류');
                alert('파일을 읽는 중 오류가 발생했습니다.');
            };
            
            reader.readAsDataURL(file);
        } else {
            console.log('파일 변경 없음');
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
        
        const contract = contracts[year].find(c => c.id === contractId);
        if (!contract) {
            console.error('삭제할 계약을 찾을 수 없음');
            alert('삭제할 계약을 찾을 수 없습니다.');
            return;
        }
        
        // 관리자이거나 자신의 부서 계약만 삭제 가능
        if (!currentUser.isAdmin && contract.department !== currentUser.department) {
            alert('권한이 없습니다.');
            return;
        }
        
        if (confirm('정말로 이 계약을 삭제하시겠습니까?')) {
            console.log('계약 삭제 확인됨');
            
            // 계약 삭제
            contracts[year] = contracts[year].filter(c => c.id !== contractId);
            
            // 로컬 스토리지 업데이트
            localStorage.setItem('kbSecContracts', JSON.stringify(contracts));
            
            // 모달 닫기
            closeContractDetailModal();
            
            // 계약 목록 새로고침
            loadContractsByYear(year);
            
            alert('계약이 삭제되었습니다.');
            
            console.log('계약 삭제 완료');
        } else {
            console.log('계약 삭제 취소됨');
        }
    } catch (error) {
        console.error('계약 삭제 중 오류:', error);
        alert('계약 삭제 중 오류가 발생했습니다.');
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
    
    // 요소 가져오기
    const fileArea = document.getElementById('add-contract-file-area');
    const fileInput = document.getElementById('contract-file-input');
    const contractNameInput = document.getElementById('add-contract-name');
    
    // 요소 존재 여부 확인
    if (!fileArea) {
        console.error('파일 업로드 영역 요소를 찾을 수 없음');
        return;
    }
    
    if (!fileInput) {
        console.error('파일 입력 요소를 찾을 수 없음');
        return;
    }
    
    console.log('파일 업로드 요소 찾음');
    
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
                // 파일 입력 요소에 파일 설정
                fileInput.files = e.dataTransfer.files;
                
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
        
        return false;
    };
    
    // 클릭 이벤트 처리
    fileArea.onclick = function() {
        console.log('파일 영역 클릭됨');
        fileInput.click();
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
    
    // 파일 정보 HTML 생성
    const fileInfoHtml = `
        <i class="fas ${iconInfo.className}" style="color: ${iconInfo.color}; font-size: 36px; margin-bottom: 10px;"></i>
        <span class="file-name">${file.name}</span>
    `;
    
    // 파일 영역에 정보 표시
    fileArea.innerHTML = fileInfoHtml;
    fileArea.appendChild(createFileInput());
    
    console.log('파일 정보 표시 완료');
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
    if (!fileName) return { className: 'fa-file-alt', color: '#aaa' };
    
    const ext = fileName.split('.').pop().toLowerCase();
    
    switch (ext) {
        case 'pdf':
            return { className: 'fa-file-pdf', color: '#f40f02' };
        case 'doc':
        case 'docx':
            return { className: 'fa-file-word', color: '#2b579a' };
        case 'xls':
        case 'xlsx':
            return { className: 'fa-file-excel', color: '#217346' };
        case 'ppt':
        case 'pptx':
            return { className: 'fa-file-powerpoint', color: '#d24726' };
        case 'hwp':
            return { className: 'fa-file-alt', color: '#0048ff' };
        case 'txt':
            return { className: 'fa-file-alt', color: '#333333' };
        case 'zip':
        case 'rar':
        case '7z':
            return { className: 'fa-file-archive', color: '#ffa000' };
        case 'jpg':
        case 'jpeg':
        case 'png':
        case 'gif':
        case 'bmp':
            return { className: 'fa-file-image', color: '#26a69a' };
        default:
            return { className: 'fa-file', color: '#666' };
    }
} 