import { AdminPageHeader } from "../../components/admin/AdminPageHeader";
import { AdminPanelHeader } from "../../components/admin/AdminPanelHeader";
import { getAdminContentCounts } from "./admin-content-counts";

export type AdminMateriCounts = Awaited<ReturnType<typeof getAdminContentCounts>>;

export function AdminMateriPage({ counts }: { counts: AdminMateriCounts }) {
  return (
    <main className="admin-shell page-enter">
      <div className="admin-lane">
        <AdminPageHeader
          title="Materi"
          description="Markdown, YouTube URL, PDF key, access level, and publish controls come next."
        />

        <section className="admin-panel mt-6">
          <AdminPanelHeader
            title="Materi records"
            badge={<span className="admin-count">{counts.materi}</span>}
            description="Total materi rows in the database."
          />
          <div className="grid gap-3 p-4 sm:grid-cols-3">
            <div className="admin-stat">
              <p className="admin-stat-label">Materi</p>
              <p className="admin-stat-value">{counts.materi}</p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
