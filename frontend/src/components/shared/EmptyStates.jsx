import React from 'react';
import './EmptyStates.css';

export const EmptyState = ({
    icon = '📊',
    title = 'No hay datos disponibles',
    message = 'Los datos aparecerán aquí cuando estén disponibles.',
    action = null
}) => {
    return (
        <div className="empty-state">
            <div className="empty-state-icon">{icon}</div>
            <h3 className="empty-state-title">{title}</h3>
            <p className="empty-state-message">{message}</p>
            {action && (
                <div className="empty-state-action">
                    {action}
                </div>
            )}
        </div>
    );
};

export const ErrorState = ({
    title = 'Error al cargar datos',
    message = 'Ocurrió un error al cargar la información. Por favor, intenta nuevamente.',
    onRetry = null
}) => {
    return (
        <div className="error-state">
            <div className="error-state-icon">⚠️</div>
            <h3 className="error-state-title">{title}</h3>
            <p className="error-state-message">{message}</p>
            {onRetry && (
                <button className="retry-button" onClick={onRetry}>
                    🔄 Reintentar
                </button>
            )}
        </div>
    );
};

export const NoDataState = ({
    icon = '🔍',
    message = 'No se encontraron resultados'
}) => {
    return (
        <div className="no-data-state">
            <div className="no-data-icon">{icon}</div>
            <p className="no-data-message">{message}</p>
        </div>
    );
};

export default { EmptyState, ErrorState, NoDataState };
