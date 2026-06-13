const http = require("node:http");
const fs = require("node:fs/promises");
const path = require("node:path");

const PORT = process.env.PORT || 3000;
const PUBLIC_DIR = __dirname;
const API_TIMEOUT_MS = 4000;
const SUPPORTED_CURRENCIES = ["BRL", "USD", "EUR", "BTC"];
const FALLBACK_RATES = {
  BRL: 1,
  USD: 5.35,
  EUR: 5.8,
  BTC: 350000,
};

const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
};

function jsonResponse(res, statusCode, payload) {
  res.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
  });
  res.end(JSON.stringify(payload));
}

function csvResponse(res, statusCode, content, fileName) {
  res.writeHead(statusCode, {
    "Content-Type": "text/csv; charset=utf-8",
    "Content-Disposition": `attachment; filename="${fileName}"`,
    "Cache-Control": "no-store",
  });
  res.end(content);
}

function parseAmount(rawAmount) {
  const amount = Number(rawAmount);
  if (!Number.isFinite(amount) || amount <= 0) {
    return null;
  }
  return amount;
}

function parseSource(rawSource) {
  if (!rawSource) {
    return "BRL";
  }

  const source = rawSource.toUpperCase();
  return SUPPORTED_CURRENCIES.includes(source) ? source : null;
}

async function getRates() {
  const response = await fetch("https://economia.awesomeapi.com.br/last/USD-BRL,EUR-BRL,BTC-BRL", {
    signal: AbortSignal.timeout(API_TIMEOUT_MS),
  });

  if (!response.ok) {
    throw new Error("Falha ao buscar cotações externas.");
  }

  const data = await response.json();

  return {
    BRL: 1,
    USD: Number(data.USDBRL.high),
    EUR: Number(data.EURBRL.high),
    BTC: Number(data.BTCBRL.high),
    _fallback: false,
  };
}

function convertAmount(amount, source, target, rates) {
  if (source === target) {
    return amount;
  }

  const inBrl = amount * rates[source];
  return inBrl / rates[target];
}

function buildComparison(amount, source, rates) {
  return SUPPORTED_CURRENCIES.map((currency) => ({
    currency,
    value: convertAmount(amount, source, currency, rates),
  }));
}

function toCsvRows(rows) {
  const header = "currency,value";
  const contentRows = rows.map((row) => `${row.currency},${row.value}`);
  return [header, ...contentRows].join("\n");
}

async function serveStatic(req, res) {
  const requestUrl = new URL(req.url || "/", "http://localhost");
  const safeRelativePath =
    requestUrl.pathname === "/"
      ? "index.html"
      : decodeURIComponent(requestUrl.pathname).replace(/^\/+/, "");
  const publicRoot = path.resolve(PUBLIC_DIR);
  const filePath = path.resolve(publicRoot, safeRelativePath);

  if (filePath !== publicRoot && !filePath.startsWith(`${publicRoot}${path.sep}`)) {
    res.writeHead(403);
    res.end("Acesso negado");
    return;
  }

  try {
    let targetPath = filePath;
    const fileStats = await fs.stat(filePath);

    if (fileStats.isDirectory()) {
      targetPath = path.join(filePath, "index.html");
    }

    const fileContent = await fs.readFile(targetPath);
    const extension = path.extname(targetPath).toLowerCase();
    const contentType = MIME_TYPES[extension] || "application/octet-stream";

    res.writeHead(200, { "Content-Type": contentType });
    res.end(fileContent);
  } catch {
    res.writeHead(404);
    res.end("Arquivo não encontrado");
  }
}

const server = http.createServer(async (req, res) => {
  const requestUrl = new URL(req.url || "/", "http://localhost");

  if (req.method === "GET" && requestUrl.pathname === "/api/rates") {
    try {
      const rates = await getRates();
      jsonResponse(res, 200, rates);
    } catch (error) {
      console.error("Falha ao buscar taxas externas para /api/rates:", error);
      jsonResponse(res, 200, { ...FALLBACK_RATES, _fallback: true });
    }

    return;
  }

  if (req.method === "GET" && requestUrl.pathname === "/api/compare") {
    const amount = parseAmount(requestUrl.searchParams.get("amount"));
    const source = parseSource(requestUrl.searchParams.get("source"));

    if (amount === null || source === null) {
      jsonResponse(res, 400, { error: "Parâmetros inválidos para comparação." });
      return;
    }

    try {
      const rates = await getRates();
      const comparisons = buildComparison(amount, source, rates);
      jsonResponse(res, 200, { amount, source, fallback: false, comparisons });
    } catch (error) {
      console.error("Falha ao buscar taxas externas para /api/compare:", error);
      const comparisons = buildComparison(amount, source, FALLBACK_RATES);
      jsonResponse(res, 200, { amount, source, fallback: true, comparisons });
    }

    return;
  }

  if (req.method === "GET" && requestUrl.pathname === "/api/export.csv") {
    const amount = parseAmount(requestUrl.searchParams.get("amount"));
    const source = parseSource(requestUrl.searchParams.get("source"));

    if (amount === null || source === null) {
      jsonResponse(res, 400, { error: "Parâmetros inválidos para exportação." });
      return;
    }

    try {
      const rates = await getRates();
      const comparisons = buildComparison(amount, source, rates);
      const csvContent = toCsvRows(comparisons);
      csvResponse(res, 200, csvContent, "comparacao-moedas.csv");
    } catch (error) {
      console.error("Falha ao buscar taxas externas para /api/export.csv:", error);
      const comparisons = buildComparison(amount, source, FALLBACK_RATES);
      const csvContent = toCsvRows(comparisons);
      csvResponse(res, 200, csvContent, "comparacao-moedas.csv");
    }

    return;
  }

  if (req.method === "GET") {
    await serveStatic(req, res);
    return;
  }

  res.writeHead(405, { "Content-Type": "text/plain; charset=utf-8" });
  res.end("Método não permitido");
});

server.listen(PORT, () => {
  console.log(`Servidor iniciado em http://localhost:${PORT}`);
});
