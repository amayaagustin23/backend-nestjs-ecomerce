import * as moment from 'moment';

export interface DateRange {
  gte: string;
  lt: string;
}

export const parseDateToRange = (date: Date): DateRange => {
  const newDate = moment.utc(date);
  return {
    gte: newDate.startOf('day').toISOString(),
    lt: newDate.endOf('day').toISOString(),
  };
};

export const toBoolean = (value: any): boolean =>
  value === 'true' || value === true;

export const capitalize = (str: string) => {
  return str.charAt(0).toUpperCase() + str.slice(1);
};

export const formatARS = (value: number): string => {
  return value.toLocaleString('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 2,
  });
};

export const parseSortBy = (value: string): Record<string, 'asc' | 'desc'> => {
  if (value) {
    const [field, direction] = value.split('_');
    return { [field]: direction as 'asc' | 'desc' };
  }
};

export const generateCustomCode = (
  prefix: string = 'ECFS_AJA1109',
  blocks: number = 4,
  blockLength: number = 4,
): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

  const generateBlock = () =>
    Array.from(
      { length: blockLength },
      () => chars[Math.floor(Math.random() * chars.length)],
    ).join('');

  const suffix = Array.from({ length: blocks }, generateBlock).join('-');
  return `${prefix}-${suffix}`;
};
