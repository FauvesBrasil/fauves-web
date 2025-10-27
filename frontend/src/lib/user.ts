export function getDisplayName(user: any, profile?: any) {
  // prefer explicit name fields in multiple possible shapes
  const tryName = (u: any) => {
    if (!u) return null;
    if (typeof u.name === 'string' && u.name.trim()) return u.name.trim();
    if (u.user_metadata) {
      if (typeof u.user_metadata.full_name === 'string' && u.user_metadata.full_name.trim()) return u.user_metadata.full_name.trim();
      if (typeof u.user_metadata.nome === 'string' && u.user_metadata.nome.trim()) return u.user_metadata.nome.trim();
    }
    if (typeof u.fullName === 'string' && u.fullName.trim()) return u.fullName.trim();
    if (typeof u.full_name === 'string' && u.full_name.trim()) return u.full_name.trim();
    return null;
  };

  const pName = tryName(profile);
  if (pName) return pName;
  const uName = tryName(user);
  if (uName) return uName;

  // fallback to email localpart
  if (user && typeof user.email === 'string' && user.email.includes('@')) return user.email.split('@')[0];

  return null;
}

export function getFirstName(user: any, profile?: any) {
  const full = getDisplayName(user, profile);
  if (!full) return '';
  let token = String(full).trim();

  // If we accidentally received a full email address, use localpart
  if (token.includes('@')) token = token.split('@')[0];

  // Common separators that indicate first/last parts
  const sepMatch = token.match(/[._\-+]/);
  if (sepMatch) {
    token = token.split(/[._\-+]/)[0];
  }

  // If there are spaces, use the first word
  if (token.includes(' ')) token = token.split(' ')[0];

  // Try to split camelCase (e.g., LevyCamara -> Levy)
  const camelParts = token.match(/[A-Z]?[a-z]+|[0-9]+/g);
  if (camelParts && camelParts.length > 1) {
    token = camelParts[0];
  }

  // Normalize capitalization: first letter uppercase, rest lowercase
  token = token.charAt(0).toUpperCase() + token.slice(1).toLowerCase();

  // Heuristic: if token is a long lowercase concatenation (e.g. 'levycamara'), try to split
  // at a consonant-consonant boundary and take the first part as the likely first name.
  try {
    const isLowerAlpha = /^[a-z]+$/.test(String(full).trim());
    if (isLowerAlpha && token.length > 6) {
      const raw = String(full).trim();
        const consonants = 'bcdfghjklmnpqrstvwxyz';
        const candidates: number[] = [];
        for (let i = 1; i < raw.length - 1; i++) {
          const a = raw[i].toLowerCase();
          const b = raw[i + 1].toLowerCase();
          if (consonants.includes(a) && consonants.includes(b)) {
            candidates.push(i + 1);
          }
        }
        if (candidates.length > 0) {
          // prefer a candidate that yields a prefix of length >= 4, otherwise pick the longest
          let pick = candidates[candidates.length - 1];
          for (const c of candidates) {
            if (c >= 4) pick = c;
          }
          const part = raw.slice(0, pick);
          const cap = part.charAt(0).toUpperCase() + part.slice(1).toLowerCase();
          return cap;
        }
    }
  } catch (e) {
    // silent fallback to token
  }

  return token;
}
