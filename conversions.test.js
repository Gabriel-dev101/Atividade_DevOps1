const test = require("node:test");
const assert = require("node:assert/strict");
const FinanX = require("./finance.js");

test("converte valores para centavos com precisão", () => {
  assert.equal(FinanX.toCents("10.25"), 1025);
});

test("rejeita valores não numéricos", () => {
  assert.throws(() => FinanX.toCents("abc"), /Valor inválido/);
});

test("cria uma receita válida", () => {
  const item = FinanX.createTransaction({
    id: "t1", description: "Salário", type: "income",
    amount: 2500, category: "Salário", date: "2026-01-05"
  });
  assert.equal(item.amountCents, 250000);
  assert.equal(item.type, "income");
});

test("não permite lançamento com descrição vazia", () => {
  assert.throws(() => FinanX.createTransaction({
    description: "  ", type: "expense", amount: 20, date: "2026-01-05"
  }), /descrição/);
});

test("não permite valor zero ou negativo", () => {
  assert.throws(() => FinanX.createTransaction({
    description: "Conta", type: "expense", amount: 0, date: "2026-01-05"
  }), /maior que zero/);
  assert.throws(() => FinanX.createTransaction({
    description: "Conta", type: "expense", amount: -5, date: "2026-01-05"
  }), /maior que zero/);
});

test("calcula receitas, despesas, saldo e economias", () => {
  const transactions = [
    { type: "income", amountCents: 300000 },
    { type: "expense", amountCents: 75000 }
  ];
  const goals = [{ savedCents: 50000 }];
  assert.deepEqual(FinanX.calculateSummary(transactions, goals), {
    income: 300000, expense: 75000, balance: 225000, saved: 50000
  });
});

test("cria meta com valores válidos", () => {
  const goal = FinanX.createGoal({ id: "g1", name: "Viagem", target: 5000, saved: 500 });
  assert.equal(goal.targetCents, 500000);
  assert.equal(goal.savedCents, 50000);
});

test("não permite economia inicial maior que a meta", () => {
  assert.throws(() => FinanX.createGoal({ name: "Viagem", target: 100, saved: 120 }), /entre zero e o objetivo/);
});

test("adiciona contribuição a uma meta", () => {
  const goal = { id: "g1", name: "Reserva", targetCents: 100000, savedCents: 20000 };
  assert.equal(FinanX.addContribution(goal, 25).savedCents, 22500);
});

test("não permite contribuição acima do objetivo", () => {
  const goal = { id: "g1", name: "Reserva", targetCents: 100000, savedCents: 90000 };
  assert.throws(() => FinanX.addContribution(goal, 150), /ultrapassa/);
});

test("filtra lançamentos por tipo e texto", () => {
  const list = [
    { type: "income", description: "Salário", category: "Trabalho" },
    { type: "expense", description: "Supermercado", category: "Alimentação" },
    { type: "expense", description: "Cinema", category: "Lazer" }
  ];
  assert.equal(FinanX.filterTransactions(list, "expense", "mercado").length, 1);
  assert.equal(FinanX.filterTransactions(list, "income", "").length, 1);
});
