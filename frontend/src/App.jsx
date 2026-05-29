import { useEffect, useState } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";

import { api } from "./api";
import Navbar from "./components/Navbar";

import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import CreateTest from "./pages/CreateTest";
import Reports from "./pages/Reports";
import NotFound from "./pages/NotFound";
import Profile from "./pages/Profile";
import TestPage from "./pages/TestPage";
import TakeTest from "./pages/TakeTest";
import Report from "./pages/Report";
import TestStats from "./pages/TestStats";

export default function App() {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    api
      .me()
      .then((data) => {
        setUser(data.user);
      })
      .catch(() => {
        setUser(null);
      })
      .finally(() => {
        setAuthLoading(false);
      });
  }, []);

  if (authLoading) {
    return <div className="container py-4">Загрузка...</div>;
  }

  return (
    <BrowserRouter>
      <Navbar user={user} setUser={setUser} />

      <main className="container py-4">
        <Routes>
          <Route path="/" element={<Home user={user} />} />

          <Route
            path="/login"
            element={
              user ? <Navigate to="/" replace /> : <Login setUser={setUser} />
            }
          />

          <Route
            path="/register"
            element={
              user ? (
                <Navigate to="/" replace />
              ) : (
                <Register setUser={setUser} />
              )
            }
          />

          <Route
            path="/tests/create"
            element={user ? <CreateTest /> : <Navigate to="/login" replace />}
          />
          <Route
            path="/tests/:id/take"
            element={user ? <TakeTest /> : <Navigate to="/login" replace />}
          />
          <Route
            path="/reports"
            element={user ? <Reports /> : <Navigate to="/login" replace />}
          />
          <Route path="/profiles/:username" element={<Profile />} />
          <Route path="/report/:id" element={<Report />} />
          <Route path="/tests/:id/stats" element={<TestStats />} />
          <Route path="/test-page" element={<TestPage />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
    </BrowserRouter>
  );
}
