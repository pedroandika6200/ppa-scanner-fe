export interface UploadableModel {
  id: number;
  __file?: File;
  __img?: File;
  filename: string;
  label: string;
  extension: string;
  path: string;
  url: string;
  temp_url: string;
  isUploading?: boolean;
  isRemoving?: boolean;
  category?: string;
  created_at?: string;
}

export interface OperatorModel {
  name: string,
  id: string | number | null,
}

export interface ShiftModel {
  id: string | number,
  name: string
}

export interface WOItemModel {
  // id: string | number,
  // work_order_number: string,
  // work_order_date: string,
  // work_order_shift: string,
  // quantity: string | number,

  id: string| number,
  work_order_id: string | number,
  item_id: string | number,
  unit_id: string | number,
  quantity: number,
  target: number,
  unit_rate: number,
  ngratio: number,
  amount_process: number,
  amount_packing: number,
  amount_faulty: number,
  note: string | null,
  producted_notes: string | null,
  deleted_at: string | null,
  unit_amount: number,
  work_order_number: string,
  work_order_date: string,
  work_order_shift: string
}

export interface CustomerModel {
  id: string | number,
  name: string,
  code: string
}

export interface PartModel {
  id: string | number,
  part_name: string,
  code: string,
  part_alias: string,
  item_units: UnitModel[],
}

export interface UnitModel {
  id: string | number,
  unit_id: string | number,
  rate: number,
  decimal_in: number,
  unit: {
    id: string | number,
    name: string,
    code: string,
    decimal_in: number,
  }
}

export interface FaultTypeModel {
  id: string | number,
  name: string,
  code: string
}

export interface FaultModel {
  id: string | number,
  type_fault_id: string | number,
  name: string,
  description: string | null,
}

export interface FormModel {
  line: string, //may not be used

  worktime?: 'REGULER' | 'OVERTIME',

  type_fault?: FaultTypeModel | null,
  type_fault_id?: string | number | null,

  scanned_operator_name?: string,
  operator?: OperatorModel | null,
  operator_id?: string | number | null,

  scanned_shift?: string,
  shift?: ShiftModel | null,
  shift_id?: string | number | null,

  scanned_date?: string,
  date?: string,

  items: FormItemModel[]
}

export interface PackingItemOrderModel {
  work_order_item: WOItemModel,
  work_order_item_id: string | number,
  quantity: number
}

export interface PackingItemFaultModel {
  work_order_item: WOItemModel,
  work_order_item_id: string | number,
  fault_id: string | number,
  quantity: number
}

export interface PackingItemsModel {
  item_id: string | number,
  item: PartModel,
  unit_id: string | number,
  unit_rate: number,
  unit: UnitModel,
  quantity: number,
  packing_item_orders: PackingItemOrderModel[], //OK list
  type_fault_id: string | number | null,
  packing_item_faults: PackingItemFaultModel[], //NG list
}

export interface FormItemModel {
  id?: string | number,
  number?: string,

  description?: string,

  scanned_customer?: string,
  customer?: CustomerModel | null,
  customer_id?: string | number | null,

  scanned_part_name?: string,
  part?: PartModel | null,
  item_id?: string | number | null,

  unit?: UnitModel | null,
  unit_id?: string | number | null,

  // work_order_item?: WOItemModel | null,
  // work_order_item_id?: string | number | null,

  lot_number: string, // may not be used

  worktime: string, // may not be used
  begin_datetime: string, // may not be used
  until_datetime: string, // may not be used

  // type_fault?: FaultTypeModel | null,
  // type_fault_id?: string | number | null,

  scanned_ok?: string,
  ok: string | number,

  ok_list?: {
    work_order_item?: WOItemModel | null,
    work_order_item_id?: string | number | null,
    quantity: number,

    is_ng_collapsed: boolean,
  }[],

  scanned_ng?: string,
  ng: string | number,

  ng_list: {
    code?: string | number | null,
    scanned_code?: string | number,

    work_order_item?: WOItemModel | null,
    work_order_item_id?: string | number | null,

    fault?: FaultModel | null,
    fault_id?: string | number | null,

    scanned_quantity?: string | number,
    quantity: string | number,
  }[],

  is_markup_ng_collapsed: boolean,

  is_collapsed: boolean,
  is_submitted: boolean,
  error?: string | null,
  loading?: boolean
}

export interface InspectionFormModel {
  customer_id: string | number,

  date: string,
  // begin_datetime: string, // may not be used
  // until_datetime: string, // may not be used

  shift_id: string | number,

  worktime: 'REGULER' | 'OVERTIME',

  description: string,

  operator_id: string | number,
  operator: OperatorModel,

  packing_items: PackingItemsModel,
}

export interface ScannedDataModel {
  line: string,
  operator_name: string,
  shift: string,
  date: string,
  items: {
    customer: string,
    part_name: string,
    lot_number: string,
    worktime: string,
    begin_datetime: string,
    until_datetime: string,
    ok: string,
    ng: string,
    ng_list: {
      code: string | number,
      quantity: string | number,
    }[]
  }[]
}

export interface CapturedImageModel {
  base64: string;
  scan_result: ScannedDataModel | null;
  form: FormModel;
  on_process: boolean;
  is_error: boolean;
  is_submitted: boolean;
  image_zoom_mode: 'mouseover' | 'click';
}
