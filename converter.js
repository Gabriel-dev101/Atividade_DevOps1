(() => {
  "use strict";

  const $ = id => document.getElementById(id);
  let lastConversionText = "";
  let toastTimeout;

  function showToast(message) {
    const toast = $("toast");
    toast.textContent = message;
    toast.classList.add("show");
    window.clearTimeout(toastTimeout);
    toastTimeout = window.setTimeout(() => toast.classList.remove("show"), 2600);
  }

  async function convertCurrency(event) {
    event.preventDefault();

    const amount = Number($("currency-amount").value);
    const from = $("currency-from").value.trim().toUpperCase();
    const to = $("currency-to").value.trim().toUpperCase();
    const button = $("convert-button");

    if (!Number.isFinite(amount) || amount <= 0) {
      showToast("Informe um valor maior que zero.");
      return;
    }

    if (!from || !to) {
      showToast("Selecione as duas moedas.");
      return;
    }

    button.disabled = true;
    button.textContent = "Consultando...";
    $("conversion-value").textContent = "Consultando cotação...";
    $("conversion-rate").textContent = "";
    $("copy-conversion").disabled = true;

    try {
      let rate = 1;
      let referenceDate = "";

      if (from !== to) {
        const url = `https://api.frankfurter.dev/v2/rate/${encodeURIComponent(from)}/${encodeURIComponent(to)}`;
        const response = await fetch(url, {
          method: "GET",
          headers: { Accept: "application/json" }
        });

        if (!response.ok) {
          throw new Error(`Não foi possível consultar a cotação. HTTP ${response.status}. Verifique se as moedas são suportadas.`);
        }

        const data = await response.json();
        rate = Number(data.rate);
        referenceDate = data.date;

        if (!Number.isFinite(rate) || rate <= 0) {
          throw new Error("A API retornou uma cotação inválida.");
        }

        const formattedRate = new Intl.NumberFormat("pt-BR", {
          maximumFractionDigits: 6
        }).format(rate);
        $("conversion-rate").textContent = `Taxa: 1 ${from} = ${formattedRate} ${to} · Referência: ${referenceDate}`;
      } else {
        $("conversion-rate").textContent = "As moedas selecionadas são iguais.";
      }

      const formattedAmount = new Intl.NumberFormat("pt-BR").format(amount);
      const formattedResult = new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: to
      }).format(amount * rate);

      $("conversion-caption").textContent = `${formattedAmount} ${from} equivale a`;
      $("conversion-value").textContent = formattedResult;
      lastConversionText = `${amount} ${from} = ${formattedResult}`;
      $("copy-conversion").disabled = false;
    } catch (error) {
      console.error("Erro na conversão:", error);
      $("conversion-value").textContent = "Cotação indisponível";
      $("conversion-rate").textContent = error.message || "Erro inesperado ao consultar a API.";
      showToast("Não foi possível consultar a cotação.");
    } finally {
      button.disabled = false;
      button.textContent = "Converter";
    }
  }

  $("converter-form").addEventListener("submit", convertCurrency);

  $("swap-currencies").addEventListener("click", () => {
    const from = $("currency-from").value;
    $("currency-from").value = $("currency-to").value;
    $("currency-to").value = from;
  });

  $("copy-conversion").addEventListener("click", async () => {
    if (!lastConversionText) return;

    try {
      await navigator.clipboard.writeText(lastConversionText);
      showToast("Resultado copiado.");
    } catch (error) {
      console.error("Erro ao copiar:", error);
      showToast("Não foi possível copiar automaticamente.");
    }
  });
})();
