import React, { useState, useEffect } from 'react';

function App() {
  const [currentPage, setCurrentPage] = useState('feed');
  const [darkMode, setDarkMode] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null); // Track which user profile to show

  // --- FEATURE 1: UPDATED CONNECTION LOGIC (With Cancel Button) ---
  const [connections, setConnections] = useState([
    { id: 1, name: "Arjun Mehta", role: "Software Engineer at Google", college: "Chaibasa Engineering College", status: "none" },
    { id: 2, name: "Sneha Rao", role: "Product Manager at Amazon", college: "Chaibasa Engineering College", status: "none" },
    { id: 3, name: "Rajdeep Singh", role: "Full Stack Developer", college: "Chaibasa Engineering College", status: "none" },
  ]);

  const handleConnect = (id) => {
    setConnections(prev => prev.map(conn => {
      if (conn.id === id) {
        // Toggle: if none -> pending, if pending -> none (cancel)
        return { ...conn, status: conn.status === 'none' ? 'pending' : 'none' };
      }
      return conn;
    }));
  };

  // --- FEATURE 2: D DARK MODE FIX ---
  useEffect(() => {
    if (darkMode) {
      document.body.classList.add('dark-mode');
    } else {
      document.body.classList.remove('dark-mode');
    }
  }, [darkMode]);

  // --- UI COMPONENTS ---

  const Navigation = () => (
    <nav className="navbar" style={{ background: 'var(--card-bg)', color: 'var(--text-primary)' }}>
      <div className="nav-logo" onClick={() => setCurrentPage('feed')}>ConnectAlumni</div>
      {/* Dark Mode Toggle */}
      <button onClick={() => setDarkMode(!darkMode)} className="mode-toggle">
        {darkMode ? <i className="fas fa-sun"></i> : <i className="fas fa-moon"></i>}
      </button>
    </nav>
  );

  const Feed = () => {
    const posts = [
      { id: 1, author: "Arjun Mehta", content: "Just landed a role at Google! Big thanks to the CEC alumni network.", college: "Chaibasa Engineering College" },
      { id: 2, author: "Sneha Rao", content: "Hiring for Product Interns at Amazon. DM me if interested!", college: "Chaibasa Engineering College" }
    ];

    return (
      <div className="feed-container">
        {posts.map(post => (
          <div key={post.id} className="post-card card">
            {/* FEATURE 3: NAVIGATE TO PROFILE VIA NAME */}
            <div className="post-header" onClick={() => { setSelectedUser(post); setCurrentPage('profile'); }} style={{cursor: 'pointer'}}>
              <div className="avatar">{post.author.charAt(0)}</div>
              <div>
                <h4 className="author-name">{post.author}</h4>
                <small className="college-tag">{post.college}</small>
              </div>
            </div>
            <p className="post-content">{post.content}</p>
          </div>
        ))}
      </div>
    );
  };

  const Network = () => (
    <div className="network-container">
      <h3>People you may know</h3>
      {connections.map(person => (
        <div key={person.id} className="connection-card card">
          <div className="conn-info">
            <h4>{person.name}</h4>
            <p>{person.role}</p>
            {/* FEATURE 4: COLLEGE NAME IN CARD */}
            <small className="college-text">{person.college}</small>
          </div>
          
          <button 
            onClick={() => handleConnect(person.id)}
            className={person.status === 'pending' ? 'btn-cancel' : 'btn-connect'}
          >
            {person.status === 'pending' ? 'Cancel Request' : 'Connect'}
          </button>
        </div>
      ))}
    </div>
  );

  const Profile = ({ user }) => {
    // If no user selected (like clicking your own profile), use a default
    const displayUser = user || { name: "Your Name", role: "Developer", college: "Chaibasa Engineering College" };
    
    return (
      <div className="profile-view card">
        <div className="profile-banner"></div>
        <div className="profile-content">
          <div className="big-avatar">{displayUser.name.charAt(0)}</div>
          <h2>{displayUser.name}</h2>
          <p className="role-text">{displayUser.role}</p>
          {/* FEATURE 5: COLLEGE NAME IN PROFILE */}
          <p className="college-display">
            <i className="fas fa-university"></i> {displayUser.college}
          </p>
        </div>
      </div>
    );
  };

  return (
    <div className={`app-wrapper ${darkMode ? 'dark-mode' : ''}`}>
      <Navigation />
      <main className="content">
        {currentPage === 'feed' && <Feed />}
        {currentPage === 'network' && <Network />}
        {currentPage === 'profile' && <Profile user={selectedUser} />}
      </main>
      
      {/* Mobile Bottom Nav */}
      <div className="bottom-nav">
        <div onClick={() => { setSelectedUser(null); setCurrentPage('feed'); }}><i className="fas fa-home"></i></div>
        <div onClick={() => setCurrentPage('network')}><i className="fas fa-users"></i></div>
        <div onClick={() => { setSelectedUser(null); setCurrentPage('profile'); }}><i className="fas fa-user"></i></div>
      </div>
    </div>
  );
}

export default App;
