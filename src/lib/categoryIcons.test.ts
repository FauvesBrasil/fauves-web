import { describe, expect, it } from 'vitest';
import { CATEGORY_ICON_OPTIONS, getCategoryIcon } from './categoryIcons';

describe('categoryIcons', () => {
  it('offers a broad, unique icon catalog', () => {
    const names = CATEGORY_ICON_OPTIONS.map((option) => option.name);
    expect(names.length).toBeGreaterThanOrEqual(80);
    expect(new Set(names).size).toBe(names.length);
  });

  it('covers the main category examples', () => {
    const labels = CATEGORY_ICON_OPTIONS.map((option) => option.label);
    ['Família', 'Livros', 'Jogos', 'Tecnologia', 'Comida e bebida', 'Inteligência artificial', 'Corrida', 'Arte', 'Clima', 'Fitness', 'Bem-estar', 'Cripto']
      .forEach((label) => expect(labels).toContain(label));
  });

  it('keeps legacy icon identifiers working', () => {
    expect(getCategoryIcon('Mic')).toBe(getCategoryIcon('Mic2'));
    expect(getCategoryIcon('Code')).toBe(getCategoryIcon('Code2'));
  });
});
