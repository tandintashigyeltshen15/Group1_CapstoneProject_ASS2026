// Where each role lands after logging in
export const HOME = {
  Student: "/dashboard",
  Alumni: "/alumni/dashboard",
  Staff: "/staff/dashboard",
  Administrator: "/admin/dashboard",
};

export function saveSession(token, user) {
  localStorage.setItem("token", token);
  localStorage.setItem("user", JSON.stringify(user));
}

export function clearSession() {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
}

function expired(token) {
  try {
    const payload = JSON.parse(atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")));
    return payload.exp * 1000 < Date.now();
  } catch {
    return true;
  }
}

// Returns { token, user } or null
export function getSession() {
  try {
    const token = localStorage.getItem("token");
    const user = JSON.parse(localStorage.getItem("user"));
    if (!token || !user || expired(token)) {
      clearSession();
      return null;
    }
    return { token, user };
  } catch {
    return null;
  }
}