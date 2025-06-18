import {
  capitalize,
  formatARS,
  formatDate,
  generateCustomCode,
  parseDateToRange,
  parseSortBy,
  toBoolean,
} from './index';

describe('utils/parsers', () => {
  describe('parseDateToRange', () => {
    it('debería devolver gte y lt en formato ISO UTC', () => {
      const inputDate = new Date('2024-01-01T10:00:00Z');
      const { gte, lt } = parseDateToRange(inputDate);

      expect(new Date(gte).getUTCHours()).toBe(0);
      expect(new Date(lt).getUTCHours()).toBe(23);
      expect(gte).toContain('T00:00:00.000Z');
      expect(lt).toContain('T23:59:59.999Z');
    });
  });

  describe('toBoolean', () => {
    it.each([
      ['true', true],
      [true, true],
      ['false', false],
      [false, false],
      [null, false],
      [undefined, false],
      [0, false],
    ])('convierte %p a %p', (input, expected) => {
      expect(toBoolean(input)).toBe(expected);
    });
  });

  describe('capitalize', () => {
    it('debería capitalizar la primera letra', () => {
      expect(capitalize('hola')).toBe('Hola');
    });

    it('no modifica si ya está capitalizado', () => {
      expect(capitalize('Hola')).toBe('Hola');
    });
  });

  describe('formatARS', () => {
    it('debería formatear a moneda ARS', () => {
      const formatted = formatARS(1234.56);
      expect(formatted).toContain('$');
      expect(formatted).toContain('1.234,56');
    });
  });

  describe('parseSortBy', () => {
    it('debería devolver objeto con campo y dirección', () => {
      expect(parseSortBy('price_desc')).toEqual({ price: 'desc' });
    });

    it('devuelve undefined si no hay valor', () => {
      expect(parseSortBy(undefined)).toBeUndefined();
    });
  });

  describe('generateCustomCode', () => {
    it('debería generar código con prefijo y 4 bloques', () => {
      const code = generateCustomCode('PRE');
      expect(code.startsWith('PRE-')).toBe(true);
      expect(code.split('-').length).toBe(5); // 1 prefijo + 4 bloques
    });

    it('debería permitir cambiar cantidad de bloques y longitud', () => {
      const code = generateCustomCode('X', 2, 6);
      const parts = code.split('-');
      expect(parts.length).toBe(3); // 1 prefijo + 2 bloques
      expect(parts[1].length).toBe(6);
      expect(parts[2].length).toBe(6);
    });
  });

  describe('formatDate', () => {
    it('debería formatear fecha como DD/MM', () => {
      const formatted = formatDate(new Date(Date.UTC(2024, 5, 12)));

      expect(formatted).toBe('12/06');
    });
  });
});
