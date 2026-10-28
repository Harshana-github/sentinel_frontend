import { Route, Routes } from 'react-router-dom';
import Toasts from './components/Toasts';
import BrandingEffect from './features/branding/BrandingEffect';
import AppLayout from './layouts/AppLayout';
import LoginPage from './pages/LoginPage';
import NotFoundPage from './pages/NotFoundPage';
import SettingsPage from './pages/SettingsPage';
import AdminDashboardPage from './pages/admin/AdminDashboardPage';
import BrandingPage from './pages/admin/BrandingPage';
import FeatureModulesPage from './pages/admin/FeatureModulesPage';
import OrganizationDetailPage from './pages/admin/OrganizationDetailPage';
import OrganizationsPage from './pages/admin/OrganizationsPage';
import MasterDataPage from './pages/admin/MasterDataPage';
import ScannerModulesPage from './pages/admin/ScannerModulesPage';
import StatusesPage from './pages/admin/StatusesPage';
import AssessmentDetailPage from './pages/user/AssessmentDetailPage';
import AssessmentsPage from './pages/user/AssessmentsPage';
import DashboardPage from './pages/user/DashboardPage';
import FindingDetailPage from './pages/user/FindingDetailPage';
import FindingsPage from './pages/user/FindingsPage';
import NewAssessmentPage from './pages/user/NewAssessmentPage';
import ProjectDetailPage from './pages/user/ProjectDetailPage';
import ProjectsPage from './pages/user/ProjectsPage';
import RolesPage from './pages/user/RolesPage';
import ScanDetailPage from './pages/user/ScanDetailPage';
import ScansPage from './pages/user/ScansPage';
import TeamPage from './pages/user/TeamPage';
import HomeRedirect from './routes/HomeRedirect';
import ModuleRoute from './routes/ModuleRoute';
import ProtectedRoute from './routes/ProtectedRoute';
import PublicOnlyRoute from './routes/PublicOnlyRoute';

export default function App() {
  return (
    <>
      <BrandingEffect />
      <Routes>
        <Route path="/" element={<HomeRedirect />} />

        <Route element={<PublicOnlyRoute />}>
          <Route path="/login" element={<LoginPage />} />
        </Route>

        {/* Super Admin panel: the Sentinel company team */}
        <Route element={<ProtectedRoute panel="admin" />}>
          <Route path="/admin" element={<AppLayout />}>
            <Route index element={<AdminDashboardPage />} />
            <Route path="organizations" element={<OrganizationsPage />} />
            <Route path="organizations/:organizationId" element={<OrganizationDetailPage />} />
            <Route path="modules" element={<FeatureModulesPage />} />
            <Route path="masters" element={<MasterDataPage />} />
            <Route path="scanners" element={<ScannerModulesPage />} />
            <Route path="statuses" element={<StatusesPage />} />
            <Route path="branding" element={<BrandingPage />} />
            <Route path="settings" element={<SettingsPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Route>

        {/* User panel: customer organizations (admins and users) */}
        <Route element={<ProtectedRoute panel="user" />}>
          <Route element={<AppLayout />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route element={<ModuleRoute module="projects" />}>
              <Route path="/projects" element={<ProjectsPage />} />
              <Route path="/projects/:projectId" element={<ProjectDetailPage />} />
            </Route>
            <Route element={<ModuleRoute module="scans" />}>
              <Route path="/scans" element={<ScansPage />} />
              <Route path="/scans/:scanId" element={<ScanDetailPage />} />
              <Route path="/assessments" element={<AssessmentsPage />} />
              <Route path="/assessments/new" element={<NewAssessmentPage />} />
              <Route path="/assessments/:assessmentId" element={<AssessmentDetailPage />} />
            </Route>
            <Route element={<ModuleRoute module="findings" />}>
              <Route path="/findings" element={<FindingsPage />} />
              <Route path="/findings/:findingId" element={<FindingDetailPage />} />
            </Route>
            <Route element={<ModuleRoute module="team" />}>
              <Route path="/team" element={<TeamPage />} />
              <Route path="/roles" element={<RolesPage />} />
            </Route>
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Route>
      </Routes>
      <Toasts />
    </>
  );
}
