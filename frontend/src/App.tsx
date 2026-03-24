import { Route, Routes } from 'react-router';
import Account from './components/Account';
import Home from './components/Home';
import Layout from './components/Layout';
import Results from './components/Results';
import TripDetail from './components/TripDetail';

function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="results" element={<Results />} />
        <Route path="account" element={<Account />} />
        <Route path="trips/:tripId" element={<TripDetail />} />
      </Route>
    </Routes>
  );
}

export default App;
