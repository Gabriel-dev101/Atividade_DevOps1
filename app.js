
(() => {
  "use strict";

  const $ = id => document.getElementById(id);

  const STORAGE_KEYS = {
    transactions: "finanx_transactions_v1",
    goals: "finanx_goals_v1"
  };

  let transactions = loadData(STORAGE_KEYS.transactions);
  let goals = loadData(STORAGE_KEYS.goals);
  let lastConversionText = "";

  // =========================
  // ARMAZENAMENTO
  // =========================

  function loadData(key) {
    try {
      const parsed = JSON.parse(localStorage.getItem(key) || "[]");
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  function saveData() {
    localStorage.setItem(
      STORAGE_KEYS.transactions,
      JSON.stringify(transactions)
    );

    localStorage.setItem(
      STORAGE_KEYS.goals,
      JSON.stringify(goals)
    );
  }

  // =========================
  // UTILITÁRIOS
  // =========================

  function money(cents) {
    return FinanX.formatCurrency(cents);
  }

  function escapeText(value) {
    return String(value).replace(/[&<>"']/g, char => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    })[char]);
  }

  function showToast(message) {
    const toast = $("toast");

    toast.textContent = message;
    toast.classList.add("show");

    window.setTimeout(() => {
      toast.classList.remove("show");
    }, 2600);
  }

  // =========================
  // RESUMO FINANCEIRO
  // =========================

  function renderSummary() {
    const summary = FinanX.calculateSummary(
      transactions,
      goals
    );

    $("balance-value").textContent = money(summary.balance);
    $("income-value").textContent = money(summary.income);
    $("expense-value").textContent = money(summary.expense);
    $("saved-value").textContent = money(summary.saved);

    $("year").textContent = new Date().getFullYear();

    $("today-label").textContent =
      new Intl.DateTimeFormat("pt-BR", {
        dateStyle: "full"
      }).format(new Date()).toUpperCase();
  }

  // =========================
  // LANÇAMENTOS
  // =========================

  function renderTransactions() {
    const visible = FinanX.filterTransactions(
      transactions,
      $("type-filter").value,
      $("search-transaction").value
    ).sort((a, b) => b.date.localeCompare(a.date));

    const tbody = $("transaction-list");

    tbody.replaceChildren();

    if (!visible.length) {
      const row = document.createElement("tr");
      const cell = document.createElement("td");

      cell.colSpan = 5;
      cell.className = "empty-state";

      cell.textContent = transactions.length
        ? "Nenhum lançamento encontrado."
        : "Nenhum lançamento cadastrado.";

      row.append(cell);
      tbody.append(row);

      return;
    }

    visible.slice(0, 12).forEach(item => {
      const row = document.createElement("tr");

      const description = document.createElement("td");
      description.textContent = item.description;

      const category = document.createElement("td");
      category.textContent = item.category;

      const date = document.createElement("td");

      date.textContent = new Date(
        `${item.date}T12:00:00`
      ).toLocaleDateString("pt-BR");

      const amount = document.createElement("td");

      amount.className = item.type === "income"
        ? "amount-income"
        : "amount-expense";

      amount.textContent =
        `${item.type === "income" ? "+" : "−"} ${money(item.amountCents)}`;

      const actions = document.createElement("td");
      actions.className = "row-actions";

      const edit = document.createElement("button");

      edit.className = "small-action";
      edit.textContent = "Editar";
      edit.type = "button";

      edit.addEventListener("click", () => {
        editTransaction(item.id);
      });

      const remove = document.createElement("button");

      remove.className = "small-action delete";
      remove.textContent = "Excluir";
      remove.type = "button";

      remove.addEventListener("click", () => {
        deleteTransaction(item.id);
      });

      actions.append(edit, remove);

      row.append(
        description,
        category,
        date,
        amount,
        actions
      );

      tbody.append(row);
    });
  }

  // =========================
  // METAS FINANCEIRAS
  // =========================

  function renderGoals() {
    const container = $("goals-list");

    container.replaceChildren();

    if (!goals.length) {
      const empty = document.createElement("div");

      empty.className = "empty-card";
      empty.textContent = "Você ainda não criou uma meta.";

      container.append(empty);

      return;
    }

    goals.forEach(goal => {
      const item = document.createElement("article");

      item.className = "goal-item";

      const percentage = Math.min(
        100,
        Math.round(
          goal.savedCents / goal.targetCents * 100
        )
      );

      const top = document.createElement("div");
      top.className = "goal-top";

      const name = document.createElement("strong");
      name.textContent = goal.name;

      const percent = document.createElement("span");
      percent.textContent = `${percentage}%`;

      top.append(name, percent);

      const track = document.createElement("div");
      track.className = "progress-track";

      const fill = document.createElement("div");
      fill.className = "progress-fill";

      fill.style.width = `${percentage}%`;

      track.append(fill);

      const numbers = document.createElement("div");
      numbers.className = "goal-numbers";

      const saved = document.createElement("span");
      saved.textContent = money(goal.savedCents);

      const target = document.createElement("span");
      target.textContent = `Meta: ${money(goal.targetCents)}`;

      numbers.append(saved, target);

      const actions = document.createElement("div");
      actions.className = "goal-actions";

      const add = document.createElement("button");

      add.className = "small-action";
      add.type = "button";
      add.textContent = "＋ Guardar";

      add.addEventListener("click", () => {
        openContribution(goal);
      });

      const remove = document.createElement("button");

      remove.className = "small-action delete";
      remove.type = "button";
      remove.textContent = "Excluir";

      remove.addEventListener("click", () => {
        goals = goals.filter(g => g.id !== goal.id);

        persistAndRender();

        showToast("Meta excluída.");
      });

      actions.append(add, remove);

      item.append(top, track, numbers, actions);

      container.append(item);
    });
  }

  // =========================
  // ATUALIZAÇÃO DA INTERFACE
  // =========================

  function persistAndRender() {
    saveData();
    renderSummary();
    renderTransactions();
    renderGoals();
  }

  function openDialog(id) {
    $(id).showModal();
  }

  function closeDialog(id) {
    $(id).close();
  }

  // =========================
  // FORMULÁRIO DE LANÇAMENTOS
  // =========================

  function resetTransactionForm() {
    $("transaction-form").reset();

    $("transaction-id").value = "";

    $("transaction-date").value =
      new Date().toLocaleDateString("en-CA");

    $("transaction-dialog-title").textContent =
      "Novo lançamento";

    $("transaction-error").textContent = "";
  }

  function editTransaction(id) {
    const item = transactions.find(t => t.id === id);

    if (!item) return;

    $("transaction-id").value = item.id;
    $("transaction-description").value = item.description;
    $("transaction-type").value = item.type;

    $("transaction-amount").value =
      (item.amountCents / 100).toFixed(2);

    $("transaction-category").value = item.category;
    $("transaction-date").value = item.date;

    $("transaction-dialog-title").textContent =
      "Editar lançamento";

    $("transaction-error").textContent = "";

    openDialog("transaction-dialog");
  }

  function deleteTransaction(id) {
    if (!window.confirm(
      "Deseja realmente excluir este lançamento?"
    )) return;

    transactions = transactions.filter(
      item => item.id !== id
    );

    persistAndRender();

    showToast("Lançamento excluído.");
  }

  $("open-transaction").addEventListener("click", () => {
    resetTransactionForm();
    openDialog("transaction-dialog");
  });

  $("transaction-form").addEventListener("submit", event => {
    event.preventDefault();

    $("transaction-error").textContent = "";

    try {
      const id = $("transaction-id").value || undefined;

      const item = FinanX.createTransaction({
        id,
        description: $("transaction-description").value,
        type: $("transaction-type").value,
        amount: $("transaction-amount").value,
        category: $("transaction-category").value,
        date: $("transaction-date").value
      });

      if (id) {
        transactions = transactions.map(t =>
          t.id === id ? item : t
        );
      } else {
        transactions.push(item);
      }

      persistAndRender();

      closeDialog("transaction-dialog");

      showToast(
        id
          ? "Lançamento atualizado."
          : "Lançamento adicionado."
      );

    } catch (error) {
      $("transaction-error").textContent = error.message;
    }
  });

  // =========================
  // CRIAÇÃO DE METAS
  // =========================

  $("open-goal").addEventListener("click", () => {
    $("goal-form").reset();
    $("goal-error").textContent = "";

    openDialog("goal-dialog");
  });

  $("goal-form").addEventListener("submit", event => {
    event.preventDefault();

    $("goal-error").textContent = "";

    try {
      const goal = FinanX.createGoal({
        name: $("goal-name").value,
        target: $("goal-target").value,
        saved: $("goal-saved").value
      });

      goals.push(goal);

      persistAndRender();

      closeDialog("goal-dialog");

      showToast("Meta criada com sucesso.");

    } catch (error) {
      $("goal-error").textContent = error.message;
    }
  });

  // =========================
  // CONTRIBUIÇÃO PARA METAS
  // =========================

  function openContribution(goal) {
    $("contribution-goal-id").value = goal.id;
    $("contribution-goal-name").textContent = goal.name;

    $("contribution-amount").value = "";
    $("contribution-error").textContent = "";

    openDialog("contribution-dialog");
  }

  $("contribution-form").addEventListener("submit", event => {
    event.preventDefault();

    $("contribution-error").textContent = "";

    try {
      const id = $("contribution-goal-id").value;

      goals = goals.map(goal =>
        goal.id === id
          ? FinanX.addContribution(
              goal,
              $("contribution-amount").value
            )
          : goal
      );

      persistAndRender();

      closeDialog("contribution-dialog");

      showToast("Economia adicionada à meta.");

    } catch (error) {
      $("contribution-error").textContent = error.message;
    }
  });

  // =========================
  // FILTROS E PESQUISA
  // =========================

  $("type-filter").addEventListener(
    "change",
    renderTransactions
  );

  $("search-transaction").addEventListener(
    "input",
    renderTransactions
  );

  $("show-all-transactions").addEventListener("click", () => {
    $("type-filter").value = "all";
    $("search-transaction").value = "";

    renderTransactions();

    $("transactions").scrollIntoView({
      behavior: "smooth"
    });
  });

  // =========================
  // MODAIS
  // =========================

  document.querySelectorAll("[data-close]").forEach(button => {
    button.addEventListener("click", () => {
      closeDialog(button.dataset.close);
    });
  });

  document.querySelectorAll("dialog").forEach(dialog => {
    dialog.addEventListener("click", event => {
      if (event.target === dialog) {
        dialog.close();
      }
    });
  });

  // =========================
  // CONVERSOR DE MOEDAS
  // =========================

  async function convertCurrency(event) {
    event.preventDefault();

    const amount = Number(
      $("currency-amount").value
    );

    const from = $("currency-from").value
      .trim()
      .toUpperCase();

    const to = $("currency-to").value
      .trim()
      .toUpperCase();

    if (!Number.isFinite(amount) || amount <= 0) {
      showToast("Informe um valor maior que zero.");
      return;
    }

    if (!from || !to) {
      showToast("Selecione as duas moedas.");
      return;
    }

    const button = $("convert-button");

    button.disabled = true;
    button.textContent = "Consultando...";

    $("conversion-value").textContent =
      "Consultando cotação...";

    $("conversion-rate").textContent = "";

    $("copy-conversion").disabled = true;

    try {
      let rate = 1;
      let referenceDate = "";

      if (from !== to) {

        // API Frankfurter v2
        const url =
          `https://api.frankfurter.dev/v2/rate/${encodeURIComponent(from)}/${encodeURIComponent(to)}`;

        const response = await fetch(url, {
          method: "GET",
          headers: {
            "Accept": "application/json"
          }
        });

        if (!response.ok) {
          throw new Error(
            `Não foi possível consultar a cotação. HTTP ${response.status}. Verifique se as moedas são suportadas.`
          );
        }

        const data = await response.json();

        rate = Number(data.rate);
        referenceDate = data.date;

        if (!Number.isFinite(rate) || rate <= 0) {
          throw new Error(
            "A API retornou uma cotação inválida."
          );
        }

        $("conversion-rate").textContent =
          `Taxa: 1 ${from} = ${
            new Intl.NumberFormat("pt-BR", {
              maximumFractionDigits: 6
            }).format(rate)
          } ${to} · Referência: ${referenceDate}`;

      } else {
        $("conversion-rate").textContent =
          "As moedas selecionadas são iguais.";
      }

      const result = amount * rate;

      const formatted = new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: to
      }).format(result);

      $("conversion-caption").textContent =
        `${new Intl.NumberFormat("pt-BR").format(amount)} ${from} equivale a`;

      $("conversion-value").textContent = formatted;

      lastConversionText =
        `${amount} ${from} = ${formatted}`;

      $("copy-conversion").disabled = false;

    } catch (error) {
      console.error("Erro na conversão:", error);

      $("conversion-value").textContent =
        "Cotação indisponível";

      $("conversion-rate").textContent =
        error.message || "Erro inesperado ao consultar a API.";

      $("copy-conversion").disabled = true;

      showToast("Não foi possível consultar a cotação.");

    } finally {
      button.disabled = false;
      button.textContent = "Converter";
    }
  }

  $("converter-form").addEventListener(
    "submit",
    convertCurrency
  );

  // =========================
  // INVERTER MOEDAS
  // =========================

  $("swap-currencies").addEventListener("click", () => {
    const from = $("currency-from").value;

    $("currency-from").value =
      $("currency-to").value;

    $("currency-to").value = from;
  });

  // =========================
  // COPIAR RESULTADO
  // =========================

  $("copy-conversion").addEventListener("click", async () => {
    if (!lastConversionText) return;

    try {
      await navigator.clipboard.writeText(
        lastConversionText
      );

      showToast("Resultado copiado.");

    } catch (error) {
      console.error("Erro ao copiar:", error);

      showToast(
        "Não foi possível copiar automaticamente."
      );
    }
  });

  // =========================
  // INICIALIZAÇÃO
  // =========================

  persistAndRender();

})();
function executarCodigoDoUsuario(entrada) {
    return eval(entrada);
}