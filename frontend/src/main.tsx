import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { LayoutOffsetsProvider } from '@/context/LayoutOffsetsContext';
import { OrganizationProvider } from '@/context/OrganizationContext';
import { ThemeProvider } from '@/context/ThemeContext';

createRoot(document.getElementById("root")!).render(
	<LayoutOffsetsProvider>
		<ThemeProvider>
			<App />
		</ThemeProvider>
	</LayoutOffsetsProvider>
);

// Manage initial splash lifecycle: wait for app paint, then let the SVG arc finish before fading out.
try {
	const splash = document.getElementById('initial-splash');
	const arc = document.querySelector('.splash-arc') as SVGElement | null;
	if (splash && arc) {
		// ensure initial paint
		requestAnimationFrame(() => requestAnimationFrame(() => {
			// Wait for a minimal readiness signal. Here we wait a short while for app to paint.
			// In future we can tie this to Auth/Org readiness.
					const finalize = () => {
						// find the dedicated completion circle
						const complete = document.querySelector('.splash-complete') as SVGElement | null;
						// fade down the spinning arc (spinner) and reveal the completion ring
						arc.classList.add('complete');
						if (complete) {
							complete.classList.add('reveal');
							// ensure layout and then animate the dashoffset to 0 for smooth fill
								requestAnimationFrame(() => {
									try { void complete.getBoundingClientRect(); } catch (e: unknown) { void e; }
									requestAnimationFrame(() => {
										try { (complete as unknown as SVGElement).style.setProperty('stroke-dashoffset', '0'); } catch (e: unknown) { void e; }
									});
								});
							// wait for transitionend on the complete circle
							const onComplete = () => {
								splash.classList.add('fade-out');
								setTimeout(() => splash.remove(), 650);
								complete.removeEventListener('transitionend', onComplete);
							};
							complete.addEventListener('transitionend', onComplete);
							// safety fallback
							setTimeout(() => {
								if (document.body.contains(splash)) {
									splash.classList.add('fade-out');
									setTimeout(() => splash.remove(), 650);
								}
							}, 1500);
						} else {
							// fallback: if no complete circle, reuse arc transition
							requestAnimationFrame(() => requestAnimationFrame(() => {
								try { (arc as unknown as SVGElement).style.setProperty('stroke-dashoffset', '0'); } catch(e: unknown) { void e; }
							}));
							const onTransition = () => {
								splash.classList.add('fade-out');
								setTimeout(() => splash.remove(), 650);
								arc.removeEventListener('transitionend', onTransition);
							};
							arc.addEventListener('transitionend', onTransition);
						}
					};

			// If the app needs more time, adjust this delay or hook to a readiness event
			const READY_DELAY = 250; // ms
			const fallbackTimeout = 5000; // max wait before force finalize
			const t = setTimeout(finalize, READY_DELAY);
			const fallback = setTimeout(() => {
				clearTimeout(t);
				finalize();
			}, fallbackTimeout);
		}));
	} else if (splash) {
		// fallback: if arc not found, just fade out shortly after paint
		requestAnimationFrame(() => requestAnimationFrame(() => {
			setTimeout(() => {
				splash.classList.add('fade-out');
				setTimeout(() => splash.remove(), 600);
			}, 300);
		}));
	}
} catch (e: unknown) {
	void e; // keep silent if DOM manipulation fails
}
