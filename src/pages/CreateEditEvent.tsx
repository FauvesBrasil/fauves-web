"use client";

import * as React from "react";
import SidebarMenu from "@/components/SidebarMenu";
import AppHeader from "@/components/AppHeader";
import EventDetailsSidebar from "@/components/EventDetailsSidebar";
import { useState, useEffect, useRef, useMemo } from "react";
import { ChevronLeft, ChevronDown, ExternalLink, Upload } from "lucide-react";
import { useNavigate, useLocation } from 'react-router-dom';
import { fetchApi } from '@/lib/apiBase';
import StepFlowOverlay from '@/components/overlays/StepFlowOverlay';
import { toast } from '@/components/ui/sonner';
import CheckIcon from "../components/icons/CheckIcon";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import { Card } from "../components/ui/card";
import { Avatar, AvatarFallback } from "../components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import DateRangePicker from '@/components/DateRangePicker';
import { useOrganization } from '@/context/OrganizationContext';
import { useAuth } from '@/context/AuthContext';
import RequireOrganization from '@/components/RequireOrganization';
import OrgProfileCardSkeleton from '../components/skeletons/OrgProfileCardSkeleton';
import NextEventCardSkeleton from '../components/skeletons/NextEventCardSkeleton';

const BRAZIL_UFS = [
	"AC","AL","AP","AM","BA","CE","DF","ES","GO","MA",
	"MT","MS","MG","PA","PB","PR","PE","PI","RJ","RN",
	"RS","RO","RR","SC","SP","SE","TO"
] as const;

function CreateEditEvent() {
	const navigate = useNavigate();
	const [eventName, setEventName] = useState("");
	const [eventSubtitle, setEventSubtitle] = useState("");
	const [startDate, setStartDate] = useState("");
	const [startTime, setStartTime] = useState("");
	const [endDate, setEndDate] = useState("");
	const [endTime, setEndTime] = useState("");
	const [locationType, setLocationType] = useState("Local");
	const [locationAddress, setLocationAddress] = useState("");
	const [onlineUrl, setOnlineUrl] = useState("");
	const [tbdUf, setTbdUf] = useState("");
	const [tbdCity, setTbdCity] = useState("");
	const [eventDescription, setEventDescription] = useState("");
		// organizadores locais para o select (id, name, optional avatar)
		const [organizers, setOrganizers] = useState<Array<{id:string; name:string; avatar?: string}>>([
				{ id: 'fauves', name: 'Fauves entretenimento', avatar: undefined },
				{ id: 'other', name: 'Outro organizador', avatar: undefined },
		]);
		// Organization context (top-level hook only)
		const { orgs: ctxOrgs, loading: loadingOrgs, refresh, addOrganization } = useOrganization();
		const { user, loading: authLoading } = useAuth();
		// ensure we only auto-open the modal once per page load / auth state change
		const modalAutoOpenedRef = useRef(false);

		// selected organizer state (placed before effect that references it)
		const [selectedOrganizer, setSelectedOrganizer] = useState<string>('fauves');

		// eventId from query string (when editing an existing event)
		const location = useLocation();
		const eventId = useMemo(() => {
			const params = new URLSearchParams(location.search);
			return params.get('eventId');
		}, [location.search]);

		// loading state while fetching existing event
		const [loadingEvent, setLoadingEvent] = useState(false);

		// Keep local organizers list in sync with organizations from context
		useEffect(() => {
			if (Array.isArray(ctxOrgs) && ctxOrgs.length > 0) {
				setOrganizers(ctxOrgs.map(o => ({ id: o.id, name: o.name, avatar: o.logoUrl || undefined })));
				// if selectedOrganizer is not set or still the placeholder, default to first
				if (!selectedOrganizer || selectedOrganizer === 'fauves' || !ctxOrgs.find(o => o.id === selectedOrganizer)) {
					setSelectedOrganizer(ctxOrgs[0].id);
				}
			}
		}, [ctxOrgs, selectedOrganizer]);

		// Load event data when editing (eventId present)
		useEffect(() => {
			if (!eventId) return;
			let mounted = true;
			setLoadingEvent(true);
			(async () => {
				try {
					const res = await fetchApi(`/api/event/${eventId}`);
					if (!res || !res.ok) return;
					const ev = await res.json();
					if (!ev) return;
					// populate fields
					if (!mounted) return;
					setEventName(ev.name || ev.title || '');
					setEventSubtitle(ev.subtitle || ev.subTitle || '');
					setEventDescription(ev.description || '');
					if (ev.startDate) {
						const d = new Date(ev.startDate);
						setStartDate(d.toISOString().slice(0,10));
						setStartTime(d.toTimeString().slice(0,5));
					}
					if (ev.endDate) {
						const d2 = new Date(ev.endDate);
						setEndDate(d2.toISOString().slice(0,10));
						setEndTime(d2.toTimeString().slice(0,5));
					}
					// Prefer structured fields when deciding location type
					const details = (ev as any).locationDetails || {};
					const hasAddress = !!(ev.locationAddress || details.address);
					const hasOnline = !!(ev.onlineUrl || details.url);
					const hasTbd = !!(ev.locationUf || ev.locationCity || details.uf || details.city);
					let locType = 'Local';
					if (hasAddress) locType = 'Local';
					else if (hasOnline) locType = 'Evento online';
					else if (hasTbd) locType = 'Local será anunciado em breve';
					else {
						const raw = (ev.location || details.type || '').toString();
						if (raw.includes('Local será anunciado')) locType = 'Local será anunciado em breve';
						else if (raw.includes('Evento online')) locType = 'Evento online';
						else if (raw.includes('Local')) locType = 'Local';
						else locType = raw || 'Local';
					}
					setLocationType(locType);
					if (locType === 'Local') {
						setLocationAddress(ev.locationAddress || details.address || (typeof ev.location === 'string' ? ev.location : '') || '');
					} else if (locType === 'Evento online') {
						setOnlineUrl(ev.onlineUrl || details.url || (typeof ev.location === 'string' ? ev.location : '') || '');
					} else if (locType === 'Local será anunciado em breve') {
						setTbdUf(ev.locationUf || details.uf || '');
						setTbdCity(ev.locationCity || details.city || '');
					}
					// image
					if (ev.image) {
						setBannerPreview(ev.image);
						setBannerSaved(true);
					}
					// organizer
					const orgId = ev.organizerId || ev.organizationId || null;
					if (orgId) setSelectedOrganizer(orgId);
				} catch (err) {
					console.warn('Failed to load event', err);
				} finally {
					if (mounted) setLoadingEvent(false);
				}
			})();

			return () => { mounted = false; };
		}, [eventId]);
	const [errors, setErrors] = useState({ url: "", tbd: "" });
	// Estados para refinamento visual
	const [bannerSaved, setBannerSaved] = useState(false);
	const [eventSaved, setEventSaved] = useState(false);
	const [editName, setEditName] = useState(false);
	const [editDate, setEditDate] = useState(false);
	const [dateSaved, setDateSaved] = useState(false);
	const [dateError, setDateError] = useState("");
	const [startDateError, setStartDateError] = useState("");
	const [startTimeError, setStartTimeError] = useState("");
	const [endDateError, setEndDateError] = useState("");
	const [endTimeError, setEndTimeError] = useState("");
	const [locationError, setLocationError] = useState("");

	const startDateRef = useRef<HTMLInputElement | null>(null);
	const startTimeRef = useRef<HTMLInputElement | null>(null);
	const endDateRef = useRef<HTMLInputElement | null>(null);
	const endTimeRef = useRef<HTMLInputElement | null>(null);
	const locationAddressRef = useRef<HTMLInputElement | null>(null);

	// Upload states
	const [bannerFile, setBannerFile] = useState<File | null>(null);
	const [bannerPreview, setBannerPreview] = useState<string | null>(null);
	const [uploading, setUploading] = useState(false);
	const [uploadProgress, setUploadProgress] = useState(0);
	const fileInputRef = useRef<HTMLInputElement | null>(null);
	// refs for overview editing behavior
	const overviewRef = useRef<HTMLDivElement | null>(null);
	const nameInputRef = useRef<HTMLInputElement | null>(null);
	const subtitleRef = useRef<HTMLTextAreaElement | null>(null);
	const dateRef = useRef<HTMLDivElement | null>(null);
	const [editHowItWorks, setEditHowItWorks] = useState(false);
	const [howItWorksSaved, setHowItWorksSaved] = useState(false);
	const [howItWorksText, setHowItWorksText] = useState("");
	const howRef = useRef<HTMLDivElement | null>(null);

	// show modal to create an organization inline
	const [showCreateOrgModal, setShowCreateOrgModal] = useState(false);

	// Flow overlay for step animations (1: criar evento, 2: criar ingressos, 3: publicar)
	const [flowVisible, setFlowVisible] = useState(false);
	const [flowStep, setFlowStep] = useState<1 | 2 | 3>(2);

	// Auto-open RequireOrganization modal when the authenticated user has no orgs
	useEffect(() => {
		try {
			// only when auth finished loading and orgs finished loading
			if (authLoading || loadingOrgs) return;
			if (!user || !user.id) return;
			const hasOrgs = Array.isArray(ctxOrgs) && ctxOrgs.length > 0;
			if (!hasOrgs && !modalAutoOpenedRef.current) {
				console.debug('[CreateEditEvent] No organizations found for user, opening RequireOrganization modal');
				modalAutoOpenedRef.current = true;
				setShowCreateOrgModal(true);
			}
			// Reset the one-shot flag if orgs appear (so it can open again in future flows)
			if (hasOrgs) {
				modalAutoOpenedRef.current = false;
			}
		} catch (e) {
			console.warn('[CreateEditEvent] auto-open org modal effect failed', e);
		}
	}, [authLoading, loadingOrgs, user, ctxOrgs]);

	// show a lightweight skeleton overlay while orgs are loading or empty to avoid rendering broken UI
	const showNoOrgSkeleton = (() => {
		if (authLoading || loadingOrgs) return true; // still loading
		if (!user || !user.id) return false; // not authenticated, let auth gate handle it elsewhere
		const hasOrgs = Array.isArray(ctxOrgs) && ctxOrgs.length > 0;
		return !hasOrgs;
	})();

	// (no duplicate hook calls) organization helpers are above

	// helpers for date/time constraints
	function toISODate(d: Date) {
		return d.toISOString().slice(0,10);
	}

	function toTimeHHMM(d: Date) {
		return d.toTimeString().slice(0,5);
	}

	function addMinutes(d: Date, minutes: number) {
		return new Date(d.getTime() + minutes * 60000);
	}

	function roundUpToNext30(d: Date) {
		const ms = d.getTime();
		const minutes = d.getMinutes();
		const remainder = minutes % 30;
		const diff = remainder === 0 ? 0 : 30 - remainder;
		return addMinutes(d, diff);
	}

	function formatSingleDate(dateStr?: string, timeStr?: string) {
		if (!dateStr) return "Data não definida";
		try {
			// If incoming date already contains a time, respect it; otherwise attach provided time (or midnight)
			const iso = dateStr.includes('T') ? dateStr : `${dateStr}T${timeStr ?? '00:00'}`;
			const d = new Date(iso);
			// format like: 12 de mai. or 12 mai às 19:30
			const datePart = d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
			return `${datePart}${timeStr ? ` às ${timeStr}` : ''}`;
		} catch (err) {
			return dateStr;
		}
	}

	useEffect(() => {
		// set sensible defaults on mount: startDate = today, startTime = now rounded up + 30min
		const now = new Date();
		const rounded = roundUpToNext30(now);
		const defaultStart = addMinutes(rounded, 30); // at least 30min after user
		if (!startDate) setStartDate(toISODate(defaultStart));
		if (!startTime) setStartTime(toTimeHHMM(defaultStart));
		// default end = start + 30min
		const defaultEnd = addMinutes(defaultStart, 30);
		if (!endDate) setEndDate(toISODate(defaultEnd));
		if (!endTime) setEndTime(toTimeHHMM(defaultEnd));
	}, []);

	// when start changes, ensure end is >= start + 30min
	useEffect(() => {
		if (!startDate || !startTime) return;
		const s = new Date(startDate + `T${startTime}`);
		const minEnd = addMinutes(s, 30);
		const currentEnd = (endDate && endTime) ? new Date(endDate + `T${endTime}`) : null;
		if (!currentEnd || currentEnd.getTime() < minEnd.getTime()) {
			const newEnd = minEnd;
			setEndDate(toISODate(newEnd));
			setEndTime(toTimeHHMM(newEnd));
		}
	}, [startDate, startTime]);

	// utility to provide min attributes for inputs
	function minStartDate() {
		const today = new Date();
		return toISODate(today);
	}

	function minStartTimeFor(dateStr: string) {
		const today = new Date();
		const target = new Date(dateStr + `T00:00`);
		if (toISODate(today) === toISODate(target)) {
			// if user picks today, min time is now rounded up + 30min
			const rounded = roundUpToNext30(today);
			const min = addMinutes(rounded, 30);
			return toTimeHHMM(min);
		}
		return '00:00';
	}

	function minEndTimeFor(dateStr: string, startD: string, startT: string) {
		if (!startD || !startT) return '00:00';
		const s = new Date(startD + `T${startT}`);
		const minEnd = addMinutes(s, 30);
		if (toISODate(new Date()) === dateStr) {
			// ensure end min when date is today
			return toTimeHHMM(minEnd);
		}
		return toTimeHHMM(minEnd);
	}

	function handleDateBlur(e: React.FocusEvent) {
		const related = (e.nativeEvent as any).relatedTarget as HTMLElement | null;
		const container = dateRef.current;
		if (container && related && container.contains(related)) return; // still inside

		// validate required: startDate and startTime
		let firstInvalid: HTMLElement | null = null;
		let valid = true;
		if (!startDate || startDate.trim().length === 0) {
			setStartDateError("Campo obrigatório");
			valid = false;
			firstInvalid = firstInvalid || startDateRef.current;
		} else {
			setStartDateError("");
		}
		if (!startTime || startTime.trim().length === 0) {
			setStartTimeError("Campo obrigatório");
			valid = false;
			firstInvalid = firstInvalid || startTimeRef.current;
		} else {
			setStartTimeError("");
		}

		// location validation depending on type
		if (locationType === 'Local') {
			if (!locationAddress || locationAddress.trim().length === 0) {
				setLocationError('Informe o endereço');
				valid = false;
				firstInvalid = firstInvalid || locationAddressRef.current;
			} else {
				setLocationError('');
			}
		} else if (locationType === 'Evento online') {
			if (!onlineUrl || !/^https?:\/\//i.test(onlineUrl)) {
				setLocationError('Informe uma URL válida');
				valid = false;
				firstInvalid = firstInvalid || null;
			} else {
				setLocationError('');
			}
		} else {
			// TBD: require city/uf
			if (!tbdCity || !tbdUf) {
				setLocationError('Informe cidade e estado');
				valid = false;
				firstInvalid = firstInvalid || null;
			} else setLocationError('');
		}

		if (!valid) {
			if (firstInvalid) firstInvalid.focus();
			return;
		}

		// all good
		setDateError("");
		setEditDate(false);
		setDateSaved(true);
	}

	// validation
	const [nameError, setNameError] = useState("");
	const [subtitleError, setSubtitleError] = useState("");

	useEffect(() => {
		// cleanup preview URL on unmount or when changed
		return () => {
			if (bannerPreview) URL.revokeObjectURL(bannerPreview);
		};
	}, [bannerPreview]);

	function triggerFileDialog() {
		fileInputRef.current?.click();
	}

	function handleSelectFile(e: React.ChangeEvent<HTMLInputElement>) {
		const f = e.target.files && e.target.files[0];
		if (!f) return;
		if (bannerPreview) URL.revokeObjectURL(bannerPreview);
		const url = URL.createObjectURL(f);
		setBannerFile(f);
		setBannerPreview(url);
		// marcar como salvo imediatamente (sem botão salvar)
		setBannerSaved(true);
		setUploadProgress(100);
	}

	function handleOverviewBlur(e: React.FocusEvent) {
		const related = (e.nativeEvent as any).relatedTarget as HTMLElement | null;
		const container = overviewRef.current;
		if (container && related && container.contains(related)) return; // still inside

		// validate required fields: both name and subtitle
		const nameValid = !!(eventName && eventName.trim().length > 0);
		const subtitleValid = !!(eventSubtitle && eventSubtitle.trim().length > 0);

		if (nameValid && subtitleValid) {
			setNameError("");
			setSubtitleError("");
			setEditName(false);
			setEventSaved(true);
			return;
		}

		// show errors and focus first invalid
		if (!nameValid) {
			setNameError("Campo obrigatório");
			nameInputRef.current?.focus();
		} else {
			setNameError("");
		}
		if (!subtitleValid) {
			setSubtitleError("Campo obrigatório");
		} else {
			setSubtitleError("");
		}
	}

	function handleBannerCancel() {
	    if (bannerPreview) {
	        URL.revokeObjectURL(bannerPreview);
	    }
	    setBannerFile(null);
	    setBannerPreview(null);
	    setUploadProgress(0);
	    setBannerSaved(false);
	}

	function handleSetLocationType(type: string) {
		setLocationType(type);
	}

	function handleSaveContinue() {
			// validate required fields
			(async () => {
				try {
					// Basic validation
					if (!eventName || !eventName.trim()) {
						setNameError('Campo obrigatório');
						nameInputRef.current?.focus();
						return;
					}
					if (!startDate) {
						setStartDateError('Campo obrigatório');
						return;
					}

					setUploading(true);

					// build ISO date strings
					const startISO = startTime ? `${startDate}T${startTime}` : `${startDate}T00:00`;
					const endISO = endDate ? (endTime ? `${endDate}T${endTime}` : `${endDate}T00:00`) : undefined;

					// Determine location string
					let locationVal = '';
					if (locationType === 'Local') locationVal = locationAddress;
					else if (locationType === 'Evento online') locationVal = onlineUrl;
					else locationVal = tbdCity && tbdUf ? `Local será anunciado: ${tbdCity} - ${tbdUf}` : 'Local será anunciado';

					// Prepare payload and request
					let res: Response | null = null;
					if (bannerFile) {
						const form = new FormData();
						form.append('banner', bannerFile, bannerFile.name || 'banner.png');
						form.append('title', eventName);
						if (eventSubtitle) form.append('subtitle', eventSubtitle);
						if (eventDescription) form.append('description', eventDescription);
						if (locationVal) form.append('location', locationVal);
						// include structured location fields so backend can persist address/online/tbd
						if (locationType === 'Local' && locationAddress) form.append('locationAddress', locationAddress);
						if (locationType === 'Evento online' && onlineUrl) form.append('onlineUrl', onlineUrl);
						if (locationType === 'Local será anunciado em breve') {
							if (tbdUf) form.append('tbdUf', tbdUf);
							if (tbdCity) form.append('tbdCity', tbdCity);
						}
						// send both organizerId and organizationId to be safe
						if (selectedOrganizer) { form.append('organizerId', selectedOrganizer); form.append('organizationId', selectedOrganizer); }
						form.append('startDate', startISO);
						if (endISO) form.append('endDate', endISO);

						if (eventId) {
							res = await fetchApi(`/api/event/${eventId}`, { method: 'PUT', body: form });
						} else {
							res = await fetchApi('/api/event', { method: 'POST', body: form });
						}
					} else {
						const body: any = {
							title: eventName,
							subtitle: eventSubtitle || undefined,
							description: eventDescription || undefined,
							location: locationVal || undefined,
							// structured location fields
							locationAddress: locationType === 'Local' ? (locationAddress || undefined) : undefined,
							onlineUrl: locationType === 'Evento online' ? (onlineUrl || undefined) : undefined,
							tbdUf: locationType === 'Local será anunciado em breve' ? (tbdUf || undefined) : undefined,
							tbdCity: locationType === 'Local será anunciado em breve' ? (tbdCity || undefined) : undefined,
							organizerId: selectedOrganizer || undefined,
							organizationId: selectedOrganizer || undefined,
							startDate: startISO,
						};
						if (endISO) body.endDate = endISO;

						if (eventId) {
							res = await fetchApi(`/api/event/${eventId}`, {
								method: 'PUT',
								headers: { 'Content-Type': 'application/json' },
								body: JSON.stringify(body),
							});
						} else {
							res = await fetchApi('/api/event', {
								method: 'POST',
								headers: { 'Content-Type': 'application/json' },
								body: JSON.stringify(body),
							});
						}
					}

					if (!res) throw new Error('Falha na requisição');
					if (!res.ok) {
						const text = await res.text().catch(() => null);
						let msg = text || `Erro ao criar evento (status ${res.status})`;
						try {
							const j = JSON.parse(text || '{}');
							if (j.error || j.message) msg = j.error || j.message;
						} catch {}
						toast?.error?.(String(msg));
						return;
					}
					const json = await res.json().catch(() => null as any);
					const createdId = json?.id || json?.eventId || json?.data?.id || null;
						if (!createdId) {
						toast?.error?.(eventId ? 'Evento atualizado mas resposta inesperada do servidor' : 'Evento criado mas resposta inesperada do servidor');
						return;
					}
						toast?.success?.(eventId ? 'Evento atualizado com sucesso' : 'Evento criado com sucesso');
						// navigate to tickets setup only for new events — play step overlay and navigate with state so CreateTickets shows the animation
						if (!eventId) {
							setFlowStep(2);
							setFlowVisible(true);
							setTimeout(() => {
								navigate(`/create-tickets?eventId=${createdId}`, { state: { stepFlow: { visible: true, step: 2 } } });
							}, 700);
						}
				} catch (e: any) {
					console.error('Erro ao criar evento', e);
					toast?.error?.(e?.message || 'Erro ao criar evento');
				} finally {
					setUploading(false);
				}
			})();
	}

	function handleHowBlur(e: React.FocusEvent) {
		const related = (e.nativeEvent as any).relatedTarget as HTMLElement | null;
		const container = howRef.current;
		if (container && related && container.contains(related)) return; // still inside
		// if there's text, mark saved
		if (howItWorksText && howItWorksText.trim().length > 0) {
			setHowItWorksSaved(true);
		} else {
			setHowItWorksSaved(false);
		}
		setEditHowItWorks(false);
	}

		return (
				<div className="min-h-screen w-full bg-white flex">
					{/* When modal is open, render a simple translucent page-cover to hide the page underneath.
					   Keep the more detailed skeleton only when the modal is not open but orgs are missing/loading. */}
					{showNoOrgSkeleton && !showCreateOrgModal && (
						<div className="fixed inset-0 z-40 flex items-center justify-center bg-white">
							<div className="w-full max-w-4xl p-6">
								<div className="mb-6">
									<div className="text-2xl font-bold text-center text-slate-900">Antes de continuar, crie o perfil da sua organização</div>
									<div className="text-sm text-center text-slate-600 mt-2">Algumas partes da página dependem de uma organização — crie uma agora para continuar.</div>
								</div>
								<div className="grid grid-cols-2 gap-6">
									<div className="p-4 bg-white rounded-xl shadow-sm">
										<OrgProfileCardSkeleton />
									</div>
									<div className="p-4 bg-white rounded-xl shadow-sm">
										<NextEventCardSkeleton />
									</div>
								</div>
							</div>
						</div>
					)}
					{showCreateOrgModal && (
						// simple translucent cover while the RequireOrganization modal is open
						<div className="fixed inset-0 z-40 flex items-start justify-center bg-black/40">
							{/* keep some top offset so modal (rendered elsewhere) sits above and looks natural */}
							<div className="w-full h-full" aria-hidden="true" />
						</div>
					)}
				<SidebarMenu />
				<div className="fixed top-0 left-[70px] h-screen z-10">
					<EventDetailsSidebar
						eventName={eventName || "Nome do evento"}
						eventDate={(startDate ? (startDate + (startTime ? ` às ${startTime}` : "")) : "Data não definida")}
						eventStatus={"Rascunho"}
						onBack={() => {}}
						onStatusChange={() => {}}
						onViewEvent={() => {}}
					/>
				</div>
				<div className="flex-1 flex flex-col ml-[350px]">
					<AppHeader />
					<div className="flex-1 flex flex-col items-start px-8">
												<div className="flex flex-col gap-6 flex-1 mt-[67px] p-8">
																	{/* Banner upload igual ao exemplo */}
																																										<div onClick={triggerFileDialog} role="button" tabIndex={0} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') triggerFileDialog(); }} className="relative w-full max-w-[800px] group cursor-pointer">
																																												<input ref={fileInputRef} type="file" accept="image/*,video/*" onChange={handleSelectFile} className="hidden" />
																																																														<div className="w-full h-[240px] rounded-2xl overflow-hidden bg-gray-50 border border-zinc-100 group-hover:border-[#0205D3] transition-colors">
																																																															{bannerPreview ? (
																																																																<img src={bannerPreview} alt="Pré-visualização do banner" className="w-full h-full object-cover" />
																																																															) : (
																																																																<div className="w-full h-full bg-gray-50" />
																																																															)}
																																																														</div>
																						{/* botão + no canto superior direito */}
																										{/* corner action: plus when unsaved, check when saved */}
																										<div className="absolute top-4 right-4">
																											{bannerSaved ? (
																												<button type="button" onClick={(e) => { e.stopPropagation(); triggerFileDialog(); }} className="rounded-full bg-white border border-indigo-200 shadow w-10 h-10 flex items-center justify-center hover:bg-indigo-50">
																													<CheckIcon size={18} />
																												</button>
																											) : (
																												<button type="button" onClick={(e) => { e.stopPropagation(); triggerFileDialog(); }} className="rounded-full bg-white border border-indigo-200 shadow w-10 h-10 flex items-center justify-center hover:bg-indigo-50">
																													{/* plus icon */}
																													<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0205D3" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
																												</button>
																											)}
																										</div>

																										{/* overlay shown on hover when already saved to allow replacing */}
																											{bannerSaved && (
																											<div className="absolute inset-0 flex items-center justify-center pointer-events-none">
																												<button type="button" onClick={(e) => { e.stopPropagation(); triggerFileDialog(); }} className="hidden group-hover:flex pointer-events-auto items-center gap-2 bg-white/90 px-4 py-2 rounded-md border border-indigo-200">
																													<Upload className="w-4 h-4 text-indigo-700" />
																													<span className="text-indigo-700 font-medium">Carregar outra imagem</span>
																												</button>
																											</div>
																										)}

																						{/* cartão central de upload quando não houver imagem selecionada */}
																										{!bannerPreview && !bannerSaved && (
																											<div className="absolute inset-0 flex items-center justify-center">
																												<button type="button" onClick={(e) => { e.stopPropagation(); triggerFileDialog(); }} className="flex flex-col items-center px-8 py-6 bg-white/90 rounded-xl border border-solid border-indigo-200 shadow-lg">
																													<Upload className="w-7 h-7 mb-2 text-indigo-700" />
																													<div className="text-indigo-700 font-semibold">Carregar fotos<br />vídeos</div>
																												</button>
																											</div>
																										)}

																						{/* se houver preview mostrar ações */}
																						{/* Preview shown; no save/cancel buttons — image considered saved on selection */}
																						{/* placeholder barras removido */}
																					</div>
																	{/* Nome do evento: collapsed header -> expanded overview card */}
																	<div className="mt-6 w-[690px] max-md:w-full">
																		{!editName ? (
																			<div role="button" tabIndex={0} onClick={() => setEditName(true)} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setEditName(true); }} className="bg-white border border-indigo-200 hover:border-[#0205D3] rounded-2xl p-6 flex items-center justify-between cursor-pointer shadow-sm transition-colors">
																				<div className="flex-1 min-w-0 pr-5">
																					<h2 className="text-[22px] font-bold text-indigo-950">{eventName && eventName.trim().length > 0 ? eventName : 'Nome do evento'}</h2>
																					<div className="text-[14px] text-gray-700">{eventSubtitle && eventSubtitle.trim().length > 0 ? eventSubtitle : 'Uma frase curta e simpática sobre seu evento.'}</div>
																				</div>
																				<button type="button" onClick={(e) => { e.stopPropagation(); setEditName(true); setEventSaved(false); }} className="rounded-full bg-white border border-indigo-200 shadow w-9 h-9 flex items-center justify-center hover:bg-indigo-50">
																					{eventSaved ? (
																						<CheckIcon size={20} />
																					) : (
																						<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0205D3" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
																					)}
																				</button>
																			</div>
																		) : (
																			<Card ref={overviewRef} onBlur={(e) => handleOverviewBlur(e)} tabIndex={-1} className="flex flex-col items-start px-6 py-7 mt-0 max-w-full bg-white rounded-2xl border border-solid border-indigo-200 hover:border-[#0205D3] w-full shadow transition-colors">
																				<div className="text-xl font-semibold mb-5">Visão geral do evento</div>
																				<div className="w-full space-y-5">
																					<div className="flex-1 min-w-0 pr-5">
																						<div className="text-base font-semibold mb-1.5">Nome do evento</div>
																						<div className="text-xs mb-5 text-gray-600">Seja claro e descritivo, com um título que diga às pessoas do que se trata seu evento.</div>
																						<Input ref={nameInputRef} value={eventName} onChange={e => { setEventName(e.target.value); if (nameError) setNameError(""); }} placeholder="Nome do evento" className={`w-full ${nameError ? 'border-red-600' : ''}`} />
																						{nameError && <div className="text-xs text-red-600 mt-1">{nameError}</div>}
																					</div>
																					<div>
																						<div className="text-base font-semibold mb-1.5">Subtítulo</div>
																						<div className="text-xs mb-5 text-gray-600">Chame a atenção das pessoas com uma breve descrição sobre seu evento. Os participantes verão isso na parte superior da página do evento. (máximo de 140 caracteres) <a href="#" className="text-indigo-700 underline">Ver exemplos</a></div>
																						<Input ref={subtitleRef as any} value={eventSubtitle} onChange={e => { setEventSubtitle(e.target.value); if (subtitleError) setSubtitleError(""); }} placeholder="Subtítulo" maxLength={140} className={`w-full ${subtitleError ? 'border-red-600' : ''}`} />
																						{subtitleError && <div className="text-xs text-red-600 mt-1">{subtitleError}</div>}
																						<div className="text-xs text-gray-500 text-right mt-1">{eventSubtitle.length} / 140</div>
																					</div>
																				</div>
																			</Card>
																		)}
																	</div>
										{/* Date and location: collapsible header when closed */}
										<div className="mt-6 w-[690px] max-md:w-full">
											{!editDate ? (
												<div role="button" tabIndex={0} onClick={() => { setEditDate(true); setDateSaved(false); }} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { setEditDate(true); setDateSaved(false); } }} className="bg-white border border-indigo-200 hover:border-[#0205D3] rounded-2xl p-6 flex items-start justify-between cursor-pointer shadow-sm transition-colors">
													<div className="flex-1 flex gap-6">
														<div className="flex-1 border-r pr-6">
															<div className="text-xl font-bold text-indigo-950 mb-2">Data e hora</div>
															<div className="text-sm text-gray-600">
																<div className="text-xs text-gray-500">Início</div>
																<div className="flex items-center gap-2 font-semibold"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#111827" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 8h18"/><path d="M7 4h10v16H7z"/></svg> <span>{formatSingleDate(startDate, startTime)}</span></div>
																<div className="mt-1 text-xs text-gray-500">Término</div>
																<div className="flex items-center gap-2 font-semibold"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#111827" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 8h18"/><path d="M7 4h10v16H7z"/></svg> <span>{endDate ? formatSingleDate(endDate, endTime) : 'Não definido'}</span></div>
															</div>
														</div>
														<div className="flex-1 pl-6">
															<div className="text-xl font-bold text-indigo-950 mb-2">Localização</div>
															<div className="text-sm text-gray-600 flex items-center gap-2"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#111827" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 6-9 11-9 11s-9-5-9-11a9 9 0 1 1 18 0z"/></svg> <span className="font-semibold">{locationType === 'Local' ? (locationAddress ? locationAddress : 'Inserir localização') : (locationType === 'Evento online' ? (onlineUrl ? onlineUrl : 'Link online') : 'Local será anunciado')}</span></div>
														</div>
													</div>
													<button type="button" onClick={(e) => { e.stopPropagation(); setEditDate(true); setDateSaved(false); }} className="rounded-full bg-white border border-indigo-200 shadow w-9 h-9 flex items-center justify-center hover:bg-indigo-50">
														{dateSaved ? <CheckIcon size={18} /> : (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0205D3" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>)}
													</button>
												</div>
											) : (
												<Card ref={dateRef} tabIndex={-1} onBlur={(e) => handleDateBlur(e)} className="flex flex-col items-start px-6 py-7 mt-0 max-w-full bg-white rounded-2xl border border-solid border-indigo-200 hover:border-[#0205D3] w-full shadow transition-colors">
													<div className="text-xl font-semibold mb-5">Data e localização</div>
													<div className="w-full space-y-5">
														<div>
															<div className="text-base mb-5" data-name="Data e hora">Data e hora</div>
															<div className="flex gap-2.5 w-full text-xs">
																<div className="flex-1">
																	<div className="text-sm font-medium mb-2">Data e hora do início</div>
																	<div className="flex gap-2">
																		<div className="flex-1">
																			<input
																				ref={startDateRef}
																				type="date"
																				value={startDate}
																				onChange={e => {
																					const v = e.target.value;
																					if (v < minStartDate()) return;
																					setStartDate(v);
																				}}
																				min={minStartDate()}
																				className={`w-full border rounded-md px-3 py-2 ${startDateError ? 'border-red-600' : ''}`}
																			/>
																			{startDateError && <div className="text-xs text-red-600 mt-1">{startDateError}</div>}
																		</div>
																		<div className="w-40">
																			<input
																				ref={startTimeRef}
																				type="time"
																				value={startTime}
																				onChange={e => {
																					const v = e.target.value;
																					const minT = minStartTimeFor(startDate);
																					if (v < minT) return;
																					setStartTime(v);
																				}}
																				min={minStartTimeFor(startDate)}
																				className={`w-full border rounded-md px-3 py-2 ${startTimeError ? 'border-red-600' : ''}`}
																			/>
																			{startTimeError && <div className="text-xs text-red-600 mt-1">{startTimeError}</div>}
																		</div>
																	</div>
																</div>
																<div className="flex-1">
																	<div className="text-sm font-medium mb-2">Data e hora do término</div>
																	<div className="flex gap-2">
																		<div className="flex-1">
																			<input
																				ref={endDateRef}
																				type="date"
																				value={endDate}
																				onChange={e => {
																					const v = e.target.value;
																					if (v && startDate && v < startDate) return;
																					setEndDate(v);
																				}}
																				min={startDate || minStartDate()}
																				className={`w-full border rounded-md px-3 py-2 ${endDateError ? 'border-red-600' : ''}`}
																			/>
																			{endDateError && <div className="text-xs text-red-600 mt-1">{endDateError}</div>}
																		</div>
																		<div className="w-40">
																			<input
																				ref={endTimeRef}
																				type="time"
																				value={endTime}
																				onChange={e => {
																					const v = e.target.value;
																					const minEnd = minEndTimeFor(endDate, startDate, startTime);
																					if (v < minEnd) return;
																					setEndTime(v);
																				}}
																				min={minEndTimeFor(endDate, startDate, startTime)}
																				className={`w-full border rounded-md px-3 py-2 ${endTimeError ? 'border-red-600' : ''}`}
																			/>
																			{endTimeError && <div className="text-xs text-red-600 mt-1">{endTimeError}</div>}
																		</div>
																	</div>
																</div>
															</div>
														</div>
														<div>
															<div className="text-base mb-3" data-name="Localização">Localização</div>
															<div className="inline-flex items-center gap-1 p-1 rounded-xl bg-slate-100" role="tablist" aria-label="Selecionar tipo de localização">
																<Button type="button" variant="ghost" onClick={() => handleSetLocationType("Local")} aria-pressed={locationType === "Local"} className={`h-8 px-3 rounded-lg font-semibold ${locationType === "Local" ? "bg-white text-indigo-950 shadow-sm" : "text-indigo-900 hover:text-indigo-950"}`}>Local</Button>
																<Button type="button" variant="ghost" onClick={() => handleSetLocationType("Evento online")} aria-pressed={locationType === "Evento online"} className={`h-8 px-3 rounded-lg font-semibold ${locationType === "Evento online" ? "bg-white text-indigo-950 shadow-sm" : "text-indigo-900 hover:text-indigo-950"}`}>Evento online</Button>
																<Button type="button" variant="ghost" onClick={() => handleSetLocationType("Local será anunciado em breve")} aria-pressed={locationType === "Local será anunciado em breve"} className={`h-8 px-3 rounded-lg font-semibold ${locationType === "Local será anunciado em breve" ? "bg-white text-indigo-950 shadow-sm" : "text-indigo-900 hover:text-indigo-950"}`}>Local será anunciado em breve</Button>
															</div>
															<div className="mt-2 text-xs text-gray-500">Tipo selecionado: {locationType}</div>
															{locationType === "Local" && (
																<div className="mt-4 space-y-3">
																	<Input ref={locationAddressRef} value={locationAddress} onChange={e => setLocationAddress(e.target.value)} placeholder="Endereço completo (rua, número, cidade, UF)" className={`w-full ${locationError ? 'border-red-600' : ''}`} />
																	{locationError && <div className="text-xs text-red-600 mt-1">{locationError}</div>}
																	{locationAddress.trim().length > 3 && (
																		<div className="w-full h-64 rounded-md overflow-hidden border border-zinc-200">
																			<iframe title="Mapa do local" width="100%" height="100%" loading="lazy" referrerPolicy="no-referrer-when-downgrade" src={`https://maps.google.com/maps?q=${encodeURIComponent(locationAddress)}&t=&z=15&ie=UTF8&iwloc=&output=embed`} />
																		</div>
																	)}
																	<div className="text-xs text-gray-600">O mapa é uma prévia baseada no endereço digitado.</div>
																</div>
															)}
															{locationType === "Evento online" && (
																<div className="mt-4 space-y-2">
																	<Input value={onlineUrl} onChange={e => setOnlineUrl(e.target.value)} placeholder="Link da transmissão (https://...)" className="w-full" />
																	{(errors.url || (onlineUrl && !/^https?:\/\//i.test(onlineUrl))) && (
																		<div className="text-xs text-red-600">{errors.url || "Informe uma URL válida começando com http:// ou https://"}</div>
																	)}
																	{onlineUrl && /^https?:\/\//i.test(onlineUrl) && !errors.url && (
																		<div className="text-xs text-gray-600">Este link será exibido aos participantes após a compra/inscrição.</div>
																	)}
																</div>
															)}
															{locationType === "Local será anunciado em breve" && (
																<div className="mt-4 space-y-3">
																	<div className="text-sm text-gray-700">O local será anunciado em breve.</div>
																	<div className="grid grid-cols-1 md:grid-cols-2 gap-3">
																		<div>
																			<Select value={tbdUf} onValueChange={setTbdUf}>
																				<SelectTrigger className="w-full"><SelectValue placeholder="Estado (UF)" /></SelectTrigger>
																				<SelectContent>{BRAZIL_UFS.map((uf) => (<SelectItem key={uf} value={uf}>{uf}</SelectItem>))}</SelectContent>
																			</Select>
																		</div>
																		<div>
																			<Input value={tbdCity} onChange={e => setTbdCity(e.target.value)} placeholder="Cidade" className="w-full" />
																		</div>
																	</div>
																	{errors.tbd && (
																		<div className="text-xs text-red-600">{errors.tbd}</div>
																	)}
																</div>
															)}
														</div>
													</div>
												</Card>
											)}
										</div>
										{/* Como funciona section - movida para ficar entre Data e Localização e Organizador */}
										<div className="mt-6 w-[690px] max-md:w-full">
											{!editHowItWorks ? (
												<div role="button" tabIndex={0} onClick={() => setEditHowItWorks(true)} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setEditHowItWorks(true); }} className="bg-white border border-indigo-200 hover:border-[#0205D3] rounded-2xl p-6 flex items-center justify-between cursor-pointer shadow-sm transition-colors">
													<div>
														<h3 className="text-xl font-bold text-indigo-950 mb-2">Como funciona</h3>
														{howItWorksSaved ? (
															<div className="text-sm text-indigo-950" dangerouslySetInnerHTML={{ __html: howItWorksText }} />
														) : (
															<div className="text-[14px] text-indigo-950">Use esta seção para fornecer mais detalhes sobre seu evento. Você pode incluir coisas que se deve saber, informações sobre o local, opções de acessibilidade - qualquer coisa que ajude as pessoas a saber o que esperar.</div>
														)}
													</div>
													<button type="button" onClick={(e) => { e.stopPropagation(); setEditHowItWorks(true); setHowItWorksSaved(false); }} className="flex-shrink-0 rounded-full bg-white border border-indigo-200 shadow w-9 h-9 flex items-center justify-center hover:bg-indigo-50 leading-none">
														{howItWorksSaved ? (
															<CheckIcon size={20} />
														) : (
															<span className="w-4 h-4 flex items-center justify-center">
																<svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="#0205D3" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
															</span>
														)}
													</button>
												</div>
											) : (
												<Card ref={howRef} tabIndex={-1} onBlur={(e) => handleHowBlur(e)} className="flex flex-col items-start px-6 py-7 mt-0 max-w-full bg-white rounded-2xl border border-solid border-indigo-200 hover:border-[#0205D3] w-full shadow transition-colors">
													<div className="text-xl text-indigo-950 font-semibold mb-2">Como funciona</div>
														<div className="w-full space-y-5">
														<div>
															<div className="text-[14px] mb-3 text-indigo-950">Use esta seção para fornecer mais detalhes sobre seu evento. Você pode incluir informações sobre o local, opções de acessibilidade, etc.</div>
															{/* simple rich text toolbar */}
															<div className="mb-2 flex items-center gap-2">
																<button type="button" onClick={() => document.execCommand('bold')} className="px-2 py-1 border rounded text-sm">B</button>
																<button type="button" onClick={() => document.execCommand('italic')} className="px-2 py-1 border rounded text-sm">I</button>
																<button type="button" onClick={() => document.execCommand('insertUnorderedList')} className="px-2 py-1 border rounded text-sm">• Lista</button>
																<button type="button" onClick={() => document.execCommand('insertOrderedList')} className="px-2 py-1 border rounded text-sm">1. Lista</button>
																<button type="button" onClick={() => {
																	const url = prompt('Informe a URL (inclua http:// ou https://)');
																	if (url) document.execCommand('createLink', false, url);
																}} className="px-2 py-1 border rounded text-sm">Link</button>
															</div>
															{/* content editable area */}
															<div ref={howRef as any} contentEditable suppressContentEditableWarning onInput={e => setHowItWorksText((e.target as HTMLDivElement).innerHTML)} className="min-h-[140px] p-4 border border-zinc-200 rounded-md prose max-w-full" />
														</div>
														</div>
													</Card>
												)}
										</div>
										{/* Organizer selection */}
										<Card className="flex flex-col items-start px-5 py-7 mt-6 max-w-full bg-white rounded-xl border border-solid border-zinc-200 hover:border-[#0205D3] w-[690px] transition-colors">
											<div className="text-xl font-semibold mb-5" data-name="Organizador do evento">Organizador do evento</div>
											<div className="w-full space-y-5">
												<div>
													<div className="text-base mb-3" data-name="Selecionar organizador">Selecionar organizador</div>
													<Select value={selectedOrganizer} onValueChange={(v) => {
														if (v === 'create') {
															setShowCreateOrgModal(true);
															return;
														}
														setSelectedOrganizer(v);
													}}>
														<SelectTrigger className="w-full h-11">
															<div className="flex items-center gap-3 w-full">
																<div className="flex items-center gap-3">
																	{/* Avatar of selected org */}
																	<div className="w-8 h-8 rounded-full overflow-hidden bg-zinc-100 flex items-center justify-center">
																		{/* render initials if no avatar */}
																		{organizers.find(o => o.id === selectedOrganizer && o.avatar) ? (
																			<img src={organizers.find(o => o.id === selectedOrganizer)!.avatar} alt="org" className="w-full h-full object-cover" />
																		) : (
																			<div className="text-xs font-semibold text-zinc-600">{(organizers.find(o => o.id === selectedOrganizer)?.name || '').split(' ').map(s => s[0]).slice(0,2).join('')}</div>
																		)}
																	</div>
																	<SelectValue placeholder="Organizador" />
																</div>
															</div>
														</SelectTrigger>
														<SelectContent className="min-w-[22rem]">
															{organizers.map((org) => (
																<SelectItem key={org.id} value={org.id} className="pl-12 h-10">
																	<div className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full overflow-hidden bg-zinc-100 flex items-center justify-center">
																		{org.avatar ? (
																			<img src={org.avatar} alt={org.name} className="w-full h-full object-cover" />
																		) : (
																			<div className="text-xs font-semibold text-zinc-600">{org.name.split(' ').map(s => s[0]).slice(0,2).join('')}</div>
																		)}
																	</div>
																	<div className="text-sm font-medium">{org.name}</div>
																</SelectItem>
															))}
															<SelectItem value="create" className="pl-8 text-indigo-700 font-semibold">+ Criar uma organização</SelectItem>
														</SelectContent>
													</Select>
													{showCreateOrgModal && (
														<RequireOrganization
																onCreated={(org) => {
																const createdObj = org?.organization || org || null;
																const createdId = createdObj?.id || createdObj?.organizationId || org?.id || org?.organizationId || null;
																const createdName = createdObj?.name || org?.name || '';
																const createdLogo = createdObj?.logoUrl || createdObj?.logo || org?.logoUrl || org?.logo || '';
																if (createdId) {
																	try { addOrganization({ id: createdId, name: createdName, logoUrl: createdLogo }); } catch(e) {}
																	setSelectedOrganizer(createdId);
																	// return the refresh() Promise so RequireOrganization can await it during the animation
																	try { return refresh(); } catch (e) { return Promise.resolve(); }
																} else {
																	try { return refresh(); } catch (e) { return Promise.resolve(); }
																}
															}}
																onClose={() => setShowCreateOrgModal(false)}
															/>
													)}
												</div>
											</div>
										</Card>
										{/* Fixed CTA button (canto inferior direito) */}
										{!showCreateOrgModal && (
											<div>
												<Button onClick={async () => {
													// play overlay then call existing save flow which will navigate when created
													try {
														setFlowStep(2);
														setFlowVisible(true);
														await new Promise(res => setTimeout(res, 600));
														handleSaveContinue();
													} finally {
														// overlay will be closed by navigation or timeout in effect below
														setTimeout(() => setFlowVisible(false), 1200);
													}
												}} aria-label="Criar e configurar ingressos" title="Criar e configurar ingressos" disabled={loadingEvent || uploading} className="fixed bottom-8 right-8 z-50 bg-indigo-700 hover:bg-indigo-800 text-white h-12 px-5 rounded-md font-semibold flex items-center gap-3 shadow-lg">
													<span className="whitespace-nowrap">{loadingEvent ? 'Carregando evento…' : (uploading ? 'Salvando…' : 'Criar e configurar ingressos')}</span>
													<svg className="ml-2 w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14"/><path d="M12 5l7 7-7 7"/></svg>
												</Button>
											</div>
										)}

										{/* spacer para dar respiro no final do scroll */}
										<div className="h-28" />
						
				</div>
			</div>
		</div>
	</div>
		);
	}

export default CreateEditEvent;
