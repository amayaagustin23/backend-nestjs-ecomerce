export interface PaginationArgs {
  page?: number;
  perPage?: number;
  orderBy?: 'createdAt' | 'updatedAt';
  search?: string;
  date?: Date;
  startDate?: Date;
  endDate?: Date;
}

export interface PaginationAndProductArgs extends PaginationArgs {
  categoryId?: string;
  brandId?: string;
  minPrice?: number;
  maxPrice?: number;
}
