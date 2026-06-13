const http = require("node:http");
const fs = require("node:fs/promises");
const path = require("node:path");

const PORT = process.env.PORT || 3000;
const PUBLIC_DIR = __dirname;
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

async function getRates() {
  const response = await fetch("https://economia.awesomeapi.com.br/last/USD-BRL,EUR-BRL,BTC-BRL", {
    signal: AbortSignal.timeout(4000),
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
    const fileContent = await fs.readFile(filePath);
    const extension = path.extname(filePath).toLowerCase();
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
    } catch {
      jsonResponse(res, 200, { ...FALLBACK_RATES, _fallback: true });
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
