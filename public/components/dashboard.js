import AdvisorPanel from "../../components/AdvisorPanel.js";
import MarketLivePanel from "../../components/MarketLivePanel.js";

const app = document.getElementById("app");
app.innerHTML = "";
app.appendChild(AdvisorPanel());
app.appendChild(MarketLivePanel());
