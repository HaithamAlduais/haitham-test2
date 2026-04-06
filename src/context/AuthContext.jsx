import { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "../firebase";

const skipEmailVerification =
  import.meta.env.VITE_SKIP_EMAIL_VERIFICATION === "true";

// 1. Create the context
const AuthContext = createContext();

// 2. Custom hook for easy consumption
export const useAuth = () => useContext(AuthContext);

// 3. Provider component
export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null); // Firebase Auth user
  const [userRole, setUserRole] = useState(null);       // Role from Firestore
  const [loading, setLoading] = useState(true);         // Prevents flash of wrong UI

  useEffect(() => {
    // Listen to Firebase Auth state changes
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      // SECURITY GATE: Only treat the user as authenticated if their
      // email address has been verified. Unverified users are treated
      // the same as logged-out users throughout the entire app.
      if (user && (user.emailVerified || skipEmailVerification)) {
        // User is signed in AND verified — fetch their role from Firestore
        try {
          const userDocSnap = await getDoc(doc(db, "users", user.uid));

          if (userDocSnap.exists()) {
            setUserRole(userDocSnap.data().role);
          } else {
            setUserRole(null);
          }
        } catch (error) {
          console.error("Error fetching user role: ", error);
          setUserRole(null);
        }

        setCurrentUser(user);
      } else {
        // User is signed out OR email is not yet verified — clear everything.
        // This means unverified users can never access protected routes.
        setCurrentUser(null);
        setUserRole(null);
      }

      setLoading(false);
    });

    // Cleanup listener on unmount
    return () => unsubscribe();
  }, []);

  const logout = () => signOut(auth);

  // 4. Broadcast user session + role to the entire app
  const value = {
    currentUser,
    userRole,
    loading,
    logout,
  };

  // Always render children so public routes (e.g. landing `/`) are not a blank screen
  // while Firebase resolves. Protected routes must check `loading` in PrivateRoute.
  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
