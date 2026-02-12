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
}

export type ImportResult = {
  processed: number;
  skipped_status: number;
  skipped_type: number;
  hidden_de: number;
  errors: string[];
  cars: StockCar[];
};
