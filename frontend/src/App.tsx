import { Route, Routes } from 'react-router';
import Home from './components/Home';
import Layout from './components/Layout';
import Results from './components/Results';

function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="results" element={<Results />} />
      </Route>
    </Routes>
  );
}

export default App;
