import Box from '@cloudscape-design/components/box';
import { lazy, Suspense } from 'react';
import { Route, Routes } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';

const ProjectListPage = lazy(() =>
  import('@/pages/ProjectListPage').then((m) => ({ default: m.ProjectListPage })),
);
const DashboardPage = lazy(() =>
  import('@/pages/DashboardPage').then((m) => ({ default: m.DashboardPage })),
);
const ComparePage = lazy(() =>
  import('@/pages/ComparePage').then((m) => ({ default: m.ComparePage })),
);
const EditorPage = lazy(() =>
  import('@/pages/EditorPage').then((m) => ({ default: m.EditorPage })),
);

function PageLoading() {
  return (
    <Box padding="xxl" textAlign="center" color="text-body-secondary">
      画面を読み込み中…
    </Box>
  );
}

export default function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route
          path="/"
          element={
            <Suspense fallback={<PageLoading />}>
              <ProjectListPage />
            </Suspense>
          }
        />
        <Route
          path="/dashboard/:projectId"
          element={
            <Suspense fallback={<PageLoading />}>
              <DashboardPage />
            </Suspense>
          }
        />
        <Route
          path="/dashboard"
          element={
            <Suspense fallback={<PageLoading />}>
              <DashboardPage />
            </Suspense>
          }
        />
        <Route
          path="/compare"
          element={
            <Suspense fallback={<PageLoading />}>
              <ComparePage />
            </Suspense>
          }
        />
        <Route
          path="/editor/:projectId"
          element={
            <Suspense fallback={<PageLoading />}>
              <EditorPage />
            </Suspense>
          }
        />
      </Route>
    </Routes>
  );
}
