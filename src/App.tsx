import React from 'react';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Game from './components/Game';

const App: React.FC = () => {
  return (
    <>
      <div className="app-wrap">
        <Game />
      </div>
      <ToastContainer />
    </>
  );
};

export default App;
