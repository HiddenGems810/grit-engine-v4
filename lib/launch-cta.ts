export type FormatLaunchCta = {
  href: string;
  label: 'Get FORMAT Pro' | 'Join Paid Beta';
  external: boolean;
} | null;

const clean = (value: string | undefined) => {
  const trimmed = value?.trim();
  return trimmed && trimmed.length > 0 ? trimmed : '';
};

export const resolveFormatLaunchCta = (config: {
  paymentUrl?: string;
  betaUrl?: string;
  supportEmail?: string;
}): FormatLaunchCta => {
  const paymentUrl = clean(config.paymentUrl);
  if (paymentUrl) {
    return { href: paymentUrl, label: 'Get FORMAT Pro', external: true };
  }

  const betaUrl = clean(config.betaUrl);
  if (betaUrl) {
    return { href: betaUrl, label: 'Join Paid Beta', external: true };
  }

  const supportEmail = clean(config.supportEmail);
  if (supportEmail) {
    return {
      href: `mailto:${supportEmail}?subject=FORMAT%20Paid%20Beta%20Access`,
      label: 'Join Paid Beta',
      external: false
    };
  }

  return null;
};
