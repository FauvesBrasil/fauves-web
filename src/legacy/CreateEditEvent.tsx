"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import SidebarMenu from "@/components/SidebarMenu";
import AppHeader from "@/components/AppHeader";
import EventDetailsSidebar from "@/components/EventDetailsSidebar";
import { OrganizerLayout } from "@/components/OrganizerLayout";
import MobileTopBar from '@/components/MobileTopBar';
import MobileDrawerMenu from '@/components/MobileDrawerMenu';
import EventMobileTopBar from '@/components/EventMobileTopBar';
import EventMobileDrawer from '@/components/EventMobileDrawer';
import { useState, useEffect, useRef, useMemo } from "react";

import { ChevronLeft, ChevronDown, ExternalLink, Upload, Calendar as CalendarIcon, MapPin, CheckIcon, Loader2 } from "lucide-react";
import { useNavigate, useLocation } from 'react-router-dom';
import { LocationAutocomplete } from '@/components/LocationAutocomplete';
import { fetchApi, resolveImageUrl } from '../lib/apiBase';
import { sanitizeRichHtml } from '@/lib/sanitizeHtml';
import StepFlowOverlay from '@/components/overlays/StepFlowOverlay';
import { toast } from '@/components/ui/sonner';
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import { Card } from "../components/ui/card";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useOrganization } from '@/context/OrganizationContext';
import { useAuth } from '@/context/AuthContext';
import RequireOrganization from '@/components/RequireOrganization';
import OrgProfileCardSkeleton from '../components/skeletons/OrgProfileCardSkeleton';
import NextEventCardSkeleton from '../components/skeletons/NextEventCardSkeleton';
import { SpotifyArtistSearch } from '@/components/SpotifyArtistSearch';
import { SpotifyArtist } from '@/lib/api/spotify';

const BRAZIL_UFS = [
	"AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA",
	"MT", "MS", "MG", "PA", "PB", "PR", "PE", "PI", "RJ", "RN",
	"RS", "RO", "RR", "SC", "SP", "SE", "TO"
] as const;

// Capitals for auto-fill when selecting UF
const UF_CAPITALS: Record<string, string> = {
	AC: 'Rio Branco', AL: 'Maceió', AP: 'Macapá', AM: 'Manaus',
	BA: 'Salvador', CE: 'Fortaleza', DF: 'Brasília', ES: 'Vitória',
	GO: 'Goiânia', MA: 'São Luís', MT: 'Cuiabá', MS: 'Campo Grande',
	MG: 'Belo Horizonte', PA: 'Belém', PB: 'João Pessoa', PR: 'Curitiba',
	PE: 'Recife', PI: 'Teresina', RJ: 'Rio de Janeiro', RN: 'Natal',
	RS: 'Porto Alegre', RO: 'Porto Velho', RR: 'Boa Vista', SC: 'Florianópolis',
	SP: 'São Paulo', SE: 'Aracaju', TO: 'Palmas'
};

// Image validation constants
const MAX_IMAGE_SIZE_MB = 2;
const MAX_IMAGE_SIZE_BYTES = MAX_IMAGE_SIZE_MB * 1024 * 1024;
const MIN_IMAGE_DIMENSION = 400;

function CreateEditEvent() {
	const navigate = useNavigate();
	const [eventStatus, setEventStatus] = useState<"Rascunho" | "Publicado">("Rascunho");
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
	const [isExternal, setIsExternal] = useState(false);
	const [externalUrl, setExternalUrl] = useState("");
	const [eventDescription, setEventDescription] = useState("");
	// organizadores locais para o select (id, name, optional avatar)
	const [organizers, setOrganizers] = useState<Array<{ id: string; name: string; avatar?: string }>>([
		{ id: 'fauves', name: 'Fauves entretenimento', avatar: undefined },
		{ id: 'other', name: 'Outro organizador', avatar: undefined },
	]);
	// Organization context (top-level hook only)
	const { orgs: ctxOrgs, loading: loadingOrgs, refresh, addOrganization } = useOrganization();
	const { user, loading: authLoading } = useAuth();
	// Linupe state
	const [lineup, setLineup] = useState<SpotifyArtist[]>([]);
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

	// Mobile menu states
	const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
	const [eventMenuOpen, setEventMenuOpen] = useState(false);

	// Ticket types for completion status
	const [ticketTypes, setTicketTypes] = useState<any[]>([]);

	// Category state
	const [categories, setCategories] = useState<any[]>([]);
	const [selectedCategory, setSelectedCategory] = useState<string>("");


	// Track original values for change detection (mobile save button)
	const [originalValues, setOriginalValues] = useState<any>({});
	const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);		// Keep local organizers list in sync with organizations from context
	useEffect(() => {
		if (Array.isArray(ctxOrgs) && ctxOrgs.length > 0) {
			setOrganizers(ctxOrgs.map(o => ({ id: o.id, name: o.name, avatar: o.logoUrl || undefined })));
			// if selectedOrganizer is not set or still the placeholder, default to first
			if (!selectedOrganizer || selectedOrganizer === 'fauves' || !ctxOrgs.find(o => o.id === selectedOrganizer)) {
				setSelectedOrganizer(ctxOrgs[0].id);
			}
		}
	}, [ctxOrgs, selectedOrganizer]);

	// Load ticket types for completion status
	useEffect(() => {
		if (!eventId) return;
		let mounted = true;
		(async () => {
			try {
				const res = await fetchApi(`/api/ticket-type/event/${eventId}`);
				if (res?.ok && mounted) {
					const data = await res.json();
					setTicketTypes(Array.isArray(data) ? data : []);
				}
			} catch (err) {
				// ignore errors, keep empty array
			}
		})();
		return () => { mounted = false; };
	}, [eventId]);

	// Fetch ALL organizations if user is an admin (to allow selecting any producer)
	useEffect(() => {
		if (!user?.isAdmin || authLoading) return;
		let mounted = true;
		(async () => {
			try {
				const res = await fetchApi('/api/admin/organizations?perPage=1000');
				if (res?.ok && mounted) {
					const data = await res.json();
					if (data.ok && Array.isArray(data.organizations)) {
						setOrganizers(data.organizations.map((o: any) => ({ 
							id: o.id, 
							name: o.name, 
							avatar: o.logoUrl || undefined 
						})));
					}
				}
			} catch (err) {
			}
		})();
		return () => { mounted = false; };
	}, [user?.isAdmin, authLoading]);

	// Fetch categories
	useEffect(() => {
		(async () => {
			try {
				const res = await fetchApi('/api/categories');
				if (res?.ok) {
					const data = await res.json();
					if (Array.isArray(data)) setCategories(data);
				}
			} catch (err) {
			}
		})();
	}, []);


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
				setHowItWorksText(ev.description || '');
				// mark high-level saved flags when editing an existing event
				if (ev.name || ev.title || ev.subtitle || ev.description) {
					setEventSaved(true);
				}
				if (ev.startDate) {
					const d = new Date(ev.startDate);
					setStartDate(d.toISOString().slice(0, 10));
					setStartTime(d.toTimeString().slice(0, 5));
				}
				// if start date is present, mark date section as saved
				if (ev.startDate) {
					setDateSaved(true);
				}
				if (ev.endDate) {
					const d2 = new Date(ev.endDate);
					setEndDate(d2.toISOString().slice(0, 10));
					setEndTime(d2.toTimeString().slice(0, 5));
				}
				// Smarter location detection
				const rawLoc = ev.location || (ev as any).locationDetails?.type || '';
				let derivedType = 'Local';

				if (rawLoc && /^https?:\/\//i.test(rawLoc)) {
					derivedType = 'Evento online';
					setOnlineUrl(ev.onlineUrl || (ev as any).locationDetails?.url || rawLoc);
				} else if (rawLoc && rawLoc.toLowerCase().includes('anunciado')) {
					derivedType = 'Local será anunciado em breve';
					setTbdUf(ev.locationUf || (ev as any).locationDetails?.uf || '');
					setTbdCity(ev.locationCity || (ev as any).locationDetails?.city || '');
				} else {
					derivedType = 'Local';
					// usage: if rawLoc is not one of the special strings 'Local', 'Evento online' etc, assume it is the address
					const isSpecialString = ['Local', 'Evento online', 'Local será anunciado', 'Local será anunciado em breve'].includes(rawLoc);
					const content = isSpecialString ? (ev.locationAddress || (ev as any).locationDetails?.address || '') : rawLoc;
					setLocationAddress(content);
				}
				setLocationType(derivedType);
				// image
				if (ev.image) {
					setBannerPreview(resolveImageUrl(ev.image));
					setBannerSaved(true);
				}
				// set event status from backend (published/draft)
				setEventStatus(ev.isPublished ? 'Publicado' : 'Rascunho');
				// organizer
				const orgId = ev.organizerId || ev.organizationId || null;
				if (orgId) setSelectedOrganizer(orgId);

				// category
				if (ev.categoryId) setSelectedCategory(ev.categoryId);


				// external info
				setIsExternal(!!ev.isExternal);
				setExternalUrl(ev.externalUrl || '');

				// lineup
				if (ev.artists && Array.isArray(ev.artists)) {
					const artists = ev.artists.map((ea: any) => ({
						id: ea.artist?.spotifyId || ea.artistId,
						name: ea.artist?.name || 'Artista',
						genres: ea.artist?.genres || [],
						imageUrl: ea.artist?.imageUrl || null,
						popularity: ea.artist?.popularity || 0,
						spotifyUrl: ea.artist?.spotifyUrl || null
					}));
					setLineup(artists);
				}

				// if the event contains a how-it-works text or similar, mark that section saved
				if (ev.howItWorks || ev.howItWorksText || ev.how || ev.description) {
					setHowItWorksText(ev.howItWorks || ev.howItWorksText || ev.how || ev.description || '');
					setHowItWorksSaved(true);
				}

				// Store original values for change detection - AFTER all derivations complete
				// This ensures we capture the derived locationType instead of raw value
				// IMPORTANT: Use backend data directly, not React state (which hasn't updated yet)
				const original = {
					name: ev.name || ev.title || '',
					subtitle: ev.subtitle || ev.subTitle || '',
					description: ev.description || '',
					startDate: ev.startDate ? new Date(ev.startDate).toISOString().slice(0, 10) : '',
					startTime: ev.startDate ? new Date(ev.startDate).toTimeString().slice(0, 5) : '',
					endDate: ev.endDate ? new Date(ev.endDate).toISOString().slice(0, 10) : '',
					endTime: ev.endDate ? new Date(ev.endDate).toTimeString().slice(0, 5) : '',
					locationType: derivedType, // Use derived value from logic above
					locationAddress: derivedType === 'Local' ? (['Local', 'Evento online', 'Local será anunciado', 'Local será anunciado em breve'].includes(rawLoc) ? (ev.locationAddress || (ev as any).locationDetails?.address || '') : rawLoc) : '',
					onlineUrl: derivedType === 'Evento online' ? (ev.onlineUrl || (ev as any).locationDetails?.url || rawLoc) : '',
					tbdUf: ev.locationUf || (ev as any).locationDetails?.uf || '',
					tbdCity: ev.locationCity || (ev as any).locationDetails?.city || '',
					selectedOrganizer: orgId || '',
					selectedCategory: ev.categoryId || '',
					isExternal: !!ev.isExternal,
					externalUrl: ev.externalUrl || ''
				};

				setOriginalValues(original);
			} catch (err) {
			} finally {
				if (mounted) setLoadingEvent(false);
			}
		})();

		return () => { mounted = false; };
	}, [eventId]);

	// Detect changes for mobile save button
	useEffect(() => {
		// Only check when editing existing event AND event is fully loaded
		// Remove the originalValues.name check as it may prevent initial detection
		if (!eventId || loadingEvent) return;

		const hasChanges =
			eventName !== originalValues.name ||
			eventSubtitle !== originalValues.subtitle ||
			eventDescription !== originalValues.description ||
			startDate !== originalValues.startDate ||
			startTime !== originalValues.startTime ||
			endDate !== originalValues.endDate ||
			endTime !== originalValues.endTime ||
			locationType !== originalValues.locationType ||
			locationAddress !== originalValues.locationAddress ||
			onlineUrl !== originalValues.onlineUrl ||
			tbdUf !== originalValues.tbdUf ||
			tbdCity !== originalValues.tbdCity ||
			selectedOrganizer !== originalValues.selectedOrganizer ||
			selectedCategory !== originalValues.selectedCategory ||
			isExternal !== originalValues.isExternal ||
			externalUrl !== originalValues.externalUrl;


		setHasUnsavedChanges(hasChanges);
	}, [eventId, originalValues, eventName, eventSubtitle, eventDescription, startDate, startTime, endDate, endTime, locationType, locationAddress, onlineUrl, tbdUf, tbdCity, selectedOrganizer, selectedCategory, loadingEvent]);


	const [errors, setErrors] = useState({ url: "", tbd: "" });
	const [backendError, setBackendError] = useState("");
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
	const [bannerError, setBannerError] = useState("");
	const [nameError, setNameError] = useState("");
	const [subtitleError, setSubtitleError] = useState("");

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

	// Initialize contentEditable with saved description when editing
	useEffect(() => {
		if (howRef.current && howItWorksText && !howRef.current.innerHTML) {
			howRef.current.innerHTML = sanitizeRichHtml(howItWorksText);
		}
	}, [howItWorksText]);

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
				modalAutoOpenedRef.current = true;
				setShowCreateOrgModal(true);
			}
			// Reset the one-shot flag if orgs appear (so it can open again in future flows)
			if (hasOrgs) {
				modalAutoOpenedRef.current = false;
			}
		} catch (e) {
		}
	}, [authLoading, loadingOrgs, user, ctxOrgs]);

	// show a lightweight skeleton overlay while orgs are loading or empty to avoid rendering broken UI
	const showNoOrgSkeleton = (() => {
		if (authLoading || loadingOrgs) return true; // still loading
		if (!user || !user.id) return false; // not authenticated, let auth gate handle it elsewhere
		const hasOrgs = Array.isArray(ctxOrgs) && ctxOrgs.length > 0;
		return !hasOrgs;
	})();

	// Auto-fill capital city when UF is selected or changed
	useEffect(() => {
		if (tbdUf && UF_CAPITALS[tbdUf]) {
			setTbdCity(UF_CAPITALS[tbdUf]);
		}
	}, [tbdUf]);

	// (no duplicate hook calls) organization helpers are above

	// helpers for date/time constraints
	function toISODate(d: Date) {
		return d.toISOString().slice(0, 10);
	}

	function toTimeHHMM(d: Date) {
		return d.toTimeString().slice(0, 5);
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

	// Generate time options in 30-minute intervals
	const timeOptions = useMemo(() => {
		const options = [];
		for (let i = 0; i < 24 * 60; i += 30) {
			const h = Math.floor(i / 60);
			const m = i % 60;
			const hh = h.toString().padStart(2, '0');
			const mm = m.toString().padStart(2, '0');
			options.push(`${hh}:${mm}`);
		}
		return options;
	}, []);

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

		// If End Date is essentially the same as Start Date (string comparison)
		if (dateStr === startD) {
			const s = new Date(startD + `T${startT}`);
			const minEnd = addMinutes(s, 30);
			return toTimeHHMM(minEnd);
		}

		// Different days? No time restriction
		return '00:00'; // Allow full range if date is different
	}

	function handleDateBlur(e: React.FocusEvent) {
		const related = (e.nativeEvent as any).relatedTarget as HTMLElement | null;
		const container = dateRef.current;

		// Check if still inside the container
		if (container && related && container.contains(related)) return;

		// Check if the relatedTarget is a portaled select element (Radix UI)
		if (related?.closest('[data-radix-select-viewport]') ||
			related?.closest('[data-radix-select-content]') ||
			related?.closest('[role="listbox"]') ||
			related?.closest('[data-state="open"]')) {
			return; // Don't close if interacting with dropdown
		}

		// Small delay to allow click events to complete on portaled elements
		setTimeout(() => {
			// Check if any select is currently open
			const openSelect = document.querySelector('[data-radix-select-content][data-state="open"]');
			if (openSelect) return;


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
		}, 50); // Small delay to allow portal interactions
	}

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

		// Clear previous error
		setBannerError("");

		// Validate file type
		const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
		if (!validTypes.includes(f.type)) {
			setBannerError('Formato inválido. Use JPEG, PNG ou WebP.');
			e.target.value = '';
			return;
		}

		// Validate file size
		if (f.size > MAX_IMAGE_SIZE_BYTES) {
			setBannerError(`Imagem muito grande. Máximo ${MAX_IMAGE_SIZE_MB}MB.`);
			e.target.value = '';
			return;
		}

		// Validate dimensions (1:1 aspect ratio, minimum 400x400)
		const img = new Image();
		const url = URL.createObjectURL(f);
		img.onload = () => {
			const width = img.naturalWidth;
			const height = img.naturalHeight;

			// Check minimum dimensions
			if (width < MIN_IMAGE_DIMENSION || height < MIN_IMAGE_DIMENSION) {
				setBannerError(`Imagem muito pequena. Mínimo ${MIN_IMAGE_DIMENSION}x${MIN_IMAGE_DIMENSION}px.`);
				URL.revokeObjectURL(url);
				if (fileInputRef.current) fileInputRef.current.value = '';
				return;
			}

			// Check aspect ratio (1:1 with 5% tolerance)
			const ratio = width / height;
			if (ratio < 0.95 || ratio > 1.05) {
				setBannerError('A imagem deve ser quadrada (proporção 1:1).');
				URL.revokeObjectURL(url);
				if (fileInputRef.current) fileInputRef.current.value = '';
				return;
			}

			// All validations passed
			if (bannerPreview) URL.revokeObjectURL(bannerPreview);
			setBannerFile(f);
			setBannerPreview(url);
			setBannerSaved(true);
			setUploadProgress(100);
		};
		img.onerror = () => {
			setBannerError('Não foi possível carregar a imagem.');
			URL.revokeObjectURL(url);
		};
		img.src = url;
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
				// Clear previous errors
				setBannerError("");
				setNameError("");
				setStartDateError("");
				setStartTimeError("");
				setEndDateError("");
				setLocationError("");

				// Banner required (except when editing and already has image)
				if (!bannerFile && !bannerPreview) {
					setBannerError('Imagem do evento é obrigatória');
					toast?.error?.('Selecione uma imagem para o evento');
					return;
				}

				// Name required
				if (!eventName || !eventName.trim()) {
					setNameError('Campo obrigatório');
					nameInputRef.current?.focus();
					return;
				}

				// Start date and time required
				if (!startDate) {
					setStartDateError('Campo obrigatório');
					return;
				}
				if (!startTime) {
					setStartTimeError('Hora de início obrigatória');
					return;
				}

				// End date and time required
				if (!endDate) {
					setEndDateError('Data de término obrigatória');
					return;
				}

				// Location validation
				if (locationType === 'Local' || locationType === 'Local será anunciado') {
					if (!tbdUf) {
						setLocationError('Estado é obrigatório');
						return;
					}
					if (!tbdCity) {
						setLocationError('Cidade é obrigatória');
						return;
					}
				} else if (locationType === 'Evento online') {
					if (!onlineUrl || !/^https?:\/\//i.test(onlineUrl)) {
						setLocationError('Link do evento é obrigatório');
						return;
					}
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
					if (howItWorksText) form.append('description', howItWorksText);
					if (locationVal) form.append('location', locationVal);
					// Add locationUf and locationCity for filtering
					if (tbdUf) form.append('locationUf', tbdUf);
					if (tbdCity) form.append('locationCity', tbdCity);
					// send both organizerId and organizationId to be safe
					if (selectedOrganizer) { form.append('organizerId', selectedOrganizer); form.append('organizationId', selectedOrganizer); }
					if (selectedCategory) form.append('categoryId', selectedCategory);
					if (lineup && lineup.length > 0) { form.append('lineup', JSON.stringify(lineup)); }
					form.append('startDate', startISO);

					if (endISO) form.append('endDate', endISO);
					form.append('isExternal', isExternal.toString());
					if (externalUrl) form.append('externalUrl', externalUrl);

					if (eventId) {
						res = await fetchApi(`/api/event/${eventId}`, { method: 'PUT', body: form });
					} else {
						res = await fetchApi('/api/event', { method: 'POST', body: form });
					}
				} else {
					const body: any = {
						title: eventName,
						subtitle: eventSubtitle || undefined,
						description: howItWorksText || undefined,
						location: locationVal || undefined,
						locationUf: tbdUf || undefined,
						locationCity: tbdCity || undefined,
						organizerId: selectedOrganizer || undefined,
						organizationId: selectedOrganizer || undefined,
						categoryId: selectedCategory || undefined,
						startDate: startISO,
						lineup: lineup && lineup.length ? lineup : undefined,
						isExternal,
						externalUrl: externalUrl || undefined
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
					} catch { }
					setBackendError(String(msg));
					toast?.error?.(String(msg));
					return;
				}
				// If response is OK and we're updating (PUT), consider it a success even if the server
				// doesn't return the id in the body. For creation (POST) we still expect an id to navigate.
				if (eventId) {
					toast?.success?.('Evento atualizado com sucesso');
					// Update originalValues to match current state (prevents "unsaved changes" after save)
					setOriginalValues({
						name: eventName,
						subtitle: eventSubtitle,
						description: eventDescription,
						startDate,
						startTime,
						endDate,
						endTime,
						locationType,
						locationAddress,
						onlineUrl,
						tbdUf,
						tbdCity,
						selectedOrganizer
					});
					setHasUnsavedChanges(false);
					// no navigation on update; return early
					return;
				}
				const json = await res.json().catch(() => null as any);
				const createdId = json?.id || json?.eventId || json?.data?.id || null;
				if (!createdId) {
					setBackendError('Evento criado mas resposta inesperada do servidor');
					toast?.error?.('Evento criado mas resposta inesperada do servidor');
					return;
				}
				setBackendError("");
				toast?.success?.('Evento criado com sucesso');
				// navigate to tickets setup only for new events — play step overlay and navigate with state so CreateTickets shows the animation
				setFlowStep(2);
				setFlowVisible(true);
				setTimeout(() => {
					navigate(`/create-tickets?eventId=${createdId}`, { state: { stepFlow: { visible: true, step: 2 } } });
				}, 700);
			} catch (e: any) {
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
		<div className="min-h-screen w-full bg-white dark:bg-[#0b0b0b] flex">
			{/* Mobile Main Menu */}
			<MobileTopBar onMenuOpen={() => setMobileMenuOpen(true)} />
			<MobileDrawerMenu
				isOpen={mobileMenuOpen}
				onClose={() => setMobileMenuOpen(false)}
				currentPath={location.pathname}
				organizations={ctxOrgs}
				selectedOrg={ctxOrgs?.find(o => o.id === selectedOrganizer)}
				selectOrganization={(orgId) => setSelectedOrganizer(orgId)}
				user={user}
			/>

			{/* Mobile Event Menu */}
			<EventMobileTopBar
				title={eventId ? "Editar evento" : "Criar evento"}
				onMenuOpen={() => setEventMenuOpen(true)}
			/>
			<EventMobileDrawer
				isOpen={eventMenuOpen}
				onClose={() => setEventMenuOpen(false)}
				currentPath={location.pathname}
				eventId={eventId || ''}
				eventName={eventName || 'Novo evento'}
				eventDate={startDate ? startDate : undefined}
				eventStatus={eventStatus}
				hasTickets={ticketTypes.length > 0}
				isPublished={eventStatus === 'Publicado'}
			/>

			{/* When modal is open, render a simple translucent page-cover to hide the page underneath.
				   Keep the more detailed skeleton only when the modal is not open but orgs are missing/loading. */}
			{showNoOrgSkeleton && !showCreateOrgModal && (
				<div className="fixed inset-0 z-40 flex items-center justify-center bg-white dark:bg-[#0b0b0b]">
					<div className="w-full max-w-4xl p-6">
						<div className="mb-6">
							<div className="text-2xl font-bold text-center text-slate-900">Antes de continuar, crie o perfil do seu calendário</div>
							<div className="text-sm text-center text-slate-600 mt-2">Algumas partes da página dependem de um calendário — crie um agora para continuar.</div>
						</div>
						<div className="grid grid-cols-2 gap-6">
							<div className="p-4 bg-white dark:bg-[#242424] rounded-xl shadow-sm">
								<OrgProfileCardSkeleton />
							</div>
							<div className="p-4 bg-white dark:bg-[#242424] rounded-xl shadow-sm">
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
			<SidebarMenu className="hidden lg:block" />
			<div className="hidden lg:block">
				<EventDetailsSidebar
					eventName={eventName || "Nome do evento"}
					eventDate={(startDate ? (startDate + (startTime ? ` às ${startTime}` : "")) : "Data não definida")}
					eventStatus={eventStatus}
					onBack={() => { }}
					onStatusChange={() => { }}
					onViewEvent={() => { }}
					fixed
					fixedLeft={70}
					fixedWidth={300}
					fixedTop={0}
				/>
			</div>
			<div className="flex-1 flex flex-col lg:ml-[350px] max-sm:ml-0">
				<AppHeader className="relative max-sm:hidden" />
				<OrganizerLayout>
					<div className="flex-1 flex flex-col items-center max-sm:items-stretch px-8 max-sm:px-4 max-sm:pt-[118px]">
						<div className="flex flex-col gap-6 flex-1 w-full max-w-[690px] max-sm:max-w-full mt-[67px] max-sm:mt-2 p-8 max-sm:p-0">
							{/* Banner upload igual ao exemplo */}
							<div onClick={triggerFileDialog} role="button" tabIndex={0} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') triggerFileDialog(); }} className="relative w-full max-w-[260px] max-sm:max-w-full mx-auto max-sm:mx-0 group cursor-pointer">
								<input ref={fileInputRef} type="file" accept="image/*,video/*" onChange={handleSelectFile} className="hidden" />
								<div className="w-full aspect-square rounded-2xl overflow-hidden bg-gray-50 dark:bg-[#1F1F1F] border border-zinc-100 dark:border-[#1F1F1F] group-hover:border-[#0205D3] transition-colors">
									{bannerPreview ? (
										<img src={bannerPreview} alt="Pré-visualização do banner" className="w-full h-full object-cover" />
									) : (
										<div className="w-full h-full bg-gray-50 dark:bg-[#1F1F1F]" />
									)}
								</div>
								{/* botão + no canto superior direito */}
								{/* corner action: plus when unsaved, check when saved */}
								<div className="absolute top-4 right-4">
									{bannerSaved ? (
										<button type="button" onClick={(e) => { e.stopPropagation(); triggerFileDialog(); }} className="rounded-full bg-white dark:bg-[#242424] border border-indigo-200 dark:border-[#1F1F1F] text-indigo-700 dark:text-white shadow w-10 h-10 flex items-center justify-center hover:bg-indigo-50 dark:hover:bg-[#111827]">
											<CheckIcon size={18} />
										</button>
									) : (
										<button type="button" onClick={(e) => { e.stopPropagation(); triggerFileDialog(); }} className="rounded-full bg-white dark:bg-[#242424] border border-indigo-200 dark:border-[#1F1F1F] text-indigo-700 dark:text-white shadow w-10 h-10 flex items-center justify-center hover:bg-indigo-50 dark:hover:bg-[#111827]">
											{/* plus icon */}
											<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
										</button>
									)}
								</div>

								{/* overlay shown on hover when already saved to allow replacing */}
								{bannerSaved && (
									<div className="absolute inset-0 flex items-center justify-center pointer-events-none">
										<button type="button" onClick={(e) => { e.stopPropagation(); triggerFileDialog(); }} className="hidden group-hover:flex pointer-events-auto items-center gap-2 bg-white/90 dark:bg-[#242424] px-4 py-2 rounded-md border border-indigo-200 dark:border-[#1F1F1F]">
											<Upload className="w-4 h-4 text-indigo-700 dark:text-white" />
											<span className="text-indigo-700 dark:text-white font-medium">Carregar outra imagem</span>
										</button>
									</div>
								)}

								{/* cartão central de upload quando não houver imagem selecionada */}
								{!bannerPreview && !bannerSaved && (
									<div className="absolute inset-0 flex items-center justify-center">
										<button type="button" onClick={(e) => { e.stopPropagation(); triggerFileDialog(); }} className="flex flex-col items-center px-8 py-6 bg-white/90 dark:bg-[#242424] rounded-xl border border-solid border-indigo-200 dark:border-[#1F1F1F] shadow-lg">
											<Upload className="w-7 h-7 mb-2 text-indigo-700 dark:text-white" />
											<div className="text-indigo-700 dark:text-white font-semibold">Carregar imagem<br />do evento</div>
										</button>
									</div>
								)}

								{/* se houver preview mostrar ações */}
								{/* Preview shown; no save/cancel buttons — image considered saved on selection */}
								{/* placeholder barras removido */}
							</div>
							{/* Banner error message */}
							{bannerError && (
								<div className="text-red-500 text-sm mt-2 text-center flex items-center justify-center gap-1">
									<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
									</svg>
									<span>{bannerError}</span>
								</div>
							)}
							{/* Hint text: imagem quadrada, max 2MB */}
							<p className="text-xs text-gray-500 dark:text-gray-400 text-center mt-2">
								Imagem quadrada (1:1) • Máx. {MAX_IMAGE_SIZE_MB}MB • JPEG, PNG ou WebP
							</p>
							{/* Nome do evento: collapsed header -> expanded overview card */}
							<div className="mt-6 max-sm:mt-4 w-full">
								{!editName ? (
									<div role="button" tabIndex={0} onClick={() => setEditName(true)} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setEditName(true); }} className="bg-white dark:bg-[#242424] border border-indigo-200 dark:border-[#1F1F1F] hover:border-[#0205D3] rounded-2xl p-6 flex items-center justify-between cursor-pointer shadow-sm transition-colors">
										<div className="flex-1 min-w-0 pr-5">
											<h2 className="text-[22px] font-bold text-indigo-950 dark:text-white">{eventName && eventName.trim().length > 0 ? eventName : 'Nome do evento'}</h2>
											<div className="text-[14px] text-gray-700 dark:text-slate-300">{eventSubtitle && eventSubtitle.trim().length > 0 ? eventSubtitle : 'Uma frase curta e simpática sobre seu evento.'}</div>
										</div>
										<button type="button" onClick={(e) => { e.stopPropagation(); setEditName(true); setEventSaved(false); }} className="rounded-full bg-white dark:bg-[#242424] border border-indigo-200 dark:border-[#1F1F1F] text-indigo-700 dark:text-white shadow w-9 h-9 flex items-center justify-center hover:bg-indigo-50 dark:hover:bg-[#111827]">
											{eventSaved ? (
												<CheckIcon size={20} />
											) : (
												<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
											)}
										</button>
									</div>
								) : (
									<Card ref={overviewRef} onBlur={(e) => handleOverviewBlur(e)} tabIndex={-1} className="flex flex-col items-start px-6 py-7 mt-0 max-w-full bg-white dark:bg-[#242424] rounded-2xl border border-solid border-indigo-200 dark:border-[#1F1F1F] hover:border-[#0205D3] w-full shadow transition-colors">
										<div className="text-xl font-semibold mb-5">Visão geral do evento</div>
										<div className="w-full space-y-5">
											<div className="flex-1 min-w-0 pr-5">
												<div className="text-base font-semibold mb-1.5">Nome do evento</div>
												<div className="text-xs mb-5 text-gray-600 dark:text-white">Seja claro e descritivo, com um título que diga às pessoas do que se trata seu evento.</div>
												<Input ref={nameInputRef} value={eventName} onChange={e => { setEventName(e.target.value); if (nameError) setNameError(""); }} placeholder="Nome do evento" className={`w-full ${nameError ? 'border-red-600' : ''} dark:bg-[#121212] dark:border-transparent dark:placeholder:text-slate-400 dark:text-white`} />
												{nameError && <div className="text-xs text-red-600 mt-1">{nameError}</div>}
											</div>
											<div>
												<div className="text-base font-semibold mb-1.5">Subtítulo</div>
												<div className="text-xs mb-5 text-gray-600 dark:text-white">Chame a atenção das pessoas com uma breve descrição sobre seu evento. Os participantes verão isso na parte superior da página do evento. (máximo de 140 caracteres) <a href="#" className="text-indigo-700 dark:text-white underline">Ver exemplos</a></div>
												<Input ref={subtitleRef as any} value={eventSubtitle} onChange={e => { setEventSubtitle(e.target.value); if (subtitleError) setSubtitleError(""); }} placeholder="Subtítulo" maxLength={140} className={`w-full ${subtitleError ? 'border-red-600' : ''} dark:bg-[#121212] dark:border-transparent dark:placeholder:text-slate-400 dark:text-white`} />
												{subtitleError && <div className="text-xs text-red-600 mt-1">{subtitleError}</div>}
												<div className="text-xs text-gray-500 text-right mt-1">{eventSubtitle.length} / 140</div>
											</div>
											<div>
												<div className="text-base font-semibold mb-1.5">Categoria</div>
												<div className="text-xs mb-5 text-gray-600 dark:text-white">Selecione a categoria que melhor descreve seu evento.</div>
												<Select value={selectedCategory} onValueChange={setSelectedCategory}>
													<SelectTrigger className="w-full h-11 dark:bg-[#121212] dark:border-transparent dark:text-white">
														<SelectValue placeholder="Selecionar categoria" />
													</SelectTrigger>
													<SelectContent className="bg-white dark:bg-[#242424] dark:border-[#1F1F1F]">
														{categories.map((cat) => (
															<SelectItem key={cat.id} value={cat.id} className="dark:text-white">
																{cat.name}
															</SelectItem>
														))}
													</SelectContent>
												</Select>
											</div>
										</div>
									</Card>

								)}
							</div>

							{/* Lineup Section */}
							<div className="mt-6 w-full">
								<div className="bg-white dark:bg-[#242424] border border-indigo-200 dark:border-[#1F1F1F] rounded-2xl p-6 shadow-sm">
									<div className="text-xl font-semibold mb-5 text-indigo-950 dark:text-white">Artistas (Line-up)</div>
									<div className="text-sm text-gray-600 dark:text-slate-300 mb-4">Adicione os artistas que irão se apresentar no evento.</div>
									<SpotifyArtistSearch
										selectedArtists={lineup}
										onArtistsChange={setLineup}
									/>
								</div>
							</div>
							{/* Date and location: collapsible header when closed */}
							<div className="mt-6 max-sm:mt-4 w-full">
								{!editDate ? (
									<div role="button" tabIndex={0} onClick={() => { setEditDate(true); setDateSaved(false); }} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { setEditDate(true); setDateSaved(false); } }} className="bg-white dark:bg-[#242424] border border-indigo-200 dark:border-[#1F1F1F] hover:border-[#0205D3] rounded-2xl p-6 flex items-start justify-between cursor-pointer shadow-sm transition-colors">
										<div className="flex-1 flex gap-6 max-sm:flex-col max-sm:gap-4">
											<div className="flex-1 border-r pr-6 max-sm:border-r-0 max-sm:pr-0 max-sm:border-b max-sm:pb-4">
												<div className="text-xl font-bold text-indigo-950 dark:text-white mb-2">Data e hora</div>
												<div className="text-sm text-gray-600 dark:text-white">
													<div className="text-xs text-gray-500 dark:text-white">Início</div>
													<div className="flex items-center gap-2 font-semibold"><CalendarIcon className="w-4 h-4 text-slate-700 dark:text-white" /> <span className="dark:text-white">{formatSingleDate(startDate, startTime)}</span></div>
													<div className="mt-1 text-xs text-gray-500 dark:text-white">Término</div>
													<div className="flex items-center gap-2 font-semibold"><CalendarIcon className="w-4 h-4 text-slate-700 dark:text-white" /> <span className="dark:text-white">{endDate ? formatSingleDate(endDate, endTime) : 'Não definido'}</span></div>
												</div>
											</div>
											<div className="flex-1 pl-6 max-sm:pl-0">
												<div className="text-xl font-bold text-indigo-950 dark:text-white mb-2">Localização</div>
												<div className="text-sm text-gray-600 flex items-center gap-2"><MapPin className="w-4 h-4 text-slate-700 dark:text-white" /> <span className="font-semibold dark:text-white">{locationType === 'Local' ? (locationAddress ? locationAddress : 'Inserir localização') : (locationType === 'Evento online' ? (onlineUrl ? onlineUrl : 'Link online') : 'Local será anunciado')}</span></div>
											</div>
										</div>
										<button type="button" onClick={(e) => { e.stopPropagation(); setEditDate(true); setDateSaved(false); }} className="rounded-full bg-white dark:bg-[#242424] border border-indigo-200 dark:border-[#1F1F1F] text-indigo-700 dark:text-white shadow w-9 h-9 flex items-center justify-center hover:bg-indigo-50 dark:hover:bg-[#111827]">
											{dateSaved ? <CheckIcon size={18} /> : (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>)}
										</button>
									</div>
								) : (
									<Card ref={dateRef} tabIndex={-1} onBlur={(e) => handleDateBlur(e)} className="flex flex-col items-start px-6 py-7 mt-0 max-w-full bg-white dark:bg-[#242424] rounded-2xl border border-solid border-indigo-200 dark:border-[#1F1F1F] hover:border-[#0205D3] w-full shadow transition-colors">
										<div className="text-xl font-semibold mb-5">Data e localização</div>
										<div className="w-full space-y-5">
											<div>
												<div className="text-base mb-5" data-name="Data e hora">Data e hora</div>
												<div className="space-y-3 max-sm:space-y-4">
													<div className="flex flex-col gap-1">
														<div className="text-xs font-semibold text-gray-700 dark:text-white mb-1">Início do evento</div>
														<div className="flex gap-2 flex-1">
															<div className="flex-1">
																<Popover>
																	<PopoverTrigger asChild>
																		<Button
																			variant={"outline"}
																			className={cn(
																				"w-full justify-start text-left font-normal h-10 px-3 bg-white dark:bg-[#121212] border-zinc-200 dark:border-transparent dark:text-white dark:hover:bg-[#1a1a1a]",
																				!startDate && "text-muted-foreground",
																				startDateError && "border-red-600"
																			)}
																		>
																			<CalendarIcon className="mr-2 h-4 w-4" />
																			{startDate ? format(new Date(startDate + 'T00:00:00'), "P", { locale: ptBR }) : <span>Data de início</span>}
																		</Button>
																	</PopoverTrigger>
																	<PopoverContent className="w-auto p-0" align="start">
																		<Calendar
																			mode="single"
																			selected={startDate ? new Date(startDate + 'T00:00:00') : undefined}
																			onSelect={(date) => {
																				if (!date) return;
																				const iso = format(date, 'yyyy-MM-dd');
																				if (iso < minStartDate()) return;
																				setStartDate(iso);
																			}}
																			disabled={(date) => date < new Date(minStartDate())}
																			locale={ptBR}
																			initialFocus
																		/>
																	</PopoverContent>
																</Popover>
																{startDateError && <div className="text-xs text-red-600 mt-1">{startDateError}</div>}
															</div>
															<div className="flex-1">
																<Select
																	value={startTime}
																	onValueChange={(v) => {
																		const minT = minStartTimeFor(startDate);
																		if (v < minT) return;
																		setStartTime(v);
																	}}
																>
																	<SelectTrigger className={`w-full h-10 bg-white dark:bg-[#121212] border-zinc-200 dark:border-transparent dark:text-white ${startTimeError ? 'border-red-600' : ''}`}>
																		<SelectValue placeholder="Hora de início" />
																	</SelectTrigger>
																	<SelectContent className="max-h-60">
																		{timeOptions.map((time) => (
																			<SelectItem key={time} value={time} disabled={time < minStartTimeFor(startDate)}>
																				{time}
																			</SelectItem>
																		))}
																	</SelectContent>
																</Select>
																{startTimeError && <div className="text-xs text-red-600 mt-1">{startTimeError}</div>}
															</div>
														</div>
													</div>
													{/* Término */}
													<div className="flex flex-col gap-1">
														<div className="text-xs font-semibold text-gray-700 dark:text-white mb-1">Término do evento</div>
														<div className="flex gap-2 flex-1">
															<div className="flex-1">
																<Popover>
																	<PopoverTrigger asChild>
																		<Button
																			variant={"outline"}
																			className={cn(
																				"w-full justify-start text-left font-normal h-10 px-3 bg-white dark:bg-[#121212] border-zinc-200 dark:border-transparent dark:text-white dark:hover:bg-[#1a1a1a]",
																				!endDate && "text-muted-foreground",
																				endDateError && "border-red-600"
																			)}
																		>
																			<CalendarIcon className="mr-2 h-4 w-4" />
																			{endDate ? format(new Date(endDate + 'T00:00:00'), "P", { locale: ptBR }) : <span>Data de término</span>}
																		</Button>
																	</PopoverTrigger>
																	<PopoverContent className="w-auto p-0" align="start">
																		<Calendar
																			mode="single"
																			selected={endDate ? new Date(endDate + 'T00:00:00') : undefined}
																			onSelect={(date) => {
																				if (!date) return;
																				const iso = format(date, 'yyyy-MM-dd');
																				if (iso < (startDate || minStartDate())) return;
																				setEndDate(iso);
																			}}
																			disabled={(date) => date < new Date(startDate || minStartDate())}
																			locale={ptBR}
																			initialFocus
																		/>
																	</PopoverContent>
																</Popover>
																{endDateError && <div className="text-xs text-red-600 mt-1">{endDateError}</div>}
															</div>
															<div className="flex-1">
																<Select
																	value={endTime}
																	onValueChange={(v) => {
																		const minEnd = minEndTimeFor(endDate, startDate, startTime);
																		if (v < minEnd) return;
																		setEndTime(v);
																	}}
																>
																	<SelectTrigger className={`w-full h-10 bg-white dark:bg-[#121212] border-zinc-200 dark:border-transparent dark:text-white ${endTimeError ? 'border-red-600' : ''}`}>
																		<SelectValue placeholder="Hora de término" />
																	</SelectTrigger>
																	<SelectContent className="max-h-60">
																		{timeOptions.map((time) => (
																			<SelectItem key={time} value={time} disabled={time < minEndTimeFor(endDate, startDate, startTime)}>
																				{time}
																			</SelectItem>
																		))}
																	</SelectContent>
																</Select>
																{endTimeError && <div className="text-xs text-red-600 mt-1">{endTimeError}</div>}
															</div>
														</div>
													</div>
												</div>
											</div>
											<div>
												<div className="text-base mb-3" data-name="Localização">Localização</div>
												<div className="inline-flex flex-wrap items-center gap-1 p-1 rounded-xl bg-slate-100 dark:bg-[#111827]" role="tablist" aria-label="Selecionar tipo de localização">
													<Button type="button" variant="ghost" onClick={() => handleSetLocationType("Local")} aria-pressed={locationType === "Local"} className={`h-8 px-3 rounded-lg font-semibold text-xs max-sm:text-\[11px\] text-xs max-sm:text-[11px] ${locationType === "Local" ? "bg-white text-indigo-950 dark:bg-[#121212] dark:text-white shadow-sm" : "text-indigo-900 dark:text-white hover:text-indigo-950 dark:hover:text-white"}`}>Local</Button>
													<Button type="button" variant="ghost" onClick={() => handleSetLocationType("Evento online")} aria-pressed={locationType === "Evento online"} className={`h-8 px-3 rounded-lg font-semibold text-xs max-sm:text-\[11px\] text-xs max-sm:text-[11px] ${locationType === "Evento online" ? "bg-white text-indigo-950 dark:bg-[#121212] dark:text-white shadow-sm" : "text-indigo-900 dark:text-white hover:text-indigo-950 dark:hover:text-white"}`}>Evento online</Button>
													<Button type="button" variant="ghost" onClick={() => handleSetLocationType("Local será anunciado em breve")} aria-pressed={locationType === "Local será anunciado em breve"} className={`h-8 px-3 rounded-lg font-semibold text-xs max-sm:text-\[11px\] text-xs max-sm:text-[11px] whitespace-nowrap ${locationType === "Local será anunciado em breve" ? "bg-white text-indigo-950 dark:bg-[#121212] dark:text-white shadow-sm" : "text-indigo-900 dark:text-white hover:text-indigo-950 dark:hover:text-white"}`}>Local será anunciado</Button>
												</div>

												{locationType === "Local" && (
													<div className="mt-4 space-y-3">
														<LocationAutocomplete
															value={locationAddress}
															onSelect={(address, city, state) => {
																setLocationAddress(address || '');
																if (city) setTbdCity(city);
																if (state) setTbdUf(state);
															}}
															placeholder="Comece a digitar o endereço e escolha a sugestão"
															className={`w-full ${locationError ? 'border-red-600' : ''}`}
														/>
														{locationError && <div className="text-xs text-red-600 mt-1">{locationError}</div>}
														{locationAddress.trim().length > 3 && (
															<div className="w-full h-64 rounded-md overflow-hidden border border-zinc-200">
																<iframe title="Mapa do local" width="100%" height="100%" loading="lazy" referrerPolicy="no-referrer-when-downgrade" src={`https://maps.google.com/maps?q=${encodeURIComponent(locationAddress)}&t=&z=15&ie=UTF8&iwloc=&output=embed`} />
															</div>
														)}
														<div className="text-xs text-gray-600">O mapa é uma prévia baseada no endereço selecionado.</div>
													</div>
												)}
												{locationType === "Evento online" && (
													<div className="mt-4 space-y-2">
														<Input value={onlineUrl} onChange={e => setOnlineUrl(e.target.value)} placeholder="Link da transmissão (https://...)" className="w-full dark:bg-[#121212] dark:border-transparent dark:placeholder:text-slate-400 dark:text-white" />
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
																<Input value={tbdCity} onChange={e => setTbdCity(e.target.value)} placeholder="Cidade" className="w-full dark:bg-[#121212] dark:border-transparent dark:placeholder:text-slate-400 dark:text-white" />
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
							<div className="mt-6 w-full">
								{!editHowItWorks ? (
									<div role="button" tabIndex={0} onClick={() => setEditHowItWorks(true)} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setEditHowItWorks(true); }} className="bg-white dark:bg-[#242424] border border-indigo-200 dark:border-[#1F1F1F] hover:border-[#0205D3] rounded-2xl p-6 flex items-center justify-between cursor-pointer shadow-sm transition-colors">
										<div>
											<h3 className="text-xl font-bold text-indigo-950 dark:text-white mb-2">Como funciona</h3>
											{howItWorksSaved ? (
												<div className="text-sm text-indigo-950 dark:text-white" dangerouslySetInnerHTML={{ __html: sanitizeRichHtml(howItWorksText) }} />
											) : (
												<div className="text-[14px] text-indigo-950 dark:text-white">Use esta seção para fornecer mais detalhes sobre seu evento. Você pode incluir coisas que se deve saber, informações sobre o local, opções de acessibilidade - qualquer coisa que ajude as pessoas a saber o que esperar.</div>
											)}
										</div>
										<button type="button" onClick={(e) => { e.stopPropagation(); setEditHowItWorks(true); setHowItWorksSaved(false); }} className="flex-shrink-0 rounded-full bg-white dark:bg-[#242424] border border-indigo-200 dark:border-[#1F1F1F] shadow w-9 h-9 flex items-center justify-center hover:bg-indigo-50 dark:hover:bg-[#111827] leading-none">
											{howItWorksSaved ? (
												<CheckIcon size={20} />
											) : (
												<span className="w-4 h-4 flex items-center justify-center text-indigo-700 dark:text-white">
													<svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
												</span>
											)}
										</button>
									</div>
								) : (
									<Card ref={howRef} tabIndex={-1} onBlur={(e) => handleHowBlur(e)} className="flex flex-col items-start px-6 py-7 mt-0 max-w-full bg-white dark:bg-[#242424] rounded-2xl border border-solid border-indigo-200 dark:border-[#1F1F1F] hover:border-[#0205D3] w-full shadow transition-colors">
										<div className="text-xl text-indigo-950 dark:text-white font-semibold mb-2">Como funciona</div>
										<div className="w-full space-y-5">
											<div>
												<div className="text-[14px] mb-3 text-indigo-950 dark:text-white">Use esta seção para fornecer mais detalhes sobre seu evento. Você pode incluir informações sobre o local, opções de acessibilidade, etc.</div>
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
												<div
													contentEditable
													suppressContentEditableWarning
													onInput={e => setHowItWorksText((e.target as HTMLDivElement).innerHTML)}
												dangerouslySetInnerHTML={{ __html: sanitizeRichHtml(howItWorksText) }}
													className="min-h-[140px] p-4 border border-zinc-200 dark:border-gray-700 dark:bg-[#1a1a1a] rounded-md prose dark:prose-invert max-w-full focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
												/>
											</div>
										</div>
									</Card>
								)}
							</div>
							{/* Organizer selection */}
							<Card className="flex flex-col items-start px-5 py-7 mt-6 max-w-full bg-white dark:bg-[#242424] rounded-xl border border-solid border-zinc-200 dark:border-[#1F1F1F] hover:border-[#0205D3] w-full transition-colors">
								<div className="text-xl font-semibold mb-5" data-name="Organizador do evento">Calendário do evento</div>
								<div className="w-full space-y-5">
									<div>
										<div className="text-base mb-3" data-name="Selecionar organizador">Selecionar calendário</div>
										<Select value={selectedOrganizer} onValueChange={(v) => {
											if (v === 'create') {
												setShowCreateOrgModal(true);
												return;
											}
											setSelectedOrganizer(v);
										}}>
											<SelectTrigger className="w-full h-11 dark:bg-[#121212] dark:border-transparent dark:text-white">
												<div className="flex items-center gap-3 w-full">
													<div className="flex items-center gap-3">
														{/* Avatar of selected org */}

														<SelectValue placeholder="Calendário" />
													</div>
												</div>
											</SelectTrigger>
											<SelectContent className="min-w-[22rem] bg-white dark:bg-[#242424] dark:border-[#1F1F1F]">
												{organizers.map((org) => (
													<SelectItem key={org.id} value={org.id} className="relative pl-12 h-10 dark:text-white">

														<div className="text-sm font-medium">{org.name}</div>
													</SelectItem>
												))}
												<SelectItem value="create" className="pl-8 text-indigo-700 font-semibold dark:text-white">+ Criar um calendário</SelectItem>
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
														try { addOrganization({ id: createdId, name: createdName, logoUrl: createdLogo }); } catch (e) { }
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
									
									{/* External Event Configuration (Admin Only) */}
									{user?.isAdmin && (
										<div className="mt-6 pt-6 border-t border-zinc-100 dark:border-gray-800">
											<div className="flex items-center justify-between mb-4">
												<div>
													<h4 className="text-sm font-semibold text-indigo-950 dark:text-white">Evento Externo</h4>
													<p className="text-xs text-gray-500">Se ativado, o redirecionamento será para uma URL externa.</p>
												</div>
												<button
													type="button"
													onClick={() => setIsExternal(!isExternal)}
													className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${isExternal ? 'bg-indigo-600' : 'bg-gray-200'}`}
												>
													<span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isExternal ? 'translate-x-6' : 'translate-x-1'}`} />
												</button>
											</div>
											{isExternal && (
												<div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-200">
													<div className="text-xs font-semibold text-gray-700 dark:text-white mb-1">Link Externo (Compra/Mais Info)</div>
													<Input 
														value={externalUrl} 
														onChange={e => setExternalUrl(e.target.value)} 
														placeholder="https://www.sympla.com.br/evento/..." 
														className="w-full dark:bg-[#121212] dark:border-transparent dark:text-white"
													/>
												</div>
											)}
										</div>
									)}
								</div>
							</Card>
							
							{/* Admin Actions */}
							{user?.isAdmin && eventId && (
								<div className="mt-6 w-full px-2">
									<Button
										type="button"
										variant="ghost"
										onClick={async () => {
											if (confirm('ATENÇÃO: Deseja realmente EXCLUIR este evento? Esta ação não pode ser desfeita.')) {
												try {
													const res = await fetchApi('/api/admin/delete-event', {
														method: 'POST',
														headers: { 'Content-Type': 'application/json' },
														body: JSON.stringify({ eventId })
													});
													const data = await res.json();
													if (data.ok) {
														toast.success('Evento excluído com sucesso');
														navigate('/admin/events');
													} else {
														toast.error(data.error || 'Erro ao excluir evento');
													}
												} catch (e) {
													toast.error('Erro de conexão ao excluir');
												}
											}
										}}
										className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 w-full flex items-center justify-center gap-2 border border-red-100 dark:border-red-900/30 h-11 rounded-xl transition-all"
									>
										<svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
											<polyline points="3 6 5 6 21 6"></polyline>
											<path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
											<line x1="10" y1="11" x2="10" y2="17"></line>
											<line x1="14" y1="11" x2="14" y2="17"></line>
										</svg>
										Excluir Evento permanentemente
									</Button>
								</div>
							)}
							{/* Fixed CTA button (canto inferior direito) */}
							{!showCreateOrgModal && (
								<div>
									{backendError && (
										<div className="mb-2 text-center text-red-600 font-semibold text-sm">{backendError}</div>
									)}
									{/* Desktop bottom bar - hidden on mobile, appears when there are unsaved changes or creating new event */}
									<AnimatePresence>
										{((!eventId) || (eventId && hasUnsavedChanges)) && (
											<motion.div
												initial={{ y: 100, opacity: 0 }}
												animate={{ y: 0, opacity: 1 }}
												exit={{ y: 100, opacity: 0 }}
												transition={{ type: "spring", stiffness: 300, damping: 30 }}
												className="fixed bottom-0 left-[370px] right-0 z-[999] max-md:hidden"
											>
												<div className="h-20 bg-white/80 dark:bg-[#0b0b0b]/80 backdrop-blur-md border-t border-gray-200 dark:border-[#1F1F1F] shadow-lg flex items-center justify-center px-8">
													<Button
														onClick={async () => {
															try {
																setFlowStep(2);
																setFlowVisible(true);
																await new Promise(res => setTimeout(res, 600));
																handleSaveContinue();
															} finally {
																setTimeout(() => setFlowVisible(false), 1200);
															}
														}}
														aria-label={eventId ? "Salvar alterações" : "Criar e configurar ingressos"}
														title={eventId ? "Salvar alterações" : "Criar e configurar ingressos"}
														disabled={loadingEvent || uploading}
														className="bg-indigo-700 hover:bg-indigo-800 text-white font-bold h-12 min-w-[200px] rounded-lg shadow-md disabled:opacity-60 px-6 flex items-center justify-center gap-2 whitespace-nowrap transition-all hover:shadow-xl"
													>
														{loadingEvent ? (
															<>
																<svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
																	<circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
																	<path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
																</svg>
																Carregando evento…
															</>
														) : uploading ? (
															<>
																<svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
																	<circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
																	<path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
																</svg>
																Salvando…
															</>
														) : eventId ? (
															<>
																<svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
																	<path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z" />
																	<polyline points="17 21 17 13 7 13 7 21" />
																	<polyline points="7 3 7 8 15 8" />
																</svg>
																Salvar alterações
															</>
														) : (
															<>
																Criar e configurar ingressos
																<svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
																	<path d="M5 12h14" />
																	<path d="M12 5l7 7-7 7" />
																</svg>
															</>
														)}
													</Button>
												</div>
											</motion.div>
										)}
									</AnimatePresence>

									{/* Mobile bottom bar - only shows when there are unsaved changes or creating new event */}
									{((!eventId) || hasUnsavedChanges) && (
										<div className="hidden max-md:block fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-[#0b0b0b] border-t border-slate-200 dark:border-[#1F1F1F] shadow-lg">
											<div className="px-4 py-3">
												<Button
													onClick={async () => {
														try {
															setFlowStep(2);
															setFlowVisible(true);
															await new Promise(res => setTimeout(res, 600));
															handleSaveContinue();
															// Update original values after save
															setOriginalValues({
																name: eventName,
																subtitle: eventSubtitle,
																description: eventDescription,
																startDate,
																startTime,
																endDate,
																endTime,
																locationType,
																locationAddress,
																onlineUrl,
																tbdUf,
																tbdCity,
																selectedOrganizer
															});
															setHasUnsavedChanges(false);
														} finally {
															setTimeout(() => setFlowVisible(false), 1200);
														}
													}}
													disabled={loadingEvent || uploading}
													className="w-full bg-indigo-700 hover:bg-indigo-800 text-white h-12 rounded-lg font-semibold flex items-center justify-center gap-2"
												>
													<span>{loadingEvent ? 'Carregando…' : (uploading ? 'Salvando…' : (eventId ? 'Salvar alterações' : 'Criar Evento'))}</span>
												</Button>
											</div>
										</div>
									)}
								</div>
							)}										{/* spacer para dar respiro no final do scroll */}
							<div className="h-28" />

						</div>
					</div>
				</OrganizerLayout>
			</div>
		</div>
	);
}

export default CreateEditEvent;








