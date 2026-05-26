import type { AxiosError, AxiosRequestConfig, AxiosResponse, Method as AxiosMethod } from 'axios';
import type { QDialogOptions, QTable, QTableColumn, QTableProps } from 'quasar';
import type { Ref } from 'vue';
import type { LocationQuery, RouteLocationRaw, RouteMeta, RouteParams } from 'vue-router';

type RecordQuery = { [key: string]: string | string[] | RecordQuery; }

type TableCell = string | number | null | undefined;

/* eslint-disable @typescript-eslint/no-explicit-any */
export interface RecordModel<R, REL=any, RES=any> {
  id: any;
  receive_order_id: string;
  product_id: string;
  attrs: {
    [key in keyof R]: R[key] | null
  } & REL
  response: {[key in keyof R]?: R[key]}
    & {[key in keyof REL]?: REL[key]}
    & {[key in keyof RES]?: RES[key]}
}


export interface ContactAttribute {
  category: string | null;
  email: string | null
  name: string | null;
  option?: string | null;
  phone: string | null;
  mobile: string | null;
  street: string | null;
  city: string | null;
  zipcode: string | null;
  address?: string | null;
}

export type ResourceRecordMode = 'view' | 'edit' | 'create' | 'index' | 'map';

export type TableResponse<R> = {
  data: R[];
  message?: string;
  links?: {
    first: string;
    last: string;
    next: string | null;
    prev: string | null;
  }
  meta?: {
    current_page: number;
    from: number;
    last_page: number;
    links: { active: boolean, label: string, url: string | null }[];
    path: string;
    per_page: number;
    to: number;
    total: number;
  },
}

export type RecordResponse<R> = {
  data: R;
  message?: string;
  token?: string;
  meta?: {
    [key: string]: unknown;
  },
}

export type QueueResponse = {
  key: string;
  message?: string;
  meta?: {
    [key: string]: unknown;
  },
}

export type QueueEvent<R=any> = {
  data: R;
  key: string;
  message?: string;
  unset?: boolean;
  text: string | undefined;
  subject: string;
  error?: false | {
    code: number;
    text: string;
    data?: any
  }
}

export type QueueRaw<R=any> = {
  key: string;
  message:string,
  record: R,
  redirect?: ((record: QueueEvent['data']) => RouteLocationRaw) | RouteLocationRaw | (() => void)
}

export type ErrorResponse = AxiosError<{
  message?: string
  errors?: Record<string, string[]>
}>

export interface TableRequestProperty {
  pagination: QTableProps['pagination'];
  filter?: unknown;
  page_name?: string;
}

export type TableColumn<R> = QTableColumn | {
  field?: string | { (row: R): TableCell };
  format?: { (val: TableCell | R, row: R): TableCell }
  style?: string | { (row: R): string }
  classes?: string | { (row: R): string }
}

export interface SelectProps {
  props: {
    search?: string | boolean |undefined;
    apiUrl?: string;
    apiParams?: RecordQuery | undefined
  }
}

export interface ApiRaw {
  method?: AxiosMethod;
  params?: RecordQuery;
  url?: string;
}

export interface ActionRaw<R> {
  confirm?: false | { (): QDialogOptions } | QDialogOptions;
  resolve?: boolean | { (response: RecordResponse<R> | QueueResponse): void };
  reject?: boolean | { (error: ErrorResponse): void };
}

export interface ApiRequest {
  url: string;
  method: AxiosMethod;
  params?: RecordQuery;
}

export interface ApiNormalizedRaw {
  resource: string;
  load?: ApiRaw;
  submit?: ApiRaw;
  delete?: ApiRaw;
}



export interface TableProperty<R> {
  api: {
    resource: string;
    load?: {
      [key in keyof ApiRaw]?: ApiRaw[key]
    };
    delete?: ApiRaw & ActionRaw<R>;
  };
  columns?: QTableColumn<R extends Record<string, unknown> ? R : Record<string, unknown>>[];
  pagination?: Ref<QTableProps['pagination']>;
  filterable: Ref<Filterable>;
  skipSessionStore?: boolean;
  tableRef?: Ref<QTable | null>; //!!! MUST BE DEFINED IF USING Q-TABLE AND LOAD MORE FEATURE !!!
}
export interface TableRequest {
  (property: TableRequestProperty, doneFn?: null | CallableFunction, append?: boolean): void
}

export interface TableFetch<R> {
  (property?: TableRequestProperty | null)
    : Promise<AxiosResponse<TableResponse<R>>>
}

export interface RecordProperty<R, RR = R> {
  meta?: RouteMeta;
  params?: RouteParams;
  query?: LocationQuery;
  api: {
    resource: string;
    load?: ApiRaw | null;
    submit?: ApiRaw & ActionRaw<R>
    delete?: ApiRaw & ActionRaw<R>;
  },
  origin?: Ref<RR | null>,
  default?: { (): RR };
}

export interface RecordFetch<R> {
  (request: AxiosRequestConfig): Promise<RecordResponse<R> | null>
}

export interface RecordRefresh {
  (doneFn: CallableFunction): void
}

export interface RecordResolve<R=unknown> {
  (
    message: string,
    raw: ActionRaw<R> | undefined,
    response: RecordResponse<R> | QueueResponse,
  ): void
}

export interface RecordReject<R> {
  (
    message: string,
    raw: ActionRaw<R> | undefined,
    error: ErrorResponse,
  ): void
}

export type SearchSection<R = unknown> = {
  name: string;
  value: R | string[];
  defaultValue?: R | string[];
  label: string;
  selected?: string | ((row: R) => string) | Array<{ label: string; value: string }>;
  valueParam?: string | ((row: R) => string);
  keyParam?: string;
  apiUrl?: string;
  apiParams?: RecordQuery;
  readonly?: boolean;
  noChip?: boolean;
  isMultiple?: boolean;
  hideChipValue?: boolean;
  customChipValue?: R | string | ((row: R) => string);
}

export type Filterable = {
  search: string[];
  sections: SearchSection[];
}
