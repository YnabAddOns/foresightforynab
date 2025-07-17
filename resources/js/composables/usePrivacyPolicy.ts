import { computed, ref } from 'vue';

const COOKIE_NAME = 'privacy_policy_version';
const COOKIE_EXPIRY_DAYS = 365;

// Helper function to get cookie value
export function getCookie(name: string): string | null {
    if (typeof document === 'undefined') return null; // SSR safety

    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop()?.split(';').shift() || null;
    return null;
}

// Helper function to set cookie
export function setCookie(name: string, value: string, days: number = COOKIE_EXPIRY_DAYS): void {
    if (typeof document === 'undefined') return; // SSR safety

    const expires = new Date();
    expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
    document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/;SameSite=Lax`;
}

// Helper function to clear cookie
export function clearCookie(name: string): void {
    if (typeof document === 'undefined') return; // SSR safety

    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
}

// Composable for privacy policy management
export function usePrivacyPolicy(currentVersion: string) {
    const dismissed = ref(false);
    const showModal = ref(false);

    // Check if user has seen this version
    const hasSeenCurrentVersion = computed(() => {
        const storedVersion = getCookie(COOKIE_NAME);
        return storedVersion === currentVersion;
    });

    // Check if we should show the banner
    const shouldShowBanner = computed(() => {
        return !dismissed.value && !hasSeenCurrentVersion.value;
    });

    function acknowledgeChanges() {
        setCookie(COOKIE_NAME, currentVersion, COOKIE_EXPIRY_DAYS);
        dismissed.value = true;
    }

    function openModal() {
        showModal.value = true;
    }

    function closeModal() {
        showModal.value = false;
    }

    function handleModalAcknowledge() {
        acknowledgeChanges();
    }

    // Utility function to clear privacy policy acknowledgment (for testing)
    function clearAcknowledgment() {
        clearCookie(COOKIE_NAME);
        dismissed.value = false;
    }

    return {
        dismissed,
        showModal,
        hasSeenCurrentVersion,
        shouldShowBanner,
        acknowledgeChanges,
        openModal,
        closeModal,
        handleModalAcknowledge,
        clearAcknowledgment,
    };
}
