// Cloudflare Pages Function: GET /api/gallery
// 환경 변수는 functions/api/submit.js와 동일하게 SUPABASE_URL, SUPABASE_SERVICE_KEY 사용.
// Supabase 대시보드 > Table Editor > gallery 에서 행을 추가/수정하면 이 API에 바로 반영됨.
// image_path 컬럼에는 images/gallery/ 폴더에 실제로 업로드한 파일의 경로를 입력.

export async function onRequestGet({ env }) {
  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_KEY) return json([]);

  const res = await fetch(
    `${env.SUPABASE_URL}/rest/v1/gallery?select=*&order=sort_order.asc,created_at.asc`,
    {
      headers: {
        apikey: env.SUPABASE_SERVICE_KEY,
        Authorization: `Bearer ${env.SUPABASE_SERVICE_KEY}`,
      },
    }
  );
  if (!res.ok) return json({ error: "fetch failed" }, 500);
  return json(await res.json());
}

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
