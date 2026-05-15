import { Route, Routes } from 'react-router';
import Home from './components/Home';
import Layout from './components/Layout';
import Results from './components/Results';

// Define the client-side route tree with a shared layout wrapping home and results
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
