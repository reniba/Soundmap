import { BrowserRouter, Routes, Route } from "react-router-dom";

import Login from "./pages/Login";
import SignUp from "./pages/SignUp";
import DashboardLayout from "./layouts/DashboardLayout";
import DynamicMap from "./pages/Map";
import CreateArea from "./pages/CreateArea";
import Areas from "./pages/Areas";
import Devices from "./pages/Devices";
import CreateDevice from "./pages/CreateDevice";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />

        <Route path="/signup" element={<SignUp />} />

        <Route path="/dashboard" element={<DashboardLayout />}>
          <Route path="map" element={<DynamicMap />} />
          <Route path="map/:latitude/:longitude" element={<DynamicMap />} />

          <Route path="devices" element={<Devices />} />

          <Route path="devices/createDevice" element={<CreateDevice />} />

          <Route path="areas" element={<Areas />} />

          <Route path="areas/createArea" element={<CreateArea />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
