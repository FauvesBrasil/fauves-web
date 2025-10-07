import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { LayoutOffsetsProvider } from '@/context/LayoutOffsetsContext';
import { OrganizationProvider } from '@/context/OrganizationContext';

createRoot(document.getElementById("root")!).render(
	<LayoutOffsetsProvider>
		<OrganizationProvider>
			<App />
		</OrganizationProvider>
	</LayoutOffsetsProvider>
);
