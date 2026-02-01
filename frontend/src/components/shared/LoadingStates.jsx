import React from 'react';
import './LoadingStates.css';

export const LoadingSpinner = ({ size = 'medium', message = 'Cargando...' }) => {
    return (
        <div className={`loading-spinner ${size}`}>
            <div className="spinner-circle"></div>
            {message && <p className="loading-message">{message}</p>}
        </div>
    );
};

export const SkeletonCard = () => {
    return (
        <div className="skeleton-card">
            <div className="skeleton-header"></div>
            <div className="skeleton-line"></div>
            <div className="skeleton-line short"></div>
        </div>
    );
};

export const SkeletonTable = ({ rows = 5 }) => {
    return (
        <div className="skeleton-table">
            {Array.from({ length: rows }).map((_, i) => (
                <div key={i} className="skeleton-row">
                    <div className="skeleton-cell"></div>
                    <div className="skeleton-cell"></div>
                    <div className="skeleton-cell"></div>
                </div>
            ))}
        </div>
    );
};

export const LoadingOverlay = ({ message = 'Procesando...' }) => {
    return (
        <div className="loading-overlay">
            <div className="loading-overlay-content">
                <LoadingSpinner size="large" message={message} />
            </div>
        </div>
    );
};

export default { LoadingSpinner, SkeletonCard, SkeletonTable, LoadingOverlay };
