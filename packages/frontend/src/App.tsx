import { Route, Routes } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { DashboardPage } from '@/pages/DashboardPage';
import { EditorPage } from '@/pages/EditorPage';
import { ProjectListPage } from '@/pages/ProjectListPage';

export default function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route path="/" element={<ProjectListPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/editor/:projectId" element={<EditorPage />} />
      </Route>
    </Routes>
  );
}
