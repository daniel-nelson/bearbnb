import { Route, Routes } from "react-router-dom";
import Home from "./pages/Home";
import Auth from "./pages/Auth";
import PlaceDetail from "./pages/PlaceDetail";
import HostPlaces from "./pages/HostPlaces";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/auth" element={<Auth />} />
      <Route path="/places/:id" element={<PlaceDetail />} />
      <Route path="/host/places" element={<HostPlaces />} />
    </Routes>
  );
}
