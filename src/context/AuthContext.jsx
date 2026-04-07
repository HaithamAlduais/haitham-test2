import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "../firebase";

const skipEmailVerification =
  import.meta.env.VITE_SKIP_EMAIL_VERIFICATION === "true";

/** Map legacy role names to the new canonical role. */
const LEGACY_ROLE_MAP = { Provider: "Organizer" };

// 1. Create the context
const AuthContext = createContext();

// 2. Custom hook for easy consumption
export const useAuth = () => useContext(AuthContext);

// 3. Provider component
export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [userRole, setUserRole] = useState(null);    // primary role (first in array)
  const [roles, setRoles] = useState([]);             // full roles array
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user && (user.emailVerified || skipEmailVerification)) {
        try {
          const userDocSnap = await getDoc(doc(db, "users", user.uid));

          if (userDocSnap.exists()) {
            const data = userDocSnap.data();
            // Prefer `roles` array; fall back to legacy `role` string
            let userRoles;
            if (Array.isArray(data.roles) && data.roles.length > 0) {
              userRoles = data.roles;
            } else if (data.role) {
              const mapped = LEGACY_ROLE_MAP[data.role] || data.role;
              userRoles = [mapped];
            } else {
              userRoles = [];
            }
            setRoles(userRoles);
            setUserRole(userRoles[0] || null);
          } else {
            setUserRole(null);
            setRoles([]);
          }
        } catch (error) {
          console.error("Error fetching user role: ", error);
          setUserRole(null);
          setRoles([]);
        }

        setCurrentUser(user);
      } else {
        setCurrentUser(null);
        setUserRole(null);
        setRoles([]);
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const logout = () => signOut(auth);

  /** Check if the user has a specific role. */
  const hasRole = useCallback((roleName) => roles.includes(roleName), [roles]);

  const value = {
    currentUser,
    userRole,
    roles,
    hasRole,
    loading,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
