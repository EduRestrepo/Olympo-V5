import React from 'react';
import './TabContainer.css';

const TabContainer = ({ tabs, activeTab, onTabChange, children }) => {
  return (
    <div className="tab-container">
      <div className="tab-header">
        <div className="tab-menu-title">MENÚ</div>
        <div className="tab-list">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => onTabChange(tab.id)}
              title={tab.description}
            >
              <span className="tab-icon">{tab.icon}</span>
              <span className="tab-label">{tab.label}</span>
            </button>
          ))}
        </div>
      </div>
      <div className="tab-content">
        {children}
      </div>
    </div>
  );
};

export default TabContainer;
