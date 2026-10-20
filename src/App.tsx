import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import Home from "./pages/Home";
import CsvToSql from "./pages/CsvToSql";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />
          <Route path="/csv-to-sql" element={<CsvToSql />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
