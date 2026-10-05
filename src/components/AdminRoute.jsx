import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from '../services/firebase';
import AdminLogin from './AdminLogin';
import './AdminLogin.css';

const ADMIN_UID = import.meta.env.VITE_ADMIN_UID;

const AdminRoute = ({ children }) => {
  const [user, setUser] = useState(undefined);
  const navigate = useNavigate();

  useEffect(() => onAuthStateChanged(auth, setUser), []);

  const handleSignOut = async () => {
    await signOut(auth);
    setUser(null);
  };

  if (user === undefined) {
    return <div className="container section"><p>Verificando acceso...</p></div>;
  }

  if (!user) return <AdminLogin />;

  // Fallar en silencio con un redirect al home oculta la causa (UID desactualizado
  // en .env, VITE_ADMIN_VID ausente en el deploy, cuenta equivocada).
  if (!ADMIN_UID || user.uid !== ADMIN_UID) {
    return (
      <div className="container section">
        <div className="admin-access-denied">
          <h1>Acceso denegado</h1>
          <p>Esta cuenta no está autorizada para entrar al panel de administración.</p>

          {import.meta.env.DEV && (
            <p className="admin-access-denied__debug">
              Tu UID: <code>{user.uid}</code>
              <br />
              VITE_ADMIN_UID: <code>{ADMIN_UID || '(sin definir)'}</code>
            </p>
          )}

          <div className="admin-access-denied__actions">
            <button className="btn btn-outline btn-sm" type="button" onClick={handleSignOut}>
              Ingresar con otra cuenta
            </button>
            <button className="btn btn-primary btn-sm" type="button" onClick={() => navigate('/')}>
              Volver al inicio
            </button>
          </div>
        </div>
      </div>
    );
  }

  return children;
};

export default AdminRoute;