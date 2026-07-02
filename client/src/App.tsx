import { Route, Routes } from "react-router-dom";
import Home from "./pages/Home";
import Auth from "./pages/Auth";
import PlaceDetail from "./pages/PlaceDetail";
import HostPlaces from "./pages/HostPlaces";
import HostPlaceNew from "./pages/HostPlaceNew";
import HostPlaceShow from "./pages/HostPlaceShow";
import HostPlaceEdit from "./pages/HostPlaceEdit";
import HostRoomNew from "./pages/HostRoomNew";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/auth" element={<Auth />} />
      <Route path="/places/:id" element={<PlaceDetail />} />
      <Route path="/host/places" element={<HostPlaces />} />
      <Route path="/host/places/new" element={<HostPlaceNew />} />
      <Route
        path="/host/places/:placeId/rooms/new"
        element={<HostRoomNew />}
      />
      <Route path="/host/places/:id/edit" element={<HostPlaceEdit />} />
      <Route path="/host/places/:id" element={<HostPlaceShow />} />
    </Routes>
  );
}
