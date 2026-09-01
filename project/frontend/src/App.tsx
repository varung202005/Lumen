import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AppShell } from "@/components/layout/AppShell";
import Overview from "@/pages/Overview";
import Experiments from "@/pages/Experiments";
import ExperimentDetail from "@/pages/ExperimentDetail";
import Runs from "@/pages/Runs";
import RunDetail from "@/pages/RunDetail";
import Compare from "@/pages/Compare";
import Copilot from "@/pages/Copilot";
import Datasets from "@/pages/Datasets";
import DatasetDetail from "@/pages/DatasetDetail";
import Explainability from "@/pages/Explainability";
import Lineage from "@/pages/Lineage";
import Models from "@/pages/Models";
import ModelDetail from "@/pages/ModelDetail";
import Insights from "@/pages/Insights";
import Prompts from "@/pages/Prompts";
import PromptDetail from "@/pages/PromptDetail";
import Settings from "@/pages/Settings";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppShell />}>
          <Route path="/" element={<Overview />} />
          <Route path="/experiments" element={<Experiments />} />
          <Route path="/experiments/:id" element={<ExperimentDetail />} />
          <Route path="/runs" element={<Runs />} />
          <Route path="/runs/:id" element={<RunDetail />} />
          <Route path="/compare" element={<Compare />} />
          <Route path="/copilot" element={<Copilot />} />
          <Route path="/datasets" element={<Datasets />} />
          <Route path="/datasets/:id" element={<DatasetDetail />} />
          <Route path="/explainability" element={<Explainability />} />
          <Route path="/lineage" element={<Lineage />} />
          <Route path="/models" element={<Models />} />
          <Route path="/models/:id" element={<ModelDetail />} />
          <Route path="/insights" element={<Insights />} />
          <Route path="/prompts" element={<Prompts />} />
          <Route path="/prompts/:id" element={<PromptDetail />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="*" element={<Overview />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
