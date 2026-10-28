function isHttpUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

// The translation key of the problem with a target address, or '' when it is fine.
// `targetType` is the master data item.
export function targetAddressError(value, targetType) {
  const address = value.trim();
  if (!address) return 'validation.addressRequired';
  if (/\s/.test(address)) return 'validation.addressSpaces';
  if (targetType?.format === 'url' && !isHttpUrl(address)) return 'validation.addressUrl';
  return '';
}
