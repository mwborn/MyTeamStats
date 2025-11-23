import { User, UserRole } from "../types";
import { getDB } from "./storage";

const SESSION_KEY = 'basketstats_session_user';

export const login = (username: string, password: string): User | null => {
    const db = getDB();
    const user = db.users.find(u => u.username === username && u.password === password);
    if (user) {
        localStorage.setItem(SESSION_KEY, JSON.stringify(user));
        return user;
    }
    return null;
};

export const logout = () => {
    localStorage.removeItem(SESSION_KEY);
};

export const getCurrentUser = (): User | null => {
    const data = localStorage.getItem(SESSION_KEY);
    if (!data) return null;
    try {
        return JSON.parse(data);
    } catch {
        return null;
    }
};

export const hasPermission = (role: UserRole, path: string): boolean => {
    // Normalize path to base route
    const route = path.split('/')[1] ? '/' + path.split('/')[1] : '/';

    const commonRoutes = ['/', '/schedule', '/report', '/team-stats'];
    const manageRoutes = ['/roster', '/import'];
    const adminRoutes = ['/users'];

    if (role === 'admin') return true;

    if (role === 'coach') {
        return [...commonRoutes, ...manageRoutes].includes(route);
    }

    if (role === 'player') {
        return commonRoutes.includes(route);
    }

    return false;
};
