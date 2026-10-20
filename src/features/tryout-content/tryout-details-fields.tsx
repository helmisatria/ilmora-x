import { AdminField } from "../../components/admin/AdminField";
import { TryoutIconField } from "../../components/admin/TryoutIconField";
import type { listCategoryOptionsAdmin } from "../admin/admin-taxonomy-functions";
import type { AccessLevel } from "./question-editor-form";
import { tryoutDescriptionMaxLength, type TryoutDetailsErrors, type TryoutDetailsValues } from "./tryout-details-form";

type CategoryOption = Awaited<ReturnType<typeof listCategoryOptionsAdmin>>[number];

// The try-out fields shared by the create form and the detail page.
export function TryoutDetailsFields({
  values,
  errors,
  categories,
  tryoutId,
  onChange,
  onIconError,
}: {
  values: TryoutDetailsValues;
  errors: TryoutDetailsErrors;
  categories: CategoryOption[];
  tryoutId?: string;
  onChange: (patch: Partial<TryoutDetailsValues>) => void;
  onIconError: (message: string) => void;
}) {
  const descriptionLength = values.description.trim().length;

  return (
    <>
      <AdminField label="Judul" field="title" error={errors.title}>
        <input
          value={values.title}
          onChange={(event) => onChange({ title: event.target.value })}
          className="admin-control"
          placeholder="UKAI Try-out 1"
        />
      </AdminField>

      <AdminField
        label="Deskripsi"
        field="description"
        error={errors.description}
        hint={`${descriptionLength}/${tryoutDescriptionMaxLength} karakter. Tampil di katalog sebelum peserta mulai.`}
      >
        <textarea
          value={values.description}
          onChange={(event) => onChange({ description: event.target.value })}
          className="admin-control min-h-20"
          placeholder="Penjelasan singkat untuk peserta sebelum mengerjakan try-out."
        />
      </AdminField>

      <div className="block min-w-0">
        <span className="mb-1.5 block text-xs font-bold text-stone-600">Ikon, opsional</span>
        <TryoutIconField
          value={values.icon}
          accent={categories.find((category) => category.id === values.categoryId)?.color ?? "#205072"}
          tryoutId={tryoutId}
          onChange={(icon) => onChange({ icon })}
          onError={onIconError}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <AdminField label="Kategori" field="categoryId" error={errors.categoryId}>
          <select value={values.categoryId} onChange={(event) => onChange({ categoryId: event.target.value })} className="admin-control">
            {categories.length === 0 && <option value="">Belum ada kategori</option>}
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </AdminField>

        <AdminField label="Durasi dalam menit" field="durationMinutes" error={errors.durationMinutes}>
          <input
            value={values.durationMinutes}
            onChange={(event) => onChange({ durationMinutes: event.target.value })}
            className="admin-control"
            inputMode="numeric"
          />
        </AdminField>

        <AdminField label="Akses" field="accessLevel">
          <select
            value={values.accessLevel}
            onChange={(event) => onChange({ accessLevel: event.target.value as AccessLevel })}
            className="admin-control"
          >
            <option value="free">Gratis</option>
            <option value="premium">Premium</option>
          </select>
        </AdminField>
      </div>
    </>
  );
}
