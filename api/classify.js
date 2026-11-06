// 사진 한 장을 Claude API로 분류하는 서버 함수 (Vercel)
// API 키는 코드에 쓰지 않고 Vercel 환경변수 ANTHROPIC_API_KEY에 넣는다.

const MODEL = 'claude-haiku-5-5';

function buildPrompt(existing) {
  const list = existing.length ? existing.join(', ') : '(아직 없음)';
  return [
    '이 사진을 갤러리 앨범으로 정리하려고 해.',
    `지금까지 만든 카테고리: ${list}`,
    '사진이 위 카테고리 중 하나에 맞으면 그 이름을 글자 그대로 써.',
    '맞는 게 없으면 사람이 앨범 이름으로 쓸 만한 짧은 한국어 이름을 새로 만들어. (예: 고양이, 음식, 풍경사진, 스크린샷, 셀카, 여행)',
    '너무 넓은 이름(동물, 사진)이나 너무 좁은 이름(소파 위 고양이)은 피해.',
    '반드시 아래 JSON 한 줄로만 답해. 다른 말은 하지 마.',
    '{"category": "카테고리명"}'
  ].join('\n');
}

function cleanList(arr) {
  if (!Array.isArray(arr)) return [];
  return [...new Set(arr.filter(x => typeof x === 'string').map(x => x.trim().slice(0, 12)).filter(Boolean))].slice(0, 30);
}

function pickCategory(text) {
  const m = (text || '').match(/\{[\s\S]*?\}/);
  if (m) {
    try {
      const c = JSON.parse(m[0]).category;
      if (typeof c === 'string' && c.trim()) return c.trim().slice(0, 12);
    } catch (e) { /* 아래로 */ }
  }
  return null;
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST 요청만 받아요' });
  if (!process.env.ANTHROPIC_API_KEY) return res.status(500).json({ error: '서버에 API 키가 설정되지 않았어요' });

  const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
  const image = body.image;
  if (typeof image !== 'string' || !image) return res.status(400).json({ error: '사진 데이터가 없어요' });
  if (image.length > 3_000_000) return res.status(413).json({ error: '사진이 너무 커요' });

  try {
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 300,
        messages: [{
          role: 'user',
          content: [
            { type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: image } },
            { type: 'text', text: buildPrompt(cleanList(body.existing)) }
          ]
        }]
      })
    });
    const data = await r.json();
    if (!r.ok) return res.status(502).json({ error: (data.error && data.error.message) || 'AI 요청에 실패했어요' });

    // 안전 검사로 거절되면 '기타'로
    if (data.stop_reason === 'refusal') return res.json({ category: '기타' });

    // 응답에서 text 블록만 골라 읽기 (첫 블록이 text가 아닐 수 있음)
    const text = (data.content || []).filter(b => b.type === 'text').map(b => b.text).join('');
    return res.json({ category: pickCategory(text) || '기타' });
  } catch (e) {
    return res.status(500).json({ error: 'AI 서버에 연결하지 못했어요' });
  }
};
