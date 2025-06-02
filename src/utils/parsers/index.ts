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
