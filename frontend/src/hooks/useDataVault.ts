import { useCallback } from "react";

const VAULT_KEY = "govglide_data_vault";

export interface VaultData {
  full_name?: string;
  date_of_birth?: string;
  mobile?: string;
  email?: string;
  gender?: string;
  category?: string;
  state?: string;
  district?: string;
  address?: string;
  pincode?: string;
  annual_income?: string;
  education_level?: string;
  institution_name?: string;
  [key: string]: string | undefined;
}

export function useDataVault() {
  const load = useCallback((): VaultData =>
    JSON.parse(localStorage.getItem(VAULT_KEY) || "{}"), []);

  const save = useCallback((data: VaultData) =>
    localStorage.setItem(VAULT_KEY, JSON.stringify(data)), []);

  const clear = useCallback(() => localStorage.removeItem(VAULT_KEY), []);

  const merge = useCallback((partial: Partial<VaultData>) =>
    save({ ...load(), ...partial }), [load, save]);

  return { load, save, clear, merge };
}
