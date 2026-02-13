import { Category } from '@/types/category';

export async function getCategories(token?: string) {
  const res = await fetch('/api/categories', { headers: token ? { Authorization: `Bearer ${token}` } : {} });
  if (!res.ok) throw new Error('Failed to fetch categories');
  return (await res.json()) as Category[];
}

export async function createCategory(payload: any, token?: string) {
  const res = await fetch('/api/categories', { method: 'POST', headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) }, body: JSON.stringify(payload) });
  if (!res.ok) throw new Error('Failed to create category');
  return await res.json();
}

export async function updateCategory(id: string, payload: any, token?: string) {
  const res = await fetch(`/api/categories/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) }, body: JSON.stringify(payload) });
  if (!res.ok) throw new Error('Failed to update category');
  return await res.json();
}

export async function deleteCategory(id: string, token?: string) {
  const res = await fetch(`/api/categories/${id}`, { method: 'DELETE', headers: token ? { Authorization: `Bearer ${token}` } : {} });
  if (!res.ok) throw new Error('Failed to delete category');
  return await res.json();
}
