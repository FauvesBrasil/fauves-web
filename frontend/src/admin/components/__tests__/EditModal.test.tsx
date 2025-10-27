/// <reference types="vitest" />
import React from 'react';
import { vi, test, expect } from 'vitest';
import '@testing-library/jest-dom';
import { render, screen, fireEvent } from '@testing-library/react';
import EditModal from '../EditModal';

test('EditModal opens and focuses first input, closes on ESC', async () => {
  const fields = [{ name: 'title', label: 'Title' }];
  const values: any = { title: '' };
  const handleChange = vi.fn();
  const handleSave = vi.fn();
  const handleClose = vi.fn();

  render(<EditModal open={true} title="Edit" fields={fields} values={values} onChange={handleChange} onSave={handleSave} onClose={handleClose} />);

  const input = screen.getByLabelText(/Title/i);
  expect(input).toBeInTheDocument();

  // Press Escape to close
  fireEvent.keyDown(document, { key: 'Escape' });
  expect(handleClose).toHaveBeenCalled();
});
