import { useState, useEffect } from 'react';

export const useIsMobile = (breakpoint: number = 768): boolean => {
    const [isMobile, setIsMobile] = useState<boolean>(false);

    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.matchMedia(`(max-width: ${breakpoint}px)`).matches);
        };

        // Check initially
        checkMobile();

        // Add listener
        const mediaQuery = window.matchMedia(`(max-width: ${breakpoint}px)`);
        const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);

        // Modern browsers
        if (mediaQuery.addEventListener) {
            mediaQuery.addEventListener('change', handler);
            return () => mediaQuery.removeEventListener('change', handler);
        } else {
            // Fallback for older browsers
            // @ts-ignore
            mediaQuery.addListener(handler);
            // @ts-ignore
            return () => mediaQuery.removeListener(handler);
        }
    }, [breakpoint]);

    return isMobile;
};
