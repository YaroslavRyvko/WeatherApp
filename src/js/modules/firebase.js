import { initAdmin } from './admin';
import { initAuth } from './auth';
import { initProfile } from './profile';

export function initFirebase() {
    initAdmin();
    initAuth();
    initProfile();
}