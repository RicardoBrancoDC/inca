const API_URL = "COLE_AQUI_A_URL_DO_SEU_WORKER";

const form = document.getElementById("incaForm");
const statusEl = document.getElementById("status");
const scorePreview = document.getElementById("scorePreview");
const classPreview = document.getElementById("classPreview");
const ufSelect = document.getElementById("ufSelect");
const municipioSelect = document.getElementById("municipioSelect");

const UFS = [
  { sigla: "AC", nome: "Acre" },
  { sigla: "AL", nome: "Alagoas" },
  { sigla: "AP", nome: "Amapá" },
  { sigla: "AM", nome: "Amazonas" },
  { sigla: "BA", nome: "Bahia" },
  { sigla: "CE", nome: "Ceará" },
  { sigla: "DF", nome: "Distrito Federal" },
  { sigla: "ES", nome: "Espírito Santo" },
  { sigla: "GO", nome: "Goiás" },
  { sigla: "MA", nome: "Maranhão" },
  { sigla: "MT", nome: "Mato Grosso" },
  { sigla: "MS", nome: "Mato Grosso do Sul" },
  { sigla: "MG", nome: "Minas Gerais" },
  { sigla: "PA", nome: "Pará" },
  { sigla: "PB", nome: "Paraíba" },
  { sigla: "PR", nome: "Paraná" },
  { sigla: "PE", nome: "Pernambuco" },
  { sigla: "PI", nome: "Piauí" },
  { sigla: "RJ", nome: "Rio de Janeiro" },
  { sigla: "RN", nome: "Rio Grande do Norte" },
  { sigla: "RS", nome: "Rio Grande do Sul" },
  { sigla: "RO", nome: "Rondônia" },
  { sigla: "RR", nome: "Roraima" },
  { sigla: "SC", nome: "Santa Catarina" },
  { sigla: "SP", nome: "São Paulo" },
  { sigla: "SE", nome: "Sergipe" },
  { sigla: "TO", nome: "Tocantins" }
];

function initUFSelect() {
  ufSelect.innerHTML = '<option value="">Selecione a UF</option>' +
    UFS.map(uf => `<option value="${uf.sigla}">${uf.sigla} - ${uf.nome}</option>`).join("");
}

async function carregarMunicipios(uf) {
  municipioSelect.disabled = true;
  municipioSelect.innerHTML = '<option value="">Carregando municípios...</option>';

  if (!uf) {
    municipioSelect.innerHTML = '<option value="">Selecione primeiro a UF</option>';
    return;
  }

  try {
    const url = `https://servicodados.ibge.gov.br/api/v1/localidades/estados/${uf}/municipios?orderBy=nome`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error("Falha ao consultar a lista oficial do IBGE");
    }

    const municipios = await response.json();

    municipioSelect.innerHTML = '<option value="">Selecione o município</option>' +
      municipios
        .map(m => `<option value="${escapeHtml(m.nome)}" data-ibge="${m.id}">${escapeHtml(m.nome)}</option>`)
        .join("");

    municipioSelect.disabled = false;
  } catch (err) {
    municipioSelect.innerHTML = '<option value="">Não foi possível carregar os municípios</option>';
    municipioSelect.disabled = true;
    statusEl.textContent = "Não foi possível carregar a lista de municípios do IBGE. Tente novamente em alguns instantes.";
    console.error(err);
  }
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function classify(score) {
  if (score >= 80) return "Alta capacidade";
  if (score >= 60) return "Capacidade moderada";
  if (score >= 40) return "Capacidade limitada";
  return "Baixa capacidade";
}

function calcScores(data) {
  const q = (n) => Number(data.get(`q${n}`) || 0);

  const d1raw = q(1) + q(2) + q(3);      // máx 30
  const d2raw = q(4) + q(5) + q(6);      // máx 30
  const d3raw = q(7) + q(8) + q(9);      // máx 30
  const d4raw = q(10) + q(11) + q(12);   // máx 30

  const monitoramento = Math.round((d1raw / 30) * 25);
  const emissao = Math.round((d2raw / 30) * 30);
  const comunicacao = Math.round((d3raw / 30) * 25);
  const preparacao = Math.round((d4raw / 30) * 20);
  const total = monitoramento + emissao + comunicacao + preparacao;

  return {
    monitoramento,
    emissao,
    comunicacao,
    preparacao,
    total,
    classificacao: classify(total)
  };
}

function collectPayload() {
  const data = new FormData(form);
  const scores = calcScores(data);
  const respostas = {};

  for (let i = 1; i <= 12; i++) {
    respostas[`q${i}`] = Number(data.get(`q${i}`));
  }

  const selectedMunicipio = municipioSelect.options[municipioSelect.selectedIndex];
  const codigoIbge = selectedMunicipio?.dataset?.ibge || "";

  return {
    enviado_em: new Date().toISOString(),
    tipo_ente: "Municipal",
    identificacao: {
      uf: (data.get("uf") || "").trim().toUpperCase(),
      municipio: (data.get("municipio") || "").trim(),
      codigo_ibge: codigoIbge
    },
    respostas,
    pontuacao: scores,
    observacoes: (data.get("observacoes") || "").trim()
  };
}

function updatePreview() {
  const data = new FormData(form);
  const scores = calcScores(data);
  scorePreview.textContent = scores.total;
  classPreview.textContent = scores.classificacao;
}

ufSelect.addEventListener("change", async () => {
  statusEl.textContent = "";
  await carregarMunicipios(ufSelect.value);
});

form.addEventListener("change", updatePreview);
form.addEventListener("input", updatePreview);

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  statusEl.textContent = "Enviando avaliação...";

  const payload = collectPayload();

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(text || "Erro no envio");
    }

    statusEl.textContent = "Avaliação enviada com sucesso. Obrigado.";
    form.reset();
    municipioSelect.disabled = true;
    municipioSelect.innerHTML = '<option value="">Selecione primeiro a UF</option>';
    updatePreview();
  } catch (err) {
    statusEl.textContent = "Não foi possível enviar. Verifique a configuração da API.";
    console.error(err);
  }
});

initUFSelect();
updatePreview();
