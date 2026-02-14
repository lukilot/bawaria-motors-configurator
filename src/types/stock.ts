export type StockStatus = number; // e.g., 112, 150, 193
export type ProcessingType = 'SH' | 'ST' | 'DE' | string;
export type Visibility = 'PUBLIC' | 'HIDDEN' | 'INTERNAL';

export interface RawExcelRow {
  [key: string]: any;
}

export interface StockCar {
  vin: string;
  status_code: number;
  order_status: string;
  processing_type: string;
  reservation_details?: string; // Col S
  location?: string;
  production_date?: string; // ISO string

  // Product Definition
  model_code: string;
  model_name?: string;
  series?: string;
  body_type?: string;
  body_group?: string; // e.g., G20, G30, G45, G60
  color_code: string;
  upholstery_code: string;
  fuel_type?: string;
  power?: string;
  drivetrain?: string;
  trunk_capacity?: string;
  option_codes: string[]; // Flattened list of all codes found

  // Pricing
  list_price: number;
  special_price?: number;
  currency: string;

  // Manual / System Fields
  visibility: Visibility;
  images?: { url: string; id: string; sort_order: number }[];

  // Grouping fields (virtual)
  available_count?: number;
  sibling_vins?: string[];
  product_group_id?: string;
}

export interface ProductGroup {
  id: string;
  signature: string;
  model_code: string;
  color_code: string;
  upholstery_code: string;
  option_codes: string[];
  production_year: number;
  images?: { url: string; id: string; sort_order: number }[];
  description?: string;
  manual_price?: number;
  // Virtual / Computed
  available_units?: StockCar[];
  available_count?: number;
  min_price?: number;
  max_price?: number;
}

export type ImportResult = {
  processed: number;
  skipped_status: number;
  skipped_type: number;
  hidden_de: number;
  errors: string[];
  cars: StockCar[];
};
