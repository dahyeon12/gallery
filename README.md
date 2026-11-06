# 사진 분류 갤러리 — 배포 방법

## 파일 구성
- `index.html` : 갤러리 화면 (사진 선택 → 분류하기 → 묶음 → 앨범에 추가)
- `api/classify.js` : 사진 한 장을 Claude API(claude-haiku-5-5)로 보내 카테고리를 받아오는 서버 함수

API 키는 `api/classify.js`가 서버에서만 읽어서, 화면 코드에는 드러나지 않아요.

## Vercel로 배포하기 (무료, 브라우저에서만 진행)
1. github.com 가입 → 오른쪽 위 `+` → **New repository** → 이름 입력(예: `photo-gallery`) → Create
2. 저장소 화면에서 **uploading an existing file** → 이 폴더의 `index.html`, `README.md`, `api` 폴더를 통째로 끌어다 놓기 → **Commit changes**
   - `api/classify.js`가 `api` 폴더 안에 있어야 해요.
3. vercel.com 가입(GitHub 계정으로 로그인) → **Add New… → Project** → 방금 만든 저장소 **Import**
4. 배포 설정 화면의 **Environment Variables**에 추가
   - Name: `ANTHROPIC_API_KEY`
   - Value: Claude Console에서 발급받은 API 키
5. **Deploy** → 완료되면 나오는 주소(`https://….vercel.app`)로 접속

## 확인
- 사진 추가(+) → 체크 아이콘 → 사진 선택 → 분류하기
- 사진마다 종류 이름이 붙으면 연결 성공
- "분류하지 못했어요 (…)" 알림이 뜨면 괄호 안 메시지를 확인
  - `서버에 API 키가 설정되지 않았어요` → 4번 환경변수 확인 후 Vercel에서 **Redeploy**
  - `credit balance too low` → Console 크레딧 확인

## 주의
- 배포 주소를 아는 사람은 누구나 분류를 실행할 수 있어요. Claude Console에서 **사용 한도(Spend limit)**를 낮게 걸어 두세요.
- 사진은 긴 변 512px로 줄여서 보내요. 원본은 서버에 저장하지 않아요.
- 분류 결과와 앨범은 브라우저 화면에만 있고, 새로고침하면 사라져요.
