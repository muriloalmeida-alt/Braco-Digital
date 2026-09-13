import { Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './api/auth-context';
import { ProtectedRoute } from './components/ProtectedRoute';
import { CatalogPage } from './pages/CatalogPage';
import { EmployeeOverviewPage } from './pages/EmployeeOverviewPage';
import { EmployeeTypeDetailPage } from './pages/EmployeeTypeDetailPage';
import { LoginPage } from './pages/LoginPage';
import { MyTeamPage } from './pages/MyTeamPage';
import { PreparationOverviewPage } from './pages/PreparationOverviewPage';

export function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<LoginPage />} />

        <Route
          path="/equipe"
          element={
            <ProtectedRoute>
              <MyTeamPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/equipe/contratar"
          element={
            <ProtectedRoute>
              <CatalogPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/equipe/contratar/:id"
          element={
            <ProtectedRoute>
              <EmployeeTypeDetailPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/equipe/:id/preparar"
          element={
            <ProtectedRoute>
              <PreparationOverviewPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/equipe/:id"
          element={
            <ProtectedRoute>
              <EmployeeOverviewPage />
            </ProtectedRoute>
          }
        />

        <Route path="/" element={<Navigate to="/equipe" replace />} />
        <Route path="*" element={<Navigate to="/equipe" replace />} />
      </Routes>
    </AuthProvider>
  );
}
