import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import LoginPage from "./LoginPage";
import SearchPage from "./SearchPage";

const Application = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/searchPage" element={<SearchPage />} />
      </Routes>
    </Router>
  );
};

export default Application;
