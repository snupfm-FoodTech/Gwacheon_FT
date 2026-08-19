# 기업 신청 페이지 배포 안내 (Cloudflare Pages + Supabase + Resend)

## 폴더 구성
- `index.html` — 신청 페이지 (v5)
- `functions/api/submit.js` — 신청 접수 API (Supabase 저장 + Resend 이메일 알림)

접수 API가 없거나 오류가 나면 페이지는 자동으로 이메일 작성 창(mailto)으로 대체 동작하므로, 정적 배포만 먼저 해도 됩니다. OpenRouter 키는 이 사이트에 필요하지 않습니다(AI 호출 기능 없음).

## 1. Supabase 테이블 생성
Supabase 대시보드 > SQL Editor에서 실행:

```sql
create table public.applications (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  company text not null,
  company_type text,
  contact_name text not null,
  phone text not null,
  email text not null,
  period text,
  packages jsonb default '[]',
  algorithms jsonb default '[]',
  equipment jsonb default '[]',
  description text not null
);

alter table public.applications enable row level security;
-- service_role 키로만 서버(함수)에서 기록하므로 별도 정책 불필요
```

## 2. Resend 설정
1. resend.com 가입 후 API Key 발급
2. 발신 도메인이 없으면 `onboarding@resend.dev`로 테스트 발송 가능(수신은 가입 계정 메일로 제한). 실제 운영 시 도메인 등록·인증 후 `FROM_EMAIL` 지정

## 3. Cloudflare Pages 배포
1. dash.cloudflare.com > Workers & Pages > Create > Pages > **Upload assets**
2. 이 `deploy` 폴더 전체(zip)를 업로드 (functions 폴더 포함)
3. 배포 후 Settings > **Environment variables**에 아래 값 추가 (Production):
   - `SUPABASE_URL` : Supabase Project Settings > API의 Project URL
   - `SUPABASE_SERVICE_KEY` : 같은 화면의 service_role key
   - `RESEND_API_KEY` : Resend API key
   - `NOTIFY_EMAIL` : 접수 알림 받을 센터 이메일
   - `FROM_EMAIL` : 발신 주소 (도메인 인증 전이면 생략 가능)
4. 변수 추가 후 Retry deployment(재배포)

## 4. 확인
- 배포 URL 접속 > 신청서 작성 > 제출 → "신청이 접수되었습니다" 표시 확인
- Supabase > Table Editor > applications에 행 생성 확인
- NOTIFY_EMAIL로 알림 메일 수신 확인

## 보안 참고
- service_role 키와 API 키는 반드시 Cloudflare 환경 변수에만 넣고, HTML/코드에 넣지 않습니다.
- 채팅 등 외부에 노출된 키·비밀번호는 재발급/변경을 권장합니다.
