// DndTicketList - Complete drag and drop ticket list component using @dnd-kit
// Supports: reordering within containers, moving between containers, category reordering, mobile touch

import React, { useState } from 'react';
import {
    DndContext,
    DragOverlay,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    TouchSensor,
    useSensor,
    useSensors,
    DragStartEvent,
    DragEndEvent,
    DragOverEvent,
    UniqueIdentifier,
    useDroppable,
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
    useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, MoreVertical, ChevronDown, ChevronUp, Pencil, Copy, Tag, Trash, FolderInput } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

interface Ticket {
    id: string;
    name: string;
    price: number;
    maxQuantity: number;
    sold?: number;
    categoryId: string | null;
    isHalf?: boolean;
    isOnSale?: boolean;
    parentId?: string;
    [key: string]: any;
}

interface Category {
    id: string;
    name: string;
    [key: string]: any;
}

interface DndTicketListProps {
    categories: Category[];
    tickets: Ticket[];
    onTicketsChange: (tickets: Ticket[]) => void;
    onCategoriesChange: (categories: Category[]) => void;
    onMoveToCategory: (ticketId: string, categoryId: string | null) => void;
    onReorderTickets: (tickets: Ticket[]) => void;
    onReorderCategories: (categories: Category[]) => void;
    onEditTicket: (ticket: Ticket) => void;
    onDuplicateTicket: (ticketId: string) => void;
    onDeleteTicket: (ticketId: string) => void;
    onMarkSold: (ticketId: string) => void;
    onReopenSales: (ticketId: string) => void;
    onEditCategory: (category: Category) => void;
    onDeleteCategory: (categoryId: string) => void;
    formatBRL: (n: number) => string;
}

// Sortable Ticket Item Component
function SortableTicketItem({
    ticket,
    formatBRL,
    onEdit,
    onDuplicate,
    onDelete,
    onMarkSold,
    onReopenSales,
    categories,
    onMoveToCategory,
}: {
    ticket: Ticket;
    formatBRL: (n: number) => string;
    onEdit: () => void;
    onDuplicate: () => void;
    onDelete: () => void;
    onMarkSold: () => void;
    onReopenSales: () => void;
    categories: Category[];
    onMoveToCategory: (ticketId: string, categoryId: string | null) => void;
}) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: ticket.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
        zIndex: isDragging ? 1000 : 1,
    };

    const displayName = ticket.name || 'Nome do ingresso';
    const isSoldOut = ticket.maxQuantity === 0 || (ticket.sold || 0) >= ticket.maxQuantity;

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={`bg-white dark:bg-[#242424] rounded-lg border border-gray-200 dark:border-[#1F1F1F] p-4 mb-2 transition-all ${isDragging ? 'shadow-lg ring-2 ring-blue-500' : 'shadow-sm'}`}
        >
            <div className="flex items-center gap-3">
                {/* Drag Handle */}
                <div
                    {...attributes}
                    {...listeners}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 cursor-grab active:cursor-grabbing p-1 touch-none"
                >
                    <GripVertical className="w-5 h-5" />
                </div>

                {/* Ticket Info */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-gray-900 dark:text-white truncate">{displayName}</span>
                        {!ticket.isOnSale ? (
                            <span className="px-2 py-0.5 text-xs font-medium bg-gray-500 text-white rounded">ENCERRADO</span>
                        ) : isSoldOut ? (
                            <span className="px-2 py-0.5 text-xs font-medium bg-purple-600 text-white rounded">ESGOTADO</span>
                        ) : (
                            <span className="px-2 py-0.5 text-xs font-medium bg-green-500 text-white rounded">À VENDA</span>
                        )}
                    </div>
                </div>

                {/* Price */}
                <div className="text-gray-900 dark:text-white font-bold whitespace-nowrap">
                    {ticket.price === 0 ? 'Gratuito' : formatBRL(ticket.price)}
                </div>

                {/* Quantity */}
                <div className="text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap">
                    {ticket.sold || 0} / {ticket.maxQuantity}
                </div>

                {/* Actions Menu */}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <button className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600">
                            <MoreVertical className="w-4 h-4" />
                        </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuItem onClick={onEdit}>
                            <Pencil className="w-4 h-4 mr-2" /> Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={onDuplicate}>
                            <Copy className="w-4 h-4 mr-2" /> Duplicar
                        </DropdownMenuItem>
                        {categories.length > 0 && (
                            <>
                                <div className="h-px bg-gray-200 dark:bg-gray-700 my-1" />
                                {categories.map(cat => (
                                    <DropdownMenuItem
                                        key={cat.id}
                                        onClick={() => onMoveToCategory(ticket.id, cat.id)}
                                        disabled={ticket.categoryId === cat.id}
                                    >
                                        <FolderInput className="w-4 h-4 mr-2" />
                                        {ticket.categoryId === cat.id ? '✓ ' : ''}{cat.name}
                                    </DropdownMenuItem>
                                ))}
                                {ticket.categoryId && (
                                    <DropdownMenuItem onClick={() => onMoveToCategory(ticket.id, null)}>
                                        <FolderInput className="w-4 h-4 mr-2" /> Sem categoria
                                    </DropdownMenuItem>
                                )}
                            </>
                        )}
                        <div className="h-px bg-gray-200 dark:bg-gray-700 my-1" />
                        {ticket.maxQuantity === 0 ? (
                            <DropdownMenuItem onClick={onReopenSales}>
                                <Tag className="w-4 h-4 mr-2" /> Reabrir vendas
                            </DropdownMenuItem>
                        ) : (
                            <DropdownMenuItem onClick={onMarkSold}>
                                <Tag className="w-4 h-4 mr-2" /> Marcar esgotado
                            </DropdownMenuItem>
                        )}
                        <DropdownMenuItem onClick={onDelete} className="text-red-600">
                            <Trash className="w-4 h-4 mr-2" /> Excluir
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </div>
    );
}

// Drop Zone Component
function CategoryDropZone({
    id,
    label,
    isOver,
    isEmpty,
}: {
    id: string;
    label: string;
    isOver: boolean;
    isEmpty: boolean;
}) {
    const { setNodeRef } = useDroppable({ id });

    if (!isEmpty && !isOver) return null;

    return (
        <div
            ref={setNodeRef}
            className={`border-2 border-dashed rounded-lg p-4 text-center transition-all ${isOver
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30'
                : 'border-gray-300 dark:border-gray-600'
                }`}
        >
            <p className={`text-sm ${isOver ? 'text-blue-600 dark:text-blue-400 font-medium' : 'text-gray-500 dark:text-gray-400'}`}>
                {isOver ? '⬇ Solte aqui' : label}
            </p>
        </div>
    );
}

// Sortable Category Container with drag-and-drop for reordering categories
function SortableCategoryContainer({
    category,
    tickets,
    isDragActive,
    isOverCategory,
    formatBRL,
    onEditTicket,
    onDuplicateTicket,
    onDeleteTicket,
    onMarkSold,
    onReopenSales,
    onEditCategory,
    onDeleteCategory,
    categories,
    onMoveToCategory,
    activeTicketCategoryId,
    activeDragType,
}: {
    category: Category;
    tickets: Ticket[];
    isDragActive: boolean;
    isOverCategory: boolean;
    formatBRL: (n: number) => string;
    onEditTicket: (ticket: Ticket) => void;
    onDuplicateTicket: (ticketId: string) => void;
    onDeleteTicket: (ticketId: string) => void;
    onMarkSold: (ticketId: string) => void;
    onReopenSales: (ticketId: string) => void;
    onEditCategory: (category: Category) => void;
    onDeleteCategory: (categoryId: string) => void;
    categories: Category[];
    onMoveToCategory: (ticketId: string, categoryId: string | null) => void;
    activeTicketCategoryId: string | null | undefined;
    activeDragType: 'ticket' | 'category' | null;
}) {
    const [expanded, setExpanded] = useState(true);
    const filteredTickets = tickets.filter(t => !t.isHalf);

    // Category sortable for reordering categories
    const {
        attributes: catAttributes,
        listeners: catListeners,
        setNodeRef: setCatSortableRef,
        transform: catTransform,
        transition: catTransition,
        isDragging: isCatDragging,
    } = useSortable({ id: `cat-${category.id}` });

    const catStyle = {
        transform: CSS.Transform.toString(catTransform),
        transition: catTransition,
        opacity: isCatDragging ? 0.5 : 1,
        zIndex: isCatDragging ? 1000 : 1,
    };

    // Drop zone for ticket drops
    const { setNodeRef: setDroppableRef, isOver } = useDroppable({
        id: `category-drop-${category.id}`,
        data: { type: 'category', categoryId: category.id },
    });

    // Show drop effect ONLY for tickets from DIFFERENT category
    const isDifferentCategory = activeTicketCategoryId === null
        ? category.id !== null
        : activeTicketCategoryId !== category.id;
    const showDropEffect = (isOver || isOverCategory) && isDragActive && isDifferentCategory && activeDragType === 'ticket';

    return (
        <div
            ref={(node) => {
                setCatSortableRef(node);
                setDroppableRef(node);
            }}
            style={catStyle}
            className={`rounded-xl border-2 transition-all mb-4 ${showDropEffect
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                : isCatDragging
                    ? 'border-blue-400 bg-blue-50 dark:bg-blue-900/10 shadow-lg'
                    : 'border-gray-200 dark:border-[#1F1F1F] bg-white dark:bg-[#242424]'
                }`}
        >
            {/* Category Header */}
            <div
                className="flex items-center justify-between p-4 cursor-pointer"
                onClick={() => setExpanded(!expanded)}
            >
                <div className="flex items-center gap-3">
                    {/* Category Drag Handle */}
                    <div
                        {...catAttributes}
                        {...catListeners}
                        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 cursor-grab active:cursor-grabbing touch-none"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <GripVertical className="w-5 h-5" />
                    </div>
                    <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white">{category.name}</h3>
                        <span className="text-sm text-gray-500">{filteredTickets.length} ingresso{filteredTickets.length !== 1 ? 's' : ''}</span>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-500 hidden sm:block">
                        {filteredTickets.reduce((a, t) => a + (t.sold || 0), 0)} / {filteredTickets.reduce((a, t) => a + t.maxQuantity, 0)}
                    </span>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                            <button className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                                <MoreVertical className="w-4 h-4" />
                            </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                            <DropdownMenuItem onClick={() => onEditCategory(category)}>
                                <Pencil className="w-4 h-4 mr-2" /> Editar categoria
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => onDeleteCategory(category.id)} className="text-red-600">
                                <Trash className="w-4 h-4 mr-2" /> Excluir categoria
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                    {expanded ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
                </div>
            </div>

            {/* Tickets Container */}
            {expanded && (
                <div className="px-4 pb-4">
                    <SortableContext items={filteredTickets.map(t => t.id)} strategy={verticalListSortingStrategy}>
                        {filteredTickets.length === 0 ? (
                            <CategoryDropZone
                                id={`category-zone-${category.id}`}
                                label="Arraste um ingresso para esta categoria"
                                isOver={showDropEffect}
                                isEmpty={true}
                            />
                        ) : (
                            <>
                                {filteredTickets.map(ticket => (
                                    <SortableTicketItem
                                        key={ticket.id}
                                        ticket={ticket}
                                        formatBRL={formatBRL}
                                        onEdit={() => onEditTicket(ticket)}
                                        onDuplicate={() => onDuplicateTicket(ticket.id)}
                                        onDelete={() => onDeleteTicket(ticket.id)}
                                        onMarkSold={() => onMarkSold(ticket.id)}
                                        onReopenSales={() => onReopenSales(ticket.id)}
                                        categories={categories}
                                        onMoveToCategory={onMoveToCategory}
                                    />
                                ))}
                                {showDropEffect && (
                                    <CategoryDropZone
                                        id={`category-zone-${category.id}`}
                                        label=""
                                        isOver={true}
                                        isEmpty={false}
                                    />
                                )}
                            </>
                        )}
                    </SortableContext>
                </div>
            )}
        </div>
    );
}

// Main DndTicketList Component
export function DndTicketList({
    categories,
    tickets,
    onTicketsChange,
    onCategoriesChange,
    onMoveToCategory,
    onReorderTickets,
    onReorderCategories,
    onEditTicket,
    onDuplicateTicket,
    onDeleteTicket,
    onMarkSold,
    onReopenSales,
    onEditCategory,
    onDeleteCategory,
    formatBRL,
}: DndTicketListProps) {
    const [activeId, setActiveId] = useState<UniqueIdentifier | null>(null);
    const [overCategoryId, setOverCategoryId] = useState<string | null>(null);
    const [activeDragType, setActiveDragType] = useState<'ticket' | 'category' | null>(null);

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8,
            },
        }),
        useSensor(TouchSensor, {
            activationConstraint: {
                delay: 200,
                tolerance: 5,
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const activeTicket = activeId ? tickets.find(t => t.id === activeId) : null;
    const activeCategory = activeId ? categories.find(c => `cat-${c.id}` === activeId) : null;
    const uncategorizedTickets = tickets.filter(t => !t.categoryId && !t.isHalf);

    // Find which category a ticket or drop zone belongs to
    const getCategoryFromId = (id: UniqueIdentifier): string | null => {
        const idStr = String(id);

        // Check if it's a category drop zone
        const dropZoneMatch = idStr.match(/^category-(drop|zone)-(.+)$/);
        if (dropZoneMatch) return dropZoneMatch[2];

        // Check if it's the uncategorized zone
        if (idStr === 'uncategorized-zone' || idStr === 'uncategorized-drop') return 'uncategorized';

        // Check if it's a ticket
        const ticket = tickets.find(t => t.id === idStr);
        if (ticket) return ticket.categoryId || 'uncategorized';

        return null;
    };

    const handleDragStart = (event: DragStartEvent) => {
        const { active } = event;
        setActiveId(active.id);

        // Determine if dragging a category or ticket
        if (String(active.id).startsWith('cat-')) {
            setActiveDragType('category');
        } else {
            setActiveDragType('ticket');
        }
    };

    const handleDragOver = (event: DragOverEvent) => {
        const { over } = event;
        if (!over) {
            setOverCategoryId(null);
            return;
        }

        const categoryId = getCategoryFromId(over.id);
        setOverCategoryId(categoryId);
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        setActiveId(null);
        setOverCategoryId(null);
        setActiveDragType(null);

        if (!over) return;

        const activeIdStr = String(active.id);

        // Handle category reordering
        if (activeIdStr.startsWith('cat-')) {
            const overIdStr = String(over.id);

            // Extract category ID from various formats (cat-{id}, category-drop-{id}, etc.)
            let overCatId: string | null = null;
            if (overIdStr.startsWith('cat-')) {
                overCatId = overIdStr.replace('cat-', '');
            } else if (overIdStr.startsWith('category-drop-')) {
                overCatId = overIdStr.replace('category-drop-', '');
            } else if (overIdStr.startsWith('category-zone-')) {
                overCatId = overIdStr.replace('category-zone-', '');
            }

            const activeCatId = activeIdStr.replace('cat-', '');

            if (overCatId && activeCatId !== overCatId) {
                const oldIndex = categories.findIndex(c => c.id === activeCatId);
                const newIndex = categories.findIndex(c => c.id === overCatId);

                if (oldIndex !== -1 && newIndex !== -1) {
                    const newCategories = arrayMove(categories, oldIndex, newIndex);
                    onCategoriesChange(newCategories);
                    onReorderCategories(newCategories);
                }
            }
            return;
        }

        // Handle ticket operations
        const activeTicket = tickets.find(t => t.id === active.id);
        if (!activeTicket) return;

        const targetCategoryId = getCategoryFromId(over.id);

        // If dropped on a category different from current
        if (targetCategoryId && targetCategoryId !== 'uncategorized') {
            if (activeTicket.categoryId !== targetCategoryId) {
                onMoveToCategory(activeTicket.id, targetCategoryId);
                return;
            }
        }

        // If dropped on uncategorized zone
        if (targetCategoryId === 'uncategorized' && activeTicket.categoryId) {
            onMoveToCategory(activeTicket.id, null);
            return;
        }

        // Check if it's a reorder within the same container
        const overTicket = tickets.find(t => t.id === over.id);
        if (overTicket && activeTicket.categoryId === overTicket.categoryId) {
            const containerTickets = tickets.filter(t => t.categoryId === activeTicket.categoryId && !t.isHalf);
            const oldIndex = containerTickets.findIndex(t => t.id === active.id);
            const newIndex = containerTickets.findIndex(t => t.id === over.id);

            if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) {
                const reordered = arrayMove(containerTickets, oldIndex, newIndex);
                const otherTickets = tickets.filter(t => t.categoryId !== activeTicket.categoryId || t.isHalf);
                const newTickets = [...otherTickets, ...reordered];
                onTicketsChange(newTickets);
                onReorderTickets(reordered);
            }
        }
    };

    const { setNodeRef: setUncategorizedRef, isOver: isOverUncategorized } = useDroppable({
        id: 'uncategorized-drop',
        data: { type: 'uncategorized' },
    });

    // Show uncategorized drop effect
    const showUncategorizedDropEffect = (isOverUncategorized || overCategoryId === 'uncategorized')
        && activeId !== null
        && activeTicket?.categoryId != null
        && activeDragType === 'ticket';

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
        >
            {/* Categories */}
            {categories.length > 0 && (
                <div className="mb-6">
                    <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">
                        Categorias ({categories.length})
                    </h2>
                    <SortableContext items={categories.map(c => `cat-${c.id}`)} strategy={verticalListSortingStrategy}>
                        {categories.map(category => {
                            const categoryTickets = tickets.filter(t => t.categoryId === category.id);

                            return (
                                <SortableCategoryContainer
                                    key={category.id}
                                    category={category}
                                    tickets={categoryTickets}
                                    isDragActive={activeId !== null}
                                    isOverCategory={overCategoryId === category.id}
                                    formatBRL={formatBRL}
                                    onEditTicket={onEditTicket}
                                    onDuplicateTicket={onDuplicateTicket}
                                    onDeleteTicket={onDeleteTicket}
                                    onMarkSold={onMarkSold}
                                    onReopenSales={onReopenSales}
                                    onEditCategory={onEditCategory}
                                    onDeleteCategory={onDeleteCategory}
                                    categories={categories}
                                    onMoveToCategory={onMoveToCategory}
                                    activeTicketCategoryId={activeTicket?.categoryId}
                                    activeDragType={activeDragType}
                                />
                            );
                        })}
                    </SortableContext>
                </div>
            )}

            {/* Uncategorized Tickets */}
            <div ref={setUncategorizedRef} className="mb-6">
                <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">
                    {categories.length > 0 ? 'Sem categoria' : 'Ingressos'} ({uncategorizedTickets.length})
                </h2>

                <div className={`rounded-xl p-4 transition-all ${showUncategorizedDropEffect
                    ? 'border-2 border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    : categories.length > 0 ? 'border-2 border-dashed border-gray-300 dark:border-gray-600' : ''
                    }`}>
                    <SortableContext items={uncategorizedTickets.map(t => t.id)} strategy={verticalListSortingStrategy}>
                        {uncategorizedTickets.length === 0 ? (
                            <CategoryDropZone
                                id="uncategorized-zone"
                                label={categories.length > 0 ? "Arraste um ingresso para remover da categoria" : "Nenhum ingresso criado"}
                                isOver={showUncategorizedDropEffect}
                                isEmpty={true}
                            />
                        ) : (
                            uncategorizedTickets.map(ticket => (
                                <SortableTicketItem
                                    key={ticket.id}
                                    ticket={ticket}
                                    formatBRL={formatBRL}
                                    onEdit={() => onEditTicket(ticket)}
                                    onDuplicate={() => onDuplicateTicket(ticket.id)}
                                    onDelete={() => onDeleteTicket(ticket.id)}
                                    onMarkSold={() => onMarkSold(ticket.id)}
                                    onReopenSales={() => onReopenSales(ticket.id)}
                                    categories={categories}
                                    onMoveToCategory={onMoveToCategory}
                                />
                            ))
                        )}
                    </SortableContext>
                </div>
            </div>

            {/* Drag Overlay */}
            <DragOverlay>
                {activeTicket && (
                    <div className="bg-white dark:bg-[#242424] rounded-lg border-2 border-blue-500 p-4 shadow-xl">
                        <div className="flex items-center gap-3">
                            <GripVertical className="w-5 h-5 text-gray-400" />
                            <span className="font-semibold text-gray-900 dark:text-white">{activeTicket.name}</span>
                            <span className="text-gray-900 dark:text-white font-bold ml-auto">
                                {activeTicket.price === 0 ? 'Gratuito' : formatBRL(activeTicket.price)}
                            </span>
                        </div>
                    </div>
                )}
                {activeCategory && (
                    <div className="bg-white dark:bg-[#242424] rounded-xl border-2 border-blue-500 p-4 shadow-xl">
                        <div className="flex items-center gap-3">
                            <GripVertical className="w-5 h-5 text-gray-400" />
                            <span className="font-semibold text-gray-900 dark:text-white">{activeCategory.name}</span>
                        </div>
                    </div>
                )}
            </DragOverlay>
        </DndContext>
    );
}

export default DndTicketList;
