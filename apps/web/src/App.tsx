import { Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './api/auth-context';
import { ProtectedRoute } from './components/ProtectedRoute';
import { CatalogPage } from './pages/CatalogPage';
import { EmployeeOverviewPage } from './pages/EmployeeOverviewPage';
import { EmployeeTypeDetailPage } from './pages/EmployeeTypeDetailPage';
import { DiagnosticPage } from './pages/growth/DiagnosticPage';
import { LandingPage } from './pages/growth/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { MyTeamPage } from './pages/MyTeamPage';
import { PreparationOverviewPage } from './pages/PreparationOverviewPage';

export function App() {
  return (
    <AuthProvider>
      <Routes>
        {/* Track B — Growth, público, sem login (docs/technical/20-sprint-
         * 02-tech-readiness.md §8): "/" deixa de redirecionar
         * incondicionalmente para "/equipe" — vira a landing pública. */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/monte-sua-equipe" element={<DiagnosticPage />} />

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

        {/* Rota pública desconhecida cai na landing, nunca numa área
         * autenticada que o visitante anônimo não alcança. */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  );
}
