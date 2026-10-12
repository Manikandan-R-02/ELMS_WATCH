import { useMemo, useState } from "react";
import { AtSign, DollarSign, Mail, Search, User } from "lucide-react";
import {
  TextInput,
  NumberInput,
  PasswordInput,
  TextArea,
  SelectSearch,
  MultiSelectSearch,
  Checkbox,
  CheckboxGroup,
  RadioGroup,
  FloatingInput,
  PinInput,
  Switch,
  Rating,
  Slider,
  RangeSlider,
  TagsInput,
  ColorPicker,
  FileUpload,
  type SelectOption,
} from "../components/fields";
import { SearchBar } from "../components/search/SearchBar";
import { PreviewPage, PreviewSection, ComponentApi } from "./PreviewSection";

const countries: SelectOption[] = [
  "India", "United States", "United Kingdom", "Germany", "France", "Japan",
  "Australia", "Canada", "Singapore", "United Arab Emirates",
].map((c) => ({ label: c, value: c }));

const skills: SelectOption[] = [
  "React", "TypeScript", "Node.js", "Python", "SQL", "GraphQL",
  "Docker", "Kubernetes", "AWS", "Figma",
].map((s) => ({ label: s, value: s }));

export function FieldsPreviewPage() {
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [qty, setQty] = useState<number | "">(1);
  const [country, setCountry] = useState<string | null>(null);
  const [selectedSkills, setSelectedSkills] = useState<string[]>(["React", "TypeScript"]);
  const [password, setPassword] = useState("");
  const [normalSearch, setNormalSearch] = useState("");
  const [slideSearch, setSlideSearch] = useState("");
  const [agree, setAgree] = useState(false);
  const [notifyChannels, setNotifyChannels] = useState<string[]>(["email"]);
  const [plan, setPlan] = useState<string | null>("pro");
  const [price, setPrice] = useState("");
  const [username, setUsername] = useState("");
  const [floatName, setFloatName] = useState("");
  const [floatEmail, setFloatEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [notifyEnabled, setNotifyEnabled] = useState(true);
  const [autoRenew, setAutoRenew] = useState(false);
  const [rating, setRating] = useState(3.5);
  const [budget, setBudget] = useState(60);
  const [priceRange, setPriceRange] = useState({ min: 20, max: 80 });
  const [tags, setTags] = useState<string[]>(["urgent", "warehouse-a"]);
  const [labelColor, setLabelColor] = useState("#3b82f6");
  const [attachments, setAttachments] = useState<File[]>([]);

  // Validation demo: touch the field, then clear it, to see the error appear below.
  const [email, setEmail] = useState("");
  const [emailTouched, setEmailTouched] = useState(false);
  const emailError = useMemo(() => {
    if (!emailTouched) return undefined;
    if (!email) return "Email is required.";
    if (!/^[^\s@]+@[^\s@.]+(?:\.[^\s@.]+)+$/.test(email)) return "Enter a valid email address.";
    return undefined;
  }, [email, emailTouched]);

  return (
    <PreviewPage title="Fields" description="Text, number, password, textarea, and searchable select inputs with character limits and validation states.">
      <PreviewSection title="Text input" description="With leading icon, char limit and helper text.">
        <div className="grid gap-4 sm:grid-cols-2">
          <TextInput
            label="Full name"
            placeholder="Jane Doe"
            maxLength={40}
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          <TextInput label="Email" type="email" placeholder="you@company.com" leadingIcon={<Mail className="h-4 w-4" />} />
          <TextInput label="Disabled field" value="Read only value" disabled />
        </div>
        <ComponentApi
          importCode={'import { TextInput } from "../components/fields";'}
          props={[
            { name: "label", type: "string", description: "Field label above the input." },
            { name: "value", type: "string", description: "Controlled value." },
            { name: "onChange", type: "(e: ChangeEvent<HTMLInputElement>) => void", description: "Standard input change handler." },
            { name: "maxLength", type: "number", description: "Max characters — shows a live counter automatically." },
            { name: "showCharCount", type: "boolean", default: "!!maxLength", description: "Force the counter on/off." },
            { name: "leadingIcon / trailingIcon", type: "ReactNode", description: "Icon rendered inside the field." },
            { name: "iconVariant", type: '"inline" | "addon"', default: '"inline"', description: '"addon" puts the icon in its own bordered/tinted box — see below.' },
            { name: "error", type: "string", description: "Shows in red under the field, replaces helperText." },
            { name: "helperText", type: "string", description: "Muted hint text under the field." },
            { name: "containerClassName / containerStyle", type: "string / CSSProperties", description: "Sizes the label+input wrapper." },
            { name: "...rest", type: "InputHTMLAttributes<HTMLInputElement>", description: "disabled, required, minLength, type, placeholder, etc. pass straight through." },
          ]}
        />
      </PreviewSection>

      <PreviewSection title="Icon input (addon)" description={'`iconVariant="addon"` sets the icon in its own bordered, tinted box attached to the field — a more prominent, segmented look than the default transparent inline icon, good for a currency/unit prefix or a clearly separate action.'}>
        <div className="grid gap-4 sm:grid-cols-2">
          <TextInput
            label="Price"
            placeholder="0.00"
            leadingIcon={<DollarSign className="h-4 w-4" />}
            iconVariant="addon"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
          />
          <TextInput
            label="Username"
            placeholder="janedoe"
            leadingIcon={<AtSign className="h-4 w-4" />}
            trailingIcon={<User className="h-4 w-4" />}
            iconVariant="addon"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
        </div>
        <ComponentApi
          importCode={'<TextInput label="Price" leadingIcon={<DollarSign className="h-4 w-4" />} iconVariant="addon" value={price} onChange={...} />'}
          props={[{ name: "iconVariant", type: '"inline" | "addon"', description: "Same TextInput prop as above — shown here on its own for visibility." }]}
        />
      </PreviewSection>

      <PreviewSection title="Floating label input" description="Label sits inside the field and floats above the border on focus or once filled — pure CSS, so it also tracks a value set programmatically on a controlled input, not just typed input.">
        <div className="grid gap-4 sm:grid-cols-2">
          <FloatingInput label="Full name" value={floatName} onChange={(e) => setFloatName(e.target.value)} required />
          <FloatingInput label="Email" type="email" leadingIcon={<Search className="h-4 w-4" />} value={floatEmail} onChange={(e) => setFloatEmail(e.target.value)} />
        </div>
        <ComponentApi
          importCode={'import { FloatingInput } from "../components/fields";'}
          props={[
            { name: "label", type: "string", description: "Required — this is what floats; there's no separate placeholder prop." },
            { name: "value / onChange", type: "string / (e) => void", description: "Same contract as TextInput." },
            { name: "leadingIcon / trailingIcon", type: "ReactNode", description: "Same as TextInput; the label shifts right to clear a leading icon." },
            { name: "error, helperText, required, disabled", type: "—", description: "Same contract as every other field." },
          ]}
        />
      </PreviewSection>

      <PreviewSection title="PIN / OTP input" description="Segmented one-time-code input — auto-advances as you type, Backspace moves to the previous box, and pasting a full code fills every box at once.">
        <PinInput label="Verification code" length={6} value={otp} onChange={setOtp} helperText="Sent to your registered email." />
        <ComponentApi
          importCode={'import { PinInput } from "../components/fields";'}
          props={[
            { name: "length", type: "number", default: "6", description: "Number of digit boxes." },
            { name: "value / onChange", type: "string / (value: string) => void", description: "Controlled — value is the concatenated digits typed so far." },
            { name: "autoFocus", type: "boolean", description: "Focuses the first box on mount." },
            { name: "label, error, helperText, required, disabled", type: "—", description: "Same contract as every other field." },
          ]}
        />
      </PreviewSection>

      <PreviewSection title="Validation error" description="Every field accepts an `error` prop — it renders in red below the field (replacing helperText) and reddens the border/focus ring. Type an email, then clear it.">
        <div className="max-w-xs">
          <TextInput
            label="Work email"
            placeholder="you@company.com"
            leadingIcon={<Mail className="h-4 w-4" />}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onBlur={() => setEmailTouched(true)}
            error={emailError}
            helperText={emailError ? undefined : "We'll only use this for account notifications."}
            required
          />
        </div>
      </PreviewSection>

      <PreviewSection title="Password input" description="Eye icon toggles visibility; live strength meter based on length and character variety.">
        <div className="max-w-xs">
          <PasswordInput label="Password" placeholder="Enter a password" value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>
        <ComponentApi
          importCode={'import { PasswordInput } from "../components/fields";'}
          props={[
            { name: "value / onChange", type: "string / (e) => void", description: "Same contract as a native input." },
            { name: "showStrength", type: "boolean", default: "true", description: "Set false on login forms — strength meters don't make sense for an existing password." },
            { name: "leadingIcon", type: "ReactNode", description: "Optional inline leading icon (e.g. a lock) — same convention as TextInput." },
            { name: "label, error, helperText, minLength, maxLength", type: "—", description: "Same as TextInput." },
          ]}
        />
      </PreviewSection>

      <PreviewSection title="Number input" description="Digits only — non-numeric keystrokes are blocked, no +/- steppers.">
        <div className="max-w-xs">
          <NumberInput label="Quantity" value={qty} onChange={setQty} min={0} max={99} maxLength={4} />
        </div>
        <ComponentApi
          importCode={'import { NumberInput } from "../components/fields";'}
          props={[
            { name: "value", type: "number | \"\"", description: "Controlled numeric value (empty string while the field is blank)." },
            { name: "onChange", type: "(value: number | \"\") => void", description: "Receives a real number, not an event." },
            { name: "min / max", type: "number", description: "Clamps the value on every change." },
            { name: "maxLength", type: "number", description: "Maximum digit count the user can type." },
            { name: "allowDecimal", type: "boolean", default: "false", description: "Allow one decimal point." },
            { name: "allowNegative", type: "boolean", default: "false", description: "Allow a leading minus sign." },
          ]}
        />
      </PreviewSection>

      <PreviewSection title="Text area" description="Multi-line input with a live character counter.">
        <TextArea label="Bio" placeholder="Tell us about yourself" maxLength={200} value={bio} onChange={(e) => setBio(e.target.value)} />
        <ComponentApi
          importCode={'import { TextArea } from "../components/fields";'}
          props={[
            { name: "value / onChange", type: "string / (e) => void", description: "Standard textarea change handler." },
            { name: "maxLength", type: "number", description: "Shows a live character counter." },
            { name: "rows", type: "number", default: "4", description: "Initial visible rows (resizable vertically)." },
          ]}
        />
      </PreviewSection>

      <PreviewSection title="Searchable select" description="Autofocuses the search box on open; supports keyboard navigation.">
        <div className="max-w-xs">
          <SelectSearch label="Country" options={countries} value={country} onChange={setCountry} placeholder="Choose a country" />
        </div>
        <ComponentApi
          importCode={'import { SelectSearch, type SelectOption } from "../components/fields";'}
          props={[
            { name: "options", type: "SelectOption<T>[]", description: "{ label, value, disabled? }[]" },
            { name: "value / onChange", type: "T | null / (value: T | null) => void", description: "Controlled selection; null when cleared." },
            { name: "autoFocusSearch", type: "boolean", default: "true", description: "Focus the search box the moment the dropdown opens." },
            { name: "clearable", type: "boolean", default: "true", description: "Show an X to clear the selection." },
            { name: "emptyMessage", type: "string", default: '"No results found"', description: "Shown when the filter matches nothing." },
            { name: "portal", type: "boolean", default: "false", description: "Render the option panel into document.body, fixed-positioned against the trigger — use inside a modal body, table cell, or any clipping/scrolling ancestor so it isn't cut off (same pattern as DatePicker/MonthPicker's own portal prop)." },
          ]}
        />
      </PreviewSection>

      <PreviewSection title="Multi-select" description="Same search-inside-dropdown interaction as the single select, but for T[] — chips in the trigger, checkboxes in the list, Backspace removes the last chip.">
        <div className="max-w-sm">
          <MultiSelectSearch label="Skills" options={skills} value={selectedSkills} onChange={setSelectedSkills} placeholder="Select skills" />
        </div>
        <ComponentApi
          importCode={'import { MultiSelectSearch } from "../components/fields";'}
          props={[
            { name: "options", type: "SelectOption<T>[]", description: "Same shape as SelectSearch." },
            { name: "value / onChange", type: "T[] / (value: T[]) => void", description: "Controlled array of selected values." },
            { name: "showChips", type: "boolean", default: "true", description: "Show removable chips vs. just a \"N selected\" count." },
            { name: "maxVisibleChips", type: "number", default: "3", description: "Collapses the rest into a \"+N\" badge." },
            { name: "autoFocusSearch", type: "boolean", default: "true", description: "Same as SelectSearch." },
          ]}
        />
      </PreviewSection>

      <PreviewSection title="Checkbox" description="Standalone toggle for a single yes/no field.">
        <div className="max-w-sm">
          <Checkbox
            label="I agree to the terms and conditions"
            description="You can withdraw consent at any time from account settings."
            checked={agree}
            onChange={setAgree}
            required
          />
        </div>
        <ComponentApi
          importCode={'import { Checkbox } from "../components/fields";'}
          props={[
            { name: "checked / onChange", type: "boolean / (checked: boolean) => void", description: "Controlled toggle state." },
            { name: "label / description", type: "ReactNode", description: "Label sits beside the box; description renders muted underneath it." },
            { name: "indeterminate", type: "boolean", description: "Shows a dash instead of a check — for a \"select all\" toggle with a partial selection." },
            { name: "error, helperText, required, disabled", type: "—", description: "Same contract as every other field." },
          ]}
        />
      </PreviewSection>

      <PreviewSection title="Checkbox group" description="Multiple checkboxes bound to one array value.">
        <div className="max-w-sm">
          <CheckboxGroup
            label="Notify me via"
            options={[
              { label: "Email", value: "email" },
              { label: "SMS", value: "sms", description: "Standard message rates may apply." },
              { label: "Push notification", value: "push" },
            ]}
            value={notifyChannels}
            onChange={setNotifyChannels}
          />
        </div>
        <ComponentApi
          importCode={'import { CheckboxGroup } from "../components/fields";'}
          props={[
            { name: "options", type: "{ label, value, description?, disabled? }[]", description: "One row per option." },
            { name: "value / onChange", type: "T[] / (value: T[]) => void", description: "Controlled array of checked values." },
            { name: "orientation", type: '"vertical" | "horizontal"', default: '"vertical"', description: '"horizontal" wraps items in a row.' },
            { name: "label, error, helperText, required, disabled", type: "—", description: "Same contract as every other field." },
          ]}
        />
      </PreviewSection>

      <PreviewSection title="Radio group" description="Mutually-exclusive options bound to one value.">
        <div className="max-w-sm">
          <RadioGroup
            label="Plan"
            options={[
              { label: "Free", value: "free", description: "Up to 3 users." },
              { label: "Pro", value: "pro", description: "Unlimited users, priority support." },
              { label: "Enterprise", value: "enterprise", description: "Custom contract and SSO." },
            ]}
            value={plan}
            onChange={setPlan}
            required
          />
        </div>
        <ComponentApi
          importCode={'import { RadioGroup } from "../components/fields";'}
          props={[
            { name: "options", type: "{ label, value, description?, disabled? }[]", description: "One row per option." },
            { name: "value / onChange", type: "T | null / (value: T) => void", description: "Controlled single selection." },
            { name: "name", type: "string", description: "Shared name for the underlying radio inputs — auto-generated when omitted." },
            { name: "orientation", type: '"vertical" | "horizontal"', default: '"vertical"', description: '"horizontal" wraps items in a row.' },
            { name: "label, error, helperText, required, disabled", type: "—", description: "Same contract as every other field." },
          ]}
        />
      </PreviewSection>

      <PreviewSection title="Switch" description="Boolean on/off toggle for a setting that takes effect immediately — unlike Checkbox, which usually gates a form submission.">
        <div className="flex max-w-sm flex-col gap-4">
          <Switch label="Email notifications" description="Get notified about new orders and status changes." checked={notifyEnabled} onChange={setNotifyEnabled} />
          <Switch label="Auto-renew" checked={autoRenew} onChange={setAutoRenew} size="sm" labelPosition="end" />
        </div>
        <ComponentApi
          importCode={'import { Switch } from "../components/fields";'}
          props={[
            { name: "checked / onChange", type: "boolean / (checked: boolean) => void", description: "Controlled toggle state." },
            { name: "label / description", type: "ReactNode", description: "Same layout as Checkbox." },
            { name: "labelPosition", type: '"start" | "end"', default: '"start"', description: "Put the label before or after the track." },
            { name: "size", type: '"sm" | "md"', default: '"md"', description: "Track/thumb size." },
            { name: "error, helperText, required, disabled", type: "—", description: "Same contract as every other field." },
          ]}
        />
      </PreviewSection>

      <PreviewSection title="Rating" description="Star rating — interactive when onChange is passed, half-star increments optional.">
        <div className="flex max-w-sm flex-col gap-4">
          <Rating label="Rate this supplier" value={rating} onChange={setRating} allowHalf showValue />
          <Rating label="Average review score (read-only)" value={4.2} allowHalf readOnly showValue size="sm" />
        </div>
        <ComponentApi
          importCode={'import { Rating } from "../components/fields";'}
          props={[
            { name: "value / onChange", type: "number / (value: number) => void", description: "Omit onChange (or pass readOnly) for a static display." },
            { name: "max", type: "number", default: "5", description: "Number of stars." },
            { name: "allowHalf", type: "boolean", default: "false", description: "Allow 0.5 increments." },
            { name: "size", type: '"sm" | "md" | "lg"', default: '"md"', description: "Star size." },
            { name: "showValue", type: "boolean", default: "false", description: 'Show "value/max" text next to the stars.' },
          ]}
        />
      </PreviewSection>

      <PreviewSection title="Slider & range slider" description="Native range input restyled to match the field system — single value or a min/max pair.">
        <div className="grid max-w-lg gap-6 sm:grid-cols-2">
          <Slider label="Reorder threshold" value={budget} onChange={setBudget} min={0} max={100} formatValue={(v) => `${v}%`} />
          <RangeSlider label="Price range" value={priceRange} onChange={setPriceRange} min={0} max={200} step={5} formatValue={(v) => `$${v}`} />
        </div>
        <ComponentApi
          importCode={'import { Slider, RangeSlider } from "../components/fields";'}
          props={[
            { name: "value / onChange", type: "number / (v) => void", description: "Slider. RangeSlider uses { min, max } instead." },
            { name: "min / max / step", type: "number", description: "Same as the native range input." },
            { name: "minGap", type: "number", default: "step", description: "RangeSlider only — smallest allowed gap between the two thumbs." },
            { name: "formatValue", type: "(value: number) => string", description: "Format the displayed value, e.g. currency or percent." },
            { name: "showValue", type: "boolean", default: "true", description: "Show the current value next to the label." },
            { name: "trackBackground", type: "string", description: "Slider only — raw CSS background for the track, e.g. a rainbow gradient for a color-picker slider (see SettingsDrawer's accent picker)." },
            { name: "showFill", type: "boolean", default: "true", description: "Slider only — set false to hide the brand-colored progress fill when trackBackground already encodes meaning." },
          ]}
        />
      </PreviewSection>

      <PreviewSection title="Tags input" description="Free-text chips — type a value and press Enter or comma to add it; Backspace on an empty field removes the last tag.">
        <div className="max-w-sm">
          <TagsInput label="Tags" value={tags} onChange={setTags} placeholder="Add a tag..." maxTags={8} />
        </div>
        <ComponentApi
          importCode={'import { TagsInput } from "../components/fields";'}
          props={[
            { name: "value / onChange", type: "string[] / (value: string[]) => void", description: "Controlled array of tag strings." },
            { name: "delimiters", type: "string[]", default: '[","]', description: "Extra keys (besides Enter) that commit the current text as a tag." },
            { name: "maxTags", type: "number", description: "Caps the number of tags; the input disables once reached." },
            { name: "preventDuplicates", type: "boolean", default: "true", description: "Reject a tag that already exists (case-insensitive)." },
            { name: "validate", type: "(tag: string) => boolean", description: "Only accept tags that pass this check." },
          ]}
        />
      </PreviewSection>

      <PreviewSection title="Color picker" description="Preset swatch grid plus a native color input + hex field for a custom value.">
        <div className="max-w-sm">
          <ColorPicker label="Label color" value={labelColor} onChange={setLabelColor} />
        </div>
        <ComponentApi
          importCode={'import { ColorPicker } from "../components/fields";'}
          props={[
            { name: "value / onChange", type: "string / (hex: string) => void", description: "Controlled hex color, e.g. \"#3b82f6\"." },
            { name: "swatches", type: "string[]", default: "DEFAULT_COLOR_SWATCHES", description: "Preset palette shown above the custom picker." },
            { name: "allowCustom", type: "boolean", default: "true", description: "Show the native color input + hex text field." },
          ]}
        />
      </PreviewSection>

      <PreviewSection title="File upload" description="Drag-and-drop dropzone with a file list, size/type validation, and image thumbnails — no upload logic baked in, wire onChange to your own upload call.">
        <div className="max-w-md">
          <FileUpload
            label="Attachments"
            files={attachments}
            onChange={setAttachments}
            accept="image/*,.pdf"
            maxSizeMB={5}
            maxFiles={5}
            helperText="Images or PDFs, up to 5 MB each."
          />
        </div>
        <ComponentApi
          importCode={'import { FileUpload } from "../components/fields";'}
          props={[
            { name: "files / onChange", type: "File[] / (files: File[]) => void", description: "Controlled — this component doesn't hold its own list." },
            { name: "accept", type: "string", description: 'Native accept attribute, e.g. "image/*,.pdf".' },
            { name: "multiple", type: "boolean", default: "true", description: "Allow more than one file." },
            { name: "maxSizeMB / maxFiles", type: "number", description: "Rejects oversized files / caps the total count." },
            { name: "onReject", type: "({ file, reason }[]) => void", description: "Called with files that failed validation instead of being silently dropped." },
            { name: "showPreview", type: "boolean", default: "true", description: "Show an image thumbnail for image files." },
          ]}
        />
      </PreviewSection>

      <PreviewSection title="Search bar" description={'"normal" is always open at a fixed width; "slide" collapses to an icon and expands on click/focus. Both support a light or dark tone for placement on colored surfaces.'}>
        <div className="flex flex-wrap items-center gap-6">
          <div>
            <p className="mb-2 text-xs font-medium text-slate-400">Normal</p>
            <SearchBar variant="normal" value={normalSearch} onChange={setNormalSearch} placeholder="Search orders..." />
          </div>
          <div>
            <p className="mb-2 text-xs font-medium text-slate-400">Slide (click the icon)</p>
            <SearchBar variant="slide" value={slideSearch} onChange={setSlideSearch} placeholder="Search..." />
          </div>
          <div className="rounded-lg bg-brand-600 p-3">
            <p className="mb-2 text-xs font-medium text-white/70">Dark tone (on colored surface)</p>
            <SearchBar variant="slide" tone="dark" value={slideSearch} onChange={setSlideSearch} placeholder="Search..." />
          </div>
        </div>
        <ComponentApi
          importCode={'import { SearchBar } from "../components/search/SearchBar";'}
          props={[
            { name: "variant", type: '"normal" | "slide"', default: '"normal"', description: "Always-open field vs. icon button that expands." },
            { name: "tone", type: '"light" | "dark"', default: '"light"', description: "Pick \"dark\" when placing it on a colored/dark surface." },
            { name: "width", type: "number | string", default: "280", description: "Fixed width (normal) or expanded width (slide)." },
            { name: "onClear", type: "() => void", description: "Called when the clear (X) button is pressed." },
          ]}
        />
      </PreviewSection>
    </PreviewPage>
  );
}
