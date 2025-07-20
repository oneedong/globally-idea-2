# KB증권 계약 관리 시스템

KB증권 세일즈 계약 관리 시스템은 계약 문서를 체계적으로 관리하고 계약 진행 상황을 추적하기 위한 웹 애플리케이션입니다.

## 주요 기능

- **사용자 인증**: 부서별 사용자 계정 관리 및 로그인/로그아웃
- **계약 관리**: 계약 추가, 수정, 삭제 기능
- **파일 업로드**: 계약서 파일 업로드 및 다운로드
- **필터링 및 검색**: 계약명, 계약 종류, 거래 상대방, 체결 현황 등으로 필터링
- **페이지네이션**: 대량의 계약 목록을 효율적으로 표시
- **다중 사용자 환경**: Firebase를 통한 데이터 동기화로 여러 사용자가 동시에 작업 가능

## 기술 스택

- **프론트엔드**: HTML, CSS, JavaScript
- **백엔드**: Firebase (Authentication, Firestore, Storage)
- **배포**: Vercel

## 시작하기

1. Firebase 프로젝트 생성
2. Firebase 설정 파일 업데이트 (firebase-config.js)
3. 웹 애플리케이션 배포

## Firebase 설정

Firebase 콘솔에서 새 프로젝트를 생성하고 웹 애플리케이션을 추가한 후, 다음 서비스를 활성화하세요:

1. **Authentication**: 이메일/비밀번호 로그인 활성화
2. **Firestore Database**: 데이터베이스 생성 및 보안 규칙 설정
3. **Storage**: 파일 저장소 생성 및 보안 규칙 설정

## 보안 규칙

### Firestore 보안 규칙

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read: if request.auth != null && request.auth.uid == userId;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
    match /contracts/{contractId} {
      allow read: if request.auth != null && 
                  (resource.data.department == get(/databases/$(database)/documents/users/$(request.auth.uid)).data.department ||
                   get(/databases/$(database)/documents/users/$(request.auth.uid)).data.isAdmin == true);
      allow write: if request.auth != null && 
                  (request.resource.data.department == get(/databases/$(database)/documents/users/$(request.auth.uid)).data.department ||
                   get(/databases/$(database)/documents/users/$(request.auth.uid)).data.isAdmin == true);
    }
    match /contractNumbers/{document=**} {
      allow read: if request.auth != null;
      allow write: if request.auth != null;
    }
  }
}
```

### Storage 보안 규칙

```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /contracts/{department}/{contractId}/{fileName} {
      allow read: if request.auth != null && 
                  (department == get(/databases/$(database)/documents/users/$(request.auth.uid)).data.department ||
                   get(/databases/$(database)/documents/users/$(request.auth.uid)).data.isAdmin == true);
      allow write: if request.auth != null && 
                  (department == get(/databases/$(database)/documents/users/$(request.auth.uid)).data.department ||
                   get(/databases/$(database)/documents/users/$(request.auth.uid)).data.isAdmin == true);
    }
  }
}
```

## 라이센스

이 프로젝트는 KB증권의 내부 사용을 위해 개발되었습니다. 