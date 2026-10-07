import Icon from './Icon';
import { StarLogo } from './Graphics';

export default function Header({ ui, activeTab, onTabChange, systemOnline }) {
  return (
    <header className="header">
      <div className="brand">
        <StarLogo />
        <span className="brand-name">{ui.brand}</span>
      </div>
      <span className="app-title">{ui.appTitle}</span>
      <nav className="tabs" aria-label="Main">
        {ui.tabs.map((tab) => (
          <button
            key={tab.id}
            className={`tab ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => onTabChange(tab.id)}
          >
            <Icon name={tab.icon} size={22} />
            {tab.label}
          </button>
        ))}
      </nav>
      <div className={`status-pill ${systemOnline ? 'online' : 'offline'}`}>
        <span className="dot" />
        {systemOnline ? 'SYSTEM ONLINE' : 'SYSTEM OFFLINE'}
      </div>
    </header>
  );
}
