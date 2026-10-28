function isHttpUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

// The problem with a target address, or '' when it is fine. `targetType` is the master item.
export function targetAddressError(value, targetType) {
  const address = value.trim();
  if (!address) return 'Enter the target address.';
  if (/\s/.test(address)) return 'The target cannot contain spaces.';
  if (targetType?.format === 'url' && !isHttpUrl(address)) return 'Enter a full URL starting with https://';
  return '';
}
