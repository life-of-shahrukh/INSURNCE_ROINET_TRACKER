import {
  ArcElement,
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Filler,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  Title,
  Tooltip,
} from "chart.js";

let registered = false;

export function registerCharts() {
  if (registered) return;
  ChartJS.register(
    ArcElement,
    BarElement,
    CategoryScale,
    LinearScale,
    LineElement,
    PointElement,
    Filler,
    Legend,
    Title,
    Tooltip,
  );
  registered = true;
}
