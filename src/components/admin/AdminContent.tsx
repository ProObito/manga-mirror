import { Routes, Route } from 'react-router-dom';

import DashboardOverview from './DashboardOverview';
import MangaManagement from './MangaManagement';
import UserManagement from './UserManagement';
import RoleManagement from './RoleManagement';
import ScraperManagement from './ScraperManagement';
import PromoManagement from './PromoManagement';
import AdminSettings from './AdminSettings';
import MangaScraper from './MangaScraper';
import BackendSync from './BackendSync';
import ContentExtractor from './ContentExtractor';

// NEW scraper panel component
import AdminScraper from '@/components/AdminScraper';

const AdminContent = () => {
  return (
    <main className="flex-1 overflow-y-auto">
      <div className="p-8">
        <Routes>

          {/* DASHBOARD (DEFAULT) */}
          <Route
            index
            element={
              <div className="space-y-6">
                <h1 className="text-3xl font-bold">Dashboard</h1>
                <DashboardOverview />
                <BackendSync />
                <AdminScraper />
              </div>
            }
          />

          {/* MANGA */}
          <Route path="manga/*" element={<MangaManagement />} />

          {/* USERS */}
          <Route path="users" element={<UserManagement />} />

          {/* ROLES */}
          <Route path="roles" element={<RoleManagement />} />

          {/* SCRAPER MANAGEMENT (OLD) */}
          <Route path="scrapers" element={<ScraperManagement />} />

          {/* SCRAPER PANEL (NEW) */}
          <Route
            path="scraper"
            element={
              <div className="space-y-6">
                <h1 className="text-3xl font-bold">Scraping Control</h1>
                <AdminScraper />
              </div>
            }
          />

          {/* BACKEND SYNC */}
          <Route
            path="sync"
            element={
              <div className="space-y-6">
                <h1 className="text-3xl font-bold">Backend Sync</h1>
                <BackendSync />
              </div>
            }
          />

          {/* CONTENT EXTRACTOR */}
          <Route
            path="extractor"
            element={
              <div className="space-y-6">
                <ContentExtractor />
              </div>
            }
          />

          {/* IMPORT */}
          <Route path="import" element={<MangaScraper />} />

          {/* PROMOS */}
          <Route path="promos" element={<PromoManagement />} />

          {/* SETTINGS */}
          <Route path="settings" element={<AdminSettings />} />

        </Routes>
      </div>
    </main>
  );
};

export default AdminContent;
