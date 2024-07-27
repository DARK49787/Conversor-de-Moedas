const valueI = document.getElementById("valor");
const select = document.getElementById("id");
const select1 = document.getElementById("id1");

async function converter() {
    let money = await fetch(
        "https://economia.awesomeapi.com.br/last/USD-BRL,EUR-BRL,BTC-BRL"
    ).then(function (resposta) {
        return resposta.json();
    });

    let dolar = parseFloat(money.USDBRL.high);
    let euro = parseFloat(money.EURBRL.high);
    let bitcoin = parseFloat(money.BTCBRL.high);
    let real = 1;
    let resultt = document.getElementById("valorConvertido");

    let amount = parseFloat(valueI.value);
    let result;

    // Conversões de DOLAR
    if (select1.value === "USD") {
        if (select.value === "USD") {
            result = amount;
        } else if (select.value === "BRL") {
            result = amount * dolar;
        } else if (select.value === "EUR") {
            result = amount * dolar / euro;
        } else if (select.value === "BTC") {
            result = amount * dolar / bitcoin;
        }
    }

    // Conversões de REAL
    if (select1.value === "BRL") {
        if (select.value === "USD") {
            result = amount / dolar;
        } else if (select.value === "BRL") {
            result = amount;
        } else if (select.value === "EUR") {
            result = amount / euro;
        } else if (select.value === "BTC") {
            result = amount / bitcoin;
        }
    }

    // Conversões de EURO
    if (select1.value === "EUR") {
        if (select.value === "USD") {
            result = amount * euro / dolar;
        } else if (select.value === "BRL") {
            result = amount * euro;
        } else if (select.value === "EUR") {
            result = amount;
        } else if (select.value === "BTC") {
            result = amount * euro / bitcoin;
        }
    }

    // Conversões de BITCOIN
    if (select1.value === "BTC") {
        if (select.value === "USD") {
            result = amount * bitcoin / dolar;
        } else if (select.value === "BRL") {
            result = amount * bitcoin;
        } else if (select.value === "EUR") {
            result = amount * bitcoin / euro;
        } else if (select.value === "BTC") {
            result = amount;
        }
    }

    let currencyFormat = {
        'USD': "en-US",
        'BRL': "pt-BR",
        'EUR': "de-DE",
        'BTC': "en-US"
    };

    let currencySymbol = {
        'USD': 'USD',
        'BRL': 'BRL',
        'EUR': 'EUR',
        'BTC': 'BTC'
    };

    resultt.innerHTML = new Intl.NumberFormat(currencyFormat[select.value], {
        style: "currency",
        currency: currencySymbol[select.value],
        minimumFractionDigits: select.value === 'BTC' ? 8 : 2
    }).format(result);
    
    resultt.style.display = 'block';
}
