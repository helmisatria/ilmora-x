import { CaretSortIcon } from "@radix-ui/react-icons";
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
  type Column,
  type ColumnDef,
  type SortingState,
  type Table,
} from "@tanstack/react-table";
import { memo, useMemo, useState, type ReactNode } from "react";
import { formatCouponUsage } from "./admin-coupon-usage";

export type ProductTableRow = {
  id: string;
  name: string;
  type: "premium_membership" | "lifetime_tryout" | string;
  description: string;
  price: number;
  active: boolean;
  durationDays: number | null;
  contentType: string | null;
  contentId: string | null;
  createdAt: string;
};

export type CouponTableRow = {
  id: string;
  code: string;
  discountType: string;
  discountValue: number;
  productScope: string;
  startsAt: string;
  endsAt: string;
  maxTotalUses: number | null;
  active: boolean;
  reservedUses: number;
  finalizedUses: number;
  releasedUses: number;
  activeUses: number;
};

export type CheckoutTableRow = {
  id: string;
  studentUserId: string;
  studentName: string;
  studentEmail: string;
  productName: string;
  productType: string;
  couponCode: string | null;
  status: string;
  total: number;
  xenditInvoiceId: string | null;
  xenditStatus: string | null;
  createdAt: string;
  paidAt: string | null;
  expiresAt: string | null;
};

export type EntitlementTableRow = {
  id: string;
  studentUserId: string;
  studentName: string;
  studentEmail: string;
  source: string;
  productType: string;
  contentType: string | null;
  contentId: string | null;
  startsAt: string;
  endsAt: string | null;
  grantedByAdminUserId: string | null;
  grantReason: string | null;
};

type TryoutOption = {
  id: string;
  title: string;
};

type ProductTableProps = {
  products: ProductTableRow[];
  tryouts: TryoutOption[];
  onEdit: (product: ProductTableRow) => void;
  onToggle: (product: ProductTableRow) => void;
};

type CouponTableProps = {
  coupons: CouponTableRow[];
  busyAction: string;
  onEdit: (coupon: CouponTableRow) => void;
  onToggle: (coupon: CouponTableRow) => void;
  onDelete: (coupon: CouponTableRow) => void;
};

type CheckoutTableProps = {
  checkouts: CheckoutTableRow[];
  busyAction: string;
  onSync: (checkoutId: string) => void;
};

type EntitlementTableProps = {
  entitlements: EntitlementTableRow[];
};

export const ProductTable = memo(function ProductTable({
  products,
  tryouts,
  onEdit,
  onToggle,
}: ProductTableProps) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const tryoutTitleById = useMemo(() => new Map(tryouts.map((tryout) => [tryout.id, tryout.title])), [tryouts]);
  const columns = useMemo<ColumnDef<ProductTableRow>[]>(
    () => [
      {
        accessorKey: "name",
        header: ({ column }) => <SortableHeader column={column}>Product</SortableHeader>,
        cell: ({ row }) => (
          <div>
            <div className="font-bold text-stone-800">{row.original.name}</div>
            <div className="mt-1 max-w-xl text-sm font-medium text-stone-500">{row.original.description || "No description"}</div>
          </div>
        ),
      },
      {
        accessorKey: "type",
        header: ({ column }) => <SortableHeader column={column}>Type</SortableHeader>,
        cell: ({ row }) => formatProductType(row.original.type),
      },
      {
        accessorKey: "price",
        header: ({ column }) => <SortableHeader column={column}>Price</SortableHeader>,
        cell: ({ row }) => formatRupiah(row.original.price),
      },
      {
        id: "accessTarget",
        header: "Access target",
        cell: ({ row }) => formatProductAccessTarget(row.original, tryoutTitleById),
      },
      {
        accessorFn: (product) => product.active ? "active" : "inactive",
        id: "status",
        header: ({ column }) => <SortableHeader column={column}>Status</SortableHeader>,
        cell: ({ row }) => <StatusPill label={row.original.active ? "active" : "inactive"} />,
      },
      {
        id: "actions",
        header: "Actions",
        cell: ({ row }) => (
          <div className="flex flex-wrap justify-end gap-2">
            <button className="admin-button-ghost text-primary hover:bg-primary-tint" onClick={() => onEdit(row.original)} type="button">
              Edit
            </button>
            <button className="admin-button-ghost text-amber-600 hover:bg-amber-50" onClick={() => onToggle(row.original)} type="button">
              {row.original.active ? "Deactivate" : "Activate"}
            </button>
          </div>
        ),
      },
    ],
    [onEdit, onToggle, tryoutTitleById],
  );
  const table = useReactTable({
    data: products,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  return <AdminTable table={table} emptyMessage="No Products yet." />;
});

export const CouponTable = memo(function CouponTable({
  coupons,
  busyAction,
  onEdit,
  onToggle,
  onDelete,
}: CouponTableProps) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [codeFilter, setCodeFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const filteredCoupons = useMemo(
    () => coupons.filter((coupon) => matchesCouponStatusFilter(coupon, statusFilter)),
    [coupons, statusFilter],
  );
  const columns = useMemo<ColumnDef<CouponTableRow>[]>(
    () => [
      {
        accessorKey: "code",
        header: ({ column }) => <SortableHeader column={column}>Coupon</SortableHeader>,
        cell: ({ row }) => <span className="font-bold text-stone-800">{row.original.code}</span>,
        filterFn: "includesString",
      },
      {
        id: "discount",
        header: "Discount",
        cell: ({ row }) => formatCouponDiscount(row.original),
      },
      {
        accessorKey: "productScope",
        header: "Scope",
        cell: ({ row }) => formatProductScope(row.original.productScope),
      },
      {
        accessorKey: "activeUses",
        header: ({ column }) => <SortableHeader column={column}>Usage</SortableHeader>,
        cell: ({ row }) => (
          <div>
            <div className="font-semibold text-stone-700">{formatCouponUsage(row.original)}</div>
            <div className="mt-1 text-xs font-bold uppercase tracking-wide text-stone-400">{row.original.finalizedUses} paid</div>
          </div>
        ),
      },
      {
        accessorKey: "endsAt",
        header: ({ column }) => <SortableHeader column={column}>Window</SortableHeader>,
        cell: ({ row }) => (
          <div className="text-sm font-medium text-stone-600">
            <div>{formatDateTime(row.original.startsAt)}</div>
            <div className="mt-1 text-stone-400">to {formatDateTime(row.original.endsAt)}</div>
          </div>
        ),
      },
      {
        accessorFn: (coupon) => getCouponStatusLabel(coupon),
        id: "status",
        header: ({ column }) => <SortableHeader column={column}>Status</SortableHeader>,
        cell: ({ row }) => <StatusPill label={getCouponStatusLabel(row.original)} />,
      },
      {
        id: "actions",
        header: "Actions",
        cell: ({ row }) => (
          <div className="flex flex-wrap justify-end gap-2">
            <button className="admin-button-ghost text-primary hover:bg-primary-tint" onClick={() => onEdit(row.original)} type="button">
              Edit
            </button>
            <button className="admin-button-ghost text-amber-600 hover:bg-amber-50" onClick={() => onToggle(row.original)} type="button">
              {row.original.active ? "Disable" : "Enable"}
            </button>
            <button
              className="admin-button-ghost text-rose-600 hover:bg-rose-50"
              disabled={busyAction === `delete-coupon:${row.original.id}`}
              onClick={() => onDelete(row.original)}
              type="button"
            >
              Remove
            </button>
          </div>
        ),
      },
    ],
    [busyAction, onDelete, onEdit, onToggle],
  );
  const table = useReactTable({
    data: filteredCoupons,
    columns,
    state: {
      sorting,
      columnFilters: [{ id: "code", value: codeFilter }],
    },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  return (
    <div>
      <div className="grid gap-3 border-b-2 border-stone-100 p-4 sm:grid-cols-[minmax(0,1fr)_220px] sm:p-5">
        <input
          className="admin-control"
          placeholder="Filter Coupon code"
          value={codeFilter}
          onChange={(event) => setCodeFilter(event.target.value)}
        />
        <select className="admin-control" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
          <option value="all">All statuses</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="expired">Expired</option>
        </select>
      </div>
      <AdminTable table={table} emptyMessage="No Coupons match the current filters." />
    </div>
  );
});

export const CheckoutTable = memo(function CheckoutTable({
  checkouts,
  busyAction,
  onSync,
}: CheckoutTableProps) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [statusFilter, setStatusFilter] = useState("all");
  const filteredCheckouts = useMemo(
    () => checkouts.filter((checkout) => statusFilter === "all" || checkout.status === statusFilter),
    [checkouts, statusFilter],
  );
  const statusOptions = useMemo(() => makeFilterOptions(checkouts.map((checkout) => checkout.status), "All statuses"), [checkouts]);
  const columns = useMemo<ColumnDef<CheckoutTableRow>[]>(
    () => [
      {
        accessorKey: "createdAt",
        header: ({ column }) => <SortableHeader column={column}>Checkout</SortableHeader>,
        cell: ({ row }) => (
          <div>
            <div className="font-mono text-xs font-bold text-stone-500">{shortId(row.original.id)}</div>
            <div className="mt-1 text-sm font-medium text-stone-400">{formatDateTime(row.original.createdAt)}</div>
          </div>
        ),
      },
      {
        accessorKey: "studentName",
        header: ({ column }) => <SortableHeader column={column}>Student</SortableHeader>,
        cell: ({ row }) => <StudentCell name={row.original.studentName} email={row.original.studentEmail} />,
      },
      {
        accessorKey: "productName",
        header: ({ column }) => <SortableHeader column={column}>Product</SortableHeader>,
        cell: ({ row }) => (
          <div>
            <div className="font-semibold text-stone-800">{row.original.productName}</div>
            <div className="mt-1 text-xs font-bold uppercase tracking-wide text-stone-400">{formatProductType(row.original.productType)}</div>
          </div>
        ),
      },
      {
        accessorKey: "total",
        header: ({ column }) => <SortableHeader column={column}>Amount</SortableHeader>,
        cell: ({ row }) => (
          <div>
            <div className="font-semibold text-stone-700">{formatRupiah(row.original.total)}</div>
            <div className="mt-1 text-xs font-bold uppercase tracking-wide text-stone-400">{row.original.couponCode || "No Coupon"}</div>
          </div>
        ),
      },
      {
        accessorKey: "status",
        header: ({ column }) => <SortableHeader column={column}>Status</SortableHeader>,
        cell: ({ row }) => (
          <div className="flex flex-wrap gap-2">
            <StatusPill label={row.original.status} />
            {row.original.xenditStatus && <StatusPill label={`Xendit ${row.original.xenditStatus}`} />}
          </div>
        ),
      },
      {
        id: "timeline",
        header: "Timeline",
        cell: ({ row }) => (
          <div className="text-sm font-medium text-stone-600">
            <div>{row.original.paidAt ? `Paid ${formatDateTime(row.original.paidAt)}` : "Not paid"}</div>
            <div className="mt-1 text-stone-400">{row.original.expiresAt ? `Expires ${formatDateTime(row.original.expiresAt)}` : "No expiry"}</div>
          </div>
        ),
      },
      {
        id: "actions",
        header: "Actions",
        cell: ({ row }) => (
          <div className="flex flex-wrap justify-end gap-2">
            <button
              className="admin-button-ghost text-primary hover:bg-primary-tint"
              disabled={!row.original.xenditInvoiceId || busyAction === `sync:${row.original.id}`}
              onClick={() => onSync(row.original.id)}
              type="button"
            >
              Sync Xendit
            </button>
          </div>
        ),
      },
    ],
    [busyAction, onSync],
  );
  const table = useReactTable({
    data: filteredCheckouts,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  return (
    <div>
      <TableFilterBar>
        <select className="admin-control" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
          {statusOptions.map((option) => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </select>
      </TableFilterBar>
      <AdminTable table={table} emptyMessage="No Checkouts match the current filters." />
    </div>
  );
});

export const EntitlementTable = memo(function EntitlementTable({
  entitlements,
}: EntitlementTableProps) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [sourceFilter, setSourceFilter] = useState("all");
  const filteredEntitlements = useMemo(
    () => entitlements.filter((entitlement) => sourceFilter === "all" || entitlement.source === sourceFilter),
    [entitlements, sourceFilter],
  );
  const sourceOptions = useMemo(() => makeFilterOptions(entitlements.map((entitlement) => entitlement.source), "All sources"), [entitlements]);
  const columns = useMemo<ColumnDef<EntitlementTableRow>[]>(
    () => [
      {
        accessorKey: "studentName",
        header: ({ column }) => <SortableHeader column={column}>Student</SortableHeader>,
        cell: ({ row }) => <StudentCell name={row.original.studentName} email={row.original.studentEmail} />,
      },
      {
        accessorKey: "productType",
        header: ({ column }) => <SortableHeader column={column}>Access</SortableHeader>,
        cell: ({ row }) => formatProductType(row.original.productType),
      },
      {
        accessorKey: "source",
        header: ({ column }) => <SortableHeader column={column}>Source</SortableHeader>,
        cell: ({ row }) => <StatusPill label={formatEntitlementSource(row.original.source)} />,
      },
      {
        id: "target",
        header: "Target",
        cell: ({ row }) => formatEntitlementTarget(row.original),
      },
      {
        accessorKey: "startsAt",
        header: ({ column }) => <SortableHeader column={column}>Window</SortableHeader>,
        cell: ({ row }) => (
          <div className="text-sm font-medium text-stone-600">
            <div>{formatDateTime(row.original.startsAt)}</div>
            <div className="mt-1 text-stone-400">{row.original.endsAt ? `Until ${formatDateTime(row.original.endsAt)}` : "Lifetime"}</div>
          </div>
        ),
      },
      {
        id: "grantReason",
        header: "Grant reason",
        cell: ({ row }) => row.original.source === "admin_grant" ? row.original.grantReason || "No reason recorded" : "Checkout",
      },
    ],
    [],
  );
  const table = useReactTable({
    data: filteredEntitlements,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  return (
    <div>
      <TableFilterBar>
        <select className="admin-control" value={sourceFilter} onChange={(event) => setSourceFilter(event.target.value)}>
          {sourceOptions.map((option) => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </select>
      </TableFilterBar>
      <AdminTable table={table} emptyMessage="No Entitlements match the current filters." />
    </div>
  );
});

function AdminTable<TData>({
  table,
  emptyMessage,
}: {
  table: Table<TData>;
  emptyMessage: string;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[860px] border-collapse text-left text-sm">
        <thead className="border-b-2 border-stone-100 bg-stone-50/80 text-[11px] font-bold uppercase tracking-wide text-stone-400">
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <th key={header.id} className="px-4 py-3 align-middle last:text-right sm:px-5">
                  {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody className="divide-y-2 divide-stone-100">
          {table.getRowModel().rows.length === 0 ? (
            <tr>
              <td className="px-5 py-8 text-center text-sm font-semibold text-stone-400" colSpan={table.getAllColumns().length}>
                {emptyMessage}
              </td>
            </tr>
          ) : (
            table.getRowModel().rows.map((row) => (
              <tr key={row.id} className="bg-white align-top">
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} className="px-4 py-4 align-middle text-stone-600 last:text-right sm:px-5">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

function SortableHeader<TData, TValue>({
  column,
  children,
}: {
  column: Column<TData, TValue>;
  children: ReactNode;
}) {
  if (!column.getCanSort()) {
    return <span>{children}</span>;
  }

  const direction = column.getIsSorted();

  return (
    <button className="inline-flex items-center gap-1.5 font-bold uppercase" onClick={column.getToggleSortingHandler()} type="button">
      {children}
      <CaretSortIcon className={direction ? "text-primary" : "text-stone-300"} />
    </button>
  );
}

function StatusPill({ label }: { label: string }) {
  return (
    <span className="admin-status-pill border-stone-200 bg-stone-100 text-stone-600">
      {label.replaceAll("_", " ")}
    </span>
  );
}

function StudentCell({ name, email }: { name: string; email: string }) {
  return (
    <div>
      <div className="font-semibold text-stone-800">{name}</div>
      <div className="mt-1 text-xs font-bold text-stone-400">{email}</div>
    </div>
  );
}

function TableFilterBar({ children }: { children: ReactNode }) {
  return (
    <div className="grid gap-3 border-b-2 border-stone-100 p-4 sm:grid-cols-[220px] sm:p-5">
      {children}
    </div>
  );
}

function makeFilterOptions(values: string[], allLabel: string) {
  const uniqueValues = Array.from(new Set(values));

  return [
    { value: "all", label: allLabel },
    ...uniqueValues.map((value) => ({
      value,
      label: value.replaceAll("_", " "),
    })),
  ];
}

function formatProductType(value: string) {
  if (value === "premium_membership") return "Premium Membership";
  if (value === "lifetime_tryout") return "Lifetime Try-out Purchase";

  return value.replaceAll("_", " ");
}

function formatProductAccessTarget(product: ProductTableRow, tryoutTitleById: Map<string, string>) {
  if (product.type === "premium_membership") {
    return `${product.durationDays ?? 30} days`;
  }

  if (!product.contentId) {
    return "No Try-out selected";
  }

  return tryoutTitleById.get(product.contentId) ?? product.contentId;
}

function formatProductScope(value: string) {
  if (value === "all") return "All paid products";
  if (value === "premium_membership") return "Premium Membership";
  if (value === "lifetime_tryout") return "Lifetime Try-out Purchase";
  if (value === "material") return "Materi";

  return value.replaceAll("_", " ");
}

function formatEntitlementSource(value: string) {
  if (value === "checkout") return "Checkout";
  if (value === "admin_grant") return "Admin Grant";

  return value.replaceAll("_", " ");
}

function formatEntitlementTarget(entitlement: EntitlementTableRow) {
  if (!entitlement.contentType || !entitlement.contentId) {
    return "Global access";
  }

  return `${formatContentType(entitlement.contentType)} ${entitlement.contentId}`;
}

function formatContentType(value: string) {
  if (value === "tryout") return "Try-out";
  if (value === "material") return "Materi";

  return value.replaceAll("_", " ");
}

function formatCouponDiscount(coupon: CouponTableRow) {
  if (coupon.discountType === "percentage") {
    return `${coupon.discountValue}%`;
  }

  return formatRupiah(coupon.discountValue);
}

function matchesCouponStatusFilter(coupon: CouponTableRow, statusFilter: string) {
  if (statusFilter === "all") return true;
  if (statusFilter === "expired") return isExpired(coupon.endsAt);
  if (statusFilter === "active") return coupon.active && !isExpired(coupon.endsAt);
  if (statusFilter === "inactive") return !coupon.active;

  return true;
}

function getCouponStatusLabel(coupon: CouponTableRow) {
  if (isExpired(coupon.endsAt)) return "expired";

  return coupon.active ? "active" : "inactive";
}

function isExpired(value: string) {
  return new Date(value).getTime() < Date.now();
}

function formatRupiah(value: number) {
  return `Rp${value.toLocaleString("id-ID")}`;
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function shortId(value: string) {
  return value.slice(0, 8);
}
