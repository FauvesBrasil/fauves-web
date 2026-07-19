export const isDST = () => {
    const today = new Date();
    const jan = new Date(today.getFullYear(), 0, 1).getTimezoneOffset();
    const jul = new Date(today.getFullYear(), 6, 1).getTimezoneOffset();
    return today.getTimezoneOffset() < Math.max(jan, jul);
};

export const getTimezoneOffsetForTimezone = (timeZone: string, date = new Date()) => {
    try {
        const tzString = date.toLocaleString("en-US", { timeZone });
        const localDate = new Date(tzString);
        const utcDate = new Date(date.toLocaleString("en-US", { timeZone: "UTC" }));
        return (localDate.getTime() - utcDate.getTime()) / 60000;
    } catch {
        return -date.getTimezoneOffset();
    }
};

export const formatOffsetToGmtString = (offsetMinutes: number) => {
    const hours = Math.floor(Math.abs(offsetMinutes) / 60);
    const minutes = Math.abs(offsetMinutes) % 60;
    const sign = offsetMinutes >= 0 ? "+" : "-";
    const formattedHours = String(hours).padStart(2, "0");
    const formattedMinutes = String(minutes).padStart(2, "0");
    return `GMT${sign}${formattedHours}:${formattedMinutes}`;
};

export const formatTimezoneCity = (city: string) => {
    const clean = city.replace(/_/g, ' ');
    const mappings: Record<string, string> = {
        "Sao Paulo": "São Paulo",
        "Brasilia": "Brasília",
        "New York": "Nova York",
        "London": "Londres",
        "Rome": "Roma",
        "Lisbon": "Lisboa",
        "Paris": "Paris",
        "Moscow": "Moscou"
    };
    return mappings[clean] || clean;
};

export const getEventTimezoneAndCity = (address: string, isVirtual: boolean) => {
    if (isVirtual) {
        try {
            const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
            const now = new Date();
            const tzOffset = getTimezoneOffsetForTimezone(tz, now);
            const gmtString = formatOffsetToGmtString(tzOffset);
            const parts = tz.split('/');
            const rawCity = parts[parts.length - 1] || "Fortaleza";
            const cityName = formatTimezoneCity(rawCity);
            return { gmt: gmtString, city: cityName };
        } catch {
            return { gmt: "GMT-03:00", city: "Fortaleza" };
        }
    }

    if (!address) {
        return { gmt: "GMT-03:00", city: "Fortaleza" };
    }

    let city = "Fortaleza";
    let state = "CE";
    
    const isUSA = /USA|United States|Estados Unidos/i.test(address);
    const isUK = /UK|United Kingdom|Reino Unido/i.test(address);
    const isPortugal = /Portugal/i.test(address);
    const isArgentina = /Argentina/i.test(address);

    const matchBrl = address.match(/,\s*([^,]+?)\s*-\s*([A-Z]{2})(?:,|$)/);
    if (matchBrl) {
        city = matchBrl[1].trim();
        state = matchBrl[2].trim();
    } else {
        const parts = address.split(',').map(p => p.trim());
        if (parts.length > 1) {
            const lastPart = parts[parts.length - 1];
            if (/Brasil/i.test(lastPart)) {
                const cityPart = parts[parts.length - 3] || parts[parts.length - 2];
                if (cityPart) {
                    const cleanCity = cityPart.split('-')[0].trim();
                    if (cleanCity) city = cleanCity;
                }
            } else if (isUSA) {
                city = parts[parts.length - 3] || parts[parts.length - 2] || "New York";
            } else {
                city = parts[parts.length - 2] || parts[0];
            }
        }
    }

    city = city.replace(/\d+/g, '').replace(/^\s*-\s*/, '').trim();

    let gmt = "GMT-03:00";

    if (isUSA) {
        const stateLower = address.toLowerCase();
        if (/\b(ca|california|wa|washington|or|oregon|nv|nevada)\b/i.test(stateLower)) {
            gmt = isDST() ? "GMT-07:00" : "GMT-08:00";
            if (city === "Fortaleza") city = "Los Angeles";
        } else if (/\b(ny|new york|fl|florida|ma|massachusetts|dc|washington dc|miami)\b/i.test(stateLower)) {
            gmt = isDST() ? "GMT-04:00" : "GMT-05:00";
            if (city === "Fortaleza") city = "Nova York";
        } else if (/\b(tx|texas|il|illinois|chicago|houston)\b/i.test(stateLower)) {
            gmt = isDST() ? "GMT-05:00" : "GMT-06:00";
            if (city === "Fortaleza") city = "Chicago";
        } else {
            gmt = "GMT-05:00";
        }
    } else if (isUK || /London|Londres/i.test(address)) {
        gmt = isDST() ? "GMT+01:00" : "GMT+00:00";
        if (city === "Fortaleza") city = "Londres";
    } else if (isPortugal || /Lisbon|Lisboa/i.test(address)) {
        gmt = isDST() ? "GMT+01:00" : "GMT+00:00";
        if (city === "Fortaleza") city = "Lisboa";
    } else if (/França|Franca|France|Paris|Alemanha|Germany|Berlin|Berlim|Itália|Italy|Roma|Rome|Espanha|Spain|Madrid/i.test(address)) {
        gmt = isDST() ? "GMT+02:00" : "GMT+01:00";
        if (city === "Fortaleza") city = "Paris";
    } else if (isArgentina || /Buenos Aires/i.test(address)) {
        gmt = "GMT-03:00";
        if (city === "Fortaleza") city = "Buenos Aires";
    } else {
        const stateLower = state.toLowerCase();
        if (/\b(am|amazonas|rr|roraima|ro|rondonia|mt|mato grosso|ms)\b/.test(stateLower)) {
            gmt = "GMT-04:00";
        } else if (/\b(ac|acre)\b/.test(stateLower)) {
            gmt = "GMT-05:00";
        } else if (/\b(fn)\b/.test(stateLower) || /fernando de noronha/i.test(address)) {
            gmt = "GMT-02:00";
        }
    }

    return { gmt, city };
};
