const form = document.getElementById("converter-form");
const amountInput = document.getElementById("amount");
const sourceSelect = document.getElementById("source-currency");
const targetSelect = document.getElementById("target-currency");
const resultOutput = document.getElementById("converted-value");
const statusElement = document.getElementById("status");
const convertButton = document.getElementById("convert-button");
const comparisonTableBody = document.getElementById("comparison-table-body");
const exportButton = document.getElementById("export-button");

const currencyLocale = {
  USD: "en-US",
  BRL: "pt-BR",
  EUR: "de-DE",
  BTC: "en-US",
};

const BTC_PRECISION = 8;
const DEFAULT_PRECISION = 2;

let lastComparisonParams = null;

function setStatus(message, type = "info") {
  statusElement.textContent = message;
  statusElement.className = `status ${type}`;
}

function formatCurrency(value, currency) {
  return new Intl.NumberFormat(currencyLocale[currency], {
    style: "currency",
    currency,
    minimumFractionDigits: currency === "BTC" ? BTC_PRECISION : DEFAULT_PRECISION,
  }).format(value);
}

function renderComparisonTable(comparisons) {
  comparisonTableBody.innerHTML = "";

  comparisons.forEach((item) => {
    const row = document.createElement("tr");
    const currencyCell = document.createElement("td");
    const valueCell = document.createElement("td");

    currencyCell.textContent = `${item.currency}`;
    valueCell.textContent = formatCurrency(item.value, item.currency);

    row.append(currencyCell, valueCell);
    comparisonTableBody.appendChild(row);
  });
}

function setEmptyComparisonTable(message) {
  comparisonTableBody.innerHTML = "";
  const row = document.createElement("tr");
  const cell = document.createElement("td");
  cell.colSpan = 2;
  cell.textContent = message;
  row.appendChild(cell);
  comparisonTableBody.appendChild(row);
}

async function fetchComparison(amount, source) {
  const params = new URLSearchParams({ amount: String(amount), source });
  const response = await fetch(`/api/compare?${params.toString()}`);

  if (!response.ok) {
    throw new Error("Não foi possível obter a comparação de preços.");
  }

  return response.json();
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();

  const amount = Number(amountInput.value);
  const source = sourceSelect.value;
  const target = targetSelect.value;

  resultOutput.textContent = "";

  if (!Number.isFinite(amount) || amount <= 0) {
    setStatus("Informe um valor maior que zero para conversão.", "error");
    exportButton.disabled = true;
    setEmptyComparisonTable("Informe um valor válido para gerar a tabela.");
    return;
  }

  convertButton.disabled = true;
  exportButton.disabled = true;
  setStatus("Carregando cotação...", "info");

  try {
    const data = await fetchComparison(amount, source);
    const selectedItem = data.comparisons.find((item) => item.currency === target);
    const converted = selectedItem ? selectedItem.value : NaN;

    if (!Number.isFinite(converted)) {
      throw new Error("Não foi possível calcular a moeda selecionada.");
    }

    resultOutput.textContent = formatCurrency(converted, target);
    renderComparisonTable(data.comparisons);
    lastComparisonParams = { amount, source };
    exportButton.disabled = false;

    setStatus(
      data.fallback
        ? "Conversão realizada com cotação de contingência."
        : "Conversão realizada com sucesso.",
      "success"
    );
  } catch {
    exportButton.disabled = true;
    setEmptyComparisonTable("Falha ao gerar comparações no momento.");
    setStatus("Não foi possível converter agora. Tente novamente em instantes.", "error");
  } finally {
    convertButton.disabled = false;
  }
});

exportButton.addEventListener("click", () => {
  if (!lastComparisonParams) {
    return;
  }

  const params = new URLSearchParams({
    amount: String(lastComparisonParams.amount),
    source: lastComparisonParams.source,
  });

  window.location.href = `/api/export.csv?${params.toString()}`;
});
