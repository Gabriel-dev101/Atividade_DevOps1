(function (root, factory) {
  const api = factory();
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  if (root) root.FinanX = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  function toCents(value) {
    const number = Number(value);
    if (!Number.isFinite(number)) throw new Error("Valor inválido.");
    return Math.round((number + Number.EPSILON) * 100);
  }

  function formatCurrency(cents) {
    return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(cents / 100);
  }

  function calculateSummary(transactions, goals) {
    const income = transactions.filter(item => item.type === "income").reduce((sum, item) => sum + item.amountCents, 0);
    const expense = transactions.filter(item => item.type === "expense").reduce((sum, item) => sum + item.amountCents, 0);
    const saved = goals.reduce((sum, goal) => sum + goal.savedCents, 0);
    return { income, expense, balance: income - expense, saved };
  }

  function createTransaction(data) {
    const description = String(data.description || "").trim();
    const type = data.type;
    const amountCents = toCents(data.amount);
    if (!description) throw new Error("Informe uma descrição.");
    if (!["income", "expense"].includes(type)) throw new Error("Tipo de lançamento inválido.");
    if (amountCents <= 0) throw new Error("O valor deve ser maior que zero.");
    if (!data.date) throw new Error("Informe uma data.");
    return {
      id: data.id || (typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`),
      description, type, amountCents, category: String(data.category || "Outros"), date: data.date
    };
  }

  function createGoal(data) {
    const name = String(data.name || "").trim();
    const targetCents = toCents(data.target);
    const savedCents = toCents(data.saved || 0);
    if (!name) throw new Error("Informe o nome da meta.");
    if (targetCents <= 0) throw new Error("O objetivo deve ser maior que zero.");
    if (savedCents < 0 || savedCents > targetCents) throw new Error("O valor guardado deve estar entre zero e o objetivo.");
    return {
      id: data.id || (typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`),
      name, targetCents, savedCents
    };
  }

  function addContribution(goal, amount) {
    const cents = toCents(amount);
    if (cents <= 0) throw new Error("A contribuição deve ser maior que zero.");
    if (goal.savedCents + cents > goal.targetCents) throw new Error("A contribuição ultrapassa o valor da meta.");
    return { ...goal, savedCents: goal.savedCents + cents };
  }

  function filterTransactions(transactions, type, query) {
    const term = String(query || "").trim().toLocaleLowerCase("pt-BR");
    return transactions.filter(item => {
      const typeMatches = type === "all" || item.type === type;
      const textMatches = !term || `${item.description} ${item.category}`.toLocaleLowerCase("pt-BR").includes(term);
      return typeMatches && textMatches;
    });
  }

  return { toCents, formatCurrency, calculateSummary, createTransaction, createGoal, addContribution, filterTransactions };
});
