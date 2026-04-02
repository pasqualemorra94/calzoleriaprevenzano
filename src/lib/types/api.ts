/** Shared API response types */
export interface ApiSuccessResponse<T> {
  ok: true;
  data: T;
}

export interface ApiErrorResponse {
  ok: false;
  error: {
    code: string;
    message: string;
  };
}

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;

export interface PaginatedData<T> {
  items: T[];
  total: number;
  page: number;
  totalPages: number;
}

export interface PaginationParams {
  page?: number;
  perPage?: number;
  sort?: string;
}

/** Sort direction for API queries */
export type SortDirection = "asc" | "desc";

/** Common filter params for product listings */
export interface ProductFilters {
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  sort?: string;
  query?: string;
}
