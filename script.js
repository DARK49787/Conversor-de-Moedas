const form = document.getElementById("converter-form");
const amountInput = document.getElementById("amount");
const sourceSelect = document.getElementById("source-currency");
const targetSelect = document.getElementById("target-currency");
const resultOutput = document.getElementById("converted-value");
const statusElement = document.getElementById("status");
const convertButton = document.getElementById("convert-button");

const currencyLocale = {
  USD: "en-US",
  BRL: "pt-BR",
  EUR: "de-DE",
  BTC: "en-US",
};

const currencyCode = {
  USD: "USD",
  BRL: "BRL",
  EUR: "EUR",
  BTC: "BTC",
};

function setStatus(message, type = "info") {
  statusElement.textContent = message;
  statusElement.className = `status ${type}`;
}

function formatCurrency(value, currency) {
  return new Intl.NumberFormat(currencyLocale[currency], {
    style: "currency",
    currency: currencyCode[currency],
    minimumFractionDigits: currency === "BTC" ? 8 : 2,
  }).format(value);
}

function convertAmount(amount, source, target, rates) {
  if (source === target) {
    return amount;
  }

  const inBrl = amount * rates[source];
  return inBrl / rates[target];
}

async function fetchRates() {
  const response = await fetch("/api/rates");

  if (!response.ok) {
    throw new Error("Não foi possível obter as cotações.");
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
    return;
  }

  convertButton.disabled = true;
  setStatus("Carregando cotação...", "info");

  try {
    const rates = await fetchRates();
    const converted = convertAmount(amount, source, target, rates);
    resultOutput.textContent = formatCurrency(converted, target);
    setStatus(
      rates._fallback
        ? "Conversão realizada com cotação de contingência."
        : "Conversão realizada com sucesso.",
      "success"
    );
  } catch {
    setStatus("Não foi possível converter agora. Tente novamente em instantes.", "error");
  } finally {
    convertButton.disabled = false;
  }
});
