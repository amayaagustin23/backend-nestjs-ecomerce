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
    orderBy?: any;
  },
>(
  model: {
    findMany: (args: Args) => Promise<T[]>;
    count: (args: { where?: Where }) => Promise<number>;
  },
  args: Omit<Args, 'skip' | 'take'>,
  pagination: PaginationArgs,
): Promise<PaginationResult<T>> => {
  const page = Number(pagination?.page) || 1;
  const size = Number(pagination?.size) || 10;
  const skip = (page - 1) * size;
  const take = size;

  const finalArgs: Args = {
    ...args,
    skip,
    take,
    orderBy: args.orderBy ?? { createdAt: 'desc' },
  } as Args;

  const [total, data] = await Promise.all([
    model.count({ where: args.where }),
    model.findMany(finalArgs),
  ]);

  return {
    data,
    total,
    page,
    size,
  };
};
