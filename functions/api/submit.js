// Cloudflare Pages Function: POST /api/submit
// 환경 변수(Cloudflare Pages > Settings > Environment variables)에서 설정:
//   SUPABASE_URL          예: https://xxxx.supabase.co
//   SUPABASE_SERVICE_KEY  Supabase service_role key (Project Settings > API)
//   RESEND_API_KEY        Resend API key
//   NOTIFY_EMAIL          접수 알림을 받을 센터 이메일 주소
//   FROM_EMAIL            발신 주소 (Resend에 등록·인증된 도메인, 예: apply@yourdomain.com)

export async function onRequestPost({ request, env }) {
  let data;
  try {
    data = await request.json();
  } catch {
    return json({ error: "invalid json" }, 400);
  }

  const required = ["company", "name", "phone", "email", "description"];
  for (const k of required) {
    if (!data[k] || String(data[k]).trim() === "")
      return json({ error: `missing field: ${k}` }, 400);
  }

  const record = {
    company: s(data.company),
    company_type: s(data.type),
    contact_name: s(data.name),
    phone: s(data.phone),
    email: s(data.email),
    period: s(data.period),
    packages: data.packages || [],
    algorithms: data.algorithms || [],
    equipment: data.equipment || [],
    description: s(data.description),
  };

  // 1) Supabase 저장
  if (env.SUPABASE_URL && env.SUPABASE_SERVICE_KEY) {
    const res = await fetch(`${env.SUPABASE_URL}/rest/v1/applications`, {
      method: "POST",
      headers: {
        apikey: env.SUPABASE_SERVICE_KEY,
        Authorization: `Bearer ${env.SUPABASE_SERVICE_KEY}`,
        "Content-Type": "application/json",
        Prefer: "return=minimal",
      },
      body: JSON.stringify(record),
    });
    if (!res.ok) {
      const t = await res.text();
      return json({ error: "db insert failed", detail: t }, 500);
    }
  }

  // 2) Resend 이메일 알림
  if (env.RESEND_API_KEY && env.NOTIFY_EMAIL) {
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: env.FROM_EMAIL || "onboarding@resend.dev",
        to: [env.NOTIFY_EMAIL],
        reply_to: record.email,
        subject: `[이용신청] ${record.company}`,
        text: s(data.summary) || JSON.stringify(record, null, 2),
      }),
    }).catch(() => {}); // 메일 실패해도 접수 자체는 성공 처리
  }

  return json({ ok: true });
}

function s(v) {
  return v == null ? "" : String(v).slice(0, 5000);
}
function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
