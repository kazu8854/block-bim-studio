import { Route, Routes } from 'react-router-dom';
import { EditorPage } from '@/pages/EditorPage';
import { ProjectListPage } from '@/pages/ProjectListPage';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<ProjectListPage />} />
      <Route path="/editor/:projectId" element={<EditorPage />} />
    </Routes>
  );
}
