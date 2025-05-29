import { PaginationArgs } from './pagination.interface';

export interface PaginationResult<T> {
  data: T[];
  total: number;
  page: number;
  size: number;
}

export const paginatePrisma = async <
  T,
  Where,
  Args extends {
    where?: Where;
    skip?: number;
    take?: number;
  },
>(
  model: {
    findMany: (args: Args) => Promise<T[]>;
    count: (args: { where?: Where }) => Promise<number>;
  },
  args: Omit<Args, 'skip' | 'take'>,
  pagination: PaginationArgs,
): Promise<PaginationResult<T>> => {
  const page = pagination?.page ? Number(pagination.page) : 1;
  const size = pagination.perPage ? Number(pagination.perPage) : 10;
  const skip = (page - 1) * size;
  const take = size;

  const [total, data] = await Promise.all([
    model.count({ where: args.where }),
    model.findMany({
      ...args,
      skip,
      take,
    } as Args),
  ]);

  return {
    data,
    total,
    page,
    size,
  };
};
