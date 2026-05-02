export const getUserType = () => { try { return localStorage.getItem("userType"); } catch { return null; } };
export const setUserType = (type) => { try { localStorage.setItem("userType", type); } catch { return; } };
export const getRegistration = () => { try { const data = localStorage.getItem("registration"); return data ? JSON.parse(data) : null; } catch { return null; } };
export const setRegistration = (data) => { try { localStorage.setItem("registration", JSON.stringify(data)); } catch { return; } };
export const clearRegistration = () => { try { localStorage.removeItem("registration"); } catch { return; } };
