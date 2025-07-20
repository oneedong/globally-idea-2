// 사용자 데이터를 로컬 스토리지에 저장
let users = JSON.parse(localStorage.getItem('kbSecUsers')) || [];
let currentUser = JSON.parse(localStorage.getItem('kbSecCurrentUser')) || null;
let contracts = JSON.parse(localStorage.getItem('kbSecContracts')) || {};
let contractNumbers = JSON.parse(localStorage.getItem('kbSecContractNumbers')) || {};

// 전역 변수로 페이지네이션 상태 관리
let currentPage = 1;
const itemsPerPage = 30;

// 페이지 로드 시 실행
document.addEventListener('DOMContentLoaded', function() {
    console.log('대시보드 페이지 로드됨');
    
    // 로컬 스토리지에서 계약 데이터 로드
    const contractsData = localStorage.getItem('kbSecContracts');
    if (contractsData) {
        contracts = JSON.parse(contractsData);
        console.log('계약 데이터 로드 완료');
    }
    
    // 로컬 스토리지에서 계약 번호 데이터 로드
    const contractNumbersData = localStorage.getItem('kbSecContractNumbers');
    if (contractNumbersData) {
        contractNumbers = JSON.parse(contractNumbersData);
    }
    
    // 로그인 체크
    checkLogin();
    
    // 로그아웃 버튼 이벤트 설정
    document.getElementById('logout-btn').addEventListener('click', logout);
    
    // 계약 검색 이벤트 설정
    document.getElementById('search-btn').addEventListener('click', searchContracts);
    document.getElementById('search-input').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            searchContracts();
        }
    });
    
    // 필터 적용 버튼 이벤트 설정
    document.getElementById('apply-filters-btn').addEventListener('click', applyFilters);
    
    // 필터 초기화 버튼 이벤트 설정
    document.getElementById('reset-filters-btn').addEventListener('click', resetFilters);
    
    // 계약 추가 버튼 이벤트 설정
    document.getElementById('add-contract-btn').addEventListener('click', showAddContractModal);
    
    // 계약 추가 모달 닫기 버튼 이벤트 설정
    document.getElementById('close-add-contract-modal').addEventListener('click', closeAddContractModal);
    
    // 계약 추가 폼 제출 이벤트 설정
    document.getElementById('add-contract-form').addEventListener('submit', function(e) {
        e.preventDefault();
        addContract();
    });
    
    // 계약 상세 모달 닫기 버튼 이벤트 설정
    document.getElementById('close-contract-detail-modal').addEventListener('click', closeContractDetailModal);
    
    // 계약 수정 모달 닫기 버튼 이벤트 설정
    document.getElementById('close-edit-contract-modal').addEventListener('click', function() {
        document.getElementById('edit-contract-modal').style.display = 'none';
    });
    
    // 계약 수정 폼 제출 이벤트 설정
    document.getElementById('edit-contract-form').addEventListener('submit', function(e) {
        e.preventDefault();
        editContract();
    });
    
    // 계약 저장 버튼 이벤트 설정
    document.getElementById('save-contract-btn').addEventListener('click', function() {
        saveContractFromModal();
    });
    
    // 계약 임시 저장 버튼 이벤트 설정
    document.getElementById('temp-save-contract-btn').addEventListener('click', tempSaveContract);
    
    // 파일 업로드 영역 설정
    setupFileUploadArea();
    
    // 테이블 리사이징 초기화
    initializeTableResizing();
    
    // 개발용 로컬 스토리지 초기화 (필요 시 주석 해제)
    resetLocalStorage();
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
    
    // 테이블 열 너비 조절 기능 초기화
    setTimeout(function() {
        initializeTableResizing();
        console.log('계약 목록 로드 후 테이블 열 너비 조절 기능 초기화');
    }, 200);
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

        if (contract.file && contract.file.name) {
            // 파일이 있는 경우
            console.log('파일 정보:', contract.id, contract.file.name);
            
            // 파일 컨테이너 생성
            const fileContainer = document.createElement('div');
            fileContainer.className = 'file-container';
            fileContainer.style.cursor = 'pointer';
            fileContainer.style.display = 'flex';
            fileContainer.style.flexDirection = 'column';
            fileContainer.style.alignItems = 'center';
            fileContainer.style.justifyContent = 'center';
            fileContainer.style.padding = '5px';
            fileContainer.style.width = '60px';
            fileContainer.style.height = '60px';
            fileContainer.style.margin = '0 auto';
            fileContainer.style.border = '1px solid #eaeaea';
            fileContainer.style.backgroundColor = '#f9f9f9';
            fileContainer.style.borderRadius = '4px';
            fileContainer.title = contract.file.name + ' (클릭하여 다운로드)';
            
            // 파일 확장자 추출
            const fileExt = contract.file.name.split('.').pop().toLowerCase();
            
            // 파일 아이콘 정보 가져오기
            const iconInfo = getFileIconInfo(contract.file.name);
            
            // 파일 아이콘 생성
            const fileIcon = document.createElement('i');
            fileIcon.className = iconInfo.className;
            fileIcon.style.color = iconInfo.color;
            fileIcon.style.fontSize = '20px';
            fileIcon.style.marginBottom = '4px';    
            
            // 아이콘 추가
            fileContainer.appendChild(fileIcon);
            
            // 파일명 표시
            const fileName = document.createElement('span');
            fileName.textContent = fileExt.toUpperCase();
            fileName.style.fontSize = '8px';
            fileName.style.fontWeight = 'bold';
            fileName.style.color = '#444';
            fileName.style.backgroundColor = '#f0f7ff';
            fileName.style.padding = '2px 6px';
            fileName.style.borderRadius = '4px';
            fileContainer.appendChild(fileName);
            
            // 다운로드 이벤트 추가
            fileContainer.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                console.log('파일 다운로드 시작:', contract.file.name);
                downloadFile(contract.file);
            });
            
            // 호버 효과 추가
            fileContainer.addEventListener('mouseover', function() {
                this.style.backgroundColor = '#f0f7ff';
                this.style.borderColor = '#c0d6f9';
                this.style.transform = 'translateY(-2px)';
                this.style.boxShadow = '0 2px 5px rgba(0,0,0,0.1)';
            });
            
            fileContainer.addEventListener('mouseout', function() {
                this.style.backgroundColor = '#f9f9f9';
                this.style.borderColor = '#eaeaea';
                this.style.transform = 'translateY(0)';
                this.style.boxShadow = 'none';
            });
            
            fileTd.appendChild(fileContainer);
        } else {
            // 파일이 없는 경우
            fileTd.textContent = '파일 없음';
            fileTd.style.color = '#999';
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
    
    // 테이블 열 너비 조절 기능 초기화
    setTimeout(initializeTableResizing, 100);
    
    // 계약 목록 로드 완료 이벤트 트리거
    if (typeof triggerContractsLoaded === 'function') {
        setTimeout(triggerContractsLoaded, 200);
    }
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
    const allowedExtensions = ['docx', 'doc', 'pdf', 'xls', 'xlsx', 'ppt', 'pptx', 'hwp', 'txt'];
    
    if (!allowedExtensions.includes(fileExt)) {
        alert('지원되는 파일 형식: docx, doc, pdf, xls, xlsx, ppt, pptx, hwp, txt');
        return;
    }
    
    // 파일 크기 제한 (20MB)
    if (file.size > 20 * 1024 * 1024) {
        alert('파일 크기는 20MB를 초과할 수 없습니다.');
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
    
    reader.onerror = function(error) {
        console.error('파일 읽기 오류:', error);
        alert('파일 읽기 중 오류가 발생했습니다.');
    };
    
    reader.readAsDataURL(file);
}

// 파일 다운로드 함수
function downloadFile(file) {
    console.log('다운로드 함수 호출됨:', file.name);
    
    if (!file || !file.data) {
        alert('다운로드할 파일이 없거나 손상되었습니다.');
        return;
    }
    
    try {
        // 파일 데이터 확인
        const fileData = file.data;
        
        // 다운로드 링크 생성
        const link = document.createElement('a');
        link.href = fileData;
        link.download = file.name;
        
        // 문서에 링크 추가 및 클릭
        document.body.appendChild(link);
        
        // 다운로드 실행
        link.click();
        
        // 링크 제거
        setTimeout(() => {
            document.body.removeChild(link);
            console.log('다운로드 완료:', file.name);
        }, 100);
    } catch (error) {
        console.error('다운로드 오류:', error);
        alert('파일 다운로드 중 오류가 발생했습니다.');
    }
}

// 파일 확장자에 따른 MIME 타입 반환
function getMimeType(fileName) {
    const ext = fileName.split('.').pop().toLowerCase();
    
    switch (ext) {
        case 'pdf': return 'application/pdf';
        case 'doc': return 'application/msword';
        case 'docx': return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
        case 'xls': return 'application/vnd.ms-excel';
        case 'xlsx': return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
        case 'ppt': return 'application/vnd.ms-powerpoint';
        case 'pptx': return 'application/vnd.openxmlformats-officedocument.presentationml.presentation';
        case 'hwp': return 'application/x-hwp';
        case 'txt': return 'text/plain';
        case 'jpg': case 'jpeg': return 'image/jpeg';
        case 'png': return 'image/png';
        case 'gif': return 'image/gif';
        case 'zip': return 'application/zip';
        case 'rar': return 'application/x-rar-compressed';
        case '7z': return 'application/x-7z-compressed';
        default: return 'application/octet-stream';
    }
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
        // 기존 폼의 내용을 복제하되, 버튼 컨테이너는 제외
        const newForm = document.createElement('form');
        newForm.id = 'add-contract-form';
        
        // 원래 폼의 모든 자식 요소를 복사 (버튼 컨테이너 제외)
        Array.from(form.children).forEach(child => {
            // 버튼 컨테이너가 아닌 경우에만 복사
            if (!child.classList || (!child.classList.contains('button-container') && child.tagName !== 'BUTTON')) {
                newForm.appendChild(child.cloneNode(true));
            }
        });
        
        // 기존 폼을 새 폼으로 교체
        form.parentNode.replaceChild(newForm, form);
        
        // 버튼 컨테이너 생성
        const buttonContainer = document.createElement('div');
        buttonContainer.className = 'button-container';
        buttonContainer.style.display = 'flex';
        buttonContainer.style.gap = '10px';
        buttonContainer.style.justifyContent = 'center';
        buttonContainer.style.marginTop = '20px';
        
        // 추가 버튼 추가
        const addBtn = document.createElement('button');
        addBtn.type = 'button';
        addBtn.textContent = '추가';
        addBtn.className = 'add-modal-btn';
        addBtn.style.backgroundColor = '#0a2e5c';
        addBtn.addEventListener('click', function() {
            addContract();
        });
        
        // 임시저장 버튼 추가
        const tempSaveBtn = document.createElement('button');
        tempSaveBtn.type = 'button';
        tempSaveBtn.textContent = '임시저장';
        tempSaveBtn.className = 'temp-save-modal-btn';
        tempSaveBtn.style.backgroundColor = '#28a745';
        tempSaveBtn.addEventListener('click', function() {
            tempSaveContract();
        });
        
        // 취소 버튼 추가
        const cancelBtn = document.createElement('button');
        cancelBtn.type = 'button';
        cancelBtn.textContent = '취소';
        cancelBtn.className = 'cancel-modal-btn';
        cancelBtn.style.backgroundColor = '#6c757d';
        cancelBtn.addEventListener('click', function() {
            closeAddContractModal();
        });
        
        // 버튼 추가
        buttonContainer.appendChild(addBtn);
        buttonContainer.appendChild(tempSaveBtn);
        buttonContainer.appendChild(cancelBtn);
        
        // 폼에 버튼 컨테이너 추가
        newForm.appendChild(buttonContainer);
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
    
    // 계약 ID 생성 (현재 시간 기준)
    const contractId = Date.now().toString();
    
    // 계약 번호 생성
    const contractNumber = generateContractNumber(date);
    
    console.log('파일 입력 확인:', fileInput ? '있음' : '없음');
    console.log('파일 존재 확인:', fileInput && fileInput.files && fileInput.files.length > 0 ? '있음' : '없음');
    
    if (fileInput) {
        console.log('파일 입력 정보:', fileInput.id, fileInput.type, fileInput.files?.length);
    }
    
    // 파일 데이터 처리
    if (fileInput && fileInput.files && fileInput.files.length > 0) {
        const file = fileInput.files[0];
        console.log('파일 선택됨:', file.name, file.type, file.size);
        
        // 파일 유효성 검사
        if (!validateFile(file)) {
            return;
        }
        
        // 파일 읽기
        const reader = new FileReader();
        
        reader.onload = function(e) {
            console.log('파일 읽기 완료');
            
            // 파일 데이터 저장
            const fileData = {
                name: file.name,
                type: file.type,
                size: file.size,
                data: e.target.result
            };
            
            console.log('파일 데이터 생성:', file.name, '타입:', file.type);
            
            // 계약 객체 생성
            const contract = {
                id: contractId,
                contractNumber: contractNumber,
                name: name,
                type: type,
                company: company,
                date: date,
                status: status,
                details: details,
                department: currentUser.department,
                createdAt: new Date().toISOString(),
                file: fileData
            };
            
            // 계약 배열에 추가
            contracts[contractYear].push(contract);
            
            // 로컬 스토리지에 저장
            localStorage.setItem('kbSecContracts', JSON.stringify(contracts));
            
            console.log('계약 추가 완료 (파일 포함)');
            
            // 모달 닫기
            closeAddContractModal();
            
            // 현재 연도의 계약 목록 다시 로드
            loadContractsByYear(contractYear);
            
            // 성공 메시지
            alert('계약이 추가되었습니다.');
        };
        
        reader.onerror = function(error) {
            console.error('파일 읽기 오류:', error);
            alert('파일 읽기 중 오류가 발생했습니다.');
        };
        
        // 파일을 base64로 읽기
        reader.readAsDataURL(file);
    } else {
        // 파일 없이 계약 추가
        const contract = {
            id: contractId,
            contractNumber: contractNumber,
            name: name,
            type: type,
            company: company,
            date: date,
            status: status,
            details: details,
            department: currentUser.department,
            createdAt: new Date().toISOString(),
            file: null
        };
        
        // 계약 배열에 추가
        contracts[contractYear].push(contract);
        
        // 로컬 스토리지에 저장
        localStorage.setItem('kbSecContracts', JSON.stringify(contracts));
        
        console.log('계약 추가 완료 (파일 없음)');
        
        // 모달 닫기
        closeAddContractModal();
        
        // 현재 연도의 계약 목록 다시 로드
        loadContractsByYear(contractYear);
        
        // 성공 메시지
        alert('계약이 추가되었습니다.');
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
            
            // 파일 크기 포맷팅
            const fileSize = contract.file.size ? formatFileSize(contract.file.size) : '';
            
            // 파일 확장자 추출
            const fileExt = contract.file.name.split('.').pop().toLowerCase();
            
            // 파일 정보 HTML 생성
            fileArea.innerHTML = `
                <div class="file-info">
                    <i class="${iconInfo.className}" style="color: ${iconInfo.color}; font-size: 38px; margin-bottom: 10px;"></i>
                    <span class="file-name" style="font-weight: 500; font-size: 14px; margin-bottom: 5px; display: block; text-align: center;">${contract.file.name}</span>
                    <span class="file-ext" style="font-weight: bold; font-size: 12px; color: #0a2e5c; background-color: #f0f7ff; padding: 2px 6px; border-radius: 4px; margin-bottom: 5px;">${fileExt.toUpperCase()}</span>
                    <span class="file-size" style="color: #666; font-size: 12px;">${fileSize}</span>
                </div>
            `;
            
            // 파일 입력 요소 추가 (숨김)
            const input = document.createElement('input');
            input.type = 'file';
            input.id = 'contract-file-input';
            input.className = 'file-upload-input';
            input.style.display = 'none';
            input.accept = '.docx,.doc,.pdf,.xls,.xlsx,.ppt,.pptx,.hwp,.txt';
            
            // 기존 파일 데이터 설정 (가능한 경우)
            try {
                const response = fetch(contract.file.data)
                    .then(res => res.blob())
                    .then(blob => {
                        const file = new File([blob], contract.file.name, { type: contract.file.type });
                        const dataTransfer = new DataTransfer();
                        dataTransfer.items.add(file);
                        input.files = dataTransfer.files;
                    })
                    .catch(error => {
                        console.error('파일 데이터 설정 오류:', error);
                    });
            } catch (error) {
                console.error('파일 설정 시도 중 오류:', error);
            }
            
            fileArea.appendChild(input);
        } else {
            fileArea.innerHTML = `
                <i class="fas fa-cloud-upload-alt"></i>
                <span>파일을 드래그하거나 클릭하여 업로드</span>
                <input type="file" id="contract-file-input" class="file-upload-input" accept=".docx,.doc,.pdf,.xls,.xlsx,.ppt,.pptx,.hwp,.txt">
            `;
        }
    }
    
    // 기존 이벤트 리스너 제거 및 새로운 이벤트 리스너 추가
    const form = document.getElementById('add-contract-form');
    if (form) {
        // 기존 폼의 내용을 복제하되, 버튼 컨테이너는 제외
        const newForm = document.createElement('form');
        newForm.id = 'add-contract-form';
        
        // 원래 폼의 모든 자식 요소를 복사 (버튼 컨테이너 제외)
        Array.from(form.children).forEach(child => {
            // 버튼 컨테이너가 아닌 경우에만 복사
            if (!child.classList || (!child.classList.contains('button-container') && child.tagName !== 'BUTTON')) {
                newForm.appendChild(child.cloneNode(true));
            }
        });
        
        // 새 폼에 이벤트 리스너 추가
        newForm.addEventListener('submit', function(e) {
            e.preventDefault();
            console.log('수정 폼 제출');
            updateContract(contractId, year);
        });
        
        // 기존 폼을 새 폼으로 교체
        form.parentNode.replaceChild(newForm, form);
        
        // 버튼 컨테이너 생성
        const buttonContainer = document.createElement('div');
        buttonContainer.className = 'button-container';
        buttonContainer.style.display = 'flex';
        buttonContainer.style.gap = '10px';
        buttonContainer.style.justifyContent = 'center';
        buttonContainer.style.marginTop = '20px';
        
        // 수정 버튼 추가
        const updateBtn = document.createElement('button');
        updateBtn.type = 'button';
        updateBtn.textContent = '수정';
        updateBtn.className = 'edit-modal-btn';
        updateBtn.addEventListener('click', function() {
            updateContract(contractId, year);
        });
        
        // 저장 버튼 추가
        const saveBtn = document.createElement('button');
        saveBtn.type = 'button';
        saveBtn.textContent = '저장';
        saveBtn.className = 'save-modal-btn';
        saveBtn.style.backgroundColor = '#28a745';
        saveBtn.addEventListener('click', function() {
            saveContractFromModal(contract, year);
        });
        
        // 취소 버튼 추가
        const cancelBtn = document.createElement('button');
        cancelBtn.type = 'button';
        cancelBtn.textContent = '취소';
        cancelBtn.className = 'cancel-modal-btn';
        cancelBtn.style.backgroundColor = '#6c757d';
        cancelBtn.addEventListener('click', function() {
            closeAddContractModal();
        });
        
        // 버튼 추가
        buttonContainer.appendChild(updateBtn);
        buttonContainer.appendChild(saveBtn);
        buttonContainer.appendChild(cancelBtn);
        
        // 폼에 버튼 컨테이너 추가
        newForm.appendChild(buttonContainer);
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

// 계약 수정
function updateContract(contractId, year) {
    console.log('계약 수정 시작:', { contractId, year });
    
    // 수정할 계약 찾기
    const contractIndex = contracts[year].findIndex(c => c.id === contractId);
    if (contractIndex === -1) {
        console.error('수정할 계약을 찾을 수 없음');
        alert('수정할 계약을 찾을 수 없습니다.');
        return;
    }
    
    const oldContract = contracts[year][contractIndex];
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
            finishUpdateContract(updatedContract, contractIndex, year, newYear);
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
        finishUpdateContract(updatedContract, contractIndex, year, newYear);
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