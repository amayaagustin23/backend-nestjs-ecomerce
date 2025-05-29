export interface PaginationArgs {
  page?: number;
  perPage?: number;
  orderBy?: 'createdAt' | 'updatedAt';
  search?: string;
  date?: Date;
  startDate?: Date;
  endDate?: Date;
}
