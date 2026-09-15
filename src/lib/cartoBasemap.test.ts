import { describe, expect, it } from 'vitest';
import { buildCartoBasemapUrl } from './cartoBasemap';

describe('buildCartoBasemapUrl', () => {
  it('adiciona a chave da CARTO ao mapa raster', () => {
    expect(buildCartoBasemapUrl('dark', 'carto key')).toBe(
      'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png?key=carto%20key',
    );
  });

  it('mantém o endpoint sem query string quando a chave não foi configurada', () => {
    expect(buildCartoBasemapUrl('light', '')).toBe(
      'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
    );
  });
});

