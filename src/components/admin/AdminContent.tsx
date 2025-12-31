import { Routes, Route } from 'react-router-dom';
import DashboardOverview from './DashboardOverview';
import MangaManagement from './MangaManagement';
import UserManagement from './UserManagement';
import RoleManagement from './RoleManagement';
import ScraperManagement from './ScraperManagement';
import PromoManagement from './PromoManagement';
import AdminSettings from './AdminSettings';

const AdminContent = () => {
  return (
    <main className="flex-1 overflow-y-auto">
      <div className="p-8">
        <Routes>
          <Route index element={<DashboardOverview />} />
          <Route path="manga/*" element={<MangaManagement />} />
          <Route path="users" element={<UserManagement />} />
          <Route path="roles" element={<RoleManagement />} />
          <Route path="scrapers" element={<ScraperManagement />} />
          <Route path="promos" element={<PromoManagement />} />
          <Route path="settings" element={<AdminSettings />} />
        </Routes>
      </div>
    </main>
  );
};

export default AdminContent;
