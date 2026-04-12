import Dexie, { type EntityTable } from "dexie";

export type AccountKind = "nubank" | "caixa" | "hub4play-vr" | "hub4play-va" | "custom";

export interface Account {
  id: string;
  name: string;
  kind: AccountKind;
  color: string;
  openingBalance: number;
}

export interface Transaction {
  id?: number;
  accountId: string;
  date: string; // ISO yyyy-mm-dd
  description: string;
  merchant?: string;
  category: string;
  amount: number; // positive = income, negative = expense
  createdAt: number;
}

export interface Vault {
  id?: number;
  name: string;
  goal: number;
  color: string;
  accountId?: string;
  createdAt: number;
}

export interface VaultMovement {
  id?: number;
  vaultId: number;
  amount: number; // positive = aporte, negative = retirada
  date: string;
  note?: string;
  createdAt: number;
}

export const SEED_ACCOUNTS: Account[] = [
  { id: "caixa", name: "Caixa", kind: "caixa", color: "#0072c6", openingBalance: 0 },
  { id: "hub4play-va", name: "VA Hub4play", kind: "hub4play-va", color: "#f5a524", openingBalance: 0 },
  { id: "hub4play-vr", name: "VR Hub4play", kind: "hub4play-vr", color: "#34e3b0", openingBalance: 0 },
  { id: "nubank", name: "Nubank", kind: "nubank", color: "#8a2be2", openingBalance: 0 },
];

export const DEFAULT_CATEGORIES = [
  "Alimentação",
  "Transporte",
  "Moradia",
  "Lazer",
  "Saúde",
  "Educação",
  "Mercado",
  "Assinaturas",
  "Salário",
  "Transferência",
  "Outros",
];

class WorklyDB extends Dexie {
  accounts!: EntityTable<Account, "id">;
  transactions!: EntityTable<Transaction, "id">;
  vaults!: EntityTable<Vault, "id">;
  vaultMovements!: EntityTable<VaultMovement, "id">;

  constructor() {
    super("workly");
    this.version(1).stores({
      accounts: "id, kind",
      transactions: "++id, accountId, date, category",
    });
    this.version(2).stores({
      accounts: "id, kind",
      transactions: "++id, accountId, date, category, merchant",
      vaults: "++id, name",
      vaultMovements: "++id, vaultId, date",
    });
  }
}

export const db = new WorklyDB();

let seeded = false;
export async function ensureSeeded() {
  if (seeded) return;
  const count = await db.accounts.count();
  if (count === 0) {
    await db.accounts.bulkAdd(SEED_ACCOUNTS);
  }
  seeded = true;
}
