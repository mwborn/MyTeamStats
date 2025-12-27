import { UserRole } from "../types";

export const hasPermission = (role: UserRole, path: string): boolean => {
    const route = path.split('/')[1] ? '/' + path.split('/')[1] : '/';

    const commonRoutes = ['/', '/schedule', '/report', '/team-stats'];
    const manageRoutes = ['/roster', '/import'];
    const adminRoutes = ['/users', '/setup'];

    if (role === 'admin') return true;

    if (role === 'coach') {
        return [...commonRoutes, ...manageRoutes].includes(route);
    }

    if (role === 'player') {
        return commonRoutes.includes(route);
    }

    return false;
};