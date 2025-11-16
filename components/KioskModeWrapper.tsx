
import React, { useEffect } from 'react';

const KioskModeWrapper: React.FC = () => {
    // Effect for blocking back button
    useEffect(() => {
        // Push a new state to the history stack to control navigation
        window.history.pushState(null, '', window.location.href);
        
        const handlePopState = () => {
            // When the user tries to go back, this event is triggered.
            // We push the state again to prevent them from leaving the page.
            window.history.pushState(null, '', window.location.href);
        };

        window.addEventListener('popstate', handlePopState);

        return () => {
            window.removeEventListener('popstate', handlePopState);
        };
    }, []);

    // This component now only handles logic and renders nothing.
    return null;
};

export default KioskModeWrapper;