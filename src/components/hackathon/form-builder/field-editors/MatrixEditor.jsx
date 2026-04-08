import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Plus, Trash2 } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

function ItemList({ items, onUpdate, onAdd, onRemove, addLabel }) {
  return (
    <div className="space-y-2">
      {items.map((item) => (
        <div key={item.id} className="flex items-center gap-2">
          <Input
            value={item.label}
            onChange={(e) => onUpdate(item.id, { label: e.target.value })}
            className="flex-1"
          />
          <button
            type="button"
            onClick={() => onRemove(item.id)}
            disabled={items.length <= 1}
            className="rounded-base p-1.5 text-muted-foreground hover:bg-red-500 hover:text-white transition-colors disabled:opacity-30"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ))}
      <Button
        type="button"
        variant="noShadow"
        size="sm"
        onClick={onAdd}
        className="gap-1"
      >
        <Plus className="h-3.5 w-3.5" />
        {addLabel}
      </Button>
    </div>
  );
}

export default function MatrixEditor({ config, onChange }) {
  const { t } = useLanguage();
  const rows = config.rows || [];
  const columns = config.columns || [];

  const updateRow = (id, updates) =>
    onChange({ rows: rows.map((r) => (r.id === id ? { ...r, ...updates } : r)) });
  const addRow = () =>
    onChange({
      rows: [
        ...rows,
        { id: crypto.randomUUID(), label: `Row ${rows.length + 1}` },
      ],
    });
  const removeRow = (id) => {
    if (rows.length <= 1) return;
    onChange({ rows: rows.filter((r) => r.id !== id) });
  };

  const updateCol = (id, updates) =>
    onChange({
      columns: columns.map((c) => (c.id === id ? { ...c, ...updates } : c)),
    });
  const addCol = () =>
    onChange({
      columns: [
        ...columns,
        { id: crypto.randomUUID(), label: `Column ${columns.length + 1}` },
      ],
    });
  const removeCol = (id) => {
    if (columns.length <= 1) return;
    onChange({ columns: columns.filter((c) => c.id !== id) });
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>{t("matrixRows") || "Rows"}</Label>
        <ItemList
          items={rows}
          onUpdate={updateRow}
          onAdd={addRow}
          onRemove={removeRow}
          addLabel={t("addRow") || "Add Row"}
        />
      </div>

      <div className="space-y-2">
        <Label>{t("matrixColumns") || "Columns"}</Label>
        <ItemList
          items={columns}
          onUpdate={updateCol}
          onAdd={addCol}
          onRemove={removeCol}
          addLabel={t("addColumn") || "Add Column"}
        />
      </div>
    </div>
  );
}
