import { useState, useEffect } from "react";
import { getUserType } from "../utils/storage";

export const useUserType = () => {
  const [userType, setUserType] = useState(() => getUserType());
  useEffect(() => {
    const handleStorage = () => { setUserType(getUserType()); };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);
  return userType;
};
