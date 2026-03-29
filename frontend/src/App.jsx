import { Navigate, Route, Routes } from "react-router-dom";

import LoadingScreen from "./components/LoadingScreen";
import ProtectedRoute from "./components/ProtectedRoute";
import PublicRoute from "./components/PublicRoute";
import AppLayout from "./layouts/AppLayout";
import AdminPanelPage from "./pages/AdminPanelPage";
import ApprovalsPage from "./pages/ApprovalsPage";
import DashboardPage from "./pages/DashboardPage";
import LoginPage from "./pages/LoginPage";
import MyExpensesPage from "./pages/MyExpensesPage";
import SignupPage from "./pages/SignupPage";
import SubmitExpensePage from "./pages/SubmitExpensePage";
import { useAuth } from "./hooks/useAuth";

function App() {
  const { loading } = useAuth();

  if (loading) {
    return <LoadingScreen fullScreen label="Preparing your workspace" />;
  }

  return (
    <Routes>
      <Route
        path="/login"
        element={
          <PublicRoute>
            <LoginPage />
          </PublicRoute>
        }
      />
      <Route
        path="/signup"
        element={
          <PublicRoute>
            <SignupPage />
          </PublicRoute>
        }
      />

      <Route
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/submit-expense" element={<SubmitExpensePage />} />
        <Route path="/my-expenses" element={<MyExpensesPage />} />
        <Route
          path="/approvals"
          element={
            <ProtectedRoute roles={["admin", "manager"]}>
              <ApprovalsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin"
          element={
            <ProtectedRoute roles={["admin"]}>
              <AdminPanelPage />
            </ProtectedRoute>
          }
        />
      </Route>

      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

export default App;
