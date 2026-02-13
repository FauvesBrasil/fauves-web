import * as React from "react";

import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { HowItWorksModule, HowItWorksModuleData } from "./HowItWorksModule";

interface Props {
  modules: HowItWorksModuleData[];
  setModules: (mods: HowItWorksModuleData[]) => void;
  onTextChange: (id: string, html: string) => void;
  onImageUpload: (id: string, file: File) => void;
  onVideoUrl: (id: string, url: string) => void;
  onRemove: (id: string) => void;
}

function SortableModule({ mod, idx, onTextChange, onImageUpload, onVideoUrl, onRemove }: any) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: mod.id });
  const style = {
    transform: transform ? `translateY(${transform.y}px)` : undefined,
    transition,
    opacity: isDragging ? 0.5 : 1,
  };
  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      <HowItWorksModule
        module={mod}
        onTextChange={onTextChange}
        onImageUpload={onImageUpload}
        onVideoUrl={onVideoUrl}
        onRemove={onRemove}
        dragHandleProps={{
          ...listeners,
          tabIndex: 0,
          style: { cursor: 'grab' },
        }}
      />
    </div>
  );
}

export function HowItWorksModulesList({
  modules,
  setModules,
  onTextChange,
  onImageUpload,
  onVideoUrl,
  onRemove,
}: Props) {
  const sensors = useSensors(useSensor(PointerSensor));
  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={({ active, over }) => {
        if (over && active.id !== over.id) {
          const oldIndex = modules.findIndex(m => m.id === active.id);
          const newIndex = modules.findIndex(m => m.id === over.id);
          setModules(arrayMove(modules, oldIndex, newIndex));
        }
      }}
    >
      <SortableContext items={modules.map(m => m.id)} strategy={verticalListSortingStrategy}>
        {modules.map((mod, idx) => (
          <SortableModule
            key={mod.id}
            mod={mod}
            idx={idx}
            onTextChange={onTextChange}
            onImageUpload={onImageUpload}
            onVideoUrl={onVideoUrl}
            onRemove={onRemove}
          />
        ))}
      </SortableContext>
    </DndContext>
  );
}
