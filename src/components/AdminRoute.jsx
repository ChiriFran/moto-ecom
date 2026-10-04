import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../services/firebase';
import AdminLogin from './AdminLogin';

const ADMIN_UID = import.meta.env.VITE_ADMIN_UID;

const AdminRoute = ({ children }) => {
  const [user, setUser] = useState(undefined);

  useEffect(() => onAuthStateChanged(auth, setUser), []);

  if (user === undefined) {
    return <div className="container section"><p>Verificando acceso...</p></div>;
  }

  if (!user) return <AdminLogin />;
  if (!ADMIN_UID || user.uid !== ADMIN_UID) return <Navigate to="/" replace />;

  return children;
};

export default AdminRoute;