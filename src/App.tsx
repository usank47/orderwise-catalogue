import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import NewOrder from "./pages/NewOrder";
import PriceList from "./pages/PriceList";
import OrderHistory from "./pages/OrderHistory";
import NotFound from "./pages/NotFound";

const App = () => (
  <>
    <Toaster />
    <Sonner />
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout><PriceList /></Layout>} />
        <Route path="/new-order" element={<Layout><NewOrder /></Layout>} />
        <Route path="/order-history" element={<Layout><OrderHistory /></Layout>} />
        {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  </>
);

export default App;
