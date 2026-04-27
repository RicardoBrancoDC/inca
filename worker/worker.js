export default {
  async fetch(request, env) {
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders() });
    }

    if (request.method !== "POST") {
      return new Response("Método não permitido", { status: 405, headers: corsHeaders() });
    }

    try {
      const payload = await request.json();

      if (!payload?.identificacao?.uf || !payload?.identificacao?.municipio || !payload?.pontuacao) {
        return new Response("Dados incompletos", { status: 400, headers: corsHeaders() });
      }

      const now = new Date().toISOString();
      const safeUF = String(payload.identificacao.uf).replace(/[^A-Z]/g, "").slice(0, 2) || "XX";
      const safeMun = String(payload.identificacao.municipio)
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-zA-Z0-9_-]/g, "_")
        .slice(0, 80);

      const filename = `data/respostas/${now.replace(/[:.]/g, "-")}_${safeUF}_${safeMun}.json`;

      const content = btoa(unescape(encodeURIComponent(JSON.stringify(payload, null, 2))));

      const apiUrl = `https://api.github.com/repos/${env.GITHUB_OWNER}/${env.GITHUB_REPO}/contents/${filename}`;

      const ghResponse = await fetch(apiUrl, {
        method: "PUT",
        headers: {
          "Authorization": `Bearer ${env.GITHUB_TOKEN}`,
          "Accept": "application/vnd.github+json",
          "User-Agent": "inca-form-worker"
        },
        body: JSON.stringify({
          message: `Nova resposta INCA: ${safeUF} ${payload.identificacao.municipio}`,
          content,
          branch: env.GITHUB_BRANCH || "main"
        })
      });

      if (!ghResponse.ok) {
        const text = await ghResponse.text();
        return new Response(`Erro ao gravar no GitHub: ${text}`, { status: 500, headers: corsHeaders() });
      }

      return new Response(JSON.stringify({ ok: true, file: filename }), {
        status: 200,
        headers: { ...corsHeaders(), "Content-Type": "application/json" }
      });
    } catch (err) {
      return new Response("Erro interno: " + err.message, { status: 500, headers: corsHeaders() });
    }
  }
}

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type"
  };
}
