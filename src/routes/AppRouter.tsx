// src/routes/AppRouter.tsx
import { createBrowserRouter, RouterProvider } from "react-router-dom";

import Home from "../pages/Home";
import Login from "../features/auth/Login";
import Protected from "./Protected";
import RoleProtected from "./RoleProtected";

import Dashboard from "../pages/Dashboard";
import JobsList from "../features/jobs/JobsList";
import PostJob from "../features/jobs/PostJob";
import MyJobs from "../features/jobs/MyJobs";
import ApplicationsByJob from "../features/jobs/ApplicationsByJob";
import MyApplications from "../features/jobs/MyApplications";

import Profile from "../features/profile/Profile";
import PublicProfile from "../features/profile/PublicProfile";
import UploadCertificate from "../features/certificates/UploadCertificate";
import AdminUsers from "../features/admin/AdminUsers";
import Support from "../pages/Support";
import Register from "../features/auth/Register";

import ReviewsDashboard from "../features/reviews/ReviewDashboard"; 

const router = createBrowserRouter([
  { path: "/", element: <Home /> },
  { path: "/login", element: <Login /> },
  { path: "/register", element: <Register /> },

  {
    path: "/app",
    element: <Protected />,
    children: [
      { index: true, element: <Dashboard /> },

      // ------------------------
      // BARISTA (worker)
      // ------------------------
      {
        element: <RoleProtected allow={["barista"]} />,
        children: [
          { path: "jobs", element: <JobsList /> },
          { path: "my-applications", element: <MyApplications /> },
        ],
      },

      // ------------------------
      // CAFE (restaurant/client)
      // ------------------------
      {
        element: <RoleProtected allow={["cafe"]} />,
        children: [
          { path: "post", element: <PostJob /> },
          { path: "jobs/:jobId/edit", element: <PostJob /> },
          { path: "jobs/manage", element: <MyJobs /> },
          { path: "jobs/:jobId/applications", element: <ApplicationsByJob /> },

          { path: "reviews", element: <ReviewsDashboard /> },
        ],
      },

      // ------------------------
      // ACADEMY
      // ------------------------
      {
        element: <RoleProtected allow={["academy"]} />,
        children: [
          { path: "certificates/upload", element: <UploadCertificate /> },
        ],
      },

      // PERFIL
      { path: "profile", element: <Profile /> },
      { path: "users/:userId", element: <PublicProfile /> },

      // ADMIN
      {
        element: <RoleProtected allow={["admin"]} />,
        children: [{ path: "admin/users", element: <AdminUsers /> }],
      },

      // SOPORTE
      { path: "support", element: <Support /> },
    ],
  },

  { path: "*", element: <div className="p-6">404</div> },
]);

export default function AppRouter() {
  return <RouterProvider router={router} />;
}
