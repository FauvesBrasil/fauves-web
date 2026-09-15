import { describe, expect, it } from 'vitest';
import { resolveEventAddress, resolveEventCoordinates, resolveEventLocationLabel } from './eventLocation';

describe('eventLocation', () => {
  it('prioriza o endereço estruturado em vez do marcador genérico Local', () => {
    const event = {
      location: 'Local',
      locationName: 'Teatro José de Alencar',
      locationAddress: 'Rua Liberato Barroso, 525, Fortaleza, Ceará, Brasil',
      locationCity: 'Fortaleza',
      locationUf: 'CE',
    };

    expect(resolveEventAddress(event)).toBe(event.locationAddress);
    expect(resolveEventLocationLabel(event)).toBe('Teatro José de Alencar, Fortaleza - CE');
  });

  it('não tenta geocodificar o texto genérico Local', () => {
    expect(resolveEventAddress({ location: 'Local' })).toBe('');
  });

  it('usa o nome do local presente no início do endereço e ignora o marcador Local', () => {
    expect(resolveEventLocationLabel({
      location: 'Local',
      locationName: 'Local',
      locationAddress: 'Reviver Hostel, R. de Nazaré, 200 - Centro Histórico',
      locationCity: 'São Luís',
      locationUf: 'MA',
    })).toBe('Reviver Hostel, São Luís - MA');
  });

  it('mantém coordenadas zero ou inválidas fora do mapa', () => {
    expect(resolveEventCoordinates({ locationLatitude: 0, locationLongitude: 0 })).toEqual({ lat: null, lng: null });
    expect(resolveEventCoordinates({ locationLatitude: -3.73, locationLongitude: -38.52 })).toEqual({ lat: -3.73, lng: -38.52 });
  });
});
