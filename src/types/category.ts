export interface Category {
  id: string;
  name: string;
  slug?: string | null;
  description?: string | null;
  parentId?: string | null;
  organizationId?: string | null;
  isActive: boolean;
  order: number;
  createdAt: string;
  updatedAt: string;
}
