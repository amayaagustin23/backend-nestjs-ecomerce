export interface PaginationArgs {
  page?: number;
  size?: number;
  orderBy?: string;
  search?: string;
  date?: Date;
  startDate?: Date;
  endDate?: Date;
}

export interface PaginationAndProductArgs extends PaginationArgs {
  categoryIds?: string;
  category?: string;
  brandIds?: string;
  minPrice?: number;
  maxPrice?: number;
  variantsName?: string;
}
