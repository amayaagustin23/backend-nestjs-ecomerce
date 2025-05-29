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
