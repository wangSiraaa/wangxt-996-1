import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from '@/pages/Home';
import Layout from '@/components/Layout';
import Street from '@/pages/Street';
import Resident from '@/pages/Resident';
import Supervisor from '@/pages/Supervisor';
import Objections from '@/pages/Objections';
import Construction from '@/pages/Construction';
import Changes from '@/pages/Changes';
import Risks from '@/pages/Risks';
import Archive from '@/pages/Archive';

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route element={<Layout />}>
          <Route path="/street" element={<Street />} />
          <Route path="/resident" element={<Resident />} />
          <Route path="/supervisor" element={<Supervisor />} />
          <Route path="/objections" element={<Objections />} />
          <Route path="/construction" element={<Construction />} />
          <Route path="/changes" element={<Changes />} />
          <Route path="/risks" element={<Risks />} />
          <Route path="/archive" element={<Archive />} />
        </Route>
      </Routes>
    </Router>
  );
}
