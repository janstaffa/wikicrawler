import React from 'react';
import Game from './components/Game';

const App: React.FC = () => {
  return (
    <>
      <div className="app-wrap">
        <div className="main-title">
          <h1>WikiCrawler</h1>
          <p>Click through Wikipedia links to get to the target page.</p>
        </div>
        <Game />
        <div className="credits">
          by <a href="https://janstaffa.cz">janstaffa</a>
        </div>
      </div>
    </>
  );
};

export default App;
