// Ready-to-send message with an organization admin's login details.
export function buildLoginMessage(organization, admin) {
  const lines = [
    `Hi ${admin.name},`,
    '',
    `Your Sentinel account for ${organization.name} is ready.`,
    '',
    `Sign in: ${window.location.origin}/login`,
    `Email: ${admin.email}`,
  ];
  if (admin.password) lines.push(`Password: ${admin.password}`);
  return lines.join('\n');
}
