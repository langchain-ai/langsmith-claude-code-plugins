export const iso = (time: string | number) => new Date(time).toISOString();

export const later = (a: string | undefined, b: string | undefined) =>
  a === undefined || (b !== undefined && Date.parse(b) > Date.parse(a)) ? b : a;

export const earlier = (a: string, b: string) => (Date.parse(b) < Date.parse(a) ? b : a);
