import { createBrowserRouter, RouterProvider } from "react-router-dom";

import Home from "../pages/Home";
import Login from "../features/auth/Login";
import Protected from "./Protected";

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



const router = createBrowserRouter([
  { path: "/", element: <Home /> },
  { path: "/login", element: <Login /> },
  { path: "/register", element: <Register /> },

  {
    path: "/app",
    element: <Protected />,
    children: [
      { index: true, element: <Dashboard /> },

      // Barista
      { path: "jobs", element: <JobsList /> },
      { path: "my-applications", element: <MyApplications /> },

      // Cafetería
      { path: "post", element: <PostJob /> },
      { path: "jobs/manage", element: <MyJobs /> },
      { path: "jobs/:jobId/applications", element: <ApplicationsByJob /> },

      // Academia
      { path: "certificates/upload", element: <UploadCertificate /> },

      // Perfil propio y público
      { path: "profile", element: <Profile /> },
      { path: "users/:userId", element: <PublicProfile /> },

      // Admin
      { path: "admin/users", element: <AdminUsers /> },

      // Soporte
      { path: "support", element: <Support /> },
    ],
  },

  { path: "*", element: <div className="p-6">404</div> },
]);

export default function AppRouter() {
  return <RouterProvider router={router} />;
}
