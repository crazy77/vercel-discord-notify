# Vercel Discord Notify

Vercel의 배포 이벤트(Deployment Event)를 브로드캐스팅하여 Discord 채널로 실시간 알림을 전송해 주는 Next.js 기반의 API 프로젝트입니다. 
Vercel Webhook 기능과 Discord Webhook 기능을 연동하여, 배포 성공/실패 및 진행 상황을 팀원들과 빠르고 직관적으로 공유할 수 있습니다.

---

## 🌟 주요 기능 (Features)

- **배포 이벤트 수신**: Vercel 프로젝트의 배포 시작, 성공, 에러 등의 상태 변화를 즉각적으로 감지합니다.
- **보안/무결성 검증**: `x-vercel-signature` 헤더를 통해 요청이 실제로 Vercel에서 보낸 유효한 웹훅인지 검사합니다 (HMAC SHA1 방식).
- **디스코드 알림 포맷팅**: 배포 정보(커밋 메시지, 배포 환경, 작성자, 브랜치 뷰어 링크 등)를 가독성 높은 형태로 가공하여 디스코드 채널에 전송합니다.

<details>
<summary>알림 메시지 예시</summary>

```text
💬 **Fix: update login button style**
🚀 **SUCCEEDED** 
📱 my-awesome-project
🌐 production
🔗 https://my-awesome-project.vercel.app
👤 홍길동
🔗 [배포 상황](https://vercel.com/my-workspace/my-awesome-project/deployments/...)
```

</details>

---

## 🚀 사전 준비 (Prerequisites)

이 프로젝트를 활용하려면 다음 두 가지 정보가 필요합니다.
1. **Discord Webhook URL**: 알림을 받을 디스코드 채널의 웹훅 주소
2. **Vercel Webhook Secret**: 타겟(알림을 보낼 대상) Vercel 프로젝트에서 발급하는 웹훅 시크릿 키

---

## 🛠️ 설정 및 사용 방법 (How to use)

### 1단계: Discord Webhook URL 발급받기
1. 알림을 받고자 하는 디스코드 서버로 이동합니다.
2. 알림 채널의 `채널 편집` ⚙️ 아이콘을 클릭합니다.
3. `연동(Integrations)` 탭 > `웹훅(Webhooks)` 메뉴로 이동하여 **새 웹훅 만들기**를 클릭합니다.
4. 웹훅 이름과 프로필을 설정한 후, **웹훅 URL 복사(Copy Webhook URL)** 버튼을 눌러 URL을 기록해 둡니다.

### 2단계: 본 API 프로젝트 준비 및 배포
이 프로젝트(`vercel-discord-notify`)를 본인의 Vercel 계정에 배포해야 합니다.

1. 이 프로젝트를 Vercel에 배포합니다.
2. 배포된 Vercel 프로젝트의 `Settings` > `Environment Variables` 항목으로 이동하여 아래 환경 변수를 등록합니다.
   
| 환경 변수명 | 설명 | 비고 |
| --- | --- | --- |
| `DISCORD_WEBHOOK_URL` | 1단계에서 복사한 디스코드 웹훅 주소 | 필수 |
| `VERCEL_WEBHOOK_SECRET` | 3단계에서 Vercel 웹훅을 생성할 때 제공되는 비밀키 | 필수입력. 우선 공란이나 임의의 값으로 배포 후, 3단계 진행 시 정확한 키로 업데이트합니다. |

3. 본 프로젝트의 메인 API 엔드포인트 도메인을 확인합니다. (예: `https://my-vercel-discord-notify.vercel.app/api/deploy`)

### 3단계: 대상 Vercel 프로젝트 웹훅 설정
이제 알림을 발생시킬 실제 서비스 대상 Vercel 프로젝트에 웹훅을 등록합니다.

1. 배포 상황을 모니터링할 운영 서비스(Target Project)의 Vercel 대시보드로 이동합니다.
2. `Settings` > `Webhooks` 탭으로 이동합니다.
3. 새 웹훅을 아래와 같이 추가합니다:
   - **URL**: 2단계에서 확인한 본 API 프로젝트의 주소 (`https://[예시-도메인]/api/deploy`)
   - **Events**: 체크박스에서 원하는 배포 이벤트 (예: `deployment.created`, `deployment.succeeded`, `deployment.error`, `deployment.canceled`)를 선택합니다.
4. `Create` 버튼을 클릭하여 저장합니다.
5. ⚠️ **중요**: 생성 완료 후 해당 웹훅 항목에서 `Secret` 값을 확인할 수 있습니다. 이 **Secret 키를 복사**합니다.

### 4단계: 시크릿 키 연동 (마무리)
1. 다시 이 API 프로젝트(`vercel-discord-notify`)의 설정으로 돌아갑니다.
2. `Settings` > `Environment Variables` 에서 `VERCEL_WEBHOOK_SECRET` 값에 방금 복사한 Vercel 웹훅 Secret(문자열형태)를 붙여넣고 저장합니다.
3. 이 API 프로젝트를 재배포(Redeploy) 하여 환경 변수를 적용시킵니다.

이제부터 여러분의 핵심 서비스 Vercel 프로젝트가 배포를 시작하거나 상태를 변경할 때마다 Discord 지정 채널로 알림이 전송됩니다! 🎉

---

## 💻 로컬 개발 및 테스트

로컬 환경에서 이 API를 수정하거나 테스트하고 싶을 때 활용하는 방법입니다.

1. 리포지토리 클론 및 의존성 패키지 설치
```bash
npm install
# or yarn install / pnpm install
```

2. 프로젝트 루트의 `.env.sample` 파일을 복사하여 `.env.local` 파일을 생성합니다.
```bash
cp .env.sample .env.local
```

3. `.env.local` 파일 내 환경변수 작성
```env
DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/...
VERCEL_WEBHOOK_SECRET=your_vercel_webhook_secret_key
```

4. 개발 서버 실행
```bash
npm run dev
```
로컬 프로젝트가 `http://localhost:3000` 에서 실행되며 Postman 등의 툴을 통해 타겟 페이로드 서명(Signature)과 바디(Body)를 조작하여 정상 동작을 테스트해 볼 수 있습니다.
