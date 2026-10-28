import { useEffect, useState } from 'react';
import { Globe, Mail, MapPin, Phone } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { selectBrandingState } from '../../features/branding/brandingSlice';
import { updateBranding } from '../../features/branding/brandingThunks';
import { showToast } from '../../features/ui/uiSlice';
import Alert from '../../components/Alert';
import Card from '../../components/Card';
import FormField, { errorProps } from '../../components/FormField';
import ImageUpload from '../../components/ImageUpload';
import PageHeader from '../../components/PageHeader';
import ProductLogo from '../../components/ProductLogo';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validate(form) {
  const errors = {};
  if (form.productName.trim().length < 2) errors.productName = 'Enter the product name.';
  if (form.tagline.length > 80) errors.tagline = 'Keep the tagline under 80 characters.';
  if (form.company.name.trim().length < 2) errors.companyName = 'Enter the company name.';
  if (form.company.email.trim() && !EMAIL_PATTERN.test(form.company.email.trim())) errors.companyEmail = 'Enter a valid email address.';
  if (form.company.website.trim() && !/^https?:\/\/\S+$/.test(form.company.website.trim())) errors.companyWebsite = 'Start with http:// or https://';
  return errors;
}

function Preview({ form }) {
  const { company } = form;
  const contacts = [
    [Mail, company.email],
    [Phone, company.phone],
    [Globe, company.website],
    [MapPin, company.address],
  ].filter(([, value]) => value.trim());

  return (
    <div className="flex flex-col gap-4">
      <div>
        <p className="mb-1.5 text-xs text-slate-500">Browser tab</p>
        <div className="flex max-w-full items-center gap-2 rounded-t-lg border border-b-0 border-slate-200 bg-slate-100 px-3 py-2 text-xs">
          {form.favicon ? <img src={form.favicon} alt="" className="size-4 object-contain" /> : <img src="/favicon.svg" alt="" className="size-4" />}
          <span className="truncate">{form.tagline ? `${form.productName} | ${form.tagline}` : form.productName}</span>
        </div>
      </div>

      <div>
        <p className="mb-1.5 text-xs text-slate-500">Sidebar</p>
        <div className="flex items-center gap-2.5 rounded-lg bg-slate-900 px-4 py-3 text-white">
          <ProductLogo src={form.productLogo} className="text-blue-400" />
          <div className="min-w-0">
            <strong className="block truncate text-[15px]">{form.productName || 'Product name'}</strong>
            <span className="text-xs text-slate-500">Super Admin panel</span>
          </div>
        </div>
      </div>

      <div>
        <p className="mb-1.5 text-xs text-slate-500">Login page</p>
        <div className="flex flex-col gap-2 rounded-lg bg-slate-900 p-4 text-slate-300">
          <ProductLogo src={form.productLogo} size={32} className="text-blue-400" />
          <strong className="text-lg text-white">{form.productName || 'Product name'}</strong>
          {form.tagline && <span className="text-[13px]">{form.tagline}</span>}
          <div className="mt-3 flex items-center gap-2 border-t border-slate-700 pt-3 text-xs text-slate-400">
            {company.logo && <img src={company.logo} alt="" className="size-5 object-contain" />}
            <span>Developed by {company.name || 'company name'}</span>
          </div>
          {contacts.length > 0 && (
            <ul className="flex flex-col gap-1 text-xs text-slate-400">
              {contacts.map(([Icon, value]) => (
                <li key={value} className="flex items-center gap-1.5 break-all">
                  <Icon size={12} aria-hidden="true" className="shrink-0" />
                  {value}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

export default function BrandingPage() {
  const dispatch = useDispatch();
  const { data, status } = useSelector(selectBrandingState);
  const [form, setForm] = useState(data);
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Take the saved details once they arrive (the page may open before they load).
  useEffect(() => {
    if (status === 'succeeded') setForm(data);
  }, [status, data]);

  const isDirty = JSON.stringify(form) !== JSON.stringify(data);

  function setField(name, value, errorKey = name) {
    setForm((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [errorKey]: undefined }));
  }

  function setCompanyField(name, value, errorKey) {
    setForm((current) => ({ ...current, company: { ...current.company, [name]: value } }));
    if (errorKey) setErrors((current) => ({ ...current, [errorKey]: undefined }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (isSaving) return;
    const validationErrors = validate(form);
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;

    setIsSaving(true);
    setSubmitError('');
    try {
      await dispatch(updateBranding(form)).unwrap();
      dispatch(showToast({ message: 'Product and company details saved.' }));
    } catch (saveError) {
      setSubmitError(saveError.message);
    } finally {
      setIsSaving(false);
    }
  }

  const companyInput = (name, label, errorKey, props = {}) => (
    <FormField id={`company-${name}`} label={label} error={errors[errorKey]}>
      <input
        id={`company-${name}`}
        className="input"
        value={form.company[name]}
        onChange={(event) => setCompanyField(name, event.target.value, errorKey)}
        {...errorProps(`company-${name}`, errors[errorKey])}
        {...props}
      />
    </FormField>
  );

  return (
    <>
      <PageHeader
        title="Product & company"
        description="The product's name and logos, and the software development company behind it. Shown on the login page, in the sidebar and in the browser tab."
      />

      <form onSubmit={handleSubmit} noValidate>
        {submitError && (
          <Alert tone="error" className="mb-4">
            {submitError}
          </Alert>
        )}
        <div className="grid gap-5 xl:grid-cols-[1fr_340px]">
          <div className="flex flex-col gap-5">
            <Card title="Product">
              <div className="grid gap-x-6 md:grid-cols-2">
                <ImageUpload
                  label="Product logo"
                  value={form.productLogo}
                  onChange={(value) => setField('productLogo', value)}
                  maxKb={512}
                  hint="Square works best. PNG, JPG, SVG or WebP, up to 512 KB."
                />
                <ImageUpload
                  label="Favicon"
                  value={form.favicon}
                  onChange={(value) => setField('favicon', value)}
                  maxKb={100}
                  previewClassName="size-12"
                  hint="The small icon in the browser tab. 32×32 or 64×64 PNG, SVG or ICO, up to 100 KB."
                />
              </div>
              <div className="grid gap-x-4 md:grid-cols-2">
                <FormField id="product-name" label="Product name" error={errors.productName}>
                  <input
                    id="product-name"
                    className="input"
                    maxLength={40}
                    value={form.productName}
                    onChange={(event) => setField('productName', event.target.value)}
                    {...errorProps('product-name', errors.productName)}
                  />
                </FormField>
                <FormField id="product-tagline" label="Tagline" hint={`${form.tagline.length}/80`} error={errors.tagline}>
                  <input
                    id="product-tagline"
                    className="input"
                    maxLength={80}
                    value={form.tagline}
                    onChange={(event) => setField('tagline', event.target.value)}
                    {...errorProps('product-tagline', errors.tagline)}
                  />
                </FormField>
              </div>
            </Card>

            <Card title="Software development company">
              <ImageUpload label="Company logo" value={form.company.logo} onChange={(value) => setCompanyField('logo', value)} maxKb={512} />
              {companyInput('name', 'Company name', 'companyName')}
              <div className="grid gap-x-4 md:grid-cols-2">
                {companyInput('email', 'Email', 'companyEmail', { type: 'email', placeholder: 'hello@company.com' })}
                {companyInput('phone', 'Phone', null, { type: 'tel', placeholder: '+94 11 234 5678' })}
              </div>
              {companyInput('website', 'Website', 'companyWebsite', { type: 'url', placeholder: 'https://www.company.com' })}
              <FormField id="company-address" label="Address">
                <textarea
                  id="company-address"
                  className="input h-auto py-2"
                  rows={2}
                  value={form.company.address}
                  onChange={(event) => setCompanyField('address', event.target.value)}
                />
              </FormField>
            </Card>
          </div>

          <div className="flex flex-col gap-4 xl:sticky xl:top-20 xl:self-start">
            <Card title="Preview">
              <Preview form={form} />
            </Card>
            <div className="flex justify-end gap-2">
              <button type="button" className="btn btn-secondary" disabled={!isDirty || isSaving} onClick={() => setForm(data)}>
                Discard changes
              </button>
              <button type="submit" className="btn btn-primary" disabled={!isDirty || isSaving}>
                {isSaving ? 'Saving…' : 'Save changes'}
              </button>
            </div>
          </div>
        </div>
      </form>
    </>
  );
}
