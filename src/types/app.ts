import type { RouteLocationNormalized } from 'vue-router';
export interface MenuItemInterface {
  nav?: string;
  name: string;
  icon: string;
  label?: string;
  caption?: string;
  to?: string;
  hide?: boolean;
  permissions?: string[];
  children?: MenuItemInterface[];
}

export interface RouteMiddleware {
  ({
    to,
    from,
    auth,
  }: {
    to: RouteLocationNormalized;
    from: RouteLocationNormalized;
    auth: AuthStore;
  }): Promise<string | boolean>;
}

export type AuthStore = {
  user: UserModel | null;
  isLogined: boolean;
  setLogout: () => void;
  onFetch: () => Promise<void>;
};

export interface UserModel {
  name: string;
  email: string;
  id: string;
  token: string;
};

export type AuthLogin = {
  email?: string | null;
  username?: string | null;
  password: string | null;
};

export interface ConfigurationModel {
  useSerialNumber: boolean;
  multipleIncomingProduct: boolean;
}

export interface TableConfiguration {
  hideColumns: string[]
  useDefaultCols: boolean
  favoritedSearches: string[]
}

